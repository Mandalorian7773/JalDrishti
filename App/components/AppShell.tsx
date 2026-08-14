import { router, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import logo from '@/assets/images/logo.png';
import {
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Map,
  TrendingUp,
  User,
} from '@/components/Icons';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/constants/ThemeContext';
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
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return (window.innerWidth || width) >= BREAKPOINT;
  }
  return width >= BREAKPOINT;
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
  const { colors, isDark } = useTheme();
  const Icon = item.icon;
  return (
    <Pressable
      onPress={() => router.push(item.route as any)}
      style={[
        tw`transition-all border`,
        collapsed
          ? tw`w-9 h-9 rounded-xl items-center justify-center self-center mb-1.5`
          : tw`flex-row items-center rounded-xl px-3 py-2.5 mb-1.5`,
        active
          ? {
              backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.12)',
              borderColor: isDark ? 'rgba(47, 128, 255, 0.4)' : 'rgba(37, 99, 235, 0.3)',
            }
          : {
              backgroundColor: 'transparent',
              borderColor: 'transparent',
            },
      ]}>
      <Icon
        size={17}
        color={active ? colors.brightBlue : colors.textMuted}
        strokeWidth={active ? 2.2 : 1.75}
      />
      {!collapsed && (
        <Text
          style={[
            tw`ml-3 text-xs font-semibold tracking-wide`,
            { color: active ? colors.brightBlue : colors.textMuted },
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
  const { colors, isDark } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  if (!wide) return <>{children}</>;

  const current =
    NAV.find((n) => n.route !== '/' && pathname.startsWith(n.route)) ?? NAV[0];

  return (
    <View style={[tw`flex-1 flex-row`, { backgroundColor: colors.bgCanvas }]}>
      {/* Sidebar Navigation */}
      <View
        style={[
          tw`px-3.5 py-5 justify-between relative shadow-lg border-r`,
          {
            width: collapsed ? COLLAPSED : EXPANDED,
            backgroundColor: colors.bgSidebar,
            borderColor: colors.borderColor,
          },
        ]}>
        <View>
          {/* Logo & Brand Header */}
          <View style={collapsed ? tw`items-center mb-6` : tw`flex-row items-center px-1 mb-6`}>
            <View
              style={[
                tw`w-9 h-9 rounded-xl items-center justify-center shadow-md overflow-hidden border`,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.borderColor,
                },
              ]}>
              <Image source={logo} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            </View>
            {!collapsed && (
              <View style={tw`ml-2.5 flex-1`}>
                <Text
                  style={[
                    tw`font-bold text-sm tracking-tight`,
                    { color: colors.textPrimary },
                  ]}>
                  JALDRISHTI
                </Text>
                <Text
                  style={[
                    tw`text-[10px] font-semibold tracking-[0.18em] uppercase -mt-0.5`,
                    { color: colors.brightBlue },
                  ]}>
                  INTELLIGENCE
                </Text>
              </View>
            )}
          </View>

          {/* Section Header */}
          {!collapsed && (
            <Text
              style={[
                tw`text-[10px] font-semibold px-2 mb-2.5 uppercase tracking-widest`,
                { color: colors.textMuted },
              ]}>
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

        {/* User Profile & Theme Toggle & Collapse Toggle */}
        <View>
          {/* Theme Toggle in Sidebar */}
          <ThemeToggle compact={collapsed} style={collapsed ? tw`mb-2 w-9 h-9 self-center` : tw`mb-2 w-full`} />

          <View style={[tw`h-px my-2`, { backgroundColor: colors.borderColor }]} />

          {/* Profile Badge */}
          {collapsed ? (
            <View
              style={[
                tw`w-9 h-9 rounded-xl border items-center justify-center self-center mb-2`,
                {
                  backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                  borderColor: isDark ? 'rgba(47, 128, 255, 0.3)' : 'rgba(37, 99, 235, 0.2)',
                },
              ]}>
              <User size={16} color={colors.brightBlue} strokeWidth={2} />
            </View>
          ) : (
            <View
              style={[
                tw`flex-row items-center px-2 py-2 mb-2 border rounded-xl`,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.borderColor,
                },
              ]}>
              <View
                style={[
                  tw`w-8 h-8 rounded-lg border items-center justify-center mr-2.5`,
                  {
                    backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                    borderColor: isDark ? 'rgba(47, 128, 255, 0.3)' : 'rgba(37, 99, 235, 0.2)',
                  },
                ]}>
                <User size={15} color={colors.brightBlue} strokeWidth={2} />
              </View>
              <View style={tw`flex-1`}>
                <Text
                  style={[tw`text-xs font-semibold`, { color: colors.textPrimary }]}
                  numberOfLines={1}>
                  CGWB Analyst
                </Text>
                <Text
                  style={[
                    tw`text-[9px] font-medium tracking-wide uppercase`,
                    { color: colors.brightBlue },
                  ]}
                  numberOfLines={1}>
                  Ministry of Jal Shakti
                </Text>
              </View>
            </View>
          )}

          {/* Collapse Button */}
          <Pressable
            onPress={() => setCollapsed((c) => !c)}
            style={[
              tw`mt-0.5 flex-row items-center justify-center rounded-xl py-2 border transition-all`,
              collapsed ? tw`w-9 h-9 self-center` : tw`w-full`,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.borderColor,
              },
            ]}>
            {collapsed ? (
              <ChevronRight size={14} color={colors.textMuted} strokeWidth={2} />
            ) : (
              <ChevronLeft size={14} color={colors.textMuted} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Main Content Workspace Container Frame */}
      <View style={[tw`flex-1 p-3.5 overflow-hidden`, { backgroundColor: colors.bgCanvas }]}>
        <View
          style={[
            tw`flex-1 rounded-[24px] border shadow-sm overflow-hidden flex-col`,
            {
              backgroundColor: colors.bgPanel,
              borderColor: colors.borderColor,
            },
          ]}>
          {/* Main Top Header */}
          <View
            style={[
              tw`flex-row items-center justify-between px-7 py-4.5 border-b`,
              {
                backgroundColor: colors.bgPanel,
                borderColor: colors.borderColor,
              },
            ]}>
            <View style={tw`flex-1 pr-4`}>
              <Text
                style={[
                  tw`text-[10px] font-semibold uppercase tracking-widest mb-0.5`,
                  { color: colors.brightBlue },
                ]}>
                {current.category}
              </Text>
              <View style={tw`flex-row items-center`}>
                <View
                  style={[
                    tw`w-7 h-7 mr-2 rounded-lg items-center justify-center shadow-sm overflow-hidden border`,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.borderColor,
                    },
                  ]}>
                  <Image source={logo} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
                <Text
                  style={[
                    tw`text-2xl font-bold tracking-tight`,
                    { color: colors.textPrimary },
                  ]}>
                  {current.title}
                </Text>
              </View>
              <Text
                style={[
                  tw`text-xs mt-1 max-w-3xl font-normal leading-relaxed`,
                  { color: colors.textMuted },
                ]}>
                {current.subtitle}
              </Text>
            </View>

            {/* Header Right Actions */}
            <View style={tw`flex-row items-center gap-2.5`}>
              <View
                style={[
                  tw`rounded-full px-3.5 py-1.5 border`,
                  {
                    backgroundColor: isDark ? 'rgba(47, 128, 255, 0.1)' : 'rgba(37, 99, 235, 0.08)',
                    borderColor: colors.borderColor,
                  },
                ]}>
                <Text
                  style={[
                    tw`text-[10px] font-semibold uppercase tracking-wider`,
                    { color: colors.brightBlue },
                  ]}>
                  MULTI-VIEW ENABLED
                </Text>
              </View>
            </View>
          </View>

          {/* Child View Workspace */}
          <View style={[tw`flex-1`, { backgroundColor: colors.bgCanvas }]}>{children}</View>
        </View>
      </View>
    </View>
  );
}
