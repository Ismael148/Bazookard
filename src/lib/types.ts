// Types partagés Bazookard (maj 2026-07-19)

export type BlockType =
  | "profile" | "banner" | "avatar" | "headline" | "button" | "social"
  | "splitter" | "contact" | "faq" | "gallery" | "carousel" | "media"
  | "video" | "podcast" | "list" | "iframe" | "product" | "payment"
  | "subscribe" | "appointment" | "feedback" | "testimonial" | "chatbot"
  | "menu" | "offers" | "reviews" | "hours" | "wifi" | "events" | "loyalty" | "equipment" | "around"
  | "reservation" | "form" | "rules" | "welcome";

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

// Personnalisation libre (au-delà des thèmes prédéfinis)
export interface CardCustom {
  bg?: string;        // fond de page
  surface?: string;   // fond des sections
  ink?: string;       // couleur du texte
  accent?: string;    // couleur d'action
  accentInk?: string; // texte sur accent
  font?: string; // clé de CARD_FONTS
  align?: "" | "left" | "center";
  overlay?: number;   // opacité de l'overlay du hero (0–100)
  radius?: number;    // arrondi des sections (0–28 px)
  imgShape?: "" | "carre" | "rond" | "paysage" | "portrait" | "original"; // format des images (galerie/carrousel)
  imgSize?: "" | "s" | "m" | "l";                            // taille des images
  imgShadow?: "" | "douce" | "forte";                        // ombre portée des images
  avatarPos?: "" | "gauche" | "centre" | "droite";           // position de l'avatar du hero
  avatarSize?: number;                                        // taille avatar (50–130 px)
  avatarRing?: boolean;                                       // anneau blanc autour (false = transparent)
  avatarShadow?: boolean;                                     // ombre portée de l'avatar
}

export const CARD_FONTS: Record<string, { label: string; stack: string }> = {
  sans:    { label: "Moderne (Inter)",        stack: "var(--font-sans), system-ui, sans-serif" },
  display: { label: "Design (Space Grotesk)", stack: "var(--font-display), var(--font-sans), sans-serif" },
  serif:   { label: "Élégante (Serif)",       stack: "Georgia, 'Times New Roman', serif" },
  mono:    { label: "Technique (Mono)",       stack: "'Courier New', ui-monospace, monospace" },
  ronde:   { label: "Ronde (arrondie)",       stack: "ui-rounded, 'Comic Sans MS', 'Segoe UI', system-ui, sans-serif" },
  chic:    { label: "Chic (Didot/Palatino)",  stack: "Didot, 'Palatino Linotype', Palatino, 'Book Antiqua', serif" },
  impact:  { label: "Impact (très gras)",     stack: "'Arial Black', Impact, 'Segoe UI', sans-serif" },
};

export interface Card {
  id: string;
  slug: string;
  title: string;
  themeIndex: number;
  custom?: CardCustom;
  blocks: Block[];
  updatedAt: number;
}

// Palettes (dégradés) — index référencé par card.themeIndex
export const THEMES: [string, string][] = [
  ["#6d5efc", "#a78bfa"],
  ["#0ea5e9", "#22d3ee"],
  ["#f43f5e", "#fb7185"],
  ["#10b981", "#34d399"],
  ["#f59e0b", "#fbbf24"],
  ["#1e293b", "#475569"],
  ["#db2777", "#f472b6"],
  ["#7c3aed", "#c084fc"],
];

export function gradient(themeIndex: number): string {
  const t = THEMES[themeIndex] ?? THEMES[0];
  return `linear-gradient(135deg, ${t[0]}, ${t[1]})`;
}

// ============================================================
// Thèmes complets de la carte publique v2 (mêmes index que THEMES)
// ============================================================
export interface CardTheme {
  name: string;
  dark: boolean;      // ambiance générale de la page
  bg: string;         // fond de page derrière les sections
  surface: string;    // fond des sections (cartes arrondies)
  ink: string;        // texte principal
  soft: string;       // texte secondaire
  line: string;       // bordures fines
  accent: string;     // couleur d'action
  accent2: string;    // fin de dégradé
  accentInk: string;  // texte SUR accent
}

export const CARD_THEMES: CardTheme[] = [
  { name: "Violet",     dark: false, bg: "#F4F2FB", surface: "#FFFFFF", ink: "#1D1A2E", soft: "#6F6A85", line: "#E8E4F5", accent: "#6D5EFC", accent2: "#A78BFA", accentInk: "#FFFFFF" },
  { name: "Océan",      dark: false, bg: "#EFF7FA", surface: "#FFFFFF", ink: "#0F2430", soft: "#5D7A88", line: "#DCEDF3", accent: "#0EA5E9", accent2: "#22D3EE", accentInk: "#FFFFFF" },
  { name: "Corail",     dark: false, bg: "#FBF1F1", surface: "#FFFFFF", ink: "#2E1518", soft: "#8A6469", line: "#F4DFE0", accent: "#F43F5E", accent2: "#FB7185", accentInk: "#FFFFFF" },
  { name: "Émeraude",   dark: false, bg: "#EFF8F3", surface: "#FFFFFF", ink: "#0E241A", soft: "#5E7F6F", line: "#DCEEE4", accent: "#10B981", accent2: "#34D399", accentInk: "#06281C" },
  { name: "Ambre",      dark: false, bg: "#FBF6EE", surface: "#FFFFFF", ink: "#2A1F0E", soft: "#8A7454", line: "#F1E6D3", accent: "#F59E0B", accent2: "#FBBF24", accentInk: "#2A1F0E" },
  { name: "Nuit",       dark: true,  bg: "#0E1116", surface: "#171C24", ink: "#F2F5F9", soft: "#8E99A8", line: "#252C37", accent: "#E2E8F0", accent2: "#94A3B8", accentInk: "#0E1116" },
  { name: "Rose",       dark: false, bg: "#FBF0F6", surface: "#FFFFFF", ink: "#2C1220", soft: "#8A6078", line: "#F3DDE9", accent: "#DB2777", accent2: "#F472B6", accentInk: "#FFFFFF" },
  { name: "Améthyste",  dark: false, bg: "#F5F1FB", surface: "#FFFFFF", ink: "#221533", soft: "#75658C", line: "#E9E1F6", accent: "#7C3AED", accent2: "#C084FC", accentInk: "#FFFFFF" },
];

export function cardTheme(themeIndex: number): CardTheme {
  return CARD_THEMES[themeIndex] ?? CARD_THEMES[0];
}

/** Thème final d'une carte = thème prédéfini + personnalisations libres. */
export function resolveTheme(card: Card): CardTheme {
  const base = cardTheme(card.themeIndex);
  const c = card.custom;
  if (!c) return base;
  return {
    ...base,
    bg: c.bg || base.bg,
    surface: c.surface || base.surface,
    ink: c.ink || base.ink,
    accent: c.accent || base.accent,
    accent2: c.accent || base.accent2,
    accentInk: c.accentInk || base.accentInk,
  };
}
