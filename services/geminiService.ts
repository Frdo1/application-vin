
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Wine } from "../types";

// Cette variable est injectée par Vite au moment du build depuis Vercel
const apiKey = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

// Schema strict pour structurer la réponse de l'IA
const wineSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Nom complet du vin ou du domaine incluant la Cuvée." },
    region: { type: Type.STRING, description: "Région viticole précise (ex: Bordeaux, Saint-Estèphe)." },
    appellation: { type: Type.STRING, description: "AOC ou appellation spécifique." },
    type: { 
      type: Type.STRING, 
      enum: ['Rouge', 'Blanc', 'Rosé', 'Champagne', 'Effervescent', 'Vin Doux'],
      description: "Couleur ou type de vin."
    },
    grapeVarieties: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "Liste des cépages principaux." 
    },
    priceRange: { type: Type.STRING, description: "Prix moyen actuel du marché pour ce millésime (ex: 45€)." },
    description: { type: Type.STRING, description: "Description experte du style du vin et du millésime." },
    tastingNotes: {
      type: Type.OBJECT,
      properties: {
        nose: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 arômes précis au nez." },
        mouth: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 caractéristiques en bouche (structure, tanins, finale)." }
      }
    },
    foodPairing: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nom du plat gastronomique en Français." },
          imageKeyword: { type: Type.STRING, description: "ENGLISH name of the dish for image generation (e.g. 'Beef Wellington')." }
        }
      }, 
      description: "3 accords mets-vins parfaits." 
    },
    bestVintages: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ce millésime précis s'il est bon, et 2 autres excellents." },
    agingPotential: { type: Type.STRING, description: "Potentiel de garde précis pour ce millésime." },
    peakStart: { type: Type.NUMBER, description: "Année relative début apogée (ex: 5 pour dans 5 ans)." },
    peakEnd: { type: Type.NUMBER, description: "Année relative fin apogée (ex: 15)." },
    servingTemp: { type: Type.STRING, description: "Température idéale de service." },
    imageUrl: { type: Type.STRING, description: "URL d'une image HD si trouvée via Search, sinon vide." }
  },
  required: ["name", "region", "type", "description", "priceRange", "foodPairing", "bestVintages", "agingPotential", "servingTemp", "tastingNotes"],
};

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

export const searchWines = async (query: string): Promise<Wine[]> => {
  if (!apiKey || !ai) {
    console.error("API Key is missing in searchWines");
    throw new Error("MISSING_API_KEY");
  }

  try {
    // Prompt optimisé pour trouver de belles images
    const prompt = `
      Rôle : Sommelier Expert et Acheteur de Vin.
      Requête : Recherche des informations précises sur "${query}".
      
      Instructions :
      1. Identifie les vins correspondants (max 4).
      2. Utilise Google Search pour trouver une image de la bouteille. 
         CRITIQUE : Cherche des images de type "Packshot" ou "Studio" sur fond blanc ou uni, haute résolution. Évite les photos floues d'utilisateurs.
      3. Retourne les détails techniques précis (Cépages exacts, Prix marché actuel).
      4. Pour 'foodPairing', sois créatif et gastronomique. 'imageKeyword' DOIT être en ANGLAIS.

      Format de sortie : Tableau JSON uniquement, respectant strictement le schéma fourni implicitement par les exemples précédents.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        // On n'utilise pas responseSchema ici car googleSearch peut parfois interférer avec le mode JSON strict du SDK
        // On fait confiance au prompt + extractJSON qui est robuste
      },
    });

    const wines = extractJSON(response.text || "[]");
    
    if (Array.isArray(wines)) {
        return wines as Wine[];
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
    // COMBINAISON VISION + GROUNDING (Google Search)
    // C'est ici que la magie opère : on lit l'image, puis on cherche les infos réelles sur le web.
    const prompt = `
      Tâche : Analyse experte d'étiquette de vin.
      
      Instructions :
      1. VISION : Lis attentivement l'étiquette sur l'image fournie. Extrais :
         - Le Nom exact du Domaine / Château.
         - La Cuvée (si présente).
         - Le Millésime (L'année est CRUCIALE).
         - L'Appellation précise.
      
      2. RECHERCHE (Grounding) : Utilise ces informations extraites pour chercher sur le Web :
         - Le PRIX moyen actuel du marché pour CE millésime spécifique.
         - Les notes de dégustation réelles des critiques pour CE vin.
         - Le potentiel de garde réel (est-il à son apogée ?).
      
      3. SYNTHÈSE : Compile ces informations dans la fiche vin.
         - Si le millésime est illisible, estime-le ou fournis les infos du millésime récent le plus courant, mais mentionne-le dans la description.
         - 'foodPairing' : Plat en Français, 'imageKeyword' en Anglais.

      Retourne un JSON Array contenant l'objet vin.
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
        tools: [{ googleSearch: {} }], // Activation du Grounding sur l'analyse d'image !
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: wineSchema
        }
      },
    });

    const jsonText = response.text || "[]";
    const result = JSON.parse(jsonText);
    return Array.isArray(result) ? result : [result];

  } catch (error) {
    console.error("Erreur Analyse Image:", error);
    throw new Error("Impossible d'analyser l'image ou de trouver les informations.");
  }
};
