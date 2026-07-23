"use client";
// Bloc Formulaire de contact : nom, email, téléphone, message → lead enregistré.
import { useState } from "react";
import { saveLead } from "@/lib/tracking";

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");

export default function FormBlock({ cardId, data }: { cardId: string; data: Dict }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const askPhone = data.askPhone !== false;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || (!email.trim() && !phone.trim())) return;
    const contact = [email.trim(), phone.trim()].filter(Boolean).join(" · ");
    saveLead(cardId, `📝 ${name.trim()}`, `${contact}${msg.trim() ? " — " + msg.trim() : ""}`);
    setDone(true);
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "16px 8px" }}>
        <div style={{ fontSize: 32 }}>💌</div>
        <div style={{ fontWeight: 700, marginTop: 6 }}>Message envoyé !</div>
        <div style={{ color: "var(--c-soft)", fontSize: 13, marginTop: 4 }}>Nous revenons vers vous très vite.</div>
      </div>
    );
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid var(--c-line)",
    background: "var(--c-bg)", color: "var(--c-ink)", fontSize: 14, outline: "none", fontFamily: "inherit",
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input style={inp} placeholder="Votre nom *" value={name} onChange={(e) => setName(e.target.value)} required />
      <div style={{ display: "grid", gridTemplateColumns: askPhone ? "1fr 1fr" : "1fr", gap: 10 }}>
        <input style={inp} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {askPhone && <input style={inp} type="tel" placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />}
      </div>
      <textarea style={{ ...inp, resize: "vertical", minHeight: 74 }} placeholder="Votre message…" value={msg} onChange={(e) => setMsg(e.target.value)} required />
      <button type="submit" style={{
        padding: "13px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14.5,
        background: "linear-gradient(135deg, var(--c-accent), var(--c-accent2))", color: "var(--c-accent-ink)", fontFamily: "inherit",
      }}>
        Envoyer le message
      </button>
      {s(data.note) && <div style={{ color: "var(--c-soft)", fontSize: 12, textAlign: "center" }}>{s(data.note)}</div>}
    </form>
  );
}
