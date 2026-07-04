/**
 * AI layer. When ANTHROPIC_API_KEY is set, Claude powers ICP parsing,
 * enrichment, sequence generation and intent scoring. Without a key (or if a
 * call fails), the deterministic demo engine takes over so the product always
 * works — demos never break.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Enrichment, Icp, IntentResult, LeadInput, SequenceStep } from "./types";
import {
  enrichLeadDemo,
  generateSequenceDemo,
  intentLabel,
  parseIcpHeuristic,
  scoreReplyHeuristic,
} from "./demo";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export function aiLive(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

async function claudeJson<T>(system: string, user: string, maxTokens = 1200): Promise<T> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: `${system}\nRespond with ONLY a valid JSON object — no markdown fences, no commentary.`,
    messages: [{ role: "user", content: user }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");
  return JSON.parse(match[0]) as T;
}

/* -------------------------------- ICP parse -------------------------------- */

export async function parseIcp(prompt: string): Promise<Icp> {
  if (!aiLive()) return parseIcpHeuristic(prompt);
  try {
    const parsed = await claudeJson<Icp>(
      `You parse ideal-customer-profile descriptions into structured search filters for a B2B lead database.
Return JSON: {"industries": string[], "titles": string[], "locations": string[], "companySize": string, "keywords": string[]}.
Use common industry names (SaaS, Fintech, E-commerce, Healthcare, EdTech, Real Estate, Agency, Logistics) and common job titles.`,
      prompt,
      500
    );
    if (!parsed.industries?.length || !parsed.titles?.length) throw new Error("empty parse");
    parsed.locations = parsed.locations?.length ? parsed.locations : ["Bangalore"];
    parsed.companySize = parsed.companySize || "11–50 employees";
    parsed.keywords = parsed.keywords || [];
    return parsed;
  } catch {
    return parseIcpHeuristic(prompt);
  }
}

/* -------------------------------- Enrichment ------------------------------- */

export async function enrichLead(lead: LeadInput & { id?: string }): Promise<{ enrichment: Enrichment; engine: "ai" | "demo" }> {
  if (aiLive()) {
    try {
      const enrichment = await claudeJson<Enrichment>(
        `You are the prospect-intelligence engine of Mavixy, an AI sales qualification platform.
Given a B2B lead's basic details, produce a plausible, useful prospect intelligence card a salesperson can act on.
Be specific and grounded in the lead's role, company and industry. Do not invent verifiable facts like exact funding amounts — frame signals as "likely" patterns for this profile.
Return JSON: {"summary": string (2-3 sentences), "painPoints": string[2], "hooks": string[2] (personalization angles), "bestChannel": string, "style": string (communication style guidance), "signals": string[3] (likely buying/activity signals), "readiness": number 0-100}`,
        JSON.stringify({
          name: lead.name,
          title: lead.title,
          company: lead.company,
          industry: lead.industry,
          location: lead.location,
          linkedin: lead.linkedin_url,
        })
      );
      if (enrichment.summary && enrichment.painPoints?.length) {
        enrichment.readiness = Math.max(0, Math.min(100, Math.round(enrichment.readiness ?? 40)));
        return { enrichment, engine: "ai" };
      }
    } catch {
      // fall through to demo engine
    }
  }
  return { enrichment: enrichLeadDemo(lead), engine: "demo" };
}

/* --------------------------- Sequence generation --------------------------- */

export async function generateSequence(
  lead: LeadInput & { id?: string },
  enrichment: Enrichment | null,
  campaign: { goal: string; product?: string | null; senderName?: string | null }
): Promise<{ steps: SequenceStep[]; engine: "ai" | "demo" }> {
  if (aiLive()) {
    try {
      const out = await claudeJson<{ steps: SequenceStep[] }>(
        `You write cold-email sequences for Mavixy, an AI lead qualification & outreach platform.
Write a 3-touch email sequence to this prospect. Rules:
- Reference the prospect's real context (role, company, signals from the intelligence card) — never generic filler.
- Short paragraphs, conversational, no buzzwords, no "I hope this finds you well".
- Touch 1: personalized opener referencing a signal. Touch 2: value follow-up with one concrete number or outcome. Touch 3: polite, short breakup email.
- Each body 80-140 words, plain text, greet with first name, sign off with the sender name.
Return JSON: {"steps": [{"step": 1, "subject": string, "body": string}, {"step": 2, ...}, {"step": 3, ...}]}`,
        JSON.stringify({ lead, intelligence: enrichment, campaignGoal: campaign.goal, product: campaign.product || "Mavixy", senderName: campaign.senderName || "the team" }),
        2000
      );
      if (out.steps?.length === 3 && out.steps.every((s) => s.subject && s.body)) {
        return { steps: out.steps, engine: "ai" };
      }
    } catch {
      // fall through
    }
  }
  return { steps: generateSequenceDemo(lead, enrichment, campaign), engine: "demo" };
}

/* ------------------------------ Intent scoring ----------------------------- */

export async function scoreReply(text: string): Promise<{ result: IntentResult; engine: "ai" | "demo" }> {
  if (aiLive()) {
    try {
      const out = await claudeJson<{ score: number; reasoning: string }>(
        `You are the intent-qualification engine of a sales platform. Score the buying intent of this email reply from a prospect.
Scale: 0-30 cold (negative/no interest), 31-60 warm (mild curiosity or timing objection), 61-85 hot (active interest, questions about product/pricing), 86-100 sales ready (explicit ask for call/demo/purchase).
Return JSON: {"score": number, "reasoning": string (one sentence citing the signals)}`,
        text,
        300
      );
      const score = Math.max(0, Math.min(100, Math.round(out.score)));
      return {
        result: { score, label: intentLabel(score), reasoning: out.reasoning || "" },
        engine: "ai",
      };
    } catch {
      // fall through
    }
  }
  return { result: scoreReplyHeuristic(text), engine: "demo" };
}
