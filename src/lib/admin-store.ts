"use client";
// Données du back-office ADMIN — mode démo (localStorage).
// Remplaçable par Supabase en prod (mêmes signatures).

import { createCard, getCard, saveCard, slugify, uid as cardUid } from "./store";
import type { Card } from "./types";

export interface Client {
  id: string;
  company: string;
  email: string;
  password: string;
  logo?: string;      // logo / image du client
  plan?: PlanKey;     // abonnement → quota de cartes
  createdAt: number;
}

/* ---------- Abonnements & quotas de cartes ---------- */
export type PlanKey = "solo" | "pro" | "business";
export const PLANS: Record<PlanKey, { label: string; quota: number; price: string }> = {
  solo:     { label: "Solo — 1 carte",       quota: 1,  price: "27€/mois" },
  pro:      { label: "Pro — 10 cartes",      quota: 10, price: "56€/mois" },
  business: { label: "Business — 20 cartes", quota: 20, price: "dès 127€/mois" },
};
export const planQuota = (p?: PlanKey): number => PLANS[p ?? "solo"]?.quota ?? 1;
export const planLabel = (p?: PlanKey): string => PLANS[p ?? "solo"]?.label ?? PLANS.solo.label;

export interface Permissions {
  editText: boolean;       // peut éditer textes & images
  editStructure: boolean;  // peut ajouter / supprimer des sections
  publish: boolean;        // peut publier / dépublier
  viewLeads: boolean;      // peut voir leads & analytics
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  clientId: string | null;
  cardId?: string | null;   // carte liée (éditable par le client selon permissions)
  permissions: Permissions;
  aiKey?: string;           // clé API IA dédiée à ce workspace (BYOK, facultatif)
  createdAt: number;
}

export interface Template {
  id: string;
  name: string;
  niche: string;
  themeIndex: number;
  accent: [string, string];
  builtin?: boolean;
}

const CK = "karte_clients";
const WK = "karte_workspaces";
const TK = "karte_templates";
const SK = "karte_admin_session";

const uid = () => Math.random().toString(36).slice(2, 10);
export const defaultPerms = (): Permissions => ({ editText: true, editStructure: false, publish: false, viewLeads: true });

function get<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) { localStorage.setItem(key, JSON.stringify(seed)); return seed; }
    return JSON.parse(raw) as T[];
  } catch { return []; }
}
function set<T>(key: string, v: T[]) { if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(v)); }

/* ---------- Compte & session admin (réel, local) ---------- */
const AK = "karte_admin_account";
export function adminAccount(): { email: string; password: string } | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(AK); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function adminRegister(email: string, password: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AK, JSON.stringify({ email: email.trim(), password }));
  localStorage.setItem(SK, JSON.stringify({ email: email.trim(), at: Date.now() }));
}
export function adminLogin(email: string, password: string): boolean {
  const acc = adminAccount();
  if (!acc || acc.email.toLowerCase() !== email.trim().toLowerCase() || acc.password !== password) return false;
  if (typeof window !== "undefined") localStorage.setItem(SK, JSON.stringify({ email, at: Date.now() }));
  return true;
}
export function adminLogout() { if (typeof window !== "undefined") localStorage.removeItem(SK); }
export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(SK));
}

/* ---------- Session client (démo) ---------- */
const CSK = "karte_client_session";
export function clientLogin(email: string, password: string): Client | null {
  const c = listClients().find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!c || c.password !== password) return null;
  if (typeof window !== "undefined") localStorage.setItem(CSK, JSON.stringify({ clientId: c.id, at: Date.now() }));
  return c;
}
export function clientLogout() { if (typeof window !== "undefined") localStorage.removeItem(CSK); }
export function currentClient(): Client | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CSK);
    if (!raw) return null;
    const { clientId } = JSON.parse(raw) as { clientId: string };
    return listClients().find((c) => c.id === clientId) ?? null;
  } catch { return null; }
}
export function clientWorkspaces(clientId: string): Workspace[] {
  return listWorkspaces().filter((w) => w.clientId === clientId);
}

/* ---------- Carte liée à un workspace ---------- */
export function ensureWorkspaceCard(w: Workspace): Card {
  if (w.cardId) {
    const existing = getCard(w.cardId);
    if (existing) return existing;
  }
  const card = createCard(w.name);
  card.slug = slugify(w.slug || w.name) + "-" + cardUid().slice(0, 3);
  saveCard(card);
  updateWorkspace({ ...w, cardId: card.id });
  return card;
}
export function workspaceByCardId(cardId: string): Workspace | undefined {
  return listWorkspaces().find((w) => w.cardId === cardId);
}

/* ---------- Clients ---------- */
export function listClients(): Client[] {
  return get<Client>(CK, []).sort((a, b) => b.createdAt - a.createdAt);
}
export function createClient(company: string, email: string, password: string, logo = "", plan: PlanKey = "solo"): Client {
  const list = listClients();
  const c: Client = { id: uid(), company, email, password, logo, plan, createdAt: Date.now() };
  set(CK, [...list, c]);
  return c;
}
export function updateClient(c: Client) { set(CK, listClients().map((x) => (x.id === c.id ? c : x))); }
export function deleteClient(id: string) {
  set(CK, listClients().filter((c) => c.id !== id));
  // détache les workspaces de ce client
  set(WK, listWorkspaces().map((w) => (w.clientId === id ? { ...w, clientId: null } : w)));
}

/* ---------- Workspaces ---------- */
export function listWorkspaces(): Workspace[] {
  return get<Workspace>(WK, []).sort((a, b) => b.createdAt - a.createdAt);
}
export function createWorkspace(name: string, slug: string): Workspace {
  const w: Workspace = { id: uid(), name, slug: slug || "espace-" + uid().slice(0, 4), clientId: null, permissions: defaultPerms(), createdAt: Date.now() };
  set(WK, [...listWorkspaces(), w]);
  return w;
}
export function updateWorkspace(w: Workspace) { set(WK, listWorkspaces().map((x) => (x.id === w.id ? w : x))); }
export function deleteWorkspace(id: string) { set(WK, listWorkspaces().filter((w) => w.id !== id)); }

/* ---------- Templates ---------- */
const BUILTIN: Template[] = [
  { id: "t-resto", name: "Restaurant", niche: "Restauration", themeIndex: 4, accent: ["#f97316", "#fb7185"], builtin: true },
  { id: "t-immo", name: "Immobilier", niche: "Immobilier", themeIndex: 1, accent: ["#0ea5e9", "#22d3ee"], builtin: true },
  { id: "t-coach", name: "Coach", niche: "Coaching", themeIndex: 0, accent: ["#6d5efc", "#a855f7"], builtin: true },
  { id: "t-salon", name: "Salon & Spa", niche: "Beauté", themeIndex: 6, accent: ["#db2777", "#f472b6"], builtin: true },
  { id: "t-ecom", name: "E-commerce", niche: "Commerce", themeIndex: 3, accent: ["#10b981", "#34d399"], builtin: true },
  { id: "t-free", name: "Freelance", niche: "Services", themeIndex: 7, accent: ["#7c3aed", "#c084fc"], builtin: true },
  { id: "t-event", name: "Événement", niche: "Événementiel", themeIndex: 2, accent: ["#f43f5e", "#fb7185"], builtin: true },
  { id: "t-sante", name: "Santé", niche: "Santé", themeIndex: 5, accent: ["#1e293b", "#475569"], builtin: true },
];
export function listTemplates(): Template[] {
  const saved = get<Template>(TK, []);
  return [...BUILTIN, ...saved];
}
export function saveWorkspaceAsTemplate(w: Workspace, name: string): Template {
  const saved = get<Template>(TK, []);
  const t: Template = { id: uid(), name, niche: "Personnalisé", themeIndex: 0, accent: ["#6d5efc", "#a855f7"] };
  set(TK, [...saved, t]);
  return t;
}

export function clientName(id: string | null): string {
  if (!id) return "Non assigné";
  return listClients().find((c) => c.id === id)?.company ?? "Client supprimé";
}
