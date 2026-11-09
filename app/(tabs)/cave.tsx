import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePremium } from '@/components/premium';
import { WineCard } from '@/components/wine-card';
import { Pill } from '@/components/wine-ui';
import { openPaywall } from '@/lib/quota';
import { useStore } from '@/lib/store';
import { C, F, S } from '@/lib/theme';
import type { CellarItem } from '@/lib/types';
import { drinkStatus, DrinkStatus, itemValue, norm } from '@/lib/wine';

type Filter = 'all' | DrinkStatus | 'tasted';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'ready', label: 'À boire' },
  { id: 'past', label: 'À boire vite' },
  { id: 'young', label: 'À garder' },
  { id: 'tasted', label: 'Déjà bus' },
];

type Sort = 'recent' | 'drink' | 'value';

export default function Cave() {
  const { cellar, setQuantity, removeFromCellar, setCurrent, updateItem } = useStore();
  const { premium } = usePremium();
  // Outils avancés réservés aux abonnés : sinon on présente le Premium.
  const go = (path: '/cave-plan' | '/cave-journal' | '/cave-outils') => (premium ? router.push(path) : openPaywall());
  const [filter, setFilter] = useState<Filter>('all');
  const [type, setType] = useState<string>('');
  const [text, setText] = useState('');
  const [sort, setSort] = useState<Sort>('recent');

  const inStock = cellar.filter((c) => c.quantity > 0);
  const bottles = inStock.reduce((n, c) => n + c.quantity, 0);
  const value = inStock.reduce((n, c) => n + itemValue(c), 0);
  const toDrink = inStock.filter((c) => ['ready', 'past'].includes(drinkStatus(c.wine, c.vintage))).reduce((n, c) => n + c.quantity, 0);
  const types = [...new Set(inStock.map((c) => c.wine.type))];

  const list = useMemo(() => {
    const q = norm(text);
    const order: Record<DrinkStatus, number> = { past: 0, ready: 1, young: 2, unknown: 3 };
    return cellar
      .filter((c) => (filter === 'tasted' ? c.quantity === 0 : c.quantity > 0))
      .filter((c) => filter === 'all' || filter === 'tasted' || drinkStatus(c.wine, c.vintage) === filter)
      .filter((c) => !type || c.wine.type === type)
      .filter((c) => !q || norm(`${c.wine.name} ${c.wine.appellation} ${c.wine.region} ${c.vintage}`).includes(q))
      .sort((a, b) =>
        sort === 'value'
          ? itemValue(b) - itemValue(a)
          : sort === 'drink'
            ? order[drinkStatus(a.wine, a.vintage)] - order[drinkStatus(b.wine, b.vintage)]
            : b.dateAdded - a.dateAdded,
      );
  }, [cellar, filter, type, text, sort]);

  const open = (c: CellarItem) => {
    setCurrent({ ...c.wine, vintage: c.vintage });
    router.push('/vin');
  };

  const menu = (c: CellarItem) =>
    Alert.alert(c.wine.name + (c.vintage ? ` ${c.vintage}` : ''), undefined, [
      {
        text: 'Prix payé…',
        onPress: () =>
          Alert.prompt
            ? Alert.prompt('Prix payé par bouteille (€)', undefined, (v) => updateItem(c.key, { pricePaid: parseFloat(v) || undefined }))
            : setPriceFor(c),
      },
      { text: 'Ranger dans un casier', onPress: () => go('/cave-plan') },
      { text: 'Supprimer de la cave', style: 'destructive', onPress: () => removeFromCellar(c.key) },
      { text: 'Annuler', style: 'cancel' },
    ]);

  // Saisie du prix payé (Android n'a pas Alert.prompt)
  const [priceFor, setPriceFor] = useState<CellarItem | null>(null);
  const [priceText, setPriceText] = useState('');

  if (cellar.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={[S.screen, { justifyContent: 'center', padding: 24 }]}>
        <View style={[S.card, { alignItems: 'center', gap: 10, paddingVertical: 36 }]}>
          <MaterialIcons name="wine-bar" size={40} color={C.faint} />
          <Text style={[S.body, { fontFamily: F.sansBold }]}>Votre cave est vide</Text>
          <Text style={[S.muted, { textAlign: 'center' }]}>Recherchez ou scannez des vins et touchez le cœur pour les ajouter ici.</Text>
          <Pressable style={[S.btn, { marginTop: 10, borderRadius: 30 }]} onPress={() => router.navigate('/')}>
            <Text style={S.btnText}>Trouver un vin</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={S.screen}>
      <FlatList
        data={list}
        keyExtractor={(c) => c.key}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <Text style={[S.h1, { marginBottom: 16 }]}>Ma cave</Text>
            <View style={st.stats}>
              <Stat label="Références" value={String(inStock.length)} />
              <Stat label="Bouteilles" value={String(bottles)} accent />
              <Stat label="À boire" value={String(toDrink)} />
            </View>
            <View style={[st.stat, { marginTop: 10 }]}>
              <Text style={S.overline}>Valeur estimée</Text>
              <Text style={st.statValue}>{value.toLocaleString('fr-FR')} €</Text>
            </View>
            <View style={st.tools}>
              {(
                [
                  ['/cave-plan', 'grid-view', 'Plan de cave'],
                  ['/cave-journal', 'insights', 'Journal & stats'],
                  ['/cave-outils', 'notifications-active', 'Alertes & sauvegarde'],
                ] as const
              ).map(([path, icon, label]) => (
                <Pressable key={path} style={st.tool} onPress={() => go(path)}>
                  <MaterialIcons name={icon} size={22} color={C.wine} />
                  <Text style={st.toolText} numberOfLines={2}>
                    {label}
                  </Text>
                  {!premium && <MaterialIcons name="workspace-premium" size={14} color={C.goldText} style={st.lock} />}
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[S.input, { marginTop: 14, paddingVertical: 10 }]}
              value={text}
              onChangeText={setText}
              placeholder="Chercher dans ma cave…"
              placeholderTextColor={C.faint}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
              {FILTERS.map((f) => (
                <Pill key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
              ))}
              {types.length > 1 &&
                types.map((t) => <Pill key={t} label={t} active={type === t} onPress={() => setType(type === t ? '' : t)} />)}
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
              <Text style={S.muted}>Trier :</Text>
              {(
                [
                  ['recent', 'Récents'],
                  ['drink', 'À boire d’abord'],
                  ['value', 'Valeur'],
                ] as [Sort, string][]
              ).map(([id, label]) => (
                <Pressable key={id} onPress={() => setSort(id)}>
                  <Text style={[S.muted, sort === id && { color: C.wine, fontFamily: F.sansBold }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[S.muted, { fontSize: 12, marginTop: 8 }]}>Appui long sur un vin : prix payé, rangement ou suppression.</Text>
          </View>
        }
        ListEmptyComponent={<Text style={[S.muted, { textAlign: 'center', padding: 24 }]}>Aucun vin pour ce filtre.</Text>}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => menu(item)} delayLongPress={350}>
            <WineCard
              wine={{ ...item.wine, vintage: item.vintage }}
              item={item}
              onPress={() => open(item)}
              onQuantity={(d) => setQuantity(item.key, item.quantity + d)}
            />
          </Pressable>
        )}
      />

      {priceFor && (
        <View style={st.overlay}>
          <View style={[S.card, { width: '100%', gap: 12 }]}>
            <Text style={S.h3}>Prix payé par bouteille</Text>
            <TextInput
              style={[S.input, { borderRadius: 12 }]}
              value={priceText}
              onChangeText={setPriceText}
              keyboardType="decimal-pad"
              placeholder="ex. 24,50"
              placeholderTextColor={C.faint}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={[S.btnGhost, { flex: 1 }]} onPress={() => setPriceFor(null)}>
                <Text style={{ fontFamily: F.sansBold, color: C.text }}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[S.btn, { flex: 1 }]}
                onPress={() => {
                  const v = parseFloat(priceText.replace(',', '.'));
                  updateItem(priceFor.key, { pricePaid: v > 0 ? v : undefined });
                  setPriceFor(null);
                  setPriceText('');
                }}>
                <Text style={S.btnText}>Enregistrer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[st.stat, { flex: 1 }]}>
      <Text style={S.overline}>{label}</Text>
      <Text style={[st.statValue, accent && { color: C.wine }]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10 },
  tools: { flexDirection: 'row', gap: 10, marginTop: 10 },
  tool: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: C.wineSoft,
    borderWidth: 1,
    borderColor: '#FBD5D5',
  },
  toolText: { fontFamily: F.sansBold, fontSize: 12, color: C.wine, textAlign: 'center' },
  lock: { position: 'absolute', top: 6, right: 6 },
  stat: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: '#F0EEEC', padding: 12, alignItems: 'center' },
  statValue: { fontFamily: F.serif, fontSize: 24, color: C.text, marginTop: 2 },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
});
