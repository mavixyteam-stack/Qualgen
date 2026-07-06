import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { orgId, mode } = await req.json().catch(() => ({}));
    if (!orgId || !["demo", "live"].includes(mode)) {
      return Response.json({ error: "Provide orgId and mode (demo|live)." }, { status: 400 });
    }
    const rows = await sql`update orgs set mode = ${mode} where id = ${orgId} returning name`;
    if (!rows.length) return Response.json({ error: "Org not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Mode change failed." }, { status: 500 });
  }
}
