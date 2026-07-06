import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { addCredits } from "@/lib/credits";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { orgId, amount } = await req.json().catch(() => ({}));
    const n = Math.round(Number(amount));
    if (!orgId || !Number.isFinite(n) || n === 0 || Math.abs(n) > 100000) {
      return Response.json({ error: "Provide orgId and a sane amount." }, { status: 400 });
    }
    const org = await sql`select name from orgs where id = ${orgId}`;
    if (!org.length) return Response.json({ error: "Org not found" }, { status: 404 });

    const balance = await addCredits(
      orgId, n, "admin_grant",
      `${n > 0 ? "Granted" : "Adjusted"} by Mavixy admin`
    );
    return Response.json({ ok: true, balance });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Grant failed." }, { status: 500 });
  }
}
