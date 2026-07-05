"use client";

import { useState } from "react";
import Link from "next/link";
import { ActivityChart, type ActivityPoint } from "@/components/charts/ActivityChart";
import { IntentBars } from "@/components/charts/IntentBars";
import { CountUp, IntentBadge } from "@/components/ui";
import { SeedButton } from "@/components/SeedButton";
import { CoachDrawer, type CoachLead } from "@/components/coach/CoachDrawer";
import {
  IconArrowUpRight, IconChat, IconEye, IconFlame, IconMail, IconRocket, IconSpark, IconTarget,
} from "@/components/Icons";

export type DashboardData = {
  firstName: string;
  demoSeeded: boolean;
  stats: { leads: number; sent: number; openRate: number; replies: number; hot: number; ready: number };
  intentCounts: Record<string, number>;
  activity: ActivityPoint[];
  queue: {
    id: string; name: string; title: string | null; company: string | null;
    intent_score: number | null; intent_label: string | null;
    hasCoach: boolean; lastReply: string | null;
  }[];
  events: { type: string; description: string; at: string }[];
};

const EVENT_ICONS: Record<string, string> = {
  email_sent: "📤", email_opened: "👀", reply_received: "💬", intent_scored: "🌡️",
  lead_enriched: "🧠", leads_imported: "📄", leads_discovered: "🎯",
  campaign_created: "📝", campaign_launched: "🚀", campaign_completed: "🏁",
  send_failed: "⚠️", workspace_seeded: "⚡", coach_generated: "🏆",
};

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date())
  );
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardView({ data }: { data: DashboardData }) {
  const [coachLead, setCoachLead] = useState<CoachLead | null>(null);
  const { stats } = data;
  const topPick = data.queue[0] ?? null;
  const isEmpty = stats.leads === 0 && !data.demoSeeded;

  const TILES = [
    { label: "Buyers found", value: stats.leads, icon: IconTarget, chip: "bg-pastel-lavender text-brand-600", href: "/app/leads" },
    { label: "Emails out the door", value: stats.sent, icon: IconMail, chip: "bg-pastel-sky text-accent-sky", href: "/app/campaigns" },
    { label: "Open rate", value: stats.openRate, suffix: "%", icon: IconEye, chip: "bg-pastel-mint text-accent-mint", href: "/app/campaigns" },
    { label: "Replies", value: stats.replies, icon: IconChat, chip: "bg-pastel-lemon text-accent-lemon", href: "/app/campaigns" },
    { label: "Warm+ buyers", value: stats.hot, icon: IconFlame, chip: "bg-pastel-peach text-accent-peach", href: "/app/leads" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* greeting */}
      <div className="rise flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {greeting()}, {data.firstName} <span className="inline-block origin-[70%_70%] hover:animate-none">👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {stats.hot > 0 ? (
              <>You have <span className="font-bold text-accent-peach">{stats.hot} buyer{stats.hot === 1 ? "" : "s"} heating up</span>
                {stats.ready > 0 && <> — <span className="font-bold text-accent-mint">{stats.ready} ready to talk</span></>}. Go get &rsquo;em. 🎯</>
            ) : stats.leads > 0 ? (
              <>Your pipeline is warming. Launch a campaign and watch the replies roll in.</>
            ) : (
              <>Fresh workspace, endless possibilities. Let&rsquo;s find your first buyers.</>
            )}
          </p>
        </div>
        <Link href="/app/campaigns/new" className="btn-primary btn-md">
          <IconRocket size={16} /> New campaign
        </Link>
      </div>

      {isEmpty ? (
        <div className="card rise rise-2 mt-8 flex flex-col items-center gap-4 px-8 py-16 text-center">
          <div className="float-slow flex h-16 w-16 items-center justify-center rounded-3xl bg-pastel-lavender text-3xl">⚡</div>
          <h2 className="text-xl font-extrabold">It&rsquo;s quiet in here… too quiet.</h2>
          <p className="max-w-md text-sm text-ink-muted">
            Load the sample workspace and get 14 enriched buyers, a finished campaign, live intent
            scores — the whole show, in one click. Or start fresh with your own leads.
          </p>
          <SeedButton />
          <Link href="/app/leads" className="btn-secondary btn-md">🎯 Bring my own leads</Link>
        </div>
      ) : (
        <>
          {/* stat cards */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {TILES.map((t, i) => {
              const Icon = t.icon;
              return (
                <Link key={t.label} href={t.href} className={`stat-card card-hover rise rise-${i + 1}`}>
                  <span className={`icon-chip h-10 w-10 ${t.chip}`}><Icon size={18} /></span>
                  <div>
                    <div className="text-[26px] font-extrabold leading-none tracking-tight">
                      <CountUp value={t.value} suffix={t.suffix ?? ""} />
                    </div>
                    <div className="mt-1.5 text-xs font-semibold text-ink-muted">{t.label}</div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
            {/* left column */}
            <div className="space-y-6">
              {/* warm queue */}
              <div className="card rise rise-2 overflow-hidden">
                <div className="flex items-center justify-between px-6 pb-2 pt-6">
                  <h2 className="text-lg font-extrabold tracking-tight">Warm queue</h2>
                  <Link href="/app/leads" className="icon-chip h-8 w-8 bg-surface-sunken text-ink-muted transition hover:bg-pastel-lavender hover:text-brand-600" aria-label="All leads">
                    <IconArrowUpRight size={15} />
                  </Link>
                </div>
                {data.queue.length === 0 ? (
                  <p className="px-6 pb-8 pt-4 text-center text-sm text-ink-muted">
                    No scored buyers yet — launch a campaign and the AI will line them up here, hottest first.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table-base min-w-[540px]">
                      <thead>
                        <tr className="border-b border-ink/5">
                          <th className="th pl-6">Buyer</th>
                          <th className="th">Intent</th>
                          <th className="th">Score</th>
                          <th className="th pr-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.queue.map((l) => (
                          <tr key={l.id} className="border-b border-ink/5 transition-colors last:border-0 hover:bg-surface-hover">
                            <td className="py-3.5 pl-6">
                              <div className="font-bold">{l.name}</div>
                              <div className="text-xs text-ink-muted">
                                {[l.title, l.company].filter(Boolean).join(" · ")}
                              </div>
                            </td>
                            <td className="py-3.5"><IntentBadge label={l.intent_label} /></td>
                            <td className="py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-extrabold tabular-nums">{l.intent_score}</span>
                                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-sunken">
                                  <div className="grow-bar h-full rounded-full bg-brand-gradient" style={{ width: `${l.intent_score ?? 0}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 pr-6 text-right">
                              <button onClick={() => setCoachLead(l)} className="btn-primary btn-sm">
                                <IconSpark size={13} /> {l.hasCoach ? "Playbook" : "Coach me"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* activity chart */}
              <div className="card rise rise-3 p-6">
                <h2 className="mb-4 text-lg font-extrabold tracking-tight">Outreach — last 14 days</h2>
                <ActivityChart data={data.activity} />
              </div>
            </div>

            {/* right column */}
            <div className="space-y-6">
              {/* top pick */}
              {topPick && (
                <div className="rise rise-2 rounded-3xl bg-coach-gradient p-6 text-white shadow-glow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-white/80">
                      <IconSpark size={14} /> Mavixy&rsquo;s top pick
                    </div>
                    <button
                      onClick={() => setCoachLead(topPick)}
                      className="icon-chip h-8 w-8 bg-white/15 text-white transition hover:bg-white/25"
                      aria-label="Open playbook"
                    >
                      <IconArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <div className="font-extrabold">{topPick.name}</div>
                    <div className="text-xs text-white/70">{[topPick.title, topPick.company].filter(Boolean).join(" · ")}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                        <div className="grow-bar h-full rounded-full bg-white/90" style={{ width: `${topPick.intent_score ?? 0}%` }} />
                      </div>
                      <span className="text-xs font-extrabold tabular-nums">{topPick.intent_score}%</span>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-white/85">
                      {topPick.lastReply
                        ? <>They said: <em>&ldquo;{topPick.lastReply.length > 80 ? topPick.lastReply.slice(0, 80) + "…" : topPick.lastReply}&rdquo;</em></>
                        : "Highest buying intent in your pipeline right now."}
                    </p>
                  </div>
                  <button onClick={() => setCoachLead(topPick)} className="btn btn-md mt-4 w-full bg-white text-brand-700 hover:bg-brand-50">
                    🏆 Open closing playbook
                  </button>
                </div>
              )}

              {/* buyers on your site — pixel teaser */}
              <div className="card rise rise-3 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold tracking-tight">Buyers on your site</h2>
                  <span className="chip bg-pastel-lemon text-accent-lemon">Soon</span>
                </div>
                <p className="mt-2 text-sm text-ink-muted">
                  Drop one line of code on your website and companies browsing your pricing page
                  show up here — warm before you ever say hi. 👀
                </p>
                <div className="mt-4 space-y-2 opacity-60" aria-hidden>
                  {["Acme Corp viewed /pricing · 3×", "NorthPeak Labs viewed /product", "BlueOrbit read your case study"].map((t) => (
                    <div key={t} className="rounded-2xl bg-surface-sunken px-4 py-2.5 text-xs font-semibold text-ink-soft blur-[1.5px]">
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* intent pipeline */}
              <div className="card rise rise-4 p-6">
                <h2 className="mb-1 text-lg font-extrabold tracking-tight">Intent pipeline</h2>
                <p className="mb-5 text-xs text-ink-muted">Where your buyers stand, cold to close</p>
                <IntentBars counts={data.intentCounts} />
              </div>

              {/* activity feed */}
              <div className="card rise rise-5 p-6">
                <h2 className="mb-4 text-lg font-extrabold tracking-tight">Live activity</h2>
                {data.events.length === 0 ? (
                  <p className="py-4 text-center text-sm text-ink-muted">All quiet — for now.</p>
                ) : (
                  <ul className="space-y-3.5">
                    {data.events.map((e, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 shrink-0">{EVENT_ICONS[e.type] ?? "•"}</span>
                        <span className="min-w-0 flex-1 leading-snug">{e.description}</span>
                        <span className="shrink-0 text-xs text-ink-faint">{timeAgo(e.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <CoachDrawer lead={coachLead} onClose={() => setCoachLead(null)} />
    </div>
  );
}
