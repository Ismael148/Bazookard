// Chatbot IA de la carte publique — répond UNIQUEMENT à partir du contenu
// de la carte + de la base de connaissances injectée par le commerçant.
import { NextResponse } from "next/server";

/** Clé IA du workspace lié à la carte (BYOK) — lue côté serveur uniquement,
 *  via la clé service_role si elle est configurée. Repli : clé globale. */
async function resolveKey(cardId?: string): Promise<string | undefined> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (cardId && url && svc) {
    try {
      const r = await fetch(`${url}/rest/v1/workspaces?card_id=eq.${encodeURIComponent(cardId)}&select=ai_key&limit=1`, {
        headers: { apikey: svc, Authorization: `Bearer ${svc}` }, cache: "no-store",
      });
      if (r.ok) {
        const rows = (await r.json()) as { ai_key: string | null }[];
        const k = rows[0]?.ai_key?.trim();
        if (k) return k;
      }
    } catch {}
  }
  return process.env.OPENAI_API_KEY;
}

/** Contenu texte du site web source (balises supprimées, tronqué). */
async function fetchSiteText(url?: string): Promise<string> {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "BazookardBot/1.0" } });
    if (!r.ok) return "";
    const html = await r.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3500);
  } catch { return ""; }
}

export async function POST(req: Request) {
  let body: { cardId?: string; siteUrl?: string; cardText?: string; knowledge?: string; messages?: { role: string; content: string }[] } = {};
  try { body = await req.json(); } catch {}
  const key = await resolveKey(typeof body.cardId === "string" ? body.cardId : undefined);
  if (!key) return NextResponse.json({ error: "Clé API non configurée." }, { status: 500 });
  const messages = (body.messages ?? []).slice(-10).map((m) => ({
    role: m.role === "assistant" ? "assistant" as const : "user" as const,
    content: String(m.content ?? "").slice(0, 1000),
  }));
  if (!messages.length) return NextResponse.json({ error: "Message vide." }, { status: 400 });

  const system = `Tu es l'assistant de cette entreprise sur sa carte NFC Bazookard. Tu réponds en français, avec chaleur et concision (2-3 phrases max), comme un membre de l'équipe.

CONTENU DE LA CARTE :
${String(body.cardText ?? "").slice(0, 4000)}

BASE DE CONNAISSANCES DU COMMERÇANT :
${String(body.knowledge ?? "").slice(0, 4000)}

CONTENU DU SITE WEB DU COMMERÇANT :
${await fetchSiteText(typeof body.siteUrl === "string" ? body.siteUrl : "")}

Règles strictes : tu ne réponds QU'À PARTIR de ces informations. Si l'information n'y figure pas, dis-le simplement et propose de contacter directement l'entreprise (téléphone/WhatsApp de la carte). N'invente jamais de prix, d'horaires ou d'engagements. Termine quand c'est pertinent par une invitation à l'action (réserver, appeler, passer).`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        max_tokens: 300,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });
    if (!r.ok) return NextResponse.json({ error: "Service IA indisponible." }, { status: 502 });
    const out = await r.json();
    const reply = out.choices?.[0]?.message?.content ?? "Désolé, je n'ai pas pu répondre.";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Réponse impossible pour le moment." }, { status: 500 });
  }
}
