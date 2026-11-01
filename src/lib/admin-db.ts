"use client";
// Couche ADMIN unifiée : Supabase si configuré, sinon démo localStorage.
// Le compte admin en mode Supabase = le compte connecté (/login).
import { supabaseEnabled, createClient as sb } from "./supabase/client";
import * as demo from "./admin-store";
import { getCard, createCard, saveCard, cloneCard, deleteCard, listCardsByWorkspace } from "./db";
import { slugify, uid } from "./store";
import type { Card } from "./types";
import type { Client, Workspace, Permissions, PlanKey } from "./admin-store";

export { supabaseEnabled };
export type { Client, Workspace, Permissions };
export { defaultPerms, clientName, PLANS, planQuota, planLabel } from "./admin-store";
export type { PlanKey } from "./admin-store";

async function me(): Promise<string | null> {
  const { data } = await sb().auth.getUser();
  return data.user?.id ?? null;
}

/* ================= CLIENTS ================= */
type ClientRow = { id: string; company: string; email: string; password: string | null; logo: string | null; plan: string | null; created_at: string };
const toClient = (r: ClientRow): Client => ({
  id: r.id, company: r.company, email: r.email, password: r.password ?? "",
  logo: r.logo ?? "", plan: (r.plan ?? "solo") as PlanKey, createdAt: new Date(r.created_at).getTime(),
});
const CL_SEL = "id,company,email,password,logo,plan,created_at";

export async function listClients(): Promise<Client[]> {
  if (!supabaseEnabled()) return demo.listClients();
  const { data } = await sb().from("clients")
    .select(CL_SEL)
    .order("created_at", { ascending: false });
  return ((data ?? []) as ClientRow[]).map(toClient);
}

export async function createClientAccount(company: string, email: string, password: string, logo = "", plan: PlanKey = "solo"): Promise<Client | null> {
  if (!supabaseEnabled()) return demo.createClient(company, email, password, logo, plan);
  const owner = await me();
  if (!owner) return null;
  const { data, error } = await sb().from("clients")
    .insert({ agency_id: owner, company, email, password, logo, plan })
    .select(CL_SEL).single();
  return error || !data ? null : toClient(data as ClientRow);
}

export async function updateClientAccount(c: Client): Promise<void> {
  if (!supabaseEnabled()) { demo.updateClient(c); return; }
  await sb().from("clients").update({ company: c.company, email: c.email, password: c.password, logo: c.logo ?? "", plan: c.plan ?? "solo" }).eq("id", c.id);
}

export async function deleteClientAccount(id: string): Promise<void> {
  if (!supabaseEnabled()) { demo.deleteClient(id); return; }
  await sb().from("workspaces").update({ client_id: null }).eq("client_id", id);
  await sb().from("clients").delete().eq("id", id);
}

/* ================= WORKSPACES ================= */
type WsRow = { id: string; name: string; client_id: string | null; card_id: string | null; permissions: Permissions | null; created_at: string; custom_domain: string | null; ai_key: string | null };
const toWs = (r: WsRow): Workspace => ({
  id: r.id, name: r.name, slug: r.custom_domain ?? "",
  clientId: r.client_id, cardId: r.card_id,
  permissions: r.permissions ?? demo.defaultPerms(),
  aiKey: r.ai_key ?? "",
  createdAt: new Date(r.created_at).getTime(),
});
const WS_SEL = "id,name,client_id,card_id,permissions,created_at,custom_domain,ai_key";

export async function listWorkspaces(): Promise<Workspace[]> {
  if (!supabaseEnabled()) return demo.listWorkspaces();
  const { data } = await sb().from("workspaces").select(WS_SEL).order("created_at", { ascending: false });
  return ((data ?? []) as WsRow[]).map(toWs);
}

export async function createWorkspace(name: string, slug: string): Promise<Workspace | null> {
  if (!supabaseEnabled()) return demo.createWorkspace(name, slug);
  const owner = await me();
  if (!owner) return null;
  const { data, error } = await sb().from("workspaces")
    .insert({ owner_id: owner, name, custom_domain: slug || slugify(name), permissions: demo.defaultPerms() })
    .select(WS_SEL).single();
  return error || !data ? null : toWs(data as WsRow);
}

export async function updateWorkspace(w: Workspace): Promise<void> {
  if (!supabaseEnabled()) { demo.updateWorkspace(w); return; }
  await sb().from("workspaces").update({
    name: w.name, custom_domain: w.slug, client_id: w.clientId, card_id: w.cardId ?? null, permissions: w.permissions, ai_key: w.aiKey ?? null,
  }).eq("id", w.id);
}

export async function deleteWorkspaceById(id: string): Promise<void> {
  if (!supabaseEnabled()) { demo.deleteWorkspace(id); return; }
  await sb().from("cards").delete().eq("workspace_id", id);
  await sb().from("workspaces").delete().eq("id", id);
}

export async function ensureWorkspaceCard(w: Workspace): Promise<Card | null> {
  if (!supabaseEnabled()) return demo.ensureWorkspaceCard(w);
  if (w.cardId) {
    const existing = await getCard(w.cardId);
    if (existing) return existing;
  }
  const card = await createCard(w.name, w.id);
  if (!card) return null;
  card.slug = slugify(w.slug || w.name) + "-" + uid().slice(0, 3);
  card.workspaceId = w.id;
  await saveCard(card);
  await updateWorkspace({ ...w, cardId: card.id });
  return card;
}

/* ---------- Cartes d'un workspace (côté ADMIN) ---------- */
export async function listWorkspaceCards(w: Workspace): Promise<Card[]> {
  return listCardsByWorkspace(w.id, w.cardId);
}

/** Crée une nouvelle carte dans un workspace (admin). */
export async function createWorkspaceCard(w: Workspace, title = "Nouvelle carte"): Promise<Card | null> {
  const card = await createCard(title, w.id);
  if (!card) return null;
  if (!w.cardId) await updateWorkspace({ ...w, cardId: card.id });
  return card;
}

/** Duplique une carte dans le même workspace (admin). */
export async function duplicateWorkspaceCard(cardId: string, workspaceId: string): Promise<Card | null> {
  return cloneCard(cardId, workspaceId);
}

/** Supprime une carte d'un workspace (admin). */
export async function deleteWorkspaceCard(cardId: string): Promise<void> {
  await deleteCard(cardId);
}

/* ================= ESPACE CLIENT (session unifiée) ================= */
export interface ClientCard extends Card {
  stats: { view: number; tap: number; chat: number; lead: number } | null;
  leads: { name: string; contact: string; ts: number; id?: string }[];
}
export interface ClientWs {
  id: string; name: string; slug: string; permissions: Permissions; cardId: string | null;
  cards: ClientCard[];
}
export interface ClientSession {
  client: { id: string; company: string; email: string; logo: string };
  password: string;
  workspaces: ClientWs[];
}

const CSK = "karte_client_session_v2";

type RawWs = {
  id: string; name: string; slug?: string; permissions?: Permissions; cardId?: string | null;
  cards?: unknown[]; card?: unknown;
};
function toClientWs(w: RawWs): ClientWs {
  const rawCards: Record<string, unknown>[] =
    Array.isArray(w.cards) ? (w.cards as Record<string, unknown>[])
    : (w.card ? [w.card as Record<string, unknown>] : []);
  const cards: ClientCard[] = rawCards.map((cd) => ({
    id: String(cd.id),
    slug: String(cd.slug ?? ""),
    title: String(cd.title ?? "Ma carte"),
    themeIndex: Number(cd.themeIndex ?? 0),
    custom: (cd.custom as Card["custom"]) ?? undefined,
    blocks: Array.isArray(cd.blocks) ? (cd.blocks as Card["blocks"]) : [],
    updatedAt: Number(cd.updatedAt) || Date.now(),
    workspaceId: w.id,
    stats: (cd.stats as ClientCard["stats"]) ?? null,
    leads: Array.isArray(cd.leads) ? (cd.leads as ClientCard["leads"]) : [],
  }));
  return {
    id: w.id, name: w.name, slug: w.slug ?? "",
    permissions: w.permissions ?? demo.defaultPerms(),
    cardId: w.cardId ?? null, cards,
  };
}

export async function clientLoginDb(email: string, password: string): Promise<ClientSession | null> {
  if (!supabaseEnabled()) {
    const c = demo.clientLogin(email, password);
    if (!c) return null;
    const sess = await demoClientSession(c, password);
    localStorage.setItem(CSK, JSON.stringify(sess));
    return sess;
  }
  const { data, error } = await sb().rpc("client_login", { p_email: email, p_password: password });
  if (error || !data) return null;
  const raw = data as { client: ClientSession["client"]; workspaces?: RawWs[] };
  const sess: ClientSession = {
    client: raw.client,
    password,
    workspaces: (raw.workspaces ?? []).map(toClientWs),
  };
  localStorage.setItem(CSK, JSON.stringify(sess));
  return sess;
}

async function demoClientSession(c: Client, password: string): Promise<ClientSession> {
  const wss = demo.clientWorkspaces(c.id);
  const workspaces: ClientWs[] = [];
  for (const w of wss) {
    const cards = await listCardsByWorkspace(w.id, w.cardId);
    workspaces.push({
      id: w.id, name: w.name, slug: w.slug, permissions: w.permissions, cardId: w.cardId ?? null,
      cards: cards.map((card) => ({ ...card, stats: null, leads: [] })),
    });
  }
  return { client: { id: c.id, company: c.company, email: c.email, logo: c.logo ?? "" }, password, workspaces };
}

export function clientSession(): ClientSession | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(CSK); return raw ? (JSON.parse(raw) as ClientSession) : null; } catch { return null; }
}

export function clientLogoutDb() {
  if (typeof window !== "undefined") localStorage.removeItem(CSK);
  demo.clientLogout();
}

/** Toutes les cartes du client, à plat (avec le workspace parent). */
export function allClientCards(sess: ClientSession): { ws: ClientWs; card: ClientCard }[] {
  return sess.workspaces.flatMap((w) => w.cards.map((card) => ({ ws: w, card })));
}

/** Recherche une carte (et son workspace) dans la session par id. */
export function findClientCard(sess: ClientSession, cardId: string): { ws: ClientWs; card: ClientCard } | null {
  for (const w of sess.workspaces) {
    const card = w.cards.find((c) => c.id === cardId);
    if (card) return { ws: w, card };
  }
  return null;
}

/** Quota : nombre total de cartes du client vs. plafond de son abonnement. */
export function clientCardUsage(sess: ClientSession): number {
  return sess.workspaces.reduce((a, w) => a + w.cards.length, 0);
}

type CardActionResult = { ok: boolean; error?: string; quota?: number; id?: string };

/** Création d'une carte par le client (quota + permission vérifiés). */
export async function clientCreateCard(workspaceId: string, title: string): Promise<CardActionResult> {
  const sess = clientSession();
  if (!sess) return { ok: false, error: "auth" };
  if (supabaseEnabled()) {
    const { data, error } = await sb().rpc("client_create_card", {
      p_email: sess.client.email, p_password: sess.password, p_workspace: workspaceId, p_title: title,
    });
    if (error || !data) return { ok: false, error: error?.message || "rpc" };
    return data as CardActionResult;
  }
  // démo : quota via plan du client
  const c = demo.listClients().find((x) => x.id === sess.client.id);
  const quota = demo.planQuota(c?.plan);
  if (clientCardUsage(sess) >= quota) return { ok: false, error: "quota", quota };
  const ws = demo.listWorkspaces().find((w) => w.id === workspaceId);
  if (ws && ws.permissions.manageCards === false) return { ok: false, error: "perm" };
  const card = await createCard(title || "Nouvelle carte", workspaceId);
  return card ? { ok: true, id: card.id } : { ok: false, error: "create" };
}

/** Duplication d'une carte par le client (quota + permission vérifiés). */
export async function clientDuplicateCard(cardId: string): Promise<CardActionResult> {
  const sess = clientSession();
  if (!sess) return { ok: false, error: "auth" };
  if (supabaseEnabled()) {
    const { data, error } = await sb().rpc("client_duplicate_card", {
      p_email: sess.client.email, p_password: sess.password, p_card: cardId,
    });
    if (error || !data) return { ok: false, error: error?.message || "rpc" };
    return data as CardActionResult;
  }
  const found = findClientCard(sess, cardId);
  if (!found) return { ok: false, error: "card" };
  const c = demo.listClients().find((x) => x.id === sess.client.id);
  const quota = demo.planQuota(c?.plan);
  if (clientCardUsage(sess) >= quota) return { ok: false, error: "quota", quota };
  if (found.ws.permissions.manageCards === false) return { ok: false, error: "perm" };
  const card = await cloneCard(cardId, found.ws.id);
  return card ? { ok: true, id: card.id } : { ok: false, error: "create" };
}

/** Suppression d'une carte par le client (garde au moins 1 carte par workspace). */
export async function clientDeleteCard(cardId: string): Promise<CardActionResult> {
  const sess = clientSession();
  if (!sess) return { ok: false, error: "auth" };
  if (supabaseEnabled()) {
    const { data, error } = await sb().rpc("client_delete_card", {
      p_email: sess.client.email, p_password: sess.password, p_card: cardId,
    });
    if (error || !data) return { ok: false, error: error?.message || "rpc" };
    return data as CardActionResult;
  }
  const found = findClientCard(sess, cardId);
  if (!found) return { ok: false, error: "card" };
  if (found.ws.permissions.manageCards === false) return { ok: false, error: "perm" };
  if (found.ws.cards.length <= 1) return { ok: false, error: "last" };
  await deleteCard(cardId);
  return { ok: true };
}

/** Sauvegarde d'une carte par le client (RPC sécurisée en mode Supabase). */
export async function clientSaveCard(card: Card): Promise<boolean> {
  const sess = clientSession();
  if (!sess) return false;
  if (supabaseEnabled()) {
    const { data, error } = await sb().rpc("client_save_card", {
      p_email: sess.client.email, p_password: sess.password, p_card: card.id,
      p_title: card.title, p_blocks: card.blocks, p_theme: card.themeIndex, p_custom: card.custom ?? null,
    });
    if (error || data !== true) return false;
  } else {
    await saveCard(card);
  }
  // met à jour la copie locale de la session
  sess.workspaces = sess.workspaces.map((w) => ({
    ...w,
    cards: w.cards.map((c) => (c.id === card.id ? { ...c, ...card } : c)),
  }));
  localStorage.setItem(CSK, JSON.stringify(sess));
  return true;
}

/** Stats jour par jour des cartes du client connecté (RPC en mode Supabase). */
export async function clientDailyStats(days = 30): Promise<{ date: string; view: number; tap: number; chat: number; lead: number }[]> {
  const sess = clientSession();
  if (!sess) return [];
  const skel: Record<string, { date: string; view: number; tap: number; chat: number; lead: number }> = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    skel[k] = { date: k, view: 0, tap: 0, chat: 0, lead: 0 };
  }
  if (supabaseEnabled()) {
    try {
      const { data } = await sb().rpc("client_daily_stats", { p_email: sess.client.email, p_password: sess.password, p_days: days });
      ((data ?? []) as { date: string; view: number; tap: number; chat: number; lead: number }[]).forEach((r) => {
        if (skel[r.date]) skel[r.date] = { date: r.date, view: Number(r.view), tap: Number(r.tap), chat: Number(r.chat), lead: Number(r.lead) };
      });
      return Object.values(skel);
    } catch { return Object.values(skel); }
  }
  const { getDailyStats } = await import("./tracking");
  const ids = allClientCards(sess).map((x) => x.card.id);
  return getDailyStats(ids, days);
}

/** Suppression d'un message/contact par le client (RPC sécurisée en mode Supabase). */
export async function clientDeleteLead(cardId: string, lead: { id?: string; ts: number }): Promise<boolean> {
  const sess = clientSession();
  if (!sess) return false;
  if (supabaseEnabled()) {
    if (!lead.id) return false;
    const { data, error } = await sb().rpc("client_delete_lead", {
      p_email: sess.client.email, p_password: sess.password, p_lead: lead.id,
    });
    if (error || data !== true) return false;
  } else {
    try {
      const key = `karte_leads_${cardId}`;
      const list = JSON.parse(localStorage.getItem(key) || "[]") as { ts: number }[];
      localStorage.setItem(key, JSON.stringify(list.filter((l) => l.ts !== lead.ts)));
    } catch {}
  }
  // met à jour la copie locale de la session
  sess.workspaces = sess.workspaces.map((w) => ({
    ...w,
    cards: w.cards.map((c) =>
      c.id === cardId ? { ...c, leads: (c.leads ?? []).filter((l) => (lead.id ? l.id !== lead.id : l.ts !== lead.ts)) } : c
    ),
  }));
  try { localStorage.setItem(CSK, JSON.stringify(sess)); } catch {}
  return true;
}

/** Quand le slug d'une carte change, le lien du workspace lié suit automatiquement. */
export async function syncWorkspaceSlug(cardId: string, slug: string): Promise<void> {
  if (!cardId || !slug) return;
  if (supabaseEnabled()) {
    try { await sb().from("workspaces").update({ custom_domain: slug }).eq("card_id", cardId); } catch {}
    return;
  }
  const w = demo.workspaceByCardId(cardId);
  if (w && w.slug !== slug) demo.updateWorkspace({ ...w, slug });
}
