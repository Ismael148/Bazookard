"use client";
// Bloc « Livret d'accueil » : grille de rubriques (Wi-Fi, parking, TV/Netflix…).
// Un clic sur une rubrique ouvre une fiche interne détaillée (texte, photo, vidéo).
import { useState } from "react";

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown) => (Array.isArray(v) ? (v as Dict[]) : []);

function toEmbed(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

export default function WelcomeBlock({ data }: { data: Dict }) {
  const [open, setOpen] = useState<Dict | null>(null);
  const items = arr(data.items).filter((i) => s(i.label));
  if (!items.length) return null;

  return (
    <>
      {s(data.title) && <div className="kc-sec-title">{s(data.title)}</div>}
      {s(data.intro) && <p className="kc-welcome-intro">{s(data.intro)}</p>}
      <div className="kc-welcome-grid">
        {items.map((i, k) => {
          const img = s(i.image);
          return (
            <button key={k} type="button" className={`kc-welcome-tile${img ? " has-img" : ""}`} onClick={() => setOpen(i)}
              style={{ animationDelay: `${k * 45}ms`, ...(img ? { backgroundImage: `url('${img}')` } : {}) }}>
              {img && <span className="ov" />}
              <span className="ic">{s(i.icon) || "📌"}</span>
              <span className="lb">{s(i.label)}</span>
              <span className="ar">›</span>
            </button>
          );
        })}
      </div>

      {open && (
        <div className="kc-welcome-modal" onClick={() => setOpen(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setOpen(null)} aria-label="Fermer">✕</button>
            <div className="hd">
              <span className="ic">{s(open.icon) || "📌"}</span>
              <b>{s(open.label)}</b>
            </div>
            {s(open.video) && toEmbed(s(open.video)) && (
              <iframe className="vid" src={toEmbed(s(open.video))!} allowFullScreen title={s(open.label)} />
            )}
            {s(open.image) && <img className="img" src={s(open.image)} alt={s(open.label)} />}
            {s(open.desc) && <div className="desc">{s(open.desc)}</div>}
          </div>
        </div>
      )}
    </>
  );
}
