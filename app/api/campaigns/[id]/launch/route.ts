import { requireApiSession } from "@/lib/auth";
import { sql, logEvent } from "@/lib/db";
import { emailLive } from "@/lib/email";
import { processDue } from "@/lib/process";

export const maxDuration = 60;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession();
    const { id } = await params;

    const campaigns = await sql`select * from campaigns where id = ${id} and org_id = ${session.orgId}`;
    if (!campaigns.length) return Response.json({ error: "Campaign not found" }, { status: 404 });
    if (campaigns[0].status !== "draft") {
      return Response.json({ error: "Campaign already launched." }, { status: 409 });
    }

    const drafts = await sql`select count(*)::int as n from messages where campaign_id = ${id} and status = 'draft'`;
    if (!drafts[0].n) {
      return Response.json({ error: "Generate sequences before launching." }, { status: 400 });
    }

    // Demo mode compresses the sequence so a live demo shows all three touches
    // within minutes; with real email connected, follow-ups wait days.
    const stepDelayMs = emailLive() ? 3 * 86_400_000 : 120_000;
    const now = Date.now();

    await sql`
      update messages set status = 'scheduled',
        scheduled_at = ${new Date(now)}::timestamptz + ((step - 1) * ${stepDelayMs} * interval '1 millisecond')
      where campaign_id = ${id} and status = 'draft'`;

    await sql`update campaigns set status = 'active', launched_at = now() where id = ${id}`;
    await logEvent(session.orgId, "campaign_launched", `Campaign "${campaigns[0].name}" launched`, {
      campaignId: id,
    });

    // Kick off the first sends immediately.
    await processDue(session.orgId);

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Launch failed." }, { status: 500 });
  }
}
