/**
 * Seeds a realistic sample workspace: leads, an already-completed campaign
 * with 10 days of send/open/reply history, intent scores, credit transactions
 * and an activity feed — so the dashboard is demo-ready in one click.
 */

import { sql, logEvent } from "./db";
import {
  enrichLeadDemo,
  generateSampleLeads,
  generateSequenceDemo,
  pickDemoReply,
  scoreReplyHeuristic,
  seededRng,
} from "./demo";
import { COSTS } from "./credits";

const DAY = 86_400_000;

export async function seedSampleWorkspace(orgId: string, seederName: string) {
  const org = await sql`select demo_seeded from orgs where id = ${orgId}`;
  if (!org.length || org[0].demo_seeded) return { seeded: false };

  const now = Date.now();
  let spent = 0;
  const tx: { delta: number; action: string; description: string; at: Date }[] = [];

  /* Leads -------------------------------------------------------------------- */
  const icpA = {
    industries: ["SaaS"], titles: ["Founder & CEO", "VP of Sales"],
    locations: ["Bangalore", "Mumbai"], companySize: "10–100 employees", keywords: [],
  };
  const icpB = {
    industries: ["Fintech", "E-commerce"], titles: ["Head of Marketing", "Founder & CEO"],
    locations: ["Delhi", "Pune"], companySize: "11–50 employees", keywords: [],
  };
  const sample = [
    ...generateSampleLeads(icpA, 9, orgId + "-a"),
    ...generateSampleLeads(icpB, 5, orgId + "-b"),
  ];

  const importedAt = new Date(now - 10 * DAY);
  const leadIds: string[] = [];
  for (const lead of sample) {
    const enrichment = enrichLeadDemo(lead);
    const rows = await sql`insert into leads
      (org_id, name, title, company, email, linkedin_url, location, industry, source, status, enrichment, enriched_at, created_at)
      values (${orgId}, ${lead.name}, ${lead.title ?? null}, ${lead.company ?? null}, ${lead.email ?? null}, ${lead.linkedin_url ?? null},
              ${lead.location ?? null}, ${lead.industry ?? null}, 'ai_search', 'enriched', ${sql.json(enrichment as never)},
              ${new Date(importedAt.getTime() + 3600_000)}, ${importedAt})
      returning id`;
    leadIds.push(rows[0].id);
  }
  spent += sample.length * COSTS.discover + sample.length * COSTS.enrich;
  tx.push(
    { delta: -sample.length * COSTS.discover, action: "discover", description: `AI lead search — ${sample.length} leads found`, at: importedAt },
    { delta: -sample.length * COSTS.enrich, action: "enrich", description: `AI enrichment — ${sample.length} leads`, at: new Date(importedAt.getTime() + 3600_000) },
  );

  /* Campaign with history ------------------------------------------------------ */
  const launchedAt = new Date(now - 9 * DAY);
  const campaignRows = await sql`insert into campaigns
    (org_id, name, goal, product, sender_name, status, created_at, launched_at)
    values (${orgId}, 'SaaS Founders — Book a Demo', 'Book a 15-minute demo', 'Mavixy', ${seederName},
            'completed', ${new Date(launchedAt.getTime() - 3600_000)}, ${launchedAt})
    returning id`;
  const campaignId = campaignRows[0].id;

  const campaignLeadIds = leadIds.slice(0, 10);
  let sends = 0;
  let scoredReplies = 0;

  for (let i = 0; i < campaignLeadIds.length; i++) {
    const leadId = campaignLeadIds[i];
    const lead = sample[i];
    const enrichment = enrichLeadDemo(lead);
    const steps = generateSequenceDemo(lead, enrichment, {
      goal: "Book a 15-minute demo", product: "Mavixy", senderName: seederName,
    });
    const leadRng = seededRng(orgId + leadId);
    // Replies concentrated after step 1 or 2; ~half the leads reply.
    const replyAfterStep = leadRng() < 0.5 ? (leadRng() < 0.6 ? 1 : 2) : 0;

    for (const step of steps) {
      const sentAt = new Date(launchedAt.getTime() + (step.step - 1) * 3 * DAY + leadRng() * 6 * 3600_000);
      const skipped = replyAfterStep > 0 && step.step > replyAfterStep;
      const opened = !skipped && leadRng() < 0.68;
      const replied = !skipped && step.step === replyAfterStep;
      const openedAt = opened ? new Date(sentAt.getTime() + leadRng() * 8 * 3600_000) : null;
      const repliedAt = replied ? new Date((openedAt ?? sentAt).getTime() + leadRng() * 10 * 3600_000) : null;

      const rows = await sql`insert into messages
        (org_id, campaign_id, lead_id, step, subject, body, status, sent_at, opened_at, replied_at, created_at)
        values (${orgId}, ${campaignId}, ${leadId}, ${step.step}, ${step.subject}, ${step.body},
                ${skipped ? "skipped" : "sent"}, ${skipped ? null : sentAt}, ${openedAt}, ${repliedAt},
                ${new Date(launchedAt.getTime() - 1800_000)})
        returning id`;
      const messageId = rows[0].id;
      if (skipped) continue;

      sends++;
      await insertEvent(orgId, campaignId, leadId, "email_sent", `Step ${step.step} email sent to ${lead.name}`, sentAt);
      if (openedAt) {
        await insertEvent(orgId, campaignId, leadId, "email_opened", `${lead.name} opened step ${step.step} email`, openedAt);
      }
      if (repliedAt) {
        const body = pickDemoReply(messageId);
        const result = scoreReplyHeuristic(body);
        scoredReplies++;
        await sql`insert into replies (org_id, campaign_id, lead_id, message_id, body, intent_score, intent_label, reasoning, created_at)
          values (${orgId}, ${campaignId}, ${leadId}, ${messageId}, ${body}, ${result.score}, ${result.label}, ${result.reasoning}, ${repliedAt})`;
        await sql`update leads set intent_score = ${result.score}, intent_label = ${result.label}, status = 'replied' where id = ${leadId}`;
        await insertEvent(orgId, campaignId, leadId, "reply_received", `${lead.name} replied`, repliedAt);
        await insertEvent(
          orgId, campaignId, leadId, "intent_scored",
          `${lead.name} scored ${result.score}/100 — ${result.label === "ready" ? "Sales Ready" : result.label}`,
          new Date(repliedAt.getTime() + 60_000)
        );
      }
    }
    await sql`update leads set status = 'contacted' where id = ${leadId} and status = 'enriched'`;
  }

  const personalizeSpend = campaignLeadIds.length * COSTS.personalize;
  spent += personalizeSpend + sends * COSTS.email_send + scoredReplies * COSTS.intent_score;
  tx.push(
    { delta: -personalizeSpend, action: "personalize", description: `AI sequences — ${campaignLeadIds.length} leads (SaaS Founders campaign)`, at: new Date(launchedAt.getTime() - 3600_000) },
    { delta: -sends * COSTS.email_send, action: "email_send", description: `${sends} campaign emails sent`, at: launchedAt },
    { delta: -scoredReplies * COSTS.intent_score, action: "intent_score", description: `${scoredReplies} replies scored for intent`, at: new Date(launchedAt.getTime() + 2 * DAY) },
  );

  /* Credits & transactions ------------------------------------------------------ */
  let balance = 500;
  for (const t of tx) {
    balance += t.delta;
    await sql`insert into credit_transactions (org_id, delta, balance_after, action, description, created_at)
      values (${orgId}, ${t.delta}, ${balance}, ${t.action}, ${t.description}, ${t.at})`;
  }
  // A few recent "buyers on your site" so the visitor tile is alive immediately.
  const visitCompanies = [
    ["Acme Corp", "/pricing"], ["NorthPeak Labs", "/product"], ["BlueOrbit", "/case-studies"], ["Zenith Retail", "/pricing"],
  ] as const;
  for (let i = 0; i < visitCompanies.length; i++) {
    await sql`insert into site_visits (org_id, company, page, created_at)
      values (${orgId}, ${visitCompanies[i][0]}, ${visitCompanies[i][1]}, ${new Date(now - (i + 1) * 2 * 3600_000)})`;
  }

  await sql`update orgs set credits = ${balance}, demo_seeded = true where id = ${orgId}`;
  await logEvent(orgId, "workspace_seeded", "Sample workspace loaded — explore, then run your own campaign");

  return { seeded: true, leads: sample.length, spent, balance };
}

async function insertEvent(
  orgId: string, campaignId: string, leadId: string,
  type: string, description: string, at: Date
) {
  await sql`insert into events (org_id, campaign_id, lead_id, type, description, created_at)
    values (${orgId}, ${campaignId}, ${leadId}, ${type}, ${description}, ${at})`;
}
