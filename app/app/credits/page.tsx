import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql, ensureSchema } from "@/lib/db";
import { TopupButton } from "@/components/TopupButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Credits — Mavixy" };

const ACTION_META: Record<string, { name: string; emoji: string }> = {
  discover: { name: "Lead discovery", emoji: "🎯" },
  enrich: { name: "AI enrichment", emoji: "🧠" },
  personalize: { name: "AI sequences", emoji: "✍️" },
  email_send: { name: "Emails sent", emoji: "📤" },
  intent_score: { name: "Intent scoring", emoji: "🌡️" },
  coach: { name: "Closing playbooks", emoji: "🏆" },
  signup_bonus: { name: "Welcome bonus", emoji: "🎁" },
  poc_topup: { name: "Demo top-up", emoji: "⚡" },
};

const RATE_CARD = [
  { action: "Lead discovery (AI search)", cost: "1 credit / lead" },
  { action: "AI enrichment", cost: "3 credits / lead" },
  { action: "AI sequence generation", cost: "3 credits / lead" },
  { action: "Email send", cost: "1 credit / email" },
  { action: "Intent scoring", cost: "1 credit / reply" },
  { action: "Closing playbook (Sales Coach)", cost: "2 credits / lead" },
  { action: "CSV import", cost: "Free" },
];

const PACKS = [
  { name: "Starter", credits: "500", price: "₹599", note: "Solo founders" },
  { name: "Growth", credits: "2,000", price: "₹1,999", note: "Small teams", featured: true },
  { name: "Scale", credits: "5,000", price: "₹4,499", note: "Active sales teams" },
];

export default async function CreditsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await ensureSchema();

  const [usage, transactions] = await Promise.all([
    sql`select action, sum(-delta)::int as spent
        from credit_transactions
        where org_id = ${user.orgId} and delta < 0
        group by action order by spent desc`,
    sql`select delta, balance_after, action, description, created_at
        from credit_transactions
        where org_id = ${user.orgId}
        order by created_at desc limit 40`,
  ]);

  const totalSpent = usage.reduce((s, u) => s + u.spent, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Credits</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Pay per action — every search, enrichment and send is metered.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          {/* balance */}
          <div className="card bg-brand-500 p-7 text-white">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/70">Balance</div>
            <div className="mt-1 text-5xl font-black tracking-tight">
              {user.credits.toLocaleString()}
            </div>
            <div className="mt-1 text-sm text-white/80">credits available</div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-xs text-white/70">{totalSpent.toLocaleString()} spent so far</span>
              <TopupButton />
            </div>
          </div>

          {/* usage by action */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-bold tracking-tight">Usage by action</h2>
            {usage.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-muted">No credits spent yet.</p>
            ) : (
              <ul className="space-y-3">
                {usage.map((u) => {
                  const meta = ACTION_META[u.action] ?? { name: u.action, emoji: "•" };
                  return (
                    <li key={u.action} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span>{meta.emoji}</span> {meta.name}
                      </span>
                      <span className="font-bold tabular-nums">{u.spent.toLocaleString()} cr</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* rate card */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-bold tracking-tight">Rate card</h2>
            <ul className="divide-y divide-ink/5 text-sm">
              {RATE_CARD.map((r) => (
                <li key={r.action} className="flex items-center justify-between py-2.5">
                  <span>{r.action}</span>
                  <span className={`font-semibold ${r.cost === "Free" ? "text-accent-mint" : ""}`}>{r.cost}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {/* packs */}
          <div className="card p-6">
            <h2 className="text-lg font-bold tracking-tight">Credit packs</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Online purchase (Stripe) ships in the MVP — packs shown for pre-sales.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PACKS.map((p) => (
                <div key={p.name} className={`rounded-3xl border p-5 text-center ${p.featured ? "border-brand-400 bg-brand-50/60" : "border-ink/10"}`}>
                  <div className="text-sm font-bold">{p.name}</div>
                  <div className="mt-2 text-2xl font-black">{p.price}</div>
                  <div className="text-xs font-semibold text-brand-600">{p.credits} credits</div>
                  <div className="mt-1 text-xs text-ink-muted">{p.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* transactions */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-bold tracking-tight">Transaction log</h2>
            {transactions.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-muted">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink/5 text-xs uppercase tracking-wider text-ink-muted">
                      <th className="py-2.5 pr-3 font-semibold">Action</th>
                      <th className="py-2.5 pr-3 text-right font-semibold">Credits</th>
                      <th className="py-2.5 text-right font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={i} className="border-b border-ink/5 last:border-0">
                        <td className="py-2.5 pr-3">
                          <div className="font-medium">{t.description}</div>
                          <div className="text-xs text-ink-faint">
                            {t.created_at.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </td>
                        <td className={`py-2.5 pr-3 text-right font-bold tabular-nums ${t.delta > 0 ? "text-accent-mint" : "text-ink"}`}>
                          {t.delta > 0 ? "+" : ""}{t.delta}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-ink-muted">{t.balance_after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
