import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { aiLive, aiProvider } from "@/lib/ai";
import { appUrl, emailLive } from "@/lib/email";
import { apolloLive } from "@/lib/apollo";
import { pdlLive } from "@/lib/pdl";
import { PixelSnippet } from "@/components/PixelSnippet";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Mavixy" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const provider = aiProvider();
  const providerName = provider === "groq" ? "Groq (Llama 3.3)" : provider === "anthropic" ? "Claude" : "AI";

  const integrations = [
    {
      name: "AI engine",
      emoji: "🧠",
      live: aiLive(),
      env: "GROQ_API_KEY",
      liveNote: `${providerName} generates enrichment, sequences, intent scores and closing playbooks.`,
      demoNote: "The built-in demo engine generates all intelligence — free, deterministic, demo-safe.",
      how: "Free daily limits at console.groq.com (fast Llama models) — or set ANTHROPIC_API_KEY for Claude.",
    },
    {
      name: "Email delivery (Resend)",
      emoji: "📤",
      live: emailLive(),
      env: "RESEND_API_KEY",
      liveNote: "Campaign emails really send, with open tracking.",
      demoNote: "Sends are simulated with realistic opens & replies so demos stay alive.",
      how: "Free tier at resend.com — 3,000 emails/month, no card needed.",
    },
    {
      name: "Lead database (People Data Labs)",
      emoji: "🎯",
      live: pdlLive() || apolloLive(),
      env: "PDL_API_KEY",
      liveNote: pdlLive()
        ? "AI search pulls real prospects from People Data Labs (3B+ profiles)."
        : "AI search pulls real prospects from Apollo.io.",
      demoNote: "AI search generates realistic sample prospects matching your ICP.",
      how: "Free tier at peopledatalabs.com — 100 lookups/month, no card needed.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-ink-muted">Workspace, account and integrations.</p>

      <div className="card mt-6 p-6">
        <h2 className="text-lg font-bold tracking-tight">Workspace</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="label">Organization</dt>
            <dd className="font-semibold">{user.orgName}</dd>
          </div>
          <div>
            <dt className="label">Your account</dt>
            <dd className="font-semibold">{user.fullName}</dd>
            <dd className="text-sm text-ink-muted">{user.email}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-bold tracking-tight">Integrations</h2>
        <p className="mt-1 text-sm text-ink-muted">
          The POC runs perfectly with zero keys (demo mode). Add free keys on your host to flip
          each engine live — no code changes needed.
        </p>
        <div className="mt-4 space-y-4">
          {integrations.map((i) => (
            <div key={i.name} className="card flex flex-wrap items-start justify-between gap-4 p-6">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-sunken text-xl">
                  {i.emoji}
                </span>
                <div className="min-w-0">
                  <div className="font-bold">{i.name}</div>
                  <p className="mt-0.5 text-sm text-ink-muted">{i.live ? i.liveNote : i.demoNote}</p>
                  {!i.live && (
                    <p className="mt-1.5 text-xs text-ink-faint">
                      To go live: {i.how} Then set <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono">{i.env}</code> in your hosting environment.
                    </p>
                  )}
                </div>
              </div>
              <span className={`chip shrink-0 ${i.live ? "bg-pastel-mint text-accent-mint" : "bg-pastel-lemon text-accent-lemon"}`}>
                {i.live ? "● Live" : "◐ Demo mode"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="text-lg font-extrabold tracking-tight">👀 Website-visitor pixel</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Paste this one line before <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-xs">&lt;/body&gt;</code> on
          your website. Companies browsing your pages appear on the dashboard — warm buyers, before they ever fill a form.
          {" "}Company names resolve automatically once <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-xs">IPINFO_TOKEN</code> is
          connected (free tier).
        </p>
        <PixelSnippet snippet={`<script async src="${appUrl()}/api/px/script?o=${user.orgId}"></script>`} />
      </div>

      <div className="card mt-6 p-6">
        <h2 className="text-lg font-bold tracking-tight">Coming in the MVP</h2>
        <ul className="mt-3 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
          <li>👥 Team invites & roles</li>
          <li>💳 Stripe credit purchases</li>
          <li>🔀 Conditional sequence branching</li>
          <li>📈 Advanced intent dashboards</li>
          <li>🔔 Low-credit alerts & auto-recharge</li>
          <li>🛠️ Admin panel</li>
        </ul>
      </div>
    </div>
  );
}
