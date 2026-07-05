/**
 * The outreach engine "tick". Called from /api/process (polled by the app
 * shell) and safe to call repeatedly: sends due messages, materializes
 * simulated engagement in demo mode, scores new replies, completes campaigns.
 */

import { sql, logEvent } from "./db";
import { emailLive, sendCampaignEmail } from "./email";
import { scoreReply } from "./ai";
import { pickDemoReply, seededRng } from "./demo";
import { COSTS, spendCredits, addCredits, InsufficientCreditsError } from "./credits";

/** Draws send credits from the campaign's reservation; falls back to the
 * wallet for campaigns launched before reservations existed. */
async function drawSendCredit(orgId: string, campaignId: string, leadName: string): Promise<boolean> {
  const drew = await sql`
    update credit_reservations set remaining = remaining - ${COSTS.email_send}
    where campaign_id = ${campaignId} and status = 'active' and remaining >= ${COSTS.email_send}
    returning id`;
  if (drew.length) return true;
  try {
    await spendCredits(orgId, COSTS.email_send, "email_send", `Email to ${leadName}`);
    return true;
  } catch (err) {
    if (err instanceof InsufficientCreditsError) return false;
    throw err;
  }
}

export async function processDue(orgId: string): Promise<{ changed: number }> {
  let changed = 0;
  const now = new Date();

  /* 1. Materialize simulated opens ------------------------------------------ */
  const opens = await sql`
    update messages set opened_at = sim_open_at
    where org_id = ${orgId} and status = 'sent' and opened_at is null
      and sim_open_at is not null and sim_open_at <= ${now}
    returning id, campaign_id, lead_id, step`;
  for (const o of opens) {
    const lead = await sql`select name from leads where id = ${o.lead_id}`;
    await logEvent(orgId, "email_opened", `${lead[0]?.name ?? "Lead"} opened step ${o.step} email`, {
      campaignId: o.campaign_id, leadId: o.lead_id,
    });
    changed++;
  }

  /* 2. Materialize simulated replies + score intent -------------------------- */
  // Runs BEFORE sending, so a reply stops the rest of the sequence in the
  // same tick instead of racing the next scheduled step out the door.
  const replies = await sql`
    update messages set replied_at = sim_reply_at
    where org_id = ${orgId} and status = 'sent' and replied_at is null
      and sim_reply_at is not null and sim_reply_at <= ${now}
    returning id, campaign_id, lead_id, step`;
  for (const r of replies) {
    const body = pickDemoReply(r.id);
    await recordReply(orgId, {
      leadId: r.lead_id,
      campaignId: r.campaign_id,
      messageId: r.id,
      body,
    });
    changed++;
  }

  /* 3. Send due messages ---------------------------------------------------- */
  const due = await sql`
    select m.*, l.email as lead_email, l.name as lead_name, c.sender_name, c.status as campaign_status
    from messages m
    join leads l on l.id = m.lead_id
    join campaigns c on c.id = m.campaign_id
    where m.org_id = ${orgId} and m.status = 'scheduled' and m.scheduled_at <= ${now}
    order by m.scheduled_at asc
    limit 20`;

  for (const m of due) {
    const funded = await drawSendCredit(orgId, m.campaign_id, m.lead_name);
    if (!funded) {
      await sql`update messages set status = 'failed' where id = ${m.id}`;
      await logEvent(orgId, "send_failed", `Email to ${m.lead_name} failed — not enough credits`, {
        campaignId: m.campaign_id, leadId: m.lead_id,
      });
      changed++;
      continue;
    }

    if (emailLive() && m.lead_email) {
      try {
        const { providerId } = await sendCampaignEmail({
          to: m.lead_email,
          subject: m.subject,
          body: m.body,
          messageId: m.id,
          fromName: m.sender_name || "Mavixy",
        });
        await sql`update messages set status = 'sent', sent_at = ${now}, provider_id = ${providerId} where id = ${m.id}`;
      } catch {
        // Never charge for an email that didn't go out.
        await addCredits(orgId, COSTS.email_send, "refund", `Auto-refund — email to ${m.lead_name} failed to send`);
        await sql`update messages set status = 'failed' where id = ${m.id}`;
        await logEvent(orgId, "send_failed", `Email to ${m.lead_name} failed to send — credit refunded`, {
          campaignId: m.campaign_id, leadId: m.lead_id,
        });
        changed++;
        continue;
      }
    } else {
      // Demo mode: record the send and schedule realistic simulated engagement.
      const rng = seededRng(m.id);
      const willOpen = rng() < 0.72;
      const willReply = willOpen && rng() < 0.45;
      const openAt = willOpen ? new Date(now.getTime() + (15 + rng() * 60) * 1000) : null;
      const replyAt = willReply && openAt ? new Date(openAt.getTime() + (25 + rng() * 90) * 1000) : null;
      await sql`update messages set status = 'sent', sent_at = ${now},
        sim_open_at = ${openAt}, sim_reply_at = ${replyAt} where id = ${m.id}`;
    }
    await logEvent(orgId, "email_sent", `Step ${m.step} email sent to ${m.lead_name}`, {
      campaignId: m.campaign_id, leadId: m.lead_id,
    });
    await sql`update leads set status = 'contacted' where id = ${m.lead_id} and status in ('new','enriched')`;
    changed++;
  }

  /* 4. Complete campaigns with nothing left to send -------------------------- */
  const completed = await sql`
    update campaigns set status = 'completed'
    where org_id = ${orgId} and status = 'active'
      and not exists (select 1 from messages where campaign_id = campaigns.id and status = 'scheduled')
    returning id, name`;
  for (const c of completed) {
    await releaseReservation(orgId, c.id, `Campaign "${c.name}" wrapped`);
    await logEvent(orgId, "campaign_completed", `Campaign "${c.name}" completed`, { campaignId: c.id });
    changed++;
  }

  /* 5. Demo mode: simulate the website-visitor pixel so the tile lives ------- */
  if (!emailLive()) {
    const [org] = await sql`select demo_seeded from orgs where id = ${orgId}`;
    if (org?.demo_seeded) {
      const [{ n }] = await sql`select count(*)::int as n from site_visits where org_id = ${orgId}`;
      if (n < 14 && Math.random() < 0.35) {
        const companies = ["Acme Corp", "NorthPeak Labs", "BlueOrbit", "Zenith Retail", "CloudNest", "FinBridge", "UrbanKey", "SwiftCart"];
        const pages = ["/pricing", "/product", "/case-studies", "/", "/pricing", "/book-a-demo"];
        const company = companies[Math.floor(Math.random() * companies.length)];
        const page = pages[Math.floor(Math.random() * pages.length)];
        await sql`insert into site_visits (org_id, company, page) values (${orgId}, ${company}, ${page})`;
        changed++;
      }
    }
  }

  return { changed };
}

/** Returns unspent reserved credits to the wallet when a campaign ends. */
async function releaseReservation(orgId: string, campaignId: string, why: string) {
  const rows = await sql`
    update credit_reservations set status = 'released', released_at = now()
    where campaign_id = ${campaignId} and status = 'active'
    returning remaining`;
  const remaining = rows[0]?.remaining ?? 0;
  if (remaining > 0) {
    await addCredits(orgId, remaining, "refund", `${why} — ${remaining} unused credits returned`);
  }
}

/**
 * Records an inbound reply (simulated or manually logged), scores its intent,
 * updates the lead, and stops the rest of the sequence for that lead.
 */
export async function recordReply(
  orgId: string,
  opts: { leadId: string; campaignId?: string | null; messageId?: string | null; body: string }
) {
  const leadRows = await sql`select name from leads where id = ${opts.leadId} and org_id = ${orgId}`;
  if (!leadRows.length) throw new Error("Lead not found");
  const leadName = leadRows[0].name;

  await logEvent(orgId, "reply_received", `${leadName} replied`, {
    campaignId: opts.campaignId ?? null, leadId: opts.leadId,
  });

  // Stop remaining sequence steps for this lead — a human conversation started.
  // Their reserved send credits go straight back to the wallet.
  if (opts.campaignId) {
    const skipped = await sql`update messages set status = 'skipped'
      where campaign_id = ${opts.campaignId} and lead_id = ${opts.leadId} and status = 'scheduled'
      returning id`;
    if (skipped.length) {
      const refund = skipped.length * COSTS.email_send;
      const drew = await sql`
        update credit_reservations set remaining = remaining - ${refund}
        where campaign_id = ${opts.campaignId} and status = 'active' and remaining >= ${refund}
        returning id`;
      if (drew.length) {
        await addCredits(orgId, refund, "refund",
          `${leadName} replied — ${skipped.length} unsent email${skipped.length === 1 ? "" : "s"} refunded`);
      }
    }
  }

  // Score intent (1 credit). If the wallet is empty, keep the reply unscored.
  let scored: { score: number | null; label: string | null; reasoning: string | null } = {
    score: null, label: null, reasoning: null,
  };
  try {
    await spendCredits(orgId, COSTS.intent_score, "intent_score", `Intent scoring for ${leadName}'s reply`);
    const { result } = await scoreReply(opts.body);
    scored = result;
    await sql`update leads set intent_score = ${result.score}, intent_label = ${result.label}, status = 'replied'
      where id = ${opts.leadId}`;
    await logEvent(
      orgId,
      "intent_scored",
      `${leadName} scored ${result.score}/100 — ${result.label === "ready" ? "Sales Ready" : result.label}`,
      { campaignId: opts.campaignId ?? null, leadId: opts.leadId }
    );
  } catch (err) {
    if (!(err instanceof InsufficientCreditsError)) throw err;
    await sql`update leads set status = 'replied' where id = ${opts.leadId}`;
  }

  const rows = await sql`insert into replies (org_id, campaign_id, lead_id, message_id, body, intent_score, intent_label, reasoning)
    values (${orgId}, ${opts.campaignId ?? null}, ${opts.leadId}, ${opts.messageId ?? null}, ${opts.body},
            ${scored.score}, ${scored.label}, ${scored.reasoning})
    returning *`;
  return rows[0];
}
