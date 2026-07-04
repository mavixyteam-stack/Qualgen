import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";
import { CampaignWizard } from "@/components/campaigns/CampaignWizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "New campaign — Mavixy" };

export default async function NewCampaignPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  await ensureSchema();

  const rows = await sql`
    select id, name, title, company, email, (enrichment is not null) as enriched
    from leads
    where org_id = ${session.orgId} and email is not null
    order by created_at desc
    limit 500`;

  const leads = rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    title: r.title as string | null,
    company: r.company as string | null,
    email: r.email as string,
    enriched: r.enriched as boolean,
  }));

  return <CampaignWizard leads={leads} />;
}
