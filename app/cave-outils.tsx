import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { alertsEnabled, alertsSupported, enableAlerts, plannedAlerts, scheduleAlerts } from '@/lib/alerts';
import { backup, exportCsv, pickBackup } from '@/lib/cellar-tools';
import { useStore } from '@/lib/store';
import { C, F, S } from '@/lib/theme';
import { fmtDate } from '@/lib/wine';

/** Alertes « à boire » + export Excel + sauvegarde / restauration. */
export default function CaveOutils() {
  const store = useStore();
  const { cellar, scans, racks, moves } = store;
  const [alerts, setAlerts] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    alertsEnabled().then(setAlerts);
  }, []);

  const upcoming = plannedAlerts(cellar).slice(0, 5);

  const toggle = async (on: boolean) => {
    const ok = await enableAlerts(on);
    if (on && !ok) {
      Alert.alert('Notifications refusées', 'Autorisez les notifications du Sommelier IA dans les réglages Android pour recevoir les alertes.');
      return;
    }
    setAlerts(on);
    if (on) await scheduleAlerts(cellar);
  };

  const run = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    try {
      await fn();
    } catch (e) {
      const msg = String((e as Error)?.message || e);
      Alert.alert(
        'Oups',
        msg === 'BAD_FILE'
          ? 'Ce fichier n’est pas une sauvegarde du Sommelier IA.'
          : msg === 'UNSUPPORTED'
            ? 'Disponible uniquement sur téléphone.'
            : 'L’opération n’a pas pu aboutir. Réessayez.',
      );
    } finally {
      setBusy('');
    }
  };

  const restore = () =>
    run('restore', async () => {
      const data = await pickBackup();
      if (!data) return;
      const n = data.cellar?.filter((c) => c.quantity > 0).reduce((s, c) => s + c.quantity, 0) ?? 0;
      Alert.alert('Restaurer cette sauvegarde ?', `Elle contient ${n} bouteille${n > 1 ? 's' : ''}. Votre cave actuelle sera remplacée.`, [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Restaurer',
          style: 'destructive',
          onPress: () => {
            store.restore({ ...data, scans });
            scheduleAlerts(data.cellar || []);
          },
        },
      ]);
    });

  return (
    <SafeAreaView edges={['top']} style={S.screen}>
      <ScreenHeader title="Alertes & sauvegarde" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
        <View style={S.card}>
          <View style={st.row}>
            <MaterialIcons name="notifications-active" size={24} color={C.wine} />
            <View style={{ flex: 1 }}>
              <Text style={S.h3}>Alertes « à boire »</Text>
              <Text style={S.muted}>Une notification quand un vin entre dans sa période idéale, et l’année où il faut l’ouvrir.</Text>
            </View>
            <Switch
              value={alerts}
              onValueChange={toggle}
              disabled={!alertsSupported}
              trackColor={{ true: C.wine, false: '#D6D3D1' }}
              thumbColor={C.white}
            />
          </View>
          {upcoming.length > 0 ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <Text style={S.overline}>Prochaines alertes</Text>
              {upcoming.map((a, i) => (
                <View key={i} style={st.alert}>
                  <Text style={st.alertDate}>{fmtDate(a.date)}</Text>
                  <Text style={[S.body, { flex: 1 }]}>{a.body}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[S.muted, { marginTop: 10 }]}>Aucune alerte à venir : ajoutez des vins avec leur millésime.</Text>
          )}
        </View>

        <View style={S.card}>
          <Text style={S.h3}>Sauvegarde</Text>
          <Text style={[S.muted, { marginBottom: 14 }]}>
            Votre cave est enregistrée sur ce téléphone. Sauvegardez-la (Google Drive, e-mail…) pour la retrouver sur un nouveau téléphone.
          </Text>
          <Action icon="table-view" label="Exporter en tableau Excel" busy={busy === 'csv'} onPress={() => run('csv', () => exportCsv({ cellar, scans, racks, moves }))} />
          <Action icon="cloud-upload" label="Sauvegarder ma cave" busy={busy === 'backup'} onPress={() => run('backup', () => backup({ cellar, scans, racks, moves }))} />
          <Action icon="settings-backup-restore" label="Restaurer une sauvegarde" busy={busy === 'restore'} onPress={restore} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ icon, label, busy, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; busy: boolean; onPress: () => void }) {
  return (
    <Pressable style={st.action} onPress={onPress} disabled={busy}>
      {busy ? <ActivityIndicator color={C.wine} /> : <MaterialIcons name={icon} size={22} color={C.wine} />}
      <Text style={st.actionText}>{label}</Text>
      <MaterialIcons name="chevron-right" size={22} color={C.faint} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alert: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  alertDate: { fontFamily: F.sansBold, fontSize: 13, color: C.wine, width: 86, paddingTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderTopWidth: 1, borderColor: '#F0EEEC' },
  actionText: { flex: 1, fontFamily: F.sansBold, fontSize: 15, color: C.text },
});
