"use client";
// Page de vente Karte V7 — éditorial épuré (blanc / jaune / noir).
// Référence : landing "Enblox" — gros titres, touches serif italiques,
// téléphone sur dégradé flou, sections informatives complètes.
import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { LogoImg } from "@/components/Logo";
import CardRenderer from "@/components/CardRenderer";
import { TEMPLATES, templateBlocks, type CardTemplate } from "@/lib/templates";
import { uid } from "@/lib/store";
import type { Card } from "@/lib/types";

const WA = "https://wa.me/262693802201?text=" + encodeURIComponent("Je suis intéressé par votre produit, puis-je avoir un appel ou des informations ?");

const STEPS = [
  { n: "01", t: "On crée votre carte", d: "Vous nous donnez votre univers : menu, services, photos, horaires. On construit une mini-app à votre image, validée avec vous." },
  { n: "02", t: "Vous la partagez", d: "Un tap sur le sticker NFC ou un scan du QR code : votre carte s'ouvre instantanément. Aucune application à installer." },
  { n: "03", t: "Vos clients agissent", d: "Ils réservent, appellent, consultent le menu, activent leur carte de fidélité, laissent leur contact — tout depuis la carte." },
  { n: "04", t: "Vous mesurez tout", d: "Vues, clics, réservations, contacts reçus : vos rapports détaillés vous montrent ce qui fonctionne, jour par jour." },
];

const FEATS = [
  { i: "🍽️", t: "Menu & carte", d: "Menu photo premium avec détails, ingrédients et prix — modifiable en 2 minutes." },
  { i: "🗓️", t: "Réservations", d: "Formulaire natif : date, heure, couverts. Reçu en lead + sur votre WhatsApp." },
  { i: "🎁", t: "Fidélité à tampons", d: "Carte digitale sans app : tampon validé par votre code, récompense automatique." },
  { i: "⭐", t: "Avis Google", d: "Collectez des avis 5 étoiles en un tap et affichez vos meilleurs retours." },
  { i: "✨", t: "Chatbot IA 24/7", d: "Un assistant qui connaît votre activité et répond à vos clients à toute heure." },
  { i: "📊", t: "Statistiques & rapports", d: "Courbes de visites, taux d'engagement, top contenus — en temps réel." },
  { i: "📥", t: "Capture de contacts", d: "Formulaires, newsletter, réservations : chaque contact est enregistré pour vous." },
  { i: "🏷️", t: "Offres & coupons", d: "Promos à durée limitée avec code à copier — parfait pour faire revenir." },
  { i: "📅", t: "Événements", d: "Vos soirées et animations avec compte à rebours et itinéraire en un tap." },
  { i: "📶", t: "Wi-Fi invités", d: "Vos clients se connectent au Wi-Fi en un tap, sans demander le mot de passe." },
  { i: "🏡", t: "Équipements & alentours", d: "Pour gîtes et locations : équipements, bonnes adresses, distances." },
  { i: "🎬", t: "Vidéos & galeries", d: "YouTube, réels verticaux, carrousels photo — aux formats que vous choisissez." },
];

const ALL_FEATS = [
  "Profil & bio", "Bannière", "Avatar réglable", "Titres & textes", "Boutons d'action", "Réseaux sociaux",
  "Contact en 1 tap", "Ajout aux contacts (vCard)", "QR code intégré", "Galerie photo", "Carrousel", "Image & média",
  "Vidéo 16:9 · 9:16 · carré", "Podcast", "Listes & accordéons", "Page web intégrée", "Produits & boutique", "Paiement",
  "Newsletter", "Prise de RDV (Calendly…)", "Réservation native", "Formulaire de contact", "Avis & notes", "Témoignages",
  "Chatbot IA + base de connaissances", "Menu photo premium", "Offres & coupons", "Avis Google", "Horaires + statut ouvert/fermé",
  "Wi-Fi invités", "Événements + compte à rebours", "Carte de fidélité à tampons", "Équipements (gîtes & villas)", "À proximité / alentours",
  "Statistiques & rapports", "Capture de contacts", "Recadrage d'images intégré", "Animations par bloc", "7 polices · couleurs libres",
];

const CUSTOM = ["Vos couleurs exactes", "7 polices", "Formats d'image 16:9 · 9:16 · carré · portrait", "Recadrage intégré", "Ombres & arrondis réglables", "Animation par bloc", "Avatar repositionnable", "Logo & bannière"];

const COMP: [string, string][] = [
  ["Éditeur par blocs, illimité", "Souvent limité"],
  ["Chatbot IA sur la carte", "—"],
  ["Carte de fidélité à tampons", "—"],
  ["Réservations intégrées", "—"],
  ["Menu, horaires, offres, avis", "Partiel"],
  ["Comptes clients + permissions", "Partiel"],
  ["Statistiques & rapports graphiques", "Basique"],
  ["Gestion Google Business + posts réseaux", "—"],
  ["Support local à La Réunion", "—"],
];

const MODULES = [
  "30 blocs métier (menu, horaires, wifi, offres, avis, événements…)",
  "Carte de fidélité à tampons + coupons",
  "Réservations + formulaires de contact",
  "Chatbot IA qui répond à vos clients 24/7",
  "8 templates premium + personnalisation avancée totale",
  "QR code + vCard (ajout aux contacts en 1 tap)",
  "Statistiques : visites, clics, contacts, rapports graphiques",
  "Mises à jour illimitées de votre carte",
  "Hébergement rapide + lien personnalisé",
];

const PRICES = [
  { plan: "1 carte", amt: "27", per: "/mois", feat: false,
    feats: ["1 carte NFC / mini-app", "Tous les blocs + templates", "QR + vCard + statistiques", "Support par WhatsApp"] },
  { plan: "10 cartes", amt: "56", per: "/mois", feat: true,
    feats: ["10 cartes NFC / mini-apps", "Support client illimité", "Gestion de votre fiche Google (GMB)", "2 posts ultra-modernes / mois (Facebook + Instagram)", "1 vidéo ultra-premium offerte chaque mois", "Un influenceur dédié à votre marque", "Inscription à l'annuaire n°1 de La Réunion (450+ entreprises)"] },
  { plan: "+10 cartes", amt: "127", per: "/mois · à partir de", feat: false,
    feats: ["Cartes illimitées sur devis", "Comptes clients + permissions", "Marque blanche", "Accompagnement dédié"] },
];

const FAQ = [
  { q: "Comment fonctionne le tag NFC ?", a: "Un tag NFC contient simplement l'adresse de votre carte Karte. Vos clients approchent leur téléphone, la carte s'ouvre instantanément — aucune application à installer, compatible iPhone et Android." },
  { q: "Qu'est-ce que ça change concrètement pour mon activité ?", a: "Vos clients trouvent tout au même endroit (menu, horaires, réservation, avis) et vous récupérez leurs contacts à chaque interaction. Résultat : plus de réservations, plus d'avis Google, plus de clients qui reviennent — et zéro réimpression." },
  { q: "L'abonnement, ça couvre quoi ?", a: "Tout : hébergement, mises à jour illimitées, chatbot IA, statistiques et support WhatsApp. Le plan 10 cartes ajoute la gestion de votre fiche Google, 2 posts par mois et l'annuaire n°1 de La Réunion." },
  { q: "Comment fonctionne la carte de fidélité sans application ?", a: "Le client active sa carte directement sur votre page NFC. À chaque visite, vous validez le tampon avec votre code commerçant. Carte pleine = récompense automatique. Ses tampons sont conservés sur son téléphone." },
  { q: "Est-ce que je peux modifier ma carte moi-même ?", a: "Oui. Vous recevez votre propre espace client avec un éditeur simple : textes, photos, couleurs, blocs. Vous modifiez quand vous voulez, c'est en ligne immédiatement. Et si vous préférez, on s'en occupe pour vous." },
  { q: "Je récupère vraiment les contacts de mes clients ?", a: "Oui : chaque réservation, formulaire ou inscription newsletter est enregistré dans votre espace, avec nom et coordonnées. Vous pouvez les recontacter quand vous voulez — c'est votre fichier client." },
  { q: "En combien de temps ma carte est-elle prête ?", a: "En général sous 48 à 72 h après réception de vos contenus (photos, menu, horaires). Le sticker NFC est remis en main propre ou expédié à La Réunion." },
];

/** Drapeau de La Réunion (Lö Mahavéli) — les emojis drapeaux ne s'affichent pas sous Windows. */
function Flag974({ h = 22 }: { h?: number }) {
  return (
    <svg width={h * 1.5} height={h} viewBox="0 0 60 40" style={{ borderRadius: 4, display: "inline-block", verticalAlign: "-3px", boxShadow: "0 1px 4px rgba(0,0,0,.25)" }} aria-label="La Réunion">
      <rect width="60" height="40" fill="#E4032E" />
      {[-50, -30, -12, 0, 12, 30, 50].map((a) => (
        <polygon key={a} points="30,20 26,0 34,0" fill="#FFD500" transform={`rotate(${a} 30 21)`} />
      ))}
      <polygon points="30,10 58,40 2,40" fill="#0B4EA2" />
    </svg>
  );
}

function tplCard(t: CardTemplate): Card {
  return { id: "lp-" + t.id, slug: "demo", title: t.name, themeIndex: t.themeIndex, blocks: templateBlocks(t, uid), updatedAt: 0 };
}

export default function Home() {
  const hero = useMemo(() => tplCard(TEMPLATES[1]), []);
  const picks = useMemo(() => TEMPLATES.map((t) => ({ t, c: tplCard(t) })), []);
  const picksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("in", e.isIntersecting)),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".lk-reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const scrollPicks = (dir: number) => picksRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <main className="lk lk7">

      {/* ===== HEADER ===== */}
      <header className="lk7-head" id="top">
        <div className="inner">
          <Link href="/" style={{ textDecoration: "none" }}><LogoImg h={46} /></Link>
          <nav className="lk7-nav">
            <a href="#avantages">Avantages</a>
            <a href="#comment">Comment ça marche</a>
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#templates">Templates</a>
            <a href="#pricing">Tarifs</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a href={WA} target="_blank" rel="noopener" className="lk7-pill">Commencer <span className="arr">→</span></a>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="lk7-hero">
        <div className="lk7-kicker">Votre business, dans la poche de vos clients.</div>
        <h1 className="lk7-h1">
          <span className="ln">Une seule carte.</span>
          <span className="ln">Tout votre <span className="hl lk7-it">univers.</span></span>
        </h1>
        <p className="lk7-sub">
          Menu, réservations, fidélité, avis, chatbot IA : la carte NFC Karte transforme
          chaque rencontre en client — sans application, sans réimpression.
        </p>
        <div className="lk7-heroctas">
          <a href={WA} target="_blank" rel="noopener" className="lk7-pill solid">Créer ma carte <span className="arr">→</span></a>
          <Link href="/demo" className="lk7-pill">Voir une démo</Link>
        </div>

        <div className="lk7-stage">
          <div className="lk7-glow" />
          <span className="lk7-fb dark" style={{ left: "16%", top: "12%" }}>🎁 <span>Tampon validé <b>+1</b></span></span>
          <span className="lk7-fb yellow" style={{ right: "15%", top: "26%", animationDelay: "-2.2s" }}>🗓️ Nouvelle réservation</span>
          <span className="lk7-fb" style={{ left: "13%", bottom: "24%", animationDelay: "-4s" }}>⭐ Avis 5 étoiles reçu</span>
          <span className="lk7-fb dark" style={{ right: "17%", bottom: "13%", animationDelay: "-1.4s" }}>💬 <span>Le chatbot a répondu</span></span>
          <div className="lk-phone6">
            <div className="scr"><CardRenderer card={hero} /></div>
          </div>
        </div>
      </section>

      {/* ===== BANDE DÉFILANTE ===== */}
      <div className="lk7-marquee" aria-hidden>
        <div className="track">
          {[0, 1].map((k) => (
            <span key={k}>
              {["Tap", "Connect", "Grow", "Menu", "Réservations", "Fidélité", "Avis Google", "Chatbot IA", "Statistiques", "Zéro application"].map((w) => (
                <span key={w}>{w} <span className="dotsep">✦</span></span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ===== AVANTAGES ===== */}
      <section className="lk7-sec" id="avantages">
        <div className="lk7-split">
          <h2 className="lk7-h2 lk-reveal rl">Plus de clients. Moins d&apos;efforts. <span className="hl lk7-it">C&apos;est tout l&apos;idée.</span></h2>
          <p className="lk-reveal rr d1">Karte n&apos;est pas une carte de visite. C&apos;est votre brochure, votre menu, votre carte de fidélité et votre standard téléphonique — réunis dans un seul lien, toujours à jour.</p>
        </div>
        <div className="lk7-bene">
          <div className="lk7-bcard lk-reveal rz">
            <span className="mini y">Menu mis à jour ✓</span>
            <div className="ill"><span className="em">🖨️</span><span className="no">✕</span></div>
            <h3>Toujours à jour, <span className="hl">jamais réimprimée</span></h3>
            <p>Changement de menu, d&apos;horaires, nouvelle offre ? Vous modifiez, c&apos;est en ligne immédiatement. Fini les flyers obsolètes et les réimpressions.</p>
          </div>
          <div className="lk7-bcard lk-reveal rz d1">
            <span className="mini dark">📥 +1 contact</span>
            <div className="ill"><span className="em">🤝</span></div>
            <h3>Chaque visiteur devient <span className="hl">un contact</span></h3>
            <p>Réservations, formulaires, newsletter, fidélité : la carte capture les coordonnées de vos clients et les range dans votre espace. Votre fichier client grandit tout seul.</p>
          </div>
          <div className="lk7-bcard lk-reveal rz d2">
            <span className="mini y">↗ +32% cette semaine</span>
            <div className="ill">
              <span className="em">📊</span>
              <span className="bars"><i style={{ height: 10 }} /><i style={{ height: 17 }} /><i style={{ height: 13 }} /><i style={{ height: 24 }} /></span>
            </div>
            <h3>Vous savez <span className="hl">ce qui fonctionne</span></h3>
            <p>Combien de visites cette semaine ? Quel bloc est le plus cliqué ? Vos rapports vous le montrent jour par jour, pour décider avec des chiffres.</p>
          </div>
        </div>
      </section>

      {/* ===== COMMENT ÇA MARCHE ===== */}
      <section className="lk7-sec" id="comment">
        <div className="lk7-split lk-reveal">
          <h2 className="lk7-h2">Comment <span className="lk7-it">ça marche ?</span></h2>
          <p>De la prise de contact à vos premiers rapports : quatre étapes, zéro complexité de votre côté.</p>
        </div>
        <div className="lk7-steps">
          {STEPS.map((s, i) => (
            <div key={s.n} className={`lk7-step lk-reveal rz sd${i}`} data-n={s.n}>
              <div className="num">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>

        {/* Bande noire */}
        <div className="lk7-band lk-reveal">
          <div>
            <h2>Votre carte travaille pour vous. <span className="y">24h/24, même quand c&apos;est fermé.</span></h2>
            <p>Elle présente votre activité, répond aux questions, prend les réservations et enregistre chaque contact. Vous, vous restez concentré sur votre métier.</p>
            <a href={WA} target="_blank" rel="noopener" className="lk7-pill solid" style={{ marginTop: 22 }}>Appelez-nous <span className="arr">→</span></a>
          </div>
          <div className="lk7-bandstats">
            <div className="lk7-bstat"><b>30+</b><span>blocs métier disponibles</span></div>
            <div className="lk7-bstat"><b>24/7</b><span>chatbot IA au service de vos clients</span></div>
            <div className="lk7-bstat"><b>1 tap</b><span>pour ouvrir votre univers, sans app</span></div>
            <div className="lk7-bstat"><b><Flag974 h={26} /> 974</b><span>conçu et accompagné à La Réunion</span></div>
          </div>
        </div>
      </section>

      {/* ===== FONCTIONNALITÉS ===== */}
      <section className="lk7-sec" id="fonctionnalites">
        <div className="lk7-split lk-reveal">
          <h2 className="lk7-h2">Toutes les fonctionnalités. <span className="hl lk7-it">Vraiment toutes.</span></h2>
          <p>Chaque bloc s&apos;ajoute, se déplace et se personnalise librement. Voici les plus demandés — il y en a plus de 30.</p>
        </div>
        <div className="lk7-feats">
          {FEATS.map((f, i) => (
            <div key={f.t} className={`lk7-feat lk-reveal rz d${i % 4}`}>
              <div className="fi">{f.i}</div>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
        {/* Le mur complet : tout ce que la carte sait faire */}
        <div className="lk7-wall lk-reveal" aria-label="Toutes les fonctionnalités">
          {[0, 1].map((r) => (
            <div key={r} className={`row${r === 1 ? " rev" : ""}`}>
              {[0, 1].map((k) => (
                <span key={k} style={{ display: "flex", gap: 12 }}>
                  {(r === 0 ? ALL_FEATS.slice(0, Math.ceil(ALL_FEATS.length / 2)) : ALL_FEATS.slice(Math.ceil(ALL_FEATS.length / 2))).map((f) => (
                    <span key={f} className="chip">✦ {f}</span>
                  ))}
                </span>
              ))}
            </div>
          ))}
        </div>

        <div className="lk7-callout lk-reveal">
          <span className="sticker">100% à votre image</span>
          <h3><span className="lk7-it" style={{ color: "#FFD500" }}>Personnalisation avancée.</span> Aucune carte ne ressemble à la vôtre.</h3>
          <div className="lk7-chips">
            {CUSTOM.map((c, i) => <span key={c} className="lk7-chip" style={{ animationDelay: `${i * 0.07}s` }}>{c}</span>)}
          </div>
          <p>
            Chaque image s&apos;affiche dans le format exact que vous choisissez, sans jamais être coupée.
            Chaque bloc peut avoir sa propre animation. Le résultat : une carte unique — la vôtre.
          </p>
        </div>
      </section>

      {/* ===== FIDÉLITÉ ===== */}
      <section className="lk7-sec" id="fidelite">
        <div className="lk7-hl">
          <div className="vis lk-reveal rl">
            <div className="lk7-stampcard">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b style={{ fontSize: 16 }}>🎁 Carte de fidélité</b>
                <span className="count" style={{ display: "inline-block", fontSize: 11.5, fontWeight: 800, background: "#FFD500", padding: "5px 11px", borderRadius: 999 }}>5 / 8</span>
              </div>
              <div className="lk7-stamps">
                {[1, 1, 1, 1, 1, 0, 0, 0].map((on, i) => (
                  <span key={i} className={`lk7-stamp${on ? " on" : ""}`}>{on ? "✓" : i + 1}</span>
                ))}
              </div>
              <div style={{ marginTop: 16, fontSize: 12.5, color: "#8A8474", textAlign: "center" }}>Plus que 3 visites avant votre récompense 🎉</div>
            </div>
          </div>
          <div className="txt lk-reveal rr d1">
            <h3>La fidélité qui fait <span className="hl lk7-it">revenir</span> — sans application.</h3>
            <p>La carte à tampons digitale vit directement sur votre carte NFC. Vos clients l&apos;activent en un tap, vous validez avec votre code, la récompense tombe automatiquement.</p>
            <div className="lk7-list">
              <div className="lk7-li"><span className="tick">✓</span><span><b>Activation en 1 tap</b> — le client entre son prénom, c&apos;est parti.</span></div>
              <div className="lk7-li"><span className="tick">✓</span><span><b>Validation sécurisée</b> — le tampon n&apos;est ajouté qu&apos;avec votre code commerçant.</span></div>
              <div className="lk7-li"><span className="tick">✓</span><span><b>Récompense automatique</b> — carte pleine, cadeau débloqué, client ravi.</span></div>
              <div className="lk7-li"><span className="tick">✓</span><span><b>Contacts récupérés</b> — chaque carte activée enrichit votre fichier client.</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PERFORMANCE ===== */}
      <section className="lk7-sec" id="performance">
        <div className="lk7-hl rev">
          <div className="txt lk-reveal rl">
            <h3>Votre stratégie de performance, <span className="hl lk7-it">en chiffres.</span></h3>
            <p>Votre espace client réunit tout : vos cartes, vos statistiques détaillées et chaque contact laissé par vos visiteurs. Rien ne se perd, tout se mesure.</p>
            <div className="lk7-list">
              <div className="lk7-li"><span className="tick">✓</span><span><b>Rapports graphiques</b> — évolution des vues, pics de trafic, taux d&apos;engagement.</span></div>
              <div className="lk7-li"><span className="tick">✓</span><span><b>Tous vos contacts</b> — réservations, formulaires, newsletter : nom + coordonnées, datés.</span></div>
              <div className="lk7-li"><span className="tick">✓</span><span><b>Par carte</b> — chaque établissement ou commercial a ses propres chiffres.</span></div>
              <div className="lk7-li"><span className="tick">✓</span><span><b>Accès sécurisé</b> — vous recevez vos identifiants, vos données restent à vous.</span></div>
            </div>
          </div>
          <div className="vis lk-reveal rr d1">
            <div className="lk7-report">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <b style={{ fontSize: 15 }}>📊 Cette semaine</b>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#1E8A5C", background: "#E9F7F0", padding: "4px 10px", borderRadius: 999 }}>↗ +32%</span>
              </div>
              <svg viewBox="0 0 340 110" style={{ width: "100%" }}>
                <defs><linearGradient id="lg7" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFD500" stopOpacity=".5" /><stop offset="100%" stopColor="#FFD500" stopOpacity=".03" /></linearGradient></defs>
                <path className="area" d="M0,88 C30,80 45,62 70,64 C100,66 110,40 145,44 C180,48 190,28 225,30 C255,32 270,16 305,12 L340,8 L340,110 L0,110 Z" fill="url(#lg7)" />
                <path className="line" pathLength={1} d="M0,88 C30,80 45,62 70,64 C100,66 110,40 145,44 C180,48 190,28 225,30 C255,32 270,16 305,12 L340,8" fill="none" stroke="#E8A800" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="row"><span>👁 Vues de la carte</span><b>412</b></div>
              <div className="row"><span>🗓️ Réservations reçues</span><b>23</b></div>
              <div className="row"><span>📥 Nouveaux contacts</span><b>31</b></div>
              <div className="row" style={{ borderBottom: "none" }}><span>💬 Conversations IA</span><b>17</b></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TEMPLATES ===== */}
      <section className="lk7-sec" id="templates">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }} className="lk-reveal">
          <h2 className="lk7-h2" style={{ maxWidth: 620 }}>Un modèle pour <span className="lk7-it">chaque métier.</span></h2>
          <div className="lk-pk-nav">
            <button onClick={() => scrollPicks(-1)} aria-label="Précédent">←</button>
            <button onClick={() => scrollPicks(1)} aria-label="Suivant">→</button>
          </div>
        </div>
        <p style={{ color: "var(--ink2)", fontSize: 15, marginTop: 10 }} className="lk-reveal">Survolez une carte : elle défile en entier. Chaque template est 100 % personnalisable.</p>
        <div className="lk-picks lk-reveal" ref={picksRef} style={{ marginTop: 26 }}>
          {picks.map(({ t, c }) => (
            <div key={t.id} className="lk-pick">
              <div className="ph"><div className="zoom"><CardRenderer card={c} /></div></div>
              <div className="bd">
                <div>
                  <b>{t.emoji} {t.name}</b>
                  <small>{t.niche} · dès 27€/mois</small>
                </div>
                <a href={WA} target="_blank" rel="noopener" className="go" title="Je veux ce template">→</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== COMPARATIF ===== */}
      <section className="lk7-sec" id="compare">
        <div className="lk-sechead lk-reveal" style={{ marginBottom: 34 }}>
          <span className="lk-eye">Comparatif</span>
          <h2 className="lk-h2-line">Karte vs les cartes NFC classiques</h2>
          <p>La carte signée <b>Adamkom</b> — la plus performante et la plus poussée du marché aujourd&apos;hui.</p>
        </div>
        <div className="lk7-comp lk-reveal rz">
          <table>
            <thead><tr><th>Ce qui compte pour votre business</th><th className="karte">Karte</th><th>Les autres cartes NFC</th></tr></thead>
            <tbody>
              {COMP.map(([label, autres]) => (
                <tr key={label}>
                  <td>{label === "Support local à La Réunion" ? <>{label} <Flag974 h={15} /></> : label}</td>
                  <td className="karte"><span className="tick">✓</span></td>
                  <td>{autres}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== AVIS ===== */}
      <section className="lk7-sec" id="avis">
        <div className="lk-sechead lk-reveal" style={{ marginBottom: 34 }}>
          <span className="lk-eye">Ils nous font confiance</span>
          <h2 className="lk-h2-line">Nos clients en parlent mieux que nous</h2>
        </div>
        <div className="lk-reviews lk-reveal">
          <div className="lk-review">
            <div className="stars">★★★★★</div>
            <p>« Depuis que j&apos;ai ma carte, plus besoin de réimprimer des flyers. Mes clients scannent, voient le menu du jour et réservent direct. »</p>
            <div className="who"><span className="av">M</span><div><b>Marie L.</b><small>Restauratrice · Saint-Denis</small></div></div>
          </div>
          <div className="lk-review">
            <div className="stars">★★★★★</div>
            <p>« La carte de fidélité digitale a changé la donne : mes clientes reviennent plus souvent et je récupère leurs contacts. »</p>
            <div className="who"><span className="av">S</span><div><b>Sabrina P.</b><small>Institut de beauté · Saint-Pierre</small></div></div>
          </div>
          <div className="lk-review">
            <div className="stars">★★★★★</div>
            <p>« Je gère les cartes de mes 8 commerciaux depuis un seul espace. Mise à jour en 2 minutes, statistiques par carte. »</p>
            <div className="who"><span className="av">D</span><div><b>David H.</b><small>Agence immobilière · Le Port</small></div></div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="lk7-sec" id="pricing">
        <div className="lk-sechead lk-reveal" style={{ marginBottom: 34 }}>
          <span className="lk-eye">Tarifs</span>
          <h2 className="lk-h2-line">Un abonnement simple. Tout inclus.</h2>
          <p>Votre mini-app NFC, mise à jour et hébergée, avec l&apos;IA incluse. Sans engagement.</p>
        </div>
        <div className="lk-prices">
          {PRICES.map((p) => (
            <div key={p.plan} className={`lk-price lk-reveal ${p.feat ? "feat" : ""}`}>
              {p.feat && <span className="lk-ribbon">⭐ La plus vendue</span>}
              <div className="plan">{p.plan}</div>
              <div className="amt">{p.amt}€ <small>{p.per}</small></div>
              <ul>{p.feats.map((f) => <li key={f}>{f}</li>)}</ul>
              <details>
                <summary>Tout ce qui est inclus ↓</summary>
                <ul>{MODULES.map((m) => <li key={m}>{m}</li>)}</ul>
              </details>
              <a href={WA} target="_blank" rel="noopener" className={`lk-btn ${p.feat ? "lk-btn-y" : ""}`} style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
                📞 Appelez-nous pour commencer
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="lk7-sec" id="faq" style={{ paddingBottom: 20 }}>
        <div className="lk7-split lk-reveal">
          <h2 className="lk7-h2">Les questions qu&apos;on nous pose <span className="lk7-it">tout le temps.</span></h2>
          <p>Une autre question ? Écrivez-nous sur WhatsApp, on répond vite — et en vrai.</p>
        </div>
        <div className="lk7-faq lk-reveal">
          {FAQ.map((f, i) => (
            <details key={f.q}>
              <summary><span className="idx">0{i + 1}.</span><span style={{ flex: 1 }}>{f.q}</span><span className="pm">+</span></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="lk7-final">
        <div className="lk7-glow" />
        <div style={{ position: "relative" }} className="lk-reveal">
          <div className="lk7-kicker" style={{ animation: "none", opacity: 1, transform: "none" }}>Prêt quand vous l&apos;êtes.</div>
          <h2 className="lk7-h1" style={{ fontSize: "clamp(34px,5vw,64px)", marginTop: 14 }}>
            <span className="ln" style={{ animation: "none", opacity: 1, transform: "none" }}>Passez au niveau <span className="hl lk7-it">supérieur.</span></span>
          </h2>
          <div className="lk7-heroctas" style={{ animation: "none", opacity: 1, transform: "none", marginTop: 10 }}>
            <a href={WA} target="_blank" rel="noopener" className="lk7-pill solid">Créer ma carte <span className="arr">→</span></a>
            <Link href="/demo" className="lk7-pill">Voir une démo</Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ borderTop: "1px solid var(--line)", padding: "44px 0 30px", background: "#fff" }}>
        <div className="lk-wrap" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 30 }}>
          <div>
            <LogoImg h={92} />
            <p style={{ color: "var(--ink2)", fontSize: 13.5, lineHeight: 1.6, marginTop: 14, maxWidth: 300 }}>
              La carte de visite NFC professionnelle nouvelle génération. Conçue et opérée à La Réunion.
            </p>
            <img src="https://adamkom.com/wp-content/uploads/2026/01/logo-Adamkom-by-jjp-1.png" alt="Adamkom by JJP" style={{ height: 46, marginTop: 16, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 12.5, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Navigation</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 14 }}>
              <a href="#fonctionnalites" style={{ color: "var(--ink2)", textDecoration: "none" }}>Fonctionnalités</a>
              <a href="#templates" style={{ color: "var(--ink2)", textDecoration: "none" }}>Templates</a>
              <a href="#pricing" style={{ color: "var(--ink2)", textDecoration: "none" }}>Tarifs</a>
              <Link href="/demo" style={{ color: "var(--ink2)", textDecoration: "none" }}>Carte démo</Link>
              <a href={WA} target="_blank" rel="noopener" style={{ color: "var(--ink2)", textDecoration: "none" }}>Contact WhatsApp</a>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 12.5, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Espaces &amp; légal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 14 }}>
              <Link href="/client" style={{ color: "var(--ink2)", textDecoration: "none" }}>Espace Client</Link>
              <Link href="/admin" style={{ color: "var(--ink2)", textDecoration: "none" }}>Espace Admin</Link>
              <Link href="/mentions" style={{ color: "var(--ink2)", textDecoration: "none" }}>Mentions légales</Link>
            </div>
          </div>
        </div>
        <div className="lk-wrap" style={{ borderTop: "1px solid var(--line)", marginTop: 30, paddingTop: 18, color: "var(--muted)", fontSize: 12.5, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span>© 2026 Karte — Adamkom by JJP. Tous droits réservés.</span>
          <span>Tap. Connect. Grow.</span>
        </div>
      </footer>
    </main>
  );
}
