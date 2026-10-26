import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/**
 * Prend ou importe une photo d'étiquette, puis la réduit (1280 px, JPEG 70 %)
 * pour un envoi rapide : environ 200 à 400 Ko au lieu de plusieurs Mo.
 * Retourne null si l'utilisateur annule.
 */
export async function pickLabel(camera: boolean): Promise<{ uri: string; base64: string } | null> {
  if (camera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('PERMISSION');
  }
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets?.[0]) return null;
  return shrink(res.assets[0].uri, res.assets[0].width);
}

export async function shrink(uri: string, width?: number) {
  const out = await manipulateAsync(uri, width && width > 1280 ? [{ resize: { width: 1280 } }] : [], {
    compress: 0.7,
    format: SaveFormat.JPEG,
    base64: true,
  });
  return { uri: out.uri, base64: out.base64 || '' };
}
