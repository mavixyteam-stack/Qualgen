import { requireApiSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { seedSampleWorkspace } from "@/lib/seed";

export const maxDuration = 60;

export async function POST() {
  try {
    const session = await requireApiSession();
    const [org] = await sql`select mode from orgs where id = ${session.orgId}`;
    if (org?.mode !== "demo") {
      return Response.json(
        { error: "Sample data is demo-workspace only — this live workspace stays 100% real." },
        { status: 403 }
      );
    }
    const users = await sql`select full_name from users where id = ${session.userId}`;
    const result = await seedSampleWorkspace(session.orgId, users[0]?.full_name ?? "Mavixy");
    if (!result.seeded) {
      return Response.json({ error: "Sample workspace was already loaded." }, { status: 409 });
    }
    return Response.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Could not load the sample workspace." }, { status: 500 });
  }
}
