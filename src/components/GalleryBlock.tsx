"use client";
// Galerie Bazookard — grille (ou pleine largeur) + lightbox : un clic sur une
// image l'affiche en grand par-dessus la carte, avec navigation et fermeture.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");

export default function GalleryBlock({ items, orig, cols, aspect, round, shadow }: {
  items: Dict[];
  orig: boolean;
  cols: number;
  aspect: string;
  round: boolean;
  shadow?: string;
}) {
  const imgs = items.filter((i) => s(i.image));
  const [open, setOpen] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % imgs.length));
      else if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + imgs.length) % imgs.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, imgs.length]);

  useEffect(() => {
    if (open === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const tile = (i: Dict, k: number) => (
    <button key={k} type="button" className="kc-gal-tile" onClick={() => setOpen(k)} aria-label="Agrandir l'image">
      <img src={s(i.image)} alt=""
        style={orig
          ? { width: "100%", height: "auto", display: "block", borderRadius: 12, boxShadow: shadow }
          : { width: "100%", aspectRatio: aspect, objectFit: "cover", borderRadius: round ? "50%" : 10, boxShadow: shadow }} />
    </button>
  );

  const cur = open !== null ? imgs[open] : null;
  const curUrl = cur ? s(cur.url) : "";

  return (
    <>
      <div style={orig
        ? { display: "flex", flexDirection: "column", gap: 8 }
        : { display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 7 }}>
        {imgs.map(tile)}
      </div>

      {cur && mounted && createPortal((
        <div className="kc-lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <button className="kc-lb-x" onClick={() => setOpen(null)} aria-label="Fermer">✕</button>
          {imgs.length > 1 && (
            <button className="kc-lb-nav prev" onClick={(e) => { e.stopPropagation(); setOpen((o) => (o === null ? o : (o - 1 + imgs.length) % imgs.length)); }} aria-label="Précédent">‹</button>
          )}
          <img className="kc-lb-img" src={s(cur.image)} alt="" onClick={(e) => e.stopPropagation()} />
          {imgs.length > 1 && (
            <button className="kc-lb-nav next" onClick={(e) => { e.stopPropagation(); setOpen((o) => (o === null ? o : (o + 1) % imgs.length)); }} aria-label="Suivant">›</button>
          )}
          {curUrl && (
            <a className="kc-lb-link" href={curUrl} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>Ouvrir le lien ↗</a>
          )}
          {imgs.length > 1 && <div className="kc-lb-count">{open! + 1} / {imgs.length}</div>}
        </div>
      ), document.body)}
    </>
  );
}
