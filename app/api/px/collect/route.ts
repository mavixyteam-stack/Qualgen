import { sql, ensureSchema } from "@/lib/db";

// 1x1 transparent GIF — the visitor beacon.
const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

/**
 * Website-visitor pixel. Fired as an image beacon from the client's site:
 * company-level identification via reverse-IP when IPINFO_TOKEN is set.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("o");
    const page = (url.searchParams.get("p") || "/").slice(0, 200);
    if (orgId && /^[0-9a-f-]{36}$/i.test(orgId)) {
      await ensureSchema();
      const orgs = await sql`select 1 from orgs where id = ${orgId}`;
      if (orgs.length) {
        const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
        let company: string | null = null;
        if (ip && process.env.IPINFO_TOKEN) {
          try {
            const res = await fetch(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`, {
              signal: AbortSignal.timeout(3000),
            });
            if (res.ok) {
              const info = await res.json();
              // "AS15169 Google LLC" → "Google LLC"
              company = (info.company?.name as string) || (info.org as string)?.replace(/^AS\d+\s+/, "") || null;
            }
          } catch { /* resolution is best-effort */ }
        }
        // Cap per org so an unattended pixel can't flood the table.
        const [{ n }] = await sql`select count(*)::int as n from site_visits
          where org_id = ${orgId} and created_at > now() - interval '1 day'`;
        if (n < 500) {
          await sql`insert into site_visits (org_id, company, page, ip) values (${orgId}, ${company}, ${page}, ${ip})`;
        }
      }
    }
  } catch { /* never fail the beacon */ }
  return new Response(GIF, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, max-age=0" },
  });
}
