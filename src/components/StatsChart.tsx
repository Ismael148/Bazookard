"use client";
// Graphiques analytics Bazookard — SVG pur, charte claire + jaune.
import type { DayStats } from "@/lib/tracking";

const YELLOW = "#FFD500";
const AMBER = "#E8A800";
const INKSOFT = "#8A8474";

/** Courbe des vues + barres des interactions, sur N jours. */
export function AreaChart({ data, height = 220 }: { data: DayStats[]; height?: number }) {
  const W = 720, H = height, PAD = { l: 34, r: 10, t: 14, b: 24 };
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const max = Math.max(4, ...data.map((d) => d.view));
  const x = (i: number) => PAD.l + (data.length <= 1 ? 0 : (i / (data.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (v / max) * ih;

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.view).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${(PAD.t + ih).toFixed(1)} L${PAD.l},${(PAD.t + ih).toFixed(1)} Z`;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const step = Math.max(1, Math.floor(data.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="ka-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={YELLOW} stopOpacity=".45" />
          <stop offset="100%" stopColor={YELLOW} stopOpacity=".02" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#ECE9E0" strokeDasharray="3 4" />
          <text x={PAD.l - 7} y={y(t) + 4} textAnchor="end" fontSize="10.5" fill={INKSOFT}>{t}</text>
        </g>
      ))}
      <path d={area} fill="url(#ka-area)" />
      <path d={line} fill="none" stroke={AMBER} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        d.view > 0 && <circle key={d.date} cx={x(i)} cy={y(d.view)} r="3" fill="#fff" stroke={AMBER} strokeWidth="2" />
      ))}
      {data.map((d, i) => (i % step === 0 ? (
        <text key={"t" + d.date} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill={INKSOFT}>
          {new Date(d.date + "T00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        </text>
      ) : null))}
    </svg>
  );
}

/** Barres horizontales comparatives (par carte / workspace). */
export function HBarChart({ rows }: { rows: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
            <span style={{ fontWeight: 600 }}>{r.label}{r.sub && <span style={{ color: INKSOFT, fontWeight: 400 }}> · {r.sub}</span>}</span>
            <strong>{r.value}</strong>
          </div>
          <div style={{ height: 10, borderRadius: 999, background: "#F4F2EA", overflow: "hidden" }}>
            <div style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${YELLOW}, ${AMBER})`, transition: "width .6s cubic-bezier(.16,1,.3,1)" }} />
          </div>
        </div>
      ))}
      {rows.length === 0 && <div style={{ color: INKSOFT, fontSize: 13, textAlign: "center", padding: 18 }}>Pas encore de données — partagez vos cartes !</div>}
    </div>
  );
}

/** Donut de répartition des interactions. */
export function Donut({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const R = 54, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg viewBox="0 0 140 140" width="140" height="140">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#F4F2EA" strokeWidth="16" />
        {total > 0 && parts.map((p) => {
          const frac = p.value / total;
          const el = (
            <circle key={p.label} cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="16"
              strokeDasharray={`${(frac * C).toFixed(1)} ${C.toFixed(1)}`} strokeDashoffset={(-off * C).toFixed(1)}
              transform="rotate(-90 70 70)" strokeLinecap="butt" />
          );
          off += frac;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill="#17140C">{total}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="10" fill={INKSOFT}>interactions</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {parts.map((p) => (
          <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
            {p.label} <strong style={{ marginLeft: "auto" }}>{p.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
