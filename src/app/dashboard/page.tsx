"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Card } from "@/lib/types";
import { gradient, CARD_THEMES } from "@/lib/types";
import { uid } from "@/lib/store";
import { listCards, createCard, createCardFromTemplate, createCardFromBlocks, cloneCard, deleteCard, supabaseEnabled, currentUser, signOut } from "@/lib/db";
import { TEMPLATES, TEMPLATE_NICHES, templateBlocks, type CardTemplate } from "@/lib/templates";
import CardRenderer from "@/components/CardRenderer";
import ConfirmModal from "@/components/ConfirmModal";
import { getStats, type Stats } from "@/lib/tracking";

export default function Dashboard() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [toDelete, setToDelete] = useState<Card | null>(null);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (supabaseEnabled() && !(await currentUser())) { router.replace("/login"); return; }
      const list = await listCards();
      setCards(list);
      const entries = await Promise.all(list.map(async (c) => [c.id, await getStats(c.id)] as const));
      setStats(Object.fromEntries(entries));
    })();
  }, [router]);

  async function createBlank() {
    const c = await createCard("Ma carte");
    if (c) { try { sessionStorage.setItem("karte_ed_back", JSON.stringify({ href: "/dashboard", label: "Tableau de bord" })); } catch {} router.push(`/editor/${c.id}`); }
  }
  async function createFromTpl(tpl: CardTemplate) {
    const c = await createCardFromTemplate(tpl);
    if (c) { try { sessionStorage.setItem("karte_ed_back", JSON.stringify({ href: "/dashboard", label: "Tableau de bord" })); } catch {} router.push(`/editor/${c.id}`); }
  }
  async function createFromAI(gen: { title: string; themeIndex: number; blocks: { type: string; data: Record<string, unknown> }[] }) {
    const c = await createCardFromBlocks(gen.title, gen.themeIndex, gen.blocks);
    if (c) { try { sessionStorage.setItem("karte_ed_back", JSON.stringify({ href: "/dashboard", label: "Tableau de bord" })); } catch {} router.push(`/editor/${c.id}`); }
  }
  async function remove(id: string) {
    await deleteCard(id);
    setCards(await listCards());
  }

  async function duplicate(id: string) {
    const c = await cloneCard(id);
    if (c) setCards(await listCards());
  }

  return (
    <div className="admin" style={{ minHeight: "100vh" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--line)", background: "#fff" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 19, textDecoration: "none", color: "var(--txt)" }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent)", color: "var(--accent-ink)", display: "grid", placeItems: "center" }}>⚡</span>
          Bazookard
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPicking(true)} className="btn btn-primary">+ Nouvelle carte</button>
          {supabaseEnabled() && (
            <button onClick={async () => { await signOut(); router.replace("/login"); }} className="btn btn-ghost">Déconnexion</button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "30px auto", padding: "0 20px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 18 }}>Mes cartes</h1>

        {cards === null ? (
          <p style={{ color: "var(--muted)" }}>Chargement…</p>
        ) : cards.length === 0 ? (
          <div style={{ background: "var(--panel)", border: "1px dashed var(--line)", borderRadius: 16, padding: 40, textAlign: "center" }}>
            <p style={{ color: "var(--muted)" }}>Aucune carte pour l&apos;instant.</p>
            <button onClick={() => setPicking(true)} className="btn btn-primary" style={{ marginTop: 14 }}>+ Créer ma première carte</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
            {cards.map((c) => (
              <div key={c.id} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }} className="fade-up">
                <div style={{ height: 90, background: gradient(c.themeIndex) }} />
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 700 }}>{c.title}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>/{c.slug} · {c.blocks.length} blocs · thème {CARD_THEMES[c.themeIndex]?.name ?? "—"}</div>
                  {stats[c.id] && (
                    <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: "var(--accent-deep)", fontWeight: 700 }}>
                      <span title="Vues de la carte">👁 {stats[c.id].view}</span>
                      <span title="Clics sur les liens">🖱 {stats[c.id].tap}</span>
                      <span title="Conversations chatbot">💬 {stats[c.id].chat}</span>
                      <span title="Contacts / inscriptions">✉ {stats[c.id].lead}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <Link href={`/editor/${c.id}`} onClick={() => { try { sessionStorage.setItem("karte_ed_back", JSON.stringify({ href: "/dashboard", label: "Tableau de bord" })); } catch {} }} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>Éditer</Link>
                    <Link href={`/${c.slug}`} target="_blank" className="btn" title="Voir la carte publique">👁</Link>
                    <button onClick={() => void duplicate(c.id)} className="btn" title="Dupliquer (idéal pour les cartes d'employés)">⧉</button>
                    <button onClick={() => setToDelete(c)} className="btn" style={{ color: "var(--danger)" }} title="Supprimer">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {picking && <TemplatePicker onClose={() => setPicking(false)} onBlank={createBlank} onPick={createFromTpl} onAI={createFromAI} />}
      {toDelete && (
        <ConfirmModal dark message={`Supprimer la carte « ${toDelete.title} » ?`}
          onCancel={() => setToDelete(null)}
          onConfirm={() => { void remove(toDelete.id); setToDelete(null); }} />
      )}
    </div>
  );
}

/* ============ Galerie de templates ============ */
function TemplatePicker({ onClose, onBlank, onPick, onAI }: {
  onClose: () => void; onBlank: () => void; onPick: (t: CardTemplate) => void;
  onAI: (gen: { title: string; themeIndex: number; blocks: { type: string; data: Record<string, unknown> }[] }) => void;
}) {
  const [niche, setNiche] = useState<string>("Tous");
  const [desc, setDesc] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");

  async function generate() {
    if (!desc.trim() || aiBusy) return;
    setAiErr(""); setAiBusy(true);
    try {
      const r = await fetch("/api/ai/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      });
      const out = await r.json();
      if (!r.ok) { setAiErr(out.error || "Erreur de génération."); return; }
      onAI(out);
    } catch {
      setAiErr("Connexion au service IA impossible.");
    } finally { setAiBusy(false); }
  }
  const niches = ["Tous", ...TEMPLATE_NICHES];
  const shown = niche === "Tous" ? TEMPLATES : TEMPLATES.filter((t) => t.niche === niche);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(3,10,7,.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 980, maxHeight: "88vh", overflowY: "auto", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 22, padding: 24 }} onClick={(e) => e.stopPropagation()} className="fade-up">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Choisis un template</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>Blocs pré-remplis + thème — tout reste modifiable ensuite.</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost" aria-label="Fermer">✕</button>
        </div>

        {/* Génération par IA */}
        <div style={{ border: "1.5px solid var(--brand)", borderRadius: 16, padding: 16, margin: "14px 0 6px", background: "rgba(52,211,153,.06)" }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>✨ Créer avec l&apos;IA</div>
          <p style={{ color: "var(--muted)", fontSize: 12.5, marginBottom: 10 }}>Décris ton activité — l&apos;IA construit ta carte complète en quelques secondes.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <textarea className="in" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex : Restaurant créole à Saint-Denis, spécialités carry et rougail, ouvert midi et soir sauf lundi, je veux des réservations et des avis Google."
              style={{ flex: "1 1 320px" }} />
            <button onClick={generate} disabled={aiBusy} className="btn btn-primary" style={{ alignSelf: "stretch", minWidth: 150, justifyContent: "center" }}>
              {aiBusy ? "Génération…" : "✨ Générer ma carte"}
            </button>
          </div>
          {aiErr && <div style={{ color: "#f87171", fontSize: 12.5, marginTop: 8 }}>{aiErr}</div>}
        </div>

        {/* Filtres par niche */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0 18px" }}>
          {niches.map((n) => (
            <button key={n} onClick={() => setNiche(n)}
              style={{
                padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                border: "1px solid " + (n === niche ? "var(--brand)" : "var(--line)"),
                background: n === niche ? "var(--brand)" : "transparent",
                color: n === niche ? "#04140e" : "var(--txt)",
              }}>{n}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 16 }}>
          {/* Carte vierge */}
          <button onClick={onBlank}
            style={{ border: "1.5px dashed var(--line)", borderRadius: 18, background: "transparent", color: "var(--muted)", cursor: "pointer", minHeight: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>
            <span style={{ fontSize: 34 }}>＋</span>
            Carte vierge
            <span style={{ fontSize: 11.5, fontWeight: 400 }}>Partir de zéro</span>
          </button>

          {shown.map((t) => <TplCard key={t.id} tpl={t} onPick={() => onPick(t)} />)}
        </div>
      </div>
    </div>
  );
}

function TplCard({ tpl, onPick }: { tpl: CardTemplate; onPick: () => void }) {
  // Carte temporaire pour l'aperçu miniature (jamais sauvegardée)
  const preview: Card = useMemo(() => ({
    id: "preview-" + tpl.id, slug: "preview", title: tpl.name,
    themeIndex: tpl.themeIndex, blocks: templateBlocks(tpl, uid), updatedAt: 0,
  }), [tpl]);
  const th = CARD_THEMES[tpl.themeIndex];

  return (
    <div className="lk-pick" style={{ flex: "none", width: "100%", cursor: "pointer" }} onClick={onPick} title="Utiliser ce template">
      {/* Aperçu live : survolez, la carte défile en entier */}
      <div className="ph" style={{ background: th?.bg ?? "#F4F2EA" }}>
        <div className="zoom"><CardRenderer card={preview} /></div>
        <span style={{ position: "absolute", top: 10, left: 10, zIndex: 2, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "rgba(23,20,12,.72)", color: "#fff", backdropFilter: "blur(4px)" }}>
          {tpl.emoji} {tpl.niche}
        </span>
      </div>
      <div className="bd">
        <div style={{ minWidth: 0 }}>
          <b>{tpl.name}</b>
          <small>{tpl.blocks.length} blocs · thème {th?.name}</small>
        </div>
        <span className="go">→</span>
      </div>
    </div>
  );
}
