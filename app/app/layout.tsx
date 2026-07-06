import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { ProcessPoller } from "@/components/ProcessPoller";
import { aiLive, aiProvider } from "@/lib/ai";
import { emailLive } from "@/lib/email";
import Link from "next/link";

const AI_LABEL: Record<string, string> = { groq: "Groq", anthropic: "Claude", demo: "demo" };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ai = aiLive();
  const provider = aiProvider();
  const email = emailLive();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppNav orgName={user.orgName} userName={user.fullName} isAdmin={user.role === "admin"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-2 px-8 pb-2 pt-5">
          <span
            className={`chip mr-auto ${user.mode === "demo" ? "bg-pastel-lavender text-brand-700" : "bg-pastel-mint text-accent-mint"}`}
            title={user.mode === "demo" ? "Demo workspace — everything simulated, zero API spend" : "Live workspace — real data, real sends"}
          >
            {user.mode === "demo" ? "🎪 Demo workspace" : "⚡ Live workspace"}
          </span>
          <span
            className={`chip ${ai ? "bg-pastel-mint text-accent-mint" : "bg-white text-ink-muted shadow-soft"}`}
            title={ai ? `${AI_LABEL[provider]} connected — AI runs live` : "Demo engine on — plug in a key to go live"}
          >
            {ai ? <span className="live-dot" /> : "◐"} AI {ai ? AI_LABEL[provider] : "demo"}
          </span>
          <span
            className={`chip ${email ? "bg-pastel-mint text-accent-mint" : "bg-white text-ink-muted shadow-soft"}`}
            title={email ? "Resend connected — emails really send" : "Sends simulated — plug in Resend to go live"}
          >
            {email ? <span className="live-dot" /> : "◐"} Email {email ? "live" : "demo"}
          </span>
          <Link
            href="/app/credits"
            className="chip bg-white text-brand-700 shadow-soft transition-all duration-200 hover:shadow-lift hover:-translate-y-px"
            title="Your credit balance — every action is metered"
          >
            🪙 <span className="text-sm font-extrabold tabular-nums">{user.credits.toLocaleString()}</span>
          </Link>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto px-8 pb-10 pt-3">
          {user.credits < 50 && (
            <div className="rise mx-auto mb-4 flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-2xl bg-pastel-lemon px-5 py-3 text-sm font-semibold text-accent-lemon">
              <span>🪫 Running low — {user.credits} credits left. Campaigns pause when the tank hits empty.</span>
              <Link href="/app/credits" className="btn-secondary btn-sm">Top up</Link>
            </div>
          )}
          {children}
        </main>
      </div>
      <ProcessPoller />
    </div>
  );
}
