import { requireApiSession } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await requireApiSession();
    const { ids } = await req.json().catch(() => ({}));
    if (!Array.isArray(ids) || !ids.length) {
      return Response.json({ error: "No leads selected." }, { status: 400 });
    }
    await sql`delete from leads where org_id = ${session.orgId} and id in ${sql(ids)}`;
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Delete failed." }, { status: 500 });
  }
}
