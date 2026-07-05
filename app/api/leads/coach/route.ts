import { requireApiSession } from "@/lib/auth";
import { sql, logEvent } from "@/lib/db";
import { generateCoach } from "@/lib/ai";
import { COSTS, spendCredits, creditError } from "@/lib/credits";
import type { Enrichment } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await requireApiSession();
    const { leadId, refresh } = await req.json().catch(() => ({}));
    if (!leadId) return Response.json({ error: "leadId required" }, { status: 400 });

    const rows = await sql`select * from leads where id = ${leadId} and org_id = ${session.orgId}`;
    if (!rows.length) return Response.json({ error: "Lead not found" }, { status: 404 });
    const lead = rows[0];

    // Cached playbooks are free — you paid once, it's yours.
    if (lead.coach && !refresh) {
      return Response.json({ ok: true, coach: lead.coach, cached: true });
    }

    await spendCredits(session.orgId, COSTS.coach, "coach", `Sales-coach playbook — ${lead.name}`);

    const replyRows = await sql`select body from replies where lead_id = ${leadId} and org_id = ${session.orgId} order by created_at asc`;
    const { coach, engine } = await generateCoach(
      {
        id: lead.id, name: lead.name, title: lead.title, company: lead.company,
        email: lead.email, linkedin_url: lead.linkedin_url, location: lead.location,
        industry: lead.industry, intent_score: lead.intent_score, intent_label: lead.intent_label,
      },
      (lead.enrichment as Enrichment | null) ?? null,
      replyRows.map((r) => r.body as string)
    );

    await sql`update leads set coach = ${sql.json(coach as never)}, coach_at = now() where id = ${leadId}`;
    await logEvent(session.orgId, "coach_generated", `Closing playbook ready for ${lead.name}`, { leadId });

    return Response.json({ ok: true, coach, engine });
  } catch (err) {
    if (err instanceof Response) return err;
    const credit = creditError(err);
    if (credit) return credit;
    console.error(err);
    return Response.json({ error: "The coach hit a snag. Try again." }, { status: 500 });
  }
}
