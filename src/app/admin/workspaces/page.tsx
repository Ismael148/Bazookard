"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import AdminHeader from "@/components/AdminHeader";
import ConfirmModal from "@/components/ConfirmModal";
import { useRouter } from "next/navigation";
import { saveWorkspaceAsTemplate } from "@/lib/admin-store";
import {
  listWorkspaces, createWorkspace, updateWorkspace, deleteWorkspaceById as deleteWorkspace,
  listClients, ensureWorkspaceCard, planQuota,
  listWorkspaceCards, createWorkspaceCard, duplicateWorkspaceCard, deleteWorkspaceCard,
  type Workspace, type Client, type Permissions,
} from "@/lib/admin-db";
import { TEMPLATES, templateBlocks, type CardTemplate } from "@/lib/templates";
import { uid } from "@/lib/store";
import { saveCard } from "@/lib/db";
import type { Card } from "@/lib/types";
import { CARD_THEMES } from "@/lib/types";

const PERM_LABELS: { key: keyof Permissions; label: string }[] = [
  { key: "editText", label: "Éditer textes & images" },
  { key: "editStructure", label: "Ajouter / déplacer des sections + style" },
  { key: "deleteBlocks", label: "Supprimer des sections (annulable en 1 clic)" },
  { key: "manageCards", label: "Créer / dupliquer / supprimer des cartes" },
  { key: "publish", label: "Publier / dépublier" },
  { key: "viewLeads", label: "Voir leads & analytics" },
];
const permOn = (p: Permissions, k: keyof Permissions) => (k === "manageCards" ? p.manageCards !== false : !!p[k]);

export default function WorkspacesPage() {
  const [ws, setWs] = useState<Workspace[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cardsByWs, setCardsByWs] = useState<Record<string, Card[]>>({});
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState<Workspace | null>(null);
  const [cardToDelete, setCardToDelete] = useState<{ card: Card; wsId: string } | null>(null);
  const router = useRouter();

  const loadCards = useCallback(async (list: Workspace[]) => {
    const entries = await Promise.all(list.map(async (w) => [w.id, await listWorkspaceCards(w)] as const));
    setCardsByWs(Object.fromEntries(entries));
  }, []);

  const refresh = useCallback(() => {
    void (async () => {
      const [list, cls] = await Promise.all([listWorkspaces(), listClients()]);
      setWs(list); setClients(cls);
      await loadCards(list);
    })();
  }, [loadCards]);
  useEffect(() => { refresh(); }, [refresh]);
  function notify(m: string) { setToast(m); setTimeout(() => setToast(""), 2600); }

  /** Nombre total de cartes d'un client (tous workspaces) — quota. */
  function clientCardCount(clientId: string) {
    return ws.filter((w) => w.clientId === clientId).reduce((a, w) => a + (cardsByWs[w.id]?.length ?? 0), 0);
  }

  function patch(w: Workspace, change: Partial<Workspace>) {
    const next = { ...w, ...change };
    setWs((prev) => prev.map((x) => (x.id === w.id ? next : x)));
    void updateWorkspace(next);
    if (change.slug && w.cardId) {
      void (async () => {
        const { getCard, saveCard } = await import("@/lib/db");
        const card = await getCard(w.cardId!);
        if (card && card.slug !== change.slug) { card.slug = change.slug!; await saveCard(card); }
      })();
    }
  }
  function togglePerm(w: Workspace, key: keyof Permissions) {
    const current = permOn(w.permissions, key);
    patch(w, { permissions: { ...w.permissions, [key]: !current } });
  }
  function assignClient(w: Workspace, clientId: string | null) {
    patch(w, { clientId });
  }

  function editBack() { try { sessionStorage.setItem("karte_ed_back", JSON.stringify({ href: "/admin/workspaces", label: "Back-office" })); } catch {} }

  async function addCard(w: Workspace) {
    editBack();
    const card = await createWorkspaceCard(w, "Nouvelle carte");
    if (card) { notify("Carte créée"); router.push(`/editor/${card.id}`); }
    else notify("Impossible de créer la carte");
  }
  async function dupCard(w: Workspace, card: Card) {
    const copy = await duplicateWorkspaceCard(card.id, w.id);
    if (copy) { notify("Carte dupliquée"); await loadCards(ws); }
    else notify("Échec de la duplication");
  }
  async function removeCard() {
    if (!cardToDelete) return;
    await deleteWorkspaceCard(cardToDelete.card.id);
    setCardToDelete(null);
    notify("Carte supprimée");
    await loadCards(ws);
  }

  return (
    <div>
      <AdminHeader title="Workspaces" subtitle="Regroupez plusieurs cartes par espace, assignez un client et réglez ses droits">
        <button className="a-btn a-btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> Nouveau workspace</button>
      </AdminHeader>

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
        {ws.map((w) => {
          const cards = cardsByWs[w.id] ?? [];
          const client = clients.find((c) => c.id === w.clientId);
          const quota = client ? planQuota(client.plan) : null;
          const used = client ? clientCardCount(client.id) : cards.length;
          const full = quota != null && used >= quota;
          return (
            <div key={w.id} className="a-card fade-up" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--grad)", display: "grid", placeItems: "center", color: "#fff", flexShrink: 0 }}><Icon name="workspace" size={20} /></span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <input className="a-input" value={w.name} onChange={(e) => patch(w, { name: e.target.value })} style={{ fontWeight: 600, border: "1px solid transparent", background: "transparent", padding: "2px 4px" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                    <Icon name="card" size={14} /> {cards.length} carte(s){quota != null ? ` · client ${used}/${quota}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="a-btn a-btn-sm" onClick={() => { const name = prompt("Nom du template :", w.name); if (name) { saveWorkspaceAsTemplate(w, name); notify("Sauvegardé comme template"); } }}><Icon name="copy" size={15} /> Template</button>
                  <button className="a-btn a-btn-sm a-btn-danger" onClick={() => setToDelete(w)}><Icon name="trash" size={15} /></button>
                </div>
              </div>

              {/* Cartes du workspace */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span className="a-label" style={{ margin: 0 }}>Cartes de cet espace</span>
                  <button className="a-btn a-btn-sm a-btn-primary" onClick={() => addCard(w)} disabled={full} title={full ? "Quota d'abonnement atteint pour ce client" : "Créer une carte"}>
                    <Icon name="plus" size={14} /> Nouvelle carte
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
                  {cards.map((card) => {
                    const theme = CARD_THEMES[card.themeIndex];
                    return (
                      <div key={card.id} style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
                        <div style={{ height: 8, background: `linear-gradient(90deg, ${theme?.accent ?? "#FFD500"}, ${theme?.accent2 ?? "#FFC800"})` }} />
                        <div style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.title}</div>
                          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>/{card.slug} · {card.blocks.length} blocs</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                            <button className="a-btn a-btn-sm a-btn-primary" style={{ flex: 1, justifyContent: "center" }}
                              onClick={() => { editBack(); router.push(`/editor/${card.id}`); }}><Icon name="edit" size={14} /> Éditer</button>
                            <Link href={`/${card.slug}`} target="_blank" className="a-btn a-btn-sm" title="Voir en ligne"><Icon name="eye" size={14} /></Link>
                            <button className="a-btn a-btn-sm" title="Dupliquer" onClick={() => dupCard(w, card)} disabled={full}><Icon name="copy" size={14} /></button>
                            <button className="a-btn a-btn-sm a-btn-danger" title="Supprimer" onClick={() => setCardToDelete({ card, wsId: w.id })} disabled={cards.length <= 1}><Icon name="trash" size={14} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {cards.length === 0 && (
                    <button className="a-btn" style={{ gridColumn: "1/-1", padding: 24, justifyContent: "center", border: "1.5px dashed var(--line)", color: "var(--muted)" }} onClick={() => addCard(w)}>
                      <Icon name="plus" size={16} /> Créer la première carte de cet espace
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
                {/* Assignation client */}
                <div>
                  <label className="a-label">Client assigné</label>
                  <select className="a-input" value={w.clientId ?? ""} onChange={(e) => assignClient(w, e.target.value || null)}>
                    <option value="">— Non assigné —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.company} ({clientCardCount(c.id)}/{planQuota(c.plan)} cartes)</option>)}
                  </select>
                  <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>Le client gère cet espace depuis son back-office. Le quota (nb de cartes) dépend de son abonnement.</p>
                  <label className="a-label" style={{ marginTop: 14 }}>Clé API IA dédiée (facultatif)</label>
                  <input className="a-input" type="password" placeholder="sk-… (sinon clé globale Bazookard)"
                    value={w.aiKey ?? ""} onChange={(e) => patch(w, { aiKey: e.target.value.trim() })} autoComplete="off" />
                </div>
                {/* Permissions */}
                <div>
                  <label className="a-label">Permissions du client</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px" }}>
                    {PERM_LABELS.map((p) => (
                      <div key={p.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 13.5, color: "var(--ink2)" }}>{p.label}</span>
                        <button className={`a-switch ${permOn(w.permissions, p.key) ? "on" : ""}`} onClick={() => togglePerm(w, p.key)} aria-label={p.label} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {ws.length === 0 && (
          <div className="a-card" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            Aucun workspace. <button className="a-btn a-btn-primary" style={{ marginLeft: 8 }} onClick={() => setOpen(true)}>+ Créer</button>
          </div>
        )}
      </div>

      {open && <WsModal onClose={() => setOpen(false)} onCreated={() => { refresh(); notify("Workspace créé"); }} />}
      {toDelete && (
        <ConfirmModal message={`Supprimer le workspace « ${toDelete.name} » et toutes ses cartes ?`}
          onCancel={() => setToDelete(null)}
          onConfirm={() => { void deleteWorkspace(toDelete.id).then(() => { setToDelete(null); refresh(); notify("Workspace supprimé"); }); }} />
      )}
      {cardToDelete && (
        <ConfirmModal message={`Supprimer la carte « ${cardToDelete.card.title} » ? Cette action est définitive.`}
          onCancel={() => setCardToDelete(null)}
          onConfirm={removeCard} />
      )}
      {toast && <div className="a-toast"><Icon name="check" size={16} /> {toast}</div>}
    </div>
  );
}

function WsModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tplId, setTplId] = useState<string>("");   // "" = carte vierge
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || busy) return;
    setBusy(true);
    try {
      const w = await createWorkspace(name, slug);
      if (!w) { alert("Impossible de créer le workspace."); return; }
      const card = await ensureWorkspaceCard(w);
      const tpl: CardTemplate | undefined = TEMPLATES.find((t) => t.id === tplId);
      if (card && tpl) {
        card.themeIndex = tpl.themeIndex;
        card.blocks = templateBlocks(tpl, uid);
        await saveCard(card);
      }
      onCreated();
      onClose();
    } finally { setBusy(false); }
  }

  return (
    <div className="a-overlay" onClick={onClose}>
      <div className="a-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Nouveau workspace</h3>
          <button className="a-btn a-btn-sm" style={{ padding: 6 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label className="a-label">Nom du workspace / client</label><input className="a-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Espace — Mon client" required autoFocus /></div>
          <div><label className="a-label">Lien public de la 1re carte (slug)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 14 }}>/
              <input className="a-input" value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase())} placeholder="mon-client" />
            </div>
          </div>

          <div>
            <label className="a-label">Modèle de la première carte</label>
            <div className="ws-tpl-grid">
              <button type="button" className={`ws-tpl${tplId === "" ? " on" : ""}`} onClick={() => setTplId("")}>
                <span className="em">➕</span>
                <span className="nm">Carte vierge</span>
                <span className="ni">Partir de zéro</span>
              </button>
              {TEMPLATES.map((t) => (
                <button type="button" key={t.id} className={`ws-tpl${tplId === t.id ? " on" : ""}`} onClick={() => setTplId(t.id)}>
                  <span className="em">{t.emoji}</span>
                  <span className="nm">{t.name}</span>
                  <span className="ni">{t.niche}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="a-btn a-btn-primary" style={{ justifyContent: "center" }} type="submit" disabled={busy}>
            {busy ? "Création…" : "Créer le workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
