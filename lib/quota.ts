import AsyncStorage from '@react-native-async-storage/async-storage';

import { isPremium } from './premium';

/** Nombre de demandes à l'IA (recherche, étiquette, cote) offertes chaque jour sans Premium. */
export const FREE_PER_DAY = 5;
/** Limite haute discrète pour les abonnés Premium (protège la facture Gemini). */
export const PREMIUM_PER_DAY = 100;
const KEY = 'sommelier:quota';

let day = '';
let used = 0;
let loaded = false;
const listeners = new Set<() => void>();
const paywall = new Set<() => void>();

const today = () => new Date().toISOString().slice(0, 10);

async function load() {
  if (loaded && day === today()) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const saved = raw ? (JSON.parse(raw) as { day: string; used: number }) : null;
    if (saved && saved.day === today()) {
      day = saved.day;
      used = saved.used;
    } else {
      day = today();
      used = 0;
    }
  } catch {
    day = today();
    used = 0;
  }
  loaded = true;
}

async function save() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ day, used }));
  } catch {}
  listeners.forEach((cb) => cb());
}

const limit = () => (isPremium() ? PREMIUM_PER_DAY : FREE_PER_DAY);
export const remaining = () => (day === today() ? Math.max(0, FREE_PER_DAY - used) : FREE_PER_DAY);

export function onQuotaChange(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** L'écran Premium s'abonne ici pour s'ouvrir quand le quota est épuisé. */
export function onPaywall(cb: () => void) {
  paywall.add(cb);
  return () => {
    paywall.delete(cb);
  };
}
export const openPaywall = () => paywall.forEach((cb) => cb());

export type QuotaResult = 'ok' | 'free_limit' | 'premium_limit';

/** Réserve une demande. En gratuit, ouvre l'écran Premium quand le quota du jour est épuisé. */
export async function takeQuota(): Promise<QuotaResult> {
  await load();
  if (used >= limit()) {
    if (isPremium()) return 'premium_limit';
    openPaywall();
    return 'free_limit';
  }
  used++;
  await save();
  return 'ok';
}

/** Rend une demande qui a échoué (réseau, serveur) : on ne compte que les réponses obtenues. */
export async function refundQuota() {
  await load();
  used = Math.max(0, used - 1);
  await save();
}

export async function initQuota() {
  await load();
  listeners.forEach((cb) => cb());
}
