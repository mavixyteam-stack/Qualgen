import { randomBytes } from "crypto";
import { sql, ensureSchema } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { seedSampleWorkspace } from "@/lib/seed";

export const maxDuration = 60;

/**
 * Account provisioning: demo, live and admin logins.
 * Guarded by SESSION_SECRET. Idempotent AND self-healing — every run resets
 * each account's password and shows it, so you always walk away with working
 * credentials no matter the prior state. Nothing secret lives in this repo.
 *
 * Visit: /api/bootstrap?key=<your SESSION_SECRET>
 */

function pw(): string {
  return randomBytes(9).toString("base64").replace(/[/+=]/g, "x");
}

type Spec = {
  email: string;
  fullName: string;
  orgName: string;
  mode: "demo" | "live";
  role: "member" | "admin";
  credits: number;
};

async function provision(spec: Spec) {
  const password = pw();
  const hash = await hashPassword(password);

  const existing = await sql`select id, org_id from users where email = ${spec.email}`;

  if (existing.length) {
    // Reset password + role so the account is always usable and correct.
    await sql`update users set password_hash = ${hash}, role = ${spec.role}, full_name = ${spec.fullName}
      where id = ${existing[0].id}`;
    await sql`update orgs set mode = ${spec.mode} where id = ${existing[0].org_id}`;
    return { email: spec.email, password, status: "reset" as const };
  }

  // Fresh create. Seeding is best-effort — it must never block account creation.
  const orgRows = await sql`insert into orgs (name, credits, mode)
    values (${spec.orgName}, ${spec.credits}, ${spec.mode}) returning id`;
  const orgId = orgRows[0].id;
  await sql`insert into users (org_id, email, password_hash, full_name, role)
    values (${orgId}, ${spec.email}, ${hash}, ${spec.fullName}, ${spec.role})`;
  await sql`insert into credit_transactions (org_id, delta, balance_after, action, description)
    values (${orgId}, ${spec.credits}, ${spec.credits}, 'signup_bonus', 'Workspace provisioned')`;

  let seeded = false;
  if (spec.mode === "demo") {
    try {
      await seedSampleWorkspace(orgId, spec.fullName);
      seeded = true;
    } catch (err) {
      console.error("demo seed failed (account still created):", err);
    }
  }
  return { email: spec.email, password, status: "created" as const, seeded };
}

const SPECS: Spec[] = [
  { email: "demo@mavixy.ai", fullName: "Demo Pilot", orgName: "Mavixy Demo Studio", mode: "demo", role: "member", credits: 500 },
  { email: "founder@mavixy.ai", fullName: "Mavixy Founder", orgName: "Mavixy Live", mode: "live", role: "member", credits: 500 },
  { email: "admin@mavixy.ai", fullName: "Mavixy Admin", orgName: "Mavixy HQ", mode: "live", role: "admin", credits: 1000 },
];

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.SESSION_SECRET || key !== process.env.SESSION_SECRET) {
    return Response.json({ error: "Wrong key. Use your exact SESSION_SECRET value." }, { status: 403 });
  }

  try {
    await ensureSchema();
  } catch (err) {
    console.error("schema init failed", err);
    // Safe diagnostic: show the DB host it tried (never the password) so we
    // can tell instantly whether Vercel has the right DATABASE_URL.
    let host = "not set";
    try {
      host = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).host : "not set";
    } catch { host = "unparseable"; }
    return Response.json(
      {
        error: "Database not reachable.",
        tryingToConnectTo: host,
        checklist: [
          "Is DATABASE_URL in Vercel the Mumbai string (host should contain ap-south-1)?",
          "Did you REDEPLOY after saving the env var? (changes need a fresh deploy)",
          "Is the Supabase project fully active/healthy (not still provisioning)?",
        ],
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  // Provision each independently so one failure can't block the others.
  const accounts = [];
  const errors: string[] = [];
  for (const spec of SPECS) {
    try {
      accounts.push(await provision(spec));
    } catch (err) {
      console.error(`provision ${spec.email} failed`, err);
      errors.push(`${spec.email}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  return Response.json({
    ok: errors.length === 0,
    note: "SAVE THESE PASSWORDS NOW. Every run resets them, so re-run anytime you lose them.",
    logins: {
      "🎪 Demo (full flow, no spend)": "demo@mavixy.ai",
      "⚡ Live (real leads & sends)": "founder@mavixy.ai",
      "🛡️ Admin (control tower)": "admin@mavixy.ai",
    },
    accounts,
    errors: errors.length ? errors : undefined,
  });
}
