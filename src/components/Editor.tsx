"use client";
// Éditeur Bazookard v2 — 3 colonnes : blocs (gauche) · aperçu live (centre) · réglages (droite).
// Cliquer un bloc à gauche ouvre ses réglages à droite. Fluide, sans accordéons.
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Card, Block } from "@/lib/types";
import { THEMES, CARD_THEMES, CARD_FONTS, cardTheme, type CardCustom } from "@/lib/types";
import { BLOCK_DEFS, BLOCK_MAP, type Field, type SubField } from "@/lib/blocks";
import { newBlock, uid } from "@/lib/store";
import { TEMPLATES, templateBlocks, type CardTemplate } from "@/lib/templates";
import { saveCard } from "@/lib/db";
import type { Permissions } from "@/lib/admin-store";
import CardRenderer from "./CardRenderer";
import ImageInput from "./ImageInput";
import { uploadImage } from "@/lib/upload";
import ConfirmModal from "./ConfirmModal";

type Dict = Record<string, unknown>;
type Sel = string | "style" | null;

const FULL: Permissions = { editText: true, editStructure: true, publish: true, viewLeads: true };

export default function Editor({ initial, perms = FULL, backHref = "/dashboard", backLabel = "Tableau de bord", onLogout, onSave }: {
  initial: Card; perms?: Permissions; backHref?: string; backLabel?: string; onLogout?: () => void; onSave?: (c: Card) => void;
}) {
  const [card, setCard] = useState<Card>(initial);
  const [sel, setSel] = useState<Sel>(card.blocks[0]?.id ?? (perms.editStructure ? "style" : null));
  const [adding, setAdding] = useState(false);
  const [picking, setPicking] = useState(false);
  const [tplConfirm, setTplConfirm] = useState<CardTemplate | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  /** Applique un modèle : remplace les blocs + le thème de la carte courante (garde id/slug). */
  function applyTemplate(tpl: CardTemplate) {
    if (!perms.editStructure) return;
    const blocks = templateBlocks(tpl, uid);
    commit({ ...card, themeIndex: tpl.themeIndex, custom: undefined, blocks });
    setSel(blocks[0]?.id ?? null);
    setPicking(false);
    setTplConfirm(null);
  }

  function saveNow() {
    void import("@/lib/admin-db").then((m) => m.syncWorkspaceSlug(card.id, card.slug)).catch(() => {});
    commit({ ...card });
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }
  function commit(next: Card) {
    setCard(next);
    if (onSave) onSave(next);
    else void saveCard(next);
  }
  function updateBlock(id: string, data: Dict) {
    if (!perms.editText) return;
    commit({ ...card, blocks: card.blocks.map((b) => (b.id === id ? { ...b, data } : b)) });
  }
  function addBlock(type: Block["type"]) {
    if (!perms.editStructure) return;
    const b = newBlock(type);
    commit({ ...card, blocks: [...card.blocks, b] });
    setSel(b.id);
    setAdding(false);
  }
  function removeBlock(id: string) {
    if (!perms.editStructure) return;
    commit({ ...card, blocks: card.blocks.filter((b) => b.id !== id) });
    if (sel === id) setSel(null);
  }
  function setCustom(patch: Partial<CardCustom>) {
    if (!perms.editStructure) return;
    commit({ ...card, custom: { ...card.custom, ...patch } });
  }
  function move(id: string, dir: -1 | 1) {
    if (!perms.editStructure) return;
    const i = card.blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (j < 0 || j >= card.blocks.length) return;
    const blocks = [...card.blocks];
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    commit({ ...card, blocks });
  }

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  function dropOn(target: number) {
    if (dragIdx === null || dragIdx === target || !perms.editStructure) { setDragIdx(null); return; }
    const blocks = [...card.blocks];
    const [moved] = blocks.splice(dragIdx, 1);
    blocks.splice(target, 0, moved);
    commit({ ...card, blocks });
    setDragIdx(null);
    setOverIdx(null);
  }

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/${card.slug}` : `/${card.slug}`;
  const [copied, setCopied] = useState(false);
  function copyLink() {
    try { navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }

  const selBlock = sel && sel !== "style" ? card.blocks.find((b) => b.id === sel) : undefined;

  return (
    <div className="admin" style={{ minHeight: "100vh" }}>
      {/* Top bar */}
      <div style={bar}>
        <Link href={backHref} className="btn btn-ghost">← {backLabel}</Link>
        <input
          className="in"
          style={{ maxWidth: 260, fontWeight: 600 }}
          value={card.title}
          readOnly={!perms.editText}
          onChange={(e) => perms.editText && commit({ ...card, title: e.target.value })}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!perms.publish && (
            <span style={{ fontSize: 11.5, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              🔒 Publication gérée par Adamkom by JJP
            </span>
          )}
          <button onClick={saveNow} className="btn btn-primary">{saved ? "✓ Enregistré" : "💾 Enregistrer"}</button>
          <Link href={`/${card.slug}`} target="_blank" className="btn">👁 Aperçu public</Link>
        </div>
      </div>

      {toDelete && (
        <ConfirmModal dark
          message={`Supprimer le bloc « ${BLOCK_MAP[card.blocks.find((b) => b.id === toDelete)?.type ?? "headline"]?.name ?? ""} » ?`}
          onCancel={() => setToDelete(null)}
          onConfirm={() => { removeBlock(toDelete); setToDelete(null); }}
        />
      )}

      {/* Lien de la carte */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 20px", borderBottom: "1px solid var(--line)", background: "#fff", fontSize: 13 }}>
        <span style={{ color: "var(--muted)", fontWeight: 600 }}>Lien de la carte :</span>
        <span style={{ color: "var(--muted)" }}>/</span>
        <input
          className="in"
          style={{ width: 190, padding: "6px 10px", fontSize: 13, fontFamily: "monospace" }}
          value={card.slug}
          readOnly={!perms.editStructure}
          onChange={(e) => {
            if (!perms.editStructure) return;
            const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 50);
            const RESERVED = ["admin", "client", "login", "dashboard", "editor", "demo", "mentions", "api", "c"];
            commit({ ...card, slug: RESERVED.includes(v) ? v + "-1" : v });
          }}
        />
        <button className="btn" style={{ padding: "6px 11px", fontSize: 12.5 }} onClick={copyLink}>{copied ? "✓ Copié !" : "🔗 Copier le lien"}</button>
        <a className="btn" style={{ padding: "6px 11px", fontSize: 12.5 }} target="_blank" rel="noopener"
          href={`https://wa.me/?text=${encodeURIComponent("Découvrez ma carte : " + publicUrl)}`}>Partager WhatsApp</a>
        <a className="btn" style={{ padding: "6px 11px", fontSize: 12.5 }}
          href={`mailto:?subject=${encodeURIComponent("Ma carte " + card.title)}&body=${encodeURIComponent("Découvrez ma carte : " + publicUrl)}`}>Partager Email</a>
        {onLogout && (
          <button className="btn btn-ghost" style={{ marginLeft: "auto", padding: "6px 11px", fontSize: 12.5 }} onClick={onLogout}>
            Déconnexion
          </button>
        )}
      </div>

      <div className="ed-grid">
        {/* ===== Colonne gauche : liste des blocs ===== */}
        <div className="ed-side">
          {perms.editStructure && (
            <button className={`ed-row${sel === "style" ? " sel" : ""}`} onClick={() => setSel(sel === "style" ? null : "style")}>
              <span>🎨</span><span className="nm">Style de la carte</span>
            </button>
          )}
          <div className="lbl" style={{ margin: "8px 2px 2px" }}>Sections de la carte</div>
          {card.blocks.map((b, idx) => {
            const def = BLOCK_MAP[b.type];
            const isSel = sel === b.id;
            return (
              <div key={b.id}
                className={`ed-row${isSel ? " sel" : ""}${dragIdx === idx ? " drag" : ""}${overIdx === idx && dragIdx !== null && dragIdx !== idx ? " over" : ""}`}
                onClick={() => setSel(isSel ? null : b.id)} role="button"
                draggable={perms.editStructure}
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
                onDragLeave={() => setOverIdx((o) => (o === idx ? null : o))}
                onDrop={() => dropOn(idx)}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}>
                <span style={{ cursor: perms.editStructure ? "grab" : undefined }} title="Glisser pour déplacer">⠿</span>
                <span>{def.icon}</span>
                <span className="nm">{String((b.data as Dict).__name ?? def.name)}</span>
                {perms.editStructure && (
                  <span className="acts" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => move(b.id, -1)} disabled={idx === 0} style={mini} title="Monter">↑</button>
                    <button onClick={() => move(b.id, 1)} disabled={idx === card.blocks.length - 1} style={mini} title="Descendre">↓</button>
                    <button onClick={() => setToDelete(b.id)} style={{ ...mini, color: "#f87171" }} title="Supprimer">✕</button>
                  </span>
                )}
              </div>
            );
          })}
          {perms.editStructure && (
            <button className="btn btn-primary" style={{ justifyContent: "center", padding: 12, marginTop: 6, fontWeight: 800 }} onClick={() => setAdding(true)}>
              + Ajouter une section
            </button>
          )}
          {perms.editStructure && (
            <button className="btn" style={{ justifyContent: "center", padding: 11, marginTop: 4, fontWeight: 700 }} onClick={() => setPicking(true)}>
              ✨ Partir d&apos;un modèle
            </button>
          )}
        </div>

        {/* ===== Colonne centrale : aperçu live ===== */}
        <div className="ed-preview">
          <div className="ed-phone">
            <div className="ed-phone-btn pwr" />
            <div className="ed-phone-btn vol1" />
            <div className="ed-phone-btn vol2" />
            <div className="ed-phone-screen">
              <PhoneStatusBar />
              <div className="ed-phone-island" />
              <div className="ed-phone-scroll"><CardRenderer card={card} /></div>
              <div className="ed-phone-home" />
            </div>
          </div>
          <div style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", maxWidth: 320 }}>
            Aperçu en direct — exactement ce que voit la personne qui tape votre tag NFC.
          </div>
        </div>

        {/* ===== Colonne droite : réglages ===== */}
        <div className="ed-panel">
          {sel === "style" && perms.editStructure && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <strong style={{ fontSize: 15 }}>🎨 Style de la carte</strong>
                <button onClick={() => setSel(null)} style={mini}>✕</button>
              </div>
              <div>
                <div className="lbl" style={{ marginBottom: 8 }}>Thème</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {THEMES.map((t, i) => (
                    <button key={i} title={CARD_THEMES[i]?.name}
                      onClick={() => commit({ ...card, themeIndex: i })}
                      style={{
                        width: 30, height: 30, borderRadius: 8, cursor: "pointer",
                        background: `linear-gradient(135deg,${t[0]},${t[1]})`,
                        border: i === card.themeIndex ? "2px solid var(--ink)" : "2px solid transparent",
                      }} />
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
                <ColorField label="Fond de la carte" value={card.custom?.bg || cardTheme(card.themeIndex).bg}
                  onChange={(v) => setCustom({ bg: v })} onReset={() => setCustom({ bg: undefined })} />
                <ColorField label="Fond des sections" value={card.custom?.surface || cardTheme(card.themeIndex).surface}
                  onChange={(v) => setCustom({ surface: v })} onReset={() => setCustom({ surface: undefined })} />
                <ColorField label="Couleur du texte" value={card.custom?.ink || cardTheme(card.themeIndex).ink}
                  onChange={(v) => setCustom({ ink: v })} onReset={() => setCustom({ ink: undefined })} />
                <ColorField label="Couleur d'accent (boutons)" value={card.custom?.accent || cardTheme(card.themeIndex).accent}
                  onChange={(v) => setCustom({ accent: v })} onReset={() => setCustom({ accent: undefined })} />
                <div>
                  <label className="lbl">Police</label>
                  <select className="in" value={card.custom?.font || "sans"}
                    onChange={(e) => setCustom({ font: e.target.value as CardCustom["font"] })}>
                    {Object.entries(CARD_FONTS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lbl">Alignement des textes</label>
                  <select className="in" value={card.custom?.align || ""}
                    onChange={(e) => setCustom({ align: e.target.value as CardCustom["align"] })}>
                    <option value="">Automatique</option>
                    <option value="left">À gauche</option>
                    <option value="center">Centré</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Arrondi des sections : {card.custom?.radius ?? 20}px</label>
                  <input type="range" min={0} max={28} value={card.custom?.radius ?? 20}
                    onChange={(e) => setCustom({ radius: Number(e.target.value) })} style={{ width: "100%", accentColor: "#E8A800" }} />
                </div>
                <div>
                  <label className="lbl">Format des images</label>
                  <select className="in" value={card.custom?.imgShape || ""}
                    onChange={(e) => setCustom({ imgShape: e.target.value as NonNullable<CardCustom["imgShape"]> })}>
                    <option value="">Carré (défaut)</option>
                    <option value="original">Original (sans recadrage)</option>
                    <option value="rond">Rond</option>
                    <option value="paysage">Paysage 16:9</option>
                    <option value="portrait">Portrait 3:4</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Ombre des images</label>
                  <select className="in" value={card.custom?.imgShadow || ""}
                    onChange={(e) => setCustom({ imgShadow: e.target.value as NonNullable<CardCustom["imgShadow"]> })}>
                    <option value="">Aucune</option>
                    <option value="douce">Douce</option>
                    <option value="forte">Forte</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Taille des images</label>
                  <select className="in" value={card.custom?.imgSize || "m"}
                    onChange={(e) => setCustom({ imgSize: e.target.value as NonNullable<CardCustom["imgSize"]> })}>
                    <option value="s">Petites</option>
                    <option value="m">Moyennes</option>
                    <option value="l">Grandes</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Position de l&apos;avatar (hero)</label>
                  <select className="in" value={card.custom?.avatarPos || ""}
                    onChange={(e) => setCustom({ avatarPos: e.target.value as NonNullable<CardCustom["avatarPos"]> })}>
                    <option value="">À gauche</option>
                    <option value="centre">Centré</option>
                    <option value="droite">À droite</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Taille avatar : {card.custom?.avatarSize ?? 74}px</label>
                  <input type="range" min={50} max={130} value={card.custom?.avatarSize ?? 74}
                    onChange={(e) => setCustom({ avatarSize: Number(e.target.value) })} style={{ width: "100%", accentColor: "#E8A800" }} />
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--muted)", cursor: "pointer" }}>
                    <input type="checkbox" checked={card.custom?.avatarRing !== false}
                      onChange={(e) => setCustom({ avatarRing: e.target.checked })} style={{ accentColor: "#E8A800" }} /> Anneau
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--muted)", cursor: "pointer" }}>
                    <input type="checkbox" checked={card.custom?.avatarShadow !== false}
                      onChange={(e) => setCustom({ avatarShadow: e.target.checked })} style={{ accentColor: "#E8A800" }} /> Ombre avatar
                  </label>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="lbl">Hauteur de la bannière / profil : {card.custom?.heroHeight ?? 280}px</label>
                  <input type="range" min={200} max={620} step={10} value={card.custom?.heroHeight ?? 280}
                    onChange={(e) => setCustom({ heroHeight: Number(e.target.value) })} style={{ width: "100%", accentColor: "#E8A800" }} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--muted)", cursor: "pointer" }}>
                    <input type="checkbox" checked={card.custom?.noHeroImage !== true}
                      onChange={(e) => setCustom({ noHeroImage: !e.target.checked })} style={{ accentColor: "#E8A800" }} />
                    Utiliser la photo de profil en grande image d&apos;en-tête
                  </label>
                  <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                    Décochez si vous voulez une <b>image de fond</b> (ci-dessous) comme visuel principal : la photo restera en petit avatar rond.
                  </p>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="lbl">🖼 Image de fond de toute la carte (optionnel)</label>
                  <ImageInput value={card.custom?.bgImage ?? ""} onChange={(v) => setCustom({ bgImage: v })}
                    placeholder="Image d'ambiance affichée derrière tous les blocs" />
                </div>
                {card.custom?.bgImage && (
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className="lbl">Voile sombre sur l&apos;image de fond : {card.custom?.bgOverlay ?? 45}%</label>
                    <input type="range" min={0} max={100} value={card.custom?.bgOverlay ?? 45}
                      onChange={(e) => setCustom({ bgOverlay: Number(e.target.value) })} style={{ width: "100%", accentColor: "#E8A800" }} />
                  </div>
                )}
                {card.custom?.bgImage && (
                  <div>
                    <label className="lbl">Comportement du fond</label>
                    <select className="in" value={card.custom?.bgAttach || "scroll"}
                      onChange={(e) => setCustom({ bgAttach: e.target.value as NonNullable<CardCustom["bgAttach"]> })}>
                      <option value="scroll">Défile avec la carte</option>
                      <option value="fixed">Fixe (zoom réduit, calé à l&apos;écran)</option>
                    </select>
                  </div>
                )}
                {card.custom?.bgImage && (
                  <div>
                    <label className="lbl">Ajustement de l&apos;image</label>
                    <select className="in" value={card.custom?.bgFit || "cover"}
                      onChange={(e) => setCustom({ bgFit: e.target.value as NonNullable<CardCustom["bgFit"]> })}>
                      <option value="cover">Remplir (recadre)</option>
                      <option value="contain">Entière (sans recadrage)</option>
                    </select>
                  </div>
                )}
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="lbl">Voile du hero (lisibilité des textes) : {card.custom?.overlay ?? 100}%</label>
                  <input type="range" min={0} max={100} value={card.custom?.overlay ?? 100}
                    onChange={(e) => setCustom({ overlay: Number(e.target.value) })} style={{ width: "100%", accentColor: "#E8A800" }} />
                </div>
                <ColorField label="Couleur du voile du hero" value={card.custom?.overlayColor || "#0A0A0C"}
                  onChange={(v) => setCustom({ overlayColor: v })} onReset={() => setCustom({ overlayColor: undefined })} />
                <div />
                <div>
                  <label className="lbl">Taille du QR code : {card.custom?.qrSize ?? 172}px</label>
                  <input type="range" min={120} max={260} step={4} value={card.custom?.qrSize ?? 172}
                    onChange={(e) => setCustom({ qrSize: Number(e.target.value) })} style={{ width: "100%", accentColor: "#E8A800" }} />
                </div>
                <div />
                <div>
                  <label className="lbl">Marge au-dessus du QR : {card.custom?.qrMt ?? 0}px</label>
                  <input type="range" min={0} max={60} value={card.custom?.qrMt ?? 0}
                    onChange={(e) => setCustom({ qrMt: Number(e.target.value) })} style={{ width: "100%", accentColor: "#E8A800" }} />
                </div>
                <div>
                  <label className="lbl">Marge en dessous du QR : {card.custom?.qrMb ?? 0}px</label>
                  <input type="range" min={0} max={60} value={card.custom?.qrMb ?? 0}
                    onChange={(e) => setCustom({ qrMb: Number(e.target.value) })} style={{ width: "100%", accentColor: "#E8A800" }} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="lbl">Logo au centre du QR code</label>
                  <ImageInput value={card.custom?.qrLogo ?? ""}
                    onChange={(v) => setCustom({ qrLogo: v })}
                    placeholder="Logo à afficher au centre du QR" />
                  <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                    Sans logo choisi ici, on utilise l&apos;avatar/photo de la carte, sinon le logo Bazookard.
                  </p>
                  <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--muted)", cursor: "pointer", marginTop: 8 }}>
                    <input type="checkbox" checked={card.custom?.hideQr === true}
                      onChange={(e) => setCustom({ hideQr: e.target.checked })} style={{ accentColor: "#E8A800" }} />
                    Masquer le QR code
                  </label>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="lbl">Mention « Propulsé par » (bas de carte)</label>
                  <input className="in" value={card.custom?.credit ?? "Bazookard"}
                    placeholder="Bazookard"
                    onChange={(e) => setCustom({ credit: e.target.value })} />
                  <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--muted)", cursor: "pointer", marginTop: 8 }}>
                    <input type="checkbox" checked={card.custom?.hideCredit === true}
                      onChange={(e) => setCustom({ hideCredit: e.target.checked })} style={{ accentColor: "#E8A800" }} />
                    Masquer complètement la mention
                  </label>
                </div>
              </div>
            </div>
          )}

          {selBlock && (() => {
            const def = BLOCK_MAP[selBlock.type];
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{def.icon}</span>
                  {perms.editText ? (
                    <input className="in" style={{ padding: "6px 10px", fontSize: 14, fontWeight: 700 }}
                      value={String((selBlock.data as Dict).__name ?? def.name)}
                      onChange={(e) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __name: e.target.value })}
                      title="Renommer ce bloc" />
                  ) : (
                    <strong style={{ fontSize: 15, flex: 1 }}>{String((selBlock.data as Dict).__name ?? def.name)}</strong>
                  )}
                  <button onClick={() => setSel(null)} style={mini} title="Fermer">✕</button>
                </div>

                {def.fields.map((f) => (
                  <FieldInput key={f.key} field={f} value={(selBlock.data as Dict)[f.key]} disabled={!perms.editText}
                    onChange={(v) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), [f.key]: v })} />
                ))}

                {def.type === "chatbot" && (
                  <button type="button" className="btn btn-primary" onClick={saveNow}
                    style={{ justifyContent: "center", fontWeight: 800 }}>
                    {saved ? "✓ Base de connaissances enregistrée" : "💾 Enregistrer la base de connaissances"}
                  </button>
                )}

                {def.type === "video" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px" }}>
                    <div>
                      <label className="lbl">Ombre de la vidéo</label>
                      <select className="in" value={String((selBlock.data as Dict).__shadow ?? "")} disabled={!perms.editText}
                        onChange={(e) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __shadow: e.target.value })}>
                        <option value="">Automatique</option>
                        <option value="aucune">Aucune</option>
                        <option value="douce">Douce</option>
                        <option value="forte">Forte</option>
                      </select>
                    </div>
                    <div>
                      <label className="lbl">Arrondi des bords : {Number((selBlock.data as Dict).__radius ?? 20)}px</label>
                      <input type="range" min={0} max={40} value={Number((selBlock.data as Dict).__radius ?? 20)} disabled={!perms.editText}
                        onChange={(e) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __radius: Number(e.target.value) })}
                        style={{ width: "100%", accentColor: "#E8A800" }} />
                    </div>
                  </div>
                )}

                {def.type === "carousel" && (() => {
                  const sec = Number((selBlock.data as Dict).__slideSec ?? 0);
                  return (
                    <div>
                      <label className="lbl">⏱ Défilement automatique : {sec > 0 ? `toutes les ${sec}s` : "manuel (glisser)"}</label>
                      <input type="range" min={0} max={10} step={1} value={sec} disabled={!perms.editText}
                        onChange={(e) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __slideSec: Number(e.target.value) })}
                        style={{ width: "100%", accentColor: "#E8A800" }} />
                      <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                        0 = l&apos;utilisateur fait défiler lui-même. Sinon, les images défilent toutes seules au rythme choisi.
                      </p>
                    </div>
                  );
                })()}

                {["gallery", "carousel", "media", "events", "offers", "product", "around", "equipment"].includes(def.type) && (
                  <div>
                    <label className="lbl">🖼 Format des images de ce bloc</label>
                    <select className="in" value={String((selBlock.data as Dict).__fmt ?? "")} disabled={!perms.editText}
                      onChange={(e) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __fmt: e.target.value })}>
                      <option value="">Automatique (réglage global)</option>
                      <option value="original">Original (taille de l&apos;image, sans recadrage)</option>
                      <option value="carre">Carré 1:1</option>
                      <option value="portrait">Portrait 3:4</option>
                      <option value="vertical">Vertical 9:16 (story)</option>
                      <option value="paysage">Paysage 16:9</option>
                      <option value="pano">Panoramique 21:9</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="lbl">✨ Animation d&apos;apparition du bloc</label>
                  <select className="in" value={String((selBlock.data as Dict).__anim ?? "")} disabled={!perms.editText}
                    onChange={(e) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __anim: e.target.value })}>
                    <option value="">Standard (cascade)</option>
                    <option value="fondu">Fondu</option>
                    <option value="glisse">Glissé latéral</option>
                    <option value="zoom">Zoom</option>
                    <option value="rebond">Rebond</option>
                    <option value="aucune">Aucune</option>
                  </select>
                </div>

                {/* Réglages texte & espacement propres à ce bloc */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px" }}>
                  <div>
                    <label className="lbl">Alignement du texte</label>
                    <select className="in" value={String((selBlock.data as Dict).__align ?? "")} disabled={!perms.editText}
                      onChange={(e) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __align: e.target.value })}>
                      <option value="">Automatique</option>
                      <option value="left">À gauche</option>
                      <option value="center">Centré</option>
                      <option value="right">À droite</option>
                    </select>
                  </div>
                  <div>
                    <label className="lbl">Taille du texte</label>
                    <select className="in" value={String((selBlock.data as Dict).__textSize ?? "")} disabled={!perms.editText}
                      onChange={(e) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __textSize: e.target.value })}>
                      <option value="">Normale</option>
                      <option value="s">Petite</option>
                      <option value="l">Grande</option>
                      <option value="xl">Très grande</option>
                    </select>
                  </div>
                  <div>
                    <label className="lbl">Police du bloc</label>
                    <select className="in" value={String((selBlock.data as Dict).__font ?? "")} disabled={!perms.editText}
                      onChange={(e) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __font: e.target.value })}>
                      <option value="">Automatique (globale)</option>
                      {Object.entries(CARD_FONTS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
                    </select>
                  </div>
                  <ColorField label="Couleur du texte"
                    value={String((selBlock.data as Dict).__textColor ?? "")}
                    onChange={(v) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __textColor: v })}
                    onReset={() => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __textColor: "" })} />
                  <div>
                    <label className="lbl">Marge en haut : {Number((selBlock.data as Dict).__mt ?? 0)}px</label>
                    <input type="range" min={0} max={60} value={Number((selBlock.data as Dict).__mt ?? 0)} disabled={!perms.editText}
                      onChange={(e) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __mt: Number(e.target.value) })}
                      style={{ width: "100%", accentColor: "#E8A800" }} />
                  </div>
                  <div>
                    <label className="lbl">Marge en bas : {Number((selBlock.data as Dict).__mb ?? 0)}px</label>
                    <input type="range" min={0} max={60} value={Number((selBlock.data as Dict).__mb ?? 0)} disabled={!perms.editText}
                      onChange={(e) => updateBlock(selBlock.id, { ...(selBlock.data as Dict), __mb: Number(e.target.value) })}
                      style={{ width: "100%", accentColor: "#E8A800" }} />
                  </div>
                  <label style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer" }}>
                    <span className="lbl" style={{ marginBottom: 0 }}>Supprimer le fond blanc du bloc (transparent)</span>
                    <button type="button" className={`a-switch ${(selBlock.data as Dict).__noBg === true ? "on" : ""}`} disabled={!perms.editText}
                      onClick={() => perms.editText && updateBlock(selBlock.id, { ...(selBlock.data as Dict), __noBg: !((selBlock.data as Dict).__noBg === true) })}
                      aria-label="Supprimer le fond du bloc" />
                  </label>
                </div>

                {perms.editStructure && (
                  <button className="btn btn-ghost" style={{ justifyContent: "center", color: "#f87171", borderStyle: "dashed" }}
                    onClick={() => setToDelete(selBlock.id)}>
                    🗑 Supprimer cette section
                  </button>
                )}
              </div>
            );
          })()}

          {!sel && (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: "44px 12px", fontSize: 13.5, lineHeight: 1.7 }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>👈</div>
              Sélectionnez une section à gauche pour la modifier ici,<br />
              ou cliquez sur <b>+ Ajouter une section</b>.
            </div>
          )}
        </div>
      </div>

      {/* ===== Catalogue de sections (modal) ===== */}
      {adding && (
        <div className="ed-cat-overlay" onClick={() => setAdding(false)}>
          <div className="ed-cat" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <strong style={{ fontSize: 17 }}>Ajouter une section</strong>
              <button onClick={() => setAdding(false)} style={mini}>✕</button>
            </div>
            <AddPanel onPick={addBlock} />
          </div>
        </div>
      )}

      {/* ===== Choix d'un modèle (modal) ===== */}
      {picking && (
        <div className="ed-cat-overlay" onClick={() => setPicking(false)}>
          <div className="ed-cat" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <strong style={{ fontSize: 17 }}>✨ Partir d&apos;un modèle</strong>
              <button onClick={() => setPicking(false)} style={mini}>✕</button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>
              Choisissez un modèle métier : ses sections remplacent le contenu actuel. Vous pourrez ensuite tout modifier.
            </p>
            <div className="ed-tpl-grid">
              {TEMPLATES.map((t) => (
                <button key={t.id} className="ed-tpl" onClick={() => setTplConfirm(t)}>
                  <span className="em">{t.emoji}</span>
                  <span className="nm">{t.name}</span>
                  <span className="ni">{t.niche}</span>
                  <span className="ct">{t.blocks.length} sections</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tplConfirm && (
        <ConfirmModal dark
          message={`Appliquer le modèle « ${tplConfirm.name} » ? Les sections actuelles seront remplacées.`}
          onCancel={() => setTplConfirm(null)}
          onConfirm={() => applyTemplate(tplConfirm)}
        />
      )}
    </div>
  );
}

/* --- Catalogue de blocs, groupé par catégorie --- */
function AddPanel({ onPick }: { onPick: (t: Block["type"]) => void }) {
  const cats = ["Identité", "Contact", "Contenu", "Conversion", "IA"] as const;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {cats.map((cat) => (
        <div key={cat}>
          <div className="lbl" style={{ marginBottom: 7 }}>{cat}</div>
          <div className="ed-cat-grid">
            {BLOCK_DEFS.filter((d) => d.category === cat).map((d) => (
              <button key={d.type} onClick={() => onPick(d.type)} style={addItem}>
                <span style={{ width: 22, textAlign: "center" }}>{d.icon}</span> {d.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- Champ générique piloté par le schéma --- */
function FieldInput({ field, value, onChange, disabled = false }: {
  field: Field; value: unknown; onChange: (v: unknown) => void; disabled?: boolean;
}) {
  if (field.type === "select") {
    return (
      <div>
        <label className="lbl">{field.label}</label>
        <select className="in" value={String(value ?? "")} disabled={disabled}
          onChange={(e) => !disabled && onChange(e.target.value)}>
          {(field.options ?? []).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
    );
  }
  if (field.type === "toggle") {
    const on = value !== false;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span className="lbl" style={{ marginBottom: 0 }}>{field.label}</span>
        <button type="button" className={`a-switch ${on ? "on" : ""}`} disabled={disabled}
          onClick={() => !disabled && onChange(!on)} aria-label={field.label} />
      </div>
    );
  }
  if (field.type === "repeater") {
    const items = Array.isArray(value) ? (value as Dict[]) : [];
    const sub = field.item as SubField[];
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="lbl" style={{ marginBottom: 0 }}>{field.label}{field.ai && <Ai />}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {sub.map((sf) => (
                <div key={sf.key}>
                  <label className="lbl">{sf.label}</label>
                  {sf.type === "image" ? (
                    <ImageInput value={String(item[sf.key] ?? "")} disabled={disabled} placeholder={sf.placeholder}
                      onChange={(v) => {
                        if (disabled) return;
                        const next = items.map((it, j) => (j === i ? { ...it, [sf.key]: v } : it));
                        onChange(next);
                      }} />
                  ) : sf.type === "select" ? (
                    <select className="in" value={String(item[sf.key] ?? "")} disabled={disabled}
                      onChange={(e) => {
                        if (disabled) return;
                        const next = items.map((it, j) => (j === i ? { ...it, [sf.key]: e.target.value } : it));
                        onChange(next);
                      }}>
                      {(sf.options ?? []).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  ) : sf.type === "textarea" ? (
                    <textarea className="in" rows={5} placeholder={sf.placeholder} value={String(item[sf.key] ?? "")} readOnly={disabled}
                      onChange={(e) => {
                        if (disabled) return;
                        const next = items.map((it, j) => (j === i ? { ...it, [sf.key]: e.target.value } : it));
                        onChange(next);
                      }} />
                  ) : (
                    <input className="in" placeholder={sf.placeholder} value={String(item[sf.key] ?? "")} readOnly={disabled}
                      onChange={(e) => {
                        if (disabled) return;
                        const next = items.map((it, j) => (j === i ? { ...it, [sf.key]: e.target.value } : it));
                        onChange(next);
                      }} />
                  )}
                </div>
              ))}
              {!disabled && (
                <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
                  style={{ alignSelf: "flex-end", background: "#17140C", color: "#FFD500", border: "none",
                    borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  ✕ Retirer
                </button>
              )}
            </div>
          ))}
          {!disabled && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-ghost" style={{ borderStyle: "dashed", justifyContent: "center", flex: 1 }}
                onClick={() => onChange([...items, Object.fromEntries(sub.map((sf) => [sf.key, ""]))])}>
                {field.addLabel ?? "+ Ajouter"}
              </button>
              {sub[0]?.type === "image" && (
                <label className="btn" style={{ justifyContent: "center", cursor: "pointer" }}>
                  📷 Ajouter plusieurs images
                  <input type="file" accept="image/*" multiple hidden
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? []);
                      if (!files.length) return;
                      const urls = await Promise.all(files.map((f) => uploadImage(f).catch(() => "")));
                      onChange([...items, ...urls.filter(Boolean).map((u) => ({ [sub[0].key]: u }))]);
                      e.target.value = "";
                    }} />
                </label>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  const common = { className: "in", value: String(value ?? ""), placeholder: field.placeholder, readOnly: disabled,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => !disabled && onChange(e.target.value) };
  return (
    <div>
      <label className="lbl">{field.label}{field.ai && <Ai />}</label>
      {field.type === "image"
        ? <ImageInput value={String(value ?? "")} onChange={(v) => !disabled && onChange(v)} disabled={disabled} placeholder={field.placeholder} />
        : field.type === "textarea"
        ? <textarea {...common} />
        : <input type={field.type === "tel" ? "tel" : field.type === "email" ? "email" : "text"} {...common} />}
    </div>
  );
}

function ColorField({ label, value, onChange, onReset }: {
  label: string; value: string; onChange: (v: string) => void; onReset: () => void;
}) {
  const hex = /^#([0-9a-f]{6})$/i.test(value) ? value : "#ffffff";
  return (
    <div>
      <label className="lbl">{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="color" value={hex} onChange={(e) => onChange(e.target.value)}
          style={{ width: 42, height: 34, border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel2)", cursor: "pointer", padding: 2 }} />
        <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>{value}</span>
        <button onClick={onReset} title="Revenir au thème" style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12 }}>↺</button>
      </div>
    </div>
  );
}

function Ai() {
  return <span title="Génération IA — Phase 2" style={{ marginLeft: 6, fontSize: 11, color: "var(--brand2)", fontWeight: 700 }}>✨ IA</span>;
}

/* --- Barre de statut du smartphone (heure réelle + réseau + wifi + batterie) --- */
function PhoneStatusBar() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    }, 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ed-phone-status">
      <span className="tm">{time}</span>
      <span className="ics">
        {/* Signal réseau */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.5" y="0" width="3" height="11" rx="1" />
        </svg>
        {/* Wifi */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor" aria-hidden>
          <path d="M8 9.2a1.4 1.4 0 100 2.8 1.4 1.4 0 000-2.8z" />
          <path d="M8 5.6c1.5 0 2.9.6 3.9 1.6l-1.3 1.3A3.7 3.7 0 008 7.4c-1 0-1.9.4-2.6 1.1L4.1 7.2c1-1 2.4-1.6 3.9-1.6z" />
          <path d="M8 2c2.5 0 4.8 1 6.5 2.7l-1.3 1.3A7.2 7.2 0 008 3.8 7.2 7.2 0 002.8 6L1.5 4.7C3.2 3 5.5 2 8 2z" />
        </svg>
        {/* Batterie */}
        <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden>
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" strokeOpacity=".4" />
          <rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor" />
          <path d="M23 4v4c1-.35 1.6-1.1 1.6-2S24 4.35 23 4z" fill="currentColor" fillOpacity=".5" />
        </svg>
      </span>
    </div>
  );
}

/* --- styles --- */
const bar: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "rgba(255,255,255,.88)", backdropFilter: "blur(8px)", zIndex: 50 };
const mini: React.CSSProperties = { background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--txt)", borderRadius: 7, width: 26, height: 26, cursor: "pointer", fontSize: 12, flexShrink: 0 };
const addItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, background: "var(--panel2)", border: "1px solid var(--line)", color: "var(--txt)", borderRadius: 9, padding: "10px 10px", cursor: "pointer", fontSize: 13, textAlign: "left" };
