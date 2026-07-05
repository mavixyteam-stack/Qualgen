import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";
import { CampaignDetail, type CampaignData } from "@/components/campaigns/CampaignDetail";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campaign — Mavixy" };

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  await ensureSchema();
  const { id } = await params;

  const campaigns = await sql`select * from campaigns where id = ${id} and org_id = ${session.orgId}`;
  if (!campaigns.length) notFound();
  const c = campaigns[0];

  const [messages, replies] = await Promise.all([
    sql`select m.id, m.lead_id, m.step, m.subject, m.body, m.status, m.scheduled_at, m.sent_at, m.opened_at, m.replied_at,
           l.name as lead_name, l.title as lead_title, l.company as lead_company,
           l.intent_score, l.intent_label
        from messages m join leads l on l.id = m.lead_id
        where m.campaign_id = ${id}
        order by l.name, m.step`,
    sql`select r.id, r.lead_id, r.body, r.intent_score, r.intent_label, r.reasoning, r.created_at,
           l.name as lead_name, l.company as lead_company
        from replies r join leads l on l.id = r.lead_id
        where r.campaign_id = ${id}
        order by r.created_at desc`,
  ]);

  const data: CampaignData = {
    id: c.id,
    name: c.name,
    goal: c.goal,
    status: c.status,
    launchedAt: c.launched_at?.toISOString() ?? null,
    messages: messages.map((m) => ({
      id: m.id,
      leadId: m.lead_id,
      step: m.step,
      subject: m.subject,
      body: m.body,
      status: m.status,
      scheduledAt: m.scheduled_at?.toISOString() ?? null,
      sentAt: m.sent_at?.toISOString() ?? null,
      openedAt: m.opened_at?.toISOString() ?? null,
      repliedAt: m.replied_at?.toISOString() ?? null,
      leadName: m.lead_name,
      leadTitle: m.lead_title,
      leadCompany: m.lead_company,
      intentScore: m.intent_score,
      intentLabel: m.intent_label,
    })),
    replies: replies.map((r) => ({
      id: r.id,
      leadId: r.lead_id,
      body: r.body,
      intentScore: r.intent_score,
      intentLabel: r.intent_label,
      reasoning: r.reasoning,
      createdAt: r.created_at.toISOString(),
      leadName: r.lead_name,
      leadCompany: r.lead_company,
    })),
  };

  return <CampaignDetail data={data} />;
}
