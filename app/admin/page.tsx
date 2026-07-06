import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";
import { PROVIDER_UNIT_COST } from "@/lib/providers";
import { AdminView, type AdminData } from "@/components/admin/AdminView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Control tower — Mavixy AI" };

const CREDIT_PRICE_INR = 1.3;

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/app");
  await ensureSchema();

  const [
    [platform],
    orgs,
    providerUsage,
    switches,
    [consumed],
    [cogs],
    recentTx,
  ] = await Promise.all([
    sql`select
          (select count(*)::int from orgs) as orgs,
          (select count(*)::int from users) as users,
          (select count(*)::int from leads) as leads,
          (select count(*)::int from campaigns) as campaigns,
          (select count(*)::int from messages where status = 'sent') as sent,
          (select count(*)::int from replies) as replies,
          (select coalesce(sum(credits),0)::int from orgs) as outstanding`,
    sql`select o.id, o.name, o.mode, o.credits, o.created_at,
          (select count(*)::int from users u where u.org_id = o.id) as members,
          (select count(*)::int from leads l where l.org_id = o.id) as leads,
          (select count(*)::int from campaigns c where c.org_id = o.id) as campaigns,
          (select max(e.created_at) from events e where e.org_id = o.id) as last_active,
          (select coalesce(sum(-t.delta),0)::int from credit_transactions t where t.org_id = o.id and t.delta < 0) as consumed
        from orgs o order by o.created_at desc limit 50`,
    sql`select provider,
          sum(units)::int as units,
          sum(cost_inr)::numeric as cost,
          sum(units) filter (where created_at > date_trunc('month', now()))::int as units_month,
          max(created_at) as last_used
        from provider_costs group by provider`,
    sql`select provider, enabled from provider_settings`,
    sql`select coalesce(sum(-delta),0)::int as total from credit_transactions where delta < 0 and action not in ('reserve')`,
    sql`select coalesce(sum(cost_inr),0)::numeric as total from provider_costs`,
    sql`select t.delta, t.action, t.description, t.created_at, o.name as org_name
        from credit_transactions t join orgs o on o.id = t.org_id
        order by t.created_at desc limit 14`,
  ]);

  const switchMap = Object.fromEntries(switches.map((s) => [s.provider, s.enabled]));
  const usageMap = new Map(providerUsage.map((p) => [p.provider, p]));

  const PROVIDERS: AdminData["providers"] = [
    { key: "groq", name: "Groq (AI)", configured: !!process.env.GROQ_API_KEY, quota: null },
    { key: "anthropic", name: "Anthropic Claude", configured: !!process.env.ANTHROPIC_API_KEY, quota: null },
    { key: "pdl", name: "People Data Labs", configured: !!process.env.PDL_API_KEY, quota: 100 },
    { key: "resend", name: "Resend (email)", configured: !!process.env.RESEND_API_KEY, quota: 3000 },
    { key: "apollo", name: "Apollo.io", configured: !!process.env.APOLLO_API_KEY, quota: null },
    { key: "ipinfo", name: "IPinfo (pixel)", configured: !!process.env.IPINFO_TOKEN, quota: null },
  ].map((p) => {
    const u = usageMap.get(p.key);
    return {
      ...p,
      enabled: switchMap[p.key] ?? true,
      unitCost: PROVIDER_UNIT_COST[p.key] ?? 0,
      units: u?.units ?? 0,
      unitsMonth: u?.units_month ?? 0,
      costInr: Number(u?.cost ?? 0),
      lastUsed: u?.last_used ? new Date(u.last_used).toISOString() : null,
    };
  });

  const revenueEq = consumed.total * CREDIT_PRICE_INR;
  const totalCogs = Number(cogs.total);

  const data: AdminData = {
    stats: {
      orgs: platform.orgs,
      users: platform.users,
      leads: platform.leads,
      campaigns: platform.campaigns,
      sent: platform.sent,
      replies: platform.replies,
      outstandingCredits: platform.outstanding,
      consumedCredits: consumed.total,
      revenueEq: Math.round(revenueEq),
      cogs: Math.round(totalCogs),
      margin: revenueEq > 0 ? Math.round(((revenueEq - totalCogs) / revenueEq) * 100) : 100,
    },
    providers: PROVIDERS,
    orgs: orgs.map((o) => ({
      id: o.id,
      name: o.name,
      mode: o.mode === "demo" ? "demo" : "live",
      credits: o.credits,
      members: o.members,
      leads: o.leads,
      campaigns: o.campaigns,
      consumed: o.consumed,
      lastActive: o.last_active ? new Date(o.last_active).toISOString() : null,
      createdAt: o.created_at.toISOString(),
    })),
    transactions: recentTx.map((t) => ({
      orgName: t.org_name,
      delta: t.delta,
      action: t.action,
      description: t.description,
      at: t.created_at.toISOString(),
    })),
  };

  return <AdminView data={data} />;
}
