import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { C, S } from '@/lib/theme';

/** En-tête des écrans secondaires : flèche retour, titre, sous-titre, action à droite. */
export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={st.head}>
      <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Retour">
        <MaterialIcons name="arrow-back" size={26} color={C.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={S.h2}>{title}</Text>
        {!!subtitle && <Text style={S.muted}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
});
