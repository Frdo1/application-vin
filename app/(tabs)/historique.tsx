import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStore } from '@/lib/store';
import { C, F, S } from '@/lib/theme';
import { useScan } from '@/lib/useScan';
import { fmtDate } from '@/lib/wine';

export default function Historique() {
  const { scans, removeScan } = useStore();
  const { scan, reanalyze } = useScan();
  const { width } = useWindowDimensions();
  const size = (width - 16 * 2 - 12) / 2;

  return (
    <SafeAreaView edges={['top']} style={S.screen}>
      <FlatList
        data={scans}
        keyExtractor={(s) => s.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 30 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 8, alignItems: 'center' }}>
            <Text style={S.h1}>Historique</Text>
            <Text style={[S.muted, { marginTop: 4 }]}>
              {scans.length ? `Vos ${scans.length} derniers scans · touchez pour réanalyser` : 'Aucun scan récent.'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Pressable style={[S.btn, { flexDirection: 'row', gap: 8, borderRadius: 30 }]} onPress={() => scan(true)}>
              <MaterialIcons name="photo-camera" size={20} color={C.white} />
              <Text style={S.btnText}>Scanner une étiquette</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={[st.tile, { width: size, height: size * 1.33 }]} onPress={() => reanalyze(item.id, item.uri)}>
            <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={st.caption}>
              {!!item.wineName && (
                <Text style={st.captionName} numberOfLines={2}>
                  {item.wineName}
                </Text>
              )}
              <Text style={st.captionDate}>{fmtDate(item.date)}</Text>
            </View>
            <Pressable
              style={st.del}
              hitSlop={8}
              accessibilityLabel="Supprimer de l'historique"
              onPress={() =>
                Alert.alert('Supprimer ce scan ?', undefined, [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Supprimer', style: 'destructive', onPress: () => removeScan(item.id) },
                ])
              }>
              <MaterialIcons name="close" size={16} color={C.white} />
            </Pressable>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  tile: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#E7E5E4', borderWidth: 1, borderColor: C.border },
  caption: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.55)' },
  captionName: { fontFamily: F.serif, fontSize: 14, color: C.white },
  captionDate: { fontFamily: F.sansBold, fontSize: 11, color: '#E7E5E4', marginTop: 2 },
  del: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 14, padding: 5 },
});
