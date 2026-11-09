// Calcul des alertes « à boire » (commun au téléphone et au web).
import type { CellarItem } from './types';

const MAX = 60; // Android limite le nombre d'alarmes programmées par appli

export type Planned = { date: Date; title: string; body: string };

/** Dates clés de chaque vin : début d'apogée (janvier) et dernière année idéale (septembre). */
export function plannedAlerts(cellar: CellarItem[], now = new Date()): Planned[] {
  const out: Planned[] = [];
  for (const c of cellar) {
    const v = parseInt(c.vintage, 10);
    if (!v || c.quantity <= 0) continue;
    const label = `${c.wine.name} ${c.vintage}`;
    const n = c.quantity > 1 ? `${c.quantity} bouteilles` : '1 bouteille';
    const start = new Date(v + c.wine.peakStart, 0, 15, 18, 0);
    const end = new Date(v + c.wine.peakEnd, 8, 1, 18, 0);
    if (start > now) out.push({ date: start, title: '🍷 Prêt à boire', body: `${label} entre dans sa période idéale (${n} en cave).` });
    if (end > now) out.push({ date: end, title: '⏳ À boire cette année', body: `${label} : dernière année idéale. Pensez à l'ouvrir (${n}).` });
  }
  return out.sort((a, b) => +a.date - +b.date).slice(0, MAX);
}
