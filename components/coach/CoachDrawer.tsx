"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer, IntentBadge, Spinner } from "@/components/ui";
import { IconBolt, IconCheck, IconChat, IconCompass, IconSpark, IconX } from "@/components/Icons";
import type { CoachCard } from "@/lib/types";

export type CoachLead = {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  intent_score: number | null;
  intent_label: string | null;
};

export function CoachDrawer({ lead, onClose }: { lead: CoachLead | null; onClose: () => void }) {
  const router = useRouter();
  const [coach, setCoach] = useState<CoachCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCoach(null);
    setError(null);
    setCopied(false);
    if (!lead) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      const res = await fetch("/api/leads/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      setBusy(false);
      if (!res.ok) {
        setError(data.error || "The coach hit a snag. Try again.");
        return;
      }
      setCoach(data.coach);
      if (!data.cached) router.refresh();
    })();
    return () => { cancelled = true; };
  }, [lead, router]);

  async function copyLine() {
    if (!coach) return;
    try {
      await navigator.clipboard.writeText(coach.openingLine.replace(/^"|"$/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard denied — no drama */ }
  }

  return (
    <Drawer open={!!lead} onClose={onClose}>
      {lead && (
        <>
          {/* gradient header */}
          <div className="bg-coach-gradient p-7 pb-8 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-white/80">
                <IconSpark size={15} /> Your closing playbook
              </div>
              <button onClick={onClose} className="rounded-full p-2 text-white/80 transition hover:bg-white/15 hover:text-white" aria-label="Close">
                <IconX size={18} />
              </button>
            </div>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">{lead.name}</h2>
            <p className="mt-0.5 text-sm text-white/75">
              {[lead.title, lead.company].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <IntentBadge label={lead.intent_label} score={lead.intent_score} />
              {typeof lead.intent_score === "number" && (
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div className="grow-bar h-full rounded-full bg-white/90" style={{ width: `${lead.intent_score}%` }} />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-5 p-7">
            {busy && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <Spinner className="h-7 w-7 text-brand-500" />
                <div>
                  <p className="font-bold">Reading the room…</p>
                  <p className="mt-1 text-sm text-ink-muted">Replies, signals and style — playbook coming right up.</p>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-2xl bg-pastel-pink px-4 py-3 text-sm font-semibold text-accent-pink">{error}</p>
            )}

            {coach && (
              <>
                <section className="rise rise-1">
                  <h3 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-ink-muted">
                    <IconCompass size={14} /> Where this deal stands
                  </h3>
                  <p className="rounded-2xl bg-pastel-lavender/60 p-5 text-sm leading-relaxed">{coach.dealSummary}</p>
                </section>

                <section className="rise rise-2">
                  <h3 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-ink-muted">
                    <IconChat size={14} /> What they want to hear
                  </h3>
                  <ul className="space-y-2">
                    {coach.wantToHear.map((w, i) => (
                      <li key={i} className="flex items-start gap-2.5 rounded-2xl bg-pastel-mint/50 px-4 py-3 text-sm">
                        <IconCheck size={15} className="mt-0.5 shrink-0 text-accent-mint" /> {w}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rise rise-3">
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-ink-muted">🛡 Objection radar</h3>
                  <div className="space-y-2">
                    {coach.objections.map((o, i) => (
                      <div key={i} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-soft">
                        <p className="text-sm font-bold text-accent-peach">{o.objection}</p>
                        <p className="mt-1.5 text-sm text-ink-soft">{o.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rise rise-4">
                  <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-ink-muted">🎙 Open with this</h3>
                  <div className="rounded-2xl bg-ink p-5 text-white">
                    <p className="text-sm font-semibold leading-relaxed">{coach.openingLine}</p>
                    <button onClick={copyLine} className="btn-sm btn mt-3 bg-white/15 text-white hover:bg-white/25">
                      {copied ? "Copied ✓" : "Copy line"}
                    </button>
                  </div>
                </section>

                <section className="rise rise-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-pastel-peach/60 p-4">
                    <h4 className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-accent-peach">
                      <IconBolt size={13} /> Next best move
                    </h4>
                    <p className="text-sm">{coach.nextAction}</p>
                  </div>
                  <div className="rounded-2xl bg-pastel-sky/60 p-4">
                    <h4 className="mb-1 text-[11px] font-bold uppercase tracking-[.12em] text-accent-sky">🗣 How to talk to them</h4>
                    <p className="text-sm">{coach.styleTip}</p>
                  </div>
                </section>
              </>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}
