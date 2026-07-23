"use client";
// Carte de DÉMONSTRATION — montre toutes les fonctionnalités en conditions réelles
// (menu cliquable, fidélité, offres, avis, chatbot IA…). Aucune donnée enregistrée.
import { useMemo, useState } from "react";
import Link from "next/link";
import CardRenderer from "@/components/CardRenderer";
import { TEMPLATES, templateBlocks } from "@/lib/templates";
import { uid } from "@/lib/store";
import type { Card } from "@/lib/types";

const WA = "https://wa.me/262693802201?text=" + encodeURIComponent("Je viens de voir la carte démo, je veux la même pour mon activité !");

export default function DemoPage() {
  const [chatOpen, setChatOpen] = useState(false);
  // Le Bistrot Doré : le template le plus complet (menu, fidélité, horaires, offres, avis…)
  const card: Card = useMemo(() => {
    const t = TEMPLATES[1];
    return { id: "demo-karte", slug: "demo", title: t.name, themeIndex: t.themeIndex, blocks: templateBlocks(t, uid), updatedAt: 0 };
  }, []);

  return (
    <div className="lk" style={{ minHeight: "100vh" }}>
      {/* Bandeau démo */}
      <div style={{ position: "sticky", top: 0, zIndex: 60, background: "#17140C", color: "#FFFDF2", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", fontSize: 13.5 }}>
        <span>👋 Ceci est une <b>carte de démonstration</b> — tout est cliquable : menu, fidélité, chatbot…</span>
        <a href={WA} target="_blank" rel="noopener" style={{ background: "var(--accent, #FFD500)", color: "#171207", padding: "7px 14px", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 13 }}>Je veux la même</a>
        <Link href="/" style={{ color: "#FFD500", fontSize: 13 }}>← Retour au site</Link>
      </div>

      {/* La carte, plein écran mobile / centrée desktop */}
      <div style={{ display: "flex", justifyContent: "center", padding: "26px 0 40px" }}>
        <div style={{ width: "100%", maxWidth: 430, background: "#fff", borderRadius: 34, overflow: "hidden", boxShadow: "0 40px 90px -30px rgba(23,20,12,.35), 0 0 0 10px #FFFFFF, 0 0 0 11px #E4E0D2" }}>
          <CardRenderer card={card} actions={{
            onSaveContact: () => alert("En version réelle, le contact s'enregistre directement dans le téléphone (vCard)."),
            onChat: () => setChatOpen(true),
          }} />
          {chatOpen && (
            <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(10,10,14,.45)" }} onClick={() => setChatOpen(false)}>
              <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 430, background: "#fff", borderRadius: "22px 22px 0 0", padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 26 }}>✨</div>
                <b style={{ fontSize: 15 }}>Chatbot IA</b>
                <p style={{ fontSize: 13.5, color: "#5C574A", margin: "8px 0 14px" }}>Sur votre vraie carte, cet assistant répond 24/7 aux questions de vos clients à partir de VOS informations (horaires, tarifs, services…).</p>
                <a href={WA} target="_blank" rel="noopener" style={{ display: "block", background: "#FFD500", color: "#171207", padding: "13px", borderRadius: 13, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>📞 Appelez-nous pour l'activer</a>
                <button onClick={() => setChatOpen(false)} style={{ marginTop: 10, background: "none", border: "none", color: "#8A8474", cursor: "pointer", fontSize: 13 }}>Fermer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
