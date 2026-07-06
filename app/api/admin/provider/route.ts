import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { invalidateProviderCache } from "@/lib/providers";

const KNOWN = new Set(["groq", "anthropic", "pdl", "apollo", "resend", "ipinfo"]);

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const { provider, enabled } = await req.json().catch(() => ({}));
    if (!KNOWN.has(provider) || typeof enabled !== "boolean") {
      return Response.json({ error: "Provide a known provider and enabled boolean." }, { status: 400 });
    }
    await sql`insert into provider_settings (provider, enabled, updated_at)
      values (${provider}, ${enabled}, now())
      on conflict (provider) do update set enabled = ${enabled}, updated_at = now()`;
    invalidateProviderCache();
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Switch failed." }, { status: 500 });
  }
}
