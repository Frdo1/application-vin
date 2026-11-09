import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { Pill } from '@/components/wine-ui';
import { useStore } from '@/lib/store';
import { C, F, S } from '@/lib/theme';
import type { CellarItem, Move, WineType } from '@/lib/types';
import { fmtDate, TYPE_COLORS } from '@/lib/wine';

type Kind = 'all' | 'in' | 'out';

/** Regroupe les bouteilles en cave par critère, du plus fourni au moins fourni. */
function groupBy(items: CellarItem[], key: (c: CellarItem) => string) {
  const m = new Map<string, number>();
  for (const c of items) m.set(key(c) || 'Non précisé', (m.get(key(c) || 'Non précisé') || 0) + c.quantity);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Bars({ title, data, color }: { title: string; data: [string, number][]; color?: (label: string) => string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d[1]));
  return (
    <View style={[S.card, { marginBottom: 14 }]}>
      <Text style={S.h3}>{title}</Text>
      {data.slice(0, 8).map(([label, n]) => (
        <View key={label} style={st.barRow}>
          <Text style={st.barLabel} numberOfLines={1}>
            {label}
          </Text>
          <View style={st.barTrack}>
            <View style={[st.bar, { width: `${Math.max(6, (n / max) * 100)}%`, backgroundColor: color?.(label) ?? C.wine }]} />
          </View>
          <Text style={st.barValue}>{n}</Text>
        </View>
      ))}
    </View>
  );
}

/** Journal des entrées / sorties et statistiques de la cave. */
export default function CaveJournal() {
  const { cellar, moves } = useStore();
  const [kind, setKind] = useState<Kind>('all');

  const stock = cellar.filter((c) => c.quantity > 0);
  const year = new Date().getFullYear();
  const thisYear = moves.filter((m) => new Date(m.date).getFullYear() === year);
  const drunk = -thisYear.filter((m) => m.qty < 0).reduce((n, m) => n + m.qty, 0);
  const added = thisYear.filter((m) => m.qty > 0).reduce((n, m) => n + m.qty, 0);

  const byType = useMemo(() => groupBy(stock, (c) => c.wine.type), [stock]);
  const byRegion = useMemo(() => groupBy(stock, (c) => c.wine.region), [stock]);
  const byDecade = useMemo(
    () => groupBy(stock, (c) => (parseInt(c.vintage, 10) ? `${Math.floor(parseInt(c.vintage, 10) / 10) * 10}s` : 'Sans millésime')),
    [stock],
  );

  const list = moves.filter((m) => kind === 'all' || (kind === 'in' ? m.qty > 0 : m.qty < 0));

  return (
    <SafeAreaView edges={['top']} style={S.screen}>
      <ScreenHeader title="Journal & statistiques" />
      <FlatList
        data={list}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            <View style={st.stats}>
              <Stat label="En cave" value={stock.reduce((n, c) => n + c.quantity, 0)} />
              <Stat label={`Bues en ${year}`} value={drunk} accent />
              <Stat label={`Entrées ${year}`} value={added} />
            </View>
            <Bars title="Par couleur" data={byType} color={(l) => TYPE_COLORS[l as WineType]?.liquid ?? C.wine} />
            <Bars title="Par région" data={byRegion} />
            <Bars title="Par décennie" data={byDecade} color={() => C.goldText} />
            <Text style={[S.h3, { marginTop: 6 }]}>Journal de cave</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <Pill label="Tout" active={kind === 'all'} onPress={() => setKind('all')} />
              <Pill label="Entrées" active={kind === 'in'} onPress={() => setKind('in')} />
              <Pill label="Sorties" active={kind === 'out'} onPress={() => setKind('out')} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={[S.muted, { textAlign: 'center', padding: 20 }]}>
            Les bouteilles ajoutées et bues apparaîtront ici à partir de maintenant.
          </Text>
        }
        renderItem={({ item }) => <MoveRow m={item} />}
      />
    </SafeAreaView>
  );
}

function MoveRow({ m }: { m: Move }) {
  const out = m.qty < 0;
  return (
    <View style={st.move}>
      <View style={[st.badge, { backgroundColor: out ? C.wineSoft : '#ECFDF5' }]}>
        <Text style={[st.badgeText, { color: out ? C.wine : '#15803D' }]}>{out ? m.qty : `+${m.qty}`}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.moveName}>
          {m.name} {m.vintage}
        </Text>
        <Text style={S.muted}>
          {fmtDate(m.date)}
          {m.note ? ` · ${m.note}` : ''}
        </Text>
      </View>
    </View>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <View style={st.stat}>
      <Text style={S.overline}>{label}</Text>
      <Text style={[st.statValue, accent && { color: C.wine }]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: { flex: 1, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: '#F0EEEC', padding: 12, alignItems: 'center' },
  statValue: { fontFamily: F.serif, fontSize: 24, color: C.text, marginTop: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  barLabel: { width: 110, fontFamily: F.sans, fontSize: 14, color: C.text },
  barTrack: { flex: 1, height: 12, borderRadius: 6, backgroundColor: '#F5F5F4', overflow: 'hidden' },
  bar: { height: 12, borderRadius: 6 },
  barValue: { width: 30, textAlign: 'right', fontFamily: F.sansBold, fontSize: 14, color: C.text },
  move: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderColor: '#F0EEEC' },
  badge: { minWidth: 40, borderRadius: 10, paddingVertical: 6, alignItems: 'center' },
  badgeText: { fontFamily: F.sansBold, fontSize: 15 },
  moveName: { fontFamily: F.serif, fontSize: 16, color: C.text },
});
