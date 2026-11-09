import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { CellarItem, Move, Rack, ScanItem, Slot, Tasting, Wine } from './types';
import { cellarKey } from './wine';

const KEY = 'sommelier:v2';
const MAX_SCANS = 30;
const MAX_MOVES = 1000;

export type Saved = { cellar: CellarItem[]; scans: ScanItem[]; racks: Rack[]; moves: Move[] };
const EMPTY: Saved = { cellar: [], scans: [], racks: [], moves: [] };

type Search = { query: string; results: Wine[]; loading: boolean; error: string; searched: boolean };

type Store = Saved & {
  ready: boolean;
  search: Search;
  setSearch: (fn: (s: Search) => Search) => void;
  /** Vin affiché dans la fiche détaillée */
  current: Wine | null;
  setCurrent: (w: Wine | null) => void;
  findInCellar: (w: Wine, vintage?: string) => CellarItem | undefined;
  addToCellar: (w: Wine, vintage?: string, qty?: number) => void;
  removeFromCellar: (key: string) => void;
  /** Change le nombre de bouteilles ; une sortie peut porter une note (occasion). */
  setQuantity: (key: string, qty: number, note?: string) => void;
  updateItem: (key: string, patch: Partial<CellarItem>) => void;
  saveTasting: (w: Wine, t: Tasting) => void;
  addScan: (s: ScanItem) => void;
  updateScan: (id: string, patch: Partial<ScanItem>) => void;
  removeScan: (id: string) => void;
  addRack: (name: string, rows: number, cols: number) => void;
  updateRack: (id: string, patch: Partial<Omit<Rack, 'id'>>) => void;
  removeRack: (id: string) => void;
  /** Bouteille rangée à cette case, s'il y en a une */
  bottleAt: (slot: Slot) => CellarItem | undefined;
  placeBottle: (key: string, slot: Slot) => void;
  unplace: (slot: Slot) => void;
  /** Bouteille bue depuis le casier : elle quitte sa case et la cave. */
  drinkFromSlot: (slot: Slot, note?: string) => void;
  /** Remplace toutes les données (restauration d'une sauvegarde) */
  restore: (data: Partial<Saved>) => void;
};

const Ctx = createContext<Store | null>(null);

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Copie une photo dans le dossier de l'appli (le cache peut être vidé par Android). */
export async function keepPhoto(uri: string) {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) return uri;
  const dir = FileSystem.documentDirectory + 'etiquettes/';
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  const dest = dir + newId() + '.jpg';
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

const sameSlot = (a: Slot, b: Slot) => a.rack === b.rack && a.row === b.row && a.col === b.col;

/** Ajoute un mouvement au journal de cave. */
function logMove(d: Saved, c: { key: string; wine: Wine; vintage: string }, qty: number, note?: string): Move[] {
  if (!qty) return d.moves;
  const m: Move = { id: newId(), date: Date.now(), key: c.key, name: c.wine.name, vintage: c.vintage, qty, ...(note ? { note } : {}) };
  return [m, ...d.moves].slice(0, MAX_MOVES);
}

/** Nouvelle quantité : journal + on libère les cases en trop si des bouteilles sortent. */
function withQuantity(d: Saved, key: string, qty: number, note?: string): Saved {
  const c = d.cellar.find((x) => x.key === key);
  if (!c) return d;
  const quantity = Math.max(0, qty);
  const slots = (c.slots || []).slice(0, quantity);
  return {
    ...d,
    moves: logMove(d, c, quantity - c.quantity, note),
    cellar: d.cellar.map((x) => (x.key === key ? { ...x, quantity, slots } : x)),
  };
}

const deleteFile = (uri?: string) => {
  if (uri?.startsWith('file:') && Platform.OS !== 'web') FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [ready, setReady] = useState(false);
  const [search, setSearchState] = useState<Search>({ query: '', results: [], loading: false, error: '', searched: false });
  const [current, setCurrent] = useState<Wine | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setSaved({ ...EMPTY, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (d: Saved) => Saved) => {
    setSaved((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setSearch = useCallback((fn: (s: Search) => Search) => setSearchState(fn), []);

  const store = useMemo<Store>(() => {
    const findInCellar = (w: Wine, vintage = w.vintage) => saved.cellar.find((c) => c.key === cellarKey(w.name, vintage));
    return {
      ...saved,
      ready,
      search,
      setSearch,
      current,
      setCurrent,
      findInCellar,
      addToCellar: (w, vintage = w.vintage, qty = 1) =>
        update((d) => {
          const key = cellarKey(w.name, vintage);
          const moves = logMove(d, { key, wine: w, vintage }, qty);
          if (d.cellar.some((c) => c.key === key))
            return { ...d, moves, cellar: d.cellar.map((c) => (c.key === key ? { ...c, quantity: c.quantity + qty } : c)) };
          return { ...d, moves, cellar: [{ key, wine: w, vintage, quantity: qty, dateAdded: Date.now() }, ...d.cellar] };
        }),
      removeFromCellar: (key) => update((d) => ({ ...d, cellar: d.cellar.filter((c) => c.key !== key) })),
      setQuantity: (key, qty, note) => update((d) => withQuantity(d, key, qty, note)),
      updateItem: (key, patch) => update((d) => ({ ...d, cellar: d.cellar.map((c) => (c.key === key ? { ...c, ...patch } : c)) })),
      saveTasting: (w, t) =>
        update((d) => {
          const vintage = t.vintage || w.vintage;
          const key = cellarKey(w.name, vintage);
          if (d.cellar.some((c) => c.key === key))
            return { ...d, cellar: d.cellar.map((c) => (c.key === key ? { ...c, tasting: t } : c)) };
          // Vin dégusté mais pas en cave : on le garde avec 0 bouteille pour conserver la note.
          return { ...d, cellar: [{ key, wine: w, vintage, quantity: 0, dateAdded: Date.now(), tasting: t }, ...d.cellar] };
        }),
      addScan: (s) =>
        update((d) => {
          const scans = [s, ...d.scans];
          scans.slice(MAX_SCANS).forEach((x) => deleteFile(x.uri));
          return { ...d, scans: scans.slice(0, MAX_SCANS) };
        }),
      updateScan: (id, patch) => update((d) => ({ ...d, scans: d.scans.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
      removeScan: (id) =>
        update((d) => {
          const s = d.scans.find((x) => x.id === id);
          // On ne supprime pas le fichier s'il sert de photo à un vin de la cave.
          if (s && !d.cellar.some((c) => c.wine.photoUri === s.uri)) deleteFile(s.uri);
          return { ...d, scans: d.scans.filter((x) => x.id !== id) };
        }),
      addRack: (name, rows, cols) =>
        update((d) => ({ ...d, racks: [...d.racks, { id: newId(), name: name.trim() || `Casier ${d.racks.length + 1}`, rows, cols }] })),
      updateRack: (id, patch) =>
        update((d) => {
          const racks = d.racks.map((r) => (r.id === id ? { ...r, ...patch } : r));
          const r = racks.find((x) => x.id === id)!;
          // Casier réduit : les bouteilles hors de la nouvelle grille ne sont plus rangées.
          const cellar = d.cellar.map((c) =>
            c.slots ? { ...c, slots: c.slots.filter((s) => s.rack !== id || (s.row < r.rows && s.col < r.cols)) } : c,
          );
          return { ...d, racks, cellar };
        }),
      removeRack: (id) =>
        update((d) => ({
          ...d,
          racks: d.racks.filter((r) => r.id !== id),
          cellar: d.cellar.map((c) => (c.slots ? { ...c, slots: c.slots.filter((s) => s.rack !== id) } : c)),
        })),
      bottleAt: (slot) => saved.cellar.find((c) => c.slots?.some((s) => sameSlot(s, slot))),
      placeBottle: (key, slot) =>
        update((d) => ({
          ...d,
          cellar: d.cellar.map((c) => {
            const slots = (c.slots || []).filter((s) => !sameSlot(s, slot));
            return c.key === key && slots.length < c.quantity ? { ...c, slots: [...slots, slot] } : { ...c, slots };
          }),
        })),
      unplace: (slot) =>
        update((d) => ({ ...d, cellar: d.cellar.map((c) => (c.slots ? { ...c, slots: c.slots.filter((s) => !sameSlot(s, slot)) } : c)) })),
      drinkFromSlot: (slot, note) =>
        update((d) => {
          const c = d.cellar.find((x) => x.slots?.some((s) => sameSlot(s, slot)));
          if (!c) return d;
          const freed = { ...d, cellar: d.cellar.map((x) => (x === c ? { ...x, slots: x.slots!.filter((s) => !sameSlot(s, slot)) } : x)) };
          return withQuantity(freed, c.key, c.quantity - 1, note);
        }),
      restore: (data) => update(() => ({ ...EMPTY, ...data })),
    };
  }, [saved, ready, search, current, setSearch, update]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider manquant');
  return s;
}
