import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WineCard } from '@/components/wine-card';
import { Pill } from '@/components/wine-ui';
import { errorMessage, searchWines } from '@/lib/api';
import { useStore } from '@/lib/store';
import { C, F, S } from '@/lib/theme';
import type { Wine } from '@/lib/types';
import { useScan } from '@/lib/useScan';
import { norm, POPULAR_WINES } from '@/lib/wine';

const IDEAS = ['Bordeaux puissant', 'Chablis minéral', 'Champagne de vigneron', 'Rouge léger pour l’été', 'Vin pour une raclette', 'Moins de 15 € pour un barbecue'];

export default function Recherche() {
  const { search, setSearch, findInCellar, addToCellar, removeFromCellar, setCurrent } = useStore();
  const { scan } = useScan();
  const [focused, setFocused] = useState(false);
  const [more, setMore] = useState(false);
  const [moreError, setMoreError] = useState('');

  const run = async (q: string) => {
    const query = q.trim();
    if (!query) return;
    Keyboard.dismiss();
    setFocused(false);
    setMoreError('');
    setSearch((s) => ({ ...s, query, results: [], loading: true, error: '', searched: true }));
    try {
      const results = await searchWines(query);
      setSearch((s) => ({ ...s, results, loading: false }));
    } catch (e) {
      setSearch((s) => ({ ...s, loading: false, error: errorMessage(e) }));
    }
  };

  const loadMore = async () => {
    if (more) return;
    setMore(true);
    setMoreError('');
    try {
      const extra = await searchWines(search.query, search.results.map((w) => w.name));
      const known = new Set(search.results.map((w) => norm(w.name)));
      const fresh = extra.filter((w) => !known.has(norm(w.name)));
      if (!fresh.length) setMoreError('Pas d’autre vin à proposer pour cette recherche.');
      setSearch((s) => ({ ...s, results: [...s.results, ...fresh] }));
    } catch (e) {
      setMoreError(errorMessage(e));
    } finally {
      setMore(false);
    }
  };

  const toggle = (w: Wine) => {
    const it = findInCellar(w);
    if (it && it.quantity > 0) removeFromCellar(it.key);
    else addToCellar(w);
  };

  const open = (w: Wine) => {
    setCurrent(w);
    router.push('/vin');
  };

  const q = norm(search.query);
  const suggestions =
    focused && q.length > 1
      ? POPULAR_WINES.filter((w) => norm(w).split(/[\s'-]+/).some((x) => x.startsWith(q)) || norm(w).startsWith(q)).slice(0, 5)
      : [];

  const header = (
    <View>
      <View style={st.hero}>
        <View style={st.glass}>
          <MaterialIcons name="wine-bar" size={30} color={C.wineDark} />
        </View>
        <Text style={st.title}>
          Le Sommelier <Text style={{ color: C.wine }}>IA</Text>
        </Text>
        <Text style={st.subtitle}>Découvrez les trésors du vignoble français. Décrivez vos envies ou scannez une étiquette.</Text>

        <View style={st.searchRow}>
          <TextInput
            style={[S.input, { flex: 1, paddingRight: 100 }, focused && { borderColor: C.wine }]}
            value={search.query}
            onChangeText={(t) => setSearch((s) => ({ ...s, query: t }))}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Décrivez un vin…"
            placeholderTextColor={C.faint}
            returnKeyType="search"
            onSubmitEditing={() => run(search.query)}
          />
          <View style={st.searchBtns}>
            <Pressable onPress={() => scan(true)} hitSlop={6} style={st.iconBtn} accessibilityLabel="Scanner une étiquette">
              <MaterialIcons name="photo-camera" size={24} color={C.muted} />
            </Pressable>
            <Pressable
              onPress={() => run(search.query)}
              disabled={search.loading}
              style={[st.iconBtn, { backgroundColor: C.wine }]}
              accessibilityLabel="Rechercher">
              {search.loading ? <ActivityIndicator color={C.white} size="small" /> : <MaterialIcons name="search" size={22} color={C.white} />}
            </Pressable>
          </View>
        </View>

        {suggestions.length > 0 && (
          <View style={st.suggest}>
            {suggestions.map((s) => (
              <Pressable key={s} onPress={() => run(s)} style={st.suggestItem}>
                <MaterialIcons name="search" size={16} color={C.faint} />
                <Text style={{ fontFamily: F.serifRegular, fontSize: 16, color: C.text }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={st.scanRow}>
          <Pressable style={st.scanBtn} onPress={() => scan(true)}>
            <MaterialIcons name="photo-camera" size={18} color={C.wine} />
            <Text style={st.scanText}>Photographier une étiquette</Text>
          </Pressable>
          <Pressable style={st.scanBtn} onPress={() => scan(false)}>
            <MaterialIcons name="photo-library" size={18} color={C.wine} />
            <Text style={st.scanText}>Importer</Text>
          </Pressable>
        </View>

        {!search.searched && (
          <View style={st.ideas}>
            {IDEAS.map((i) => (
              <Pill key={i} label={i} onPress={() => run(i)} />
            ))}
          </View>
        )}
      </View>

      {!!search.error && (
        <View style={st.error}>
          <Text style={[S.body, { fontFamily: F.sansBold, color: '#991B1B' }]}>Oups !</Text>
          <Text style={[S.body, { color: '#991B1B', textAlign: 'center' }]}>{search.error}</Text>
        </View>
      )}
      {search.loading && (
        <View style={{ alignItems: 'center', paddingVertical: 50, gap: 14 }}>
          <ActivityIndicator color={C.wine} size="large" />
          <Text style={{ fontFamily: F.serifItalic, fontSize: 18, color: C.wineDark }}>
            {search.query ? 'Le sommelier descend à la cave…' : 'Lecture de l’étiquette et recherche du prix…'}
          </Text>
        </View>
      )}
      {search.searched && !search.loading && !search.error && search.results.length === 0 && (
        <Text style={[S.muted, { textAlign: 'center', padding: 30 }]}>Aucun vin trouvé pour cette recherche.</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={S.screen}>
      <FlatList
        data={search.loading ? [] : search.results}
        keyExtractor={(w, i) => `${w.name}-${i}`}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 30 }}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <WineCard
              wine={item}
              onPress={() => open(item)}
              inCellar={(findInCellar(item)?.quantity ?? 0) > 0}
              onToggleCellar={() => toggle(item)}
            />
          </View>
        )}
        ListFooterComponent={
          search.results.length > 0 && !search.loading && search.query ? (
            <View style={{ alignItems: 'center', paddingTop: 24, gap: 8 }}>
              <Pressable style={[S.btnGhost, { flexDirection: 'row', gap: 8, borderRadius: 30 }]} onPress={loadMore} disabled={more}>
                {more ? <ActivityIndicator color={C.wine} /> : <MaterialIcons name="add" size={20} color={C.text} />}
                <Text style={{ fontFamily: F.serif, fontSize: 16, color: C.text }}>{more ? 'Recherche en cours…' : 'Voir d’autres vins'}</Text>
              </Pressable>
              {!!moreError && <Text style={S.muted}>{moreError}</Text>}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  hero: { backgroundColor: C.white, borderBottomWidth: 1, borderColor: C.border, paddingHorizontal: 18, paddingTop: 26, paddingBottom: 22, marginBottom: 18 },
  glass: { alignSelf: 'center', backgroundColor: C.wineSoft, borderRadius: 40, padding: 12, borderWidth: 1, borderColor: '#FDE8E8', marginBottom: 14 },
  title: { fontFamily: F.serif, fontSize: 38, color: C.text, textAlign: 'center' },
  subtitle: { fontFamily: F.sansLight, fontSize: 16, color: C.muted, textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 22 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchBtns: { position: 'absolute', right: 6, flexDirection: 'row', gap: 4, alignItems: 'center' },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  suggest: { marginTop: 8, backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', elevation: 4 },
  suggestItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F5F5F4' },
  scanRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  scanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.wineSoft,
    borderWidth: 1,
    borderColor: '#FBD5D5',
  },
  scanText: { fontFamily: F.sansBold, fontSize: 13, color: C.wine },
  ideas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  error: { marginHorizontal: 16, padding: 20, borderRadius: 14, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2', alignItems: 'center', gap: 6 },
});
