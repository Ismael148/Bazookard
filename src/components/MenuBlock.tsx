"use client";
// Bloc Menu restaurant avancé : plats groupés par catégorie, clic sur un plat
// → popup détaillée (photo, description, ingrédients, prix).
import { useState } from "react";

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown) => (Array.isArray(v) ? (v as Dict[]) : []);

export default function MenuBlock({ data }: { data: Dict }) {
  const [openItem, setOpenItem] = useState<Dict | null>(null);
  const items = arr(data.items).filter((i) => s(i.name));
  if (!items.length) return null;
  const cats: string[] = [];
  items.forEach((i) => { const c = s(i.cat) || "Menu"; if (!cats.includes(c)) cats.push(c); });

  return (
    <>
      {s(data.title) && <div className="kc-sec-title">{s(data.title)}</div>}
      {cats.map((cat) => (
        <div key={cat} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--c-soft)", margin: "10px 0 4px" }}>{cat}</div>
          {items.filter((i) => (s(i.cat) || "Menu") === cat).map((i, k) => (
            <button key={k} onClick={() => setOpenItem(i)}
              style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--c-line)", width: "100%", background: "none", border: "none", borderBottomStyle: "solid", cursor: "pointer", color: "var(--c-ink)", textAlign: "left", fontFamily: "inherit" }}>
              {s(i.image) ? (
                <img src={s(i.image)} alt="" style={{ width: 62, height: 62, borderRadius: 14, objectFit: "cover", flexShrink: 0, boxShadow: "0 6px 14px -6px rgba(0,0,0,.25)" }} />
              ) : (
                <span style={{ width: 62, height: 62, borderRadius: 14, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 22, background: "var(--c-bg)", border: "1px solid var(--c-line)" }}>🍽️</span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-.01em" }}>{s(i.name)}</div>
                {s(i.desc) && <div style={{ fontSize: 12.5, color: "var(--c-soft)", lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{s(i.desc)}</div>}
              </div>
              {s(i.price) && <div style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: "nowrap", color: "var(--c-ink)", background: "var(--c-bg)", padding: "5px 11px", borderRadius: 999, border: "1px solid var(--c-line)" }}>{s(i.price)}</div>}
            </button>
          ))}
        </div>
      ))}

      {/* Popup détail du plat */}
      {openItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(10,10,14,.5)", backdropFilter: "blur(3px)" }} onClick={() => setOpenItem(null)}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 430, background: "var(--c-surface)", color: "var(--c-ink)", borderRadius: "22px 22px 0 0", overflow: "hidden", boxShadow: "0 -18px 60px rgba(0,0,0,.4)", animation: "kcUp .3s cubic-bezier(.16,1,.3,1) both" }}>
            {s(openItem.image) && (
              <div style={{ height: 190, backgroundImage: `url('${s(openItem.image)}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
            )}
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--c-soft)" }}>{s(openItem.cat) || "Menu"}</div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, marginTop: 2 }}>{s(openItem.name)}</h3>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, whiteSpace: "nowrap", padding: "6px 12px", borderRadius: 10, background: "linear-gradient(135deg, var(--c-accent), var(--c-accent2))", color: "var(--c-accent-ink)" }}>{s(openItem.price)}</div>
              </div>
              {s(openItem.desc) && <p style={{ fontSize: 14, color: "var(--c-soft)", lineHeight: 1.55, marginTop: 10 }}>{s(openItem.desc)}</p>}
              {s(openItem.ingredients) && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Ingrédients</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {s(openItem.ingredients).split(",").map((ing, k) => (
                      <span key={k} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, background: "var(--c-bg)", border: "1px solid var(--c-line)" }}>{ing.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setOpenItem(null)} className="kc-cta" style={{ marginTop: 18 }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
