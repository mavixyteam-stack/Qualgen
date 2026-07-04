"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Spinner } from "@/components/ui";

const EXAMPLES = [
  "Founders of SaaS startups in Bangalore with 10–100 employees",
  "Heads of marketing at fintech companies in Mumbai or Delhi",
  "VPs of sales at e-commerce companies hiring SDRs",
];

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; duplicates: number } | null>(null);

  function close() {
    setPrompt(""); setBusy(false); setError(null); setResult(null);
    onClose();
  }

  async function search() {
    if (!prompt.trim()) {
      setError("Describe who you're looking for first.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/leads/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, count }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Search failed. Try again.");
      return;
    }
    setResult({ added: data.added, duplicates: data.duplicates });
    router.refresh();
  }

  return (
    <Modal open={open} onClose={close} title="Find leads with AI">
      {result ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-pastel-mint text-3xl">🎯</div>
          <div>
            <div className="text-xl font-bold">{result.added} leads found & added</div>
            {result.duplicates > 0 && (
              <p className="mt-1 text-sm text-ink-muted">{result.duplicates} duplicates skipped</p>
            )}
            <p className="mt-2 text-sm text-ink-muted">
              Next step: select them and hit <span className="font-semibold text-ink">Enrich</span> to build intelligence cards.
            </p>
          </div>
          <button onClick={close} className="btn-primary btn-md">View my leads</button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="icp">Describe your ideal customer</label>
            <textarea
              id="icp"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="e.g. Founders of SaaS startups in Bangalore with 10–100 employees hiring sales teams"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPrompt(ex)}
                className="chip bg-surface-sunken text-ink-soft transition hover:bg-pastel-lavender hover:text-brand-700"
              >
                {ex}
              </button>
            ))}
          </div>

          <div>
            <label className="label" htmlFor="count">How many leads?</label>
            <select
              id="count"
              className="input"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              <option value={10}>10 leads — 10 credits</option>
              <option value={25}>25 leads — 25 credits</option>
              <option value={50}>50 leads — 50 credits</option>
            </select>
          </div>

          {error && (
            <p className="rounded-2xl bg-pastel-pink px-4 py-3 text-sm font-medium text-accent-pink">{error}</p>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-ink-muted">1 credit per lead found</span>
            <div className="flex gap-3">
              <button onClick={close} className="btn-ghost btn-md">Cancel</button>
              <button onClick={search} disabled={busy} className="btn-primary btn-md">
                {busy && <Spinner />}
                {busy ? "Searching…" : "Find leads"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
