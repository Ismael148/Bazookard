"use client";
// Modèle d'email d'accès client — éditable depuis Admin > Paramètres.
// Stocké en local (admin). Variables : {company} {email} {password} {loginUrl}

export interface EmailTemplate {
  subject: string;
  body: string;
  autoSend: boolean;   // envoi automatique à la création d'un client
}

const EK = "bzk_email_template_v1";

export const DEFAULT_TEMPLATE: EmailTemplate = {
  subject: "Vos accès Bazookard — {company}",
  body:
`Bonjour,

Votre espace Bazookard est prêt ! Vous pouvez gérer vos cartes de visite NFC à tout moment :

🔗 Connexion : {loginUrl}
📧 Email : {email}
🔑 Mot de passe : {password}

Dans votre espace, vous pouvez modifier vos cartes, en créer de nouvelles, suivre vos statistiques et retrouver vos contacts.

À très vite,
L'équipe Bazookard — by Adamkom & JJP`,
  autoSend: true,
};

export function getEmailTemplate(): EmailTemplate {
  if (typeof window === "undefined") return DEFAULT_TEMPLATE;
  try {
    const raw = localStorage.getItem(EK);
    if (!raw) return DEFAULT_TEMPLATE;
    return { ...DEFAULT_TEMPLATE, ...(JSON.parse(raw) as Partial<EmailTemplate>) };
  } catch { return DEFAULT_TEMPLATE; }
}

export function saveEmailTemplate(t: EmailTemplate): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EK, JSON.stringify(t));
}

export interface MailVars { company: string; email: string; password: string; loginUrl: string; }

export function fillTemplate(text: string, v: MailVars): string {
  return text
    .replace(/\{company\}/g, v.company)
    .replace(/\{email\}/g, v.email)
    .replace(/\{password\}/g, v.password)
    .replace(/\{loginUrl\}/g, v.loginUrl);
}

/** Version HTML simple et lisible à partir du corps texte. */
export function toHtml(body: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = esc(body).split(/\n/).map((l) => l.trim() === "" ? "<div style=\"height:10px\"></div>" : `<div>${l}</div>`).join("");
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1b1b1f;max-width:560px;margin:0 auto;padding:8px 4px">${lines}</div>`;
}
