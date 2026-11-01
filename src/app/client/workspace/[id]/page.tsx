"use client";
// Espace client — détail d'un ESPACE : toutes ses cartes + créer / dupliquer / supprimer.
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import GuidedTour, { type TourStep } from "@/components/GuidedTour";
import {
  clientSession, clientLoginDb, clientCreateCard, clientDuplicateCard, clientDeleteCard,
  type ClientSession, type ClientWs, type ClientCard,
} from "@/lib/admin-db";
import { CARD_THEMES } from "@/lib/types";

const WS_TOUR_SEEN = "bzk_tour_ws";
const WS_TOUR: TourStep[] = [
  { title: "Gérez vos cartes 🗂️", body: "Cet espace regroupe toutes vos cartes. Vous pouvez en modifier chacune, en créer de nouvelles ou dupliquer une carte existante pour gagner du temps." },
  { target: "[data-tour='add-card']", title: "Créer une nouvelle carte", body: "Partez d'une carte vierge et personnalisez-la entièrement.", placement: "bottom" },
  { target: "[data-tour='card-item']", title: "Vos cartes", body: "Pour chaque carte : « Modifier » ouvre l'éditeur, l'œil ouvre la carte en ligne, l'icône copie la duplique, la corbeille la supprime.", placement: "top" },
  { title: "À vous de jouer ✨", body: "Toutes vos modifications sont enregistrées automatiquement. Bonne personnalisation !" },
];

export default function ClientWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [ws, setWs] = useState<ClientWs | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState<ClientCard | null>(null);
  const [tour, setTour] = useState(false);

  function notify(m: string) { setToast(m); setTimeout(() => setToast(""), 2800); }

  async function reload(): Promise<ClientSession | null> {
    const s = clientSession();
    if (!s) { router.replace("/client/login"); return null; }
    const fresh = await clientLoginDb(s.client.email, s.password) ?? s;
    const found = fresh.workspaces.find((w) => w.id === id) ?? null;
    setWs(found);
    return fresh;
  }

  useEffect(() => {
    const s = clientSession();
    if (!s) { router.replace("/client/login"); return; }
    setWs(s.workspaces.find((w) => w.id === id) ?? null);
    void reload();
  }, [id, router]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ws) return;
    let seen = "0";
    try { seen = localStorage.getItem(WS_TOUR_SEEN) || "0"; } catch {}
    if (seen !== "1") { const t = setTimeout(() => setTour(true), 600); return () => clearTimeout(t); }
  }, [ws]);
  const closeTour = () => { setTour(false); try { localStorage.setItem(WS_TOUR_SEEN, "1"); } catch {} };

  if (ws === undefined) return <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "var(--muted)" }}>Chargement…</div>;
  if (ws === null) return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "var(--muted)", gap: 14, textAlign: "center" }}>
      <div>Espace introuvable.</div>
      <Link href="/client" className="a-btn a-btn-primary">← Retour à mes espaces</Link>
    </div>
  );

  const canManage = ws.permissions.manageCards !== false;

  const quotaError = (q?: number) => notify(q ? `Quota atteint (${q} carte(s) sur votre abonnement). Contactez Adamkom pour en ajouter.` : "Quota d'abonnement atteint. Contactez Adamkom.");

  async function addCard() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await clientCreateCard(ws!.id, "Nouvelle carte");
      if (r.ok && r.id) { await reload(); router.push(`/client/editor/${r.id}`); }
      else if (r.error === "quota") quotaError(r.quota);
      else if (r.error === "perm") notify("La création de cartes n'est pas activée sur cet espace.");
      else notify("Impossible de créer la carte.");
    } finally { setBusy(false); }
  }

  async function duplicate(card: ClientCard) {
    if (busy) return;
    setBusy(true);
    try {
      const r = await clientDuplicateCard(card.id);
      if (r.ok) { await reload(); notify("Carte dupliquée ✓"); }
      else if (r.error === "quota") quotaError(r.quota);
      else if (r.error === "perm") notify("La duplication n'est pas activée sur cet espace.");
      else notify("Échec de la duplication.");
    } finally { setBusy(false); }
  }

  async function removeCard() {
    if (!toDelete) return;
    const card = toDelete; setToDelete(null); setBusy(true);
    try {
      const r = await clientDeleteCard(card.id);
      if (r.ok) { await reload(); notify("Carte supprimée"); }
      else if (r.error === "last") notify("Vous ne pouvez pas supprimer la dernière carte de l'espace.");
      else if (r.error === "perm") notify("La suppression n'est pas activée sur cet espace.");
      else notify("Échec de la suppression.");
    } finally { setBusy(false); }
  }

  return (
    <div>
      <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href="/client" className="a-btn a-btn-sm" title="Retour à mes espaces" style={{ fontSize: 18, lineHeight: 1, padding: "6px 12px" }}>←</Link>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{ws.name}</h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 2 }}>{ws.cards.length} carte{ws.cards.length > 1 ? "s" : ""} dans cet espace.</p>
        </div>
        <button className="gt-trigger" onClick={() => setTour(true)} title="Revoir la visite guidée"><Icon name="help" size={16} /> Visite guidée</button>
        {canManage && (
          <button data-tour="add-card" className="a-btn a-btn-primary" onClick={addCard} disabled={busy}>
            <Icon name="plus" size={16} /> Nouvelle carte
          </button>
        )}
      </div>

      <div style={{ padding: 28, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {ws.cards.map((card, idx) => {
          const theme = CARD_THEMES[card.themeIndex];
          const banner = card.blocks.find((b) => b.type === "banner")?.data as Record<string, unknown> | undefined;
          const profile = card.blocks.find((b) => b.type === "profile")?.data as Record<string, unknown> | undefined;
          const img = (banner?.image as string) || (profile?.photo as string) || "";
          return (
            <div key={card.id} data-tour={idx === 0 ? "card-item" : undefined} className="a-card a-card-hover fade-up" style={{ overflow: "hidden" }}>
              <div style={{
                height: 108, position: "relative",
                background: img
                  ? `linear-gradient(180deg, rgba(23,20,12,.05), rgba(23,20,12,.45)), url('${img}') center/cover`
                  : `linear-gradient(135deg, ${theme?.accent ?? "#FFD500"}, ${theme?.accent2 ?? "#FFC800"})`,
              }}>
                <span style={{ position: "absolute", left: 12, bottom: 10, color: "#fff", fontWeight: 700, fontSize: 15, textShadow: "0 2px 10px rgba(0,0,0,.4)", fontFamily: "var(--font-display)" }}>
                  {card.title}
                </span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ color: "var(--muted)", fontSize: 12.5 }}>/{card.slug} · {card.blocks.length} blocs</div>
                <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
                  <Link href={`/client/editor/${card.id}`} className="a-btn a-btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                    <Icon name="edit" size={15} /> Modifier
                  </Link>
                  <Link href={`/${card.slug}`} target="_blank" className="a-btn" title="Voir en ligne"><Icon name="eye" size={16} /></Link>
                  {canManage && <button className="a-btn" title="Dupliquer" onClick={() => duplicate(card)} disabled={busy}><Icon name="copy" size={15} /></button>}
                  {canManage && ws.cards.length > 1 && <button className="a-btn a-btn-danger" title="Supprimer" onClick={() => setToDelete(card)} disabled={busy}><Icon name="trash" size={15} /></button>}
                </div>
              </div>
            </div>
          );
        })}

        {canManage && (
          <button data-tour={ws.cards.length === 0 ? "add-card" : undefined} onClick={addCard} disabled={busy}
            className="a-card a-card-hover" style={{ minHeight: 190, display: "grid", placeItems: "center", border: "1.5px dashed var(--line)", background: "transparent", color: "var(--muted)", cursor: "pointer", gap: 8 }}>
            <Icon name="plus" size={26} />
            <span style={{ fontWeight: 600 }}>{ws.cards.length === 0 ? "Créer ma première carte" : "Ajouter une carte"}</span>
          </button>
        )}
      </div>

      {toDelete && (
        <ConfirmModal message={`Supprimer la carte « ${toDelete.title} » ? Cette action est définitive.`}
          onCancel={() => setToDelete(null)} onConfirm={removeCard} />
      )}
      {toast && <div className="a-toast"><Icon name="check" size={16} /> {toast}</div>}
      <GuidedTour steps={WS_TOUR} open={tour} onClose={closeTour} />
    </div>
  );
}
