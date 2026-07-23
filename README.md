```markdown
# 🚀 Bazookard — Phase 1

<p align="center">
  <b>La plateforme de cartes de visite NFC propulsée par l'IA.</b><br>
  Ce dépôt contient le <b>socle technique</b> : éditeur de carte par blocs, aperçu live, page publique (cible du tag NFC), QR code et export vCard.
</p>

---

👨‍💻 **Agent développeur** : **Zo Lalaina Ismael RAJAOHARIMANANA**  
📌 **Statut** : La Phase 1 fonctionne en **mode démo** (données dans le navigateur via `localStorage`). La base Supabase (authentification + persistance) est câblée et s'active en quelques minutes. L'IA arrivera en Phase 2.

---

## ⚡ Démarrer en local

> **Prérequis** : Node.js 18+

```bash
cd Bazookard
npm install
npm run dev

```

Ouvrez **http://localhost:3000** dans votre navigateur :

* `/` — Page d'accueil
* `/dashboard` — Gestion de vos cartes (création, édition, suppression)
* `/editor/<id>` — Éditeur par blocs avec aperçu mobile en direct
* `/c/<slug>` — Page publique (ce que voit la personne qui scanne le tag NFC)

> 💡 *En mode démo, une carte d'exemple est générée automatiquement à l'adresse `/c/ismael`.*

---

## ⚙️ Comment ça marche ?

1. **Création** : Dans l'éditeur, ajoutez vos éléments grâce à un catalogue de **24 blocs disponibles** (Profil, Contact, Réseaux, Produits, FAQ, Chatbot…).
2. **Prévisualisation** : L'aperçu téléphone s'actualise en temps réel.
3. **Publication** : Votre carte est en ligne sur `/c/<slug>`.
4. **Programmation NFC** : Écrivez l'URL sur votre **tag NFC** via une application mobile (ex. *NFC Tools*). Un simple *Tap* ouvre instantanément la carte.
5. **Fonctionnalités incluses** : La page publique propose le bouton **« Enregistrer le contact »** (fichier vCard) ainsi qu'un **QR code** de secours.

---

## 🗄️ Passer en production (Supabase)

Le mode démo stocke les données localement. Pour activer le système multi-comptes et la persistance globale :

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans le **SQL Editor**, exécutez le script [`supabase/schema.sql`](https://www.google.com/search?q=./supabase/schema.sql) (création des tables, règles de sécurité RLS, profils automatiques).
3. Dupliquez `.env.example` en `.env.local` puis complétez :
```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
NEXT_PUBLIC_SITE_URL=[https://votre-domaine.com](https://votre-domaine.com)

```


4. Activez Supabase dans l'application : `src/lib/store.ts` contient la structure prête (`listCards`, `getCard`, `saveCard`…). Il suffit de basculer leur exécution vers les clients prêts dans `src/lib/supabase/`.

> ℹ️ *Note : L'hébergement LWS Starter gère le domaine et la page vitrine. L'application Next.js est destinée à être déployée sur Vercel.*

---

## 🌐 Déploiement sur Vercel

```bash
npm i -g vercel
vercel

```

*Ou connectez directement ce dépôt GitHub à votre compte Vercel pour bénéficier des déploiements automatiques à chaque commit. Pensez à renseigner les variables d'environnement Supabase dans les paramètres Vercel.*

---

## 📁 Structure du projet

```text
src/
├── app/
│   ├── page.tsx          # Page d'accueil
│   ├── dashboard/        # Gestionnaire de cartes
│   ├── editor/[id]/      # Éditeur par blocs
│   └── c/[slug]/         # Page publique (cible NFC)
├── components/
│   ├── Editor.tsx        # Interface d'édition + aperçu live
│   ├── CardRenderer.tsx  # Composant de rendu (partagé)
│   └── PublicCard.tsx    # Rendu public + QR + vCard
├── lib/
│   ├── types.ts          # Définitions TypeScript + thèmes
│   ├── blocks.ts         # Configuration des 24 blocs
│   ├── store.ts          # Couche données (localStorage)
│   └── supabase/         # Configuration des clients Supabase
supabase/
└── schema.sql            # Schéma PostgreSQL + RLS

```

> **Évolutivité** : Pour ajouter un bloc, il suffit de le déclarer dans `blocks.ts` et d'ajouter le rendu correspondant dans `CardRenderer.tsx`. L'interface d'édition s'adapte automatiquement.

---

## 🤖 Prochaine étape — Phase 2 (IA)

* 🪄 **Générateur complet par IA** : Décrivez votre activité et obtenez une carte structurée.
* ✍️ **Copywriting & Branding IA** : Assistance à la rédaction sur chaque champ (boutons ✨).
* 💬 **Chatbot interactif** : Agent IA directement intégré sur la page publique.
* 🎯 **Gestion des leads** : Qualification et relance automatique par IA.

*(Consultez `../Bazookard-Cahier-des-charges.md` pour le détail des spécifications).*

```

```