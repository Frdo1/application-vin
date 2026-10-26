// Fonction Vercel : seul endroit qui connaît la clé Gemini.
// L'appli Android appelle POST /api/sommelier ; la clé reste sur le serveur
// (variable d'environnement GEMINI_API_KEY) et n'apparaît jamais dans l'APK.
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

import { cleanWines, extractJSON } from '../lib/json.js';
import { LABEL_PROMPT, pricePrompt, searchPrompt } from '../lib/prompts.js';

export const config = { maxDuration: 60 };

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const MAX_IMAGE_CHARS = 3_000_000; // ~2,2 Mo d'image en base64 (l'appli envoie ~300 Ko)

// Limite simple par adresse IP pour éviter qu'un inconnu vide le quota.
// (Mémoire par instance : ce n'est pas un vrai pare-feu, mais ça freine les abus.)
const hits = new Map<string, number[]>();
function tooMany(ip: string, limit = 40, windowMs = 10 * 60_000) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > limit;
}

// Gemini 3 réfléchit longuement par défaut : sans limite, une recherche dépassait
// les 60 s autorisées par Vercel. On limite la réflexion et on coupe à 50 s.
const thinking = (level: ThinkingLevel) => ({ thinkingConfig: { thinkingLevel: level } });
const deadline = (ms = 50_000) => AbortSignal.timeout(ms);

let client: GoogleGenAI | null = null;
function ai() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw Object.assign(new Error('MISSING_API_KEY'), { status: 500 });
  return (client ??= new GoogleGenAI({ apiKey: key }));
}

type Req = { method?: string; body?: any; headers: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; setHeader: (k: string, v: string) => void };

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ ok: true, model: MODEL, configured: !!process.env.GEMINI_API_KEY });
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD' });
  if (req.headers['x-sommelier-app'] !== '1') return res.status(403).json({ error: 'FORBIDDEN' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnu';
  if (tooMany(ip)) return res.status(429).json({ error: 'RATE_LIMIT' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  try {
    switch (body.action) {
      case 'search': {
        const query = String(body.query || '').trim().slice(0, 200);
        if (!query) return res.status(400).json({ error: 'EMPTY_QUERY' });
        const exclude = Array.isArray(body.exclude) ? body.exclude.map(String).slice(0, 60) : [];
        const r = await ai().models.generateContent({
          model: MODEL,
          contents: searchPrompt(query, exclude),
          config: { responseMimeType: 'application/json', temperature: 0.6, ...thinking(ThinkingLevel.MINIMAL), abortSignal: deadline() },
        });
        return res.status(200).json({ wines: cleanWines(extractJSON(r.text || '')) });
      }
      case 'label': {
        const image = String(body.image || '').replace(/^data:image\/\w+;base64,/, '');
        if (!image || image.length > MAX_IMAGE_CHARS) return res.status(400).json({ error: 'BAD_IMAGE' });
        const r = await ai().models.generateContent({
          model: MODEL,
          contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: image } }, { text: LABEL_PROMPT }] }],
          config: { tools: [{ googleSearch: {} }], temperature: 0.2, ...thinking(ThinkingLevel.LOW), abortSignal: deadline() },
        });
        return res.status(200).json({ wines: cleanWines(extractJSON(r.text || ''), 1), sources: sourcesOf(r) });
      }
      case 'price': {
        const name = String(body.name || '').trim().slice(0, 120);
        const vintage = String(body.vintage || '').match(/\b(18|19|20)\d{2}\b/)?.[0];
        if (!name || !vintage) return res.status(400).json({ error: 'BAD_PRICE_QUERY' });
        const r = await ai().models.generateContent({
          model: MODEL,
          contents: pricePrompt(name, vintage),
          config: { tools: [{ googleSearch: {} }], temperature: 0, ...thinking(ThinkingLevel.MINIMAL), abortSignal: deadline(40_000) },
        });
        const data = extractJSON(r.text || '') as { price?: string; source?: string } | null;
        return res.status(200).json({
          price: String(data?.price || '').slice(0, 40),
          source: String(data?.source || '').slice(0, 60),
          sources: sourcesOf(r),
        });
      }
      default:
        return res.status(400).json({ error: 'UNKNOWN_ACTION' });
    }
  } catch (e: any) {
    const msg = String(e?.message || e);
    console.error('sommelier error', body.action, msg.slice(0, 500));
    if (msg.includes('MISSING_API_KEY')) return res.status(500).json({ error: 'MISSING_API_KEY' });
    if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) return res.status(500).json({ error: 'INVALID_API_KEY' });
    if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg)) return res.status(503).json({ error: 'QUOTA' });
    if (/abort|timeout|timed out/i.test(msg)) return res.status(504).json({ error: 'TIMEOUT' });
    return res.status(502).json({ error: 'AI_ERROR' });
  }
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/** Liens consultés par la recherche Google (affichés dans l'appli pour vérifier un prix). */
function sourcesOf(r: any): { title: string; url: string }[] {
  const chunks = r?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return chunks
    .map((c: any) => ({ title: String(c?.web?.title || '').slice(0, 80), url: String(c?.web?.uri || '') }))
    .filter((s: { url: string }) => s.url.startsWith('https://'))
    .slice(0, 4);
}
