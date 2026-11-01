"use client";
// Espace client — accueil : liste des ESPACES (workspaces). Chaque espace regroupe des cartes.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { clientSession, clientLoginDb, allClientCards, type ClientSession, type ClientWs } from "@/lib/admin-db";
import { getStats, type Stats } from "@/lib/tracking";
import { CARD_THEMES } from "@/lib/types";
import GuidedTour, { type TourStep } from "@/components/GuidedTour";

const TOUR_SEEN = "bzk_tour_client";
const CLIENT_TOUR: TourStep[] = [
  { title: "Bienvenue dans votre espace 👋", body: "En moins d'une minute, découvrez comment gérer vos cartes NFC. Vous pourrez revoir cette visite à tout moment grâce au bouton « ? Visite guidée »." },
  { target: "[data-tour='ws-tile']", title: "Vos espaces", body: "Chaque espace regroupe une ou plusieurs cartes. Cliquez sur « Ouvrir l'espace » pour voir ses cartes, les modifier, en créer de nouvelles ou les dupliquer.", placement: "bottom" },
  { target: "a[href='/client/stats']", title: "Vos performances", body: "Suivez les vues, les clics et les contacts générés par toutes vos cartes, jour après jour.", placement: "bottom" },
  { target: "a[href='/client/leads']", title: "Contacts & messages", body: "Retrouvez ici toutes les personnes qui vous ont laissé leurs coordonnées via vos cartes. Une pastille signale les nouveaux.", placement: "bottom" },
  { target: "a[href='/client/loyalty']", title: "Fidélité", body: "Gérez vos cartes de fidélité digitales pour récompenser vos clients réguliers.", placement: "bottom" },
  { title: "Vous êtes prêt ✨", body: "Besoin d'aide ? Le bouton « ? Visite guidée » relance ce tour quand vous voulez. Bonne personnalisation !" },
];

export default function ClientHome() {
  const [sess, setSess] = useState<ClientSession | null>(null);
  const [wsStats, setWsStats] = useState<Record<string, Stats>>({});
  const router = useRouter();
  const [tour, setTour] = useState(false);

  useEffect(() => {
    const s = clientSession();
    if (!s) { router.replace("/client/login"); return; }
    setSess(s);
    void clientLoginDb(s.client.email, s.password).then((fresh) => { if (fresh) setSess(fresh); });
  }, [router]);

  // Agrège les stats par espace (toutes ses cartes).
  useEffect(() => {
    if (!sess) return;
    let stop = false;
    (async () => {
      const acc: Record<string, Stats> = {};
      for (const w of sess.workspaces) {
        if (!w.permissions.viewLeads) continue;
        let agg: Stats = { view: 0, tap: 0, chat: 0, lead: 0 };
        for (const c of w.cards) {
          const st = c.stats ?? await getStats(c.id);
          agg = { view: agg.view + st.view, tap: agg.tap + st.tap, chat: agg.chat + st.chat, lead: agg.lead + st.lead };
        }
        acc[w.id] = agg;
      }
      if (!stop) setWsStats(acc);
    })();
    return () => { stop = true; };
  }, [sess]);

  useEffect(() => {
    if (!sess || !sess.workspaces.length) return;
    let seen = "0";
    try { seen = localStorage.getItem(TOUR_SEEN) || "0"; } catch {}
    if (seen !== "1") { const t = setTimeout(() => setTour(true), 700); return () => clearTimeout(t); }
  }, [sess]);

  const closeTour = () => { setTour(false); try { localStorage.setItem(TOUR_SEEN, "1"); } catch {} };

  if (!sess) return null;

  const heroImg = (w: ClientWs): string => {
    const card = w.cards[0];
    if (!card) return "";
    const banner = card.blocks.find((b) => b.type === "banner")?.data as Record<string, unknown> | undefined;
    const profile = card.blocks.find((b) => b.type === "profile")?.data as Record<string, unknown> | undefined;
    const img = (banner?.image as string) || (profile?.photo as string) || "";
    return typeof img === "string" ? img : "";
  };

  const allLeads = allClientCards(sess)
    .filter((x) => x.ws.permissions.viewLeads && x.card.leads?.length)
    .map((x) => ({ title: x.ws.cards.length > 1 ? `${x.ws.name} · ${x.card.title}` : x.ws.name, items: x.card.leads.slice(0, 6) }));

  return (
    <div>
      <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 14 }}>
        {sess.client.logo && <span style={{ width: 46, height: 46, borderRadius: 12, backgroundImage: `url('${sess.client.logo}')`, backgroundSize: "cover", backgroundPosition: "center", border: "1px solid var(--line)" }} />}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Bonjour {sess.client.company} 👋</h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 2 }}>Vos espaces, vos cartes et vos contacts — en temps réel.</p>
        </div>
        <button className="gt-trigger" style={{ marginLeft: "auto" }} onClick={() => setTour(true)} title="Revoir la visite guidée">
          <Icon name="help" size={16} /> Visite guidée
        </button>
      </div>

      <div style={{ padding: 28, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
        {sess.workspaces.map((w) => {
          const img = heroImg(w);
          const theme = w.cards[0] ? CARD_THEMES[w.cards[0].themeIndex] : undefined;
          const st = wsStats[w.id];
          return (
            <div key={w.id} data-tour="ws-tile" className="a-card a-card-hover fade-up" style={{ overflow: "hidden" }}>
              <div style={{
                height: 120, position: "relative",
                background: img
                  ? `linear-gradient(180deg, rgba(23,20,12,.05), rgba(23,20,12,.5)), url('${img}') center/cover`
                  : `linear-gradient(135deg, ${theme?.accent ?? "#FFD500"}, ${theme?.accent2 ?? "#FFC800"})`,
              }}>
                <span style={{ position: "absolute", left: 14, bottom: 12, color: "#fff", fontWeight: 700, fontSize: 17, textShadow: "0 2px 10px rgba(0,0,0,.45)", fontFamily: "var(--font-display)" }}>
                  {w.name}
                </span>
                <span style={{ position: "absolute", right: 12, top: 12, background: "rgba(255,255,255,.92)", color: "#17140C", fontWeight: 700, fontSize: 12, padding: "4px 10px", borderRadius: 999 }}>
                  {w.cards.length} carte{w.cards.length > 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ padding: 18 }}>
                {st && w.permissions.viewLeads ? (
                  <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: "var(--ink2)", fontWeight: 600 }}>
                    <span>👁 {st.view} vues</span>
                    <span>🖱 {st.tap} clics</span>
                    <span>✉ {st.lead} contacts</span>
                  </div>
                ) : (
                  <div style={{ color: "var(--muted)", fontSize: 12.5 }}>{w.cards.length ? "Cliquez pour gérer vos cartes" : "Espace en préparation"}</div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <Link href={`/client/workspace/${w.id}`} className="a-btn a-btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                    <Icon name="workspace" size={15} /> Ouvrir l&apos;espace
                  </Link>
                  {w.cards.length === 1 && (
                    <Link href={`/client/editor/${w.cards[0].id}`} className="a-btn" title="Modifier la carte"><Icon name="edit" size={16} /></Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {allLeads.length > 0 && (
          <div className="a-card" style={{ gridColumn: "1/-1", padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📥 Derniers contacts reçus</h3>
            {allLeads.map((g) => (
              <div key={g.title} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>{g.title}</div>
                {g.items.map((l, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 13.5 }}>
                    <span style={{ fontWeight: 600 }}>{l.name || "Anonyme"}</span>
                    <span style={{ color: "var(--ink2)" }}>{l.contact}</span>
                    <span style={{ color: "var(--muted)", fontSize: 12 }}>{new Date(l.ts).toLocaleDateString("fr-FR")}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {sess.workspaces.length === 0 && (
          <div className="a-card" style={{ padding: 40, textAlign: "center", color: "var(--muted)", gridColumn: "1/-1" }}>
            Aucun espace assigné pour le moment. Contactez Adamkom by JJP.
          </div>
        )}
      </div>

      <GuidedTour steps={CLIENT_TOUR} open={tour} onClose={closeTour} />
    </div>
  );
}
