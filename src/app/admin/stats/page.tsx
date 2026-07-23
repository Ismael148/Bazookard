"use client";
// Section Statistiques — rapports & graphiques élégants (30 derniers jours).
import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import Icon from "@/components/Icon";
import { AreaChart, HBarChart, Donut } from "@/components/StatsChart";
import { listWorkspaces, listClients, type Workspace, type Client } from "@/lib/admin-db";
import { getStats, getDailyStats, getRegionStats, type Stats, type DayStats } from "@/lib/tracking";

const empty: Stats = { view: 0, tap: 0, chat: 0, lead: 0 };
const RANGES = [7, 14, 30, 90];

export default function StatsPage() {
  const [ws, setWs] = useState<Workspace[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [daily, setDaily] = useState<DayStats[]>([]);
  const [regions, setRegions] = useState<{ label: string; value: number }[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [list, cls] = await Promise.all([listWorkspaces(), listClients()]);
      setWs(list); setClients(cls);
      const withCard = list.filter((w) => w.cardId);
      const ids = withCard.map((w) => w.cardId!);
      const [entries, series, regs] = await Promise.all([
        Promise.all(withCard.map(async (w) => [w.id, await getStats(w.cardId!)] as const)),
        getDailyStats(ids, days),
        getRegionStats(ids),
      ]);
      setStats(Object.fromEntries(entries));
      setDaily(series);
      setRegions(regs);
      setLoading(false);
    })();
  }, [days]);

  const total = ws.reduce((acc, w) => {
    const s = stats[w.id] ?? empty;
    return { view: acc.view + s.view, tap: acc.tap + s.tap, chat: acc.chat + s.chat, lead: acc.lead + s.lead };
  }, { ...empty });
  const periodViews = daily.reduce((a, d) => a + d.view, 0);
  const bestDay = daily.reduce((best, d) => (d.view > best.view ? d : best), { date: "", ...empty });
  const convRate = total.view > 0 ? Math.round(((total.lead + total.tap) / total.view) * 100) : 0;
  const clientOf = (w: Workspace) => (w.clientId ? clients.find((c) => c.id === w.clientId)?.company : undefined);

  const rows = ws.filter((w) => w.cardId)
    .map((w) => ({ label: w.name, sub: clientOf(w), value: (stats[w.id] ?? empty).view }))
    .sort((a, b) => b.value - a.value).slice(0, 8);

  const KPI = [
    { label: `Vues (${days} j)`, value: periodViews, icon: "eye", sub: bestDay.date ? `pic le ${new Date(bestDay.date + "T00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} (${bestDay.view})` : "aucun pic détecté" },
    { label: "Vues totales", value: total.view, icon: "spark", sub: "depuis le lancement" },
    { label: "Taux d'engagement", value: `${convRate}%`, icon: "target", sub: "clics + contacts / vues" },
    { label: "Contacts reçus", value: total.lead, icon: "inbox", sub: `${total.chat} conversations IA` },
  ];

  return (
    <div>
      <AdminHeader title="Statistiques" subtitle="Rapports détaillés de toutes vos cartes">
        <div style={{ display: "flex", gap: 6 }}>
          {RANGES.map((r) => (
            <button key={r} className={`a-btn a-btn-sm${days === r ? " a-btn-primary" : ""}`} onClick={() => setDays(r)}>{r} j</button>
          ))}
        </div>
      </AdminHeader>

      <div style={{ padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
          {KPI.map((s) => (
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

        {/* Courbe des vues */}
        <div className="a-card fade-up" style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Évolution des vues</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>Toutes cartes cumulées — {days} derniers jours</div>
          {loading ? <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Chargement…</div> : <AreaChart data={daily} />}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 }}>
          {/* Classement des cartes */}
          <div className="a-card fade-up" style={{ padding: 22 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Top cartes par vues</div>
            <HBarChart rows={rows} />
          </div>
          {/* Régions des visiteurs */}
          <div className="a-card fade-up" style={{ padding: 22 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>🌍 D&apos;où viennent vos visiteurs</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14 }}>Localisation réelle des vues (ville, région)</div>
            {regions.length > 0
              ? <HBarChart rows={regions} />
              : <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 18 }}>Les régions s&apos;afficheront dès les prochaines visites.</div>}
          </div>
          {/* Répartition */}
          <div className="a-card fade-up" style={{ padding: 22 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Répartition des interactions</div>
            <Donut parts={[
              { label: "Clics sur la carte", value: total.tap, color: "#FFD500" },
              { label: "Contacts / réservations", value: total.lead, color: "#E8A800" },
              { label: "Conversations IA", value: total.chat, color: "#17140C" },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
