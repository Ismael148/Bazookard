"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { Card } from "@/lib/types";
import { cardTheme, resolveTheme } from "@/lib/types";
import { getCardBySlug } from "@/lib/db";
import CardRenderer from "./CardRenderer";
import { trackEvent } from "@/lib/tracking";
import { LogoMark } from "@/components/Logo";

type Dict = Record<string, unknown>;

export default function PublicCard({ slug }: { slug: string }) {
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [qr, setQr] = useState<string>("");
  const [chatOpen, setChatOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    (async () => {
      const c = (await getCardBySlug(slug)) ?? null;
      setCard(c);
      if (c) trackEvent(c.id, "view");
    })();
  }, [slug]);

  useEffect(() => {
    if (!card) return;
    const ink = resolveTheme(card).ink;
    // niveau H : tolère le logo au centre sans casser la lecture du QR
    QRCode.toDataURL(window.location.href, { width: 320, margin: 1, errorCorrectionLevel: "H", color: { dark: ink, light: "#ffffff" } })
      .then(setQr).catch(() => {});
  }, [card]);

  if (card === undefined) return <Center>Chargement…</Center>;
  if (card === null) return <Center>Carte introuvable. <br />Crée-la depuis le tableau de bord.</Center>;

  const t = cardTheme(card.themeIndex);
  // Logo affiché au centre du QR : avatar dédié, sinon photo de profil
  const avatarData = card.blocks.find((b) => b.type === "avatar")?.data as Dict | undefined;
  const profileData = card.blocks.find((b) => b.type === "profile")?.data as Dict | undefined;
  const qrLogo = (typeof card.custom?.qrLogo === "string" ? card.custom.qrLogo : "")
    || (avatarData && typeof avatarData.image === "string" ? avatarData.image : "")
    || (profileData && typeof profileData.photo === "string" ? profileData.photo : "");
  const chatbot = card.blocks.find((b) => b.type === "chatbot")?.data as Dict | undefined;
  const cs = (k: string) => (chatbot && typeof chatbot[k] === "string" ? (chatbot[k] as string) : "");
  const greeting = cs("greeting");
  const botName = cs("botName") || "Assistant IA";
  const botAvatar = cs("avatar");
  const botEmoji = cs("emoji") || "✨";

  function saveContact() {
    if (!card) return;
    const profile = card.blocks.find((b) => b.type === "profile")?.data as Dict | undefined;
    const contact = card.blocks.find((b) => b.type === "contact")?.data as Dict | undefined;
    const g = (o: Dict | undefined, k: string) => (o && typeof o[k] === "string" ? (o[k] as string) : "");
    const name = g(profile, "name") || card.title;
    const phone = g(profile, "phone") || g(contact, "phone");
    const email = g(profile, "email") || g(contact, "email");
    const addr = g(profile, "address") || g(contact, "address");
    const v = ["BEGIN:VCARD", "VERSION:3.0", `N:${name}`, `FN:${name}`,
      g(profile, "company") && `ORG:${g(profile, "company")}`,
      g(profile, "title") && `TITLE:${g(profile, "title")}`,
      phone && `TEL;TYPE=CELL:${phone}`,
      email && `EMAIL:${email}`,
      addr && `ADR;TYPE=WORK:;;${addr.replace(/,/g, ";")};;;;`,
      (g(profile, "website") || g(contact, "website")) && `URL:${g(profile, "website") || g(contact, "website")}`,
      "END:VCARD"].filter(Boolean).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([v], { type: "text/vcard" }));
    a.download = (name || "contact").replace(/\s+/g, "_") + ".vcf";
    a.click();
  }

  function cardText(): string {
    if (!card) return "";
    const parts: string[] = [];
    for (const b of card.blocks) {
      const d = b.data as Dict;
      const walk = (v: unknown): void => {
        if (typeof v === "string" && v.trim() && !v.startsWith("http") && !v.startsWith("data:")) parts.push(v);
        else if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === "object") Object.values(v).forEach(walk);
      };
      parts.push(`[${b.type}]`);
      walk(d);
    }
    return parts.join(" · ").slice(0, 4000);
  }

  async function sendChat() {
    const content = draft.trim();
    if (!content || typing) return;
    const next = [...msgs, { role: "user" as const, content }];
    setMsgs(next); setDraft(""); setTyping(true);
    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: card?.id,
          siteUrl: chatbot && typeof chatbot.siteUrl === "string" ? chatbot.siteUrl : "",
          cardText: cardText(),
          knowledge: chatbot && typeof chatbot.knowledge === "string" ? chatbot.knowledge : "",
          messages: next,
        }),
      });
      const out = await r.json();
      setMsgs([...next, { role: "assistant", content: r.ok ? out.reply : (out.error || "Petit souci technique — réessayez ou contactez-nous directement !") }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "Je n'arrive pas à répondre pour le moment. Contactez-nous via les boutons de la carte !" }]);
    } finally { setTyping(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: t.dark ? "#07090C" : "#111013", padding: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", background: t.bg, position: "relative", overflow: "hidden" }}>
        <div onClickCapture={(e) => {
          const el = e.target as HTMLElement;
          if (el.closest?.("[data-kc-vcard]")) { e.preventDefault(); saveContact(); if (card) trackEvent(card.id, "tap"); return; }
          const a = el.closest?.("a[href]");
          if (a && card) trackEvent(card.id, "tap");
        }}>
          <CardRenderer card={card} actions={{ onSaveContact: saveContact, onChat: () => { setChatOpen(true); if (card) trackEvent(card.id, "chat"); } }} />
        </div>

        {/* QR + signature */}
        <div style={{ padding: "0 14px 26px", background: t.bg }}>
          {qr && !card.custom?.hideQr && (() => {
            const qs = typeof card.custom?.qrSize === "number" ? Math.min(260, Math.max(120, card.custom.qrSize)) : 172;
            const logo = Math.round(qs * 0.26);
            const qrAccent = (card.custom?.qrColor && /^#([0-9a-f]{3,8})$/i.test(card.custom.qrColor)) ? card.custom.qrColor : t.accent;
            return (
            <div style={{
              textAlign: "center", background: t.surface, border: `2px solid ${qrAccent}`, borderRadius: 22, padding: 20,
              boxShadow: `0 16px 40px -14px ${qrAccent}`,
              marginTop: typeof card.custom?.qrMt === "number" ? card.custom.qrMt : 0,
              marginBottom: typeof card.custom?.qrMb === "number" ? card.custom.qrMb : 0,
              maxWidth: qs + 56, marginLeft: "auto", marginRight: "auto",
            }}>
              <div style={{ position: "relative", width: qs, height: qs, margin: "0 auto" }}>
                <img src={qr} alt="QR" width={qs} height={qs} style={{ width: qs, height: qs, borderRadius: 14, display: "block" }} />
                {/* Logo au centre du QR */}
                <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: logo, height: logo, borderRadius: logo * 0.28, background: "#fff", display: "grid", placeItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,.28)", overflow: "hidden", padding: Math.round(logo * 0.13), boxSizing: "border-box" }}>
                  {qrLogo
                    ? <span style={{ width: "100%", height: "100%", backgroundImage: `url('${qrLogo}')`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }} />
                    : <LogoMark size={Math.round(logo * 0.64)} ink="#17140C" accent={t.accent} />}
                </span>
              </div>
              <div style={{ color: t.soft, fontSize: 11.5, marginTop: 10, fontWeight: 600 }}>Scannez pour partager cette carte</div>
            </div>
            );
          })()}
          {!card.custom?.hideCredit && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: t.soft, fontSize: 12, marginTop: 16 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {t.dark && <LogoMark size={18} ink={t.ink} />} Propulsé par{" "}
                <a href="https://adamkom.com" target="_blank" rel="noopener" style={{ color: t.ink, fontWeight: 700, textDecoration: "none" }}>
                  {card.custom?.credit || "Adamkom by JJP"}
                </a>
              </span>
            </div>
          )}
        </div>

        {/* Panneau chatbot (v1 : accueil — le RAG arrive en Phase IA) */}
        {chatOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(10,10,14,.45)", backdropFilter: "blur(3px)" }} onClick={() => setChatOpen(false)}>
            <div style={{ width: "100%", maxWidth: 430, background: t.surface, color: t.ink, borderRadius: "22px 22px 0 0", padding: 20, boxShadow: "0 -18px 60px rgba(0,0,0,.4)", animation: "kcUp .3s cubic-bezier(.16,1,.3,1) both" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                {botAvatar ? (
                  <span style={{ width: 38, height: 38, borderRadius: "50%", backgroundImage: `url('${botAvatar}')`, backgroundSize: "cover", backgroundPosition: "center", border: `2px solid ${t.accent}`, flexShrink: 0 }} />
                ) : (
                  <span style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`, color: t.accentInk, fontSize: 17, flexShrink: 0 }}>{botEmoji}</span>
                )}
                <div>
                  <b style={{ fontSize: 14.5 }}>{botName}</b>
                  <div style={{ fontSize: 11.5, color: t.soft }}>Répond aux questions sur cette carte</div>
                </div>
                <button onClick={() => setChatOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: t.soft }}>✕</button>
              </div>
              <div style={{ maxHeight: "44vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ background: t.bg, borderRadius: "14px 14px 14px 4px", padding: "11px 13px", fontSize: 13.5, lineHeight: 1.5, alignSelf: "flex-start", maxWidth: "85%" }}>
                  {greeting || "Bonjour 👋 Une question ? Je suis l'assistant de cette carte."}
                </div>
                {msgs.map((m, i) => (
                  <div key={i} style={{
                    padding: "11px 13px", fontSize: 13.5, lineHeight: 1.5, maxWidth: "85%",
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    background: m.role === "user" ? `linear-gradient(135deg, ${t.accent}, ${t.accent2})` : t.bg,
                    color: m.role === "user" ? t.accentInk : t.ink,
                    borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  }}>{m.content}</div>
                ))}
                {typing && (
                  <div style={{ background: t.bg, borderRadius: "14px 14px 14px 4px", padding: "11px 14px", fontSize: 13.5, alignSelf: "flex-start", color: t.soft }}>
                    En train d'écrire…
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input value={draft} onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                  placeholder="Écrire un message…" style={{ flex: 1, padding: "12px 13px", borderRadius: 12, border: `1px solid ${t.line}`, background: t.bg, color: t.ink, fontSize: 14, outline: "none" }} />
                <button onClick={sendChat} disabled={typing} style={{ width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`, color: t.accentInk, fontSize: 16 }}>➤</button>
              </div>
              <div style={{ fontSize: 10.5, color: t.soft, textAlign: "center", marginTop: 10 }}>Assistant IA — répond à partir des informations de cette carte.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--muted)", textAlign: "center", padding: 20 }}>
      <div>{children}</div>
    </div>
  );
}
