// Client Supabase côté navigateur (Phase 1.5+ : active la vraie persistance).
// Tant que les variables d'env ne sont pas définies, l'app tourne en mode DÉMO (localStorage).
import { createBrowserClient } from "@supabase/ssr";

export function supabaseEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
