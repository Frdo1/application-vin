
import { GoogleGenAI } from "@google/genai";
import { Wine } from "../types";

// Cette variable est injectée par Vite au moment du build depuis Vercel
const apiKey = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

// Structure JSON modèle à insérer dans le prompt
const jsonStructureReference = `
[
  {
    "name": "Nom complet (ex: Château Margaux 2015)",
    "region": "Région (ex: Bordeaux)",
    "appellation": "Appellation (ex: Margaux)",
    "type": "Rouge" | "Blanc" | "Rosé" | "Champagne",
    "grapeVarieties": ["Cépage 1", "Cépage 2"],
    "priceRange": "Prix moyen (ex: 450€)",
    "description": "Description experte.",
    "tastingNotes": {
      "nose": ["Arôme 1", "Arôme 2", "Arôme 3"],
      "mouth": ["Saveur 1", "Saveur 2", "Texture"]
    },
    "foodPairing": [
      { "name": "Nom du plat gastronomique précis (ex: Tournedos Rossini)" }
    ],
    "bestVintages": ["2015", "2010", "2009"],
    "agingPotential": "10-20 ans",
    "peakStart": 5,
    "peakEnd": 20,
    "servingTemp": "16-18°C",
    "imageUrl": ""
  }
]
`;

// Helper robuste pour extraire le JSON du texte retourné par Gemini
const extractJSON = (text: string): any => {
  try {
    // Tentative 1: Parsing direct
    return JSON.parse(text);
  } catch (e) {
    try {
      // Tentative 2: Extraction entre ```json et ```
      const match = text.match(/```json([\s\S]*?)```/);
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
      // Tentative 3: Extraction du premier array [ ... ]
      const arrayMatch = text.match(/\[([\s\S]*?)\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
       // Tentative 4: Extraction du premier objet { ... } si ce n'est pas un tableau
       const objectMatch = text.match(/\{([\s\S]*?)\}/);
       if (objectMatch) {
         return [JSON.parse(objectMatch[0])]; // On retourne un tableau pour l'uniformité
       }
    } catch (e2) {
      console.error("Echec extraction JSON:", e2);
    }
    return [];
  }
};

// Helper pour générer une image si l'IA n'en trouve pas
const generateFallbackImage = (wineName: string): string => {
  // On nettoie le nom pour la recherche
  const cleanName = wineName.replace(/[^\w\s]/gi, '').trim();
  const query = encodeURIComponent(`${cleanName} bouteille vin`);
  // Service de thumbnailing robuste (Bing) qui ne nécessite pas de clé API côté client pour des usages basiques
  return `https://tse2.mm.bing.net/th?q=${query}&w=500&h=700&c=7&rs=1&p=0`;
};

export const searchWines = async (query: string): Promise<Wine[]> => {
  if (!apiKey || !ai) {
    console.error("API Key is missing in searchWines");
    throw new Error("MISSING_API_KEY");
  }

  try {
    // Prompt optimisé pour la vitesse (Google Search retiré pour gagner ~3s de latence)
    const prompt = `
      Rôle : Sommelier Expert.
      Tâche : Suggère 3 vins pertinents pour la recherche "${query}".
      
      Instructions :
      1. Sélectionne les 3 meilleures options.
      2. Fournis une estimation réaliste du prix.
      3. Sois précis sur les cépages et les accords mets-vins.

      IMPORTANT : Réponds UNIQUEMENT avec un tableau JSON respectant cette structure :
      ${jsonStructureReference}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        // OPTIMISATION PERFORMANCE :
        // 1. Suppression de 'tools: [{ googleSearch: {} }]' pour la recherche textuelle simple.
        //    Le modèle 2.5-Flash est assez rapide et compétent pour les connaissances générales sur le vin sans recherche web.
        // 2. Activation du 'responseMimeType: application/json' pour garantir la structure et la vitesse de parsing.
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsedData = extractJSON(response.text || "[]");
    
    if (Array.isArray(parsedData)) {
        // Post-traitement pour garantir les images via le fallback rapide
        return parsedData.map((wine: any) => {
            const hasValidImage = wine.imageUrl && wine.imageUrl.startsWith('http');
            return {
                ...wine,
                imageUrl: hasValidImage ? wine.imageUrl : generateFallbackImage(wine.name)
            };
        }) as Wine[];
    }
    return [];

  } catch (error) {
    console.error("Erreur Sommelier Search:", error);
    throw error;
  }
};

export const analyzeLabel = async (imageBase64: string): Promise<Wine[]> => {
  if (!apiKey || !ai) {
    console.error("API Key is missing in analyzeLabel");
    throw new Error("MISSING_API_KEY");
  }

  try {
    // COMBINAISON VISION + GROUNDING (Google Search) conservée pour la précision de l'analyse d'image
    const prompt = `
      Tâche : Analyse experte d'étiquette de vin à partir de l'image.
      
      Instructions :
      1. VISION : Lis l'étiquette (Nom, Domaine, Millésime, Appellation).
      2. RECHERCHE (Grounding) : Cherche sur le Web le PRIX ACTUEL, les notes critiques, et le potentiel de garde pour CE millésime précis.
      3. SYNTHÈSE : Compile les infos.
      4. ACCORDS : Propose des plats gastronomiques précis.

      IMPORTANT : Tu DOIS répondre UNIQUEMENT avec un tableau JSON respectant cette structure :
      ${jsonStructureReference}
    `;

    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        // On garde Google Search ici car l'identification précise d'une étiquette (millésime/domaine) bénéficie grandement du Web.
        tools: [{ googleSearch: {} }],
      },
    });

    const wines = extractJSON(response.text || "[]");
    return Array.isArray(wines) ? wines : [wines];

  } catch (error) {
    console.error("Erreur Analyse Image:", error);
    throw new Error("Impossible d'analyser l'image ou de trouver les informations.");
  }
};
