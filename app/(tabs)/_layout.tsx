import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';

import { useStore } from '@/lib/store';
import { C, F } from '@/lib/theme';

export default function TabLayout() {
  const { cellar } = useStore();
  const bottles = cellar.reduce((n, c) => n + c.quantity, 0);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.wine,
        tabBarInactiveTintColor: C.faint,
        tabBarLabelStyle: { fontFamily: F.sansBold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
        tabBarStyle: { backgroundColor: C.white, borderTopColor: C.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Recherche', tabBarIcon: ({ color }) => <MaterialIcons name="search" size={26} color={color} /> }}
      />
      <Tabs.Screen
        name="cave"
        options={{
          title: 'Ma cave',
          tabBarBadge: bottles > 0 ? bottles : undefined,
          tabBarBadgeStyle: { backgroundColor: C.wine, fontSize: 11 },
          tabBarIcon: ({ color }) => <MaterialIcons name="wine-bar" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="historique"
        options={{ title: 'Historique', tabBarIcon: ({ color }) => <MaterialIcons name="history" size={26} color={color} /> }}
      />
    </Tabs>
  );
}
