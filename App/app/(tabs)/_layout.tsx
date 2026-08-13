import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import AppShell, { useWideLayout } from '@/components/AppShell';

const TABS = [
  { name: 'index', title: 'Dashboard', icon: 'water' },
  { name: 'analytics', title: 'Analytics', icon: 'analytics' },
  { name: 'map', title: 'Map', icon: 'map' },
  { name: 'alerts', title: 'Alerts', icon: 'warning' },
  { name: 'states', title: 'States', icon: 'podium' },
] as const;

export default function TabLayout() {
  const wide = useWideLayout();

  return (
    <AppShell>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0284c7',
          tabBarInactiveTintColor: '#94a3b8',
          // On wide screens the sidebar is the navigation; two nav bars is one too many.
          tabBarStyle: wide
            ? { display: 'none' }
            : { backgroundColor: '#ffffff', borderTopColor: '#e2e8f0' },
          tabBarLabelStyle: { fontSize: 11 },
        }}>
        {TABS.map((t) => (
          <Tabs.Screen
            key={t.name}
            name={t.name}
            options={{
              title: t.title,
              tabBarIcon: ({ color }) => <Ionicons name={t.icon} size={22} color={color} />,
            }}
          />
        ))}
      </Tabs>
    </AppShell>
  );
}
