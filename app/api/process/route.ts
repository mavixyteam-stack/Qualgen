import { requireApiSession } from "@/lib/auth";
import { processDue } from "@/lib/process";

export const maxDuration = 60;

export async function POST() {
  try {
    const session = await requireApiSession();
    const result = await processDue(session.orgId);
    return Response.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("process tick failed", err);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
}
