"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Editor from "@/components/Editor";
import { getCard, supabaseEnabled, signOut } from "@/lib/db";
import { useRouter } from "next/navigation";
import type { Card } from "@/lib/types";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<Card | null | undefined>(undefined);

  useEffect(() => { (async () => setCard((await getCard(id)) ?? null))(); }, [id]);

  if (card === undefined)
    return <div style={center}>Chargement…</div>;
  if (card === null)
    return (
      <div style={center}>
        Carte introuvable. <Link href="/dashboard" style={{ color: "var(--brand2)" }}>← Retour</Link>
      </div>
    );
  // Le bouton retour ramène exactement à la page d'origine (admin, client ou dashboard)
  let back = { href: "/dashboard", label: "Tableau de bord" };
  try {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("karte_ed_back") : null;
    if (saved) back = JSON.parse(saved) as { href: string; label: string };
  } catch {}
  return <Editor initial={card}
    backHref={back.href}
    backLabel={back.label}
    onLogout={supabaseEnabled() ? async () => { await signOut(); router.replace("/login"); } : undefined} />;
}

const center: React.CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted)", gap: 8 };
