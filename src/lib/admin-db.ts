"use client";
// Couche ADMIN unifiée : Supabase si configuré, sinon démo localStorage.
// Le compte admin en mode Supabase = le compte connecté (/login).
import { supabaseEnabled, createClient as sb } from "./supabase/client";
import * as demo from "./admin-store";
import { getCard, createCard, saveCard } from "./db";
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
  await sb().from("workspaces").delete().eq("id", id);
}

export async function ensureWorkspaceCard(w: Workspace): Promise<Card | null> {
  if (!supabaseEnabled()) return demo.ensureWorkspaceCard(w);
  if (w.cardId) {
    const existing = await getCard(w.cardId);
    if (existing) return existing;
  }
  const card = await createCard(w.name);
  if (!card) return null;
  card.slug = slugify(w.slug || w.name) + "-" + uid().slice(0, 3);
  await saveCard(card);
  await updateWorkspace({ ...w, cardId: card.id });
  return card;
}

/* ================= ESPACE CLIENT (session unifiée) ================= */
export interface ClientWs {
  id: string; name: string; slug: string; permissions: Permissions; cardId: string | null;
  card: Card | null;
  stats: { view: number; tap: number; chat: number; lead: number } | null;
  leads: { name: string; contact: string; ts: number; id?: string }[];
}
export interface ClientSession {
  client: { id: string; company: string; email: string; logo: string };
  password: string;
  workspaces: ClientWs[];
}

const CSK = "karte_client_session_v2";

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
  const sess = { ...(data as Omit<ClientSession, "password">), password } as ClientSession;
  localStorage.setItem(CSK, JSON.stringify(sess));
  return sess;
}

async function demoClientSession(c: Client, password: string): Promise<ClientSession> {
  const wss = demo.clientWorkspaces(c.id);
  const workspaces: ClientWs[] = [];
  for (const w of wss) {
    const card = w.cardId ? ((await getCard(w.cardId)) ?? null) : null;
    workspaces.push({ id: w.id, name: w.name, slug: w.slug, permissions: w.permissions, cardId: w.cardId ?? null, card, stats: null, leads: [] });
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
  sess.workspaces = sess.workspaces.map((w) => (w.cardId === card.id ? { ...w, card } : w));
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
  const ids = sess.workspaces.map((w) => w.cardId).filter(Boolean) as string[];
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
    // mode démo : retire de la liste locale (par horodatage)
    try {
      const key = `karte_leads_${cardId}`;
      const list = JSON.parse(localStorage.getItem(key) || "[]") as { ts: number }[];
      localStorage.setItem(key, JSON.stringify(list.filter((l) => l.ts !== lead.ts)));
    } catch {}
  }
  // met à jour la copie locale de la session
  sess.workspaces = sess.workspaces.map((w) =>
    w.cardId === cardId ? { ...w, leads: (w.leads ?? []).filter((l) => (lead.id ? l.id !== lead.id : l.ts !== lead.ts)) } : w
  );
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
