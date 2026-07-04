import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";
import { EmptyState, StatusChip } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campaigns — Mavixy" };

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  await ensureSchema();

  const campaigns = await sql`
    select c.*,
      (select count(distinct m.lead_id) from messages m where m.campaign_id = c.id)::int as lead_count,
      (select count(*) from messages m where m.campaign_id = c.id and m.status = 'sent')::int as sent,
      (select count(*) from messages m where m.campaign_id = c.id and m.opened_at is not null)::int as opened,
      (select count(*) from replies r where r.campaign_id = c.id)::int as replies
    from campaigns c
    where c.org_id = ${session.orgId}
    order by c.created_at desc`;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-ink-muted">
            AI-personalized sequences that send, track and qualify automatically
          </p>
        </div>
        <Link href="/app/campaigns/new" className="btn-primary btn-md">🚀 New campaign</Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            emoji="🚀"
            title="No campaigns yet"
            body="Pick your leads, let AI write a personalized 3-touch sequence for each one, and launch."
          >
            <Link href="/app/campaigns/new" className="btn-primary btn-md">Create your first campaign</Link>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {campaigns.map((c) => {
            const openRate = c.sent ? Math.round((c.opened / c.sent) * 100) : 0;
            return (
              <Link
                key={c.id}
                href={`/app/campaigns/${c.id}`}
                className="card flex flex-wrap items-center justify-between gap-5 p-6 transition hover:shadow-lift"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="truncate text-lg font-bold tracking-tight">{c.name}</h2>
                    <StatusChip status={c.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">Goal: {c.goal}</p>
                </div>
                <div className="flex gap-8 text-center">
                  <div>
                    <div className="text-xl font-extrabold">{c.lead_count}</div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Leads</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold">{c.sent}</div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Sent</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold">{openRate}%</div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Open rate</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold">{c.replies}</div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Replies</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
