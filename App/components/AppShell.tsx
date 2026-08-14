import { router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import {
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Droplets,
  LayoutDashboard,
  Map,
  TrendingUp,
  User,
} from '@/components/Icons';
import tw from '@/constants/tailwind';

const NAV = [
  {
    route: '/',
    label: 'DASHBOARD',
    icon: LayoutDashboard,
    category: 'COMMAND DECK',
    title: 'Executive Command Center',
    subtitle: 'National groundwater telemetry & resource evaluation • SIH25068',
  },
  {
    route: '/analytics',
    label: 'AQUIFER ANALYTICS',
    icon: TrendingUp,
    category: 'DEEP METRICS',
    title: 'Station Analytics & Forecasting',
    subtitle: 'Historical hydrograph, GEC-2015 recharge & 90-day predictive model',
  },
  {
    route: '/map',
    label: 'OPERATIONS MAP',
    icon: Map,
    category: 'SPATIAL INTELLIGENCE',
    title: 'Live Operations Map',
    subtitle: 'Switch between Live Station Map for precise geographic telemetry density or Aquifer Area Map for a proportional footprint of district-wide recharge gravity.',
  },
  {
    route: '/alerts',
    label: 'EARLY WARNING',
    icon: AlertTriangle,
    category: 'DECISION SUPPORT',
    title: 'Early Warning & Sensor Health',
    subtitle: 'Critical depletion zones & telemetric anomaly diagnostics',
  },
  {
    route: '/states',
    label: 'STATE BENCHMARKS',
    icon: Award,
    category: 'VULNERABILITY INDEX',
    title: 'State Comparison & Benchmarks',
    subtitle: 'State-by-state groundwater trends, recharge & abstraction pressure',
  },
] as const;

const EXPANDED = 244;
const COLLAPSED = 68;

export const BREAKPOINT = 960;

export function useWideLayout() {
  const { width } = useWindowDimensions();
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
}) => {
  const Icon = item.icon;
  return (
    <Pressable
      onPress={() => router.push(item.route as any)}
      style={[
        tw`flex-row items-center rounded-xl px-3 py-2.5 mb-1.5 transition-all`,
        active
          ? tw`bg-sky-500/15 border border-sky-400/30 shadow-xs`
          : tw`hover:bg-slate-800/60 border border-transparent`,
        collapsed ? tw`justify-center px-0` : tw``,
      ]}>
      <Icon
        size={17}
        color={active ? '#38bdf8' : '#94a3b8'}
        strokeWidth={active ? 2.2 : 1.75}
      />
      {!collapsed && (
        <Text
          style={[
            tw`ml-3 text-xs font-semibold tracking-wide`,
            active ? tw`text-sky-300` : tw`text-slate-300`,
          ]}
          numberOfLines={1}>
          {item.label}
        </Text>
      )}
    </Pressable>
  );
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const wide = useWideLayout();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  if (!wide) return <>{children}</>;

  const current =
    NAV.find((n) => n.route !== '/' && pathname.startsWith(n.route)) ?? NAV[0];

  return (
    <View style={tw`flex-1 flex-row bg-[#0b1329]`}>
      {/* Distinct Contrasting Sidebar Navigation */}
      <View
        style={[
          tw`bg-[#0b1329] px-3.5 py-5 justify-between border-r border-slate-800/80 relative shadow-lg`,
          { width: collapsed ? COLLAPSED : EXPANDED },
        ]}>
        <View>
          {/* Logo & Brand Header */}
          <View style={tw`flex-row items-center px-1 mb-6`}>
            <View style={tw`w-9 h-9 rounded-xl bg-sky-500 items-center justify-center shadow-md shadow-sky-500/30`}>
              <Droplets size={19} color="#fff" strokeWidth={2} />
            </View>
            {!collapsed && (
              <View style={tw`ml-2.5 flex-1`}>
                <Text style={tw`text-white font-bold text-sm tracking-tight`}>
                  JALDRISHTI
                </Text>
                <Text style={tw`text-sky-400 text-[10px] font-semibold tracking-[0.18em] uppercase -mt-0.5`}>
                  INTELLIGENCE
                </Text>
              </View>
            )}
          </View>

          {/* Section Header */}
          {!collapsed && (
            <Text style={tw`text-slate-500 text-[10px] font-semibold px-2 mb-2.5 uppercase tracking-widest`}>
              COMMAND DECK
            </Text>
          )}

          {/* Navigation Items */}
          {NAV.map((item) => (
            <NavItem
              key={item.route}
              item={item}
              collapsed={collapsed}
              active={
                item.route === '/'
                  ? pathname === '/' || pathname === '/(tabs)'
                  : pathname.startsWith(item.route)
              }
            />
          ))}
        </View>

        {/* User Profile & Collapse Toggle (No Logout button) */}
        <View>
          <View style={tw`h-px bg-slate-800/80 my-3`} />
          <View style={tw`flex-row items-center px-1.5 py-1 mb-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl`}>
            <View style={tw`w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 items-center justify-center`}>
              <User size={15} color="#38bdf8" strokeWidth={2} />
            </View>
            {!collapsed && (
              <View style={tw`ml-2 flex-1`}>
                <Text style={tw`text-slate-200 text-xs font-semibold`} numberOfLines={1}>
                  Soham Pal
                </Text>
                <Text style={tw`text-sky-400 text-[10px] font-medium tracking-wider uppercase`}>
                  OPERATOR
                </Text>
              </View>
            )}
          </View>

          {/* Collapse Button Drawer Tab */}
          <Pressable
            onPress={() => setCollapsed((c) => !c)}
            style={tw`mt-1 flex-row items-center justify-center rounded-xl py-1.5 bg-slate-850 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all`}>
            {collapsed ? (
              <ChevronRight size={14} color="#94a3b8" strokeWidth={2} />
            ) : (
              <ChevronLeft size={14} color="#94a3b8" strokeWidth={2} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Main Content Workspace Container Frame */}
      <View style={tw`flex-1 p-3.5 bg-[#f1f3f6] overflow-hidden`}>
        <View style={tw`flex-1 bg-white rounded-[24px] border border-slate-200/90 shadow-sm overflow-hidden flex-col`}>
          {/* Main Top Header */}
          <View
            style={tw`flex-row items-center justify-between px-7 py-4.5 border-b border-slate-100 bg-white`}>
            <View style={tw`flex-1 pr-4`}>
              <Text style={tw`text-[10px] font-semibold text-sky-600 uppercase tracking-widest mb-0.5`}>
                {current.category}
              </Text>
              <Text style={tw`text-2xl font-bold text-slate-900 tracking-tight`}>
                {current.title}
              </Text>
              <Text style={tw`text-xs text-slate-500 mt-1 max-w-3xl font-normal leading-relaxed`}>
                {current.subtitle}
              </Text>
            </View>

            {/* Header Badges */}
            <View style={tw`flex-row items-center`}>
              <View style={tw`bg-sky-50 border border-sky-200/90 rounded-full px-3 py-1 mr-2.5`}>
                <Text style={tw`text-[10px] font-semibold text-sky-700 uppercase tracking-wider`}>
                  MULTI-VIEW ENABLED
                </Text>
              </View>

              <View style={tw`flex-row items-center bg-white border border-slate-200/90 rounded-full px-3 py-1 shadow-2xs`}>
                <View style={tw`w-2 h-2 rounded-full bg-sky-500 mr-2`} />
                <Text style={tw`text-[10px] text-slate-700 font-semibold uppercase tracking-wider`}>
                  LIVE ENGINE ACTIVE
                </Text>
              </View>
            </View>
          </View>

          {/* Child View Workspace */}
          <View style={tw`flex-1 bg-slate-50/50`}>{children}</View>
        </View>
      </View>
    </View>
  );
}
