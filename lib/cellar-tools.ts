// Outils Premium de la cave : export Excel, sauvegarde / restauration.
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { Saved } from './store';
import type { CellarItem, Rack } from './types';
import { drinkStatus, itemValue, STATUS_LABEL } from './wine';

const today = () => new Date().toISOString().slice(0, 10);

/** Emplacements lisibles : « Casier du haut R2-C3 ». */
export function slotLabel(c: CellarItem, racks: Rack[]) {
  return (c.slots || [])
    .map((s) => `${racks.find((r) => r.id === s.rack)?.name ?? 'Casier'} R${s.row + 1}-C${s.col + 1}`)
    .join(', ');
}

async function share(name: string, content: string, mimeType: string) {
  if (Platform.OS === 'web' || !FileSystem.cacheDirectory) throw new Error('UNSUPPORTED');
  const uri = FileSystem.cacheDirectory + name;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('UNSUPPORTED');
  await Sharing.shareAsync(uri, { mimeType, dialogTitle: name });
}

/** Tableau de la cave, lisible par Excel (séparateur « ; », accents conservés). */
export async function exportCsv(data: Saved) {
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Vin', 'Millésime', 'Couleur', 'Appellation', 'Région', 'Bouteilles', 'Prix payé (€)', 'Valeur estimée (€)', 'Emplacement', 'Garde', 'Note /100'];
  const rows = data.cellar
    .filter((c) => c.quantity > 0)
    .map((c) => [
      c.wine.name,
      c.vintage,
      c.wine.type,
      c.wine.appellation,
      c.wine.region,
      c.quantity,
      c.pricePaid ? String(c.pricePaid).replace('.', ',') : '',
      Math.round(itemValue(c)),
      slotLabel(c, data.racks),
      STATUS_LABEL[drinkStatus(c.wine, c.vintage)],
      c.tasting?.rating ?? '',
    ]);
  const csv = '﻿' + [head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
  await share(`ma-cave-${today()}.csv`, csv, 'text/csv');
}

/** Sauvegarde complète (cave, casiers, journal) à ranger sur Google Drive ou ailleurs. */
export async function backup(data: Saved) {
  const { scans: _s, ...rest } = data;
  const file = JSON.stringify({ app: 'sommelier-ia', version: 1, date: new Date().toISOString(), data: rest });
  await share(`sauvegarde-cave-${today()}.json`, file, 'application/json');
}

/** Lit un fichier de sauvegarde choisi par l'utilisateur ; null s'il annule. */
export async function pickBackup(): Promise<Partial<Saved> | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
  if (r.canceled || !r.assets?.[0]) return null;
  const text = await FileSystem.readAsStringAsync(r.assets[0].uri);
  const json = JSON.parse(text);
  if (json?.app !== 'sommelier-ia' || !Array.isArray(json?.data?.cellar)) throw new Error('BAD_FILE');
  const d = json.data;
  return { cellar: d.cellar, racks: Array.isArray(d.racks) ? d.racks : [], moves: Array.isArray(d.moves) ? d.moves : [] };
}
