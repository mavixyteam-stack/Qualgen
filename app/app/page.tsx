import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";
import type { ActivityPoint } from "@/components/charts/ActivityChart";
import { DashboardView, type DashboardData } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview — Mavixy AI" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await ensureSchema();
  const orgId = user.orgId;

  // One concurrent burst instead of eight sequential round-trips — matters a
  // lot when the database is a real network hop away.
  const [
    [leadStats],
    [msgStats],
    [replyStats],
    intentRows,
    activityRows,
    queueRows,
    events,
    visits,
  ] = await Promise.all([
    sql`select count(*)::int as total,
           count(*) filter (where coalesce(intent_score, 0) >= 61)::int as hot,
           count(*) filter (where coalesce(intent_score, 0) >= 86)::int as ready
        from leads where org_id = ${orgId}`,
    sql`select count(*) filter (where status = 'sent')::int as sent,
           count(*) filter (where opened_at is not null)::int as opened
        from messages where org_id = ${orgId}`,
    sql`select count(*)::int as total from replies where org_id = ${orgId}`,
    sql`select intent_label, count(*)::int as n from leads
        where org_id = ${orgId} and intent_label is not null
        group by intent_label`,
    sql`select date_trunc('day', created_at) as day,
           count(*) filter (where type = 'email_sent')::int as sent,
           count(*) filter (where type = 'email_opened')::int as opened,
           count(*) filter (where type = 'reply_received')::int as replied
        from events
        where org_id = ${orgId} and created_at > now() - interval '14 days'
        group by 1`,
    sql`select l.id, l.name, l.title, l.company, l.intent_score, l.intent_label, (l.coach is not null) as has_coach,
          (select r.body from replies r where r.lead_id = l.id order by r.created_at desc limit 1) as last_reply
        from leads l
        where l.org_id = ${orgId} and l.intent_score is not null
        order by l.intent_score desc
        limit 6`,
    sql`select type, description, created_at from events
        where org_id = ${orgId}
        order by created_at desc limit 8`,
    sql`select company, page, created_at from site_visits
        where org_id = ${orgId}
        order by created_at desc limit 4`,
  ]);
  const intentCounts = Object.fromEntries(intentRows.map((r) => [r.intent_label, r.n]));
  const byDay = new Map(activityRows.map((r) => [new Date(r.day).toDateString(), r]));
  const activity: ActivityPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const row = byDay.get(d.toDateString());
    activity.push({
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sent: row?.sent ?? 0,
      opened: row?.opened ?? 0,
      replied: row?.replied ?? 0,
    });
  }

  const data: DashboardData = {
    firstName: user.fullName.split(" ")[0],
    demoSeeded: user.demoSeeded,
    stats: {
      leads: leadStats.total,
      sent: msgStats.sent,
      openRate: msgStats.sent ? Math.round((msgStats.opened / msgStats.sent) * 100) : 0,
      replies: replyStats.total,
      hot: leadStats.hot,
      ready: leadStats.ready,
    },
    intentCounts,
    activity,
    queue: queueRows.map((r) => ({
      id: r.id, name: r.name, title: r.title, company: r.company,
      intent_score: r.intent_score, intent_label: r.intent_label,
      hasCoach: r.has_coach, lastReply: r.last_reply,
    })),
    events: events.map((e) => ({
      type: e.type, description: e.description, at: e.created_at.toISOString(),
    })),
    visits: visits.map((v) => ({
      company: v.company, page: v.page, at: v.created_at.toISOString(),
    })),
  };

  return <DashboardView data={data} />;
}
