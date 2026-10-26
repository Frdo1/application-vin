import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, F, S } from '@/lib/theme';
import type { CellarItem, Wine } from '@/lib/types';
import { drinkStatus, TYPE_COLORS } from '@/lib/wine';

import { Heart, StatusBadge, TypeBadge, WineImage } from './wine-ui';

type Props = {
  wine: Wine;
  onPress: () => void;
  inCellar?: boolean;
  onToggleCellar?: () => void;
  /** Mode cave : affiche le stock et le statut « à boire / à garder » */
  item?: CellarItem;
  onQuantity?: (delta: number) => void;
};

export function WineCard({ wine, onPress, inCellar, onToggleCellar, item, onQuantity }: Props) {
  const vintage = item?.vintage ?? wine.vintage;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.card, pressed && { opacity: 0.92 }]} accessibilityRole="button">
      <View style={st.imageBox}>
        <WineImage wine={wine} height={item ? 150 : 210} />
        <View style={st.price}>
          <Text style={st.priceLabel}>PRIX</Text>
          <Text style={st.priceValue}>{item?.pricePaid ? `${item.pricePaid} €` : wine.priceRange || '—'}</Text>
        </View>
        {item && onQuantity ? (
          <View style={st.stock}>
            <Pressable onPress={() => onQuantity(-1)} hitSlop={8} style={st.stockBtn} accessibilityLabel="Une bouteille en moins">
              <Text style={st.stockSign}>−</Text>
            </Pressable>
            <Text style={st.stockQty}>{item.quantity}</Text>
            <Pressable onPress={() => onQuantity(1)} hitSlop={8} style={st.stockBtn} accessibilityLabel="Une bouteille en plus">
              <Text style={st.stockSign}>+</Text>
            </Pressable>
          </View>
        ) : (
          onToggleCellar && (
            <Pressable
              onPress={onToggleCellar}
              hitSlop={10}
              style={st.heart}
              accessibilityLabel={inCellar ? 'Retirer de ma cave' : 'Ajouter à ma cave'}>
              <Heart filled={!!inCellar} />
            </Pressable>
          )
        )}
      </View>
      <View style={[st.band, { backgroundColor: TYPE_COLORS[wine.type]?.liquid ?? C.wine }]} />
      <View style={{ padding: 16, gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <TypeBadge type={wine.type} />
          {item && <StatusBadge status={drinkStatus(wine, vintage)} />}
        </View>
        <Text style={st.name} numberOfLines={2}>
          {wine.name}
          {vintage ? ` ${vintage}` : ''}
        </Text>
        <Text style={st.region} numberOfLines={1}>
          {[wine.region, wine.appellation].filter(Boolean).join(' · ')}
        </Text>
        {!item && !!wine.description && (
          <Text style={[S.muted, { fontFamily: F.serifItalic }]} numberOfLines={2}>
            {wine.description}
          </Text>
        )}
        {item?.tasting && <Text style={[S.muted, { color: C.wine }]}>Ma note : {item.tasting.rating}/100</Text>}
      </View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  imageBox: { backgroundColor: '#F6F3EC', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  price: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  priceLabel: { fontFamily: F.sansBold, fontSize: 10, color: C.faint, letterSpacing: 1 },
  priceValue: { fontFamily: F.serif, fontSize: 14, color: C.wineDark },
  heart: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 22, padding: 9 },
  stock: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
  },
  stockBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  stockSign: { fontSize: 20, color: C.muted, fontFamily: F.sansBold },
  stockQty: { fontFamily: F.serif, fontSize: 17, color: C.wineDark, minWidth: 22, textAlign: 'center' },
  band: { height: 4, opacity: 0.85 },
  name: { fontFamily: F.serif, fontSize: 20, color: C.text, lineHeight: 26 },
  region: { fontFamily: F.sansBold, fontSize: 12, color: C.wine, letterSpacing: 0.8, textTransform: 'uppercase' },
});
