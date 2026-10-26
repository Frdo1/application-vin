import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { C, F, S } from '@/lib/theme';
import type { Wine, WineType } from '@/lib/types';
import { DrinkStatus, STATUS_COLOR, STATUS_LABEL, TYPE_COLORS } from '@/lib/wine';

/** Bouteille dessinée, utilisée quand il n'y a pas de photo. */
export function Bottle({ type, height = 200 }: { type: WineType; height?: number }) {
  const glass = type === 'Rouge' ? '#290e0e' : '#DDE1E5';
  return (
    <Svg width={(height * 60) / 160} height={height} viewBox="0 0 60 160">
      <Path d="M20 0H40V30C40 30 55 40 55 70V150C55 155.5 50.5 160 45 160H15C9.5 160 5 155.5 5 150V70C5 40 20 30 20 30V0Z" fill={glass} />
      <Path d="M8 80 H52 V150 C52 153 50 156 46 156 H14 C10 156 8 153 8 150Z" fill={TYPE_COLORS[type]?.liquid ?? '#720e1e'} opacity={0.55} />
      <Rect x={10} y={72} width={40} height={42} rx={2} fill="#FFFEFC" />
      <Rect x={14} y={78} width={32} height={1} fill="#1C1917" opacity={0.25} />
      <Rect x={14} y={83} width={24} height={1} fill="#1C1917" opacity={0.25} />
      <Rect x={14} y={92} width={32} height={3} fill="#881337" opacity={0.8} />
      <Rect x={14} y={99} width={20} height={1.5} fill="#1C1917" opacity={0.5} />
      <Rect x={19} y={0} width={22} height={12} fill="#7F1D1D" />
    </Svg>
  );
}

/** Photo de l'étiquette si on l'a, sinon vignette web, sinon bouteille dessinée. */
export function WineImage({ wine, height = 220 }: { wine: Wine; height?: number }) {
  const [failed, setFailed] = useState(false);
  const thumb = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(`${wine.name} ${wine.vintage} bouteille vin`)}&w=400&h=600&c=7&rs=1&p=0`;
  const uri = wine.photoUri || thumb;
  if (failed) return <Bottle type={wine.type} height={height * 0.9} />;
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', height }}
      contentFit="contain"
      transition={250}
      onError={() => setFailed(true)}
      accessibilityLabel={wine.name}
    />
  );
}

export function TypeBadge({ type }: { type: WineType }) {
  const c = TYPE_COLORS[type] ?? TYPE_COLORS.Rouge;
  return (
    <View style={[st.badge, { backgroundColor: c.badgeBg }]}>
      <Text style={[st.badgeText, { color: c.badgeText }]}>{type}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: DrinkStatus }) {
  return (
    <View style={[st.badge, { backgroundColor: STATUS_COLOR[status] }]}>
      <Text style={[st.badgeText, { color: C.white }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

export function Heart({ filled, size = 22 }: { filled: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? C.rose : 'none'} stroke={filled ? C.rose : C.faint} strokeWidth={2}>
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </Svg>
  );
}

export function Chips({ items }: { items: string[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map((x, i) => (
        <View key={i} style={S.chip}>
          <Text style={S.chipText}>{x}</Text>
        </View>
      ))}
    </View>
  );
}

/** Courbe de garde : jeunesse → apogée → déclin (reprise de la v1, avec la position actuelle). */
export function AgingGraph({ wine, vintage }: { wine: Wine; vintage?: string }) {
  const [w, setW] = useState(300);
  const H = 120;
  const max = Math.max(wine.peakEnd + 5, 15);
  const x = (years: number) => (years / max) * w;
  const ps = x(wine.peakStart);
  const pe = x(wine.peakEnd);
  const top = 24;
  const bot = H;
  const curve = `M 0 ${bot} C ${ps / 2} ${bot}, ${ps / 2} ${top}, ${ps} ${top} H ${pe} C ${pe + (w - pe) / 2} ${top}, ${pe + (w - pe) / 2} ${bot}, ${w} ${bot}`;
  const age = vintage ? new Date().getFullYear() - parseInt(vintage, 10) : NaN;
  const nowX = Number.isFinite(age) && age >= 0 ? Math.min(w, x(age)) : null;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={S.overline}>Jeunesse</Text>
        <Text style={[S.overline, { color: C.wine }]}>Apogée</Text>
        <Text style={S.overline}>Déclin</Text>
      </View>
      <Svg width={w} height={H + 2}>
        <Defs>
          <LinearGradient id="g" x1="0" x2="1" y1="0" y2="0">
            <Stop offset="0" stopColor="#D6D3D1" stopOpacity="0.5" />
            <Stop offset={String(ps / w)} stopColor="#EAB308" stopOpacity="0.6" />
            <Stop offset={String(pe / w)} stopColor="#9B1C1C" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#78350F" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>
        <Path d={`${curve} V ${bot} H 0 Z`} fill="url(#g)" />
        <Path d={curve} stroke="#A8A29E" strokeWidth={1} strokeDasharray="3 3" fill="none" />
        <Line x1={0} y1={bot} x2={w} y2={bot} stroke="#D6D3D1" />
        {nowX != null && <Line x1={nowX} y1={8} x2={nowX} y2={bot} stroke={C.text} strokeWidth={2} />}
      </Svg>
      <View style={{ height: 20 }}>
        <Text style={[st.tick, { left: Math.max(0, ps - 20) }]}>{wine.peakStart} ans</Text>
        <Text style={[st.tick, { left: Math.min(w - 44, pe - 20) }]}>{wine.peakEnd} ans</Text>
      </View>
      {nowX != null && (
        <Text style={[S.muted, { marginTop: 4 }]}>
          Trait noir : aujourd’hui ({age} an{age > 1 ? 's' : ''} après le millésime {vintage}).
        </Text>
      )}
    </View>
  );
}

export function LabeledSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[S.body, { fontFamily: F.sansBold }]}>{label}</Text>
        <Text style={S.muted}>{value}</Text>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={(v) => onChange(Math.round(v))}
        minimumTrackTintColor={C.wine}
        maximumTrackTintColor="#D6D3D1"
        thumbTintColor={C.wine}
        accessibilityLabel={label}
      />
    </View>
  );
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 26, marginBottom: 12 }, style]}>
      <Text style={S.h3}>{children}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border, marginBottom: 8 }} />
    </View>
  );
}

export function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[st.pill, active && { backgroundColor: C.wine, borderColor: C.wine }]} accessibilityRole="button">
      <Text style={[st.pillText, active && { color: C.white }]}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontFamily: F.sansBold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
  tick: { position: 'absolute', fontFamily: F.sansBold, fontSize: 11, color: C.wine, width: 44, textAlign: 'center' },
  pill: { borderWidth: 1, borderColor: C.border, backgroundColor: C.white, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  pillText: { fontFamily: F.sansBold, fontSize: 12, color: C.muted, letterSpacing: 0.5 },
});
