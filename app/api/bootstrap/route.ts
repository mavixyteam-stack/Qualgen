import { randomBytes } from "crypto";
import { sql, ensureSchema } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { seedSampleWorkspace } from "@/lib/seed";

export const maxDuration = 60;

/**
 * One-time account provisioning: demo, live and admin logins.
 * Guarded by SESSION_SECRET; passwords are generated fresh and shown ONCE in
 * the response — nothing secret lives in this (public) repository.
 *
 * Visit: /api/bootstrap?key=<your SESSION_SECRET>
 */

function pw(): string {
  return randomBytes(9).toString("base64").replace(/[/+=]/g, "x");
}

async function createAccount(opts: {
  email: string;
  fullName: string;
  orgName: string;
  mode: "demo" | "live";
  role: "member" | "admin";
  credits: number;
}): Promise<{ email: string; password?: string; status: "created" | "already exists" }> {
  const existing = await sql`select 1 from users where email = ${opts.email}`;
  if (existing.length) return { email: opts.email, status: "already exists" };

  const password = pw();
  const hash = await hashPassword(password);
  const orgRows = await sql`insert into orgs (name, credits, mode)
    values (${opts.orgName}, ${opts.credits}, ${opts.mode}) returning id`;
  await sql`insert into users (org_id, email, password_hash, full_name, role)
    values (${orgRows[0].id}, ${opts.email}, ${hash}, ${opts.fullName}, ${opts.role})`;
  await sql`insert into credit_transactions (org_id, delta, balance_after, action, description)
    values (${orgRows[0].id}, ${opts.credits}, ${opts.credits}, 'signup_bonus', 'Workspace provisioned')`;

  if (opts.mode === "demo") {
    await seedSampleWorkspace(orgRows[0].id, opts.fullName);
  }
  return { email: opts.email, password, status: "created" };
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.SESSION_SECRET || key !== process.env.SESSION_SECRET) {
    return Response.json({ error: "Nope." }, { status: 403 });
  }
  await ensureSchema();

  const results = [];
  results.push(await createAccount({
    email: "demo@mavixy.ai", fullName: "Demo Pilot", orgName: "Mavixy Demo Studio",
    mode: "demo", role: "member", credits: 500,
  }));
  results.push(await createAccount({
    email: "founder@mavixy.ai", fullName: "Mavixy Founder", orgName: "Mavixy Live",
    mode: "live", role: "member", credits: 500,
  }));
  results.push(await createAccount({
    email: "admin@mavixy.ai", fullName: "Mavixy Admin", orgName: "Mavixy HQ",
    mode: "live", role: "admin", credits: 1000,
  }));

  return Response.json({
    ok: true,
    note: "SAVE THESE PASSWORDS NOW — they are shown only this once. Accounts that already existed keep their old password.",
    accounts: results,
  });
}
