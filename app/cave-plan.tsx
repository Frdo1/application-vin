import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { Pill } from '@/components/wine-ui';
import { useStore } from '@/lib/store';
import { C, F, S } from '@/lib/theme';
import type { CellarItem, Rack, Slot } from '@/lib/types';
import { drinkStatus, norm, STATUS_LABEL, TYPE_COLORS } from '@/lib/wine';

const MAX_SIZE = 30;
/** Couleurs claires : chiffres foncés pour rester lisibles */
const LIGHT = ['Blanc', 'Champagne', 'Effervescent', 'Rosé', 'Vin Doux'];

/** Plan de cave : casiers en grille, une case = une bouteille. */
export default function CavePlan() {
  const store = useStore();
  const { racks, cellar } = store;
  const { width } = useWindowDimensions();
  const [rackId, setRackId] = useState<string | null>(racks[0]?.id ?? null);
  const [editing, setEditing] = useState<Rack | 'new' | null>(racks.length ? null : 'new');
  const [picking, setPicking] = useState<Slot | null>(null);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [moving, setMoving] = useState<{ from: Slot; key: string } | null>(null);

  // Sans choix, on affiche le dernier casier créé.
  const rack = racks.find((r) => r.id === rackId) ?? racks[racks.length - 1];
  const stock = cellar.filter((c) => c.quantity > 0);
  const placed = stock.reduce((n, c) => n + (c.slots?.length ?? 0), 0);
  const total = stock.reduce((n, c) => n + c.quantity, 0);

  // Bouteille de chaque case du casier affiché
  const grid = useMemo(() => {
    const m = new Map<string, CellarItem>();
    if (rack) for (const c of cellar) for (const s of c.slots || []) if (s.rack === rack.id) m.set(`${s.row}-${s.col}`, c);
    return m;
  }, [cellar, rack]);

  const cell = rack ? Math.max(34, Math.min(56, Math.floor((width - 32 - 26) / rack.cols) - 4)) : 40;

  const tap = (slot: Slot) => {
    const c = grid.get(`${slot.row}-${slot.col}`);
    if (moving) {
      if (!c) {
        store.unplace(moving.from);
        store.placeBottle(moving.key, slot);
      }
      setMoving(null);
      return;
    }
    if (c) setSelected(slot);
    else setPicking(slot);
  };

  const sel = selected && grid.get(`${selected.row}-${selected.col}`);

  return (
    <SafeAreaView edges={['top']} style={S.screen}>
      <ScreenHeader title="Plan de cave" subtitle={`${placed} bouteille${placed > 1 ? 's' : ''} rangée${placed > 1 ? 's' : ''} sur ${total}`} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.racks} style={{ flexGrow: 0 }}>
        {racks.map((r) => (
          <Pill key={r.id} label={r.name} active={rack?.id === r.id} onPress={() => setRackId(r.id)} />
        ))}
        <Pill label="+ Casier" onPress={() => setEditing('new')} />
      </ScrollView>

      {rack ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={st.rackHead}>
            <Text style={S.h3}>
              {rack.name} · {rack.rows} × {rack.cols}
            </Text>
            <Pressable onPress={() => setEditing(rack)} hitSlop={8} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <MaterialIcons name="edit" size={18} color={C.wine} />
              <Text style={st.link}>Modifier</Text>
            </Pressable>
          </View>
          {moving && (
            <View style={st.hint}>
              <Text style={[S.body, { flex: 1, color: C.cyan }]}>Touchez une case vide pour y déplacer la bouteille.</Text>
              <Pressable onPress={() => setMoving(null)}>
                <Text style={st.link}>Annuler</Text>
              </Pressable>
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={{ flexDirection: 'row', marginLeft: 26 }}>
                {Array.from({ length: rack.cols }, (_, col) => (
                  <Text key={col} style={[st.axis, { width: cell + 4 }]}>
                    {col + 1}
                  </Text>
                ))}
              </View>
              {Array.from({ length: rack.rows }, (_, row) => (
                <View key={row} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[st.axis, { width: 26 }]}>{String.fromCharCode(65 + (row % 26))}</Text>
                  {Array.from({ length: rack.cols }, (_, col) => {
                    const c = grid.get(`${row}-${col}`);
                    const color = c ? TYPE_COLORS[c.wine.type]?.liquid ?? C.wine : undefined;
                    const isFrom = moving && moving.from.row === row && moving.from.col === col && moving.from.rack === rack.id;
                    return (
                      <Pressable
                        key={col}
                        onPress={() => tap({ rack: rack.id, row, col })}
                        style={[
                          st.cell,
                          { width: cell, height: cell, borderRadius: cell / 2 },
                          c ? { backgroundColor: color, borderColor: color } : null,
                          isFrom ? { borderColor: C.cyan, borderWidth: 3 } : null,
                        ]}
                        accessibilityLabel={c ? `${c.wine.name} ${c.vintage}` : `Case vide ${String.fromCharCode(65 + row)}${col + 1}`}>
                        {c ? (
                          <Text style={[st.cellText, LIGHT.includes(c.wine.type) && { color: C.goldText }]}>{c.vintage ? c.vintage.slice(2) : 'NV'}</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
          <Text style={[S.muted, { marginTop: 14 }]}>
            Touchez une case vide pour y ranger une bouteille, ou une bouteille pour la boire, la déplacer ou la retirer.
          </Text>
        </ScrollView>
      ) : (
        <Text style={[S.muted, { textAlign: 'center', padding: 30 }]}>Créez votre premier casier pour ranger vos bouteilles.</Text>
      )}

      {editing && (
        <RackEditor
          rack={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(name, rows, cols) => {
            if (editing === 'new') {
              store.addRack(name, rows, cols);
              setRackId(null);
            }
            else store.updateRack(editing.id, { name: name.trim() || editing.name, rows, cols });
            setEditing(null);
          }}
          onDelete={
            editing === 'new'
              ? undefined
              : () =>
                  Alert.alert('Supprimer ce casier ?', 'Les bouteilles restent dans votre cave, elles ne seront simplement plus rangées.', [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Supprimer',
                      style: 'destructive',
                      onPress: () => {
                        store.removeRack(editing.id);
                        setRackId(null);
                        setEditing(null);
                      },
                    },
                  ])
          }
        />
      )}

      {picking && (
        <BottlePicker
          items={stock.filter((c) => (c.slots?.length ?? 0) < c.quantity)}
          onClose={() => setPicking(null)}
          onPick={(c) => {
            store.placeBottle(c.key, picking);
            setPicking(null);
          }}
        />
      )}

      {selected && sel && (
        <BottleSheet
          item={sel}
          where={`${rack?.name} · ${String.fromCharCode(65 + selected.row)}${selected.col + 1}`}
          onClose={() => setSelected(null)}
          onOpen={() => {
            setSelected(null);
            store.setCurrent({ ...sel.wine, vintage: sel.vintage });
            router.push('/vin');
          }}
          onDrink={(note) => {
            store.drinkFromSlot(selected, note);
            setSelected(null);
          }}
          onMove={() => {
            setMoving({ from: selected, key: sel.key });
            setSelected(null);
          }}
          onRemove={() => {
            store.unplace(selected);
            setSelected(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <View style={st.stepRow}>
      <Text style={[S.body, { flex: 1 }]}>{label}</Text>
      <Pressable style={st.stepBtn} onPress={() => onChange(Math.max(1, value - 1))} accessibilityLabel={`${label} moins`}>
        <Text style={st.stepSign}>−</Text>
      </Pressable>
      <Text style={st.stepValue}>{value}</Text>
      <Pressable style={st.stepBtn} onPress={() => onChange(Math.min(MAX_SIZE, value + 1))} accessibilityLabel={`${label} plus`}>
        <Text style={st.stepSign}>+</Text>
      </Pressable>
    </View>
  );
}

function RackEditor({
  rack,
  onClose,
  onSave,
  onDelete,
}: {
  rack: Rack | null;
  onClose: () => void;
  onSave: (name: string, rows: number, cols: number) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(rack?.name ?? '');
  const [rows, setRows] = useState(rack?.rows ?? 6);
  const [cols, setCols] = useState(rack?.cols ?? 6);
  return (
    <Sheet onClose={onClose}>
      <Text style={S.h3}>{rack ? 'Modifier le casier' : 'Nouveau casier'}</Text>
      <TextInput
        style={[S.input, { borderRadius: 12, marginBottom: 6 }]}
        value={name}
        onChangeText={setName}
        placeholder="Nom (ex. Casier du garage)"
        placeholderTextColor={C.faint}
      />
      <Stepper label="Rangées (A, B, C…)" value={rows} onChange={setRows} />
      <Stepper label="Bouteilles par rangée" value={cols} onChange={setCols} />
      <Text style={[S.muted, { marginBottom: 12 }]}>
        {rows * cols} emplacements. {rack && (rows < rack.rows || cols < rack.cols) ? 'Les bouteilles hors de la grille ne seront plus rangées.' : ''}
      </Text>
      <Pressable style={S.btn} onPress={() => onSave(name, rows, cols)}>
        <Text style={S.btnText}>{rack ? 'Enregistrer' : 'Créer le casier'}</Text>
      </Pressable>
      {onDelete && (
        <Pressable onPress={onDelete} style={{ alignItems: 'center', paddingTop: 14 }}>
          <Text style={[st.link, { color: '#B91C1C' }]}>Supprimer ce casier</Text>
        </Pressable>
      )}
    </Sheet>
  );
}

function BottlePicker({ items, onClose, onPick }: { items: CellarItem[]; onClose: () => void; onPick: (c: CellarItem) => void }) {
  const [q, setQ] = useState('');
  const list = items.filter((c) => !q || norm(`${c.wine.name} ${c.vintage} ${c.wine.appellation}`).includes(norm(q)));
  return (
    <Sheet onClose={onClose}>
      <Text style={S.h3}>Ranger une bouteille</Text>
      {items.length === 0 ? (
        <Text style={[S.muted, { paddingVertical: 12 }]}>Toutes vos bouteilles sont déjà rangées. Ajoutez des vins à votre cave pour les placer ici.</Text>
      ) : (
        <>
          {items.length > 6 && (
            <TextInput
              style={[S.input, { borderRadius: 12, paddingVertical: 9, marginBottom: 8 }]}
              value={q}
              onChangeText={setQ}
              placeholder="Chercher…"
              placeholderTextColor={C.faint}
            />
          )}
          <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
            {list.map((c) => (
              <Pressable key={c.key} style={st.pickRow} onPress={() => onPick(c)}>
                <View style={[st.dot, { backgroundColor: TYPE_COLORS[c.wine.type]?.liquid ?? C.wine }]} />
                <View style={{ flex: 1 }}>
                  <Text style={st.pickName}>
                    {c.wine.name} {c.vintage}
                  </Text>
                  <Text style={S.muted}>{c.quantity - (c.slots?.length ?? 0)} à ranger</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}
    </Sheet>
  );
}

function BottleSheet({
  item,
  where,
  onClose,
  onOpen,
  onDrink,
  onMove,
  onRemove,
}: {
  item: CellarItem;
  where: string;
  onClose: () => void;
  onOpen: () => void;
  onDrink: (note?: string) => void;
  onMove: () => void;
  onRemove: () => void;
}) {
  const [drinking, setDrinking] = useState(false);
  const [note, setNote] = useState('');
  return (
    <Sheet onClose={onClose}>
      <Text style={S.h3}>
        {item.wine.name} {item.vintage}
      </Text>
      <Text style={[S.muted, { marginBottom: 14 }]}>
        {where} · {STATUS_LABEL[drinkStatus(item.wine, item.vintage)]} · {item.quantity} en cave
      </Text>
      {drinking ? (
        <>
          <TextInput
            style={[S.input, { borderRadius: 12, marginBottom: 10 }]}
            value={note}
            onChangeText={setNote}
            placeholder="Occasion (facultatif) : anniversaire, repas…"
            placeholderTextColor={C.faint}
            autoFocus
          />
          <Pressable style={S.btn} onPress={() => onDrink(note.trim() || undefined)}>
            <Text style={S.btnText}>Valider : bouteille bue</Text>
          </Pressable>
        </>
      ) : (
        <View style={{ gap: 10 }}>
          <Pressable style={S.btn} onPress={() => setDrinking(true)}>
            <Text style={S.btnText}>🍷 Je bois cette bouteille</Text>
          </Pressable>
          <Pressable style={S.btnGhost} onPress={onOpen}>
            <Text style={st.ghostText}>Voir la fiche du vin</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable style={[S.btnGhost, { flex: 1 }]} onPress={onMove}>
              <Text style={st.ghostText}>Déplacer</Text>
            </Pressable>
            <Pressable style={[S.btnGhost, { flex: 1 }]} onPress={onRemove}>
              <Text style={st.ghostText}>Retirer du casier</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Sheet>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.sheet} onPress={() => {}}>
          {children}
          <Pressable onPress={onClose} style={{ alignItems: 'center', paddingTop: 14 }}>
            <Text style={{ fontFamily: F.sans, fontSize: 16, color: C.muted }}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  racks: { gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  rackHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  link: { fontFamily: F.sansBold, fontSize: 14, color: C.wine },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.cyanSoft, borderRadius: 12, padding: 12, marginBottom: 10 },
  axis: { fontFamily: F.sansBold, fontSize: 11, color: C.faint, textAlign: 'center' },
  cell: { margin: 2, borderWidth: 1.5, borderColor: '#D6D3D1', backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontFamily: F.sansBold, fontSize: 11, color: C.white },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  stepBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  stepSign: { fontFamily: F.sansBold, fontSize: 20, color: C.text },
  stepValue: { fontFamily: F.serif, fontSize: 20, color: C.text, minWidth: 30, textAlign: 'center' },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderColor: '#F0EEEC' },
  pickName: { fontFamily: F.serif, fontSize: 16, color: C.text },
  dot: { width: 14, height: 14, borderRadius: 7 },
  ghostText: { fontFamily: F.sansBold, fontSize: 15, color: C.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 30 },
});
