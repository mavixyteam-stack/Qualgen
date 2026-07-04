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
        <header className="flex items-center justify-between gap-4 border-b border-ink/5 bg-white/70 px-8 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <span
              className={`chip ${ai ? "bg-pastel-mint text-accent-mint" : "bg-pastel-lemon text-accent-lemon"}`}
              title={ai ? "Claude API connected — AI runs live" : "No AI key set — the built-in demo engine generates all intelligence"}
            >
              {ai ? "● AI: Live" : "◐ AI: Demo engine"}
            </span>
            <span
              className={`chip ${email ? "bg-pastel-mint text-accent-mint" : "bg-pastel-lemon text-accent-lemon"}`}
              title={email ? "Resend connected — emails really send" : "No email key set — sends & engagement are simulated"}
            >
              {email ? "● Email: Live" : "◐ Email: Simulated"}
            </span>
          </div>
          <Link
            href="/app/credits"
            className="chip bg-pastel-lavender text-brand-700 transition hover:bg-brand-200"
            title="Credit balance — every action deducts credits"
          >
            🪙 <span className="text-sm font-bold">{user.credits.toLocaleString()}</span> credits
          </Link>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
      <ProcessPoller />
    </div>
  );
}
