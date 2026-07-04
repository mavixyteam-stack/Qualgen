import { requireApiSession } from "@/lib/auth";
import { sql, logEvent } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await requireApiSession();
    const { name, goal, product } = await req.json().catch(() => ({}));
    if (!name?.trim() || !goal?.trim()) {
      return Response.json({ error: "Campaign name and goal are required." }, { status: 400 });
    }

    const userRows = await sql`select full_name from users where id = ${session.userId}`;
    const senderName = userRows[0]?.full_name ?? "Mavixy";

    const rows = await sql`insert into campaigns (org_id, name, goal, product, sender_name)
      values (${session.orgId}, ${name.trim()}, ${goal.trim()}, ${product?.trim() || null}, ${senderName})
      returning id`;

    await logEvent(session.orgId, "campaign_created", `Campaign "${name.trim()}" created`, {
      campaignId: rows[0].id,
    });
    return Response.json({ ok: true, id: rows[0].id });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Could not create campaign." }, { status: 500 });
  }
}
