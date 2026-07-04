/**
 * Email delivery. With RESEND_API_KEY set, emails really send through Resend
 * (free tier: 3,000/month) with an open-tracking pixel. Without a key the
 * platform runs in demo mode: sends are recorded and realistic engagement
 * (opens, replies) is simulated so dashboards stay alive during demos.
 */

import { Resend } from "resend";

export function emailLive(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function appUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function textToHtml(body: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.6;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export async function sendCampaignEmail(opts: {
  to: string;
  subject: string;
  body: string;
  messageId: string;
  fromName: string;
}): Promise<{ providerId: string | null }> {
  const pixel = `<img src="${appUrl()}/api/t/o/${opts.messageId}" width="1" height="1" alt="" style="display:none;"/>`;
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;color:#1a1a2e;max-width:600px;">${textToHtml(opts.body)}${pixel}</div>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || `${opts.fromName} <onboarding@resend.dev>`;
  const { data, error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html,
    text: opts.body,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
  return { providerId: data?.id ?? null };
}
