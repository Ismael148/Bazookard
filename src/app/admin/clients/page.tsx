"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import AdminHeader from "@/components/AdminHeader";
import ImageInput from "@/components/ImageInput";
import {
  listClients, createClientAccount, updateClientAccount, deleteClientAccount, listWorkspaces,
  PLANS, planQuota, type Client, type Workspace, type PlanKey,
} from "@/lib/admin-db";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [wss, setWss] = useState<Workspace[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [reveal, setReveal] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const refresh = () => { void (async () => { setClients(await listClients()); setWss(await listWorkspaces()); })(); };
  useEffect(refresh, []);

  const shown = clients.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });
  function countWs(id: string) { return wss.filter((w) => w.clientId === id).length; }
  function notify(m: string) { setToast(m); setTimeout(() => setToast(""), 2600); }

  return (
    <div>
      <AdminHeader title="Clients" subtitle="Crée et gère les accès de tes clients">
        <button className="a-btn a-btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> Nouveau client</button>
      </AdminHeader>

      <div style={{ padding: 28 }}>
        {/* Recherche */}
        <div style={{ position: "relative", maxWidth: 380, marginBottom: 16 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}><Icon name="search" size={16} /></span>
          <input className="a-input" style={{ paddingLeft: 36 }} placeholder="Rechercher un client (nom ou email)…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>✕</button>
          )}
        </div>
        {search && <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>{shown.length} résultat(s) pour « {search} »</div>}
        <div className="a-card" style={{ overflow: "hidden" }}>
          <table className="a-table">
            <thead><tr><th>Société</th><th>Email</th><th>Mot de passe</th><th>Abonnement</th><th>Cartes</th><th>Créé le</th><th></th></tr></thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ ...avatar, ...(c.logo ? { backgroundImage: `url('${c.logo}')`, backgroundSize: "cover", backgroundPosition: "center" } : {}) }}>{!c.logo && c.company.slice(0, 1)}</span><strong>{c.company}</strong>
                    </div>
                  </td>
                  <td style={{ color: "var(--ink2)" }}>{c.email}</td>
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: 13 }}>{reveal === c.id ? c.password : "••••••••"}</span>
                    <button className="a-btn a-btn-sm" style={{ marginLeft: 8, padding: 5 }} onClick={() => setReveal(reveal === c.id ? null : c.id)}><Icon name="eye" size={14} /></button>
                  </td>
                  <td>
                    <select className="a-input" style={{ height: 34, padding: "4px 8px", fontSize: 12.5, width: 165 }}
                      value={c.plan ?? "solo"}
                      onChange={(e) => {
                        const next = { ...c, plan: e.target.value as PlanKey };
                        setClients((prev) => prev.map((x) => (x.id === c.id ? next : x)));
                        void updateClientAccount(next);
                      }}>
                      {Object.entries(PLANS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className="a-badge a-badge-soft" style={countWs(c.id) >= planQuota(c.plan) ? { background: "#FDECEC", color: "#B3261E" } : undefined}>
                      {countWs(c.id)} / {planQuota(c.plan)}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{new Date(c.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <a className="a-btn a-btn-sm a-btn-primary" style={{ marginRight: 6 }}
                      href={`mailto:${c.email}?subject=${encodeURIComponent("Vos accès Karte — " + c.company)}&body=${encodeURIComponent(
                        `Bonjour,\n\nVotre espace Karte est prêt ! Vous pouvez modifier votre carte NFC à tout moment :\n\nLien : ${typeof window !== "undefined" ? window.location.origin : ""}/client/login\nEmail : ${c.email}\nMot de passe : ${c.password}\n\nÀ très vite,\nL'équipe Karte — by Adamkom & JJP`
                      )}`}
                      title="Envoyer les accès par email">
                      <Icon name="export" size={14} /> Envoyer les accès
                    </a>
                    <button className="a-btn a-btn-sm a-btn-danger" onClick={() => { if (confirm(`Supprimer ${c.company} ?`)) { void deleteClientAccount(c.id).then(() => { refresh(); notify("Client supprimé"); }); } }}>
                      <Icon name="trash" size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 36 }}>
                  {search ? "Aucun client ne correspond à cette recherche." : "Aucun client. Crée le premier accès."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && <ClientModal onClose={() => setOpen(false)} onCreated={() => { refresh(); notify("Client créé — identifiants prêts à envoyer"); }} />}
      {toast && <div className="a-toast"><Icon name="check" size={16} /> {toast}</div>}
    </div>
  );
}

function ClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState(genPwd());
  const [logo, setLogo] = useState("");
  const [plan, setPlan] = useState<PlanKey>("pro");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !email) return;
    await createClientAccount(company, email, pwd, logo, plan);
    onCreated();
    onClose();
  }

  return (
    <div className="a-overlay" onClick={onClose}>
      <div className="a-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Nouveau client</h3>
          <button className="a-btn a-btn-sm" style={{ padding: 6 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label className="a-label">Nom de la société</label><input className="a-input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Le Bistrot Doré" required /></div>
          <div><label className="a-label">Logo / image du client (optionnel)</label><ImageInput value={logo} onChange={setLogo} /></div>
          <div>
            <label className="a-label">Abonnement</label>
            <select className="a-input" value={plan} onChange={(e) => setPlan(e.target.value as PlanKey)}>
              {Object.entries(PLANS).map(([k, p]) => <option key={k} value={k}>{p.label} · {p.price}</option>)}
            </select>
          </div>
          <div><label className="a-label">Email du client</label><input className="a-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@societe.fr" required /></div>
          <div>
            <label className="a-label">Mot de passe</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="a-input" value={pwd} onChange={(e) => setPwd(e.target.value)} style={{ fontFamily: "monospace" }} />
              <button type="button" className="a-btn a-btn-sm" onClick={() => setPwd(genPwd())} title="Régénérer"><Icon name="settings" size={15} /></button>
            </div>
          </div>
          <div style={{ background: "#f6f7fb", borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: "var(--ink2)" }}>
            Le client recevra ces identifiants pour accéder à son propre back-office.
          </div>
          <button className="a-btn a-btn-primary" style={{ justifyContent: "center" }} type="submit">Créer l'accès</button>
        </form>
      </div>
    </div>
  );
}

function genPwd() {
  return Math.random().toString(36).slice(2, 6) + "-" + Math.random().toString(36).slice(2, 6);
}
const avatar: React.CSSProperties = { width: 36, height: 36, borderRadius: 10, background: "var(--accent)", display: "grid", placeItems: "center", color: "var(--accent-ink)", fontWeight: 700, fontSize: 14, flexShrink: 0 };
