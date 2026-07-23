# Activer Supabase (comptes réels + base + stockage)

Sans configuration, Karte tourne en **mode démo** (données dans le navigateur). Pour passer en mode réel, 10 minutes :

## 1. Créer le projet

Va sur https://supabase.com → « New project » (gratuit). Choisis un nom (ex. `karte`), un mot de passe base de données, une région (Europe West).

## 2. Exécuter le schéma

Dans le projet Supabase : **SQL Editor** → « New query » → colle tout le contenu du fichier `supabase/schema.sql` → **Run**. Ça crée les tables (cartes, leads, fidélité, clients, analytics), la sécurité RLS et le bucket d'images.

## 3. Récupérer les clés

**Settings → API** : copie « Project URL » et la clé « anon public ».

## 4. Configurer l'app

À la racine de `tapici/`, crée un fichier `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Relance `npm run dev`.

## 5. Ce qui change automatiquement

- `/login` devient actif : inscription + connexion par email (le dashboard y redirige si non connecté).
- Les cartes sont stockées en base Postgres (visibles de n'importe quel appareil), plus dans le navigateur.
- Les images uploadées partent dans **Supabase Storage** (bucket `karte-images`, servi en CDN public) au lieu d'être encodées localement.
- Les pages publiques `/c/slug` lisent les cartes publiées de la base.

## Notes

- Par défaut Supabase demande une **confirmation d'email** à l'inscription. Pour tester vite : Authentication → Providers → Email → décoche « Confirm email ».
- L'espace **admin/client** (workspaces, permissions, fidélité) reste en mode démo pour l'instant — sa migration Supabase est la prochaine étape (les tables sont déjà prêtes dans le schéma).
- En prod (Vercel), mets les mêmes variables dans Settings → Environment Variables.

## Sprint 4 — à faire une fois

1. **SQL** : ré-exécute `supabase/migration-admin.sql` dans Supabase > SQL Editor (il ajoute `clients.plan` et `workspaces.ai_key`, sans toucher au reste).
2. **Clé IA par workspace (facultatif)** : pour que la clé OpenAI saisie sur un workspace soit utilisée par son chatbot, ajoute la variable `SUPABASE_SERVICE_ROLE_KEY` dans Vercel (Settings > Environment Variables, coche *Sensitive*). Tu la trouves dans Supabase > Settings > API > `service_role`. Sans cette variable, la clé globale `OPENAI_API_KEY` est utilisée pour tout le monde.
