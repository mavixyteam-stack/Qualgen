import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";
import { LeadsView } from "@/components/leads/LeadsView";
import type { LeadRow } from "@/components/leads/lead-types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads — Mavixy" };

export default async function LeadsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  await ensureSchema();

  const rows = await sql`
    select id, name, title, company, email, linkedin_url, location, industry,
           source, status, intent_score, intent_label, enrichment, outcome, created_at
    from leads where org_id = ${session.orgId}
    order by created_at desc
    limit 1000`;

  const leads: LeadRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    title: r.title,
    company: r.company,
    email: r.email,
    linkedin_url: r.linkedin_url,
    location: r.location,
    industry: r.industry,
    source: r.source,
    status: r.status,
    intent_score: r.intent_score,
    intent_label: r.intent_label,
    enrichment: r.enrichment,
    outcome: r.outcome,
    created_at: r.created_at.toISOString(),
  }));

  return <LeadsView leads={leads} />;
}
