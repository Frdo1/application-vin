
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Wine } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

// Schema strict uniquement pour l'analyse d'image (Vision)
const wineSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Nom complet du vin ou du domaine." },
    region: { type: Type.STRING, description: "Région viticole (ex: Bordeaux, Bourgogne)." },
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
    priceRange: { type: Type.STRING, description: "Fourchette de prix estimée (ex: 15€ - 25€)." },
    description: { type: Type.STRING, description: "Description globale élégante." },
    tastingNotes: {
      type: Type.OBJECT,
      properties: {
        nose: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 arômes principaux au nez." },
        mouth: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 caractéristiques en bouche." }
      }
    },
    foodPairing: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nom du plat." },
          imageKeyword: { type: Type.STRING, description: "Mot clé anglais simple pour photo (ex: steak)." }
        }
      }, 
      description: "3 accords mets-vins." 
    },
    bestVintages: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Meilleurs millésimes récents." },
    agingPotential: { type: Type.STRING, description: "Potentiel de garde." },
    peakStart: { type: Type.NUMBER, description: "Début apogée (années)." },
    peakEnd: { type: Type.NUMBER, description: "Fin apogée (années)." },
    servingTemp: { type: Type.STRING, description: "Température idéale." },
    imageUrl: { type: Type.STRING, description: "Laissez vide pour l'analyse d'étiquette." }
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
    } catch (e2) {
      console.error("Echec extraction JSON:", e2);
    }
    return [];
  }
};

export const searchWines = async (query: string): Promise<Wine[]> => {
  if (!apiKey) throw new Error("Clé API manquante.");

  try {
    // Pour la recherche, on utilise Google Search pour trouver des vraies infos et images
    const prompt = `
      Agis comme un sommelier expert.
      Recherche sur le web des informations précises sur : "${query}".
      Si la recherche est vague, propose 4 vins français pertinents.
      
      Tâche :
      1. Trouve les vins correspondants.
      2. Pour chaque vin, utilise Google Search pour trouver une URL d'image valide de la BOUTEILLE ENTIERE ou de l'ÉTIQUETTE seule (fond blanc si possible). Priorité à une image claire où on lit le nom.
      3. Retourne un tableau JSON pur contenant les détails.

      Format JSON attendu (strictement ce format, sans texte autour) :
      [
        {
          "name": "Nom complet du vin",
          "region": "Région",
          "appellation": "AOC",
          "type": "Rouge" | "Blanc" | "Rosé" | "Champagne",
          "grapeVarieties": ["Cépage 1"],
          "priceRange": "20-30€",
          "description": "Description courte et élégante",
          "tastingNotes": { "nose": ["Arôme 1"], "mouth": ["Saveur 1"] },
          "foodPairing": [{ "name": "Plat", "imageKeyword": "food_name_in_english" }],
          "bestVintages": ["2015", "2019"],
          "agingPotential": "10 ans",
          "peakStart": 3,
          "peakEnd": 10,
          "servingTemp": "17°C",
          "imageUrl": "URL_DE_L_IMAGE_TROUVEE_SUR_LE_WEB"
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseSchema et responseMimeType ne sont PAS utilisés avec googleSearch
        // On compte sur le prompt pour avoir du JSON
      },
    });

    const wines = extractJSON(response.text || "[]");
    
    // Validation basique
    if (Array.isArray(wines)) {
        return wines as Wine[];
    }
    return [];

  } catch (error) {
    console.error("Erreur Sommelier Search:", error);
    throw new Error("Le sommelier est momentanément indisponible.");
  }
};

export const analyzeLabel = async (imageBase64: string): Promise<Wine[]> => {
  if (!apiKey) throw new Error("Clé API manquante.");

  try {
    // Pour l'analyse d'image, on garde le mode Schema strict car on analyse l'image fournie
    // L'image affichée sera celle capturée par l'utilisateur (gérée dans App.tsx)
    const prompt = `
      Analyse cette étiquette de vin. Identifie le vin (Nom, Domaine, Millésime, Appellation).
      Retourne un objet JSON unique très détaillé correspondant à ce vin exact.
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
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: wineSchema
        }
      },
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText) as Wine[];

  } catch (error) {
    console.error("Erreur Analyse Image:", error);
    throw new Error("Impossible d'analyser l'image.");
  }
};
