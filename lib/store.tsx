import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { CellarItem, ScanItem, Tasting, Wine } from './types';
import { cellarKey } from './wine';

const KEY = 'sommelier:v2';
const MAX_SCANS = 30;

type Saved = { cellar: CellarItem[]; scans: ScanItem[] };

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
  setQuantity: (key: string, qty: number) => void;
  updateItem: (key: string, patch: Partial<CellarItem>) => void;
  saveTasting: (w: Wine, t: Tasting) => void;
  addScan: (s: ScanItem) => void;
  updateScan: (id: string, patch: Partial<ScanItem>) => void;
  removeScan: (id: string) => void;
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

const deleteFile = (uri?: string) => {
  if (uri?.startsWith('file:') && Platform.OS !== 'web') FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Saved>({ cellar: [], scans: [] });
  const [ready, setReady] = useState(false);
  const [search, setSearchState] = useState<Search>({ query: '', results: [], loading: false, error: '', searched: false });
  const [current, setCurrent] = useState<Wine | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setSaved({ cellar: [], scans: [], ...JSON.parse(raw) }))
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
          if (d.cellar.some((c) => c.key === key))
            return { ...d, cellar: d.cellar.map((c) => (c.key === key ? { ...c, quantity: c.quantity + qty } : c)) };
          return { ...d, cellar: [{ key, wine: w, vintage, quantity: qty, dateAdded: Date.now() }, ...d.cellar] };
        }),
      removeFromCellar: (key) => update((d) => ({ ...d, cellar: d.cellar.filter((c) => c.key !== key) })),
      setQuantity: (key, qty) =>
        update((d) => ({ ...d, cellar: d.cellar.map((c) => (c.key === key ? { ...c, quantity: Math.max(0, qty) } : c)) })),
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
    };
  }, [saved, ready, search, current, setSearch, update]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider manquant');
  return s;
}
