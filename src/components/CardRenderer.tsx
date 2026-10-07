// Rendu présentationnel d'une carte Bazookard v2 — mini-app immersive.
// Pur composant (aucun hook) => utilisable côté éditeur ET en SSR sur la page publique.
// Les handlers (vCard, chat) sont optionnels : absents dans l'aperçu éditeur.
import type { Card, Block } from "@/lib/types";
import { resolveTheme, CARD_FONTS } from "@/lib/types";
import LoyaltyCard from "./LoyaltyCard";
import SocialIcon, { Glyph } from "./SocialIcon";
import MenuBlock from "./MenuBlock";
import AroundBlock from "./AroundBlock";
import WelcomeBlock from "./WelcomeBlock";
import SubscribeBlock from "./SubscribeBlock";
import ReservationBlock from "./ReservationBlock";
import FormBlock from "./FormBlock";

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown) => (Array.isArray(v) ? (v as Dict[]) : []);

export interface CardActions {
  onSaveContact?: () => void;
  onChat?: () => void;
}

/* ---------- Blocs individuels (rendus DANS une section) ---------- */

function renderBlock(block: Block, cardId: string, custom?: Card["custom"]): React.ReactNode {
  const d = block.data as Dict;
  // Format & taille d'images (réglables dans Apparence personnalisée)
  const shape = custom?.imgShape || "";
  const isz = custom?.imgSize || "m";
  const ratio = shape === "paysage" ? "16/9" : shape === "portrait" ? "3/4" : shape === "original" ? "" : "1";
  const round = shape === "rond";
  const galCols = isz === "l" ? 2 : isz === "s" ? 4 : 3;
  const carH = isz === "l" ? 200 : isz === "s" ? 110 : 150;
  const imShadow = custom?.imgShadow === "forte" ? "0 14px 30px -10px rgba(0,0,0,.45)"
    : custom?.imgShadow === "douce" ? "0 8px 18px -8px rgba(0,0,0,.28)" : undefined;
  // Format d'images propre à CE bloc (menu déroulant dans l'éditeur) — prioritaire
  const bf = s((d as Dict).__fmt);
  const bratio = bf === "carre" ? "1/1" : bf === "portrait" ? "3/4" : bf === "vertical" ? "9/16"
    : bf === "paysage" ? "16/9" : bf === "pano" ? "21/9" : "";
  // Format « original » : l'image garde ses proportions naturelles, sans recadrage
  const orig = bf === "original" || (!bf && shape === "original");
  const carH2 = bf === "vertical" ? 236 : bf === "pano" ? 120 : carH;
  switch (block.type) {
    case "headline":
      return (
        <>
          {s(d.title) && <div className="kc-sec-title" style={{ marginBottom: s(d.text) ? 6 : 0 }}>{s(d.title)}</div>}
          {s(d.text) && <p style={{ color: "var(--c-soft)", fontSize: 13.5, lineHeight: 1.55 }}>{s(d.text)}</p>}
        </>
      );
    case "avatar":
      return s(d.image) ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 92, height: 92, borderRadius: "50%", margin: "0 auto", backgroundImage: `url('${s(d.image)}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        </div>
      ) : null;
    case "banner": {
      if (!s(d.image)) return null;
      const bimg = <img src={s(d.image)} alt="" style={{ width: "100%", display: "block", borderRadius: 12 }} />;
      return s(d.url)
        ? <a href={s(d.url)} target="_blank" rel="noopener" style={{ display: "block" }}>{bimg}</a>
        : bimg;
    }
    case "contact": {
      const tiles: React.ReactNode[] = [];
      if (s(d.phone)) tiles.push(<a key="p" className="kc-tile" href={`tel:${s(d.phone)}`}><span className="tic"><Glyph name="phone" size={20} /></span>Appeler</a>);
      if (s(d.whatsapp)) tiles.push(<a key="w" className="kc-tile" href={`https://wa.me/${s(d.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(s(d.wamsg))}`}><span className="tic" style={{ background: "#25d366", color: "#fff" }}><Glyph name="wa" size={22} /></span>WhatsApp</a>);
      if (s(d.email)) tiles.push(<a key="e" className="kc-tile" href={`mailto:${s(d.email)}`}><span className="tic"><Glyph name="mail" size={20} /></span>Email</a>);
      const dest = s(d.maps) || (s(d.address) ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s(d.address))}` : "");
      if (dest) tiles.push(<a key="m" className="kc-tile" href={dest} target="_blank" rel="noopener"><span className="tic"><Glyph name="pin" size={20} /></span>Itinéraire</a>);
      if (s(d.website)) tiles.push(<a key="s" className="kc-tile" href={s(d.website)}><span className="tic"><Glyph name="globe" size={20} /></span>Site web</a>);
      if (!tiles.length && d.savebtn === false) return null;
      return (
        <>
          {tiles.length > 0 && <div className="kc-grid2">{tiles}</div>}
          {s(d.address) && (
            <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--c-soft)", marginTop: 10 }}>📍 {s(d.address)}</div>
          )}
          {d.savebtn !== false && (
            <button type="button" data-kc-vcard className="kc-cta" style={{ marginTop: 12 }}>
              📇 Enregistrer le contact
            </button>
          )}
        </>
      );
    }
    case "button":
      // pas de lien → pas de bouton (on n'affiche rien d'inutile)
      return s(d.label) && s(d.url) ? <a href={s(d.url)} className="kc-cta">{s(d.label)}</a> : null;
    case "social": {
      const items = arr(d.items).filter((i) => s(i.url));
      return items.length ? (
        <div className="kc-social-glass">
          {items.map((i, k) => (
            <a key={k} href={s(i.url)} className="kc-social-pod" target="_blank" rel="noopener" style={{ textDecoration: "none", animationDelay: `${k * 70}ms` }}>
              <SocialIcon network={s(i.network)} color={s(i.color) || undefined} size={54} />
            </a>
          ))}
        </div>
      ) : null;
    }
    case "media":
      return (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {s(d.image) && <img src={s(d.image)} alt="" style={orig ? { width: 120, height: "auto", borderRadius: 12, flexShrink: 0, boxShadow: imShadow } : bratio ? { width: 120, aspectRatio: bratio, borderRadius: 12, objectFit: "cover", flexShrink: 0, boxShadow: imShadow } : { width: 88, height: 88, borderRadius: 14, objectFit: "cover", flexShrink: 0, boxShadow: imShadow }} />}
          <p style={{ color: "var(--c-soft)", fontSize: 13.5, lineHeight: 1.5 }}>{s(d.text)}</p>
        </div>
      );
    case "gallery": {
      // Une image devient cliquable si un lien est renseigné
      const wrap = (node: React.ReactNode, url: string, k: number) =>
        url ? <a key={k} href={url} target="_blank" rel="noopener" style={{ display: "block" }}>{node}</a> : <span key={k} style={{ display: "block" }}>{node}</span>;
      if (orig) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {arr(d.items).filter((i) => s(i.image)).map((i, k) => wrap(
              <img src={s(i.image)} alt="" style={{ width: "100%", height: "auto", display: "block", borderRadius: 12, boxShadow: imShadow }} />, s(i.url), k))}
          </div>
        );
      }
      return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${galCols}, 1fr)`, gap: 7 }}>
          {arr(d.items).filter((i) => s(i.image)).map((i, k) => wrap(
            <img src={s(i.image)} alt="" style={{ width: "100%", aspectRatio: bratio || (round ? "1" : ratio || "1"), objectFit: "cover", borderRadius: round ? "50%" : 10, boxShadow: imShadow }} />, s(i.url), k))}
        </div>
      );
    }
    case "carousel": {
      // orig = image pleine largeur à sa taille naturelle (1 par vue, défilement).
      const imgStyle = (): React.CSSProperties => orig
        ? { width: "100%", height: "auto", objectFit: "contain", borderRadius: 14, display: "block", boxShadow: imShadow }
        : round
        ? { width: carH, height: carH, objectFit: "cover", borderRadius: "50%", flexShrink: 0, boxShadow: imShadow }
        : { height: carH2, aspectRatio: bratio || (!ratio || ratio === "1" ? undefined : ratio), objectFit: "cover", borderRadius: 14, flexShrink: 0, boxShadow: imShadow };
      return (
        <div className={`kc-carousel${orig ? " orig" : ""}`}>
          {arr(d.items).filter((i) => s(i.image)).map((i, k) => {
            const img = <img src={s(i.image)} alt="" style={imgStyle()} />;
            return s(i.url)
              ? <a key={k} href={s(i.url)} target="_blank" rel="noopener" className="slide">{img}</a>
              : <span key={k} className="slide">{img}</span>;
          })}
        </div>
      );
    }
    case "video": {
      const embed = toEmbed(s(d.url));
      const fmt = s(d.format).replace(":", "/") || "16/9";
      const ar = ["16/9", "9/16", "1/1", "4/3", "3/4", "21/9"].includes(fmt) ? fmt : "16/9";
      const vsh = s(d.__shadow);
      const vShadow = vsh === "forte" ? "0 22px 46px -14px rgba(0,0,0,.55)"
        : vsh === "douce" ? "0 12px 28px -12px rgba(0,0,0,.32)"
        : vsh === "aucune" ? "none" : imShadow;
      const vRadius = typeof d.__radius === "number" ? d.__radius : undefined;
      return embed ? (
        <iframe src={embed} style={{ width: "100%", aspectRatio: ar, border: "none", borderRadius: vRadius !== undefined ? vRadius : "var(--c-r, 20px)", boxShadow: vShadow, display: "block" }} allowFullScreen />
      ) : null;
    }
    case "podcast":
      return s(d.url) ? (
        <>
          <div className="kc-sec-title">{s(d.title)}</div>
          <audio controls src={s(d.url)} style={{ width: "100%" }} />
        </>
      ) : null;
    case "list": {
      const items = arr(d.items).filter((i) => s(i.label));
      if (s(d.style).startsWith("accord")) {
        return (
          <div className="kc-acc">
            {s(d.title) && <div className="kc-sec-title">{s(d.title)}</div>}
            {items.map((i, k) => (
              <details key={k}>
                <summary>{s(i.label)}<span className="chev">＋</span></summary>
                {s(i.value) && <div className="body" style={{ paddingLeft: 14 }}>{s(i.value)}</div>}
              </details>
            ))}
          </div>
        );
      }
      return (
        <>
          {s(d.title) && <div className="kc-sec-title">{s(d.title)}</div>}
          {items.map((i, k) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--c-line)", fontSize: 13.5 }}>
              <span style={{ fontWeight: 600 }}>{s(i.label)}</span><span style={{ color: "var(--c-soft)" }}>{s(i.value)}</span>
            </div>
          ))}
        </>
      );
    }
    case "iframe":
      return s(d.url) ? <iframe src={s(d.url)} style={{ width: "100%", height: Number(d.height) || 320, border: "1px solid var(--c-line)", borderRadius: 14 }} /> : null;
    case "product": {
      const items = arr(d.items).filter((i) => s(i.title));
      if (!items.length) return null;
      const withImg = items.some((i) => s(i.image));
      if (!withImg) {
        // sans images : liste sobre
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((i, k) => (
              <a key={k} href={s(i.url) || "#"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "var(--c-bg)", borderRadius: 13, padding: "12px 14px", textDecoration: "none", color: "var(--c-ink)" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{s(i.title)}</span>
                <span style={{ fontSize: 13.5, fontWeight: 800 }}>{s(i.price)}</span>
              </a>
            ))}
          </div>
        );
      }
      const prodCard = (i: Dict, k: number) => (
        <a key={k} href={s(i.url) || "#"} className="kc-prod">
          <span className="bgimg" style={{ backgroundImage: s(i.image) ? `url('${s(i.image)}')` : undefined, background: s(i.image) ? undefined : "linear-gradient(135deg, var(--c-accent), var(--c-accent2))" }} />
          <span className="ov" />
          {s(i.price) && <span className="pr">{s(i.price)}</span>}
          <span className="info">
            <b>{s(i.title)}</b>
            {s(i.desc) && <small>{s(i.desc)}</small>}
          </span>
        </a>
      );
      // beaucoup de produits → carrousel automatique
      return items.length > 4
        ? <div className="kc-prod-car">{items.map(prodCard)}</div>
        : <div className="kc-prod-grid">{items.map(prodCard)}</div>;
    }
    case "payment":
      return s(d.link) ? (
        <a href={s(d.link)} className="kc-cta">
          {s(d.label)} {s(d.amount) && `· ${s(d.amount)} ${s(d.currency)}`}
        </a>
      ) : null;
    case "subscribe":
      return <SubscribeBlock cardId={cardId} data={d} />;
    case "reservation":
      return <ReservationBlock cardId={cardId} data={d} />;
    case "form":
      return <FormBlock cardId={cardId} data={d} />;
    case "appointment":
      return s(d.url) ? <a href={s(d.url)} className="kc-cta">📅 {s(d.title)}</a> : null;
    case "feedback":
      return (
        <div style={{ textAlign: "center" }}>
          <div className="kc-sec-title" style={{ marginBottom: 6 }}>{s(d.title)}</div>
          <div style={{ fontSize: 26, letterSpacing: 4 }}>⭐⭐⭐⭐⭐</div>
        </div>
      );
    case "testimonial": {
      const style = s(d.style).toLowerCase();
      const items = arr(d.items).filter((i) => s(i.text));
      if (!items.length) return null;
      if (style.startsWith("bulle")) {
        // Style bulles de chat
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((i, k) => (
              <div key={k} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: s(i.avatar) ? `url('${s(i.avatar)}') center/cover` : "linear-gradient(135deg, var(--c-accent), var(--c-accent2))", display: "grid", placeItems: "center", color: "var(--c-accent-ink)", fontSize: 13, fontWeight: 800 }}>
                  {!s(i.avatar) && (s(i.name)[0] || "★")}
                </span>
                <div style={{ background: "var(--c-bg)", borderRadius: "16px 16px 16px 4px", padding: "10px 13px", border: "1px solid var(--c-line)" }}>
                  <p style={{ fontSize: 13.5, lineHeight: 1.5 }}>{s(i.text)}</p>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--c-soft)", marginTop: 4 }}>{s(i.name)}</div>
                </div>
              </div>
            ))}
          </div>
        );
      }
      if (style.startsWith("etoile") || style.startsWith("étoile")) {
        // Style notes 5 étoiles centrées
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((i, k) => (
              <div key={k} style={{ textAlign: "center", padding: "14px 12px", background: "var(--c-bg)", borderRadius: 16 }}>
                <div style={{ fontSize: 15, letterSpacing: 2, marginBottom: 6 }}>⭐⭐⭐⭐⭐</div>
                <p style={{ fontSize: 13.5, fontStyle: "italic", lineHeight: 1.55, color: "var(--c-soft)" }}>“{s(i.text)}”</p>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>— {s(i.name)}</div>
              </div>
            ))}
          </div>
        );
      }
      // Style cartes (défaut)
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((i, k) => (
            <div key={k} style={{ background: "var(--c-bg)", borderRadius: 14, padding: 13, display: "flex", gap: 11 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: s(i.avatar) ? `url('${s(i.avatar)}') center/cover` : "linear-gradient(135deg, var(--c-accent), var(--c-accent2))", display: "grid", placeItems: "center", color: "var(--c-accent-ink)", fontSize: 15, fontWeight: 800 }}>
                {!s(i.avatar) && (s(i.name)[0] || "★")}
              </span>
              <div>
                <p style={{ fontSize: 13.5, color: "var(--c-soft)", fontStyle: "italic", lineHeight: 1.5 }}>“{s(i.text)}”</p>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6 }}>{s(i.name)}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "faq": {
      const items = arr(d.items).filter((i) => s(i.q));
      if (s(d.style) === "simple") {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {items.map((i, k) => (
              <div key={k}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{s(i.icon)} {s(i.q)}</div>
                <p style={{ fontSize: 13, color: "var(--c-soft)", marginTop: 4, lineHeight: 1.5 }}>{s(i.a)}</p>
              </div>
            ))}
          </div>
        );
      }
      return (
        <div className="kc-acc">
          {items.map((i, k) => (
            <details key={k}>
              <summary>{s(i.icon) && <span>{s(i.icon)}</span>}{s(i.q)}<span className="chev">＋</span></summary>
              <p className="body" style={{ paddingLeft: s(i.icon) ? 46 : 14 }}>{s(i.a)}</p>
            </details>
          ))}
        </div>
      );
    }
    /* ---------- Blocs métier (étape 3) ---------- */
    case "menu":
      return <MenuBlock data={d} />;
    case "events": {
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const items = arr(d.items).filter((i) => {
        if (!s(i.title)) return false;
        const dt = new Date(s(i.date));
        return isNaN(dt.getTime()) || dt >= now;
      });
      if (!items.length) return null;
      const MONTHS = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEP", "OCT", "NOV", "DÉC"];
      return (
        <>
          {s(d.title) && <div className="kc-sec-title">{s(d.title)}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((i, k) => {
              const dt = new Date(s(i.date));
              const valid = !isNaN(dt.getTime());
              const days = valid ? Math.ceil((dt.getTime() - now.getTime()) / 86400000) : -1;
              const mapsUrl = s(i.place) ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s(i.place))}` : "";
              return (
                <div key={k} className="kc-event">
                  {s(i.image) && (
                    <div className="cover" style={orig
                      ? { height: "auto", backgroundImage: "none" }
                      : { backgroundImage: `url('${s(i.image)}')`, ...(bratio ? { height: "auto", aspectRatio: bratio } : {}) }}>
                      {orig && <img src={s(i.image)} alt="" style={{ width: "100%", height: "auto", display: "block" }} />}
                      {valid && days >= 0 && days <= 60 && (
                        <span className="jx">{days === 0 ? "🔥 C'EST AUJOURD'HUI" : `⏳ J-${days}`}</span>
                      )}
                    </div>
                  )}
                  <div style={{ padding: 13, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, var(--c-accent), var(--c-accent2))", color: "var(--c-accent-ink)" }}>
                      {valid ? (
                        <>
                          <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{dt.getDate()}</span>
                          <span style={{ fontSize: 8.5, fontWeight: 700 }}>{MONTHS[dt.getMonth()]}</span>
                        </>
                      ) : <span style={{ fontSize: 17 }}>🎫</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{s(i.title)}</div>
                      <div style={{ fontSize: 12, color: "var(--c-soft)", marginTop: 2 }}>
                        {[s(i.time), s(i.place)].filter(Boolean).join(" · ")}
                        {!s(i.image) && valid && days >= 0 && days <= 60 && (
                          <span style={{ marginLeft: 8, fontWeight: 800, color: "var(--c-ink)" }}>{days === 0 ? "🔥 Aujourd'hui" : `⏳ J-${days}`}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        {(s(i.url) || s(i.btnLabel)) && (
                          <a href={s(i.url) || "#"} style={{ fontSize: 12, fontWeight: 800, padding: "8px 14px", borderRadius: 10, textDecoration: "none", background: "linear-gradient(135deg, var(--c-accent), var(--c-accent2))", color: "var(--c-accent-ink)" }}>
                            {s(i.btnLabel) || "Voir l'événement"}
                          </a>
                        )}
                        {mapsUrl && (
                          <a href={mapsUrl} style={{ fontSize: 12, fontWeight: 700, padding: "8px 14px", borderRadius: 10, textDecoration: "none", border: "1px solid var(--c-line)", color: "var(--c-ink)", background: "var(--c-surface)" }}>
                            📍 Itinéraire
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    }
    case "hours": {
      const items = arr(d.items).filter((i) => s(i.day));
      if (!items.length) return null;
      const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
      const todayName = DAYS[new Date().getDay()];
      // Statut ouvert/fermé (best effort sur le jour courant)
      let status: "open" | "closed" | null = null;
      const today = items.find((i) => s(i.day).toLowerCase().startsWith(todayName.slice(0, 4)));
      if (today) {
        const m = s(today.hours).match(/(\d{1,2})[h:](\d{2})?\s*[-–]\s*(\d{1,2})[h:](\d{2})?/);
        if (m) {
          const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
          const from = parseInt(m[1]) * 60 + parseInt(m[2] || "0");
          const to = parseInt(m[3]) * 60 + parseInt(m[4] || "0");
          status = nowMin >= from && nowMin < to ? "open" : "closed";
        } else if (/ferm/i.test(s(today.hours))) status = "closed";
      }
      const hstyle = s(d.style);
      const badge = status && (
        <span className={status === "open" ? "kc-h-badge open" : "kc-h-badge"}>
          {status === "open" ? "● Ouvert" : "● Fermé"}
        </span>
      );
      const head = (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div className="kc-sec-title" style={{ marginBottom: 0 }}>{s(d.title) || "Horaires"}</div>
          {badge}
        </div>
      );
      if (hstyle === "digital") {
        // Style LED digital : panneau sombre, chiffres mono animés un à un
        return (
          <>
            {head}
            <div className="kc-h-digital">
              {items.map((i, k) => {
                const isToday = s(i.day).toLowerCase().startsWith(todayName.slice(0, 4));
                return (
                  <div key={k} className={`row${isToday ? " today" : ""}`}>
                    <span className="day">{s(i.day)}</span>
                    <span className="led">{animDigits(s(i.hours) || "—", k)}</span>
                  </div>
                );
              })}
            </div>
          </>
        );
      }
      if (hstyle === "pills") {
        return (
          <>
            {head}
            <div className="kc-h-pills">
              {items.map((i, k) => {
                const isToday = s(i.day).toLowerCase().startsWith(todayName.slice(0, 4));
                return (
                  <div key={k} className={`pill${isToday ? " today" : ""}`} style={{ animationDelay: `${k * 60}ms` }}>
                    <span className="day">{s(i.day)}</span>
                    <span className="hrs">{animDigits(s(i.hours) || "—", k)}</span>
                  </div>
                );
              })}
            </div>
          </>
        );
      }
      if (hstyle === "timeline") {
        return (
          <>
            {head}
            <div className="kc-h-tl">
              {items.map((i, k) => {
                const isToday = s(i.day).toLowerCase().startsWith(todayName.slice(0, 4));
                const closed = /ferm/i.test(s(i.hours));
                return (
                  <div key={k} className={`row${isToday ? " today" : ""}`} style={{ animationDelay: `${k * 60}ms` }}>
                    <span className={`dot${closed ? " off" : ""}`} />
                    <span className="day">{s(i.day)}</span>
                    <span className="hrs">{animDigits(s(i.hours) || "—", k)}</span>
                  </div>
                );
              })}
            </div>
          </>
        );
      }
      if (hstyle === "minimal") {
        return (
          <>
            {head}
            <div className="kc-h-min">
              {items.map((i, k) => {
                const isToday = s(i.day).toLowerCase().startsWith(todayName.slice(0, 4));
                return (
                  <div key={k} className={`row${isToday ? " today" : ""}`}>
                    <span className="day">{s(i.day).slice(0, 3)}</span>
                    <span className="hrs">{animDigits(s(i.hours) || "—", k)}</span>
                  </div>
                );
              })}
            </div>
          </>
        );
      }
      // Style classique (liste) — avec chiffres animés
      return (
        <>
          {head}
          {items.map((i, k) => {
            const isToday = s(i.day).toLowerCase().startsWith(todayName.slice(0, 4));
            return (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--c-line)", fontSize: 13, fontWeight: isToday ? 700 : 400 }}>
                <span style={{ flexShrink: 0, whiteSpace: "nowrap" }}>{s(i.day)}</span>
                <span style={{ color: isToday ? "var(--c-ink)" : "var(--c-soft)", textAlign: "right", minWidth: 0, overflowWrap: "anywhere" }}>{animDigits(s(i.hours) || "—", k)}</span>
              </div>
            );
          })}
        </>
      );
    }
    case "wifi": {
      if (!s(d.network)) return null;
      const copy = (v: string) => { try { navigator.clipboard?.writeText(v); } catch {} };
      return (
        <>
          <div className="kc-sec-title">📶 Wifi</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "var(--c-bg)", borderRadius: 12, padding: "10px 13px" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--c-soft)" }}>Réseau</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{s(d.network)}</div>
              </div>
              <button onClick={() => copy(s(d.network))} style={{ border: "1px solid var(--c-line)", background: "var(--c-surface)", color: "var(--c-ink)", borderRadius: 9, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Copier</button>
            </div>
            {s(d.password) && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "var(--c-bg)", borderRadius: 12, padding: "10px 13px" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--c-soft)" }}>Mot de passe</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace" }}>{s(d.password)}</div>
                </div>
                <button onClick={() => copy(s(d.password))} style={{ border: "none", background: "linear-gradient(135deg, var(--c-accent), var(--c-accent2))", color: "var(--c-accent-ink)", borderRadius: 9, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Copier</button>
              </div>
            )}
            {s(d.note) && <div style={{ fontSize: 12, color: "var(--c-soft)" }}>{s(d.note)}</div>}
          </div>
        </>
      );
    }
    case "offers": {
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const items = arr(d.items).filter((i) => {
        if (!s(i.title)) return false;
        const exp = new Date(s(i.expires));
        return isNaN(exp.getTime()) || exp >= now;
      });
      if (!items.length) return null;
      const copy = (v: string) => { try { navigator.clipboard?.writeText(v); } catch {} };
      return (
        <>
          {s(d.title) && <div className="kc-sec-title">{s(d.title)}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((i, k) => {
              const exp = new Date(s(i.expires));
              const hasExp = !isNaN(exp.getTime());
              return (
                <div key={k} style={{ border: "1.5px dashed var(--c-accent)", borderRadius: 14, overflow: "hidden", background: "var(--c-bg)" }}>
                  {s(i.image) && <img src={s(i.image)} alt="" style={orig ? { width: "100%", height: "auto", display: "block", boxShadow: imShadow } : { width: "100%", aspectRatio: bratio || (shape ? (round ? "1" : ratio || "16/9") : "16/9"), objectFit: "cover", display: "block", boxShadow: imShadow }} />}
                  <div style={{ padding: 13 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>🏷️ {s(i.title)}</div>
                  {s(i.desc) && <div style={{ fontSize: 12.5, color: "var(--c-soft)", marginTop: 3, lineHeight: 1.4 }}>{s(i.desc)}</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
                    {s(i.code) && (
                      <button onClick={() => copy(s(i.code))} title="Copier le code"
                        style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, letterSpacing: ".06em", padding: "6px 12px", borderRadius: 9, border: "1px solid var(--c-line)", background: "var(--c-surface)", color: "var(--c-ink)", cursor: "pointer" }}>
                        {s(i.code)} ⧉
                      </button>
                    )}
                    {s(i.url) && <a href={s(i.url)} style={{ fontSize: 12.5, fontWeight: 700, color: "var(--c-ink)", textDecoration: "underline" }}>En profiter →</a>}
                    {hasExp && <span style={{ fontSize: 11.5, color: "var(--c-soft)", marginLeft: "auto" }}>Jusqu&apos;au {exp.toLocaleDateString("fr-FR")}</span>}
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    }
    case "reviews": {
      const PLATFORMS: Record<string, { label: string; icon: string; color: string }> = {
        google: { label: "Google", icon: "G", color: "#4285F4" },
        tripadvisor: { label: "Tripadvisor", icon: "🦉", color: "#34E0A1" },
        airbnb: { label: "Airbnb", icon: "🏠", color: "#FF5A5F" },
        booking: { label: "Booking", icon: "B", color: "#003580" },
        trustpilot: { label: "Trustpilot", icon: "★", color: "#00B67A" },
        facebook: { label: "Facebook", icon: "f", color: "#1877F2" },
      };
      const items = arr(d.items).filter((i) => s(i.url));
      return (
        <div style={{ textAlign: "center" }}>
          <div className="kc-sec-title" style={{ marginBottom: 4 }}>{s(d.title) || "Laissez un avis"}</div>
          <div style={{ fontSize: 22, letterSpacing: 3, marginBottom: 6 }}>⭐⭐⭐⭐⭐</div>
          {s(d.text) && <p style={{ fontSize: 12.5, color: "var(--c-soft)", marginBottom: 10 }}>{s(d.text)}</p>}
          {items.length > 0 && (s(d.style).startsWith("tuile") ? (
            <div className="kc-grid2">
              {items.map((i, k) => {
                const meta = PLATFORMS[s(i.platform).toLowerCase()] || { label: s(i.platform) || "Avis", icon: "★", color: "#475569" };
                return (
                  <a key={k} href={s(i.url)} className="kc-tile">
                    <span className="tic" style={{ background: meta.color, color: "#fff" }}>{meta.icon}</span>
                    Avis {meta.label}
                  </a>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((i, k) => {
                const meta = PLATFORMS[s(i.platform).toLowerCase()] || { label: s(i.platform) || "Avis", icon: "★", color: "#475569" };
                return (
                  <a key={k} href={s(i.url)} className="kc-row" style={{ justifyContent: "flex-start" }}>
                    <span className="kc-row-ic" style={{ background: meta.color, color: "#fff" }}>{meta.icon}</span>
                    Avis {meta.label}
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      );
    }
    case "equipment": {
      const items = arr(d.items).filter((i) => s(i.name));
      if (!items.length) return null;
      return (
        <div className="kc-acc kc-equip">
          {s(d.title) && <div className="kc-sec-title">{s(d.title)}</div>}
          {items.map((i, k) => {
            const lines = s(i.list).split("\n").map((l) => l.trim()).filter(Boolean);
            return (
              <details key={k}>
                <summary>
                  <span style={{ fontSize: 16 }}>{s(i.icon) || "✦"}</span>
                  {s(i.name)}
                  {lines.length > 0 && <span className="kc-eq-count">{lines.length}</span>}
                  <span className="chev">＋</span>
                </summary>
                {(lines.length > 0 || s(i.desc) || s(i.image)) && (
                  <div className="body">
                    {s(i.image) && <img src={s(i.image)} alt="" style={{ width: "100%", aspectRatio: orig ? undefined : "16/9", height: orig ? "auto" : undefined, objectFit: orig ? undefined : "cover", borderRadius: 10, marginBottom: 8, boxShadow: imShadow }} />}
                    {lines.length > 0 && (
                      <ul className="kc-eq-list">
                        {lines.map((l, j) => <li key={j}><span className="ck">✓</span>{l}</li>)}
                      </ul>
                    )}
                    {s(i.desc) && <div style={{ marginTop: lines.length ? 8 : 0 }}>{s(i.desc)}</div>}
                  </div>
                )}
              </details>
            );
          })}
        </div>
      );
    }
    case "around":
      return <AroundBlock data={d} fmt={bf || (shape === "original" ? "original" : "")} />;
    case "welcome":
      return <WelcomeBlock data={d} />;
    case "maps": {
      const addr = s(d.address);
      if (!addr) return null;
      const q = encodeURIComponent(addr);
      const embed = `https://www.google.com/maps?q=${q}&z=15&hl=fr&output=embed`;
      const dir = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
      const mfmt = (bf || s(d.format)).replace(":", "/");
      const mar = ["16/9", "4/3", "1/1", "3/4", "21/9"].includes(mfmt) ? mfmt : "16/9";
      return (
        <div className="kc-maps">
          {s(d.title) && <div className="kc-sec-title" style={{ padding: "0 2px 10px" }}>📍 {s(d.title)}</div>}
          <div className="frame" style={{ aspectRatio: mar, minHeight: 180 }}>
            <iframe src={embed} title={s(d.title) || "Carte"} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
            <a className="go" href={dir} target="_blank" rel="noopener">
              <span className="pin">➤</span> {s(d.btnLabel) || "Itinéraire"}
            </a>
          </div>
          {(s(d.address) || s(d.note)) && (
            <div className="info">
              <span className="ic">📍</span>
              <div>
                <b>{s(d.address)}</b>
                {s(d.note) && <small>{s(d.note)}</small>}
              </div>
            </div>
          )}
        </div>
      );
    }
    case "rules": {
      const items = arr(d.items).filter((i) => s(i.name));
      return (
        <div className="kc-rules">
          <div className="kc-sec-title">{s(d.title) || "Règles de la maison"}</div>
          {(s(d.checkin) || s(d.checkout)) && (
            <div className="io">
              {s(d.checkin) && (
                <div className="slot">
                  <span className="ic">🔑</span>
                  <div><small>Arrivée</small><b>{animDigits(s(d.checkin))}</b></div>
                </div>
              )}
              {s(d.checkout) && (
                <div className="slot">
                  <span className="ic">🧳</span>
                  <div><small>Départ</small><b>{animDigits(s(d.checkout))}</b></div>
                </div>
              )}
            </div>
          )}
          {s(d.cancel) && (
            <div className="cancel"><span className="ic">📅</span>{s(d.cancel)}</div>
          )}
          {items.length > 0 && (
            <div className="list">
              {items.map((i, k) => (
                <div key={k} className="rule" style={{ animationDelay: `${k * 60}ms` }}>
                  <span className="ic">
                    {s(i.image)
                      ? <img src={s(i.image)} alt="" />
                      : (s(i.icon) || "📌")}
                  </span>
                  <div>
                    <b>{s(i.name)}</b>
                    {s(i.desc) && <small>{s(i.desc)}</small>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    case "loyalty":
      return <LoyaltyCard cardId={cardId} blockId={block.id} data={d} />;
    case "splitter":
    case "profile":
    case "chatbot":
      return null; // gérés par le hero / la bulle flottante
    default:
      return null;
  }
}

/* ---------- Composant principal ---------- */

export default function CardRenderer({ card, actions }: { card: Card; actions?: CardActions }) {
  const t = resolveTheme(card);
  const custom = card.custom;
  const fontStack = CARD_FONTS[custom?.font || "sans"]?.stack ?? CARD_FONTS.sans.stack;
  const overlay = typeof custom?.overlay === "number" ? Math.min(100, Math.max(0, custom.overlay)) / 100 : 1;
  const vars = {
    "--c-bg": t.bg, "--c-surface": t.surface, "--c-ink": t.ink, "--c-soft": t.soft,
    "--c-line": t.line, "--c-accent": t.accent, "--c-accent2": t.accent2, "--c-accent-ink": t.accentInk,
    "--c-font": fontStack, "--c-ov": overlay,
    "--c-ovcolor": custom?.overlayColor || "#0A0A0C",
    "--c-r": `${typeof custom?.radius === "number" ? custom.radius : 20}px`,
    ...(custom?.align ? { textAlign: custom.align } : {}),
  } as React.CSSProperties;

  const profile = card.blocks.find((b) => b.type === "profile")?.data as Dict | undefined;
  const banner = card.blocks.find((b) => b.type === "banner")?.data as Dict | undefined;
  const avatarBlk = card.blocks.find((b) => b.type === "avatar")?.data as Dict | undefined;
  // Avatar du haut de carte : l'image du bloc « Avatar » (logo, personne…) en priorité,
  // sinon la photo de profil en secours.
  const heroAvatar = s(avatarBlk?.image) || s(profile?.photo);
  const hasChatbot = card.blocks.some((b) => b.type === "chatbot");
  const chatbotGreeting = s((card.blocks.find((b) => b.type === "chatbot")?.data as Dict | undefined)?.greeting);

  const heroImg = s(banner?.image) || s(profile?.photo);
  const name = s(profile?.name) || card.title;
  const chips = [s(profile?.title), s(profile?.company)].filter(Boolean);

  // Sections = tous les blocs sauf ceux absorbés par le hero (1er profile / 1er banner) et le chatbot
  let heroProfileUsed = false;
  let heroBannerUsed = false;
  let heroAvatarUsed = false;
  const sections = card.blocks.filter((b) => {
    if (b.type === "profile" && !heroProfileUsed) { heroProfileUsed = true; return false; }
    if (b.type === "banner" && !heroBannerUsed) { heroBannerUsed = true; return false; }
    if (b.type === "avatar" && !heroAvatarUsed) { heroAvatarUsed = true; return false; }
    if (b.type === "chatbot" || b.type === "splitter") return false;
    return true;
  });

  const bgImage = s(custom?.bgImage);
  const bgOv = typeof custom?.bgOverlay === "number" ? Math.min(100, Math.max(0, custom.bgOverlay)) / 100 : 0.45;

  return (
    <div className={`kc${bgImage ? " kc--bgimg" : ""}`} style={bgImage ? { ...vars, backgroundImage: `url('${bgImage}')` } : vars}>
      {bgImage && <div className="kc-bg-ov" style={{ opacity: bgOv }} />}
      {/* HERO */}
      <div
        className="kc-hero"
        style={{
          ...(heroImg
            ? { backgroundImage: `url('${heroImg}')` }
            : { background: `linear-gradient(150deg, ${t.accent}, ${t.accent2})` }),
          ...(typeof custom?.heroHeight === "number" ? { minHeight: custom.heroHeight } : {}),
        }}
      >
        <div className="kc-hero-ov" />
        <div className="kc-hero-in">
          {/* Avatar dans le flux → ne se superpose jamais au nom/aux infos */}
          {heroAvatar && (() => {
            const av = custom || {};
            const size = typeof av.avatarSize === "number" ? Math.min(130, Math.max(50, av.avatarSize)) : 74;
            const ml = av.avatarPos === "droite" || av.avatarPos === "centre" ? "auto" : "0";
            const mr = av.avatarPos === "centre" ? "auto" : av.avatarPos === "droite" ? "0" : "auto";
            return (
              <div className="kc-avatar" style={{
                width: size, height: size, marginLeft: ml, marginRight: mr, marginBottom: 12,
                backgroundImage: `url('${heroAvatar}')`,
                border: av.avatarRing === false ? "none" : undefined,
                boxShadow: av.avatarShadow === false ? "none" : undefined,
              }} />
            );
          })()}
          <div className="kc-hero-name">{name}</div>
          {chips.length > 0 && (
            <div className="kc-chips">
              {chips.map((c, i) => <span key={i} className="kc-chip">{c}</span>)}
            </div>
          )}
          {s(profile?.bio) && <p className="kc-hero-bio">{s(profile?.bio)}</p>}
          {(() => {
            const ph = s(profile?.phone), em = s(profile?.email), ad = s(profile?.address);
            if (!ph && !em && !ad) return null;
            const dir = ad ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ad)}` : "";
            return (
              <div className="kc-hero-contact">
                {ph && <a className="row" href={`tel:${ph.replace(/\s/g, "")}`}><span className="ic">📞</span><span className="tx">{ph}</span></a>}
                {em && <a className="row" href={`mailto:${em}`}><span className="ic">✉️</span><span className="tx">{em}</span></a>}
                {ad && <a className="row" href={dir} target="_blank" rel="noopener"><span className="ic">📍</span><span className="tx">{ad}</span></a>}
              </div>
            );
          })()}
          {profile?.savebtn !== false && (s(profile?.phone) || s(profile?.email) || s(profile?.address) || s(profile?.name)) && (
            <button type="button" data-kc-vcard className="kc-hero-save">📇 Enregistrer le contact</button>
          )}
        </div>
      </div>

      {/* SECTIONS */}
      <div className="kc-body">
        {sections.map((b, i) => {
          const content = renderBlock(b, card.id, custom);
          if (!content) return null;
          const bd = b.data as Dict;
          const al = s(bd.__align);
          const fk = s(bd.__font);
          const ts = s(bd.__textSize);
          const perBlock: React.CSSProperties = {
            animationDelay: `${Math.min(i * 70, 420)}ms`,
            ...(typeof bd.__mt === "number" ? { marginTop: bd.__mt } : {}),
            ...(typeof bd.__mb === "number" ? { marginBottom: bd.__mb } : {}),
            ...(al ? { textAlign: al as React.CSSProperties["textAlign"] } : {}),
            ...(fk && CARD_FONTS[fk] ? { fontFamily: CARD_FONTS[fk].stack } : {}),
            ...(ts ? { ["--kc-tscale" as string]: ts === "s" ? "0.85" : ts === "l" ? "1.25" : ts === "xl" ? "1.5" : "1" } : {}),
          };
          return (
            <section key={b.id}
              className={`kc-sec${["video", "social", "welcome"].includes(b.type) ? " kc-sec--flush" : ["gallery", "carousel", "media", "product", "around"].includes(b.type) ? " kc-sec--media" : ""}${ts ? " kc-sec--tscale" : ""}${al ? ` kc-al-${al}` : ""}${typeof bd.__anim === "string" && bd.__anim ? ` kc-a-${bd.__anim}` : ""}`}
              style={perBlock}>
              {content}
            </section>
          );
        })}

        {/* Bulle chatbot (avatar / emoji personnalisable) */}
        {hasChatbot && (() => {
          const cb = card.blocks.find((b) => b.type === "chatbot")?.data as Dict | undefined;
          const av = cb && typeof cb.avatar === "string" ? cb.avatar : "";
          const em = cb && typeof cb.emoji === "string" && cb.emoji ? (cb.emoji as string) : "✨";
          return (
            <button
              className="kc-chat"
              aria-label="Assistant IA"
              title={chatbotGreeting || "Assistant IA"}
              onClick={actions?.onChat}
              style={av ? { backgroundImage: `url('${av}')`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : undefined}
            >{av ? "" : em}</button>
          );
        })()}

      </div>
    </div>
  );
}

/** Chiffres animés : chaque caractère numérique apparaît avec un flip décalé. */
function animDigits(text: string, row = 0): React.ReactNode {
  return (
    <span className="kc-anum">
      {text.split("").map((ch, i) =>
        /\d/.test(ch)
          ? <span key={i} className="dg" style={{ animationDelay: `${Math.min(row * 90, 600) + i * 45}ms` }}>{ch}</span>
          : <span key={i}>{ch === " " ? " " : ch}</span>
      )}
    </span>
  );
}

function toEmbed(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}
