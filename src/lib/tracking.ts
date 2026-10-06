"use client";
// Tracking Bazookard : vues, taps, chat, leads — démo localStorage / Supabase analytics.
import { supabaseEnabled, createClient } from "./supabase/client";

export type StatEvent = "view" | "tap" | "chat" | "lead";
export interface Stats { view: number; tap: number; chat: number; lead: number }
export interface Lead { name: string; contact: string; ts: number; id?: string }

const SK = (id: string) => `karte_stats_${id}`;
const LK = (id: string) => `karte_leads_${id}`;
const empty = (): Stats => ({ view: 0, tap: 0, chat: 0, lead: 0 });

const DK = (id: string) => `karte_daily_${id}`;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Localisation approximative du visiteur (ville/région) — mise en cache par session. */
async function visitorRegion(): Promise<string> {
  try {
    const cached = sessionStorage.getItem("karte_geo");
    if (cached !== null) return cached;
    const r = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(3500) });
    const j = await r.json();
    const region = j && j.success !== false ? [j.city, j.region].filter(Boolean).join(", ") || (j.country ?? "") : "";
    sessionStorage.setItem("karte_geo", region);
    return region;
  } catch { try { sessionStorage.setItem("karte_geo", ""); } catch {} return ""; }
}

export function trackEvent(cardId: string, event: StatEvent) {
  if (!cardId || cardId.startsWith("preview") || cardId.startsWith("lp-")) return;
  try {
    const st = { ...empty(), ...(JSON.parse(localStorage.getItem(SK(cardId)) || "{}") as Partial<Stats>) };
    st[event] += 1;
    localStorage.setItem(SK(cardId), JSON.stringify(st));
    // série journalière (mode démo)
    const daily = JSON.parse(localStorage.getItem(DK(cardId)) || "{}") as Record<string, Partial<Stats>>;
    const k = dayKey(new Date());
    daily[k] = { ...empty(), ...daily[k] };
    (daily[k] as Stats)[event] += 1;
    localStorage.setItem(DK(cardId), JSON.stringify(daily));
  } catch {}
  void (async () => {
    const region = event === "view" ? await visitorRegion() : (sessionStorage.getItem("karte_geo") ?? "");
    if (supabaseEnabled()) {
      await createClient().from("analytics").insert({ card_id: cardId, event, device: navigator.userAgent.slice(0, 120), region: region || null });
    }
    // mode démo : compteur local par région
    if (event === "view" && region) {
      try {
        const RK = `karte_regions_${cardId}`;
        const map = JSON.parse(localStorage.getItem(RK) || "{}") as Record<string, number>;
        map[region] = (map[region] ?? 0) + 1;
        localStorage.setItem(RK, JSON.stringify(map));
      } catch {}
    }
  })();
}

export async function getStats(cardId: string): Promise<Stats> {
  if (supabaseEnabled()) {
    try {
      const { data } = await createClient().from("analytics").select("event").eq("card_id", cardId).limit(2000);
      const st = empty();
      (data ?? []).forEach((r: { event: string }) => { if (r.event in st) st[r.event as StatEvent] += 1; });
      return st;
    } catch { return empty(); }
  }
  try { return { ...empty(), ...(JSON.parse(localStorage.getItem(SK(cardId)) || "{}") as Partial<Stats>) }; } catch { return empty(); }
}

export function saveLead(cardId: string, name: string, contact: string) {
  trackEvent(cardId, "lead");
  try {
    const list = JSON.parse(localStorage.getItem(LK(cardId)) || "[]") as Lead[];
    list.unshift({ name, contact, ts: Date.now() });
    localStorage.setItem(LK(cardId), JSON.stringify(list.slice(0, 200)));
  } catch {}
  if (supabaseEnabled()) {
    const email = contact.includes("@") ? contact : null;
    const phone = contact.includes("@") ? null : contact;
    void (async () => {
      const sb = createClient();
      // 1) Fonction sécurisée (contourne les RLS de façon fiable)
      const { error } = await sb.rpc("save_lead", { p_card: cardId, p_name: name, p_email: email, p_phone: phone });
      // 2) Repli : insertion directe si la fonction n'existe pas encore
      if (error) {
        await sb.from("leads").insert({ card_id: cardId, name, email, phone, source: "carte" });
      }
    })().catch(() => {});
  }
}

export async function getLeads(cardId: string): Promise<Lead[]> {
  if (supabaseEnabled()) {
    try {
      const { data } = await createClient().from("leads").select("id,name,email,phone,created_at").eq("card_id", cardId).order("created_at", { ascending: false }).limit(100);
      return (data ?? []).map((r: { id: string; name: string | null; email: string | null; phone: string | null; created_at: string }) => ({
        id: r.id, name: r.name ?? "", contact: r.email || r.phone || "", ts: new Date(r.created_at).getTime(),
      }));
    } catch { return []; }
  }
  try { return JSON.parse(localStorage.getItem(LK(cardId)) || "[]") as Lead[]; } catch { return []; }
}

/* ---------- Séries journalières (graphiques) ---------- */
export interface DayStats extends Stats { date: string }

/** Stats jour par jour sur `days` jours (toutes cartes cumulées). */
export async function getDailyStats(cardIds: string[], days = 30): Promise<DayStats[]> {
  const out: Record<string, DayStats> = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const k = dayKey(d);
    out[k] = { date: k, ...empty() };
  }
  if (supabaseEnabled()) {
    try {
      const since = new Date(now); since.setDate(now.getDate() - days);
      const { data } = await createClient().from("analytics")
        .select("event,created_at,card_id")
        .in("card_id", cardIds.slice(0, 100))
        .gte("created_at", since.toISOString())
        .limit(8000);
      (data ?? []).forEach((r: { event: string; created_at: string }) => {
        const k = r.created_at.slice(0, 10);
        if (out[k] && r.event in out[k]) (out[k] as unknown as Record<string, number>)[r.event] += 1;
      });
      return Object.values(out);
    } catch { return Object.values(out); }
  }
  // mode démo : cumul des séries locales
  for (const id of cardIds) {
    try {
      const daily = JSON.parse(localStorage.getItem(DK(id)) || "{}") as Record<string, Partial<Stats>>;
      for (const [k, v] of Object.entries(daily)) {
        if (!out[k]) continue;
        out[k].view += v.view ?? 0; out[k].tap += v.tap ?? 0; out[k].chat += v.chat ?? 0; out[k].lead += v.lead ?? 0;
      }
    } catch {}
  }
  return Object.values(out);
}

/** Top régions des visiteurs (vues), toutes cartes cumulées. */
export async function getRegionStats(cardIds: string[]): Promise<{ label: string; value: number }[]> {
  const acc: Record<string, number> = {};
  if (supabaseEnabled()) {
    try {
      const { data } = await createClient().from("analytics")
        .select("region").in("card_id", cardIds.slice(0, 100))
        .not("region", "is", null).limit(6000);
      (data ?? []).forEach((r: { region: string | null }) => { if (r.region) acc[r.region] = (acc[r.region] ?? 0) + 1; });
    } catch {}
  } else {
    for (const id of cardIds) {
      try {
        const map = JSON.parse(localStorage.getItem(`karte_regions_${id}`) || "{}") as Record<string, number>;
        for (const [k, v] of Object.entries(map)) acc[k] = (acc[k] ?? 0) + v;
      } catch {}
    }
  }
  return Object.entries(acc).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
}
