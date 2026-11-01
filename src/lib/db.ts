"use client";
// Couche de données unifiée Bazookard.
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
  workspace_id?: string | null;
};
const toCard = (r: Row): Card => ({
  id: r.id, slug: r.slug, title: r.title, themeIndex: r.theme_index,
  custom: r.custom ?? undefined,
  blocks: Array.isArray(r.blocks) ? (r.blocks as Card["blocks"]) : [],
  updatedAt: new Date(r.updated_at).getTime(),
  workspaceId: r.workspace_id ?? null,
});
const CARD_SEL = "id,slug,title,theme_index,custom,blocks,published,updated_at,workspace_id";

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
    .select(CARD_SEL)
    .eq("owner_id", u.user.id)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (data as Row[]).map(toCard);
}

/** Cartes d'un workspace donné (multi-cartes). Repli : carte liée via workspaces.card_id. */
export async function listCardsByWorkspace(workspaceId: string, legacyCardId?: string | null): Promise<Card[]> {
  if (!supabaseEnabled()) return demo.listCardsByWorkspace(workspaceId, legacyCardId);
  const sb = createClient();
  const { data } = await sb.from("cards").select(CARD_SEL)
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  const cards = ((data ?? []) as Row[]).map(toCard);
  // Repli avant backfill SQL : inclut la carte legacy si absente.
  if (legacyCardId && !cards.some((c) => c.id === legacyCardId)) {
    const legacy = await getCard(legacyCardId);
    if (legacy) cards.unshift(legacy);
  }
  return cards;
}

export async function getCard(id: string): Promise<Card | undefined> {
  if (!supabaseEnabled()) return demo.getCard(id);
  const { data } = await createClient().from("cards")
    .select(CARD_SEL)
    .eq("id", id).maybeSingle();
  return data ? toCard(data as Row) : undefined;
}

export async function getCardBySlug(slug: string): Promise<Card | undefined> {
  if (!supabaseEnabled()) return demo.getCardBySlug(slug);
  const { data } = await createClient().from("cards")
    .select(CARD_SEL)
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
    workspace_id: card.workspaceId ?? null,
  });
}

async function insertCard(title: string, themeIndex: number, blocks: Card["blocks"], workspaceId?: string | null): Promise<Card | null> {
  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const slug = demo.slugify(title) + "-" + demo.uid().slice(0, 4);
  const { data, error } = await sb.from("cards")
    .insert({ owner_id: u.user.id, slug, title, theme_index: themeIndex, blocks, workspace_id: workspaceId ?? null })
    .select(CARD_SEL).single();
  if (error || !data) return null;
  return toCard(data as Row);
}

export async function createCard(title = "Ma carte", workspaceId?: string | null): Promise<Card | null> {
  if (!supabaseEnabled()) return demo.createCard(title, workspaceId);
  return insertCard(title, 0, [demo.newBlock("profile"), demo.newBlock("contact"), demo.newBlock("social")], workspaceId);
}

export async function createCardFromTemplate(tpl: CardTemplate, workspaceId?: string | null): Promise<Card | null> {
  if (!supabaseEnabled()) return demo.createCardFromTemplate(tpl, workspaceId);
  return insertCard(tpl.name, tpl.themeIndex, templateBlocks(tpl, demo.uid), workspaceId);
}

export async function createCardFromBlocks(title: string, themeIndex: number, raw: { type: string; data: Record<string, unknown> }[], workspaceId?: string | null): Promise<Card | null> {
  const blocks = raw.map((b) => ({ id: demo.uid(), type: b.type as Card["blocks"][number]["type"], data: b.data }));
  if (!supabaseEnabled()) {
    const card: Card = {
      id: demo.uid(),
      slug: demo.slugify(title) + "-" + demo.uid().slice(0, 4),
      title, themeIndex, blocks, updatedAt: Date.now(), workspaceId: workspaceId ?? null,
    };
    demo.saveCard(card);
    return card;
  }
  return insertCard(title, themeIndex, blocks, workspaceId);
}

export async function cloneCard(id: string, workspaceId?: string | null): Promise<Card | null> {
  const src = await getCard(id);
  if (!src) return null;
  const blocks = src.blocks.map((b) => ({ ...b, id: demo.uid(), data: structuredClone(b.data) }));
  const title = src.title + " (copie)";
  const wsId = workspaceId ?? src.workspaceId ?? null;
  if (!supabaseEnabled()) {
    const card: Card = {
      id: demo.uid(),
      slug: demo.slugify(src.title) + "-" + demo.uid().slice(0, 4),
      title, themeIndex: src.themeIndex, custom: src.custom ? { ...src.custom } : undefined,
      blocks, updatedAt: Date.now(), workspaceId: wsId,
    };
    demo.saveCard(card);
    return card;
  }
  const card = await insertCard(title, src.themeIndex, blocks, wsId);
  if (card && src.custom) { card.custom = { ...src.custom }; await saveCard(card); }
  return card;
}

export async function deleteCard(id: string): Promise<void> {
  if (!supabaseEnabled()) { demo.deleteCard(id); return; }
  await createClient().from("cards").delete().eq("id", id);
}
