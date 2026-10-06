"use client";
// Espace client — Contacts & messages : tout ce que vos visiteurs vous laissent.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import ConfirmModal from "@/components/ConfirmModal";
import { clientSession, clientLoginDb, clientDeleteLead, type ClientSession, type ClientWs } from "@/lib/admin-db";
import { getLeads, type Lead } from "@/lib/tracking";

export default function ClientLeads() {
  const [sess, setSess] = useState<ClientSession | null>(null);
  const [extra, setExtra] = useState<Record<string, Lead[]>>({});
  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<{ cardId: string; lead: Lead } | null>(null);
  const router = useRouter();

  async function load() {
    const s = clientSession();
    if (!s) { router.replace("/client/login"); return; }
    setSess(s);
    const fresh = await clientLoginDb(s.client.email, s.password);
    const cur = fresh ?? s;
    if (fresh) setSess(fresh);
    const ld: Record<string, Lead[]> = {};
    for (const w of cur.workspaces) {
      if (!w.cardId || !w.permissions.viewLeads || w.leads?.length) continue;
      ld[w.cardId] = await getLeads(w.cardId);
    }
    setExtra(ld);
  }

  useEffect(() => { void load(); }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!sess) return null;
  const leadsOf = (w: ClientWs): Lead[] => (w.leads?.length ? w.leads : (w.cardId ? extra[w.cardId] ?? [] : []));
  const groups = sess.workspaces
    .filter((w) => w.permissions.viewLeads)
    .map((w) => ({
      ws: w.name,
      cardId: w.cardId,
      items: leadsOf(w).filter((l) => {
        const s = q.trim().toLowerCase();
        return !s || l.name.toLowerCase().includes(s) || l.contact.toLowerCase().includes(s);
      }),
    }))
    .filter((g) => g.items.length);
  const total = groups.reduce((a, g) => a + g.items.length, 0);

  const linkFor = (contact: string) => {
    const mail = contact.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0];
    if (mail) return `mailto:${mail}`;
    const tel = contact.match(/(?:\+?\d[\d .]{7,})/)?.[0]?.replace(/[ .]/g, "");
    return tel ? `tel:${tel}` : "";
  };

  return (
    <div>
      <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>📥 Contacts &amp; messages</h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 2 }}>Réservations, formulaires, inscriptions — {total} contact(s).</p>
        </div>
        {(() => {
          const emails = groups.flatMap((g) => g.items.map((l) => l.contact.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0])).filter(Boolean) as string[];
          const uniq = [...new Set(emails)];
          return uniq.length > 0 ? (
            <a className="a-btn a-btn-primary a-btn-sm" href={`mailto:?bcc=${uniq.join(",")}&subject=${encodeURIComponent("Des nouvelles de notre part 👋")}`}>
              ✉️ Écrire à tous ({uniq.length})
            </a>
          ) : null;
        })()}
        <div style={{ position: "relative", width: 280 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}><Icon name="search" size={15} /></span>
          <input className="a-input" style={{ paddingLeft: 34 }} placeholder="Rechercher un contact…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
        {groups.map((g) => (
          <div key={g.ws} className="a-card fade-up" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>{g.ws} · {g.items.length}</div>
            {g.items.map((l, i) => {
              const href = linkFor(l.contact);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < g.items.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent-soft)", color: "#8A6A00", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                    {(l.name || "?").replace(/[^\p{L}]/gu, "").slice(0, 1).toUpperCase() || "?"}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{l.name || "Anonyme"}</div>
                    <div style={{ color: "var(--ink2)", fontSize: 13, overflowWrap: "anywhere" }}>{l.contact}</div>
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: 12, flexShrink: 0 }}>{new Date(l.ts).toLocaleDateString("fr-FR")}</span>
                  {href && <a href={href} className="a-btn a-btn-sm a-btn-primary" style={{ flexShrink: 0 }}>Répondre</a>}
                  {g.cardId && (
                    <button className="a-btn a-btn-sm a-btn-danger" style={{ flexShrink: 0 }} title="Supprimer ce message"
                      onClick={() => setToDelete({ cardId: g.cardId as string, lead: l })}>
                      <Icon name="trash" size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {groups.length === 0 && (
          <div className="a-card" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            {q ? "Aucun contact ne correspond à cette recherche." : "Aucun contact pour le moment — partagez votre carte !"}
          </div>
        )}
      </div>

      {toDelete && (
        <ConfirmModal
          message={`Supprimer le message de « ${toDelete.lead.name || toDelete.lead.contact || "ce contact"} » ?`}
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            const { cardId, lead } = toDelete;
            setToDelete(null);
            void clientDeleteLead(cardId, lead).then((ok) => {
              if (ok) {
                // retire aussi de la liste locale « extra » (cas lecture directe)
                setExtra((prev) => ({ ...prev, [cardId]: (prev[cardId] ?? []).filter((x) => (lead.id ? x.id !== lead.id : x.ts !== lead.ts)) }));
                void load();
              }
            });
          }}
        />
      )}
    </div>
  );
}
