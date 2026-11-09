import { Lato_300Light, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PremiumModal } from '@/components/premium';
import { initAds } from '@/lib/ads';
import { scheduleAlerts } from '@/lib/alerts';
import { isPremium } from '@/lib/premium';
import { initQuota } from '@/lib/quota';
import { StoreProvider, useStore } from '@/lib/store';
import { C } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Reprogramme les alertes « à boire » quand la cave change (abonnés Premium). */
function AlertsSync() {
  const { cellar, ready } = useStore();
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      if (isPremium()) scheduleAlerts(cellar).catch(() => {});
    }, 3000);
    return () => clearTimeout(t);
  }, [cellar, ready]);
  return null;
}

function Root() {
  const { ready } = useStore();
  const [fonts] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
    Lato_300Light,
    Lato_400Regular,
    Lato_700Bold,
  });
  const ok = ready && fonts;
  useEffect(() => {
    if (!ok) return;
    SplashScreen.hideAsync().catch(() => {});
    initQuota();
    initAds();
  }, [ok]);
  if (!ok) return null;
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="vin" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="degustation" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="appellations" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="cave-plan" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="cave-journal" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="cave-outils" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <AlertsSync />
      <PremiumModal />
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
