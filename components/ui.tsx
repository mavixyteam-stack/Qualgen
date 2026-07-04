"use client";

import { useEffect, type ReactNode } from "react";

/* ------------------------------- Intent badge ------------------------------- */

const INTENT_STYLES: Record<string, { bg: string; text: string; dot: string; name: string }> = {
  cold: { bg: "bg-pastel-sky", text: "text-accent-sky", dot: "bg-accent-sky", name: "Cold" },
  warm: { bg: "bg-pastel-lemon", text: "text-accent-lemon", dot: "bg-accent-lemon", name: "Warm" },
  hot: { bg: "bg-pastel-peach", text: "text-accent-peach", dot: "bg-accent-peach", name: "Hot" },
  ready: { bg: "bg-pastel-mint", text: "text-accent-mint", dot: "bg-accent-mint", name: "Sales Ready" },
};

export function IntentBadge({ label, score }: { label?: string | null; score?: number | null }) {
  if (!label) {
    return <span className="chip bg-surface-sunken text-ink-muted">— Not scored</span>;
  }
  const s = INTENT_STYLES[label] ?? INTENT_STYLES.cold;
  return (
    <span className={`chip ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.name}
      {typeof score === "number" && <span className="opacity-70">{score}</span>}
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
  active: { bg: "bg-pastel-mint", text: "text-accent-mint", name: "Active" },
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
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative card w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[88vh] overflow-y-auto p-7`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <button onClick={onClose} className="btn-ghost rounded-full p-2 -m-2" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
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
    <div className="card flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-pastel-lavender text-3xl">
        {emoji}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
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
        className="h-full rounded-full bg-brand-500 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
