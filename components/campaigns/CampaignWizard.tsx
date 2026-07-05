"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProgressBar, Spinner } from "@/components/ui";
import type { SequenceStep } from "@/lib/types";

type WizardLead = {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  email: string;
  enriched: boolean;
};

const GOALS = [
  "Book a 15-minute demo",
  "Start a free trial",
  "Get a reply to qualify interest",
  "Schedule a discovery call",
];

const CHANNELS = [
  { key: "email", name: "Email", emoji: "📧", live: true, note: "Tracked opens & replies" },
  { key: "linkedin", name: "LinkedIn", emoji: "💼", live: false, note: "Coming in Phase 2" },
  { key: "whatsapp", name: "WhatsApp", emoji: "💬", live: false, note: "Coming in Phase 2" },
];

export function CampaignWizard({ leads }: { leads: WizardLead[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(GOALS[0]);
  const [product, setProduct] = useState("");
  const [channels, setChannels] = useState<Set<string>>(new Set(["email"]));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [generated, setGenerated] = useState<Record<string, SequenceStep[]>>({});
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLeads = leads.filter((l) => selected.has(l.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 25) next.add(id);
      return next;
    });
  }

  async function generate() {
    setError(null);
    setBusy(true);
    try {
      let id = campaignId;
      if (!id) {
        const res = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, goal, product }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not create campaign.");
        id = data.id;
        setCampaignId(id);
      }

      setStep(2);
      const ids = [...selected];
      setProgress({ done: 0, total: ids.length });
      const all: Record<string, SequenceStep[]> = {};
      for (let i = 0; i < ids.length; i++) {
        const res = await fetch(`/api/campaigns/${id}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: ids[i] }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Sequence generation failed.");
        if (data.steps) all[ids[i]] = data.steps;
        setProgress({ done: i + 1, total: ids.length });
      }
      setGenerated(all);
      setOpenLead(ids[0] ?? null);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep((s) => (s === 2 ? 1 : s));
    } finally {
      setBusy(false);
    }
  }

  async function launch() {
    if (!campaignId) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/campaigns/${campaignId}/launch`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Launch failed.");
      return;
    }
    router.push(`/app/campaigns/${campaignId}`);
    router.refresh();
  }

  const stepLabels = ["Details", "Pick leads", "AI writes", "Review & launch"];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/campaigns" className="text-sm font-semibold text-ink-muted hover:text-ink">
        ← Campaigns
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">New campaign</h1>

      {/* stepper */}
      <ol className="mt-6 flex items-center gap-2">
        {stepLabels.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                i < step ? "bg-pastel-mint text-accent-mint"
                : i === step ? "bg-brand-500 text-white"
                : "bg-surface-sunken text-ink-muted"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className={`text-sm font-semibold ${i === step ? "text-ink" : "text-ink-muted"}`}>
              {label}
            </span>
            {i < stepLabels.length - 1 && <span className="mx-1 h-px w-6 bg-ink/10" />}
          </li>
        ))}
      </ol>

      {error && (
        <p className="mt-5 rounded-2xl bg-pastel-pink px-4 py-3 text-sm font-medium text-accent-pink">{error}</p>
      )}

      {/* Step 0 — details */}
      {step === 0 && (
        <div className="card mt-6 space-y-5 p-7">
          <div>
            <label className="label" htmlFor="name">Campaign name</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SaaS Founders — July outreach" />
          </div>
          <div>
            <label className="label" htmlFor="goal">Goal</label>
            <select id="goal" className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
              {GOALS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="product">What are you selling? (optional)</label>
            <textarea id="product" rows={2} className="input resize-none" value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="One line about your product — the AI uses this to write sharper emails" />
          </div>
          <div>
            <span className="label">Channels</span>
            <div className="grid gap-3 sm:grid-cols-3">
              {CHANNELS.map((c) => {
                const selected = channels.has(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    disabled={!c.live}
                    onClick={() =>
                      setChannels((prev) => {
                        const next = new Set(prev);
                        if (next.has(c.key)) { if (next.size > 1) next.delete(c.key); }
                        else next.add(c.key);
                        return next;
                      })
                    }
                    className={`rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                      selected
                        ? "border-brand-400 bg-brand-50 shadow-soft"
                        : "border-ink/10 bg-white hover:border-brand-200"
                    } ${!c.live ? "opacity-55 cursor-not-allowed" : "active:scale-[.98]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{c.emoji}</span>
                      {c.live ? (
                        selected && <span className="chip bg-brand-500 text-white">✓ On</span>
                      ) : (
                        <span className="chip bg-pastel-lemon text-accent-lemon">Soon</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-extrabold">{c.name}</div>
                    <div className="text-xs text-ink-muted">{c.note}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => name.trim() ? setStep(1) : setError("Give your campaign a name.")}
              className="btn-primary btn-md"
            >
              Next: pick leads →
            </button>
          </div>
        </div>
      )}

      {/* Step 1 — pick leads */}
      {step === 1 && (
        <div className="card mt-6 p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              <span className="font-bold text-ink">{selected.size}</span> of {leads.length} leads selected
              <span className="text-ink-faint"> · max 25 per campaign in the POC</span>
            </p>
            <button
              onClick={() =>
                setSelected(selected.size ? new Set() : new Set(leads.slice(0, 25).map((l) => l.id)))
              }
              className="btn-ghost btn-md"
            >
              {selected.size ? "Clear" : "Select first 25"}
            </button>
          </div>

          {leads.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-pastel-lemon px-4 py-3 text-sm">
              No leads with an email address yet.{" "}
              <Link href="/app/leads" className="font-semibold underline">Add leads first</Link>.
            </p>
          ) : (
            <ul className="mt-4 max-h-96 divide-y divide-ink/5 overflow-y-auto rounded-2xl border border-ink/5">
              {leads.map((l) => (
                <li key={l.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-surface-sunken/60">
                    <input
                      type="checkbox"
                      checked={selected.has(l.id)}
                      onChange={() => toggle(l.id)}
                      className="h-4 w-4 accent-brand-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{l.name}</span>
                      <span className="block truncate text-xs text-ink-muted">
                        {[l.title, l.company].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {l.enriched ? (
                      <span className="chip bg-pastel-lavender text-brand-700">🧠 Enriched</span>
                    ) : (
                      <span className="chip bg-surface-sunken text-ink-muted">Basic data</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-ink-muted">
            💡 Enriched leads get sharper personalization — the AI writes from their intelligence card.
          </p>

          <div className="mt-5 flex justify-between">
            <button onClick={() => setStep(0)} className="btn-ghost btn-md">← Back</button>
            <button
              onClick={generate}
              disabled={!selected.size || busy}
              className="btn-primary btn-md"
            >
              {busy && <Spinner />}
              ✨ Generate sequences — {selected.size * 3} credits
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — generating */}
      {step === 2 && (
        <div className="card mt-6 flex flex-col items-center gap-5 p-12 text-center">
          <div className="float-slow flex h-16 w-16 items-center justify-center rounded-3xl bg-pastel-lavender text-3xl">✍️</div>
          <div>
            <h2 className="text-xl font-extrabold">The AI is doing its homework…</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Three personal touches per buyer — written from their world, not a template.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <ProgressBar value={progress.done} max={progress.total} />
            <p className="mt-2 text-sm font-semibold text-ink-soft">
              {progress.done} / {progress.total} leads done
            </p>
          </div>
        </div>
      )}

      {/* Step 3 — review & launch */}
      {step === 3 && (
        <div className="mt-6 space-y-4">
          <div className="card p-6">
            <h2 className="text-lg font-bold">Review the sequences</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Every lead gets their own 3-touch sequence. Sending costs 1 credit per email
              ({selectedLeads.length * 3} credits max if nobody replies — replies stop the sequence).
            </p>
          </div>

          {selectedLeads.map((l) => (
            <div key={l.id} className="card overflow-hidden">
              <button
                onClick={() => setOpenLead(openLead === l.id ? null : l.id)}
                className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition hover:bg-surface-sunken/50"
              >
                <div>
                  <div className="font-bold">{l.name}</div>
                  <div className="text-xs text-ink-muted">{[l.title, l.company].filter(Boolean).join(" · ")}</div>
                </div>
                <span className="text-ink-muted">{openLead === l.id ? "▲" : "▼"}</span>
              </button>
              {openLead === l.id && (
                <div className="space-y-4 border-t border-ink/5 px-6 py-5">
                  {(generated[l.id] ?? []).map((s) => (
                    <div key={s.step} className="rounded-2xl bg-surface-sunken p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="chip bg-pastel-lavender text-brand-700">Touch {s.step}</span>
                        <span className="text-sm font-bold">{s.subject}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{s.body}</p>
                    </div>
                  ))}
                  {!generated[l.id]?.length && (
                    <p className="text-sm text-ink-muted">Sequence saved — preview unavailable for regenerated leads.</p>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="card flex items-center justify-between gap-4 p-6">
            <p className="text-sm text-ink-muted">
              Ready? Touch 1 sends immediately, touches 2–3 follow automatically.
            </p>
            <button onClick={launch} disabled={busy} className="btn-primary btn-lg">
              {busy && <Spinner />}
              🚀 Launch campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
