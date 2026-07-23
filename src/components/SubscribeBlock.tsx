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
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ fontSize: 30 }}>🎉</div>
        <div className="kc-sec-title" style={{ marginTop: 6, marginBottom: 2 }}>Merci !</div>
        <p style={{ fontSize: 13, color: "var(--c-soft)" }}>Votre inscription est bien enregistrée.</p>
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
