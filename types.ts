
export type WineType = 'Rouge' | 'Blanc' | 'Rosé' | 'Champagne' | 'Effervescent' | 'Vin Doux';

export interface FoodPairing {
  name: string;
  imageKeyword: string; // Pour générer l'image
}

export interface UserTasting {
  date: string;
  location: string;
  rating: number; // 0-100
  comment: string;
  guests?: string;
  vintage?: string; // Année du vin dégusté
  visual: {
    intensity: number;
    limpidity: number;
    brilliance: number;
    tears: number; // Fluidité
  };
  nose: {
    intensity: number;
    impression: number; // Qualité
    aromas: string[]; // ex: "Fruité", "Boisé" (non implémenté en UI complexe pour l'instant)
  };
  mouth: {
    sugar: number;
    alcohol: number;
    acidity: number;
    tannins: number;
    persistence: number;
    caudalie: number; // Longueur
  };
}

export interface Wine {
  name: string;
  region: string;
  appellation: string;
  type: WineType;
  grapeVarieties: string[]; // Cépages
  priceRange: string;
  description: string;
  tastingNotes: {
    nose: string[]; // Arômes
    mouth: string[]; // Saveurs/Texture
  };
  foodPairing: FoodPairing[];
  bestVintages: string[]; // Années
  agingPotential: string; // Ex: "5-10 ans"
  peakStart: number; // Année relative début apogée (ex: 3)
  peakEnd: number; // Année relative fin apogée (ex: 8)
  servingTemp: string; // Ex: "16-18°C"
  alcoholContent?: string;
  imageUrl?: string; // URL de l'image (optionnel)
  dateAdded?: number; // Pour le tri dans la cave
  quantity?: number; // Gestion du stock
  userTasting?: UserTasting; // Notes personnelles de l'utilisateur
}

export interface SearchState {
  query: string;
  results: Wine[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

export interface ScanHistoryItem {
  id: number;
  date: number;
  imageBase64: string;
}
