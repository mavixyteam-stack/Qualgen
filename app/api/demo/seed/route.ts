import { requireApiSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { seedSampleWorkspace } from "@/lib/seed";

export const maxDuration = 60;

export async function POST() {
  try {
    const session = await requireApiSession();
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
