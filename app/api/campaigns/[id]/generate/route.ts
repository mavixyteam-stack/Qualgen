import { requireApiSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { generateSequence } from "@/lib/ai";
import { COSTS, spendCredits, creditError } from "@/lib/credits";
import type { Enrichment } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession();
    const { id } = await params;
    const { leadId } = await req.json().catch(() => ({}));
    if (!leadId) return Response.json({ error: "leadId required" }, { status: 400 });

    const campaigns = await sql`select * from campaigns where id = ${id} and org_id = ${session.orgId}`;
    if (!campaigns.length) return Response.json({ error: "Campaign not found" }, { status: 404 });
    const campaign = campaigns[0];
    if (campaign.status !== "draft") {
      return Response.json({ error: "Campaign already launched." }, { status: 409 });
    }

    const leads = await sql`select * from leads where id = ${leadId} and org_id = ${session.orgId}`;
    if (!leads.length) return Response.json({ error: "Lead not found" }, { status: 404 });
    const lead = leads[0];

    // Idempotent per lead — regenerating a lead that already has drafts is free.
    const existing = await sql`select id from messages where campaign_id = ${id} and lead_id = ${leadId}`;
    if (existing.length) return Response.json({ ok: true, alreadyGenerated: true });

    await spendCredits(session.orgId, COSTS.personalize, "personalize", `AI sequence — ${lead.name}`);

    const { steps } = await generateSequence(
      {
        id: lead.id, name: lead.name, title: lead.title, company: lead.company,
        email: lead.email, linkedin_url: lead.linkedin_url, location: lead.location, industry: lead.industry,
      },
      (lead.enrichment as Enrichment | null) ?? null,
      { goal: campaign.goal, product: campaign.product, senderName: campaign.sender_name }
    );

    for (const step of steps) {
      await sql`insert into messages (org_id, campaign_id, lead_id, step, subject, body, status)
        values (${session.orgId}, ${id}, ${leadId}, ${step.step}, ${step.subject}, ${step.body}, 'draft')`;
    }

    return Response.json({ ok: true, steps });
  } catch (err) {
    if (err instanceof Response) return err;
    const credit = creditError(err);
    if (credit) return credit;
    console.error(err);
    return Response.json({ error: "Sequence generation failed." }, { status: 500 });
  }
}
