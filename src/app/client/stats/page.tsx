"use client";
// Espace client — Performance : rapports graphiques de vos cartes.
// Données réelles, rafraîchies automatiquement toutes les 15 s (temps réel).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clientSession, clientLoginDb, clientDailyStats, type ClientSession } from "@/lib/admin-db";
import { AreaChart, HBarChart, Donut } from "@/components/StatsChart";
import { getStats, type DayStats, type Stats } from "@/lib/tracking";

const RANGES = [7, 14, 30, 90];
const REFRESH_MS = 15000;

export default function ClientStats() {
  const [sess, setSess] = useState<ClientSession | null>(null);
  const [daily, setDaily] = useState<DayStats[]>([]);
  const [live, setLive] = useState<Record<string, Stats>>({});
  const [days, setDays] = useState(30);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    const s = clientSession();
    if (!s) { router.replace("/client/login"); return; }
    setSess(s);
    void clientLoginDb(s.client.email, s.password).then((fresh) => { if (fresh) setSess(fresh); });
  }, [router]);

  // Rafraîchissement temps réel : stats par carte + série journalière
  useEffect(() => {
    if (!sess) return;
    let stop = false;
    async function refresh() {
      const [d, entries] = await Promise.all([
        clientDailyStats(days),
        Promise.all(
          sess!.workspaces
            .filter((w) => w.cardId)
            .map(async (w) => [w.cardId as string, await getStats(w.cardId as string)] as const)
        ),
      ]);
      if (stop) return;
      setDaily(d);
      setLive(Object.fromEntries(entries));
      setUpdatedAt(new Date());
    }
    void refresh();
    const t = setInterval(() => void refresh(), REFRESH_MS);
    return () => { stop = true; clearInterval(t); };
  }, [sess, days]);

  if (!sess) return null;
  const visible = sess.workspaces.filter((w) => w.permissions.viewLeads);
  const wsStats = (w: ClientSession["workspaces"][number]): Stats => {
    if (w.cardId && live[w.cardId]) return live[w.cardId];
    return w.stats ?? { view: 0, tap: 0, chat: 0, lead: 0 };
  };
  const totals = visible.reduce((a, w) => {
    const st = wsStats(w);
    return { view: a.view + st.view, tap: a.tap + st.tap, chat: a.chat + st.chat, lead: a.lead + st.lead };
  }, { view: 0, tap: 0, chat: 0, lead: 0 });
  const periodViews = daily.reduce((a, d) => a + d.view, 0);
  const conv = totals.view > 0 ? Math.round(((totals.lead + totals.tap) / totals.view) * 100) : 0;

  return (
    <div>
      <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
            📊 Performance
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "#E9F7F0", color: "#1E8A5C" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1E8A5C", animation: "pulse 1.6s infinite" }} />
              En direct
            </span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 2 }}>
            L&apos;activité de vos cartes, jour par jour.
            {updatedAt && <> · Actualisé à {updatedAt.toLocaleTimeString("fr-FR")}</>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {RANGES.map((r) => (
            <button key={r} className={`a-btn a-btn-sm${days === r ? " a-btn-primary" : ""}`} onClick={() => setDays(r)}>{r} j</button>
          ))}
        </div>
      </div>

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14 }}>
          {[
            { l: `Vues (${days} j)`, v: periodViews },
            { l: "Vues totales", v: totals.view },
            { l: "Taux d'engagement", v: `${conv}%` },
            { l: "Contacts reçus", v: totals.lead },
          ].map((k) => (
            <div key={k.l} className="a-card fade-up" style={{ padding: 16 }}>
              <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>{k.l}</div>
              <div style={{ fontSize: 27, fontWeight: 800, marginTop: 6, fontFamily: "var(--font-display)" }}>{k.v}</div>
            </div>
          ))}
        </div>

        <div className="a-card fade-up" style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>Évolution des vues — {days} derniers jours</div>
          <AreaChart data={daily} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18 }}>
          <div className="a-card fade-up" style={{ padding: 22 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Vues par carte</div>
            <HBarChart rows={visible.map((w) => ({ label: w.name, value: wsStats(w).view }))} />
          </div>
          <div className="a-card fade-up" style={{ padding: 22 }}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Répartition des interactions</div>
            <Donut parts={[
              { label: "Clics sur la carte", value: totals.tap, color: "#FFD500" },
              { label: "Contacts / réservations", value: totals.lead, color: "#E8A800" },
              { label: "Conversations IA", value: totals.chat, color: "#17140C" },
            ]} />
          </div>
        </div>
        {visible.length === 0 && (
          <div className="a-card" style={{ padding: 36, textAlign: "center", color: "var(--muted)" }}>
            Les statistiques ne sont pas activées sur votre compte. Contactez Adamkom by JJP.
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }`}</style>
    </div>
  );
}
