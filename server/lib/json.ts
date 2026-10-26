/**
 * Extrait le JSON d'une réponse texte de Gemini.
 * La v1 prenait le texte jusqu'au premier « ] », ce qui coupait au milieu
 * de la liste des cépages et faisait échouer la lecture : on prend ici le
 * bloc complet, du premier crochet/accolade au dernier.
 */
export function extractJSON(text: string): unknown {
  const t = (text || '').trim();
  const tries: string[] = [t];
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) tries.push(fence[1]);
  const a = t.indexOf('[');
  const b = t.lastIndexOf(']');
  if (a !== -1 && b > a) tries.push(t.slice(a, b + 1));
  const c = t.indexOf('{');
  const d = t.lastIndexOf('}');
  if (c !== -1 && d > c) tries.push(t.slice(c, d + 1));
  for (const s of tries) {
    try {
      return JSON.parse(s);
    } catch {
      /* essai suivant */
    }
  }
  return null;
}

const str = (v: unknown, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strList = (v: unknown, n = 8) => (Array.isArray(v) ? v.map((x) => str(x, 80)).filter(Boolean).slice(0, n) : []);
const num = (v: unknown, def: number) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : def;
};

const TYPES = ['Rouge', 'Blanc', 'Rosé', 'Champagne', 'Effervescent', 'Vin Doux'];

/** Nettoie et valide un vin renvoyé par l'IA (champs manquants, types farfelus). */
export function cleanWine(raw: any) {
  if (!raw || typeof raw !== 'object') return null;
  const name = str(raw.name, 120);
  if (!name) return null;
  const type = TYPES.find((x) => x.toLowerCase() === str(raw.type).toLowerCase()) ?? 'Rouge';
  const peakStart = num(raw.peakStart, 3);
  const peakEnd = Math.max(peakStart + 1, num(raw.peakEnd, peakStart + 5));
  const vintage = (str(raw.vintage, 10).match(/\b(18|19|20)\d{2}\b/) || [''])[0];
  return {
    name,
    vintage,
    region: str(raw.region, 60),
    appellation: str(raw.appellation, 80),
    type,
    grapeVarieties: strList(raw.grapeVarieties),
    priceRange: str(raw.priceRange, 40),
    description: str(raw.description, 600),
    tastingNotes: { nose: strList(raw.tastingNotes?.nose), mouth: strList(raw.tastingNotes?.mouth) },
    foodPairing: (Array.isArray(raw.foodPairing) ? raw.foodPairing : [])
      .map((f: any) => ({ name: str(typeof f === 'string' ? f : f?.name, 80) }))
      .filter((f: { name: string }) => f.name)
      .slice(0, 6),
    bestVintages: strList(raw.bestVintages, 8).filter((y) => /^(18|19|20)\d{2}$/.test(y)),
    agingPotential: str(raw.agingPotential, 40),
    peakStart,
    peakEnd,
    servingTemp: str(raw.servingTemp, 30),
    alcoholContent: str(raw.alcoholContent, 20),
  };
}

export function cleanWines(data: unknown, max = 6) {
  const arr = Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : [];
  return arr.map(cleanWine).filter(Boolean).slice(0, max);
}
