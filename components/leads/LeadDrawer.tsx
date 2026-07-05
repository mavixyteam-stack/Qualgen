"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IntentBadge, Spinner, StatusChip } from "@/components/ui";
import type { LeadRow } from "./lead-types";

const OUTCOME_META = [
  { key: "won", label: "🎉 Won", active: "bg-pastel-mint text-accent-mint" },
  { key: "lost", label: "Lost", active: "bg-pastel-pink text-accent-pink" },
  { key: "nurture", label: "🌱 Nurture", active: "bg-pastel-lemon text-accent-lemon" },
];

export function LeadDrawer({
  lead,
  onClose,
  onCoach,
}: {
  lead: LeadRow | null;
  onClose: () => void;
  onCoach: (lead: LeadRow) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!lead) return null;

  async function setOutcome(outcome: string) {
    const next = lead!.outcome === outcome ? null : outcome;
    await fetch("/api/leads/outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead!.id, outcome: next }),
    });
    router.refresh();
  }

  async function enrich() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/leads/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead!.id }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Enrichment failed.");
      return;
    }
    router.refresh();
  }

  const e = lead.enrichment;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="slide-in absolute inset-y-3 right-3 flex w-full max-w-xl flex-col overflow-y-auto rounded-3xl bg-white shadow-lift">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/5 bg-white/90 px-7 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">{lead.name}</h2>
            <p className="text-sm text-ink-muted">
              {[lead.title, lead.company].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost rounded-full p-2" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-7 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={lead.status} />
            <IntentBadge label={lead.intent_label} score={lead.intent_score} />
            {lead.intent_label && (
              <button onClick={() => onCoach(lead)} className="btn-primary btn-sm ml-auto">
                🏆 Closing playbook
              </button>
            )}
          </div>

          <div>
            <span className="label">Deal outcome — teaches the AI what wins</span>
            <div className="flex flex-wrap gap-2">
              {OUTCOME_META.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setOutcome(o.key)}
                  className={`chip transition-all duration-200 active:scale-95 ${
                    lead.outcome === o.key ? o.active : "bg-surface-sunken text-ink-muted hover:bg-surface-hover"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="label">Email</dt>
              <dd className="break-all font-medium">{lead.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="label">Location</dt>
              <dd className="font-medium">{lead.location ?? "—"}</dd>
            </div>
            <div>
              <dt className="label">Industry</dt>
              <dd className="font-medium">{lead.industry ?? "—"}</dd>
            </div>
            <div>
              <dt className="label">LinkedIn</dt>
              <dd className="break-all font-medium">
                {lead.linkedin_url ? (
                  <a href={lead.linkedin_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                    View profile ↗
                  </a>
                ) : "—"}
              </dd>
            </div>
          </dl>

          {error && (
            <p className="rounded-2xl bg-pastel-pink px-4 py-3 text-sm font-medium text-accent-pink">{error}</p>
          )}

          {e ? (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pastel-lavender text-base">🧠</span>
                <h3 className="text-base font-extrabold tracking-tight">Prospect Intelligence</h3>
              </div>

              <div className="rounded-3xl bg-pastel-lavender/50 p-5">
                <p className="text-sm leading-relaxed">{e.summary}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-pastel-peach/50 p-5">
                  <h4 className="label">Likely pain points</h4>
                  <ul className="space-y-2 text-sm">
                    {e.painPoints.map((p, i) => (
                      <li key={i} className="flex gap-2"><span aria-hidden>•</span>{p}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl bg-pastel-mint/50 p-5">
                  <h4 className="label">Personalization hooks</h4>
                  <ul className="space-y-2 text-sm">
                    {e.hooks.map((h, i) => (
                      <li key={i} className="flex gap-2"><span aria-hidden>•</span>{h}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-3xl bg-pastel-sky/50 p-5">
                <h4 className="label">Buying signals</h4>
                <ul className="space-y-2 text-sm">
                  {e.signals.map((s, i) => (
                    <li key={i} className="flex gap-2"><span aria-hidden>📡</span>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-surface-sunken p-5">
                  <h4 className="label">Best channel</h4>
                  <p className="text-sm font-semibold">{e.bestChannel}</p>
                </div>
                <div className="rounded-3xl bg-surface-sunken p-5">
                  <h4 className="label">Buying readiness</h4>
                  <p className="text-sm font-semibold">{e.readiness}/100 pre-engagement</p>
                </div>
              </div>

              <div className="rounded-3xl bg-pastel-lemon/50 p-5">
                <h4 className="label">Communication style</h4>
                <p className="text-sm">{e.style}</p>
              </div>
            </section>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-8 text-center">
              <div className="text-3xl">🧠</div>
              <h3 className="mt-2 font-bold">No intelligence card yet</h3>
              <p className="mx-auto mt-1 max-w-xs text-sm text-ink-muted">
                Enrich this lead to reveal pain points, buying signals and personalization hooks.
              </p>
              <button onClick={enrich} disabled={busy} className="btn-primary btn-md mt-4">
                {busy && <Spinner />}
                {busy ? "Enriching…" : "Enrich with AI — 3 credits"}
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
