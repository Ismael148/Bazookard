"use client";
// Tableau de bord admin — données RÉELLES (à zéro au départ) :
// totaux agrégés + analytics détaillées par workspace.
import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import AdminHeader from "@/components/AdminHeader";
import { listWorkspaces, listClients, type Workspace, type Client } from "@/lib/admin-db";
import { getStats, type Stats } from "@/lib/tracking";

const empty: Stats = { view: 0, tap: 0, chat: 0, lead: 0 };

export default function AdminDashboard() {
  const [ws, setWs] = useState<Workspace[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const clientCount = clients.length;
  const nameOf = (id: string | null) => (id ? clients.find((c) => c.id === id)?.company ?? "—" : "Non assigné");

  useEffect(() => {
    (async () => {
      const [list, cls] = await Promise.all([listWorkspaces(), listClients()]);
      setWs(list);
      setClients(cls);
      const entries = await Promise.all(
        list.filter((w) => w.cardId).map(async (w) => [w.id, await getStats(w.cardId!)] as const)
      );
      setStats(Object.fromEntries(entries));
    })();
  }, []);

  const total = ws.reduce((acc, w) => {
    const s = stats[w.id] ?? empty;
    return { view: acc.view + s.view, tap: acc.tap + s.tap, chat: acc.chat + s.chat, lead: acc.lead + s.lead };
  }, { ...empty });

  const CARDS = [
    { label: "Cartes actives", value: ws.filter((w) => w.cardId).length, icon: "card", sub: `${ws.length} workspace(s)` },
    { label: "Clients", value: clientCount, icon: "users", sub: "comptes clients créés" },
    { label: "Vues totales", value: total.view, icon: "eye", sub: `${total.tap} clics sur les cartes` },
    { label: "Contacts reçus", value: total.lead, icon: "inbox", sub: `${total.chat} conversations chatbot` },
  ];

  return (
    <div>
      <AdminHeader title="Vue d'ensemble" subtitle="Pilotage de votre activité Karte">
        <Link href="/admin/workspaces" className="a-btn a-btn-primary"><Icon name="plus" size={15} /> Nouveau workspace</Link>
      </AdminHeader>

      <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Totaux réels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
          {CARDS.map((s) => (
            <div key={s.label} className="a-card fade-up" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--accent-soft)", color: "#8A6A00", display: "grid", placeItems: "center" }}><Icon name={s.icon} size={18} /></span>
                <div style={{ color: "var(--ink2)", fontSize: 13, fontWeight: 600 }}>{s.label}</div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 10, fontFamily: "var(--font-display)" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Analytics par workspace */}
        <div className="a-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>📊 Analytics par workspace</h3>
            <Link href="/admin/workspaces" className="a-badge a-badge-soft" style={{ textDecoration: "none" }}>Gérer</Link>
          </div>
          {ws.length === 0 ? (
            <div style={{ padding: 36, textAlign: "center", color: "var(--muted)" }}>
              Aucun workspace pour l&apos;instant. <Link href="/admin/workspaces" style={{ color: "var(--accent-deep)", fontWeight: 700 }}>Créez le premier</Link> pour votre premier client.
            </div>
          ) : (
            <table className="a-table" style={{ marginTop: 8 }}>
              <thead><tr><th>Workspace</th><th>Client</th><th>👁 Vues</th><th>🖱 Clics</th><th>💬 Chat</th><th>✉ Contacts</th><th></th></tr></thead>
              <tbody>
                {ws.map((w) => {
                  const s = stats[w.id] ?? empty;
                  return (
                    <tr key={w.id}>
                      <td><strong>{w.name}</strong><div style={{ fontSize: 12, color: "var(--muted)" }}>/c/{w.slug}</div></td>
                      <td style={{ color: "var(--ink2)" }}>{nameOf(w.clientId)}</td>
                      <td style={{ fontWeight: 700 }}>{s.view}</td>
                      <td style={{ fontWeight: 700 }}>{s.tap}</td>
                      <td style={{ fontWeight: 700 }}>{s.chat}</td>
                      <td style={{ fontWeight: 700, color: s.lead > 0 ? "var(--success)" : undefined }}>{s.lead}</td>
                      <td style={{ textAlign: "right" }}>
                        {w.cardId
                          ? <Link href={`/${w.slug}`} target="_blank" className="a-btn a-btn-sm"><Icon name="eye" size={14} /> Voir</Link>
                          : <span className="a-badge a-badge-off">carte à créer</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
