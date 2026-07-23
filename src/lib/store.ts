"use client";
// Couche de données Karte — mode DÉMO (localStorage).
// En production, ces fonctions seront remplacées par des appels Supabase
// (voir supabase/schema.sql et src/lib/supabase/*). L'API publique reste identique.

import type { Card, Block, BlockType } from "./types";
import { BLOCK_MAP } from "./blocks";
import { templateBlocks, type CardTemplate } from "./templates";

const KEY = "karte_cards";

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40) || "carte";
}

export function newBlock(type: BlockType): Block {
  const def = BLOCK_MAP[type];
  return { id: uid(), type, data: structuredClone(def.defaults) };
}

function read(): Card[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seed = [demoCard()];
      localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Card[];
  } catch {
    return [];
  }
}

function write(cards: Card[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(cards));
}

export function listCards(): Card[] {
  return read().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getCard(id: string): Card | undefined {
  return read().find((c) => c.id === id);
}

export function getCardBySlug(slug: string): Card | undefined {
  return read().find((c) => c.slug === slug);
}

export function saveCard(card: Card) {
  const cards = read();
  const i = cards.findIndex((c) => c.id === card.id);
  card.updatedAt = Date.now();
  if (i >= 0) cards[i] = card;
  else cards.push(card);
  write(cards);
}

export function createCard(title = "Ma carte"): Card {
  const card: Card = {
    id: uid(),
    slug: slugify(title) + "-" + uid().slice(0, 4),
    title,
    themeIndex: 0,
    blocks: [newBlock("profile"), newBlock("contact"), newBlock("social")],
    updatedAt: Date.now(),
  };
  saveCard(card);
  return card;
}

export function createCardFromTemplate(tpl: CardTemplate): Card {
  const card: Card = {
    id: uid(),
    slug: slugify(tpl.name) + "-" + uid().slice(0, 4),
    title: tpl.name,
    themeIndex: tpl.themeIndex,
    blocks: templateBlocks(tpl, uid),
    updatedAt: Date.now(),
  };
  saveCard(card);
  return card;
}

export function deleteCard(id: string) {
  write(read().filter((c) => c.id !== id));
}

function demoCard(): Card {
  const profile = newBlock("profile");
  profile.data = {
    name: "Ismael Z.", title: "Fondateur", company: "Karte",
    photo: "", bio: "La carte de visite NFC la plus intelligente du marché. Tapez pour me sauvegarder.",
  };
  const contact = newBlock("contact");
  contact.data = { phone: "+33600000000", email: "hello@karte.app", whatsapp: "33600000000", wamsg: "Bonjour Ismael !", maps: "", website: "https://karte.app" };
  const social = newBlock("social");
  const chatbot = newBlock("chatbot");
  return {
    id: "demo",
    slug: "ismael",
    title: "Carte démo",
    themeIndex: 0,
    blocks: [profile, contact, social, chatbot],
    updatedAt: Date.now(),
  };
}
