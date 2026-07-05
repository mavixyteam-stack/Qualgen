"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconX } from "./Icons";

/* ------------------------------- Intent badge ------------------------------- */

const INTENT_STYLES: Record<string, { bg: string; text: string; dot: string; name: string }> = {
  cold: { bg: "bg-pastel-sky", text: "text-accent-sky", dot: "bg-accent-sky", name: "Cold" },
  warm: { bg: "bg-pastel-lemon", text: "text-accent-lemon", dot: "bg-accent-lemon", name: "Warm" },
  hot: { bg: "bg-pastel-peach", text: "text-accent-peach", dot: "bg-accent-peach", name: "Hot" },
  ready: { bg: "bg-pastel-mint", text: "text-accent-mint", dot: "bg-accent-mint", name: "Sales Ready" },
};

export function IntentBadge({ label, score }: { label?: string | null; score?: number | null }) {
  if (!label) {
    return <span className="chip bg-surface-sunken text-ink-muted">Not scored yet</span>;
  }
  const s = INTENT_STYLES[label] ?? INTENT_STYLES.cold;
  return (
    <span className={`chip ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.name}
      {typeof score === "number" && <span className="opacity-70 tabular-nums">{score}</span>}
    </span>
  );
}

/* -------------------------------- Status chip -------------------------------- */

const STATUS_STYLES: Record<string, { bg: string; text: string; name: string }> = {
  new: { bg: "bg-surface-sunken", text: "text-ink-soft", name: "New" },
  enriched: { bg: "bg-pastel-lavender", text: "text-brand-700", name: "Enriched" },
  contacted: { bg: "bg-pastel-sky", text: "text-accent-sky", name: "Contacted" },
  replied: { bg: "bg-pastel-mint", text: "text-accent-mint", name: "Replied" },
  draft: { bg: "bg-surface-sunken", text: "text-ink-soft", name: "Draft" },
  active: { bg: "bg-pastel-mint", text: "text-accent-mint", name: "Live" },
  completed: { bg: "bg-pastel-lavender", text: "text-brand-700", name: "Completed" },
  scheduled: { bg: "bg-pastel-lemon", text: "text-accent-lemon", name: "Scheduled" },
  sent: { bg: "bg-pastel-sky", text: "text-accent-sky", name: "Sent" },
  skipped: { bg: "bg-surface-sunken", text: "text-ink-muted", name: "Skipped" },
  failed: { bg: "bg-pastel-pink", text: "text-accent-pink", name: "Failed" },
};

export function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "bg-surface-sunken", text: "text-ink-soft", name: status };
  return <span className={`chip ${s.bg} ${s.text}`}>{s.name}</span>;
}

/* ---------------------------------- Spinner ---------------------------------- */

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-label="Loading">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/* --------------------------------- Count up --------------------------------- */

export function CountUp({ value, suffix = "", duration = 900 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) { setDisplay(value); return; }
    started.current = true;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(value * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="tabular-nums">{display.toLocaleString()}{suffix}</span>;
}

/* ----------------------------------- Modal ----------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/25 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`pop-in relative card w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[88vh] overflow-y-auto p-7`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
          <button onClick={onClose} className="btn-ghost -m-2 rounded-full p-2" aria-label="Close">
            <IconX size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------- Drawer ---------------------------------- */

export function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="slide-in absolute inset-y-3 right-3 flex w-full max-w-xl flex-col overflow-y-auto rounded-3xl bg-white shadow-lift">
        {children}
      </aside>
    </div>
  );
}

/* -------------------------------- Empty state -------------------------------- */

export function EmptyState({
  emoji,
  title,
  body,
  children,
}: {
  emoji: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="card rise flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <div className="float-slow flex h-16 w-16 items-center justify-center rounded-3xl bg-pastel-lavender text-3xl">
        {emoji}
      </div>
      <h3 className="text-lg font-extrabold">{title}</h3>
      <p className="max-w-md text-sm text-ink-muted">{body}</p>
      {children && <div className="mt-3 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

/* ------------------------------- Progress bar ------------------------------- */

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
      <div
        className="h-full rounded-full bg-brand-gradient transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
