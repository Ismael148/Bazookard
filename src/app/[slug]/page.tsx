import type { Metadata } from "next";
import PublicCard from "@/components/PublicCard";

// Carte publique à la racine : bazookard.adamkom.com/mon-commerce

type Dict = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

/** Récupère (côté serveur) la carte publiée pour construire l'aperçu de partage. */
async function fetchCard(slug: string): Promise<{ title: string; blocks: Dict[] } | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  try {
    const res = await fetch(
      `${base}/rest/v1/cards?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=title,blocks&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { title: string; blocks: Dict[] }[];
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

/** Métadonnées de partage = contenu de la carte (titre, description, bannière). */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const card = await fetchCard(slug);
  const blocks = Array.isArray(card?.blocks) ? card!.blocks : [];
  const profile = blocks.find((b) => b.type === "profile")?.data as Dict | undefined;
  const banner = blocks.find((b) => b.type === "banner")?.data as Dict | undefined;

  const name = s(profile?.name) || s(card?.title) || "Ma carte";
  const description = s(profile?.bio) || s(profile?.company) || "Découvrez ma carte de visite digitale.";
  const rawImg = s(banner?.image) || s(profile?.photo);
  const image = /^https?:\/\//.test(rawImg) ? rawImg : undefined;
  const url = SITE ? `${SITE}/${slug}` : undefined;

  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      type: "profile",
      url,
      images: image ? [{ url: image, width: 1200, height: 630, alt: name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: name,
      description,
      images: image ? [image] : undefined,
    },
    // pas d'icône Bazookard imposée ici : l'aperçu reste centré sur la carte
  };
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicCard slug={slug} />;
}
