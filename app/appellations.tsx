import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pill } from '@/components/wine-ui';
import { APPELLATIONS, REGIONS } from '@/lib/appellations';
import { C, F, S } from '@/lib/theme';
import { norm } from '@/lib/wine';

const ALL = 'Toutes';
const SORTED = [...APPELLATIONS].sort((a, b) => norm(a.n).localeCompare(norm(b.n)));

/** Catalogue des appellations : consultable hors ligne, sans appel à l'IA. */
export default function Appellations() {
  const [region, setRegion] = useState<string>(ALL);
  const [filter, setFilter] = useState('');

  const list = useMemo(() => {
    const q = norm(filter);
    return SORTED.filter(
      (a) =>
        (region === ALL || a.r === region) &&
        (!q || norm(a.n).includes(q) || (a.a || []).some((x) => norm(x).includes(q))),
    );
  }, [region, filter]);

  // Une appellation lance la recherche de ses vins (souvent déjà dans le catalogue partagé).
  const pick = (name: string) => router.navigate({ pathname: '/', params: { q: name } });

  return (
    <SafeAreaView edges={['top']} style={S.screen}>
      <View style={st.head}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Retour">
          <MaterialIcons name="arrow-back" size={26} color={C.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={S.h2}>Appellations de France</Text>
          <Text style={S.muted}>{list.length} appellations · touchez-en une pour voir ses vins</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <TextInput
          style={S.input}
          value={filter}
          onChangeText={setFilter}
          placeholder="Chercher une appellation…"
          placeholderTextColor={C.faint}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.regions} style={{ flexGrow: 0 }}>
        {[ALL, ...REGIONS].map((r) => (
          <Pill key={r} label={r} active={region === r} onPress={() => setRegion(r)} />
        ))}
      </ScrollView>

      <FlatList
        data={list}
        keyExtractor={(a) => `${a.n}-${a.igp ? 'igp' : 'aop'}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
        ListEmptyComponent={<Text style={[S.muted, { textAlign: 'center', padding: 30 }]}>Aucune appellation trouvée.</Text>}
        renderItem={({ item }) => (
          <Pressable style={st.row} onPress={() => pick(item.n)}>
            <View style={{ flex: 1 }}>
              <Text style={st.name}>{item.n}</Text>
              <Text style={S.muted}>
                {item.r}
                {item.a?.length ? ` · aussi « ${item.a[0]} »` : ''}
              </Text>
            </View>
            <View style={[st.tag, item.igp && { backgroundColor: C.cyanSoft }]}>
              <Text style={[st.tagText, item.igp && { color: C.cyan }]}>{item.igp ? 'IGP' : 'AOP'}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={C.faint} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  regions: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderColor: '#F0EEEC',
  },
  name: { fontFamily: F.serif, fontSize: 17, color: C.text },
  tag: { backgroundColor: C.wineSoft, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { fontFamily: F.sansBold, fontSize: 11, color: C.wine, letterSpacing: 0.6 },
});
