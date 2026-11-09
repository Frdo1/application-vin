import mobileAds, { AdEventType, AdsConsent, InterstitialAd, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

import { initPremium, isPremium, onPremiumChange } from './premium';

// Pubs de test en dev et dans les builds "preview" (EXPO_PUBLIC_ADS_TEST=1 dans eas.json).
const TEST = __DEV__ || process.env.EXPO_PUBLIC_ADS_TEST === '1';

export const BANNER_ID = TEST ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-8906338773802694/5411757040';
const INTERSTITIAL_ID = TEST ? TestIds.INTERSTITIAL : 'ca-app-pub-8906338773802694/4996824077';
const REWARDED_ID = TEST ? TestIds.REWARDED : 'ca-app-pub-8906338773802694/9451074408';

// 1 interstitiel toutes les 3 réponses de l'IA, et au moins 3 minutes d'écart.
const EVERY_N = 3;
const MIN_GAP_MS = 3 * 60 * 1000;

let canRequest = false;
let started = false;
let interstitial: InterstitialAd | null = null;
let loaded = false;
let count = 0;
let lastShown = 0;
const listeners = new Set<(ok: boolean) => void>();

export const adsReady = () => canRequest && !isPremium();

export function onAdsReady(cb: (ok: boolean) => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function loadInterstitial() {
  if (!canRequest || isPremium()) return;
  loaded = false;
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);
  interstitial.addAdEventListener(AdEventType.LOADED, () => (loaded = true));
  interstitial.addAdEventListener(AdEventType.CLOSED, loadInterstitial);
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    loaded = false;
    setTimeout(loadInterstitial, 60 * 1000);
  });
  interstitial.load();
}

/** Consentement RGPD (Google UMP) puis initialisation du SDK. Rien pour les abonnés Premium. */
export async function initAds() {
  if (started) return;
  started = true;
  await initPremium();
  if (isPremium()) return;
  try {
    canRequest = (await AdsConsent.gatherConsent()).canRequestAds;
  } catch {
    try {
      canRequest = (await AdsConsent.getConsentInfo()).canRequestAds;
    } catch {
      canRequest = false;
    }
  }
  if (!canRequest) return;
  try {
    await mobileAds().initialize();
  } catch {}
  listeners.forEach((cb) => cb(adsReady()));
  loadInterstitial();
}

/** Après chaque réponse de l'IA : affiche un interstitiel si la limite le permet. */
export function maybeShowInterstitial() {
  count++;
  if (isPremium() || !canRequest || !loaded || !interstitial) return;
  if (count % EVERY_N !== 0) return;
  if (Date.now() - lastShown < MIN_GAP_MS) return;
  lastShown = Date.now();
  interstitial.show().catch(() => {});
}

export async function openPrivacyOptions() {
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch {}
}

// Abonnement Premium : la bannière disparaît tout de suite.
onPremiumChange(() => listeners.forEach((cb) => cb(adsReady())));

/**
 * Pub récompensée : renvoie true si l'utilisateur l'a regardée jusqu'au bout.
 * Chargée à la demande (une fois que l'utilisateur la réclame).
 */
export function showRewarded(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!canRequest) return resolve(false);
    const ad = RewardedAd.createForAdRequest(REWARDED_ID);
    let earned = false;
    let done = false;
    const finish = (v: boolean) => {
      if (done) return;
      done = true;
      offs.forEach((off) => off());
      resolve(v);
    };
    const offs = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show().catch(() => finish(false))),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => (earned = true)),
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned)),
      ad.addAdEventListener(AdEventType.ERROR, () => finish(false)),
    ];
    setTimeout(() => finish(earned), 60_000);
    ad.load();
  });
}
