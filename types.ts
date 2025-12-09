
export type WineType = 'Rouge' | 'Blanc' | 'Rosé' | 'Champagne' | 'Effervescent' | 'Vin Doux';

export interface FoodPairing {
  name: string;
  imageKeyword: string; // Pour générer l'image
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
}

export interface SearchState {
  query: string;
  results: Wine[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}
