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

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  angle: number;
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}