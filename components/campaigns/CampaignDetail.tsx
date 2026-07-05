"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IntentBadge, Modal, Spinner, StatusChip } from "@/components/ui";
import { CoachDrawer, type CoachLead } from "@/components/coach/CoachDrawer";

export type CampaignData = {
  id: string;
  name: string;
  goal: string;
  status: string;
  launchedAt: string | null;
  messages: {
    id: string;
    leadId: string;
    step: number;
    subject: string;
    body: string;
    status: string;
    scheduledAt: string | null;
    sentAt: string | null;
    openedAt: string | null;
    repliedAt: string | null;
    leadName: string;
    leadTitle: string | null;
    leadCompany: string | null;
    intentScore: number | null;
    intentLabel: string | null;
  }[];
  replies: {
    id: string;
    leadId: string;
    body: string;
    intentScore: number | null;
    intentLabel: string | null;
    reasoning: string | null;
    createdAt: string;
    leadName: string;
    leadCompany: string | null;
  }[];
};

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function CampaignDetail({ data }: { data: CampaignData }) {
  const router = useRouter();
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [openMessage, setOpenMessage] = useState<CampaignData["messages"][number] | null>(null);
  const [replyFor, setReplyFor] = useState<{ id: string; name: string } | null>(null);
  const [coachLead, setCoachLead] = useState<CoachLead | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byLead = useMemo(() => {
    const map = new Map<string, CampaignData["messages"]>();
    for (const m of data.messages) {
      const arr = map.get(m.leadId) ?? [];
      arr.push(m);
      map.set(m.leadId, arr);
    }
    return [...map.entries()].sort((a, b) =>
      (b[1][0].intentScore ?? -1) - (a[1][0].intentScore ?? -1)
    );
  }, [data.messages]);

  const sent = data.messages.filter((m) => m.status === "sent").length;
  const opened = data.messages.filter((m) => m.openedAt).length;
  const openRate = sent ? Math.round((opened / sent) * 100) : 0;
  const hotLeads = byLead.filter(([, ms]) => (ms[0].intentScore ?? 0) >= 61).length;

  async function logReply() {
    if (!replyFor || !replyText.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/campaigns/${data.id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: replyFor.id, body: replyText }),
    });
    const resData = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(resData.error || "Could not log the reply.");
      return;
    }
    setReplyFor(null);
    setReplyText("");
    router.refresh();
  }

  const STATS = [
    { label: "Leads", value: byLead.length, bg: "bg-pastel-lavender" },
    { label: "Emails sent", value: sent, bg: "bg-pastel-sky" },
    { label: "Open rate", value: `${openRate}%`, bg: "bg-pastel-mint" },
    { label: "Replies", value: data.replies.length, bg: "bg-pastel-lemon" },
    { label: "Hot+ leads", value: hotLeads, bg: "bg-pastel-peach" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/app/campaigns" className="text-sm font-semibold text-ink-muted hover:text-ink">
        ← Campaigns
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">{data.name}</h1>
        <StatusChip status={data.status} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Goal: {data.goal}
        {data.status === "active" && " · sequence running — follow-ups send automatically"}
      </p>

      {/* stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {STATS.map((s) => (
          <div key={s.label} className={`rounded-3xl ${s.bg} p-5`}>
            <div className="text-2xl font-black tracking-tight">{s.value}</div>
            <div className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-ink-soft">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* per-lead sequence timeline */}
        <div>
          <h2 className="mb-3 text-lg font-bold tracking-tight">Leads & sequences</h2>
          <div className="space-y-3">
            {byLead.map(([leadId, ms]) => {
              const lead = ms[0];
              const isOpen = openLead === leadId;
              return (
                <div key={leadId} className="card overflow-hidden">
                  <button
                    onClick={() => setOpenLead(isOpen ? null : leadId)}
                    className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition hover:bg-surface-sunken/50"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-bold">{lead.leadName}</div>
                      <div className="truncate text-xs text-ink-muted">
                        {[lead.leadTitle, lead.leadCompany].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <IntentBadge label={lead.intentLabel} score={lead.intentScore} />
                      <span className="text-ink-muted">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-ink/5 px-6 py-4">
                      <ol className="space-y-2">
                        {ms.map((m) => (
                          <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-sunken px-4 py-3">
                            <span className="chip bg-white text-ink-soft">Touch {m.step}</span>
                            <button
                              onClick={() => setOpenMessage(m)}
                              className="min-w-0 flex-1 truncate text-left text-sm font-semibold hover:text-brand-600"
                              title="View email"
                            >
                              {m.subject}
                            </button>
                            <span className="flex items-center gap-1.5 text-xs font-semibold">
                              <StatusChip status={m.status} />
                              {m.openedAt && <span className="chip bg-pastel-mint text-accent-mint">👁 Opened</span>}
                              {m.repliedAt && <span className="chip bg-pastel-peach text-accent-peach">💬 Replied</span>}
                            </span>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {lead.intentLabel && (
                          <button
                            onClick={() =>
                              setCoachLead({
                                id: leadId, name: lead.leadName, title: lead.leadTitle,
                                company: lead.leadCompany, intent_score: lead.intentScore,
                                intent_label: lead.intentLabel,
                              })
                            }
                            className="btn-primary btn-sm"
                          >
                            🏆 Closing playbook
                          </button>
                        )}
                        <button
                          onClick={() => setReplyFor({ id: leadId, name: lead.leadName })}
                          className="btn-ghost btn-sm text-xs"
                        >
                          💬 Log a reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* replies + intent */}
        <div>
          <h2 className="mb-3 text-lg font-bold tracking-tight">Replies & intent</h2>
          {data.replies.length === 0 ? (
            <div className="card p-6 text-center text-sm text-ink-muted">
              No replies yet. When prospects respond, the AI scores their buying intent here.
            </div>
          ) : (
            <div className="space-y-3">
              {data.replies.map((r) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold">{r.leadName}</div>
                      <div className="text-xs text-ink-muted">{r.leadCompany ?? ""} · {timeAgo(r.createdAt)}</div>
                    </div>
                    <IntentBadge label={r.intentLabel} score={r.intentScore} />
                  </div>
                  <p className="mt-3 rounded-2xl bg-surface-sunken px-4 py-3 text-sm italic">
                    “{r.body}”
                  </p>
                  {r.reasoning && (
                    <p className="mt-2 text-xs text-ink-muted">
                      <span className="font-semibold text-brand-600">AI: </span>{r.reasoning}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* email preview modal */}
      <Modal
        open={!!openMessage}
        onClose={() => setOpenMessage(null)}
        title={openMessage ? `Touch ${openMessage.step}: ${openMessage.subject}` : ""}
        wide
      >
        {openMessage && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs text-ink-muted">
              <span>To: {openMessage.leadName}</span>
              {openMessage.sentAt && <span>· Sent {timeAgo(openMessage.sentAt)}</span>}
              {openMessage.openedAt && <span>· Opened {timeAgo(openMessage.openedAt)}</span>}
            </div>
            <p className="whitespace-pre-wrap rounded-2xl bg-surface-sunken p-5 text-sm leading-relaxed">
              {openMessage.body}
            </p>
          </div>
        )}
      </Modal>

      <CoachDrawer lead={coachLead} onClose={() => setCoachLead(null)} />

      {/* log reply modal */}
      <Modal
        open={!!replyFor}
        onClose={() => { setReplyFor(null); setError(null); }}
        title={replyFor ? `Log a reply from ${replyFor.name}` : ""}
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Paste the prospect&apos;s reply — the AI scores its buying intent (1 credit) and updates the lead.
          </p>
          <textarea
            rows={4}
            className="input resize-none"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder='e.g. "Sounds interesting — what does pricing look like?"'
          />
          {error && (
            <p className="rounded-2xl bg-pastel-pink px-4 py-3 text-sm font-medium text-accent-pink">{error}</p>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => setReplyFor(null)} className="btn-ghost btn-md">Cancel</button>
            <button onClick={logReply} disabled={busy || !replyText.trim()} className="btn-primary btn-md">
              {busy && <Spinner />}
              Score intent
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
