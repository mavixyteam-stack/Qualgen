"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, IntentBadge, ProgressBar, Spinner, StatusChip } from "@/components/ui";
import { ImportModal } from "./ImportModal";
import { SearchModal } from "./SearchModal";
import { LeadDrawer } from "./LeadDrawer";
import { CoachDrawer, type CoachLead } from "@/components/coach/CoachDrawer";
import type { LeadRow } from "./lead-types";

const SOURCE_NAMES: Record<string, string> = {
  csv: "CSV import",
  ai_search: "AI search",
  apollo: "Apollo",
};

export function LeadsView({ leads }: { leads: LeadRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [coachLead, setCoachLead] = useState<CoachLead | null>(null);
  const [enriching, setEnriching] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.name, l.company, l.title, l.email, l.location]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [leads, query]);

  const drawerLead = useMemo(
    () => leads.find((l) => l.id === drawerId) ?? null,
    [leads, drawerId]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((l) => l.id))
    );
  }

  async function enrichSelected() {
    const ids = [...selected].filter((id) => {
      const lead = leads.find((l) => l.id === id);
      return lead && !lead.enrichment;
    });
    if (!ids.length) {
      setError("All selected leads are already enriched.");
      return;
    }
    setError(null);
    setEnriching({ done: 0, total: ids.length });
    for (let i = 0; i < ids.length; i++) {
      const res = await fetch("/api/leads/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: ids[i] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Enrichment failed.");
        break;
      }
      setEnriching({ done: i + 1, total: ids.length });
    }
    setEnriching(null);
    setSelected(new Set());
    router.refresh();
  }

  async function deleteSelected() {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} lead(s)? This can't be undone.`)) return;
    await fetch("/api/leads/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setSelected(new Set());
    setDrawerId(null);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {leads.length > 0
              ? <><span className="font-bold text-ink">{leads.length}</span> future customer{leads.length === 1 ? "" : "s"} and counting 🎯</>
              : "Your future customers will live here."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setImportOpen(true)} className="btn-secondary btn-md">
            📄 Import CSV
          </button>
          <button onClick={() => setSearchOpen(true)} className="btn-primary btn-md">
            ✨ Find leads with AI
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl bg-pastel-pink px-4 py-3 text-sm font-medium text-accent-pink">
          {error}
        </p>
      )}

      {enriching && (
        <div className="card mt-4 flex items-center gap-4 px-5 py-4">
          <Spinner className="h-5 w-5 text-brand-500" />
          <div className="flex-1">
            <div className="text-sm font-semibold">
              Enriching leads with AI… {enriching.done}/{enriching.total}
            </div>
            <div className="mt-1.5">
              <ProgressBar value={enriching.done} max={enriching.total} />
            </div>
          </div>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            emoji="🎯"
            title="Zero leads. Infinite potential."
            body="Describe your dream customer in one sentence and watch the AI go hunting — or bring your own CSV. Either way, this table won't stay empty long."
          >
            <button onClick={() => setSearchOpen(true)} className="btn-primary btn-md">
              ✨ Find leads with AI
            </button>
            <button onClick={() => setImportOpen(true)} className="btn-secondary btn-md">
              📄 Import CSV
            </button>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input max-w-xs"
              placeholder="Search name, company, email…"
            />
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink-soft">{selected.size} selected</span>
                <button onClick={enrichSelected} disabled={!!enriching} className="btn-primary btn-md">
                  🧠 Enrich (3 cr each)
                </button>
                <button onClick={deleteSelected} className="btn-ghost btn-md text-accent-pink">
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="card rise rise-2 mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/5 text-xs uppercase tracking-wider text-ink-muted">
                  <th className="px-5 py-3.5">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleAll}
                      className="h-4 w-4 accent-brand-500"
                    />
                  </th>
                  <th className="px-3 py-3.5 font-semibold">Lead</th>
                  <th className="px-3 py-3.5 font-semibold">Company</th>
                  <th className="px-3 py-3.5 font-semibold">Source</th>
                  <th className="px-3 py-3.5 font-semibold">Status</th>
                  <th className="px-3 py-3.5 font-semibold">Intelligence</th>
                  <th className="px-5 py-3.5 font-semibold">Intent</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setDrawerId(l.id)}
                    className="cursor-pointer border-b border-ink/5 transition last:border-0 hover:bg-surface-sunken/60"
                  >
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${l.name}`}
                        checked={selected.has(l.id)}
                        onChange={() => toggle(l.id)}
                        className="h-4 w-4 accent-brand-500"
                      />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="font-bold">{l.name}</div>
                      <div className="text-xs text-ink-muted">{l.title ?? "—"}</div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="font-medium">{l.company ?? "—"}</div>
                      <div className="text-xs text-ink-muted">{l.location ?? ""}</div>
                    </td>
                    <td className="px-3 py-3.5 text-ink-soft">{SOURCE_NAMES[l.source] ?? l.source}</td>
                    <td className="px-3 py-3.5"><StatusChip status={l.status} /></td>
                    <td className="px-3 py-3.5">
                      {l.enrichment ? (
                        <span className="chip bg-pastel-lavender text-brand-700">🧠 Ready</span>
                      ) : (
                        <span className="text-xs text-ink-faint">Not enriched</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <IntentBadge label={l.intent_label} score={l.intent_score} />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-ink-muted">
                      No leads match “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <LeadDrawer
        lead={drawerLead}
        onClose={() => setDrawerId(null)}
        onCoach={(l) => { setDrawerId(null); setCoachLead(l); }}
      />
      <CoachDrawer lead={coachLead} onClose={() => setCoachLead(null)} />
    </div>
  );
}
