import { requireApiSession } from "@/lib/auth";
import { addCredits } from "@/lib/credits";

export async function POST() {
  try {
    const session = await requireApiSession();
    // POC only — real credit purchases arrive with Stripe in the MVP phase.
    const balance = await addCredits(session.orgId, 500, "poc_topup", "POC top-up — 500 demo credits");
    return Response.json({ ok: true, balance });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Top-up failed." }, { status: 500 });
  }
}
