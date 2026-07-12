import { sql, ensureSchema } from "@/lib/db";

/** Safe deployment diagnostics — no secrets, just enough to debug wiring. */
export async function GET() {
  let db: { ok: boolean; host: string; users?: number; admins?: number; error?: string } = {
    ok: false,
    host: "not set",
  };
  try {
    db.host = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).host : "not set";
  } catch { db.host = "unparseable"; }

  try {
    await ensureSchema();
    const [row] = await sql`select
      (select count(*)::int from users) as users,
      (select count(*)::int from users where role = 'admin') as admins`;
    db = { ...db, ok: true, users: row.users, admins: row.admins };
  } catch (err) {
    db.error = err instanceof Error ? err.message : String(err);
  }

  return Response.json({
    app: "mavixy-ai",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "unknown",
    region: process.env.VERCEL_REGION ?? "unknown",
    hasAdminRoutes: true,
    db,
  });
}
