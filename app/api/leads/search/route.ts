import { requireApiSession } from "@/lib/auth";
import { sql, logEvent } from "@/lib/db";
import { parseIcp } from "@/lib/ai";
import { apolloLive, searchApollo } from "@/lib/apollo";
import { pdlLive, searchPDL } from "@/lib/pdl";
import { generateSampleLeads } from "@/lib/demo";
import { COSTS, spendCredits, creditError } from "@/lib/credits";
import { orgMode, providerEnabled, recordCost } from "@/lib/providers";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await requireApiSession();
    const { prompt, count = 10 } = await req.json().catch(() => ({}));
    if (!prompt?.trim()) {
      return Response.json({ error: "Describe who you're looking for." }, { status: 400 });
    }
    const wanted = Math.max(1, Math.min(50, Number(count) || 10));

    const icp = await parseIcp(prompt.trim());

    // Sourcing waterfall. Demo workspaces always get the sample factory (zero
    // provider spend). Live workspaces get REAL data or an honest error —
    // dummy leads never enter a live workspace.
    const mode = await orgMode(session.orgId);
    let found: Awaited<ReturnType<typeof searchPDL>> = [];
    let source = "ai_search";
    if (mode === "live") {
      let providerError: string | null = null;
      try {
        if (pdlLive() && (await providerEnabled("pdl"))) {
          found = await searchPDL(icp, wanted);
          if (found.length) {
            source = "pdl";
            await recordCost(session.orgId, "pdl", "discover", found.length);
          }
        } else if (apolloLive() && (await providerEnabled("apollo"))) {
          found = await searchApollo(icp, wanted);
          if (found.length) source = "apollo";
        } else {
          providerError = "No lead-data provider is connected for live search.";
        }
      } catch (provErr) {
        console.error("lead provider failed:", provErr);
        providerError = "The lead-data provider didn't respond.";
      }
      if (!found.length) {
        return Response.json(
          {
            error: `${providerError ?? "No matching people found for that description."} This live workspace never gets sample data — try a broader description, import a CSV of real leads, or use the demo workspace to show the flow.`,
          },
          { status: 502 }
        );
      }
    } else {
      found = generateSampleLeads(icp, wanted, `${session.orgId}-${Date.now()}`);
      source = "ai_search";
    }

    // Deduplicate against existing org leads by email.
    const emails = found.map((l) => l.email).filter(Boolean) as string[];
    const existing = emails.length
      ? await sql`select email from leads where org_id = ${session.orgId} and email in ${sql(emails)}`
      : [];
    const existingSet = new Set(existing.map((r) => r.email));
    const fresh = found.filter((l) => !l.email || !existingSet.has(l.email));

    if (!fresh.length) {
      return Response.json({ error: "All matching leads are already in your database." }, { status: 409 });
    }

    // 1 credit per lead actually added.
    await spendCredits(
      session.orgId,
      fresh.length * COSTS.discover,
      "discover",
      `AI lead search — ${fresh.length} leads found`
    );

    const inserted = [];
    for (const l of fresh) {
      const rows = await sql`insert into leads (org_id, name, title, company, email, linkedin_url, location, industry, source)
        values (${session.orgId}, ${l.name}, ${l.title ?? null}, ${l.company ?? null}, ${l.email ?? null},
                ${l.linkedin_url ?? null}, ${l.location ?? null}, ${l.industry ?? null}, ${source})
        returning id`;
      inserted.push(rows[0].id);
    }

    await logEvent(session.orgId, "leads_discovered", `AI search found ${fresh.length} leads`);
    return Response.json({ ok: true, added: fresh.length, duplicates: found.length - fresh.length, icp });
  } catch (err) {
    if (err instanceof Response) return err;
    const credit = creditError(err);
    if (credit) return credit;
    console.error(err);
    return Response.json({ error: "Lead search failed. Try again." }, { status: 500 });
  }
}
