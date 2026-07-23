"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import AdminHeader from "@/components/AdminHeader";
import ConfirmModal from "@/components/ConfirmModal";
import { useRouter } from "next/navigation";
import { saveWorkspaceAsTemplate } from "@/lib/admin-store";
import {
  listWorkspaces, createWorkspace, updateWorkspace, deleteWorkspaceById as deleteWorkspace,
  listClients, ensureWorkspaceCard, planQuota,
  type Workspace, type Client, type Permissions,
} from "@/lib/admin-db";

const PERM_LABELS: { key: keyof Permissions; label: string }[] = [
  { key: "editText", label: "Éditer textes & images" },
  { key: "editStructure", label: "Ajouter / supprimer des sections" },
  { key: "publish", label: "Publier / dépublier" },
  { key: "viewLeads", label: "Voir leads & analytics" },
];

export default function WorkspacesPage() {
  const [ws, setWs] = useState<Workspace[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState<Workspace | null>(null);

  const router = useRouter();
  const refresh = () => { void (async () => { setWs(await listWorkspaces()); setClients(await listClients()); })(); };
  useEffect(refresh, []);
  function notify(m: string) { setToast(m); setTimeout(() => setToast(""), 2400); }

  function patch(w: Workspace, change: Partial<Workspace>) {
    const next = { ...w, ...change };
    setWs((prev) => prev.map((x) => (x.id === w.id ? next : x)));
    void updateWorkspace(next);
    // le lien public = slug de la carte : on synchronise la carte liée
    if (change.slug && w.cardId) {
      void (async () => {
        const { getCard, saveCard } = await import("@/lib/db");
        const card = await getCard(w.cardId!);
        if (card && card.slug !== change.slug) { card.slug = change.slug!; await saveCard(card); }
      })();
    }
  }
  function togglePerm(w: Workspace, key: keyof Permissions) {
    patch(w, { permissions: { ...w.permissions, [key]: !w.permissions[key] } });
  }
  /** Quota d'abonnement : nb de workspaces déjà assignés à ce client. */
  function usage(clientId: string) { return ws.filter((x) => x.clientId === clientId).length; }
  function assignClient(w: Workspace, clientId: string | null) {
    if (clientId) {
      const c = clients.find((x) => x.id === clientId);
      const used = usage(clientId);
      if (c && used >= planQuota(c.plan)) {
        notify(`Quota atteint : ${c.company} est limité à ${planQuota(c.plan)} carte(s) — passez à l'abonnement supérieur.`);
        return;
      }
    }
    patch(w, { clientId });
  }

  return (
    <div>
      <AdminHeader title="Workspaces" subtitle="Espaces de travail, liens, assignation et permissions">
        <button className="a-btn a-btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> Nouveau workspace</button>
      </AdminHeader>

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
        {ws.map((w) => (
          <div key={w.id} className="a-card fade-up" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--grad)", display: "grid", placeItems: "center", color: "#fff", flexShrink: 0 }}><Icon name="workspace" size={20} /></span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <input className="a-input" value={w.name} onChange={(e) => patch(w, { name: e.target.value })} style={{ fontWeight: 600, border: "1px solid transparent", background: "transparent", padding: "2px 4px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                  <Icon name="link" size={14} /> /
                  <input className="a-input" value={w.slug} onChange={(e) => patch(w, { slug: e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase() })} style={{ width: 160, padding: "4px 8px", height: 30 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="a-btn a-btn-sm a-btn-primary" onClick={() => { try { sessionStorage.setItem("karte_ed_back", JSON.stringify({ href: "/admin/workspaces", label: "Back-office" })); } catch {} void ensureWorkspaceCard(w).then((card) => { if (card) router.push(`/editor/${card.id}`); }); }}><Icon name="edit" size={15} /> Éditer la carte</button>
                <Link href={`/${w.slug}`} target="_blank" className="a-btn a-btn-sm"><Icon name="eye" size={15} /> Voir</Link>
                <button className="a-btn a-btn-sm" onClick={() => { const name = prompt("Nom du template :", w.name); if (name) { saveWorkspaceAsTemplate(w, name); notify("Sauvegardé comme template"); } }}><Icon name="copy" size={15} /> Template</button>
                <button className="a-btn a-btn-sm a-btn-danger" onClick={() => setToDelete(w)}><Icon name="trash" size={15} /></button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
              {/* Assignation client */}
              <div>
                <label className="a-label">Client assigné</label>
                <select className="a-input" value={w.clientId ?? ""} onChange={(e) => assignClient(w, e.target.value || null)}>
                  <option value="">— Non assigné —</option>
                  {clients.map((c) => {
                    const full = usage(c.id) >= planQuota(c.plan) && w.clientId !== c.id;
                    return <option key={c.id} value={c.id} disabled={full}>{c.company} ({usage(c.id)}/{planQuota(c.plan)}{full ? " — quota atteint" : ""})</option>;
                  })}
                </select>
                <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>Le client gère ce workspace depuis son back-office. Le quota dépend de son abonnement.</p>
                <label className="a-label" style={{ marginTop: 14 }}>Clé API IA dédiée (facultatif)</label>
                <input className="a-input" type="password" placeholder="sk-… (sinon clé globale Bazookard)"
                  value={w.aiKey ?? ""} onChange={(e) => patch(w, { aiKey: e.target.value.trim() })} autoComplete="off" />
                <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>Le chatbot de cette carte consommera cette clé OpenAI plutôt que la clé globale.</p>
              </div>
              {/* Permissions */}
              <div>
                <label className="a-label">Permissions du client</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px" }}>
                  {PERM_LABELS.map((p) => (
                    <div key={p.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontSize: 13.5, color: "var(--ink2)" }}>{p.label}</span>
                      <button className={`a-switch ${w.permissions[p.key] ? "on" : ""}`} onClick={() => togglePerm(w, p.key)} aria-label={p.label} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {ws.length === 0 && (
          <div className="a-card" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            Aucun workspace. <button className="a-btn a-btn-primary" style={{ marginLeft: 8 }} onClick={() => setOpen(true)}>+ Créer</button>
          </div>
        )}
      </div>

      {open && <WsModal onClose={() => setOpen(false)} onCreated={() => { refresh(); notify("Workspace créé"); }} />}
      {toDelete && (
        <ConfirmModal message={`Supprimer le workspace « ${toDelete.name} » ?`}
          onCancel={() => setToDelete(null)}
          onConfirm={() => { void deleteWorkspace(toDelete.id).then(() => { setToDelete(null); refresh(); notify("Workspace supprimé"); }); }} />
      )}
      {toast && <div className="a-toast"><Icon name="check" size={16} /> {toast}</div>}
    </div>
  );
}

function WsModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    await createWorkspace(name, slug);
    onCreated();
    onClose();
  }
  return (
    <div className="a-overlay" onClick={onClose}>
      <div className="a-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Nouveau workspace</h3>
          <button className="a-btn a-btn-sm" style={{ padding: 6 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label className="a-label">Nom du workspace</label><input className="a-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Carte — Mon client" required /></div>
          <div><label className="a-label">Lien public (slug)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 14 }}>/
              <input className="a-input" value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase())} placeholder="mon-client" />
            </div>
          </div>
          <button className="a-btn a-btn-primary" style={{ justifyContent: "center" }} type="submit">Créer le workspace</button>
        </form>
      </div>
    </div>
  );
}
