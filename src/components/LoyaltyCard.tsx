"use client";
// Carte de fidélité digitale à tampons — mode DÉMO (localStorage).
// Flux : le visiteur active sa carte (nom/téléphone) → à chaque visite, le
// commerçant saisit son PIN sur le téléphone du client → +1 tampon (max 1/jour).
// Carte pleine → coupon de récompense à usage unique, puis remise à zéro.
import { useEffect, useState } from "react";

interface LoyaltyState {
  user: string;
  stamps: number;
  last: string; // "YYYY-MM-DD" du dernier tampon
  coupons: { code: string; reward: string; used: boolean }[];
}

const today = () => new Date().toISOString().slice(0, 10);
const newCode = () => "K-" + Math.random().toString(36).slice(2, 7).toUpperCase();

export default function LoyaltyCard({ cardId, blockId, data }: {
  cardId: string; blockId: string; data: Record<string, unknown>;
}) {
  const s = (k: string) => (typeof data[k] === "string" ? (data[k] as string) : "");
  const total = Math.max(2, Math.min(12, parseInt(s("stamps")) || 8));
  const KEY = `karte_loyalty_${cardId}_${blockId}`;

  const [st, setSt] = useState<LoyaltyState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSt(JSON.parse(raw) as LoyaltyState);
    } catch {}
    setLoaded(true);
  }, [KEY]);

  function save(next: LoyaltyState) {
    setSt(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  function activate() {
    if (!name.trim()) return;
    save({ user: name.trim(), stamps: 0, last: "", coupons: [] });
  }

  function validatePin() {
    if (!st) return;
    if (pin !== (s("pin") || "1234")) {
      setMsg({ text: "Code incorrect. Demandez au commerçant.", ok: false });
      setPin("");
      return;
    }
    if (st.last === today()) {
      setMsg({ text: "Tampon déjà validé aujourd'hui. À bientôt !", ok: false });
      setPinMode(false); setPin("");
      return;
    }
    const stamps = st.stamps + 1;
    if (stamps >= total) {
      const coupon = { code: newCode(), reward: s("reward") || "Récompense", used: false };
      save({ ...st, stamps: 0, last: today(), coupons: [...st.coupons, coupon] });
      setMsg({ text: `Carte pleine ! Votre récompense est débloquée 🎉`, ok: true });
    } else {
      save({ ...st, stamps, last: today() });
      setMsg({ text: `Tampon validé ! ${stamps}/${total}`, ok: true });
    }
    setPinMode(false); setPin("");
  }

  function useCoupon(code: string) {
    if (!st) return;
    save({ ...st, coupons: st.coupons.map((c) => (c.code === code ? { ...c, used: true } : c)) });
  }

  const activeCoupons = st?.coupons.filter((c) => !c.used) ?? [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 17 }}>🎁</span>
        <div className="kc-sec-title" style={{ marginBottom: 0 }}>{s("title") || "Carte de fidélité"}</div>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--c-soft)", marginBottom: 12 }}>
        {s("reward") && <>Récompense : <b style={{ color: "var(--c-ink)" }}>{s("reward")}</b></>}
      </div>

      {!loaded ? null : !st ? (
        /* ----- Activation ----- */
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Prénom ou téléphone"
            style={{ flex: 1, minWidth: 0, padding: "12px 13px", borderRadius: 12, border: "1px solid var(--c-line)", background: "var(--c-bg)", color: "var(--c-ink)", fontSize: 14, outline: "none" }}
          />
          <button onClick={activate} className="kc-cta" style={{ width: "auto", padding: "12px 16px", flexShrink: 0, whiteSpace: "nowrap" }}>Activer</button>
        </div>
      ) : (
        /* ----- Carte active ----- */
        <>
          <div style={{ fontSize: 12, color: "var(--c-soft)", marginBottom: 10 }}>
            Membre : <b style={{ color: "var(--c-ink)" }}>{st.user}</b> · {st.stamps}/{total} tampons
          </div>

          {/* Grille de tampons */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(total, 6)}, 1fr)`, gap: 8, marginBottom: 12 }}>
            {Array.from({ length: total }).map((_, i) => {
              const filled = i < st.stamps;
              return (
                <div key={i} style={{
                  aspectRatio: "1", borderRadius: "50%", display: "grid", placeItems: "center",
                  fontSize: 15, fontWeight: 800,
                  border: filled ? "none" : "2px dashed var(--c-line)",
                  background: filled ? "linear-gradient(135deg, var(--c-accent), var(--c-accent2))" : "var(--c-bg)",
                  color: filled ? "var(--c-accent-ink)" : "var(--c-soft)",
                  transition: "transform .2s",
                }}>{filled ? "✓" : i + 1}</div>
              );
            })}
          </div>

          {/* Coupons débloqués */}
          {activeCoupons.map((c) => (
            <div key={c.code} style={{ border: "1.5px dashed var(--c-accent)", borderRadius: 14, padding: 13, marginBottom: 10, background: "var(--c-bg)", textAlign: "center" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>🎉 {c.reward}</div>
              <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, letterSpacing: ".12em", margin: "6px 0" }}>{c.code}</div>
              <div style={{ fontSize: 11.5, color: "var(--c-soft)", marginBottom: 8 }}>Montrez ce code au commerçant.</div>
              <button onClick={() => useCoupon(c.code)} style={{ border: "1px solid var(--c-line)", background: "var(--c-surface)", color: "var(--c-ink)", borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Marquer comme utilisé
              </button>
            </div>
          ))}

          {/* Validation PIN */}
          {pinMode ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Code commerçant"
                inputMode="numeric"
                autoFocus
                style={{ flex: 1, minWidth: 0, padding: "12px 13px", borderRadius: 12, border: "1px solid var(--c-line)", background: "var(--c-bg)", color: "var(--c-ink)", fontSize: 16, letterSpacing: ".2em", textAlign: "center", outline: "none" }}
              />
              <button onClick={validatePin} className="kc-cta" style={{ width: "auto", padding: "12px 16px" }}>OK</button>
              <button onClick={() => { setPinMode(false); setPin(""); }} style={{ border: "1px solid var(--c-line)", background: "transparent", color: "var(--c-soft)", borderRadius: 12, padding: "0 12px", cursor: "pointer" }}>✕</button>
            </div>
          ) : (
            <button onClick={() => { setMsg(null); setPinMode(true); }} className="kc-cta">Valider un tampon</button>
          )}

          {msg && (
            <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 600, textAlign: "center", color: msg.ok ? "#1E8A5C" : "#C43D3D" }}>
              {msg.text}
            </div>
          )}
        </>
      )}

      {s("note") && <div style={{ fontSize: 11, color: "var(--c-soft)", marginTop: 10, textAlign: "center" }}>{s("note")}</div>}
    </div>
  );
}
