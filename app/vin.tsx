import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgingGraph, Chips, Heart, SectionTitle, StatusBadge, TypeBadge, WineImage } from '@/components/wine-ui';
import { errorMessage, vintagePrice } from '@/lib/api';
import { useStore } from '@/lib/store';
import { C, F, S } from '@/lib/theme';
import { drinkStatus, fmtDate, shopLinks } from '@/lib/wine';

export default function VinScreen() {
  const { current: wine, findInCellar, addToCellar, removeFromCellar } = useStore();
  const [vintage, setVintage] = useState(wine?.vintage ?? '');
  const [price, setPrice] = useState<{ value: string; source: string; links: { title: string; url: string }[]; verified: boolean } | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    setVintage(wine?.vintage ?? '');
    setPrice(null);
    setPriceError('');
  }, [wine]);

  if (!wine) {
    return (
      <SafeAreaView style={[S.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={S.muted}>Aucun vin sélectionné.</Text>
        <Pressable style={[S.btn, { marginTop: 16 }]} onPress={() => router.back()}>
          <Text style={S.btnText}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const item = findInCellar(wine, vintage);
  const inCellar = (item?.quantity ?? 0) > 0;
  const validVintage = /^(18|19|20)\d{2}$/.test(vintage);

  const checkPrice = async (y: string) => {
    if (!/^(18|19|20)\d{2}$/.test(y)) return;
    setVintage(y);
    setPrice(null);
    setPriceError('');
    setPriceLoading(true);
    try {
      const r = await vintagePrice(wine.name, y);
      if (r.price) setPrice({ value: r.price, source: r.source, links: r.sources || [], verified: r.verified !== false });
      else setPriceError('Pas de prix fiable trouvé pour ce millésime.');
    } catch (e) {
      setPriceError(errorMessage(e));
    } finally {
      setPriceLoading(false);
    }
  };

  const toggleCellar = () => {
    if (inCellar && item) removeFromCellar(item.key);
    else addToCellar(wine, validVintage ? vintage : '');
  };

  return (
    <SafeAreaView edges={['top']} style={S.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={st.top}>
          <WineImage wine={wine} height={300} />
          <View style={st.typeCorner}>
            <TypeBadge type={wine.type} />
          </View>
          <View style={st.actions}>
            <Pressable style={st.round} onPress={toggleCellar} accessibilityLabel={inCellar ? 'Retirer de ma cave' : 'Ajouter à ma cave'}>
              <Heart filled={inCellar} size={24} />
            </Pressable>
            <Pressable style={st.round} onPress={() => router.back()} accessibilityLabel="Fermer">
              <MaterialIcons name="close" size={24} color={C.text} />
            </Pressable>
          </View>
          <View style={[st.priceTag, price && { backgroundColor: C.wineDark, borderColor: C.wine }]}>
            <Text style={[st.priceLabel, price && { color: '#FDE8E8' }]}>{price ? `Cote ${vintage}` : 'Prix estimé'}</Text>
            {priceLoading ? (
              <ActivityIndicator color={C.goldText} style={{ height: 30 }} />
            ) : (
              <Text style={[st.priceValue, price && { color: C.white }]}>{price?.value || wine.priceRange || '—'}</Text>
            )}
          </View>
        </View>

        <View style={{ padding: 20 }}>
          <Text style={st.name}>{wine.name}</Text>
          <Text style={st.region}>{[wine.region, wine.appellation].filter(Boolean).join(' · ')}</Text>

          <View style={st.vintageRow}>
            <Text style={[S.overline, { color: C.muted }]}>Millésime</Text>
            <TextInput
              style={st.vintageInput}
              value={vintage}
              onChangeText={(t) => setVintage(t.replace(/\D/g, '').slice(0, 4))}
              onSubmitEditing={() => checkPrice(vintage)}
              keyboardType="number-pad"
              placeholder="ex. 2018"
              placeholderTextColor={C.faint}
              returnKeyType="search"
            />
            {validVintage && (
              <>
                <StatusBadge status={drinkStatus(wine, vintage)} />
                <Pressable onPress={() => checkPrice(vintage)} hitSlop={8}>
                  <Text style={st.link}>Voir la cote</Text>
                </Pressable>
              </>
            )}
          </View>
          {!!priceError && <Text style={[S.muted, { color: '#B91C1C', marginTop: 6 }]}>{priceError}</Text>}
          {price && (
            <Text style={[S.muted, { marginTop: 6 }]}>
              {price.verified
                ? `Prix trouvé par recherche Google${price.source ? ` (${price.source})` : ''}. À vérifier avant d’acheter ou de vendre.`
                : 'Estimation de l’IA, non vérifiée sur le web (limite de recherche atteinte). Comparez sur iDealwine ou Wine-Searcher.'}
            </Text>
          )}

          <Pressable style={[S.btn, { marginTop: 18, flexDirection: 'row', gap: 10 }, inCellar && st.btnInCellar]} onPress={toggleCellar}>
            <Heart filled={inCellar} />
            <Text style={[S.btnText, inCellar && { color: '#BE123C' }]}>
              {inCellar ? `Dans ma cave (${item?.quantity}) · retirer` : `Ajouter à ma cave${validVintage ? ` (${vintage})` : ''}`}
            </Text>
          </Pressable>

          <Pressable style={[S.card, st.tastingRow]} onPress={() => router.push({ pathname: '/degustation', params: { vintage } })}>
            <View style={[st.rating, item?.tasting && { backgroundColor: C.wine }]}>
              <Text style={[st.ratingText, item?.tasting && { color: C.white }]}>{item?.tasting ? item.tasting.rating : '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.body, { fontFamily: F.sansBold }]}>{item?.tasting ? 'Ma note de dégustation' : 'Noter ce vin'}</Text>
              <Text style={S.muted}>
                {item?.tasting ? `Dégusté le ${fmtDate(item.tasting.date)}` : 'Créer une fiche de dégustation complète'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={C.faint} />
          </Pressable>

          <View style={[S.card, { marginTop: 16 }]}>
            <Text style={S.h3}>Dégustation du sommelier</Text>
            {!!wine.description && <Text style={[S.body, { fontFamily: F.serifItalic, color: '#57534E', marginBottom: 14 }]}>« {wine.description} »</Text>}
            <Text style={[S.overline, { marginBottom: 6 }]}>Au nez</Text>
            <Chips items={wine.tastingNotes.nose} />
            <Text style={[S.overline, { marginTop: 14, marginBottom: 6 }]}>En bouche</Text>
            <Chips items={wine.tastingNotes.mouth} />
          </View>

          <View style={st.facts}>
            <Fact icon="thermostat" label="Service" value={wine.servingTemp} />
            <Fact icon="hourglass-bottom" label="Garde" value={wine.agingPotential} />
            <Fact icon="local-bar" label="Alcool" value={wine.alcoholContent} />
          </View>

          {wine.grapeVarieties.length > 0 && (
            <>
              <SectionTitle>Cépages</SectionTitle>
              <Chips items={wine.grapeVarieties} />
            </>
          )}

          {wine.bestVintages.length > 0 && (
            <>
              <SectionTitle>Millésimes d’or</SectionTitle>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {wine.bestVintages.map((y) => (
                  <Pressable key={y} onPress={() => checkPrice(y)} style={[st.year, vintage === y && st.yearOn]}>
                    <Text style={[st.yearText, vintage === y && { color: C.white }]}>{y}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[S.muted, { marginTop: 6 }]}>Touchez une année pour voir sa cote actuelle.</Text>
            </>
          )}

          <SectionTitle>Potentiel de garde</SectionTitle>
          <AgingGraph wine={wine} vintage={validVintage ? vintage : undefined} />

          {wine.foodPairing.length > 0 && (
            <>
              <SectionTitle>Accords gourmands</SectionTitle>
              <View style={{ gap: 8 }}>
                {wine.foodPairing.map((f, i) => (
                  <View key={i} style={st.food}>
                    <MaterialIcons name="restaurant" size={18} color={C.wine} />
                    <Text style={[S.body, { flex: 1 }]}>{f.name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <SectionTitle>Acquérir ce vin</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {shopLinks(wine.name).map((l) => (
              <Pressable key={l.label} style={st.shop} onPress={() => Linking.openURL(l.url)}>
                <Text style={S.overline}>{l.sub}</Text>
                <Text style={{ fontFamily: F.serif, fontSize: 17, color: C.text }}>{l.label}</Text>
              </Pressable>
            ))}
          </View>

          {(price?.links.length || wine.sources?.length) ? (
            <>
              <SectionTitle>Sources consultées</SectionTitle>
              {(price?.links.length ? price.links : wine.sources || []).map((s) => (
                <Pressable key={s.url} onPress={() => Linking.openURL(s.url)} style={{ paddingVertical: 4 }}>
                  <Text style={st.link} numberOfLines={1}>
                    {s.title || s.url}
                  </Text>
                </Pressable>
              ))}
            </>
          ) : null}

          <Text style={[S.muted, { marginTop: 24, fontSize: 12 }]}>
            Informations générées par IA à partir de sa connaissance des vins : elles peuvent contenir des erreurs. L’abus d’alcool est dangereux pour la santé, à consommer avec modération.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Fact({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={st.fact}>
      <MaterialIcons name={icon} size={18} color="#1E40AF" />
      <Text style={S.overline}>{label}</Text>
      <Text style={{ fontFamily: F.sansBold, fontSize: 14, color: C.text, textAlign: 'center' }}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  top: { backgroundColor: '#F4F1EA', paddingTop: 60, paddingBottom: 20, alignItems: 'center' },
  typeCorner: { position: 'absolute', top: 14, left: 14 },
  actions: { position: 'absolute', top: 10, right: 12, flexDirection: 'row', gap: 8 },
  round: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: C.border },
  priceTag: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: C.gold,
    borderColor: '#FDE68A',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  priceLabel: { fontFamily: F.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: C.goldText },
  priceValue: { fontFamily: F.serif, fontSize: 22, color: C.goldText },
  name: { fontFamily: F.serif, fontSize: 30, color: C.text, lineHeight: 36 },
  region: { fontFamily: F.sansBold, fontSize: 13, color: C.wine, letterSpacing: 1, textTransform: 'uppercase', marginTop: 6 },
  vintageRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  vintageInput: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontFamily: F.sansBold,
    fontSize: 16,
    minWidth: 80,
    textAlign: 'center',
    color: C.text,
    backgroundColor: C.white,
  },
  link: { fontFamily: F.sansBold, fontSize: 14, color: C.cyan, textDecorationLine: 'underline' },
  btnInCellar: { backgroundColor: '#FFF1F2', borderWidth: 2, borderColor: '#FECDD3' },
  tastingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16, padding: 14 },
  rating: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E7E5E4', alignItems: 'center', justifyContent: 'center' },
  ratingText: { fontFamily: F.sansBold, fontSize: 18, color: C.muted },
  facts: { flexDirection: 'row', gap: 10, marginTop: 16 },
  fact: { flex: 1, backgroundColor: '#EFF6FF', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  year: { borderWidth: 1, borderColor: '#FDE68A', backgroundColor: '#FFFBEB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  yearOn: { backgroundColor: C.wine, borderColor: C.wineDark },
  yearText: { fontFamily: F.sansBold, color: '#78350F' },
  food: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12 },
  shop: { flexBasis: '47%', flexGrow: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, gap: 2 },
});
