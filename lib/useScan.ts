import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { analyzeLabel, errorMessage } from './api';
import { pickLabel, shrink } from './scan';
import { keepPhoto, newId, useStore } from './store';

/** Scan d'étiquette : photo → historique → analyse → fiche du vin. */
export function useScan() {
  const { setSearch, addScan, updateScan, setCurrent } = useStore();

  const analyze = useCallback(
    async (img: { uri: string; base64: string }, scanId: string, photoUri: string) => {
      setSearch((s) => ({ ...s, query: '', results: [], loading: true, error: '', searched: true }));
      router.navigate('/');
      try {
        const wines = await analyzeLabel(img.base64);
        if (!wines.length) {
          setSearch((s) => ({ ...s, loading: false, error: 'Je n’arrive pas à lire cette étiquette. Essayez avec plus de lumière, bien de face.' }));
          return;
        }
        const withPhoto = wines.map((w) => ({ ...w, photoUri }));
        updateScan(scanId, { wineName: [withPhoto[0].name, withPhoto[0].vintage].filter(Boolean).join(' ') });
        setSearch((s) => ({ ...s, query: withPhoto[0].name, results: withPhoto, loading: false }));
        setCurrent(withPhoto[0]);
        router.push('/vin');
      } catch (e) {
        setSearch((s) => ({ ...s, loading: false, error: errorMessage(e) }));
      }
    },
    [setSearch, updateScan, setCurrent],
  );

  const scan = useCallback(
    async (camera: boolean) => {
      try {
        const img = await pickLabel(camera);
        if (!img) return;
        const photoUri = await keepPhoto(img.uri);
        const id = newId();
        addScan({ id, date: Date.now(), uri: photoUri });
        await analyze(img, id, photoUri);
      } catch (e: any) {
        Alert.alert(
          e?.message === 'PERMISSION' ? 'Accès à l’appareil photo refusé' : 'Photo impossible',
          e?.message === 'PERMISSION' ? 'Vous pouvez l’autoriser dans les réglages Android, ou importer une photo.' : 'Réessayez.',
        );
      }
    },
    [addScan, analyze],
  );

  const reanalyze = useCallback(
    async (scanId: string, uri: string) => {
      try {
        const img = await shrink(uri);
        await analyze(img, scanId, uri);
      } catch {
        Alert.alert('Photo introuvable', 'Cette photo n’existe plus sur le téléphone.');
      }
    },
    [analyze],
  );

  return { scan, reanalyze };
}
