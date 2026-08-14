import { Tabs } from 'expo-router';
import React from 'react';

import AppShell, { useWideLayout } from '@/components/AppShell';
import {
  AlertTriangle,
  Award,
  LayoutDashboard,
  Map,
  TrendingUp,
} from '@/components/Icons';
import { useTheme } from '@/constants/ThemeContext';

const TABS = [
  { name: 'index', title: 'Dashboard', icon: LayoutDashboard },
  { name: 'analytics', title: 'Analytics', icon: TrendingUp },
  { name: 'map', title: 'Operations', icon: Map },
  { name: 'alerts', title: 'Alerts', icon: AlertTriangle },
  { name: 'states', title: 'States', icon: Award },
] as const;

export default function TabLayout() {
  const wide = useWideLayout();
  const { colors } = useTheme();

  return (
    <AppShell>
      <Tabs
        tabBar={wide ? () => null : undefined}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brightBlue,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: wide
            ? { display: 'none', height: 0, opacity: 0 }
            : {
                backgroundColor: colors.bgSidebar,
                borderTopColor: colors.borderColor,
                height: 60,
                paddingBottom: 8,
                paddingTop: 6,
              },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <Tabs.Screen
              key={t.name}
              name={t.name}
              options={{
                title: t.title,
                tabBarIcon: ({ color, focused }) => (
                  <Icon
                    size={focused ? 20 : 18}
                    color={color}
                    strokeWidth={focused ? 2.2 : 1.75}
                  />
                ),
              }}
            />
          );
        })}
      </Tabs>
    </AppShell>
  );
}
