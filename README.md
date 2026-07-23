# Tapici — Phase 1

La plateforme de cartes de visite NFC propulsée par l'IA. Ce dépôt contient le **socle technique** : éditeur de carte par blocs, aperçu live, page publique (cible du tag NFC), QR code et export vCard.

> **Statut** : Phase 1 fonctionne en **mode démo** (données dans le navigateur, `localStorage`). La base Supabase (auth + persistance) est déjà câblée et s'active en quelques minutes (voir plus bas). L'IA arrive en Phase 2.

---

## Démarrer en local

Prérequis : **Node.js 18+**.

```bash
cd tapici
npm install
npm run dev
```

Ouvre http://localhost:3000

- `/` — page d'accueil
- `/dashboard` — tes cartes (crée, édite, supprime)
- `/editor/<id>` — l'éditeur par blocs avec aperçu téléphone
- `/c/<slug>` — la page publique (ce que voit la personne qui tape ton tag NFC)

En mode démo, une carte d'exemple est créée automatiquement (`/c/ismael`).

---

## Comment ça marche

1. Dans l'éditeur, tu ajoutes des **blocs** (Profil, Contact, Réseaux, Produits, FAQ, Chatbot…) — 24 blocs disponibles.
2. L'**aperçu téléphone** se met à jour en direct.
3. Tu publies : la carte est accessible à `/c/<slug>`.
4. Tu écris cette URL sur un **tag NFC** avec une app gratuite (ex. *NFC Tools*). Au Tap, le téléphone ouvre la carte.
5. La page publique propose **Enregistrer le contact** (vCard) et un **QR code** de secours.

---

## Passer en production (Supabase)

Le mode démo stocke tout dans le navigateur. Pour de vrais comptes et une vraie base partagée :

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécute le contenu de [`supabase/schema.sql`](./supabase/schema.sql) (tables, sécurité RLS, création auto de profil).
3. Copie `.env.example` vers `.env.local` et renseigne :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SITE_URL=https://ton-domaine.com
   ```
4. Branche la couche données sur Supabase : `src/lib/store.ts` expose exactement les mêmes fonctions (`listCards`, `getCard`, `saveCard`…). Il suffit de remplacer leur corps par des appels Supabase (les clients sont prêts dans `src/lib/supabase/`).

> Note : ton hébergement **LWS Starter** sert au domaine et à la page de vente. L'app Next.js se déploie sur Vercel.

---

## Déployer sur Vercel

```bash
npm i -g vercel
vercel
```

Ou connecte le repo GitHub à Vercel (déploiement auto à chaque push). Ajoute les variables d'environnement Supabase dans le dashboard Vercel.

---

## Structure

```
src/
  app/
    page.tsx              page d'accueil
    dashboard/            liste des cartes
    editor/[id]/          éditeur par blocs
    c/[slug]/             page publique (cible NFC)
  components/
    Editor.tsx            éditeur + aperçu live
    CardRenderer.tsx      rendu d'une carte (partagé éditeur + public)
    PublicCard.tsx        page publique + QR + vCard
  lib/
    types.ts              types + thèmes
    blocks.ts             catalogue des 24 blocs (schéma)
    store.ts              couche données (démo localStorage)
    supabase/             clients Supabase (prod)
supabase/
  schema.sql              schéma Postgres + RLS
```

Ajouter un nouveau bloc = une entrée dans `blocks.ts` + un cas dans `CardRenderer.tsx`. L'éditeur génère le formulaire automatiquement.

---

## Prochaine étape — Phase 2 (IA)

- Générateur de carte par IA (décris ton activité → carte complète)
- Copywriting & branding IA sur chaque champ (boutons ✨ déjà présents)
- Chatbot IA fonctionnel sur la page publique (bloc déjà présent)
- Qualification & relance des leads par IA

Voir `../Tapici-Cahier-des-charges.md` pour le détail.
