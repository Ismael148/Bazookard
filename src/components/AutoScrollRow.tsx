"use client";
// Rangée horizontale à défilement — glisser manuel + défilement automatique
// optionnel (intervalMs). Utilisée pour faire défiler les avis/témoignages.
import { useEffect, useRef } from "react";

export default function AutoScrollRow({ children, intervalMs }: {
  children: React.ReactNode[];
  intervalMs: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idx = useRef(0);
  const count = children.length;

  useEffect(() => {
    const el = ref.current;
    if (!el || !intervalMs || count < 2) return;
    let paused = false;
    let resumeT: ReturnType<typeof setTimeout> | null = null;
    const pause = () => {
      paused = true;
      if (resumeT) clearTimeout(resumeT);
      resumeT = setTimeout(() => { paused = false; }, Math.max(intervalMs, 2500));
    };
    el.addEventListener("pointerdown", pause);
    el.addEventListener("wheel", pause, { passive: true });
    const tick = () => {
      if (paused) return;
      const slides = el.querySelectorAll<HTMLElement>(".kc-arow-slide");
      if (slides.length < 2) return;
      idx.current = (idx.current + 1) % slides.length;
      const base = slides[0].offsetLeft;
      el.scrollTo({ left: slides[idx.current].offsetLeft - base, behavior: "smooth" });
    };
    const t = setInterval(tick, intervalMs);
    return () => {
      clearInterval(t);
      if (resumeT) clearTimeout(resumeT);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("wheel", pause);
    };
  }, [intervalMs, count]);

  return (
    <div className="kc-arow" ref={ref}>
      {children.map((c, k) => <div className="kc-arow-slide" key={k}>{c}</div>)}
    </div>
  );
}
