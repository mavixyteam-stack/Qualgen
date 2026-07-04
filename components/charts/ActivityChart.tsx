"use client";

import { useRef, useState } from "react";

export type ActivityPoint = { day: string; sent: number; opened: number; replied: number };

/**
 * 14-day outreach activity line chart. Palette validated with the dataviz
 * six-checks (CVD ΔE 47.2). Sub-3:1 series carry relief: legend, direct
 * end-of-line labels and a crosshair tooltip.
 */
const SERIES = [
  { key: "sent" as const, label: "Sent", color: "#6c5ce7" },
  { key: "opened" as const, label: "Opened", color: "#1baf7a" },
  { key: "replied" as const, label: "Replied", color: "#eda100" },
];

const W = 640;
const H = 220;
const PAD = { top: 14, right: 74, bottom: 26, left: 34 };

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxY = Math.max(4, ...data.flatMap((d) => [d.sent, d.opened, d.replied]));
  const x = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => PAD.top + innerH - (v / maxY) * innerH;

  const ticks = [0, Math.ceil(maxY / 2), maxY];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || !data.length) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  return (
    <div>
      {/* legend — identity never color-alone */}
      <div className="mb-2 flex flex-wrap gap-4">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Outreach activity over the last 14 days"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {/* gridlines + y labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#eceaf4" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#8b85a3">{t}</text>
            </g>
          ))}

          {/* x labels — first, middle, last */}
          {data.length > 0 &&
            [0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#8b85a3">
                {data[i].day}
              </text>
            ))}

          {/* crosshair */}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="#b9b4cc" strokeWidth="1" strokeDasharray="3 3" />
          )}

          {/* end-of-line label positions, nudged apart so equal values don't collide */}
          {(() => {
            const last = data[data.length - 1];
            const placed: { key: string; ly: number }[] = last
              ? SERIES.map((s) => ({ key: s.key, ly: y(last[s.key]) }))
                  .sort((a, b) => a.ly - b.ly)
              : [];
            for (let i = 1; i < placed.length; i++) {
              if (placed[i].ly - placed[i - 1].ly < 13) placed[i].ly = placed[i - 1].ly + 13;
            }
            const labelY = Object.fromEntries(placed.map((p) => [p.key, p.ly]));
            return SERIES.map((s) => {
              const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d[s.key])}`).join(" ");
              return (
                <g key={s.key}>
                  <path d={path} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  {last && (
                    <text
                      x={W - PAD.right + 8}
                      y={labelY[s.key] + 3.5}
                      fontSize="10"
                      fontWeight="700"
                      fill="#4b4368"
                    >
                      {s.label} {last[s.key]}
                    </text>
                  )}
                  {hover !== null && data[hover] && (
                    <circle cx={x(hover)} cy={y(data[hover][s.key])} r="4.5" fill={s.color} stroke="#ffffff" strokeWidth="2" />
                  )}
                </g>
              );
            });
          })()}
        </svg>

        {/* tooltip */}
        {hover !== null && data[hover] && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-2xl bg-ink px-4 py-3 text-xs text-white shadow-lift"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: x(hover) > W * 0.6 ? "translateX(-110%)" : "translateX(12px)",
            }}
          >
            <div className="mb-1 font-bold">{data[hover].day}</div>
            {SERIES.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}: <span className="font-bold">{data[hover][s.key]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
