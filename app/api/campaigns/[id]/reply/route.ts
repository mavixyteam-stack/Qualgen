import { requireApiSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { recordReply } from "@/lib/process";
import { creditError } from "@/lib/credits";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession();
    const { id } = await params;
    const { leadId, body } = await req.json().catch(() => ({}));
    if (!leadId || !body?.trim()) {
      return Response.json({ error: "Lead and reply text are required." }, { status: 400 });
    }

    const campaigns = await sql`select id from campaigns where id = ${id} and org_id = ${session.orgId}`;
    if (!campaigns.length) return Response.json({ error: "Campaign not found" }, { status: 404 });

    const lastMessage = await sql`select id from messages
      where campaign_id = ${id} and lead_id = ${leadId} and status = 'sent'
      order by step desc limit 1`;

    const reply = await recordReply(session.orgId, {
      leadId,
      campaignId: id,
      messageId: lastMessage[0]?.id ?? null,
      body: body.trim(),
    });
    return Response.json({ ok: true, reply });
  } catch (err) {
    if (err instanceof Response) return err;
    const credit = creditError(err);
    if (credit) return credit;
    console.error(err);
    return Response.json({ error: "Could not log the reply." }, { status: 500 });
  }
}
