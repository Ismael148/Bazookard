"use client";
// Admin > Paramètres — modèle d'email d'accès (voir / éditer / tester).
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import AdminHeader from "@/components/AdminHeader";
import { getEmailTemplate, saveEmailTemplate, fillTemplate, toHtml, DEFAULT_TEMPLATE, type EmailTemplate } from "@/lib/emailTemplate";

const SAMPLE = { company: "Le Bistrot Doré", email: "contact@bistrot.fr", password: "ab12-cd34", loginUrl: "https://bazookard.adamkom.com/client/login" };

export default function SettingsPage() {
  const [tpl, setTpl] = useState<EmailTemplate>(DEFAULT_TEMPLATE);
  const [toast, setToast] = useState("");
  const [testTo, setTestTo] = useState("");
  const [testState, setTestState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [testErr, setTestErr] = useState("");

  useEffect(() => { setTpl(getEmailTemplate()); }, []);
  function notify(m: string) { setToast(m); setTimeout(() => setToast(""), 2400); }

  function save() { saveEmailTemplate(tpl); notify("Modèle enregistré ✓"); }
  function reset() { setTpl(DEFAULT_TEMPLATE); saveEmailTemplate(DEFAULT_TEMPLATE); notify("Modèle réinitialisé"); }

  async function sendTest() {
    if (!testTo) return;
    setTestState("sending"); setTestErr("");
    const subject = fillTemplate(tpl.subject, SAMPLE);
    const text = fillTemplate(tpl.body, SAMPLE);
    try {
      const res = await fetch("/api/send-access", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo, subject, text, html: toHtml(text) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setTestState("ok"); notify("Email de test envoyé ✓");
      setTimeout(() => setTestState("idle"), 1500);
    } catch (e) {
      setTestState("error"); setTestErr(e instanceof Error ? e.message : "Échec");
    }
  }

  const previewSubject = fillTemplate(tpl.subject, SAMPLE);
  const previewBody = fillTemplate(tpl.body, SAMPLE);

  return (
    <div>
      <AdminHeader title="Paramètres" subtitle="Modèle de l'email d'accès envoyé à vos clients">
        <button className="a-btn a-btn-sm" onClick={reset}><Icon name="settings" size={15} /> Réinitialiser</button>
        <button className="a-btn a-btn-primary" onClick={save}><Icon name="check" size={16} /> Enregistrer</button>
      </AdminHeader>

      <div style={{ padding: 28, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,440px)", gap: 20, alignItems: "start" }}>
        {/* Éditeur */}
        <div className="a-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>✉️ Email d&apos;accès client</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
            Ce message est envoyé au client avec ses identifiants. Variables disponibles :
            <code style={pill}>{"{company}"}</code><code style={pill}>{"{email}"}</code>
            <code style={pill}>{"{password}"}</code><code style={pill}>{"{loginUrl}"}</code>
          </p>

          <label className="a-label">Objet de l&apos;email</label>
          <input className="a-input" value={tpl.subject} onChange={(e) => setTpl({ ...tpl, subject: e.target.value })} />

          <label className="a-label" style={{ marginTop: 14 }}>Message</label>
          <textarea className="a-input" rows={14} value={tpl.body} onChange={(e) => setTpl({ ...tpl, body: e.target.value })}
            style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.55, minHeight: 260 }} />

          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, cursor: "pointer" }}>
            <button type="button" className={`a-switch ${tpl.autoSend ? "on" : ""}`} onClick={() => setTpl({ ...tpl, autoSend: !tpl.autoSend })} aria-label="Envoi automatique" />
            <span style={{ fontSize: 14, color: "var(--ink2)", fontWeight: 600 }}>Envoyer automatiquement les accès à la création d&apos;un client</span>
          </label>

          <div style={{ borderTop: "1px solid var(--line)", marginTop: 20, paddingTop: 18 }}>
            <label className="a-label">Envoyer un email de test</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="a-input" type="email" placeholder="votre@email.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
              <button className="a-btn a-btn-primary" style={{ whiteSpace: "nowrap", minWidth: 120, justifyContent: "center" }} disabled={testState === "sending" || !testTo} onClick={sendTest}>
                {testState === "sending" ? "Envoi…" : testState === "ok" ? "✓ Envoyé" : "Tester"}
              </button>
            </div>
            {testState === "error" && <div style={{ background: "#FDECEC", color: "#B3261E", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, marginTop: 10 }}>⚠ {testErr}. Vérifiez la configuration SMTP sur le serveur.</div>}
          </div>
        </div>

        {/* Aperçu */}
        <div className="a-card" style={{ padding: 0, overflow: "hidden", position: "sticky", top: 20 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", background: "var(--accent-soft, #F7F5FF)", fontSize: 12.5, fontWeight: 700, color: "var(--ink2)", letterSpacing: ".04em", textTransform: "uppercase" }}>
            Aperçu
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Objet</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>{previewSubject}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 6 }}>Corps du message</div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6, color: "var(--ink)", background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}>
              {previewBody}
            </div>
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 12 }}>Exemple avec un client fictif. Les vraies valeurs sont injectées à l&apos;envoi.</p>
          </div>
        </div>
      </div>

      {toast && <div className="a-toast"><Icon name="check" size={16} /> {toast}</div>}
    </div>
  );
}

const pill: React.CSSProperties = {
  display: "inline-block", background: "#F0EEF9", color: "#5B4BE0", borderRadius: 6,
  padding: "1px 7px", margin: "0 3px", fontSize: 12, fontFamily: "monospace", fontWeight: 600,
};
