"use client";
// Logo Karte officiel.
// → Dépose le fichier du logo dans  public/logo-karte.png  : il sera utilisé PARTOUT tel quel.
//   Tant que le fichier n'existe pas, un repli vectoriel s'affiche (aucune image cassée).
import { useState } from "react";

export const LOGO_SRC = "/logo-karte.png";

/** Logo image officiel (lockup complet K + KARTE + devise), hauteur contrôlée. */
export function LogoImg({ h = 44, style }: { h?: number; style?: React.CSSProperties }) {
  const [err, setErr] = useState(false);
  if (err) return <Logo size={Math.round(h * 0.72)} withText tagline={h >= 60} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={LOGO_SRC} alt="Karte — Connectez. Partagez. Prospérez." onError={() => setErr(true)}
      style={{ height: h, width: "auto", display: "block", objectFit: "contain", ...style }} />
  );
}

/* ---------- Repli vectoriel (utilisé aussi sur fonds sombres/thémés) ---------- */
export function LogoMark({ size = 34, ink = "#17140C", accent = "#FFC400" }: {
  size?: number; ink?: string; accent?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="Karte">
      <path d="M26 6 L44 15 V57 L26 68 Z" fill={ink} />
      <rect x="44" y="-2" width="17" height="62" rx="8.5" transform="rotate(45 52 28)" fill={accent} />
      <circle cx="51" cy="52" r="10" fill={accent} />
      <path d="M46 62 L60 53 L88 86 L68 92 Z" fill={ink} />
    </svg>
  );
}

export default function Logo({ size = 34, dark = false, withText = true, tagline = false }: {
  size?: number; dark?: boolean; withText?: boolean; tagline?: boolean;
}) {
  const ink = dark ? "#FFFDF2" : "#17140C";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} ink={ink} />
      {withText && (
        <span style={{ lineHeight: 1 }}>
          <span style={{ display: "block", fontFamily: "var(--font-display), sans-serif", fontWeight: 700, fontSize: size * 0.56, letterSpacing: ".14em", color: ink }}>
            KARTE
          </span>
          {tagline && (
            <span style={{ display: "block", fontSize: size * 0.24, fontWeight: 600, letterSpacing: ".08em", color: dark ? "rgba(255,253,242,.6)" : "#8A8474", marginTop: 3 }}>
              CONNECTEZ. <span style={{ color: "#E8A800" }}>PARTAGEZ.</span> PROSPÉREZ.
            </span>
          )}
        </span>
      )}
    </span>
  );
}
