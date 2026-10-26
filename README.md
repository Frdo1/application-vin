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

## Déploiement

1. Vercel : projet `application-vin`, **Root Directory = `server`**, variable `GEMINI_API_KEY`.
   Vérification : `https://application-vin.vercel.app/api/sommelier` doit répondre `"configured": true`.
2. APK de test : `npx eas build -p android --profile preview`.
