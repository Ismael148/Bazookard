"use client";
// Bloc Réservation : formulaire natif → lead enregistré + envoi WhatsApp optionnel.
import { useState } from "react";
import { saveLead } from "@/lib/tracking";

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");

export default function ReservationBlock({ cardId, data }: { cardId: string; data: Dict }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [people, setPeople] = useState("2");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const askPeople = data.askPeople !== false;
  const wa = s(data.whatsapp).replace(/[^0-9]/g, "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const parts = [
      date && `le ${new Date(date + "T00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`,
      time && `à ${time}`,
      askPeople && people && `${people} pers.`,
      msg.trim(),
    ].filter(Boolean).join(" · ");
    saveLead(cardId, `🗓️ ${name.trim()}`, `${phone.trim()}${parts ? " — " + parts : ""}`);
    if (wa) {
      const text = `Bonjour, je souhaite réserver :\n👤 ${name.trim()}\n📞 ${phone.trim()}${date ? `\n📅 ${date}` : ""}${time ? ` à ${time}` : ""}${askPeople ? `\n👥 ${people} personne(s)` : ""}${msg.trim() ? `\n💬 ${msg.trim()}` : ""}`;
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`, "_blank");
    }
    setDone(true);
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "18px 8px" }}>
        <div style={{ fontSize: 34 }}>✅</div>
        <div style={{ fontWeight: 700, marginTop: 6 }}>Demande envoyée !</div>
        <div style={{ color: "var(--c-soft)", fontSize: 13, marginTop: 4 }}>
          {wa ? "Votre demande part aussi sur WhatsApp pour une confirmation rapide." : "Nous revenons vers vous très vite pour confirmer."}
        </div>
      </div>
    );
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid var(--c-line)",
    background: "var(--c-bg)", color: "var(--c-ink)", fontSize: 14, outline: "none", fontFamily: "inherit",
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input style={inp} placeholder="Votre nom *" value={name} onChange={(e) => setName(e.target.value)} required />
        <input style={inp} placeholder="Téléphone *" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: askPeople ? "1fr 1fr 84px" : "1fr 1fr", gap: 10 }}>
        <input style={inp} type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
        <input style={inp} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        {askPeople && (
          <select style={inp} value={people} onChange={(e) => setPeople(e.target.value)} aria-label="Personnes">
            {["1","2","3","4","5","6","7","8","9","10+"].map((n) => <option key={n} value={n}>{n} 👥</option>)}
          </select>
        )}
      </div>
      <textarea style={{ ...inp, resize: "vertical", minHeight: 54 }} placeholder="Un message ? (allergies, occasion, préférence…)" value={msg} onChange={(e) => setMsg(e.target.value)} />
      <button type="submit" style={{
        padding: "13px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14.5,
        background: "linear-gradient(135deg, var(--c-accent), var(--c-accent2))", color: "var(--c-accent-ink)", fontFamily: "inherit",
      }}>
        {wa ? "Réserver via WhatsApp" : "Envoyer ma demande"}
      </button>
      {s(data.note) && <div style={{ color: "var(--c-soft)", fontSize: 12, textAlign: "center" }}>{s(data.note)}</div>}
    </form>
  );
}
