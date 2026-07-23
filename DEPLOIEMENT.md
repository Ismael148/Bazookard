# Mettre Karte en ligne sur karte.adamkom.com

## ⚠️ Prérequis important : Node.js obligatoire

Karte est une application **Next.js** : elle a besoin d'un serveur **Node.js 20+** pour tourner (rendu serveur + routes IA `/api/ai/*`). Un hébergement mutualisé **PHP classique (type LWS Starter) ne peut PAS l'exécuter**.

Trois options :

1. **VPS ou hébergement Node chez ton hébergeur** (recommandé si tu restes chez lui) — beaucoup d'hébergeurs (LWS VPS, o2switch Node, cPanel « Setup Node.js App »…) le proposent.
2. **Vercel gratuit + ton domaine** : l'app tourne chez Vercel mais reste accessible sur karte.adamkom.com (simple CNAME). C'est le plus simple et gratuit.
3. Railway / Render (Node managé, quelques euros/mois).

## Option 1 — Sur ton serveur Node (VPS / cPanel Node)

```bash
# 1. Copier le dossier tapici/ sur le serveur (sans node_modules ni .next)
# 2. Sur le serveur :
cd tapici
npm install
npm run build
npm start          # démarre sur le port 3000
```

- Garde le processus vivant avec **pm2** : `npm i -g pm2 && pm2 start npm --name karte -- start && pm2 save`
- Mets un **reverse proxy** (Apache/Nginx fourni par l'hébergeur) : karte.adamkom.com → localhost:3000
- **Variables d'environnement** sur le serveur (fichier `.env.local` à la racine, jamais commité) :

```
OPENAI_API_KEY=ta_cle_regeneree
NEXT_PUBLIC_SITE_URL=http://karte.adamkom.com
# + Supabase quand activé :
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Option 2 — Vercel + domaine karte.adamkom.com

1. Pousse `tapici/` sur un dépôt GitHub → importe-le sur vercel.com (build auto).
2. Ajoute les variables d'environnement dans Vercel (mêmes que ci-dessus).
3. Vercel → Settings → Domains → ajoute `karte.adamkom.com`.
4. Chez ton hébergeur (zone DNS de adamkom.com) : crée un **CNAME** `karte` → `cname.vercel-dns.com`.
5. HTTPS automatique. Le site reste 100 % sur ton domaine.

## Check-list avant lancement

- [ ] **Régénérer la clé OpenAI** (elle a transité par le chat) et la mettre uniquement sur le serveur.
- [ ] Activer **Supabase** (voir SETUP-SUPABASE.md) pour les vrais comptes, sinon les données restent dans le navigateur de chaque visiteur.
- [ ] Passer en **HTTPS** (obligatoire pour un site pro ; Vercel le fait seul, sinon Let's Encrypt chez l'hébergeur).
- [ ] Tester : landing, /dashboard, génération IA, chatbot, /admin, /client, une carte publique sur téléphone (tap NFC réel).
- [ ] Écrire l'URL publique d'une carte (ex. http://karte.adamkom.com/c/mon-slug) sur les tags NFC avec l'app « NFC Tools ».
