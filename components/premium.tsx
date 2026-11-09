import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { openPrivacyOptions, showRewarded } from '@/lib/ads';
import { buyPremium, isPremium, onPremiumChange, premiumPrice, restorePremium } from '@/lib/premium';
import { addRewardSearches, FREE_PER_DAY, onPaywall, onQuotaChange, remaining, REWARD_SEARCHES, rewardsLeft } from '@/lib/quota';
import { C, F } from '@/lib/theme';

/** État Premium + quota restant, mis à jour en direct. */
export function usePremium() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const a = onPremiumChange(bump);
    const b = onQuotaChange(bump);
    return () => {
      a();
      b();
    };
  }, []);
  return { premium: isPremium(), price: premiumPrice(), left: remaining(), bonus: rewardsLeft(), available: Platform.OS === 'android' };
}

const PERKS = [
  'Recherches et scans d’étiquettes illimités',
  'Cotes des millésimes illimitées',
  'Aucune publicité',
];

/** Pastille à afficher sur l'écran de recherche : quota du jour ou statut Premium. */
export function PremiumBadge({ onPress }: { onPress: () => void }) {
  const { premium, left, available } = usePremium();
  if (!available) return null;
  return (
    <Pressable onPress={onPress} style={[st.badge, premium && { backgroundColor: C.gold, borderColor: '#F5D88A' }]}>
      <MaterialIcons name={premium ? 'workspace-premium' : 'auto-awesome'} size={16} color={premium ? C.goldText : C.wine} />
      <Text style={[st.badgeText, premium && { color: C.goldText }]}>
        {premium ? 'Premium' : `${left}/${FREE_PER_DAY} recherches gratuites aujourd’hui`}
      </Text>
    </Pressable>
  );
}

/** Écran Premium : s'ouvre depuis la pastille, ou tout seul quand le quota gratuit est épuisé. */
export function PremiumModal() {
  const { premium, price, left, bonus } = usePremium();
  const [watching, setWatching] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => onPaywall(() => setVisible(true)), []);
  useEffect(() => {
    if (!visible) setMsg('');
  }, [visible]);

  const close = () => setVisible(false);

  const buy = async () => {
    setBusy(true);
    setMsg('');
    const r = await buyPremium();
    setBusy(false);
    if (r === 'error') setMsg('Abonnement impossible pour le moment. Vérifiez votre connexion et réessayez.');
  };

  const watchAd = async () => {
    setWatching(true);
    setMsg('');
    const ok = await showRewarded();
    setWatching(false);
    if (ok) {
      await addRewardSearches();
      setVisible(false);
    } else setMsg('Aucune vidéo disponible pour le moment. Réessayez dans quelques minutes.');
  };

  const restore = async () => {
    setBusy(true);
    setMsg('');
    const ok = await restorePremium();
    setBusy(false);
    setMsg(ok ? '' : 'Aucun abonnement actif trouvé sur ce compte Google.');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={st.backdrop} onPress={close}>
        <Pressable style={st.box} onPress={() => {}}>
          <View style={st.icon}>
            <MaterialIcons name="workspace-premium" size={34} color={C.goldText} />
          </View>
          <Text style={st.title}>Le Sommelier Premium</Text>

          {premium ? (
            <Text style={[st.text, { color: '#15803D', fontFamily: F.sansBold }]}>
              Merci pour votre soutien ! Vous profitez de toutes les recherches sans limite et sans publicité.
            </Text>
          ) : (
            <>
              <Text style={st.text}>
                {left === 0
                  ? `Vous avez utilisé vos ${FREE_PER_DAY} recherches gratuites du jour. Revenez demain, ou passez en Premium.`
                  : `Chaque recherche est faite par une IA, ce qui a un coût. Vous avez ${FREE_PER_DAY} recherches gratuites par jour.`}
              </Text>
              <View style={{ gap: 8, marginBottom: 20 }}>
                {PERKS.map((p) => (
                  <View key={p} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <MaterialIcons name="check-circle" size={20} color={C.wine} />
                    <Text style={[st.text, { marginBottom: 0, textAlign: 'left', flex: 1 }]}>{p}</Text>
                  </View>
                ))}
              </View>
              <Pressable style={[st.buy, busy && { opacity: 0.6 }]} onPress={buy} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <Text style={st.buyText}>{price ? `S’abonner – ${price} / mois` : 'S’abonner'}</Text>
                )}
              </Pressable>
              <Text style={st.small}>Sans engagement, résiliable à tout moment depuis Google Play.</Text>
              {bonus > 0 && (
                <Pressable style={[st.reward, watching && { opacity: 0.6 }]} onPress={watchAd} disabled={watching || busy}>
                  {watching ? (
                    <ActivityIndicator color={C.wine} />
                  ) : (
                    <>
                      <MaterialIcons name="smart-display" size={20} color={C.wine} />
                      <Text style={st.rewardText}>Regarder une pub : +{REWARD_SEARCHES} recherches</Text>
                    </>
                  )}
                </Pressable>
              )}
            </>
          )}

          {!!msg && <Text style={st.error}>{msg}</Text>}

          {premium ? (
            <Pressable
              onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions?package=com.frdo1.sommelieria')}
              style={{ paddingTop: 16, alignItems: 'center' }}>
              <Text style={st.link}>Gérer mon abonnement</Text>
            </Pressable>
          ) : (
            <Pressable onPress={restore} disabled={busy} style={{ paddingTop: 16, alignItems: 'center' }}>
              <Text style={st.link}>Restaurer mon abonnement</Text>
            </Pressable>
          )}
          {!premium && (
            <Pressable onPress={openPrivacyOptions} style={{ paddingTop: 12, alignItems: 'center' }}>
              <Text style={[st.link, { color: C.muted }]}>Choix de confidentialité (pubs)</Text>
            </Pressable>
          )}
          <Pressable onPress={close} style={{ paddingTop: 14, alignItems: 'center' }}>
            <Text style={{ fontFamily: F.sans, fontSize: 17, color: C.muted }}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.wineSoft,
    borderColor: '#FDE8E8',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 14,
  },
  badgeText: { fontFamily: F.sansBold, fontSize: 13, color: C.wine },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  box: { backgroundColor: C.white, borderRadius: 24, padding: 24 },
  icon: { alignSelf: 'center', backgroundColor: C.gold, borderRadius: 40, padding: 12, marginBottom: 12 },
  title: { fontFamily: F.serif, fontSize: 26, color: C.text, textAlign: 'center', marginBottom: 12 },
  text: { fontFamily: F.sans, fontSize: 16, lineHeight: 23, color: C.text, textAlign: 'center', marginBottom: 16 },
  buy: { backgroundColor: C.wine, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  buyText: { color: C.white, fontFamily: F.sansBold, fontSize: 18 },
  reward: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.wine,
    borderRadius: 16,
    paddingVertical: 13,
  },
  rewardText: { color: C.wine, fontFamily: F.sansBold, fontSize: 16 },
  small: { fontFamily: F.sans, fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 8 },
  error: { fontFamily: F.sansBold, fontSize: 15, color: '#B91C1C', textAlign: 'center', marginTop: 12 },
  link: { fontFamily: F.sansBold, fontSize: 15, color: C.wine, textDecorationLine: 'underline' },
});
