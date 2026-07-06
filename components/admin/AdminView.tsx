"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CountUp, Spinner } from "@/components/ui";

export type AdminData = {
  stats: {
    orgs: number; users: number; leads: number; campaigns: number; sent: number; replies: number;
    outstandingCredits: number; consumedCredits: number; revenueEq: number; cogs: number; margin: number;
  };
  providers: {
    key: string; name: string; configured: boolean; enabled: boolean;
    unitCost: number; units: number; unitsMonth: number; costInr: number;
    lastUsed: string | null; quota: number | null;
  }[];
  orgs: {
    id: string; name: string; mode: "demo" | "live"; credits: number; members: number;
    leads: number; campaigns: number; consumed: number; lastActive: string | null; createdAt: string;
  }[];
  transactions: { orgName: string; delta: number; action: string; description: string; at: string }[];
};

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function AdminView({ data }: { data: AdminData }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(key: string, url: string, body: Record<string, unknown>) {
    setBusy(key);
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const resData = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(resData.error || "Action failed."); return; }
    router.refresh();
  }

  const s = data.stats;
  const TILES = [
    { label: "Workspaces", value: s.orgs, chip: "bg-pastel-lavender text-brand-600" },
    { label: "Users", value: s.users, chip: "bg-pastel-sky text-accent-sky" },
    { label: "Leads on platform", value: s.leads, chip: "bg-pastel-peach text-accent-peach" },
    { label: "Emails sent", value: s.sent, chip: "bg-pastel-mint text-accent-mint" },
    { label: "Replies", value: s.replies, chip: "bg-pastel-lemon text-accent-lemon" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="rise">
        <h1 className="text-3xl font-extrabold tracking-tight">Control tower</h1>
        <p className="mt-1 text-sm text-ink-muted">Users, credits, providers and money — the whole platform at a glance.</p>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl bg-pastel-pink px-4 py-3 text-sm font-semibold text-accent-pink">{error}</p>
      )}

      {/* platform stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {TILES.map((t, i) => (
          <div key={t.label} className={`stat-card rise rise-${i + 1}`}>
            <span className={`icon-chip h-10 w-10 text-lg ${t.chip}`}>◆</span>
            <div>
              <div className="text-[24px] font-extrabold leading-none"><CountUp value={t.value} /></div>
              <div className="mt-1.5 text-xs font-semibold text-ink-muted">{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* money strip */}
      <div className="rise rise-2 mt-4 grid gap-4 sm:grid-cols-4">
        <div className="rounded-3xl bg-ink p-5 text-white">
          <div className="text-[11px] font-bold uppercase tracking-[.12em] text-white/60">Credits consumed</div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">{s.consumedCredits.toLocaleString()}</div>
          <div className="text-xs text-white/60">≈ ₹{s.revenueEq.toLocaleString()} revenue-equivalent</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] font-bold uppercase tracking-[.12em] text-ink-muted">Provider COGS</div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">₹{s.cogs.toLocaleString()}</div>
          <div className="text-xs text-ink-muted">all-time, from the cost ledger</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] font-bold uppercase tracking-[.12em] text-ink-muted">Blended margin</div>
          <div className={`mt-1 text-2xl font-extrabold tabular-nums ${s.margin >= 55 ? "text-accent-mint" : "text-accent-peach"}`}>{s.margin}%</div>
          <div className="text-xs text-ink-muted">target ≥ 60%</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] font-bold uppercase tracking-[.12em] text-ink-muted">Credits outstanding</div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">{s.outstandingCredits.toLocaleString()}</div>
          <div className="text-xs text-ink-muted">unspent client balance (liability)</div>
        </div>
      </div>

      {/* providers */}
      <div className="card rise rise-3 mt-6 overflow-hidden">
        <div className="px-6 pb-2 pt-6">
          <h2 className="text-lg font-extrabold tracking-tight">Provider APIs</h2>
          <p className="text-xs text-ink-muted">Kill-switches apply instantly — disabled providers fall back to the demo engine, clients never see an error.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base min-w-[760px]">
            <thead>
              <tr className="border-b border-ink/5">
                <th className="th pl-6">Provider</th>
                <th className="th">Status</th>
                <th className="th">Usage (month)</th>
                <th className="th">Est. cost</th>
                <th className="th">Last used</th>
                <th className="th pr-6 text-right">Switch</th>
              </tr>
            </thead>
            <tbody>
              {data.providers.map((p) => {
                const quotaPct = p.quota ? Math.min(100, Math.round((p.unitsMonth / p.quota) * 100)) : null;
                return (
                  <tr key={p.key} className="border-b border-ink/5 last:border-0">
                    <td className="py-3.5 pl-6">
                      <div className="font-bold">{p.name}</div>
                      <div className="text-xs text-ink-muted">₹{p.unitCost}/unit</div>
                    </td>
                    <td className="py-3.5">
                      {!p.configured ? (
                        <span className="chip bg-surface-sunken text-ink-muted">No key</span>
                      ) : p.enabled ? (
                        <span className="chip bg-pastel-mint text-accent-mint"><span className="live-dot" /> Live</span>
                      ) : (
                        <span className="chip bg-pastel-pink text-accent-pink">⏸ Disabled</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span className="font-bold tabular-nums">{p.unitsMonth}</span>
                      {p.quota && (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-sunken">
                            <div
                              className={`h-full rounded-full ${quotaPct! >= 80 ? "bg-accent-peach" : "bg-brand-gradient"}`}
                              style={{ width: `${quotaPct}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${quotaPct! >= 80 ? "text-accent-peach" : "text-ink-muted"}`}>
                            {quotaPct}% of {p.quota.toLocaleString()} free
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 tabular-nums">₹{p.costInr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-3.5 text-xs text-ink-muted">{timeAgo(p.lastUsed)}</td>
                    <td className="py-3.5 pr-6 text-right">
                      {p.configured && (
                        <button
                          onClick={() => call(`prov-${p.key}`, "/api/admin/provider", { provider: p.key, enabled: !p.enabled })}
                          className={p.enabled ? "btn-ghost btn-sm text-accent-pink" : "btn-primary btn-sm"}
                        >
                          {busy === `prov-${p.key}` ? <Spinner /> : p.enabled ? "Disable" : "Enable"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* workspaces */}
      <div className="card rise rise-4 mt-6 overflow-hidden">
        <div className="px-6 pb-2 pt-6">
          <h2 className="text-lg font-extrabold tracking-tight">Workspaces</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base min-w-[820px]">
            <thead>
              <tr className="border-b border-ink/5">
                <th className="th pl-6">Workspace</th>
                <th className="th">Mode</th>
                <th className="th">Credits</th>
                <th className="th">Consumed</th>
                <th className="th">Leads</th>
                <th className="th">Campaigns</th>
                <th className="th">Active</th>
                <th className="th pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.orgs.map((o) => (
                <tr key={o.id} className="border-b border-ink/5 last:border-0 hover:bg-surface-hover">
                  <td className="py-3.5 pl-6">
                    <div className="font-bold">{o.name}</div>
                    <div className="text-xs text-ink-muted">{o.members} member{o.members === 1 ? "" : "s"}</div>
                  </td>
                  <td className="py-3.5">
                    <span className={`chip ${o.mode === "demo" ? "bg-pastel-lavender text-brand-700" : "bg-pastel-mint text-accent-mint"}`}>
                      {o.mode === "demo" ? "🎪 Demo" : "⚡ Live"}
                    </span>
                  </td>
                  <td className="py-3.5 font-bold tabular-nums">{o.credits.toLocaleString()}</td>
                  <td className="py-3.5 tabular-nums text-ink-soft">{o.consumed.toLocaleString()}</td>
                  <td className="py-3.5 tabular-nums">{o.leads}</td>
                  <td className="py-3.5 tabular-nums">{o.campaigns}</td>
                  <td className="py-3.5 text-xs text-ink-muted">{timeAgo(o.lastActive)}</td>
                  <td className="py-3.5 pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => call(`grant-${o.id}`, "/api/admin/credits", { orgId: o.id, amount: 500 })}
                        className="btn-secondary btn-sm"
                        title="Grant 500 credits"
                      >
                        {busy === `grant-${o.id}` ? <Spinner /> : "+500 cr"}
                      </button>
                      <button
                        onClick={() => call(`mode-${o.id}`, "/api/admin/org-mode", { orgId: o.id, mode: o.mode === "demo" ? "live" : "demo" })}
                        className="btn-ghost btn-sm"
                        title="Toggle demo/live mode"
                      >
                        {busy === `mode-${o.id}` ? <Spinner /> : o.mode === "demo" ? "→ Live" : "→ Demo"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* billing feed */}
      <div className="card rise rise-5 mt-6 p-6">
        <h2 className="mb-4 text-lg font-extrabold tracking-tight">Billing activity</h2>
        <ul className="divide-y divide-ink/5">
          {data.transactions.map((t, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <span className="font-bold">{t.orgName}</span>
                <span className="text-ink-muted"> · {t.description}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={`font-bold tabular-nums ${t.delta > 0 ? "text-accent-mint" : "text-ink"}`}>
                  {t.delta > 0 ? "+" : ""}{t.delta}
                </span>
                <span className="text-xs text-ink-faint">{timeAgo(t.at)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
