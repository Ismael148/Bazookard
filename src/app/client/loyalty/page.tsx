"use client";
// Espace client — Fidélité : gérez les cartes de fidélité de vos cartes NFC.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { clientSession, clientLoginDb, type ClientSession } from "@/lib/admin-db";

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");

interface Program {
  cardId: string | null;
  wsName: string;
  editable: boolean;
  title: string;
  reward: string;
  stamps: string;
  pin: string;
  note: string;
}

export default function ClientLoyalty() {
  const [sess, setSess] = useState<ClientSession | null>(null);
  const router = useRouter();

  useEffect(() => {
    const c = clientSession();
    if (!c) { router.replace("/client/login"); return; }
    setSess(c);
    void clientLoginDb(c.client.email, c.password).then((fresh) => { if (fresh) setSess(fresh); });
  }, [router]);

  if (!sess) return null;

  const programs: Program[] = [];
  for (const w of sess.workspaces) {
    const blocks = w.card?.blocks ?? [];
    for (const b of blocks) {
      if (b.type !== "loyalty") continue;
      const d = b.data as Dict;
      programs.push({
        cardId: w.cardId,
        wsName: w.name,
        editable: w.permissions.editText,
        title: s(d.title) || "Carte de fidélité",
        reward: s(d.reward),
        stamps: s(d.stamps) || "8",
        pin: s(d.pin),
        note: s(d.note),
      });
    }
  }

  return (
    <div>
      <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,.7)", backdropFilter: "blur(8px)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 9 }}><Icon name="gift" size={22} /> Fidélité</h1>
        <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 2 }}>Vos programmes de fidélité et comment les valider.</p>
      </div>

      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Rappel du fonctionnement */}
        <div className="a-card fade-up" style={{ padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
          <span style={{ fontSize: 26 }}>💡</span>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink2)" }}>
            <b>Comment ça marche&nbsp;:</b> votre client ouvre votre carte, appuie sur « Ajouter un tampon ».
            Vous saisissez votre <b>code PIN commerçant</b> directement sur son téléphone pour valider la visite.
            Une fois la carte pleine, la récompense se débloque automatiquement. Les tampons du client sont
            conservés sur son téléphone — aucun compte à créer pour lui.
          </div>
        </div>

        {programs.length === 0 ? (
          <div className="a-card" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            Aucune carte de fidélité active. Ajoutez le bloc <b>« Carte de fidélité »</b> à l&apos;une de vos cartes pour lancer un programme.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {programs.map((p, i) => (
              <div key={i} className="a-card fade-up" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{p.wsName}</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4 }}>🎁 {p.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                  <Row label="Récompense" value={p.reward || "—"} />
                  <Row label="Tampons requis" value={p.stamps} />
                  <Row label="Code PIN commerçant" value={p.pin ? p.pin : "Non défini"} mono />
                  {p.note && <Row label="Note affichée" value={p.note} />}
                </div>
                {p.editable && p.cardId && (
                  <Link href={`/client/editor/${p.cardId}`} className="a-btn a-btn-sm a-btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
                    <Icon name="edit" size={15} /> Modifier le programme
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 700, textAlign: "right", fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
    </div>
  );
}
