import { sql, ensureSchema, logEvent } from "@/lib/db";

// A 1x1 transparent GIF — the classic open-tracking pixel.
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      await ensureSchema();
      const rows = await sql`
        update messages set opened_at = now()
        where id = ${id} and status = 'sent' and opened_at is null
        returning org_id, campaign_id, lead_id, step`;
      if (rows.length) {
        const lead = await sql`select name from leads where id = ${rows[0].lead_id}`;
        await logEvent(rows[0].org_id, "email_opened", `${lead[0]?.name ?? "Lead"} opened step ${rows[0].step} email`, {
          campaignId: rows[0].campaign_id,
          leadId: rows[0].lead_id,
        });
      }
    }
  } catch {
    // never fail the pixel
  }
  return new Response(GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
