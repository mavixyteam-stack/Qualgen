"use client";

import { useState } from "react";

/**
 * Intent pipeline — ordinal single-hue ramp (cold → sales ready), validated
 * with the dataviz six-checks (monotone lightness, light end ≥ 2:1 on white).
 * Labels and values are ink-colored text, never the series color.
 */
const BANDS = [
  { key: "cold", label: "Cold", range: "0–30", color: "#86b6ef" },
  { key: "warm", label: "Warm", range: "31–60", color: "#5598e7" },
  { key: "hot", label: "Hot", range: "61–85", color: "#2a78d6" },
  { key: "ready", label: "Sales Ready", range: "86–100", color: "#184f95" },
];

export function IntentBars({ counts }: { counts: Record<string, number> }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...BANDS.map((b) => counts[b.key] ?? 0));

  return (
    <div className="space-y-3">
      {BANDS.map((b) => {
        const v = counts[b.key] ?? 0;
        return (
          <div
            key={b.key}
            className="group grid grid-cols-[92px_1fr_28px] items-center gap-3"
            onPointerEnter={() => setHover(b.key)}
            onPointerLeave={() => setHover(null)}
            title={`${b.label} (score ${b.range}): ${v} lead${v === 1 ? "" : "s"}`}
          >
            <div className="text-xs font-semibold text-ink-soft">
              {b.label}
              <span className="block text-[10px] font-normal text-ink-faint">{b.range}</span>
            </div>
            <div className="h-5 overflow-hidden rounded-md bg-surface-sunken">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{
                  width: `${(v / max) * 100}%`,
                  minWidth: v > 0 ? 6 : 0,
                  background: b.color,
                  opacity: hover && hover !== b.key ? 0.45 : 1,
                }}
              />
            </div>
            <div className="text-right text-sm font-bold tabular-nums">{v}</div>
          </div>
        );
      })}
    </div>
  );
}
