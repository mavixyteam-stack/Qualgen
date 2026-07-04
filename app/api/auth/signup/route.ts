import { sql, ensureSchema } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { SIGNUP_CREDITS } from "@/lib/credits";

export async function POST(req: Request) {
  const { fullName, orgName, email, password } = await req.json().catch(() => ({}));

  if (!fullName?.trim() || !orgName?.trim() || !email?.trim() || !password) {
    return Response.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  await ensureSchema();

  const existing = await sql`select 1 from users where email = ${email.toLowerCase().trim()}`;
  if (existing.length) {
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const orgRows = await sql`insert into orgs (name, credits) values (${orgName.trim()}, ${SIGNUP_CREDITS}) returning id`;
  const orgId = orgRows[0].id;
  const userRows = await sql`insert into users (org_id, email, password_hash, full_name)
    values (${orgId}, ${email.toLowerCase().trim()}, ${passwordHash}, ${fullName.trim()})
    returning id`;

  await sql`insert into credit_transactions (org_id, delta, balance_after, action, description)
    values (${orgId}, ${SIGNUP_CREDITS}, ${SIGNUP_CREDITS}, 'signup_bonus', 'Welcome bonus — 500 free credits')`;

  await createSession(userRows[0].id, orgId);
  return Response.json({ ok: true });
}
