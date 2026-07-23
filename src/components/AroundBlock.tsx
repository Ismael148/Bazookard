"use client";
// Bloc « Aux alentours » : points d'intérêt groupés par catégories filtrables
// (Lieux à proximité, Restaurants et cafés, Environnement naturel, Aéroports…).
import { useState } from "react";

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown) => (Array.isArray(v) ? (v as Dict[]) : []);

const CAT_ICONS: Record<string, string> = {
  "Lieux à proximité": "📍",
  "Restaurants et cafés": "☕",
  "Environnement naturel": "🌿",
  "Plages": "🏖️",
  "Commerces et marchés": "🛍️",
  "Activités et loisirs": "🎯",
  "Culture et patrimoine": "🏛️",
  "Transports en commun": "🚌",
  "Aéroports les plus proches": "✈️",
};

export default function AroundBlock({ data, fmt }: { data: Dict; fmt?: string }) {
  const [cat, setCat] = useState<string>("");
  const items = arr(data.items).filter((i) => s(i.name));
  if (!items.length) return null;

  const cats: string[] = [];
  items.forEach((i) => { const c = s(i.cat); if (c && !cats.includes(c)) cats.push(c); });
  const shown = cat ? items.filter((i) => s(i.cat) === cat) : items;

  const ratio = fmt === "carre" ? "1/1" : fmt === "portrait" ? "3/4" : fmt === "vertical" ? "9/16"
    : fmt === "paysage" ? "16/9" : fmt === "pano" ? "21/9" : "";
  const original = fmt === "original";

  return (
    <>
      {s(data.title) && <div className="kc-sec-title">{s(data.title)}</div>}
      {cats.length > 0 && (
        <div className="kc-filter">
          <button type="button" className={`kc-filter-chip${cat === "" ? " on" : ""}`} onClick={() => setCat("")}>
            Tout
          </button>
          {cats.map((c) => (
            <button key={c} type="button" className={`kc-filter-chip${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>
              {CAT_ICONS[c] ?? "📌"} {c}
            </button>
          ))}
        </div>
      )}
      <div className="kc-around" key={cat /* relance l'animation au changement de filtre */}>
        {shown.map((i, k) => (
          <div key={k} className="it">
            <div
              className="im"
              style={original && s(i.image)
                ? { height: "auto" }
                : ratio ? { height: "auto", aspectRatio: ratio } : undefined}
            >
              {s(i.image) ? (
                <img
                  src={s(i.image)}
                  alt={s(i.name)}
                  style={original
                    ? { width: "100%", height: "auto", display: "block" }
                    : { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              ) : (
                <span className="ph" aria-hidden>{CAT_ICONS[s(i.cat)] ?? "🗺️"}</span>
              )}
              {s(i.distance) && <span className="dist">📍 {s(i.distance)}</span>}
            </div>
            <div className="tx">
              <b>{s(i.name)}</b>
              {s(i.desc) && <small>{s(i.desc)}</small>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
