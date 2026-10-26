export type WineType = 'Rouge' | 'Blanc' | 'Rosé' | 'Champagne' | 'Effervescent' | 'Vin Doux';

export type Wine = {
  name: string;
  vintage: string;
  region: string;
  appellation: string;
  type: WineType;
  grapeVarieties: string[];
  priceRange: string;
  description: string;
  tastingNotes: { nose: string[]; mouth: string[] };
  foodPairing: { name: string }[];
  bestVintages: string[];
  agingPotential: string;
  /** Années après le millésime */
  peakStart: number;
  peakEnd: number;
  servingTemp: string;
  alcoholContent: string;
  /** Photo de l'étiquette (fichier local) quand le vin vient d'un scan */
  photoUri?: string;
  /** Liens consultés par la recherche Google lors du scan */
  sources?: { title: string; url: string }[];
};

export type Tasting = {
  date: string; // AAAA-MM-JJ
  location: string;
  rating: number; // 0-100
  comment: string;
  guests: string;
  vintage: string;
  visual: { intensity: number; limpidity: number; brilliance: number; tears: number };
  nose: { intensity: number; impression: number; aromas: string[] };
  mouth: { sugar: number; alcohol: number; acidity: number; tannins: number; persistence: number; caudalie: number };
};

export type CellarItem = {
  /** Identifiant : nom + millésime (deux millésimes = deux lignes distinctes) */
  key: string;
  wine: Wine;
  vintage: string;
  quantity: number;
  dateAdded: number;
  /** Prix payé par bouteille, en euros, saisi par l'utilisateur */
  pricePaid?: number;
  tasting?: Tasting;
};

export type ScanItem = { id: string; date: number; uri: string; wineName?: string };
