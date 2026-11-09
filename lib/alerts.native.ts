// Alertes « à boire » : notifications locales programmées sur le téléphone (aucun serveur).
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { plannedAlerts } from './alerts-plan';
import type { CellarItem } from './types';

export { plannedAlerts };

const KEY = 'sommelier:alerts';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export const alertsSupported = true;

export async function alertsEnabled() {
  return (await AsyncStorage.getItem(KEY)) === '1';
}

/** Active les alertes (demande l'autorisation d'Android) ; false si refusée. */
export async function enableAlerts(on: boolean) {
  if (on) {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('cave', { name: 'Alertes de cave', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const p = await Notifications.requestPermissionsAsync();
    if (!p.granted) return false;
  } else {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  await AsyncStorage.setItem(KEY, on ? '1' : '0');
  return true;
}

/** Reprogramme toutes les alertes à partir de la cave actuelle. */
export async function scheduleAlerts(cellar: CellarItem[]) {
  if (!(await alertsEnabled())) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const list = plannedAlerts(cellar);
  for (const a of list) {
    await Notifications.scheduleNotificationAsync({
      content: { title: a.title, body: a.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: a.date, channelId: 'cave' },
    });
  }
  return list.length;
}
