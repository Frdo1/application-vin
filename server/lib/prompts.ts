// Prompts et format de réponse attendus de Gemini.

export const WINE_SCHEMA_EXAMPLE = `[
  {
    "name": "Nom complet sans millésime (ex : Château Margaux)",
    "vintage": "Millésime si connu (ex : 2015), sinon chaîne vide",
    "region": "Région (ex : Bordeaux)",
    "appellation": "Appellation (ex : Margaux)",
    "type": "Rouge | Blanc | Rosé | Champagne | Effervescent | Vin Doux",
    "grapeVarieties": ["Cépage 1", "Cépage 2"],
    "priceRange": "Prix public indicatif d'une bouteille 75 cl, en euros (ex : 25-35 €)",
    "description": "Description experte en 2 ou 3 phrases.",
    "tastingNotes": { "nose": ["Arôme 1", "Arôme 2", "Arôme 3"], "mouth": ["Saveur 1", "Saveur 2", "Texture"] },
    "foodPairing": [{ "name": "Plat précis (ex : Tournedos Rossini)" }],
    "bestVintages": ["2019", "2016", "2015"],
    "agingPotential": "Ex : 10-20 ans",
    "peakStart": 5,
    "peakEnd": 20,
    "servingTemp": "Ex : 16-18 °C",
    "alcoholContent": "Ex : 13,5 %"
  }
]`;

export function searchPrompt(query: string, exclude: string[]) {
  const excl = exclude.length
    ? `Ne propose PAS ces vins, déjà affichés : ${JSON.stringify(exclude.slice(0, 60))}. Propose 6 AUTRES vins pertinents.`
    : '';
  return `Rôle : sommelier expert des vins français.
Tâche : propose 6 vins réels et pertinents pour la recherche : "${query}".
${excl}
Règles :
- Uniquement des vins qui existent réellement ; n'invente jamais de domaine.
- Prix : fourchette réaliste du prix public constaté en France ; si tu n'es pas sûr, élargis la fourchette.
- peakStart et peakEnd sont des nombres d'années après le millésime.
- Réponds UNIQUEMENT avec un tableau JSON de cette forme :
${WINE_SCHEMA_EXAMPLE}`;
}

export const LABEL_PROMPT = `Tâche : identifie le vin sur cette photo d'étiquette.
1. Lis l'étiquette : domaine / château, cuvée, appellation, millésime.
2. Si la recherche Google est disponible, utilise-la pour vérifier le vin et trouver son prix actuel constaté en France pour ce millésime, ainsi que son potentiel de garde.
3. Si l'étiquette est illisible ou si ce n'est pas un vin, réponds [].
Réponds UNIQUEMENT avec un tableau JSON contenant un seul vin, de cette forme :
${WINE_SCHEMA_EXAMPLE}`;

export function pricePrompt(name: string, vintage: string) {
  return `Trouve (avec la recherche Google si elle est disponible) le prix actuel constaté en France d'une bouteille 75 cl de "${name}", millésime ${vintage}.
Réponds UNIQUEMENT avec un objet JSON : {"price": "fourchette courte en euros, ex : 120-140 €", "source": "nom du site principal consulté"}.
Si tu ne trouves rien de fiable : {"price": "", "source": ""}.`;
}
