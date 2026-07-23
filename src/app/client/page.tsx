"use client";
// Espace client — session unifiée (Supabase RPC ou démo locale).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { clientSession, clientLoginDb, type ClientSession, type ClientWs, type Permissions } from "@/lib/admin-db";
import { getStats, getLeads, type Stats, type Lead } from "@/lib/tracking";
import { CARD_THEMES } from "@/lib/types";

const PERM_BADGES: { key: keyof Permissions; label: string }[] = [
  { key: "editText", label: "Textes & images" },
  { key: "editStructure", label: "Structure" },
  { key: "publish", label: "Publication" },
  { key: "viewLeads", label: "Leads" },
];

export default function ClientHome() {
  const [sess, setSess] = useState<ClientSession | null>(null);
  const [extraStats, setExtraStats] = useState<Record<string, Stats>>({});
  const [extraLeads, setExtraLeads] = useState<Record<string, Lead[]>>({});
  const router = useRouter();

  useEffect(() => {
    const s = clientSession();
    if (!s) { router.replace("/client/login"); return; }
    setSess(s);
    // Rafraîchit la session (permissions/stats/leads à jour depuis la base)
    void clientLoginDb(s.client.email, s.password).then((fresh) => { if (fresh) setSess(fresh); });
    // mode démo : stats/leads pas dans la session → on les charge
    (async () => {
      const st: Record<string, Stats> = {};
      const ld: Record<string, Lead[]> = {};
      for (const w of s.workspaces) {
        if (!w.cardId || !w.permissions.viewLeads || w.stats) continue;
        st[w.cardId] = await getStats(w.cardId);
        ld[w.cardId] = (await getLeads(w.cardId)).slice(0, 8);
      }
      setExtraStats(st); setExtraLeads(ld);
    })();
  }, [router]);

  if (!sess) return null;

  const heroImg = (w: ClientWs): string => {
    const card = w.card;
    if (!card) return "";
    const banner = card.blocks.find((b) => b.type === "banner")?.data as Record<string, unknown> | undefined;
    const profile = card.blocks.find((b) => b.type === "profile")?.data as Record<string, unknown> | undefined;
    const img = (banner?.image as string) || (profile?.photo as string) || "";
    return typeof img === "string" ? img : "";
  };
  const statsOf = (w: ClientWs): Stats | null => w.stats ?? (w.cardId ? extraStats[w.cardId] ?? null : null);
  const leadsOf = (w: ClientWs): Lead[] => (w.leads?.length ? w.leads : (w.cardId ? extraLeads[w.cardId] ?? [] : []));
  const allLeads = sess.workspaces.filter((w) => w.permissions.viewLeads).map((w) => ({ ws: w.name, items: leadsOf(w) })).filter((g) => g.items.length);

  return (
    <div>
      <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 14 }}>
        {sess.client.logo && <span style={{ width: 46, height: 46, borderRadius: 12, backgroundImage: `url('${sess.client.logo}')`, backgroundSize: "cover", backgroundPosition: "center", border: "1px solid var(--line)" }} />}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Bonjour {sess.client.company} 👋</h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 2 }}>Vos cartes, vos statistiques et vos contacts — en temps réel.</p>
        </div>
      </div>

      <div style={{ padding: 28, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {sess.workspaces.map((w) => {
          const img = heroImg(w);
          const theme = w.card ? CARD_THEMES[w.card.themeIndex] : undefined;
          const st = statsOf(w);
          return (
            <div key={w.id} className="a-card a-card-hover fade-up" style={{ overflow: "hidden" }}>
              <div style={{
                height: 110, position: "relative",
                background: img
                  ? `linear-gradient(180deg, rgba(23,20,12,.05), rgba(23,20,12,.45)), url('${img}') center/cover`
                  : `linear-gradient(135deg, ${theme?.accent ?? "#FFD500"}, ${theme?.accent2 ?? "#FFC800"})`,
              }}>
                <span style={{ position: "absolute", left: 12, bottom: 10, color: "#fff", fontWeight: 700, fontSize: 16, textShadow: "0 2px 10px rgba(0,0,0,.4)", fontFamily: "var(--font-display)" }}>
                  {w.card?.title ?? w.name}
                </span>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ color: "var(--muted)", fontSize: 12.5 }}>
                  /{w.card?.slug ?? w.slug} {w.card ? `· ${w.card.blocks.length} blocs` : "· carte en préparation"}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                  {PERM_BADGES.map((pb) => (
                    <span key={pb.key} className="a-badge" style={{
                      background: w.permissions[pb.key] ? "var(--accent-soft)" : "#F4F2EA",
                      color: w.permissions[pb.key] ? "#8A6A00" : "var(--muted)",
                    }}>
                      {w.permissions[pb.key] ? "✓" : "🔒"} {pb.label}
                    </span>
                  ))}
                </div>
                {st && w.permissions.viewLeads && (
                  <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 12.5, color: "var(--ink2)", fontWeight: 600 }}>
                    <span>👁 {st.view} vues</span>
                    <span>🖱 {st.tap} clics</span>
                    <span>✉ {st.lead} contacts</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  {w.card && (
                    <Link href={`/client/editor/${w.card.id}`} className="a-btn a-btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                      <Icon name="edit" size={15} /> Modifier ma carte
                    </Link>
                  )}
                  {w.card && (
                    <Link href={`/${w.card.slug}`} target="_blank" className="a-btn"><Icon name="eye" size={16} /></Link>
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
              <div key={g.ws} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>{g.ws}</div>
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
            Aucune carte assignée pour le moment. Contactez Adamkom by JJP.
          </div>
        )}
      </div>
    </div>
  );
}
