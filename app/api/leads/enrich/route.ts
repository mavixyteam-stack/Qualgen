import { requireApiSession } from "@/lib/auth";
import { sql, logEvent } from "@/lib/db";
import { enrichLead } from "@/lib/ai";
import { COSTS, spendCredits, creditError } from "@/lib/credits";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await requireApiSession();
    const { leadId } = await req.json().catch(() => ({}));
    if (!leadId) return Response.json({ error: "leadId required" }, { status: 400 });

    const rows = await sql`select * from leads where id = ${leadId} and org_id = ${session.orgId}`;
    if (!rows.length) return Response.json({ error: "Lead not found" }, { status: 404 });
    const lead = rows[0];

    if (lead.enrichment) {
      return Response.json({ ok: true, enrichment: lead.enrichment, alreadyEnriched: true });
    }

    await spendCredits(session.orgId, COSTS.enrich, "enrich", `AI enrichment — ${lead.name}`);

    const { enrichment, engine } = await enrichLead({
      id: lead.id,
      name: lead.name,
      title: lead.title,
      company: lead.company,
      email: lead.email,
      linkedin_url: lead.linkedin_url,
      location: lead.location,
      industry: lead.industry,
    });

    await sql`update leads set enrichment = ${sql.json(enrichment as never)}, enriched_at = now(),
      status = case when status = 'new' then 'enriched' else status end
      where id = ${lead.id}`;
    await logEvent(session.orgId, "lead_enriched", `${lead.name} enriched with prospect intelligence`, {
      leadId: lead.id,
    });

    return Response.json({ ok: true, enrichment, engine });
  } catch (err) {
    if (err instanceof Response) return err;
    const credit = creditError(err);
    if (credit) return credit;
    console.error(err);
    return Response.json({ error: "Enrichment failed. Try again." }, { status: 500 });
  }
}
