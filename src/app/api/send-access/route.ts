// Envoi des accès client par email via le SMTP d'Adamkom.
// Configuration par variables d'environnement (jamais exposées au navigateur) :
//   SMTP_HOST   ex. mail.adamkom.com
//   SMTP_PORT   465 (SSL) ou 587 (STARTTLS)  — défaut 465
//   SMTP_SECURE "true" / "false" — défaut : true si port 465, sinon false
//   SMTP_USER   identifiant du compte mail (souvent l'adresse complète)
//   SMTP_PASS   mot de passe du compte mail
//   SMTP_FROM   adresse d'expédition affichée — défaut : SMTP_USER
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { to, subject, text } = (await req.json()) as { to?: string; subject?: string; text?: string };
    if (!to || !subject || !text) {
      return NextResponse.json({ ok: false, error: "Champs manquants (destinataire, objet ou message)." }, { status: 400 });
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT || 465);
    const from = process.env.SMTP_FROM || user;
    if (!host || !user || !pass) {
      return NextResponse.json(
        { ok: false, error: "SMTP non configuré sur le serveur (définissez SMTP_HOST, SMTP_USER et SMTP_PASS)." },
        { status: 500 },
      );
    }

    const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

    await transporter.sendMail({
      from: `Bazookard — Adamkom <${from}>`,
      to,
      subject,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur lors de l'envoi de l'email.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
