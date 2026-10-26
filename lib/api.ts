import Constants from 'expo-constants';

import type { Wine } from './types';

const SERVER: string =
  (Constants.expoConfig?.extra as { serverUrl?: string } | undefined)?.serverUrl ||
  'https://application-vin.vercel.app/api/sommelier';

export class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

/** Messages lisibles pour chaque erreur renvoyée par le serveur. */
export function errorMessage(e: unknown): string {
  const code = e instanceof ApiError ? e.code : 'NETWORK';
  switch (code) {
    case 'NETWORK':
      return 'Pas de connexion au sommelier. Vérifiez votre réseau.';
    case 'MISSING_API_KEY':
    case 'INVALID_API_KEY':
      return 'Le serveur n’a pas de clé Gemini valide. Il faut la configurer sur Vercel.';
    case 'QUOTA':
    case 'RATE_LIMIT':
      return 'Trop de demandes pour le moment. Réessayez dans quelques minutes.';
    case 'TIMEOUT':
      return 'Le sommelier a mis trop de temps à répondre. Réessayez.';
    case 'BAD_IMAGE':
      return 'Photo trop lourde ou illisible. Réessayez.';
    default:
      return 'Le sommelier n’a pas pu répondre. Réessayez.';
  }
}

async function call<T>(body: object, timeoutMs = 60_000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sommelier-app': '1' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch {
    throw new ApiError('NETWORK');
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.error || 'SERVER');
  return data as T;
}

export async function searchWines(query: string, exclude: string[] = []) {
  const r = await call<{ wines: Wine[] }>({ action: 'search', query, exclude });
  return r.wines || [];
}

export async function analyzeLabel(imageBase64: string) {
  const r = await call<{ wines: Wine[]; sources: Wine['sources']; verified?: boolean }>({ action: 'label', image: imageBase64 }, 90_000);
  return (r.wines || []).map((w) => ({ ...w, sources: r.sources }));
}

export async function vintagePrice(name: string, vintage: string) {
  return call<{ price: string; source: string; sources: { title: string; url: string }[]; verified?: boolean }>({
    action: 'price',
    name,
    vintage,
  });
}
