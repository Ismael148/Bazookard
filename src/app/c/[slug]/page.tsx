import { redirect } from "next/navigation";

// Ancien format /c/mon-commerce → redirige vers /mon-commerce
// (compatibilité avec les tags NFC et QR codes déjà imprimés).
export default async function LegacyPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
