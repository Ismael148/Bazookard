"use client";
// Couche de données unifiée Karte.
// Supabase configuré (.env.local) → vraie base + auth.
// Sinon → mode DÉMO localStorage (src/lib/store.ts). Même API partout.
import { supabaseEnabled, createClient } from "./supabase/client";
import * as demo from "./store";
import { templateBlocks, type CardTemplate } from "./templates";
import type { Card } from "./types";

export { supabaseEnabled };

/* ---------- Mapping ligne SQL <-> Card ---------- */
type Row = {
  id: string; slug: string; title: string; theme_index: number;
  custom?: Card["custom"] | null; blocks: unknown; published: boolean; updated_at: string;
};
const toCard = (r: Row): Card => ({
  id: r.id, slug: r.slug, title: r.title, themeIndex: r.theme_index,
  custom: r.custom ?? undefined,
  blocks: Array.isArray(r.blocks) ? (r.blocks as Card["blocks"]) : [],
  updatedAt: new Date(r.updated_at).getTime(),
});

/* ---------- Session ---------- */
export async function currentUser() {
  if (!supabaseEnabled()) return null;
  const { data } = await createClient().auth.getUser();
  return data.user ?? null;
}
export async function signOut() {
  if (supabaseEnabled()) await createClient().auth.signOut();
}

/* ---------- Cartes ---------- */
export async function listCards(): Promise<Card[]> {
  if (!supabaseEnabled()) return demo.listCards();
  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return [];
  const { data, error } = await sb.from("cards")
    .select("id,slug,title,theme_index,custom,blocks,published,updated_at")
    .eq("owner_id", u.user.id)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as Row[]).map(toCard);
}

export async function getCard(id: string): Promise<Card | undefined> {
  if (!supabaseEnabled()) return demo.getCard(id);
  const { data } = await createClient().from("cards")
    .select("id,slug,title,theme_index,custom,blocks,published,updated_at")
    .eq("id", id).maybeSingle();
  return data ? toCard(data as Row) : undefined;
}

export async function getCardBySlug(slug: string): Promise<Card | undefined> {
  if (!supabaseEnabled()) return demo.getCardBySlug(slug);
  const { data } = await createClient().from("cards")
    .select("id,slug,title,theme_index,custom,blocks,published,updated_at")
    .eq("slug", slug).eq("published", true).maybeSingle();
  return data ? toCard(data as Row) : undefined;
}

export async function saveCard(card: Card): Promise<void> {
  if (!supabaseEnabled()) { demo.saveCard(card); return; }
  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return;
  await sb.from("cards").upsert({
    id: card.id, owner_id: u.user.id, slug: card.slug, title: card.title,
    theme_index: card.themeIndex, custom: card.custom ?? null, blocks: card.blocks,
  });
}

async function insertCard(title: string, themeIndex: number, blocks: Card["blocks"]): Promise<Card | null> {
  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const slug = demo.slugify(title) + "-" + demo.uid().slice(0, 4);
  const { data, error } = await sb.from("cards")
    .insert({ owner_id: u.user.id, slug, title, theme_index: themeIndex, blocks })
    .select("id,slug,title,theme_index,custom,blocks,published,updated_at").single();
  if (error || !data) return null;
  return toCard(data as Row);
}

export async function createCard(title = "Ma carte"): Promise<Card | null> {
  if (!supabaseEnabled()) return demo.createCard(title);
  return insertCard(title, 0, [demo.newBlock("profile"), demo.newBlock("contact"), demo.newBlock("social")]);
}

export async function createCardFromTemplate(tpl: CardTemplate): Promise<Card | null> {
  if (!supabaseEnabled()) return demo.createCardFromTemplate(tpl);
  return insertCard(tpl.name, tpl.themeIndex, templateBlocks(tpl, demo.uid));
}

export async function createCardFromBlocks(title: string, themeIndex: number, raw: { type: string; data: Record<string, unknown> }[]): Promise<Card | null> {
  const blocks = raw.map((b) => ({ id: demo.uid(), type: b.type as Card["blocks"][number]["type"], data: b.data }));
  if (!supabaseEnabled()) {
    const card: Card = {
      id: demo.uid(),
      slug: demo.slugify(title) + "-" + demo.uid().slice(0, 4),
      title, themeIndex, blocks, updatedAt: Date.now(),
    };
    demo.saveCard(card);
    return card;
  }
  return insertCard(title, themeIndex, blocks);
}

export async function cloneCard(id: string): Promise<Card | null> {
  const src = await getCard(id);
  if (!src) return null;
  const blocks = src.blocks.map((b) => ({ ...b, id: demo.uid(), data: structuredClone(b.data) }));
  const title = src.title + " (copie)";
  if (!supabaseEnabled()) {
    const card: Card = {
      id: demo.uid(),
      slug: demo.slugify(src.title) + "-" + demo.uid().slice(0, 4),
      title, themeIndex: src.themeIndex, custom: src.custom ? { ...src.custom } : undefined,
      blocks, updatedAt: Date.now(),
    };
    demo.saveCard(card);
    return card;
  }
  return insertCard(title, src.themeIndex, blocks);
}

export async function deleteCard(id: string): Promise<void> {
  if (!supabaseEnabled()) { demo.deleteCard(id); return; }
  await createClient().from("cards").delete().eq("id", id);
}
