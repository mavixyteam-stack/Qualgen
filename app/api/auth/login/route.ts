import { sql, ensureSchema } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  await ensureSchema();
  const rows = await sql`select id, org_id, password_hash from users where email = ${String(email).toLowerCase().trim()}`;
  if (!rows.length || !(await verifyPassword(password, rows[0].password_hash))) {
    return Response.json({ error: "Wrong email or password." }, { status: 401 });
  }

  await createSession(rows[0].id, rows[0].org_id);
  return Response.json({ ok: true });
}
