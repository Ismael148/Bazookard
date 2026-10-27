"use client";
// Visite guidée réutilisable — spotlight + bulle d'explication.
// Mise en avant d'un élément (ciblé par sélecteur CSS), bulle avec étape courante,
// navigation Précédent / Suivant / Terminer, bouton Passer, barre de progression.
// Une étape sans cible (target absent ou introuvable) s'affiche centrée (intro/outro).
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export interface TourStep {
  target?: string;   // sélecteur CSS de l'élément à mettre en avant (optionnel)
  title: string;
  body: string;
  placement?: "top" | "bottom" | "auto";
}

type Box = { top: number; left: number; width: number; height: number } | null;

export default function GuidedTour({ steps, open, onClose }: {
  steps: TourStep[]; open: boolean; onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState<Box>(null);
  const step = steps[i];

  // Réinitialise à la première étape à chaque ouverture.
  useEffect(() => { if (open) setI(0); }, [open]);

  const measure = useCallback(() => {
    if (!open || !step) return;
    const sel = step.target;
    if (!sel) { setBox(null); return; }
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) { setBox(null); return; }
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    // Laisse le temps au scroll avant de mesurer.
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    });
  }, [open, step]);

  useLayoutEffect(() => { measure(); }, [measure]);

  useEffect(() => {
    if (!open) return;
    const h = () => measure();
    window.addEventListener("resize", h);
    window.addEventListener("scroll", h, true);
    const t = setTimeout(measure, 350); // re-mesure après l'animation de scroll
    return () => { window.removeEventListener("resize", h); window.removeEventListener("scroll", h, true); clearTimeout(t); };
  }, [open, measure]);

  const close = useCallback(() => { onClose(); }, [onClose]);
  const next = useCallback(() => { if (i < steps.length - 1) setI(i + 1); else close(); }, [i, steps.length, close]);
  const prev = useCallback(() => { if (i > 0) setI(i - 1); }, [i]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, next, prev]);

  if (!open || !step) return null;

  const pad = 8;
  const hole = box ? {
    top: Math.max(0, box.top - pad), left: Math.max(0, box.left - pad),
    width: box.width + pad * 2, height: box.height + pad * 2,
  } : null;

  // Position de la bulle : sous la cible si possible, sinon au-dessus, sinon centrée.
  let bubbleStyle: React.CSSProperties;
  if (hole) {
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const below = hole.top + hole.height + 14;
    const placeBelow = step.placement === "bottom" || (step.placement !== "top" && below < vh - 220);
    bubbleStyle = placeBelow
      ? { top: hole.top + hole.height + 14, left: "50%", transform: "translateX(-50%)" }
      : { top: Math.max(14, hole.top - 14), left: "50%", transform: "translate(-50%, -100%)" };
  } else {
    bubbleStyle = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  return (
    <div className="gt-root" aria-live="polite">
      {/* Spotlight : voile sombre + trou lumineux sur la cible (ou voile plein si centré).
          Le capteur plein écran ferme la visite au clic ; le halo n'intercepte pas les clics. */}
      {hole ? (
        <>
          <div className="gt-catch" onClick={close} />
          <div className="gt-spot" style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }} />
        </>
      ) : (
        <div className="gt-veil" onClick={close} />
      )}

      <div className="gt-bubble" style={bubbleStyle} onClick={(e) => e.stopPropagation()}>
        <div className="gt-step">Étape {i + 1} / {steps.length}</div>
        <div className="gt-title">{step.title}</div>
        <p className="gt-body">{step.body}</p>
        <div className="gt-bar"><span style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div>
        <div className="gt-actions">
          <button className="gt-skip" onClick={close}>Passer</button>
          <div style={{ display: "flex", gap: 8 }}>
            {i > 0 && <button className="gt-prev" onClick={prev}>Précédent</button>}
            <button className="gt-next" onClick={next}>{i < steps.length - 1 ? "Suivant" : "C'est parti !"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
