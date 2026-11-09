// Catalogue de vins qui se construit tout seul.
// Chaque vin trouvé par Gemini est rangé dans une base Redis (Upstash, offerte par Vercel) ;
// la recherche suivante y regarde d'abord, et n'appelle Gemini que si elle n'y trouve rien.
// Sans base configurée, tout fonctionne comme avant (le catalogue est simplement ignoré).

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

export const catalogOn = () => !!(URL_ && TOKEN);

const SEARCH_TTL = 180 * 86400; // une recherche reste 6 mois
const PRICE_TTL = 30 * 86400; // une cote reste 1 mois

/** Clé stable : sans accents, ponctuation ni majuscules. */
export const key = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

async function redis(commands: (string | number)[][]): Promise<any[]> {
  if (!catalogOn()) return [];
  try {
    const r = await fetch(`${URL_}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(2500),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const out = (await r.json()) as { result?: unknown; error?: string }[];
    return out.map((o) => (o.error ? null : o.result));
  } catch (e) {
    // Le catalogue ne doit jamais bloquer l'appli : en cas de souci, on passe par Gemini.
    console.warn('catalogue indisponible', String((e as Error)?.message || e).slice(0, 120));
    return [];
  }
}

const parse = (v: unknown) => {
  if (typeof v !== 'string') return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

const searchKey = (query: string, exclude: string[]) =>
  `s:${key(query)}${exclude.length ? '|' + exclude.map(key).sort().join('|') : ''}`;

/** Recherche déjà faite par un utilisateur, ou nom exact d'un vin déjà connu. */
export async function findSearch(query: string, exclude: string[]): Promise<any[] | null> {
  const cmds: string[][] = [['GET', searchKey(query, exclude)]];
  if (!exclude.length) cmds.push(['GET', `w:${key(query)}`]);
  const [search, wine] = await redis(cmds);
  const list = parse(search);
  const hit = Array.isArray(list) && list.length ? list : parse(wine) ? [parse(wine)] : null;
  void redis([['INCR', hit ? 'stats:hits' : 'stats:misses']]);
  return hit;
}

/** Range la recherche et chaque vin trouvé (un vin déjà connu n'est pas écrasé). */
export async function saveSearch(query: string, exclude: string[], wines: any[]) {
  if (!wines.length) return;
  await redis([['SET', searchKey(query, exclude), JSON.stringify(wines), 'EX', SEARCH_TTL]]);
  await saveWines(wines);
}

/** Ajoute des vins au catalogue (ceux d'une recherche ou d'une étiquette scannée). */
export async function saveWines(wines: any[]) {
  const cmds = wines.filter((w) => w?.name).map((w) => ['SET', `w:${key(w.name)}`, JSON.stringify(w), 'NX']);
  if (!cmds.length) return;
  const added = (await redis(cmds)).filter((r) => r === 'OK').length;
  if (added) await redis([['INCRBY', 'stats:wines', added]]);
}

const priceKey = (name: string, vintage: string) => `p:${key(name)}|${vintage}`;

export async function findPrice(name: string, vintage: string) {
  const [v] = await redis([['GET', priceKey(name, vintage)]]);
  return parse(v);
}

export async function savePrice(name: string, vintage: string, data: unknown) {
  await redis([['SET', priceKey(name, vintage), JSON.stringify(data), 'EX', PRICE_TTL]]);
}

/** Chiffres du catalogue, visibles sur l'adresse du serveur (GET sans paramètre). */
export async function stats() {
  const [wines, hits, misses] = await redis([['GET', 'stats:wines'], ['GET', 'stats:hits'], ['GET', 'stats:misses']]);
  return { wines: Number(wines) || 0, hits: Number(hits) || 0, misses: Number(misses) || 0 };
}
