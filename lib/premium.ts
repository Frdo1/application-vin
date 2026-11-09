// Version web : pas d'achat intégré.
export const PREMIUM_SKU = 'premium';
export const isPremium = () => false;
export const premiumPrice = () => '';
export const onPremiumChange = (_cb: () => void) => () => {};
export const initPremium = async () => {};
export type BuyResult = 'ok' | 'cancelled' | 'error';
export const buyPremium = async (): Promise<BuyResult> => 'error';
export const restorePremium = async () => false;
