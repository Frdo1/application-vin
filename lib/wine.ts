import type { CellarItem, Tasting, Wine, WineType } from './types';

export const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const cellarKey = (name: string, vintage: string) => `${norm(name)}|${vintage || 'nv'}`;

/** Prix moyen d'une fourchette « 25-35 € » → 30. Retourne 0 si illisible. */
export function priceValue(range: string): number {
  const nums = (range || '')
    .replace(/(\d)[\s .](\d{3})/g, '$1$2') // « 1 200 » ou « 1.200 »
    .replace(',', '.')
    .match(/\d+(\.\d+)?/g)
    ?.map(Number)
    .filter((n) => n > 0 && n < 100000);
  if (!nums?.length) return 0;
  const [a, b] = nums;
  return Math.round(b ? (a + b) / 2 : a);
}

export function itemValue(i: CellarItem) {
  return (i.pricePaid ?? priceValue(i.wine.priceRange)) * i.quantity;
}

export type DrinkStatus = 'young' | 'ready' | 'past' | 'unknown';

/** Où en est la bouteille, d'après son millésime et sa fenêtre d'apogée. */
export function drinkStatus(wine: Wine, vintage: string, year = new Date().getFullYear()): DrinkStatus {
  const v = parseInt(vintage, 10);
  if (!v) return 'unknown';
  const age = year - v;
  if (age < wine.peakStart) return 'young';
  if (age <= wine.peakEnd) return 'ready';
  return 'past';
}

export const STATUS_LABEL: Record<DrinkStatus, string> = {
  young: 'À garder',
  ready: 'À boire',
  past: 'À boire vite',
  unknown: 'Millésime ?',
};

export const STATUS_COLOR: Record<DrinkStatus, string> = {
  young: '#2D6CDF',
  ready: '#2F9E44',
  past: '#D9480F',
  unknown: '#868E96',
};

export const TYPE_COLORS: Record<WineType, { liquid: string; badgeBg: string; badgeText: string }> = {
  Rouge: { liquid: '#720e1e', badgeBg: '#7F1D1D', badgeText: '#FEF2F2' },
  Blanc: { liquid: '#F6E7A7', badgeBg: '#FEF3C7', badgeText: '#78350F' },
  Rosé: { liquid: '#FBB6C1', badgeBg: '#FFE4E6', badgeText: '#9F1239' },
  Champagne: { liquid: '#FDE68A', badgeBg: '#FEF3C7', badgeText: '#92400E' },
  Effervescent: { liquid: '#FDF0B5', badgeBg: '#FEF9C3', badgeText: '#854D0E' },
  'Vin Doux': { liquid: '#D97706', badgeBg: '#FFEDD5', badgeText: '#9A3412' },
};

/** Liens d'achat (recherche sur des sites marchands, sans le millésime ni « AOC »). */
export function shopLinks(name: string) {
  const terms = name
    .replace(/\b(AOC|AOP|IGP|Vin de France)\b/gi, '')
    .replace(/\b(18|19|20)\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const q = encodeURIComponent(terms);
  const qn = encodeURIComponent(norm(terms));
  return [
    { label: 'Vinatis', sub: 'Achat direct', url: `https://www.vinatis.com/recherche?recherche=${q}` },
    { label: 'iDealwine', sub: 'Cote et enchères', url: `https://www.idealwine.com/fr/recherche?q=${q}` },
    { label: 'Catawiki', sub: 'Enchères', url: `https://www.catawiki.com/fr/s?q=${qn}&category=3` },
    { label: 'Wine-Searcher', sub: 'Comparer les prix', url: `https://www.wine-searcher.com/find/${qn.replace(/%20/g, '+')}` },
  ];
}

export function newTasting(vintage = ''): Tasting {
  return {
    date: new Date().toISOString().slice(0, 10),
    location: '',
    rating: 85,
    comment: '',
    guests: '',
    vintage,
    visual: { intensity: 50, limpidity: 50, brilliance: 50, tears: 50 },
    nose: { intensity: 50, impression: 50, aromas: [] },
    mouth: { sugar: 10, alcohol: 50, acidity: 50, tannins: 50, persistence: 50, caudalie: 5 },
  };
}

export const fmtDate = (d: Date | string | number) => {
  const x = new Date(d);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(x.getDate())}/${p(x.getMonth() + 1)}/${x.getFullYear()}`;
};

/** Appellations et vins connus pour l'autocomplétion (reprise de la v1). */
export const POPULAR_WINES = [
  'Château Margaux', 'Petrus', "Château d'Yquem", 'Château Lafite Rothschild', 'Château Latour',
  'Château Haut-Brion', 'Château Cheval Blanc', 'Château Mouton Rothschild', 'Château Ausone',
  'Château Angélus', 'Château Palmer', 'Château Lynch-Bages', 'Château Pontet-Canet', 'Château Montrose',
  "Château Cos d'Estournel", 'Domaine Leflaive', 'Domaine Leroy', 'Domaine de la Romanée-Conti',
  'E. Guigal', 'M. Chapoutier', 'Louis Jadot', 'Joseph Drouhin', 'Bollinger', 'Dom Pérignon', 'Krug',
  'Louis Roederer Cristal', 'Taittinger Comtes de Champagne', 'Pol Roger', 'Chablis Grand Cru',
  'Chablis Premier Cru', 'Meursault', 'Puligny-Montrachet', 'Corton-Charlemagne', 'Chambertin',
  'Clos de Vougeot', 'Pommard', 'Volnay', 'Nuits-Saint-Georges', 'Gevrey-Chambertin', 'Vosne-Romanée',
  'Châteauneuf-du-Pape', 'Côte-Rôtie', 'Hermitage', 'Cornas', 'Condrieu', 'Saint-Joseph',
  'Crozes-Hermitage', 'Gigondas', 'Vacqueyras', 'Bandol', 'Sancerre', 'Pouilly-Fumé', 'Chinon',
  'Saumur-Champigny', 'Vouvray', 'Savennières', 'Muscadet', 'Alsace Grand Cru', 'Gewurztraminer',
  'Riesling', 'Vin Jaune', 'Château-Chalon', 'Pessac-Léognan', 'Saint-Émilion', 'Pomerol', 'Sauternes',
  'Margaux', 'Pauillac', 'Saint-Estèphe', 'Saint-Julien', 'Madiran', 'Cahors', 'Jurançon', 'Collioure',
  'Pic Saint-Loup', 'Côtes de Provence rosé', 'Tavel', 'Morgon', 'Moulin-à-Vent', 'Fleurie', 'Crémant',
];
