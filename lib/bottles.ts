// Formes de bouteille selon la région viticole (dessins dans un cadre de 60 × 160).
import type { Wine } from './types';
import { norm } from './wine';

export type BottleShape = 'bordelaise' | 'bourguignonne' | 'flute' | 'champenoise' | 'provence' | 'clavelin';

type Spec = {
  /** Contour de la bouteille */
  path: string;
  /** Zone de l'étiquette */
  label: { x: number; y: number; w: number; h: number };
  /** Hauteur du vin dans la bouteille */
  liquidTop: number;
  /** Capsule (haut du goulot) */
  capsule: { y: number; h: number; x: number; w: number };
};

export const BOTTLES: Record<BottleShape, Spec> = {
  // Épaules hautes et marquées, flancs droits
  bordelaise: {
    path: 'M22 0 H38 V36 C38 44 54 46 54 58 V152 C54 156.4 50.4 160 46 160 H14 C9.6 160 6 156.4 6 152 V58 C6 46 22 44 22 36 Z',
    label: { x: 9, y: 78, w: 42, h: 50 },
    liquidTop: 62,
    capsule: { x: 21, y: 0, w: 18, h: 14 },
  },
  // Épaules tombantes, corps plus large
  bourguignonne: {
    path: 'M22 0 H38 V30 C38 52 56 62 56 84 V152 C56 156.4 52.4 160 48 160 H12 C7.6 160 4 156.4 4 152 V84 C4 62 22 52 22 30 Z',
    label: { x: 7, y: 92, w: 46, h: 46 },
    liquidTop: 70,
    capsule: { x: 21, y: 0, w: 18, h: 14 },
  },
  // Flûte d'Alsace : haute et fine
  flute: {
    path: 'M25 0 H35 V45 C35 70 47 78 47 98 V154 C47 157.3 44.3 160 41 160 H19 C15.7 160 13 157.3 13 154 V98 C13 78 25 70 25 45 Z',
    label: { x: 15, y: 108, w: 30, h: 36 },
    liquidTop: 84,
    capsule: { x: 24, y: 0, w: 12, h: 16 },
  },
  // Champenoise : large, épaisse, longue coiffe dorée
  champenoise: {
    path: 'M23 0 H37 V28 C37 50 57 58 57 82 V152 C57 156.4 53.4 160 49 160 H11 C6.6 160 3 156.4 3 152 V82 C3 58 23 50 23 28 Z',
    label: { x: 6, y: 94, w: 48, h: 40 },
    liquidTop: 66,
    capsule: { x: 21, y: 0, w: 18, h: 38 },
  },
  // Rosé de Provence : flûte à corset, toute en courbes
  provence: {
    path: 'M24 0 H36 V30 C36 40 50 44 50 60 C50 74 44 80 44 92 C44 106 54 116 54 134 V152 C54 156.4 50.4 160 46 160 H14 C9.6 160 6 156.4 6 152 V134 C6 116 16 106 16 92 C16 80 10 74 10 60 C10 44 24 40 24 30 Z',
    label: { x: 12, y: 108, w: 36, h: 36 },
    liquidTop: 52,
    capsule: { x: 23, y: 0, w: 14, h: 14 },
  },
  // Clavelin du Jura (vin jaune) : trapu, goulot court
  clavelin: {
    path: 'M24 12 H36 V48 C36 60 55 62 55 80 V152 C55 156.4 51.4 160 47 160 H13 C8.6 160 5 156.4 5 152 V80 C5 62 24 60 24 48 Z',
    label: { x: 9, y: 92, w: 42, h: 44 },
    liquidTop: 70,
    capsule: { x: 23, y: 12, w: 14, h: 12 },
  },
};

const has = (s: string, ...words: string[]) => words.some((w) => s.includes(w));

/** Forme traditionnelle de la bouteille d'après l'appellation, la région et la couleur. */
export function bottleShape(wine: Pick<Wine, 'name' | 'region' | 'appellation' | 'type'>): BottleShape {
  const where = norm(`${wine.appellation} ${wine.region}`);
  const all = norm(`${wine.name} ${wine.appellation} ${wine.region}`);
  if (wine.type === 'Champagne' || wine.type === 'Effervescent' || has(all, 'champagne', 'cremant')) return 'champenoise';
  if (has(all, 'vin jaune', 'chateau-chalon', 'chateau chalon')) return 'clavelin';
  if (has(where, 'alsace', 'moselle')) return 'flute';
  if (wine.type === 'Rosé' && has(where, 'provence', 'bandol', 'cassis', 'bellet', 'palette', 'varois', 'baux')) return 'provence';
  if (has(where, 'bordeaux', 'medoc', 'graves', 'emilion', 'pomerol', 'sauternes', 'bergerac', 'cahors', 'sud-ouest', 'sud ouest')) return 'bordelaise';
  if (has(where, 'bourgogne', 'beaujolais', 'chablis', 'macon', 'rhone', 'loire', 'jura', 'savoie', 'bugey', 'touraine', 'anjou', 'sancerre'))
    return 'bourguignonne';
  if (has(where, 'cote de nuits', 'cote de beaune', 'cote rotie', 'hermitage', 'chateauneuf', 'gigondas', 'condrieu', 'muscadet', 'vouvray', 'chinon', 'saumur'))
    return 'bourguignonne';
  return 'bordelaise';
}

/** Teinte du verre : foncé pour les rouges, vert pour les effervescents et les flûtes, clair pour les rosés. */
export function glassColor(shape: BottleShape, type: Wine['type']) {
  if (type === 'Rouge') return '#290e0e';
  if (shape === 'champenoise') return '#1F3A24';
  if (shape === 'flute') return '#3B5A2E';
  if (type === 'Rosé' || type === 'Vin Doux' || shape === 'bordelaise') return '#E4E7EA';
  return '#C9D2B0'; // verre « feuille morte » des blancs de Bourgogne
}
