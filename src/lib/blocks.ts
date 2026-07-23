// Catalogue des blocs Bazookard (schéma piloté par les données)
import type { BlockType } from "./types";

export type FieldType = "text" | "textarea" | "url" | "tel" | "email" | "image" | "toggle" | "select" | "repeater";

export interface SubField {
  key: string;
  label: string;
  type: Exclude<FieldType, "repeater">;
  options?: [string, string][]; // pour type "select" : [valeur, libellé]
  placeholder?: string;
}

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  options?: [string, string][];
  placeholder?: string;
  ai?: boolean; // bouton ✨ IA (Phase 2)
  item?: SubField[]; // pour les repeaters
  addLabel?: string;
}

export interface BlockDef {
  type: BlockType;
  name: string;
  icon: string;
  category: "Identité" | "Contact" | "Contenu" | "Conversion" | "IA";
  defaults: Record<string, unknown>;
  fields: Field[];
}

export const BLOCK_DEFS: BlockDef[] = [
  // --- Identité ---
  {
    type: "profile", name: "Profil", icon: "👤", category: "Identité",
    defaults: { name: "Ton Nom", title: "Poste", company: "Entreprise", photo: "", bio: "Networking sans contact. Tapez pour échanger nos coordonnées." },
    fields: [
      { key: "name", label: "Nom complet", type: "text" },
      { key: "title", label: "Poste / Titre", type: "text" },
      { key: "company", label: "Entreprise", type: "text" },
      { key: "photo", label: "Photo (URL)", type: "image" },
      { key: "bio", label: "Bio courte", type: "textarea", ai: true },
    ],
  },
  {
    type: "banner", name: "Bannière", icon: "🖼️", category: "Identité",
    defaults: { image: "" },
    fields: [{ key: "image", label: "Image de bannière (URL)", type: "image" }],
  },
  {
    type: "avatar", name: "Avatar", icon: "🙂", category: "Identité",
    defaults: { image: "" },
    fields: [{ key: "image", label: "Avatar (logo ou photo) — s'affiche tout en haut de la carte", type: "image" }],
  },
  {
    type: "headline", name: "Titre & Texte", icon: "T", category: "Identité",
    defaults: { title: "Un titre accrocheur", text: "Quelques mots pour présenter ton activité." },
    fields: [
      { key: "title", label: "Titre", type: "text", ai: true },
      { key: "text", label: "Texte", type: "textarea", ai: true },
    ],
  },
  {
    type: "splitter", name: "Séparateur", icon: "—", category: "Identité",
    defaults: {},
    fields: [],
  },
  // --- Contact ---
  {
    type: "contact", name: "Get in Touch", icon: "🔗", category: "Contact",
    defaults: { phone: "", email: "", whatsapp: "", wamsg: "Bonjour !", address: "", maps: "", website: "", savebtn: true },
    fields: [
      { key: "phone", label: "Téléphone", type: "tel", placeholder: "+33..." },
      { key: "email", label: "Email", type: "email" },
      { key: "whatsapp", label: "WhatsApp (numéro)", type: "tel", placeholder: "33612345678" },
      { key: "wamsg", label: "Message WhatsApp pré-rempli", type: "text" },
      { key: "address", label: "Adresse (itinéraire en 1 tap)", type: "text", placeholder: "12 rue du Commerce, Saint-Denis" },
      { key: "maps", label: "Ou lien Google Maps direct", type: "url" },
      { key: "website", label: "Site web", type: "url" },
      { key: "savebtn", label: "Bouton « Enregistrer le contact » (vCard)", type: "toggle" },
    ],
  },
  {
    type: "button", name: "Bouton & Lien", icon: "🔘", category: "Contact",
    defaults: { label: "Prendre RDV", url: "" },
    fields: [
      { key: "label", label: "Libellé", type: "text", ai: true },
      { key: "url", label: "Lien", type: "url" },
    ],
  },
  {
    type: "social", name: "Réseaux sociaux", icon: "🌐", category: "Contact",
    defaults: { items: [{ network: "instagram", url: "" }, { network: "linkedin", url: "" }] },
    fields: [{
      key: "items", label: "Réseaux", type: "repeater", addLabel: "+ Ajouter un réseau",
      item: [
        { key: "network", label: "Réseau", type: "select", options: [
          ["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"], ["whatsapp", "WhatsApp"],
          ["youtube", "YouTube"], ["linkedin", "LinkedIn"], ["x", "X (Twitter)"], ["snapchat", "Snapchat"],
          ["pinterest", "Pinterest"], ["telegram", "Telegram"], ["github", "GitHub"], ["site", "Site web"],
        ] },
        { key: "url", label: "Lien", type: "url" },
        { key: "color", label: "Couleur (optionnel, ex : #FF5A5F)", type: "text" },
      ],
    }],
  },
  // --- Contenu ---
  {
    type: "media", name: "Media & Text", icon: "🖼", category: "Contenu",
    defaults: { image: "", text: "Décris ce que montre ce visuel." },
    fields: [
      { key: "image", label: "Image (URL)", type: "image" },
      { key: "text", label: "Texte", type: "textarea", ai: true },
    ],
  },
  {
    type: "gallery", name: "Image Grid", icon: "▦", category: "Contenu",
    defaults: { items: [{ image: "" }] },
    fields: [{
      key: "items", label: "Images", type: "repeater", addLabel: "+ Ajouter une image",
      item: [{ key: "image", label: "Image (URL)", type: "image" }],
    }],
  },
  {
    type: "carousel", name: "Image Carousel", icon: "🎠", category: "Contenu",
    defaults: { items: [{ image: "" }] },
    fields: [{
      key: "items", label: "Images", type: "repeater", addLabel: "+ Ajouter une image",
      item: [{ key: "image", label: "Image (URL)", type: "image" }],
    }],
  },
  {
    type: "video", name: "Vidéo", icon: "▶️", category: "Contenu",
    defaults: { url: "", format: "16:9" },
    fields: [
      { key: "url", label: "Lien YouTube / Vimeo", type: "url" },
      { key: "format", label: "Format (16:9, 9:16, 1:1, 4:3)", type: "text", placeholder: "16:9" },
    ],
  },
  {
    type: "podcast", name: "Podcast", icon: "🎙️", category: "Contenu",
    defaults: { title: "Mon podcast", url: "" },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "url", label: "Lien audio (mp3)", type: "url" },
    ],
  },
  {
    type: "list", name: "List Group", icon: "☰", category: "Contenu",
    defaults: { title: "Nos services", style: "lignes", items: [{ label: "Service 1", value: "" }] },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "style", label: "Style d'affichage", type: "select", options: [
        ["lignes", "Lignes"],
        ["accordeon", "Accordéon (repliable)"],
      ] },
      {
        key: "items", label: "Éléments", type: "repeater", addLabel: "+ Ajouter un élément",
        item: [
          { key: "label", label: "Libellé", type: "text" },
          { key: "value", label: "Détail", type: "text" },
        ],
      },
    ],
  },
  {
    type: "iframe", name: "iFrame", icon: "</>", category: "Contenu",
    defaults: { url: "", height: "320" },
    fields: [
      { key: "url", label: "URL à intégrer", type: "url" },
      { key: "height", label: "Hauteur (px)", type: "text" },
    ],
  },
  {
    type: "faq", name: "FAQ", icon: "❓", category: "Contenu",
    defaults: { style: "accordeon", items: [{ icon: "💡", q: "Question fréquente ?", a: "La réponse ici." }] },
    fields: [
      { key: "style", label: "Style d'affichage", type: "select", options: [
        ["accordeon", "Accordéon (repliable)"],
        ["simple", "Simple (tout visible)"],
      ] },
      {
        key: "items", label: "Questions", type: "repeater", addLabel: "+ Ajouter une question", ai: true,
        item: [
          { key: "icon", label: "Icône (emoji, optionnel)", type: "text", placeholder: "💡" },
          { key: "q", label: "Question", type: "text" },
          { key: "a", label: "Réponse", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "testimonial", name: "Témoignages", icon: "💬", category: "Contenu",
    defaults: { style: "cartes", items: [{ name: "Client satisfait", text: "Un retour client élogieux.", avatar: "" }] },
    fields: [
      { key: "style", label: "Style d'affichage", type: "select", options: [
        ["cartes", "Cartes"],
        ["bulles", "Bulles de chat"],
        ["etoiles", "Notes 5 étoiles"],
      ] },
      {
      key: "items", label: "Témoignages", type: "repeater", addLabel: "+ Ajouter un témoignage", ai: true,
      item: [
        { key: "name", label: "Nom", type: "text" },
        { key: "text", label: "Témoignage", type: "textarea" },
        { key: "avatar", label: "Photo (URL)", type: "image" },
      ],
    },
    ],
  },
  {
    type: "equipment", name: "Équipements", icon: "🛎️", category: "Contenu",
    defaults: {
      title: "Équipements",
      items: [
        { icon: "🌟", name: "Idéal pour votre séjour", list: "Connexion Wi-Fi gratuite\nSalle de bains privative\nParking gratuit\nClimatisation\nChambres familiales\nBalcon\nChambres non-fumeurs\nCuisine\nTerrasse" },
        { icon: "🛁", name: "Salle de bains", list: "Papier toilette\nServiettes\nDouche ou baignoire\nSalle de bains privative\nToilettes\nArticles de toilette gratuits\nSèche-cheveux\nDouche" },
        { icon: "🛏️", name: "Chambre", list: "Linge de maison\nArmoire ou penderie\nLits confortables\nDressing" },
        { icon: "🍳", name: "Cuisine", list: "Table à manger\nMachine à café\nProduits ménagers\nGrille-pain\nPlaques de cuisson\nFour\nMicro-ondes\nRéfrigérateur\nLave-vaisselle\nUstensiles de cuisine\nBouilloire électrique" },
        { icon: "🛋️", name: "Salon", list: "Coin salon\nCanapé\nTélévision à écran plat" },
        { icon: "🌴", name: "Extérieur", list: "Mobilier d'extérieur\nEspace repas en plein air\nTerrasse bien exposée\nBarbecue\nJardin\nTerrasse\nBalcon" },
        { icon: "📺", name: "High-tech et médias", list: "Service de streaming (Netflix)\nTélévision à écran plat\nChaînes satellite\nWi-Fi haut débit" },
        { icon: "🅿️", name: "Parking et transports", list: "Parking gratuit\nParking privé\nParking sur place\nBornes de recharge (à proximité)" },
        { icon: "🏊", name: "Piscine et bien-être", list: "Piscine privée\nPiscine extérieure\nTransats\nParasols" },
        { icon: "👶", name: "Familles et enfants", list: "Chambres familiales\nLit bébé (sur demande)\nChaise haute\nJeux pour enfants" },
        { icon: "🔒", name: "Sécurité", list: "Détecteur de fumée\nExtincteurs\nTrousse de secours\nEntrée privée\nCoffre-fort" },
        { icon: "🧺", name: "Services", list: "Ménage inclus\nLave-linge\nSèche-linge\nFer à repasser\nDraps et serviettes fournis\nEnregistrement/départ autonome" },
        { icon: "♿", name: "Accessibilité", list: "Logement de plain-pied\nAccès sans marches\nPlaces de parking accessibles" },
        { icon: "🗣️", name: "Langues parlées", list: "Français\nAnglais" },
      ],
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      {
        key: "items", label: "Catégories d'équipements", type: "repeater", addLabel: "+ Ajouter une catégorie",
        item: [
          { key: "icon", label: "Icône (emoji)", type: "text", placeholder: "🛁" },
          { key: "image", label: "Image de la catégorie (optionnel)", type: "image" },
          { key: "name", label: "Nom de la catégorie", type: "text", placeholder: "Salle de bains" },
          { key: "list", label: "Contenu (un équipement par ligne)", type: "textarea", placeholder: "Serviettes\nSèche-cheveux\nDouche" },
          { key: "desc", label: "Note (optionnel)", type: "text" },
        ],
      },
    ],
  },
  {
    type: "around", name: "Aux alentours", icon: "🗺️", category: "Contenu",
    defaults: {
      title: "Aux alentours",
      items: [
        { image: "", name: "Plage de l'Ermitage", desc: "Lagon turquoise et snorkeling", distance: "5 min", cat: "Environnement naturel" },
      ],
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      {
        key: "items", label: "Points d'intérêt", type: "repeater", addLabel: "+ Ajouter un lieu", ai: true,
        item: [
          { key: "image", label: "Photo", type: "image" },
          { key: "name", label: "Nom du lieu", type: "text" },
          { key: "cat", label: "Catégorie", type: "select", options: [
            ["", "Sans catégorie"],
            ["Lieux à proximité", "Lieux à proximité"],
            ["Restaurants et cafés", "Restaurants et cafés"],
            ["Environnement naturel", "Environnement naturel"],
            ["Plages", "Plages"],
            ["Commerces et marchés", "Commerces et marchés"],
            ["Activités et loisirs", "Activités et loisirs"],
            ["Culture et patrimoine", "Culture et patrimoine"],
            ["Transports en commun", "Transports en commun"],
            ["Aéroports les plus proches", "Aéroports les plus proches"],
          ] },
          { key: "desc", label: "Description courte", type: "text" },
          { key: "distance", label: "Distance / temps", type: "text", placeholder: "5 min" },
        ],
      },
    ],
  },
  // --- Conversion ---
  {
    type: "product", name: "Produits & Services", icon: "🛍️", category: "Conversion",
    defaults: { items: [{ title: "Produit", price: "29€", image: "", url: "" }] },
    fields: [{
      key: "items", label: "Produits", type: "repeater", addLabel: "+ Ajouter un produit", ai: true,
      item: [
        { key: "title", label: "Nom", type: "text" },
        { key: "price", label: "Prix", type: "text" },
        { key: "image", label: "Image (URL)", type: "image" },
        { key: "url", label: "Lien", type: "url" },
      ],
    }],
  },
  {
    type: "payment", name: "Paiement", icon: "💲", category: "Conversion",
    defaults: { label: "Payer maintenant", amount: "", currency: "EUR", link: "" },
    fields: [
      { key: "label", label: "Libellé du bouton", type: "text" },
      { key: "amount", label: "Montant", type: "text" },
      { key: "currency", label: "Devise", type: "text" },
      { key: "link", label: "Lien de paiement (Stripe/PayPal)", type: "url" },
    ],
  },
  {
    type: "subscribe", name: "Inscription (Leads)", icon: "✉️", category: "Conversion",
    defaults: { title: "Restons en contact", buttonLabel: "Je m'inscris", placeholder: "Votre email" },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "buttonLabel", label: "Texte du bouton", type: "text" },
      { key: "placeholder", label: "Placeholder du champ", type: "text" },
    ],
  },
  {
    type: "form", name: "Formulaire de contact", icon: "📝", category: "Conversion",
    defaults: {
      title: "Écrivez-nous",
      note: "Nous répondons sous 24 h.",
      askPhone: true,
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "note", label: "Note affichée sous le formulaire", type: "textarea" },
      { key: "askPhone", label: "Demander le téléphone", type: "toggle" },
    ],
  },
  {
    type: "reservation", name: "Réservation", icon: "🗓️", category: "Conversion",
    defaults: {
      title: "Réserver",
      note: "Nous confirmons chaque demande par téléphone ou WhatsApp.",
      whatsapp: "",
      askPeople: true,
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "note", label: "Note affichée sous le formulaire", type: "textarea" },
      { key: "whatsapp", label: "Numéro WhatsApp de réception (ex : 262693802201)", type: "text" },
      { key: "askPeople", label: "Demander le nombre de personnes", type: "toggle" },
    ],
  },
  {
    type: "appointment", name: "Prise de RDV", icon: "📅", category: "Conversion",
    defaults: { title: "Réserver un créneau", url: "" },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "url", label: "Lien de réservation (Calendly…)", type: "url" },
    ],
  },
  {
    type: "feedback", name: "Avis & Notes", icon: "⭐", category: "Conversion",
    defaults: { title: "Laissez votre avis" },
    fields: [{ key: "title", label: "Titre", type: "text" }],
  },
  // --- Métier ---
  {
    type: "menu", name: "Menu / Carte", icon: "🍽️", category: "Contenu",
    defaults: {
      title: "Notre menu",
      items: [
        { cat: "Entrées", name: "Plat exemple", desc: "Une description gourmande", price: "12€", image: "" },
      ],
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      {
        key: "items", label: "Plats", type: "repeater", addLabel: "+ Ajouter un plat", ai: true,
        item: [
          { key: "cat", label: "Catégorie (Entrées, Plats…)", type: "text" },
          { key: "name", label: "Nom du plat", type: "text" },
          { key: "desc", label: "Description", type: "text" },
          { key: "price", label: "Prix", type: "text" },
          { key: "image", label: "Photo (URL)", type: "image" },
          { key: "ingredients", label: "Ingrédients (séparés par des virgules)", type: "text" },
        ],
      },
    ],
  },
  {
    type: "events", name: "Événements", icon: "🎫", category: "Contenu",
    defaults: {
      title: "Événements à venir",
      items: [{ title: "Soirée dégustation", date: "", time: "19:00", place: "", url: "" }],
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      {
        key: "items", label: "Événements", type: "repeater", addLabel: "+ Ajouter un événement",
        item: [
          { key: "title", label: "Titre", type: "text" },
          { key: "image", label: "Image de couverture", type: "image" },
          { key: "date", label: "Date (AAAA-MM-JJ)", type: "text", placeholder: "2026-08-15" },
          { key: "time", label: "Heure", type: "text", placeholder: "19:00" },
          { key: "place", label: "Lieu (itinéraire automatique)", type: "text" },
          { key: "url", label: "Lien (billetterie, infos…)", type: "url" },
          { key: "btnLabel", label: "Texte du bouton", type: "text", placeholder: "Réserver ma place" },
        ],
      },
    ],
  },
  {
    type: "hours", name: "Horaires", icon: "🕒", category: "Contact",
    defaults: {
      title: "Horaires d'ouverture",
      items: [
        { day: "Lundi", hours: "09:00 - 18:00" },
        { day: "Mardi", hours: "09:00 - 18:00" },
        { day: "Mercredi", hours: "09:00 - 18:00" },
        { day: "Jeudi", hours: "09:00 - 18:00" },
        { day: "Vendredi", hours: "09:00 - 18:00" },
        { day: "Samedi", hours: "10:00 - 17:00" },
        { day: "Dimanche", hours: "Fermé" },
      ],
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "style", label: "Style d'affichage", type: "select", options: [
        ["", "Classique (liste)"],
        ["digital", "Digital LED (animé)"],
        ["pills", "Capsules premium"],
        ["timeline", "Timeline élégante"],
        ["minimal", "Minimal chic"],
      ] },
      {
        key: "items", label: "Jours", type: "repeater", addLabel: "+ Ajouter un jour",
        item: [
          { key: "day", label: "Jour", type: "text" },
          { key: "hours", label: "Horaires (ou « Fermé »)", type: "text", placeholder: "09:00 - 18:00" },
        ],
      },
    ],
  },
  {
    type: "welcome", name: "Livret d'accueil", icon: "📖", category: "Contenu",
    defaults: {
      title: "Livret d'accueil",
      intro: "Toutes les infos de votre séjour en un clin d'œil. Cliquez sur une rubrique.",
      items: [
        { icon: "📶", label: "Wi-Fi", desc: "Réseau : Villa_Cap\nMot de passe : Bienvenue974\nConnexion disponible dans toute la maison et sur la terrasse.", image: "", video: "" },
        { icon: "🅿️", label: "Parking", desc: "Place privée gratuite devant la maison. Accès de plain-pied, adapté aux personnes à mobilité réduite (PMR). Portail automatique, télécommande sur le meuble d'entrée.", image: "", video: "" },
        { icon: "📺", label: "TV & Netflix", desc: "Smart TV avec Netflix, YouTube et Canal+ inclus. Connectez votre propre compte ou utilisez le nôtre (déjà connecté). Télécommande sur la table basse.", image: "", video: "" },
        { icon: "🔑", label: "Arrivée & départ", desc: "Arrivée autonome à partir de 15h (boîte à clés, code communiqué la veille). Départ jusqu'à 11h. Merci de laisser les clés dans la boîte.", image: "", video: "" },
        { icon: "🗑️", label: "Tri & poubelles", desc: "Ordures ménagères : bac vert, ramassage le mardi et vendredi. Tri sélectif : bac jaune. Local poubelles à gauche du portail.", image: "", video: "" },
        { icon: "🌡️", label: "Climatisation", desc: "Climatiseurs dans chaque chambre. Télécommande murale. Merci d'éteindre en quittant la maison pour économiser l'énergie.", image: "", video: "" },
        { icon: "🏊", label: "Piscine", desc: "Piscine accessible de 8h à 20h. Douche obligatoire avant baignade. Surveillez les enfants, la piscine n'est pas sécurisée.", image: "", video: "" },
        { icon: "🚨", label: "Urgences & contacts", desc: "SAMU 15 · Police 17 · Pompiers 18 · Numéro européen 112.\nPropriétaire : +262 6 93 80 22 01 (appel ou WhatsApp).", image: "", video: "" },
      ],
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "intro", label: "Texte d'introduction", type: "textarea" },
      {
        key: "items", label: "Rubriques du livret", type: "repeater", addLabel: "+ Ajouter une rubrique", ai: true,
        item: [
          { key: "icon", label: "Icône (emoji)", type: "text", placeholder: "📶" },
          { key: "label", label: "Titre de la rubrique", type: "text", placeholder: "Wi-Fi" },
          { key: "desc", label: "Description (s'affiche au clic)", type: "textarea" },
          { key: "image", label: "Photo (optionnel)", type: "image" },
          { key: "video", label: "Vidéo explicative (YouTube/Vimeo, optionnel)", type: "url" },
        ],
      },
    ],
  },
  {
    type: "rules", name: "Règles de la maison", icon: "📋", category: "Contenu",
    defaults: {
      title: "Règles de la maison",
      checkin: "15:00 – 22:00",
      checkout: "jusqu'à 11:00",
      cancel: "Annulation gratuite jusqu'à 48 h avant l'arrivée.",
      items: [
        { icon: "🎂", name: "Aucune restriction d'âge", desc: "Aucune restriction relative à l'âge ne s'applique pour l'enregistrement." },
        { icon: "🚭", name: "Fumeurs / Non-fumeurs", desc: "Cet hébergement est non-fumeurs." },
        { icon: "🎉", name: "Fêtes", desc: "Les fêtes/événements ne sont pas autorisés." },
        { icon: "🤫", name: "Heures silencieuses", desc: "Les clients doivent éviter de faire du bruit entre 22:00 et 06:00." },
        { icon: "🐾", name: "Animaux domestiques", desc: "Les animaux de compagnie ne sont pas admis au sein de l'établissement." },
      ],
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "checkin", label: "Arrivée (check-in)", type: "text", placeholder: "15:00 – 22:00" },
      { key: "checkout", label: "Départ (check-out)", type: "text", placeholder: "jusqu'à 11:00" },
      { key: "cancel", label: "Politique d'annulation", type: "textarea" },
      {
        key: "items", label: "Règles", type: "repeater", addLabel: "+ Ajouter une règle", ai: true,
        item: [
          { key: "icon", label: "Icône (emoji)", type: "text", placeholder: "🚭" },
          { key: "image", label: "Ou une image (optionnel)", type: "image" },
          { key: "name", label: "Titre de la règle", type: "text" },
          { key: "desc", label: "Détail", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "wifi", name: "Wifi", icon: "📶", category: "Contact",
    defaults: { network: "MonWifi", password: "", note: "" },
    fields: [
      { key: "network", label: "Nom du réseau (SSID)", type: "text" },
      { key: "password", label: "Mot de passe", type: "text" },
      { key: "note", label: "Note (ex : disponible au salon)", type: "text" },
    ],
  },
  {
    type: "offers", name: "Offres spéciales", icon: "🏷️", category: "Conversion",
    defaults: {
      title: "Offres spéciales",
      items: [{ title: "-10% sur votre prochaine visite", desc: "", code: "KARTE10", expires: "", url: "" }],
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      {
        key: "items", label: "Offres", type: "repeater", addLabel: "+ Ajouter une offre", ai: true,
        item: [
          { key: "title", label: "Titre de l'offre", type: "text" },
          { key: "desc", label: "Description", type: "text" },
          { key: "code", label: "Code promo", type: "text" },
          { key: "image", label: "Photo (optionnel)", type: "image" },
          { key: "expires", label: "Expire le (AAAA-MM-JJ)", type: "text", placeholder: "2026-12-31" },
          { key: "url", label: "Lien (optionnel)", type: "url" },
        ],
      },
    ],
  },
  {
    type: "loyalty", name: "Carte de fidélité", icon: "🎁", category: "Conversion",
    defaults: {
      title: "Carte de fidélité",
      reward: "10e visite offerte",
      stamps: "8",
      pin: "1234",
      note: "1 tampon par visite, validé par le commerçant.",
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "reward", label: "Récompense", type: "text", ai: true },
      { key: "stamps", label: "Nombre de tampons requis", type: "text", placeholder: "8" },
      { key: "pin", label: "Code PIN commerçant (validation)", type: "text", placeholder: "4 chiffres" },
      { key: "note", label: "Note affichée", type: "text" },
    ],
  },
  {
    type: "reviews", name: "Laissez un avis", icon: "⭐", category: "Conversion",
    defaults: {
      title: "Votre avis compte",
      text: "Un avis nous aide énormément. Merci !",
      items: [{ platform: "google", url: "" }],
    },
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "text", label: "Message", type: "textarea", ai: true },
      { key: "style", label: "Style d'affichage", type: "select", options: [
        ["boutons", "Boutons"],
        ["tuiles", "Tuiles"],
      ] },
      {
        key: "items", label: "Plateformes", type: "repeater", addLabel: "+ Ajouter une plateforme",
        item: [
          { key: "platform", label: "Plateforme", type: "text", placeholder: "google, tripadvisor, airbnb, booking…" },
          { key: "url", label: "Lien vers la page d'avis", type: "url" },
        ],
      },
    ],
  },
  // --- IA ---
  {
    type: "chatbot", name: "Chatbot IA", icon: "✨", category: "IA",
    defaults: {
      greeting: "Bonjour 👋 Une question ? Je suis l'assistant de cette carte.",
      knowledge: "",
      botName: "",
      avatar: "",
      emoji: "",
    },
    fields: [
      { key: "botName", label: "Nom de l'assistant (ex : Léa, Bistrot Bot…)", type: "text" },
      { key: "avatar", label: "Avatar de l'assistant (photo/logo)", type: "image" },
      { key: "emoji", label: "Ou un emoji à la place de l'avatar (ex : 🤖 🍕 💬)", type: "text" },
      { key: "greeting", label: "Message d'accueil du bot", type: "textarea" },
      { key: "knowledge", label: "Base de connaissances (tout ce que le bot doit savoir : horaires, tarifs, services, accès, politique d'annulation…)", type: "textarea" },
      { key: "siteUrl", label: "Site web source (le bot lira son contenu pour répondre)", type: "url" },
    ],
  },
];

export const BLOCK_MAP: Record<string, BlockDef> = Object.fromEntries(
  BLOCK_DEFS.map((b) => [b.type, b])
);
