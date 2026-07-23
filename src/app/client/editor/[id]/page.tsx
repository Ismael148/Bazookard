"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Card } from "@/lib/types";
import { clientSession, clientSaveCard, clientLogoutDb, defaultPerms, type Permissions } from "@/lib/admin-db";
import Editor from "@/components/Editor";

export default function ClientEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [perms, setPerms] = useState<Permissions>(defaultPerms());

  useEffect(() => {
    const sess = clientSession();
    if (!sess) { router.replace("/client/login"); return; }
    const w = sess.workspaces.find((x) => x.cardId === id);
    if (!w || !w.card) { setCard(null); return; }
    setPerms(w.permissions);
    setCard(w.card);
  }, [id, router]);

  if (card === undefined) return <div className="admin" style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted)" }}>Chargement…</div>;
  if (card === null) return <div className="admin" style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted)" }}>Carte introuvable ou accès non autorisé.</div>;

  return (
    <Editor
      initial={card}
      perms={perms}
      backHref="/client"
      backLabel="Mes cartes"
      onSave={(c) => { void clientSaveCard(c); }}
      onLogout={() => { clientLogoutDb(); router.replace("/client/login"); }}
    />
  );
}
