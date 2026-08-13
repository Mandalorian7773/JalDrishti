import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import tw from '@/constants/tailwind';

const NAV = [
  { route: '/', label: 'Dashboard', icon: 'grid-outline', title: 'Overview',
    subtitle: 'National groundwater status from CGWB DWLR telemetry' },
  { route: '/analytics', label: 'Analytics', icon: 'analytics-outline', title: 'Station analytics',
    subtitle: 'Water-level history, recharge and 90-day projection' },
  { route: '/map', label: 'Map', icon: 'map-outline', title: 'Station network',
    subtitle: 'Every recorder, coloured by depletion category' },
  { route: '/alerts', label: 'Alerts', icon: 'warning-outline', title: 'Alerts',
    subtitle: 'Where to intervene, and which recorders to service' },
  { route: '/states', label: 'States', icon: 'podium-outline', title: 'State comparison',
    subtitle: 'Mean water-table trend by state' },
] as const;

const EXPANDED = 232;
const COLLAPSED = 68;

/** A sidebar is right on a desktop browser and wrong on a phone, where the tab
 *  bar already does the job. Below `BREAKPOINT` this renders nothing but its
 *  children and the tabs take over. */
export const BREAKPOINT = 900;

export function useWideLayout() {
  const { width } = useWindowDimensions();
  // `expo export --platform web` prerenders these screens at build time, where
  // there is no window to measure. Branching on width during the first render
  // makes the client disagree with that HTML and React throws a hydration
  // error (#418), discarding the tree. Stay narrow until after mount so the
  // first paint always matches, then switch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && width >= BREAKPOINT;
}

const NavItem = ({
  item,
  active,
  collapsed,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  collapsed: boolean;
}) => (
  <Pressable
    onPress={() => router.push(item.route as any)}
    style={tw`flex-row items-center rounded-xl px-3 py-2.5 mb-1 ${
      active ? 'bg-sky-600' : ''
    }`}>
    <Ionicons name={item.icon} size={19} color={active ? '#ffffff' : '#94a3b8'} />
    {!collapsed && (
      <Text
        style={tw`ml-3 text-sm ${active ? 'text-white font-semibold' : 'text-slate-300'}`}
        numberOfLines={1}>
        {item.label}
      </Text>
    )}
  </Pressable>
);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const wide = useWideLayout();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  if (!wide) return <>{children}</>;

  const current =
    NAV.find((n) => n.route !== '/' && pathname.startsWith(n.route)) ?? NAV[0];

  return (
    <View style={tw`flex-1 flex-row bg-slate-50`}>
      <View
        style={[
          tw`bg-slate-900 px-3 py-5 justify-between`,
          { width: collapsed ? COLLAPSED : EXPANDED },
        ]}>
        <View>
          <View style={tw`flex-row items-center px-2 mb-6`}>
            <View style={tw`w-9 h-9 rounded-xl bg-sky-500 items-center justify-center`}>
              <Ionicons name="water" size={20} color="#fff" />
            </View>
            {!collapsed && (
              <View style={tw`ml-2.5 flex-1`}>
                <Text style={tw`text-white font-bold text-base`}>JalDrishti</Text>
                <Text style={tw`text-slate-400 text-[10px]`}>Groundwater intelligence</Text>
              </View>
            )}
          </View>

          {!collapsed && (
            <Text style={tw`text-slate-500 text-[10px] font-semibold px-3 mb-2 uppercase`}>
              Monitoring
            </Text>
          )}
          {NAV.map((item) => (
            <NavItem
              key={item.route}
              item={item}
              collapsed={collapsed}
              active={item.route === current.route}
            />
          ))}
        </View>

        <View>
          <View style={tw`h-px bg-slate-800 my-3`} />
          <View style={tw`flex-row items-center px-2 mb-3`}>
            <View style={tw`w-8 h-8 rounded-full bg-slate-700 items-center justify-center`}>
              <Text style={tw`text-white text-xs font-bold`}>CG</Text>
            </View>
            {!collapsed && (
              <View style={tw`ml-2.5 flex-1`}>
                <Text style={tw`text-slate-200 text-xs font-semibold`}>CGWB Analyst</Text>
                <Text style={tw`text-slate-500 text-[10px]`}>Ministry of Jal Shakti</Text>
              </View>
            )}
          </View>
          <Pressable
            onPress={() => setCollapsed((c) => !c)}
            style={tw`flex-row items-center rounded-lg px-3 py-2`}>
            <Ionicons
              name={collapsed ? 'chevron-forward' : 'chevron-back'}
              size={16}
              color="#94a3b8"
            />
            {!collapsed && <Text style={tw`ml-3 text-xs text-slate-400`}>Collapse</Text>}
          </Pressable>
        </View>
      </View>

      <View style={tw`flex-1`}>
        <View
          style={tw`flex-row items-center justify-between px-7 py-4 bg-white border-b border-slate-200`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-lg font-bold text-slate-900`}>{current.title}</Text>
            <Text style={tw`text-xs text-slate-500 mt-0.5`}>{current.subtitle}</Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <View style={tw`flex-row items-center bg-emerald-50 rounded-full px-3 py-1.5 mr-3`}>
              <View style={tw`w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2`} />
              <Text style={tw`text-[11px] text-emerald-700 font-semibold`}>Live API</Text>
            </View>
            <View style={tw`w-8 h-8 rounded-full bg-sky-100 items-center justify-center`}>
              <Text style={tw`text-sky-700 text-xs font-bold`}>CG</Text>
            </View>
          </View>
        </View>
        <View style={tw`flex-1`}>{children}</View>
      </View>
    </View>
  );
}
