"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconCoin, IconGear, IconGrid, IconLogout, IconRocket, IconSearch, IconTarget,
} from "./Icons";

const LINKS = [
  { href: "/app", label: "Overview", icon: IconGrid, chip: "bg-pastel-lavender text-brand-600" },
  { href: "/app/leads", label: "Leads", icon: IconTarget, chip: "bg-pastel-peach text-accent-peach" },
  { href: "/app/campaigns", label: "Campaigns", icon: IconRocket, chip: "bg-pastel-sky text-accent-sky" },
  { href: "/app/credits", label: "Credits", icon: IconCoin, chip: "bg-pastel-lemon text-accent-lemon" },
  { href: "/app/settings", label: "Settings", icon: IconGear, chip: "bg-pastel-mint text-accent-mint" },
];

export function AppNav({
  orgName,
  userName,
  isAdmin,
}: {
  orgName: string;
  userName: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="m-3 mr-0 flex w-[248px] shrink-0 flex-col rounded-3xl bg-white shadow-soft">
      <Link href="/app" className="flex items-center gap-2.5 px-6 pb-5 pt-7">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-black text-white shadow-glow">M</span>
        <span className="text-lg font-extrabold tracking-tight">Mavixy <span className="text-brand-500">AI</span></span>
      </Link>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-2.5 rounded-2xl bg-surface-sunken px-4 py-2.5 text-sm text-ink-faint">
          <IconSearch size={16} />
          <span>Search</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-4">
        {isAdmin && (
          <Link
            href="/admin"
            className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
              pathname.startsWith("/admin")
                ? "bg-ink text-white"
                : "text-ink-soft hover:bg-surface-hover hover:translate-x-0.5"
            }`}
          >
            <span className={`icon-chip h-9 w-9 ${pathname.startsWith("/admin") ? "bg-white/15 text-white" : "bg-ink text-white"}`}>
              🛡️
            </span>
            Control tower
          </Link>
        )}
        {LINKS.map((l) => {
          const active = l.href === "/app" ? pathname === "/app" : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                active
                  ? "bg-pastel-lavender text-brand-700"
                  : "text-ink-soft hover:bg-surface-hover hover:translate-x-0.5"
              }`}
            >
              <span className={`icon-chip h-9 w-9 group-hover:scale-105 ${active ? "bg-white text-brand-600 shadow-soft" : l.chip}`}>
                <Icon size={17} />
              </span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-sunken p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-black text-white">
            {userName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{userName}</div>
            <div className="truncate text-xs text-ink-muted">{orgName}</div>
          </div>
          <button
            onClick={logout}
            className="rounded-xl p-2 text-ink-muted transition hover:bg-white hover:text-accent-pink"
            title="Sign out"
            aria-label="Sign out"
          >
            <IconLogout size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
