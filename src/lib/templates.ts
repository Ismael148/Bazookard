// Templates de cartes Karte — blocs pré-remplis par niche.
// Un template = thème + liste de blocs (sans id ; ids générés à l'instanciation).
import type { Block, BlockType } from "./types";

export interface TemplateBlock {
  type: BlockType;
  data: Record<string, unknown>;
}

export interface CardTemplate {
  id: string;
  name: string;
  niche: string;
  emoji: string;
  themeIndex: number;
  description: string;
  blocks: TemplateBlock[];
}

const U = (id: string) => `https://images.unsplash.com/${id}?w=900&q=70&auto=format`;

export const TEMPLATES: CardTemplate[] = [
  /* ========== 1. AIRBNB / CONCIERGERIE (vitrine) ========== */
  {
    id: "tpl-airbnb",
    name: "Villa Azur",
    niche: "Airbnb / Location",
    emoji: "🏖️",
    themeIndex: 4, // Ambre — fond clair premium
    description: "Le livret d'accueil digital du logement : wifi, arrivée, bonnes adresses, avis.",
    blocks: [
      { type: "banner", data: { image: U("photo-1512917774080-9991f1c4c750") } },
      { type: "profile", data: { name: "Villa Azur", title: "Location saisonnière", company: "Nice, France", photo: "", bio: "Bienvenue chez vous ! Tout ce qu'il faut pour un séjour parfait est sur cette page." } },
      { type: "wifi", data: { network: "VillaAzur_5G", password: "soleil2026", note: "Le routeur est dans l'entrée." } },
      { type: "list", data: { title: "🔑 Arrivée & départ", items: [
        { label: "Check-in", value: "à partir de 15h00" },
        { label: "Check-out", value: "avant 11h00" },
        { label: "Boîte à clés", value: "code envoyé par SMS" },
        { label: "Parking", value: "place n°12 au sous-sol" },
      ] } },
      { type: "faq", data: { items: [
        { q: "Comment fonctionne la climatisation ?", a: "Télécommande sur le mur du salon. Mode ❄ pour rafraîchir, 🔥 pour chauffer." },
        { q: "Où sont les serviettes de plage ?", a: "Dans le placard de l'entrée, panier bleu." },
        { q: "Comment utiliser le lave-linge ?", a: "Programme court : bouton A, 30°. La lessive est sous l'évier." },
      ] } },
      { type: "headline", data: { title: "🏡 Règles de la maison", text: "Pas de fêtes, pas de fumée à l'intérieur. Les voisins sont adorables, gardons-les comme ça 😉. Merci de trier vos déchets (local à droite du portail)." } },
      { type: "gallery", data: { items: [
        { image: U("photo-1512917774080-9991f1c4c750") },
        { image: U("photo-1502672260266-1c1ef2d93688") },
        { image: U("photo-1522708323590-d24dbb6b0267") },
      ] } },
      { type: "equipment", data: { title: "🛎️ Équipements", items: [
        { icon: "📶", name: "Wifi fibre", desc: "Très haut débit, idéal télétravail — mot de passe dans le bloc Wifi." },
        { icon: "🏊", name: "Piscine privée", desc: "Chauffée d'avril à octobre, serviettes fournies." },
        { icon: "❄️", name: "Climatisation", desc: "Dans toutes les chambres, télécommandes sur les murs." },
        { icon: "🚗", name: "Parking privé", desc: "Place n°12 au sous-sol, badge sur le porte-clés." },
      ] } },
      { type: "around", data: { title: "🗺️ Aux alentours", items: [
        { image: U("photo-1507525428034-b723cf961d3e"), name: "Plage de la Réserve", desc: "Sable fin et eaux calmes", distance: "12 min à pied" },
        { image: U("photo-1414235077428-338989a2e8c0"), name: "Chez Pipo", desc: "La meilleure socca de la ville", distance: "8 min à pied" },
        { image: U("photo-1449824913935-59a10b8d2000"), name: "Vieux Nice", desc: "Ruelles, marchés et culture", distance: "15 min" },
      ] } },
      { type: "list", data: { title: "🍽️ Nos bonnes adresses", items: [
        { label: "Chez Pipo (socca)", value: "8 min à pied" },
        { label: "Plage de la Réserve", value: "12 min à pied" },
        { label: "Marché du Cours Saleya", value: "mar–dim matin" },
        { label: "La Rossettisserie", value: "vieux Nice" },
      ] } },
      { type: "events", data: { title: "📅 En ce moment à Nice", items: [
        { title: "Marché nocturne du port", date: "", time: "18h - 23h", place: "Quai Lunel", url: "" },
      ] } },
      { type: "offers", data: { title: "Offres voyageurs", items: [
        { title: "-15% sur votre prochain séjour", desc: "Réservez en direct et économisez les frais de plateforme.", code: "REVIENS15", expires: "", url: "" },
        { title: "Late check-out offert", desc: "Selon disponibilité — demandez-nous la veille.", code: "", expires: "", url: "" },
      ] } },
      { type: "loyalty", data: { title: "Club voyageurs", reward: "-15% au 3e séjour", stamps: "3", pin: "2026", note: "1 tampon par séjour, validé par vos hôtes." } },
      { type: "reviews", data: { title: "Votre avis illumine notre journée", text: "Un petit mot sur votre séjour nous aide énormément. Merci !", items: [
        { platform: "airbnb", url: "https://airbnb.com" },
        { platform: "google", url: "https://google.com/maps" },
      ] } },
      { type: "contact", data: { phone: "+33600000000", email: "hello@villa-azur.fr", whatsapp: "33600000000", wamsg: "Bonjour ! Nous sommes les voyageurs de la Villa Azur 🙂", maps: "https://maps.google.com/?q=Nice", website: "https://villa-azur.fr" } },
      { type: "subscribe", data: { title: "Recevez nos offres de re-réservation", buttonLabel: "Je m'inscris", placeholder: "Votre email" } },
      { type: "chatbot", data: { greeting: "Bonjour 👋 Je suis l'assistant de la Villa Azur. Code wifi, recos restos, check-out… posez-moi vos questions !" } },
    ],
  },

  /* ========== 2. RESTAURANT ========== */
  {
    id: "tpl-resto",
    name: "Le Bistrot Doré",
    niche: "Restaurant",
    emoji: "🍽️",
    themeIndex: 2,
    description: "Menu, horaires, réservation, avis Google et offres du moment.",
    blocks: [
      { type: "banner", data: { image: U("photo-1517248135467-4c7edcad34c4") } },
      { type: "profile", data: { name: "Le Bistrot Doré", title: "Cuisine de marché", company: "Lyon 2e", photo: "", bio: "Produits frais, carte courte, vins nature. Tapez, régalez-vous." } },
      { type: "menu", data: { title: "La carte", items: [
        { cat: "Entrées", name: "Burrata crémeuse", desc: "Tomates anciennes, basilic", price: "11€", image: U("photo-1608897013039-887f21d8c804") },
        { cat: "Entrées", name: "Velouté de saison", desc: "Selon le marché", price: "9€", image: U("photo-1547592166-23ac45744acd") },
        { cat: "Plats", name: "Magret de canard", desc: "Purée fumée, jus corsé", price: "24€", image: U("photo-1546833999-b9f581a1996d") },
        { cat: "Plats", name: "Risotto aux cèpes", desc: "Parmesan 24 mois", price: "19€", image: U("photo-1476124369491-e7addf5db371") },
        { cat: "Desserts", name: "Baba au rhum", desc: "Chantilly vanille", price: "9€", image: U("photo-1551024506-0bccd828d307") },
      ] } },
      { type: "hours", data: { title: "Horaires", items: [
        { day: "Lundi", hours: "Fermé" },
        { day: "Mardi", hours: "12:00 - 14:30" },
        { day: "Mercredi", hours: "12:00 - 14:30 / 19:00 - 22:30" },
        { day: "Jeudi", hours: "12:00 - 14:30 / 19:00 - 22:30" },
        { day: "Vendredi", hours: "12:00 - 14:30 / 19:00 - 23:00" },
        { day: "Samedi", hours: "19:00 - 23:00" },
        { day: "Dimanche", hours: "Fermé" },
      ] } },
      { type: "button", data: { label: "Réserver une table", url: "" } },
      { type: "offers", data: { title: "En ce moment", items: [
        { title: "Menu déjeuner 19€", desc: "Entrée + plat, du mardi au vendredi midi.", code: "", expires: "", url: "" },
      ] } },
      { type: "gallery", data: { items: [
        { image: U("photo-1517248135467-4c7edcad34c4") },
        { image: U("photo-1414235077428-338989a2e8c0") },
        { image: U("photo-1476224203421-9ac39bcb3327") },
      ] } },
      { type: "loyalty", data: { title: "Carte gourmande", reward: "10e repas : dessert & café offerts", stamps: "10", pin: "1234", note: "1 tampon par repas, validé en caisse." } },
      { type: "reviews", data: { title: "On compte sur vous ⭐", text: "Votre avis Google, c'est notre meilleure pub.", items: [
        { platform: "google", url: "https://google.com/maps" },
        { platform: "tripadvisor", url: "https://tripadvisor.fr" },
      ] } },
      { type: "contact", data: { phone: "+33478000000", email: "resa@bistrotdore.fr", whatsapp: "33478000000", wamsg: "Bonjour, je souhaite réserver une table.", maps: "https://maps.google.com/?q=Lyon", website: "" } },
      { type: "social", data: { items: [{ network: "instagram", url: "https://instagram.com" }] } },
      { type: "chatbot", data: { greeting: "Bonjour 👋 Envie d'une table ? Une question sur la carte ou les allergènes ? Je suis là." } },
    ],
  },

  /* ========== 3. SALON / SPA ========== */
  {
    id: "tpl-salon",
    name: "L'Atelier Beauté",
    niche: "Salon / Spa",
    emoji: "💆",
    themeIndex: 6,
    description: "Prestations, prise de RDV, horaires et avis clientes.",
    blocks: [
      { type: "banner", data: { image: U("photo-1560066984-138dadb4c035") } },
      { type: "profile", data: { name: "L'Atelier Beauté", title: "Coiffure & Spa", company: "Bordeaux", photo: "", bio: "Un moment pour vous. Coiffure, soins, onglerie — sur rendez-vous." } },
      { type: "product", data: { items: [
        { title: "Coupe + brushing", price: "45€", image: "", url: "" },
        { title: "Couleur complète", price: "75€", image: "", url: "" },
        { title: "Soin visage signature", price: "60€", image: "", url: "" },
        { title: "Manucure semi-permanent", price: "35€", image: "", url: "" },
      ] } },
      { type: "appointment", data: { title: "Prendre rendez-vous", url: "" } },
      { type: "hours", data: { title: "Horaires", items: [
        { day: "Lundi", hours: "Fermé" },
        { day: "Mardi", hours: "09:30 - 19:00" },
        { day: "Mercredi", hours: "09:30 - 19:00" },
        { day: "Jeudi", hours: "09:30 - 21:00" },
        { day: "Vendredi", hours: "09:30 - 19:00" },
        { day: "Samedi", hours: "09:00 - 18:00" },
        { day: "Dimanche", hours: "Fermé" },
      ] } },
      { type: "testimonial", data: { items: [
        { name: "Claire M.", text: "Le meilleur salon de Bordeaux, je ne vais plus nulle part ailleurs.", avatar: "" },
        { name: "Sofia R.", text: "Accueil parfait, résultat sublime. Merci !", avatar: "" },
      ] } },
      { type: "offers", data: { title: "Offre découverte", items: [
        { title: "-20% sur votre 1er soin", desc: "Nouvelles clientes, sur présentation de ce code.", code: "BIENVENUE20", expires: "", url: "" },
      ] } },
      { type: "loyalty", data: { title: "Carte beauté", reward: "6e soin à -50%", stamps: "6", pin: "1234", note: "1 tampon par visite, validé à l'accueil." } },
      { type: "reviews", data: { title: "Un avis ? 🌸", text: "Deux minutes pour nous, une grande aide pour le salon.", items: [
        { platform: "google", url: "https://google.com/maps" },
      ] } },
      { type: "contact", data: { phone: "+33556000000", email: "hello@atelierbeaute.fr", whatsapp: "33556000000", wamsg: "Bonjour, je souhaite un rendez-vous 🙂", maps: "https://maps.google.com/?q=Bordeaux", website: "" } },
      { type: "social", data: { items: [{ network: "instagram", url: "https://instagram.com" }, { network: "tiktok", url: "https://tiktok.com" }] } },
      { type: "chatbot", data: { greeting: "Bonjour 👋 Je peux vous renseigner sur nos prestations, tarifs et disponibilités." } },
    ],
  },

  /* ========== 4. IMMOBILIER ========== */
  {
    id: "tpl-immo",
    name: "Nova Immobilier",
    niche: "Immobilier",
    emoji: "🏠",
    themeIndex: 1,
    description: "Fiche agent : biens en vitrine, estimation, prise de RDV.",
    blocks: [
      { type: "banner", data: { image: U("photo-1560518883-ce09059eeffa") } },
      { type: "profile", data: { name: "Sarah Lambert", title: "Conseillère immobilier", company: "Nova Immobilier · Annecy", photo: "", bio: "J'accompagne vos projets d'achat et de vente sur le bassin annécien depuis 10 ans." } },
      { type: "product", data: { items: [
        { title: "T3 vue lac — Annecy-le-Vieux", price: "520 000€", image: U("photo-1512917774080-9991f1c4c750"), url: "" },
        { title: "Maison 5p — Seynod", price: "645 000€", image: U("photo-1600596542815-ffad4c1539a9"), url: "" },
      ] } },
      { type: "button", data: { label: "Faire estimer mon bien", url: "" } },
      { type: "appointment", data: { title: "Prendre rendez-vous", url: "" } },
      { type: "testimonial", data: { items: [
        { name: "Famille Bertin", text: "Vente conclue en 3 semaines au prix. Un accompagnement remarquable.", avatar: "" },
      ] } },
      { type: "contact", data: { phone: "+33450000000", email: "s.lambert@nova-immo.fr", whatsapp: "33450000000", wamsg: "Bonjour Sarah, je vous contacte au sujet d'un bien.", maps: "https://maps.google.com/?q=Annecy", website: "https://nova-immo.fr" } },
      { type: "social", data: { items: [{ network: "linkedin", url: "https://linkedin.com" }, { network: "instagram", url: "https://instagram.com" }] } },
      { type: "subscribe", data: { title: "Alertes nouveaux biens", buttonLabel: "M'alerter", placeholder: "Votre email" } },
      { type: "chatbot", data: { greeting: "Bonjour 👋 Recherche, estimation, visite ? Dites-m'en plus sur votre projet." } },
    ],
  },

  /* ========== 5. COACH / FITNESS ========== */
  {
    id: "tpl-coach",
    name: "Max Coaching",
    niche: "Coach / Fitness",
    emoji: "💪",
    themeIndex: 3,
    description: "Programmes, témoignages, réservation de séance d'essai.",
    blocks: [
      { type: "banner", data: { image: U("photo-1571019613454-1cb2f99b2d8b") } },
      { type: "profile", data: { name: "Max Durand", title: "Coach sportif diplômé", company: "Lyon · à domicile & en ligne", photo: "", bio: "Perte de poids, prise de muscle, remise en forme. Des résultats mesurables en 12 semaines." } },
      { type: "product", data: { items: [
        { title: "Séance découverte", price: "Offerte", image: "", url: "" },
        { title: "Pack 10 séances", price: "450€", image: "", url: "" },
        { title: "Programme 12 semaines", price: "890€", image: "", url: "" },
      ] } },
      { type: "testimonial", data: { items: [
        { name: "Julie", text: "-12 kg en 4 mois, et surtout des habitudes qui durent. Merci Max !", avatar: "" },
        { name: "Karim", text: "Programmes carrés, suivi au top sur WhatsApp.", avatar: "" },
      ] } },
      { type: "video", data: { url: "" } },
      { type: "appointment", data: { title: "Réserver ma séance d'essai", url: "" } },
      { type: "subscribe", data: { title: "5 conseils nutrition offerts", buttonLabel: "Recevoir le guide", placeholder: "Votre email" } },
      { type: "contact", data: { phone: "+33600000000", email: "max@maxcoaching.fr", whatsapp: "33600000000", wamsg: "Salut Max ! Je veux commencer le coaching 💪", maps: "", website: "https://maxcoaching.fr" } },
      { type: "social", data: { items: [{ network: "instagram", url: "https://instagram.com" }, { network: "youtube", url: "https://youtube.com" }] } },
      { type: "chatbot", data: { greeting: "Salut 👋 Objectif minceur, muscle ou forme ? Je te guide vers le bon programme." } },
    ],
  },

  /* ========== 6. ARTISAN / CRÉATEUR ========== */
  {
    id: "tpl-artisan",
    name: "Mes Trésors",
    niche: "Artisan / Créateur",
    emoji: "🎨",
    themeIndex: 7,
    description: "Créations, commandes personnalisées, marchés et événements.",
    blocks: [
      { type: "banner", data: { image: U("photo-1452860606245-08befc0ff44b") } },
      { type: "profile", data: { name: "Mes Trésors", title: "Créations personnalisées", company: "Fait main en France", photo: "", bio: "Des souvenirs uniques : créations personnalisées et prestations événementielles, avec passion et proximité." } },
      { type: "gallery", data: { items: [
        { image: U("photo-1452860606245-08befc0ff44b") },
        { image: U("photo-1513475382585-d06e58bcb0e0") },
        { image: U("photo-1607344645866-009c320b63e0") },
      ] } },
      { type: "product", data: { items: [
        { title: "Création personnalisée", price: "dès 25€", image: "", url: "" },
        { title: "Coffret cadeau", price: "45€", image: "", url: "" },
        { title: "Prestation événement", price: "sur devis", image: "", url: "" },
      ] } },
      { type: "events", data: { title: "Retrouvez-nous", items: [
        { title: "Marché des créateurs", date: "", time: "10h - 18h", place: "Place du marché", url: "" },
      ] } },
      { type: "testimonial", data: { items: [
        { name: "Émilie", text: "Un cadeau unique, ma sœur a pleuré de joie. Qualité et finitions parfaites.", avatar: "" },
      ] } },
      { type: "subscribe", data: { title: "Nouveautés & marchés — restez informés", buttonLabel: "Je m'abonne", placeholder: "Votre email" } },
      { type: "contact", data: { phone: "+33600000000", email: "hello@mestresors.fr", whatsapp: "33600000000", wamsg: "Bonjour ! J'aimerais une création personnalisée 🙂", maps: "", website: "" } },
      { type: "social", data: { items: [{ network: "instagram", url: "https://instagram.com" }, { network: "facebook", url: "https://facebook.com" }] } },
      { type: "chatbot", data: { greeting: "Bonjour 👋 Une idée de création personnalisée ? Décrivez-moi votre projet !" } },
    ],
  },

  /* ========== 7. ÉVÉNEMENT / MARIAGE ========== */
  {
    id: "tpl-event",
    name: "Emma & Lucas",
    niche: "Événement / Mariage",
    emoji: "💍",
    themeIndex: 0,
    description: "Programme, RSVP, infos pratiques et galerie du grand jour.",
    blocks: [
      { type: "banner", data: { image: U("photo-1519741497674-611481863552") } },
      { type: "profile", data: { name: "Emma & Lucas", title: "Se disent oui", company: "12 septembre 2026 · Provence", photo: "", bio: "Nous sommes si heureux de partager ce jour avec vous. Toutes les infos pratiques sont ici !" } },
      { type: "events", data: { title: "Le programme", items: [
        { title: "Cérémonie laïque", date: "2026-09-12", time: "15:30", place: "Domaine des Oliviers", url: "" },
        { title: "Cocktail & dîner", date: "2026-09-12", time: "18:00", place: "La grande terrasse", url: "" },
        { title: "Brunch des amoureux", date: "2026-09-13", time: "11:00", place: "Au bord de la piscine", url: "" },
      ] } },
      { type: "list", data: { title: "Infos pratiques", items: [
        { label: "Dress code", value: "élégant, tons pastel" },
        { label: "Parking", value: "sur place, fléché" },
        { label: "Hébergement", value: "liste d'hôtels sur demande" },
        { label: "Enfants", value: "babysitter sur place" },
      ] } },
      { type: "subscribe", data: { title: "Confirmez votre présence 💌", buttonLabel: "Je confirme (RSVP)", placeholder: "Votre nom + nombre d'invités" } },
      { type: "gallery", data: { items: [
        { image: U("photo-1519741497674-611481863552") },
        { image: U("photo-1465495976277-4387d4b0b4c6") },
      ] } },
      { type: "faq", data: { items: [
        { q: "Puis-je venir accompagné(e) ?", a: "Indiquez-le dans le RSVP, on s'occupe du reste !" },
        { q: "Y a-t-il une liste de mariage ?", a: "Votre présence est le plus beau cadeau. Sinon, une urne sera sur place." },
      ] } },
      { type: "contact", data: { phone: "+33600000000", email: "emma.lucas@mariage.fr", whatsapp: "33600000000", wamsg: "Coucou ! Question sur le mariage 🙂", maps: "https://maps.google.com/?q=Provence", website: "" } },
    ],
  },

  /* ========== 8. FREELANCE / CARTE PERSO ========== */
  {
    id: "tpl-freelance",
    name: "Alex Martin",
    niche: "Freelance / Perso",
    emoji: "👤",
    themeIndex: 5,
    description: "La carte de visite pro : services, portfolio, réseaux, vCard.",
    blocks: [
      { type: "banner", data: { image: U("photo-1497366216548-37526070297c") } },
      { type: "profile", data: { name: "Alex Martin", title: "Designer produit freelance", company: "Remote · Paris", photo: "", bio: "J'aide les startups à transformer leurs idées en produits que les gens adorent." } },
      { type: "list", data: { title: "Ce que je fais", items: [
        { label: "Design d'app mobile", value: "UI/UX" },
        { label: "Design system", value: "Figma" },
        { label: "Prototype & tests", value: "1-2 semaines" },
      ] } },
      { type: "button", data: { label: "Voir mon portfolio", url: "" } },
      { type: "testimonial", data: { items: [
        { name: "CEO, Startup X", text: "Alex a livré en 3 semaines ce que d'autres promettaient en 3 mois.", avatar: "" },
      ] } },
      { type: "appointment", data: { title: "Réserver un appel découverte", url: "" } },
      { type: "contact", data: { phone: "+33600000000", email: "hello@alexmartin.design", whatsapp: "", wamsg: "", maps: "", website: "https://alexmartin.design" } },
      { type: "social", data: { items: [{ network: "linkedin", url: "https://linkedin.com" }, { network: "x", url: "https://x.com" }, { network: "instagram", url: "https://instagram.com" }] } },
      { type: "chatbot", data: { greeting: "Bonjour 👋 Un projet en tête ? Décrivez-le-moi, je vous dis comment je peux aider." } },
    ],
  },
];

export const TEMPLATE_NICHES = [...new Set(TEMPLATES.map((t) => t.niche))];

export function templateBlocks(tpl: CardTemplate, uid: () => string): Block[] {
  return tpl.blocks.map((b) => ({ id: uid(), type: b.type, data: structuredClone(b.data) }));
}
