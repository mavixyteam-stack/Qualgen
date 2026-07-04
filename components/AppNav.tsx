"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/app", label: "Dashboard", emoji: "📊" },
  { href: "/app/leads", label: "Leads", emoji: "🎯" },
  { href: "/app/campaigns", label: "Campaigns", emoji: "🚀" },
  { href: "/app/credits", label: "Credits", emoji: "🪙" },
  { href: "/app/settings", label: "Settings", emoji: "⚙️" },
];

export function AppNav({ orgName, userName }: { orgName: string; userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-ink/5 bg-white/70 backdrop-blur">
      <Link href="/app" className="flex items-center gap-2.5 px-6 pb-6 pt-7">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-500 text-lg font-black text-white">M</span>
        <span className="text-lg font-extrabold tracking-tight">Mavixy</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {LINKS.map((l) => {
          const active = l.href === "/app" ? pathname === "/app" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-pastel-lavender text-brand-700"
                  : "text-ink-soft hover:bg-surface-sunken"
              }`}
            >
              <span aria-hidden>{l.emoji}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink/5 p-4">
        <div className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pastel-peach text-sm font-bold text-accent-peach">
            {userName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{userName}</div>
            <div className="truncate text-xs text-ink-muted">{orgName}</div>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost btn-md mt-2 w-full justify-start text-xs">
          ← Sign out
        </button>
      </div>
    </aside>
  );
}
