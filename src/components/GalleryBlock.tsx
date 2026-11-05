"use client";
// Galerie d'images : grille (ou pleine largeur si "original").
// Clic sur une image → agrandissement centré (lightbox) avec navigation.
// Si l'image a un lien (url), un bouton "Ouvrir le lien" apparaît dans la lightbox.
import { useEffect, useState } from "react";

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");

export default function GalleryBlock({ items, orig, cols, aspect, round, shadow }: {
  items: Dict[]; orig: boolean; cols: number; aspect: string; round: boolean; shadow?: string;
}) {
  const pics = (items || []).filter((i) => s(i.image));
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      else if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % pics.length));
      else if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + pics.length) % pics.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pics.length]);

  if (!pics.length) return null;

  const cur = open !== null ? pics[open] : null;

  return (
    <>
      <div style={orig
        ? { display: "flex", flexDirection: "column", gap: 8 }
        : { display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 7 }}>
        {pics.map((i, k) => {
          const img = orig
            ? <img src={s(i.image)} alt="" style={{ width: "100%", height: "auto", display: "block", borderRadius: 12, boxShadow: shadow }} />
            : <img src={s(i.image)} alt="" style={{ width: "100%", aspectRatio: aspect, objectFit: "cover", borderRadius: round ? "50%" : 10, boxShadow: shadow }} />;
          return (
            <button key={k} type="button" className="kc-gal-cell" onClick={() => setOpen(k)} aria-label="Agrandir l'image">
              {img}
            </button>
          );
        })}
      </div>

      {cur && (
        <div className="kc-lightbox" onClick={() => setOpen(null)}>
          <button className="kc-lb-x" onClick={() => setOpen(null)} aria-label="Fermer">✕</button>
          {pics.length > 1 && (
            <>
              <button className="kc-lb-nav prev" aria-label="Précédente"
                onClick={(e) => { e.stopPropagation(); setOpen((o) => (o === null ? o : (o - 1 + pics.length) % pics.length)); }}>‹</button>
              <button className="kc-lb-nav next" aria-label="Suivante"
                onClick={(e) => { e.stopPropagation(); setOpen((o) => (o === null ? o : (o + 1) % pics.length)); }}>›</button>
            </>
          )}
          <img className="kc-lb-img" src={s(cur.image)} alt="" onClick={(e) => e.stopPropagation()} />
          {s(cur.url) && (
            <a className="kc-lb-link" href={s(cur.url)} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>Ouvrir le lien →</a>
          )}
          {pics.length > 1 && <div className="kc-lb-count">{open! + 1} / {pics.length}</div>}
        </div>
      )}
    </>
  );
}
