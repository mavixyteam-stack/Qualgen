import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";
import { ActivityChart, type ActivityPoint } from "@/components/charts/ActivityChart";
import { IntentBars } from "@/components/charts/IntentBars";
import { IntentBadge } from "@/components/ui";
import { SeedButton } from "@/components/SeedButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Mavixy" };

const EVENT_ICONS: Record<string, string> = {
  email_sent: "📤",
  email_opened: "👁️",
  reply_received: "💬",
  intent_scored: "🌡️",
  lead_enriched: "🧠",
  leads_imported: "📄",
  leads_discovered: "🎯",
  campaign_created: "📝",
  campaign_launched: "🚀",
  campaign_completed: "🏁",
  send_failed: "⚠️",
  workspace_seeded: "⚡",
};

function timeAgo(d: Date): string {
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await ensureSchema();
  const orgId = user.orgId;

  const [leadStats] = await sql`
    select count(*)::int as total,
           count(*) filter (where enrichment is not null)::int as enriched,
           count(*) filter (where coalesce(intent_score, 0) >= 61)::int as hot
    from leads where org_id = ${orgId}`;

  const [msgStats] = await sql`
    select count(*) filter (where status = 'sent')::int as sent,
           count(*) filter (where opened_at is not null)::int as opened
    from messages where org_id = ${orgId}`;

  const [replyStats] = await sql`select count(*)::int as total from replies where org_id = ${orgId}`;

  const intentRows = await sql`
    select intent_label, count(*)::int as n from leads
    where org_id = ${orgId} and intent_label is not null
    group by intent_label`;
  const intentCounts = Object.fromEntries(intentRows.map((r) => [r.intent_label, r.n]));

  // 14-day activity from the event stream.
  const activityRows = await sql`
    select date_trunc('day', created_at) as day,
           count(*) filter (where type = 'email_sent')::int as sent,
           count(*) filter (where type = 'email_opened')::int as opened,
           count(*) filter (where type = 'reply_received')::int as replied
    from events
    where org_id = ${orgId} and created_at > now() - interval '14 days'
    group by 1`;
  const byDay = new Map(
    activityRows.map((r) => [new Date(r.day).toDateString(), r])
  );
  const activity: ActivityPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const row = byDay.get(new Date(d.toDateString()).toDateString());
    activity.push({
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sent: row?.sent ?? 0,
      opened: row?.opened ?? 0,
      replied: row?.replied ?? 0,
    });
  }

  const hotLeads = await sql`
    select id, name, title, company, intent_score, intent_label
    from leads where org_id = ${orgId} and coalesce(intent_score, 0) >= 61
    order by intent_score desc limit 6`;

  const events = await sql`
    select type, description, created_at from events
    where org_id = ${orgId}
    order by created_at desc limit 12`;

  const openRate = msgStats.sent ? Math.round((msgStats.opened / msgStats.sent) * 100) : 0;
  const isEmpty = leadStats.total === 0 && !user.demoSeeded;

  const TILES = [
    { label: "Total leads", value: leadStats.total, bg: "bg-pastel-lavender", href: "/app/leads" },
    { label: "Emails sent", value: msgStats.sent, bg: "bg-pastel-sky", href: "/app/campaigns" },
    { label: "Open rate", value: `${openRate}%`, bg: "bg-pastel-mint", href: "/app/campaigns" },
    { label: "Replies", value: replyStats.total, bg: "bg-pastel-lemon", href: "/app/campaigns" },
    { label: "Hot+ leads", value: leadStats.hot, bg: "bg-pastel-peach", href: "/app/leads" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Hey {user.fullName.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Here&apos;s what your AI pipeline has been up to.
          </p>
        </div>
        <Link href="/app/campaigns/new" className="btn-primary btn-md">🚀 New campaign</Link>
      </div>

      {isEmpty ? (
        <div className="card mt-8 flex flex-col items-center gap-4 px-8 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pastel-lavender text-3xl">⚡</div>
          <h2 className="text-xl font-bold">Your workspace is empty</h2>
          <p className="max-w-md text-sm text-ink-muted">
            Load the sample workspace to see Mavixy in action — 14 enriched leads and a completed
            campaign with sends, opens, replies and intent scores. Or start from scratch with your own leads.
          </p>
          <SeedButton />
          <div className="flex gap-3">
            <Link href="/app/leads" className="btn-secondary btn-md">🎯 Add my own leads</Link>
          </div>
        </div>
      ) : (
        <>
          {/* stat tiles */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {TILES.map((t) => (
              <Link key={t.label} href={t.href} className={`rounded-3xl ${t.bg} p-5 transition hover:shadow-lift`}>
                <div className="text-2xl font-black tracking-tight">{t.value}</div>
                <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">{t.label}</div>
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* activity chart */}
            <div className="card p-6">
              <h2 className="mb-4 text-lg font-bold tracking-tight">Outreach activity — last 14 days</h2>
              <ActivityChart data={activity} />
            </div>

            {/* intent breakdown */}
            <div className="card p-6">
              <h2 className="mb-1 text-lg font-bold tracking-tight">Intent pipeline</h2>
              <p className="mb-5 text-xs text-ink-muted">Leads by AI intent score</p>
              <IntentBars counts={intentCounts} />
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            {/* hot leads */}
            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight">🔥 Ready for sales</h2>
                <Link href="/app/leads" className="text-xs font-semibold text-brand-600 hover:underline">
                  All leads →
                </Link>
              </div>
              {hotLeads.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-muted">
                  No hot leads yet — launch a campaign and the AI will surface them here.
                </p>
              ) : (
                <ul className="divide-y divide-ink/5">
                  {hotLeads.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold">{l.name}</div>
                        <div className="truncate text-xs text-ink-muted">
                          {[l.title, l.company].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <IntentBadge label={l.intent_label} score={l.intent_score} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* activity feed */}
            <div className="card p-6">
              <h2 className="mb-4 text-lg font-bold tracking-tight">Live activity</h2>
              {events.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-muted">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {events.map((e, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 shrink-0">{EVENT_ICONS[e.type] ?? "•"}</span>
                      <span className="min-w-0 flex-1">{e.description}</span>
                      <span className="shrink-0 text-xs text-ink-faint">{timeAgo(e.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
