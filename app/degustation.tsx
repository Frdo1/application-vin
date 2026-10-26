import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LabeledSlider, SectionTitle } from '@/components/wine-ui';
import { AROMAS } from '@/lib/aromas';
import { useStore } from '@/lib/store';
import { C, F, S } from '@/lib/theme';
import type { Tasting } from '@/lib/types';
import { fmtDate, newTasting } from '@/lib/wine';

export default function Degustation() {
  const { current: wine, findInCellar, saveTasting } = useStore();
  const params = useLocalSearchParams<{ vintage?: string }>();
  const startVintage = params.vintage || wine?.vintage || '';
  const existing = wine ? findInCellar(wine, startVintage)?.tasting : undefined;
  const [t, setT] = useState<Tasting>(existing ?? newTasting(startVintage));
  const [aromasOpen, setAromasOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  if (!wine) return null;

  const set = <K extends keyof Tasting>(k: K, v: Tasting[K]) => setT((p) => ({ ...p, [k]: v }));
  const setVisual = (k: keyof Tasting['visual'], v: number) => setT((p) => ({ ...p, visual: { ...p.visual, [k]: v } }));
  const setNose = (k: 'intensity' | 'impression', v: number) => setT((p) => ({ ...p, nose: { ...p.nose, [k]: v } }));
  const setMouth = (k: keyof Tasting['mouth'], v: number) => setT((p) => ({ ...p, mouth: { ...p.mouth, [k]: v } }));
  const toggleAroma = (a: string) =>
    setT((p) => ({
      ...p,
      nose: { ...p.nose, aromas: p.nose.aromas.includes(a) ? p.nose.aromas.filter((x) => x !== a) : [...p.nose.aromas, a] },
    }));

  const save = () => {
    saveTasting(wine, t);
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={S.screen}>
      <View style={st.bar}>
        <Pressable onPress={() => router.back()} style={st.barBtn} accessibilityLabel="Retour">
          <MaterialIcons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={[S.overline, { color: C.muted }]}>Fiche de dégustation</Text>
        <Pressable onPress={save} style={[st.barBtn, { backgroundColor: C.wine }]} accessibilityLabel="Enregistrer">
          <MaterialIcons name="check" size={24} color={C.white} />
        </Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Text style={[S.h2, { textAlign: 'center' }]}>{wine.name}</Text>
          <Text style={[S.muted, { textAlign: 'center', marginTop: 4 }]}>
            {[wine.appellation, wine.type].filter(Boolean).join(' • ')}
          </Text>

          <View style={st.score}>
            <Pressable onPress={() => set('rating', Math.max(0, t.rating - 1))} hitSlop={10} accessibilityLabel="Moins un point">
              <MaterialIcons name="remove-circle-outline" size={32} color={C.faint} />
            </Pressable>
            <View style={st.scoreCircle}>
              <View style={[st.scoreFill, { height: `${t.rating}%` }]} />
              <Text style={st.scoreText}>{t.rating}</Text>
            </View>
            <Pressable onPress={() => set('rating', Math.min(100, t.rating + 1))} hitSlop={10} accessibilityLabel="Plus un point">
              <MaterialIcons name="add-circle-outline" size={32} color={C.faint} />
            </Pressable>
          </View>
          <LabeledSlider label="Note globale /100" value={t.rating} onChange={(v) => set('rating', v)} />

          <View style={st.infoRow}>
            <Pressable style={st.info} onPress={() => setDateOpen(true)}>
              <Text style={S.overline}>Date</Text>
              <Text style={st.infoVal}>{fmtDate(t.date)}</Text>
            </Pressable>
            <View style={st.info}>
              <Text style={S.overline}>Millésime</Text>
              <TextInput
                style={st.infoInput}
                value={t.vintage}
                onChangeText={(v) => set('vintage', v.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                placeholder="—"
                placeholderTextColor={C.faint}
              />
            </View>
            <View style={st.info}>
              <Text style={S.overline}>Lieu</Text>
              <TextInput
                style={st.infoInput}
                value={t.location}
                onChangeText={(v) => set('location', v)}
                placeholder="Choisir"
                placeholderTextColor={C.faint}
              />
            </View>
          </View>
          {dateOpen && (
            <DateTimePicker
              value={new Date(t.date)}
              mode="date"
              onChange={(e, d) => {
                setDateOpen(false);
                if (e.type === 'set' && d) set('date', d.toISOString().slice(0, 10));
              }}
            />
          )}

          <TextInput
            style={st.line}
            value={t.guests}
            onChangeText={(v) => set('guests', v)}
            placeholder="Personnes présentes"
            placeholderTextColor={C.faint}
          />

          <SectionTitle>Visuel</SectionTitle>
          <LabeledSlider label="Intensité" value={t.visual.intensity} onChange={(v) => setVisual('intensity', v)} />
          <LabeledSlider label="Limpidité" value={t.visual.limpidity} onChange={(v) => setVisual('limpidity', v)} />
          <LabeledSlider label="Brillance" value={t.visual.brilliance} onChange={(v) => setVisual('brilliance', v)} />
          <LabeledSlider label="Fluidité (larmes)" value={t.visual.tears} onChange={(v) => setVisual('tears', v)} />

          <SectionTitle>Nez</SectionTitle>
          <LabeledSlider label="Impression" value={t.nose.impression} onChange={(v) => setNose('impression', v)} />
          <LabeledSlider label="Intensité" value={t.nose.intensity} onChange={(v) => setNose('intensity', v)} />
          {t.nose.aromas.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {t.nose.aromas.map((a) => (
                <Pressable key={a} onPress={() => toggleAroma(a)} style={st.aromaTag}>
                  <Text style={st.aromaTagText}>{a}</Text>
                  <MaterialIcons name="close" size={14} color={C.cyan} />
                </Pressable>
              ))}
            </View>
          )}
          <Pressable style={st.addAroma} onPress={() => setAromasOpen(true)}>
            <MaterialIcons name="add-circle-outline" size={20} color={C.cyan} />
            <Text style={{ fontFamily: F.sansBold, color: C.cyan }}>Ajouter des arômes</Text>
          </Pressable>

          <SectionTitle>Bouche</SectionTitle>
          <LabeledSlider label="Sucre" value={t.mouth.sugar} onChange={(v) => setMouth('sugar', v)} />
          <LabeledSlider label="Alcool" value={t.mouth.alcohol} onChange={(v) => setMouth('alcohol', v)} />
          <LabeledSlider label="Acidité" value={t.mouth.acidity} onChange={(v) => setMouth('acidity', v)} />
          <LabeledSlider label="Tanins" value={t.mouth.tannins} onChange={(v) => setMouth('tannins', v)} />
          <LabeledSlider label="Persistance" value={t.mouth.persistence} onChange={(v) => setMouth('persistence', v)} />
          <View style={st.caudalie}>
            <MaterialIcons name="timer" size={20} color={C.faint} />
            <Text style={[S.body, { flex: 1 }]}>Longueur en bouche (caudalies)</Text>
            <TextInput
              style={[st.infoInput, { width: 60, borderWidth: 1, borderColor: C.border, borderRadius: 8 }]}
              value={t.mouth.caudalie ? String(t.mouth.caudalie) : ''}
              onChangeText={(v) => setMouth('caudalie', parseInt(v.replace(/\D/g, ''), 10) || 0)}
              keyboardType="number-pad"
            />
          </View>

          <SectionTitle>Conclusion</SectionTitle>
          <TextInput
            style={st.comment}
            value={t.comment}
            onChangeText={(v) => set('comment', v)}
            placeholder="Commentaires"
            placeholderTextColor={C.faint}
            multiline
          />

          <Pressable style={[S.btn, { marginTop: 24 }]} onPress={save}>
            <Text style={S.btnText}>Enregistrer la dégustation</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <AromaPicker visible={aromasOpen} selected={t.nose.aromas} onToggle={toggleAroma} onClose={() => setAromasOpen(false)} />
    </SafeAreaView>
  );
}

function AromaPicker({
  visible,
  selected,
  onToggle,
  onClose,
}: {
  visible: boolean;
  selected: string[];
  onToggle: (a: string) => void;
  onClose: () => void;
}) {
  const [family, setFamily] = useState(AROMAS[0].id);
  const fam = AROMAS.find((a) => a.id === family) ?? AROMAS[0];
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={S.screen}>
        <View style={st.bar}>
          <Text style={[S.h2, { flex: 1 }]}>Roue des arômes</Text>
          <Pressable onPress={onClose} style={[st.barBtn, { backgroundColor: C.wine }]} accessibilityLabel="Terminer">
            <MaterialIcons name="check" size={24} color={C.white} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 10 }} style={{ flexGrow: 0 }}>
          {AROMAS.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setFamily(a.id)}
              style={[st.family, { borderColor: a.color }, family === a.id && { backgroundColor: a.color }]}>
              <Text style={[st.familyText, { color: family === a.id ? C.white : a.color }]}>{a.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {fam.groups.map((g) => (
            <View key={g.label} style={{ marginBottom: 18 }}>
              <Text style={[S.overline, { marginBottom: 8, color: fam.color }]}>{g.label}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {g.items.map((it) => {
                  const on = selected.includes(it);
                  return (
                    <Pressable key={it} onPress={() => onToggle(it)} style={[st.aroma, on && { backgroundColor: fam.color, borderColor: fam.color }]}>
                      <Text style={[st.aromaText, on && { color: C.white }]}>{it}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          {selected.length > 0 && <Text style={S.muted}>Sélection : {selected.join(', ')}</Text>}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  barBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F4' },
  score: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, marginVertical: 20 },
  scoreCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FAFAF9',
    borderWidth: 4,
    borderColor: C.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  scoreFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FBD5D5' },
  scoreText: { fontFamily: F.sansBold, fontSize: 32, color: C.text },
  infoRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  info: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: '#F0EEEC', borderRadius: 14, padding: 10, alignItems: 'center', gap: 4 },
  infoVal: { fontFamily: F.sansBold, fontSize: 15, color: C.text },
  infoInput: { fontFamily: F.sansBold, fontSize: 15, color: C.text, textAlign: 'center', paddingVertical: 2, minWidth: 60 },
  line: { borderBottomWidth: 1, borderColor: '#F0EEEC', paddingVertical: 12, fontFamily: F.sans, fontSize: 16, color: C.text, marginTop: 14 },
  aromaTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#CFFAFE', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  aromaTagText: { fontFamily: F.sansBold, fontSize: 13, color: '#155E75' },
  addAroma: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.cyanSoft,
    borderWidth: 1,
    borderColor: '#CFFAFE',
  },
  caudalie: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderWidth: 1, borderColor: '#F0EEEC', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 8 },
  comment: { backgroundColor: '#F5F5F4', borderRadius: 14, padding: 14, minHeight: 100, textAlignVertical: 'top', fontFamily: F.sans, fontSize: 16, color: C.text },
  family: { borderWidth: 2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  familyText: { fontFamily: F.sansBold, fontSize: 14 },
  aroma: { borderWidth: 1, borderColor: C.border, backgroundColor: C.white, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  aromaText: { fontFamily: F.sans, fontSize: 15, color: C.text },
});
