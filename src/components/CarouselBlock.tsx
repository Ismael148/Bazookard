"use client";
// Carrousel d'images Bazookard — défilement manuel (glisser) + défilement
// automatique optionnel (intervalMs). Un clic sur une image l'agrandit (lightbox),
// comme la galerie. Composant client : s'hydrate sur la carte publique.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const [open, setOpen] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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

  // Lightbox : pause le carrousel (via scroll bloqué), clavier + verrou du scroll.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % list.length));
      else if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + list.length) % list.length));
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, list.length]);

  const cur = open !== null ? list[open] : null;
  const curUrl = cur ? s(cur.url) : "";

  return (
    <>
      <div className={`kc-carousel${orig ? " orig" : ""}`} ref={ref}>
        {list.map((i, k) => (
          <button
            key={k}
            type="button"
            className="slide"
            onClick={() => setOpen(k)}
            aria-label="Agrandir l'image"
            style={{ border: "none", padding: 0, margin: 0, background: "none", cursor: "zoom-in", display: "block" }}
          >
            <img src={s(i.image)} alt="" style={imgStyle} draggable={false} />
          </button>
        ))}
      </div>

      {cur && mounted && createPortal((
        <div className="kc-lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <button className="kc-lb-x" onClick={() => setOpen(null)} aria-label="Fermer">✕</button>
          {list.length > 1 && (
            <button className="kc-lb-nav prev" onClick={(e) => { e.stopPropagation(); setOpen((o) => (o === null ? o : (o - 1 + list.length) % list.length)); }} aria-label="Précédent">‹</button>
          )}
          <img className="kc-lb-img" src={s(cur.image)} alt="" onClick={(e) => e.stopPropagation()} />
          {list.length > 1 && (
            <button className="kc-lb-nav next" onClick={(e) => { e.stopPropagation(); setOpen((o) => (o === null ? o : (o + 1) % list.length)); }} aria-label="Suivant">›</button>
          )}
          {curUrl && (
            <a className="kc-lb-link" href={curUrl} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>Ouvrir le lien ↗</a>
          )}
          {list.length > 1 && <div className="kc-lb-count">{open! + 1} / {list.length}</div>}
        </div>
      ), document.body)}
    </>
  );
}
