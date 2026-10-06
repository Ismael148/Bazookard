"use client";
// Bloc inscription/newsletter FONCTIONNEL : enregistre le lead (démo ou Supabase)
// et remercie le visiteur. Le commerçant retrouve ses contacts dans son espace.
import { useState } from "react";
import { saveLead } from "@/lib/tracking";

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");

export default function SubscribeBlock({ cardId, data }: { cardId: string; data: Dict }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [done, setDone] = useState(false);

  function submit() {
    if (!contact.trim()) return;
    saveLead(cardId, name.trim(), contact.trim());
    setDone(true);
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "18px 8px" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 28,
          background: "linear-gradient(135deg, var(--c-accent), var(--c-accent2))", color: "var(--c-accent-ink)",
          boxShadow: "0 10px 26px -8px color-mix(in srgb, var(--c-accent) 60%, transparent)" }}>✓</div>
        <div style={{ fontFamily: "var(--font-display), sans-serif", fontSize: 20, fontWeight: 800, marginTop: 4 }}>Merci !</div>
        <p style={{ fontSize: 14, color: "var(--c-soft)", lineHeight: 1.5, maxWidth: "26ch" }}>Votre inscription est bien enregistrée.</p>
      </div>
    );
  }

  return (
    <>
      {s(data.title) && <div className="kc-sec-title" style={{ textAlign: "center" }}>{s(data.title)}</div>}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom (optionnel)"
        style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid var(--c-line)", marginBottom: 8, background: "var(--c-bg)", color: "var(--c-ink)", fontSize: 14, outline: "none" }} />
      <input value={contact} onChange={(e) => setContact(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder={s(data.placeholder) || "Votre email ou téléphone"}
        style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid var(--c-line)", marginBottom: 8, background: "var(--c-bg)", color: "var(--c-ink)", fontSize: 14, outline: "none" }} />
      <button onClick={submit} className="kc-cta">{s(data.buttonLabel) || "Je m'inscris"}</button>
    </>
  );
}
