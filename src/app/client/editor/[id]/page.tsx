"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Card } from "@/lib/types";
import { clientSession, clientSaveCard, clientLogoutDb, findClientCard, defaultPerms, type Permissions } from "@/lib/admin-db";
import Editor from "@/components/Editor";

export default function ClientEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [perms, setPerms] = useState<Permissions>(defaultPerms());
  const [backHref, setBackHref] = useState("/client");

  useEffect(() => {
    const sess = clientSession();
    if (!sess) { router.replace("/client/login"); return; }
    const found = findClientCard(sess, id);
    if (!found) { setCard(null); return; }
    setPerms(found.ws.permissions);
    setBackHref(`/client/workspace/${found.ws.id}`);
    setCard(found.card);
  }, [id, router]);

  if (card === undefined) return <div className="admin" style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted)" }}>Chargement…</div>;
  if (card === null) return <div className="admin" style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted)" }}>Carte introuvable ou accès non autorisé.</div>;

  return (
    <Editor
      initial={card}
      perms={perms}
      backHref={backHref}
      backLabel="Mes cartes"
      onSave={(c) => { void clientSaveCard(c); }}
      onLogout={() => { clientLogoutDb(); router.replace("/client/login"); }}
    />
  );
}
