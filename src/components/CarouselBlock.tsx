"use client";
// Carrousel d'images Bazookard — défilement manuel (glisser) + défilement
// automatique optionnel (intervalMs). Composant client : s'hydrate sur la carte publique.
import { useEffect, useRef } from "react";

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");

export default function CarouselBlock({ items, imgStyle, orig, intervalMs }: {
  items: Dict[];
  imgStyle: React.CSSProperties;
  orig: boolean;
  intervalMs: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idx = useRef(0);
  const list = items.filter((i) => s(i.image));

  useEffect(() => {
    const el = ref.current;
    if (!el || !intervalMs || list.length < 2) return;

    let paused = false;
    let resumeT: ReturnType<typeof setTimeout> | null = null;
    // L'utilisateur glisse → on met en pause, puis on reprend après un délai.
    const pause = () => {
      paused = true;
      if (resumeT) clearTimeout(resumeT);
      resumeT = setTimeout(() => { paused = false; }, Math.max(intervalMs, 2500));
    };
    el.addEventListener("pointerdown", pause);
    el.addEventListener("wheel", pause, { passive: true });

    const tick = () => {
      if (paused) return;
      const slides = el.querySelectorAll<HTMLElement>(".slide");
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
  }, [intervalMs, list.length]);

  return (
    <div className={`kc-carousel${orig ? " orig" : ""}`} ref={ref}>
      {list.map((i, k) => {
        const img = <img src={s(i.image)} alt="" style={imgStyle} />;
        return s(i.url)
          ? <a key={k} href={s(i.url)} target="_blank" rel="noopener" className="slide">{img}</a>
          : <span key={k} className="slide">{img}</span>;
      })}
    </div>
  );
}
