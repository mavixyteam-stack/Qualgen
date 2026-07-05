import { requireApiSession } from "@/lib/auth";
import { sql, logEvent } from "@/lib/db";

const OUTCOMES = new Set(["won", "lost", "nurture"]);

export async function POST(req: Request) {
  try {
    const session = await requireApiSession();
    const { leadId, outcome } = await req.json().catch(() => ({}));
    if (!leadId || (outcome !== null && !OUTCOMES.has(outcome))) {
      return Response.json({ error: "Pick won, lost or nurture." }, { status: 400 });
    }
    const rows = await sql`update leads set outcome = ${outcome}
      where id = ${leadId} and org_id = ${session.orgId}
      returning name`;
    if (!rows.length) return Response.json({ error: "Lead not found" }, { status: 404 });

    if (outcome) {
      const labels: Record<string, string> = {
        won: `🎉 Deal won — ${rows[0].name} is a customer now`,
        lost: `${rows[0].name} marked lost — the AI takes notes for next time`,
        nurture: `${rows[0].name} moved to nurture — we'll keep them warm`,
      };
      await logEvent(session.orgId, `deal_${outcome}`, labels[outcome], { leadId });
    }
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Could not save the outcome." }, { status: 500 });
  }
}
