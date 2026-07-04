import { requireApiSession } from "@/lib/auth";
import { sql, logEvent } from "@/lib/db";
import type { LeadInput } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const session = await requireApiSession();
    const { leads } = (await req.json().catch(() => ({}))) as { leads?: LeadInput[] };
    if (!Array.isArray(leads) || !leads.length) {
      return Response.json({ error: "No leads to import." }, { status: 400 });
    }
    if (leads.length > 500) {
      return Response.json({ error: "Import up to 500 leads at a time." }, { status: 400 });
    }

    const clean = leads
      .map((l) => ({
        name: String(l.name ?? "").trim(),
        title: l.title ? String(l.title).trim() : null,
        company: l.company ? String(l.company).trim() : null,
        email: l.email ? String(l.email).trim().toLowerCase() : null,
        linkedin_url: l.linkedin_url ? String(l.linkedin_url).trim() : null,
        location: l.location ? String(l.location).trim() : null,
        industry: l.industry ? String(l.industry).trim() : null,
      }))
      .filter((l) => l.name && (!l.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email)));

    if (!clean.length) {
      return Response.json({ error: "No valid rows found — every lead needs at least a name, and emails must be valid." }, { status: 400 });
    }

    const emails = clean.map((l) => l.email).filter(Boolean) as string[];
    const existing = emails.length
      ? await sql`select email from leads where org_id = ${session.orgId} and email in ${sql(emails)}`
      : [];
    const existingSet = new Set(existing.map((r) => r.email));
    const seen = new Set<string>();
    const fresh = clean.filter((l) => {
      if (!l.email) return true;
      if (existingSet.has(l.email) || seen.has(l.email)) return false;
      seen.add(l.email);
      return true;
    });

    for (const l of fresh) {
      await sql`insert into leads (org_id, name, title, company, email, linkedin_url, location, industry, source)
        values (${session.orgId}, ${l.name}, ${l.title}, ${l.company}, ${l.email}, ${l.linkedin_url}, ${l.location}, ${l.industry}, 'csv')`;
    }

    await logEvent(session.orgId, "leads_imported", `Imported ${fresh.length} leads from CSV`);
    return Response.json({
      ok: true,
      added: fresh.length,
      skipped: leads.length - fresh.length,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return Response.json({ error: "Import failed. Try again." }, { status: 500 });
  }
}
