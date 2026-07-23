import PublicCard from "@/components/PublicCard";

// Carte publique à la racine : karte.adamkom.com/mon-commerce
export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicCard slug={slug} />;
}
