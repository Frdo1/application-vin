# Le Sommelier IA — appli Android

Moteur de recherche de vins français propulsé par Gemini : recherche en langage naturel,
scan d'étiquette, fiche détaillée, cave personnelle et fiches de dégustation.

## Organisation

- `app/`, `components/`, `lib/` : l'appli Android (Expo / React Native).
- `server/` : une fonction Vercel (`/api/sommelier`) qui appelle Gemini.
  **La clé Gemini reste sur le serveur** (variable `GEMINI_API_KEY` sur Vercel) et n'est jamais dans l'APK.
  Dans la v1 (appli web), la clé était lisible dans le code de la page.

## Nouveautés de la v2

- Appli Android native (APK), plus besoin du navigateur.
- Cave par millésime (deux millésimes du même vin = deux lignes), statut **à boire / à garder / à boire vite**
  calculé avec la fenêtre d'apogée, filtres, tri, prix payé, valeur de la cave.
- Cote d'un millésime vérifiée par recherche Google, avec les sources affichées.
- Courbe de garde avec la position du jour.
- Photos d'étiquettes enregistrées en fichiers (la v1 saturait la mémoire du navigateur).
- Lecture fiable des réponses de l'IA (la v1 échouait sur certaines réponses).
- Modèle `gemini-3.8-flash` (modifiable avec la variable `GEMINI_MODEL` sur Vercel).

## Monétisation (v2.1)

- **Gratuit** : 5 demandes à l'IA par jour (recherche, scan d'étiquette, cote), bannière + interstitiel AdMob.
- **Premium** : abonnement Google Play `premium` (forfait de base mensuel) → illimité et sans pub.
- Consentement RGPD (Google UMP), politique de confidentialité : `server/public/confidentialite.html`
  → https://application-vin.vercel.app/confidentialite.html
- Builds `preview` = pubs de test ; `production` = vraies pubs.

## Catalogue (v2.3)

- **Appellations** (`lib/appellations.ts`) : 367 AOP (liste INAO) et 74 IGP, avec leur région. Écran « Parcourir les appellations », hors ligne, et suggestions de saisie.
- **Catalogue partagé** (`server/lib/catalog.ts`) : chaque recherche, vin d'étiquette et cote vérifiée par Gemini est rangé dans une base Redis Upstash. La même demande d'un autre utilisateur est servie sans appeler Gemini. Activation : Vercel → Storage → Upstash for Redis, relié au projet (variables `KV_REST_API_URL` / `KV_REST_API_TOKEN`). Sans base, le serveur fonctionne comme avant.
- Statistiques (vins connus, réponses servies par le catalogue / par Gemini) : `GET https://application-vin.vercel.app/api/sommelier`.

## Déploiement

1. Vercel : projet `application-vin`, **Root Directory = `server`**, variable `GEMINI_API_KEY`.
   Vérification : `https://application-vin.vercel.app/api/sommelier` doit répondre `"configured": true`.
2. APK de test : `npx eas build -p android --profile preview`.
