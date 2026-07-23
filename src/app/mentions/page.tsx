import Link from "next/link";
import { LogoImg } from "@/components/Logo";

export const metadata = { title: "Mentions légales — Karte" };

export default function Mentions() {
  return (
    <main className="lk" style={{ minHeight: "100vh" }}>
      <div className="lk-wrap" style={{ maxWidth: 760, padding: "40px 24px 80px" }}>
        <Link href="/" style={{ textDecoration: "none" }}><LogoImg h={50} /></Link>
        <h1 style={{ fontSize: 30, fontWeight: 700, margin: "30px 0 18px" }}>Mentions légales</h1>
        <div style={{ color: "var(--ink2)", fontSize: 14.5, lineHeight: 1.75, display: "flex", flexDirection: "column", gap: 14 }}>
          <p><b>Éditeur du site :</b> Karte — Adamkom by JJP, La Réunion (974), France.<br />
          Contact : <a href="https://wa.me/262693802201" style={{ color: "var(--accent-deep)" }}>+262 693 80 22 01 (WhatsApp)</a></p>
          <p><b>Hébergement :</b> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
          <p><b>Données personnelles :</b> les informations collectées via les cartes Karte (formulaires de contact, programmes de fidélité) sont destinées exclusivement au commerçant titulaire de la carte concernée. Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données : contactez-nous via WhatsApp.</p>
          <p><b>Propriété intellectuelle :</b> l&apos;ensemble des éléments du site (marque Karte, logos, design, textes) est la propriété d&apos;Adamkom by JJP. Toute reproduction sans autorisation est interdite.</p>
        </div>
        <Link href="/" style={{ display: "inline-block", marginTop: 30, color: "var(--accent-deep)", fontWeight: 700, textDecoration: "none" }}>← Retour à l&apos;accueil</Link>
      </div>
    </main>
  );
}
