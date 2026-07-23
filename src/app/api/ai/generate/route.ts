// Génération de carte par IA — côté serveur (la clé n'est jamais exposée).
// Entrée : { description } · Sortie : { title, themeIndex, blocks: [{type, data}] }
import { NextResponse } from "next/server";

const ALLOWED = ["profile","banner","headline","button","social","contact","faq","gallery","list","product","subscribe","appointment","testimonial","chatbot","menu","offers","reviews","hours","wifi","events","loyalty","video"];

const SYSTEM = `Tu es le générateur de cartes NFC de Bazookard. À partir de la description d'une activité, tu crées une mini-app complète en JSON STRICT (aucun texte hors JSON).

Format de sortie :
{"title":"Nom de l'activité","themeIndex":0-7,"blocks":[{"type":"...","data":{...}}]}

Thèmes : 0 Violet, 1 Océan, 2 Corail, 3 Émeraude, 4 Ambre, 5 Nuit, 6 Rose, 7 Améthyste. Choisis le plus adapté au métier.

Types de blocs et leurs data :
- profile: {name, title, company, photo:"", bio}
- headline: {title, text}
- contact: {phone:"", email:"", whatsapp:"", wamsg, maps:"", website:""}
- button: {label, url:""}
- social: {items:[{network:"instagram|facebook|tiktok|whatsapp|linkedin|youtube|x", url:"https://...", color:""}]}
- hours: {title:"Horaires", items:[{day:"Lundi", hours:"09:00 - 18:00"}] pour les 7 jours}
- menu: {title, items:[{cat, name, desc, price, image:"", ingredients}]} (restaurants uniquement)
- product: {items:[{title, price, image:"", url:""}]} (prestations/services)
- offers: {title, items:[{title, desc, code, image:"", expires:"", url:""}]}
- reviews: {title, text, items:[{platform:"google", url:"https://google.com/maps"}]}
- loyalty: {title, reward, stamps:"8", pin:"1234", note}
- faq: {items:[{q, a}]} (3-4 questions fréquentes du métier)
- testimonial: {style:"cartes", items:[{name, text, avatar:""}]}
- subscribe: {title, buttonLabel, placeholder:"Votre email"}
- appointment: {title, url:""} (si prise de RDV pertinente)
- wifi: {network, password, note} (hébergements uniquement)
- events: {title, items:[{title, date:"", time, place, url:""}]}
- chatbot: {greeting}

Règles : écris en français, ton chaleureux et professionnel adapté au métier. 8 à 12 blocs, dans un ordre logique (profile d'abord, contact et chatbot vers la fin). Textes courts et percutants. Invente des exemples réalistes (prix, plats, prestations) que l'utilisateur pourra modifier. Laisse les images et URLs vides sauf indication.`;

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "Clé API non configurée (OPENAI_API_KEY)." }, { status: 500 });

  let description = "";
  try { description = String((await req.json()).description ?? "").slice(0, 1200); } catch {}
  if (!description.trim()) return NextResponse.json({ error: "Décris ton activité." }, { status: 400 });

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: description },
        ],
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json({ error: "Erreur du service IA.", detail: err.slice(0, 300) }, { status: 502 });
    }
    const out = await r.json();
    const raw = out.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { title?: string; themeIndex?: number; blocks?: { type: string; data: Record<string, unknown> }[] };

    const blocks = (parsed.blocks ?? [])
      .filter((b) => b && ALLOWED.includes(b.type) && b.data && typeof b.data === "object")
      .slice(0, 16);
    if (!blocks.length) return NextResponse.json({ error: "L'IA n'a pas produit de carte valide, réessaie." }, { status: 502 });

    return NextResponse.json({
      title: String(parsed.title ?? "Ma carte").slice(0, 60),
      themeIndex: Math.min(7, Math.max(0, Number(parsed.themeIndex) || 0)),
      blocks,
    });
  } catch {
    return NextResponse.json({ error: "Génération impossible pour le moment." }, { status: 500 });
  }
}
