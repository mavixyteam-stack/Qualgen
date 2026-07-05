import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { ProcessPoller } from "@/components/ProcessPoller";
import { aiLive } from "@/lib/ai";
import { emailLive } from "@/lib/email";
import Link from "next/link";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ai = aiLive();
  const email = emailLive();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppNav orgName={user.orgName} userName={user.fullName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-2 px-8 pb-2 pt-5">
          <span
            className={`chip ${ai ? "bg-pastel-mint text-accent-mint" : "bg-white text-ink-muted shadow-soft"}`}
            title={ai ? "Claude connected — AI runs live" : "Demo engine on — plug in a key to go live"}
          >
            {ai ? <span className="live-dot" /> : "◐"} AI {ai ? "live" : "demo"}
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
        <main className="min-w-0 flex-1 overflow-y-auto px-8 pb-10 pt-3">{children}</main>
      </div>
      <ProcessPoller />
    </div>
  );
}
