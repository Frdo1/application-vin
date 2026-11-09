import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  Purchase,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
} from 'expo-iap';

/** Abonnement à créer dans la Play Console (Monétiser → Abonnements), avec un forfait de base mensuel. */
export const PREMIUM_SKU = 'premium';
const KEY = 'sommelier:premium';

let premium = false;
let price = '';
let offerToken = '';
let readyPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((cb) => cb());

export const isPremium = () => premium;
export const premiumPrice = () => price;

export function onPremiumChange(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

async function setPremium(v: boolean) {
  if (premium === v) return;
  premium = v;
  try {
    await AsyncStorage.setItem(KEY, v ? '1' : '0');
  } catch {}
  notify();
}

const ownsPremium = (list: Purchase[] | null | undefined) =>
  !!list?.some((p) => p.productId === PREMIUM_SKU && (p.purchaseState === 'purchased' || p.purchaseState === 'restored'));

/** Connexion à Google Play : vérifie l'abonnement en cours et charge le prix. Hors ligne, garde le dernier état connu. */
export function initPremium() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    try {
      premium = (await AsyncStorage.getItem(KEY)) === '1';
    } catch {}
    try {
      await initConnection();

      purchaseUpdatedListener(async (p) => {
        if (p.productId !== PREMIUM_SKU || p.purchaseState !== 'purchased') return;
        try {
          await finishTransaction({ purchase: p, isConsumable: false });
        } catch {}
        await setPremium(true);
      });
      purchaseErrorListener(() => {});

      // Google ne renvoie que les abonnements actifs : un abonnement résilié et expiré disparaît.
      await setPremium(ownsPremium(await getAvailablePurchases()));

      const subs = await fetchProducts({ skus: [PREMIUM_SKU], type: 'subs' });
      const sub: any = subs?.[0];
      const offer = sub?.subscriptionOfferDetailsAndroid?.[0];
      if (offer) {
        offerToken = offer.offerToken;
        const phases = offer.pricingPhases?.pricingPhaseList ?? [];
        price = phases[phases.length - 1]?.formattedPrice || sub.displayPrice || '';
        notify();
      }
    } catch {}
  })();
  return readyPromise;
}

export type BuyResult = 'ok' | 'cancelled' | 'error';

export async function buyPremium(): Promise<BuyResult> {
  try {
    await initPremium();
    if (!offerToken) return 'error';
    await requestPurchase({
      request: { android: { skus: [PREMIUM_SKU], subscriptionOffers: [{ sku: PREMIUM_SKU, offerToken }] } },
      type: 'subs',
    });
    return 'ok';
  } catch (e: any) {
    if (e?.code === ErrorCode.UserCancelled) return 'cancelled';
    return 'error';
  }
}

/** Restaure l'abonnement (nouveau téléphone, réinstallation). */
export async function restorePremium() {
  try {
    await initPremium();
    await setPremium(ownsPremium(await getAvailablePurchases()));
  } catch {}
  return premium;
}
