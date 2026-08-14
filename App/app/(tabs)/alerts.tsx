import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWideLayout } from '@/components/AppShell';
import { AlertTriangle, ChevronLeft, ChevronRight, Cpu, Droplets, List } from '@/components/Icons';
import ThemeToggle from '@/components/ThemeToggle';
import {
  AnomalyBadge,
  Card,
  CategoryPill,
  Empty,
  ErrorState,
  Loading,
  PulseBadge,
  SectionTitle,
  TrendBadge,
} from '@/components/Ui';
import { useTheme } from '@/constants/ThemeContext';
import { Station, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

type Tab = 'depletion' | 'sensor';
const PAGE_SIZE = 10;

const AlertRow = ({ s, kind }: { s: Station; kind: Tab }) => {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(tabs)/analytics', params: { code: s.code } })}
      style={[
        tw`py-3 px-3 border-b rounded-xl transition-all`,
        { borderColor: colors.borderColor },
      ]}>
      <View style={tw`flex-row items-start justify-between`}>
        <View style={tw`flex-1 pr-3`}>
          <View style={tw`flex-row items-center flex-wrap`}>
            <Text style={[tw`text-sm font-semibold`, { color: colors.textPrimary }]} numberOfLines={1}>
              {s.name}
            </Text>
            <View
              style={[
                tw`ml-2 border rounded px-1.5 py-0.2`,
                {
                  backgroundColor: colors.bgSubtle,
                  borderColor: colors.borderColor,
                },
              ]}>
              <Text style={[tw`text-[10px] font-mono font-medium`, { color: colors.textMuted }]}>{s.code}</Text>
            </View>
          </View>
          <Text style={[tw`text-xs mt-0.5 font-normal`, { color: colors.textMuted }]}>
            {s.district}, {s.state}
          </Text>
        </View>

        {kind === 'depletion' ? (
          <CategoryPill category={s.category} small />
        ) : (
          <View
            style={[
              tw`border rounded-lg px-2.5 py-1 items-end`,
              {
                backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                borderColor: colors.borderColor,
              },
            ]}>
            <Text style={[tw`text-xs font-semibold`, { color: colors.brightBlue }]}>
              {fmt(s.data_quality, 0)}/100
            </Text>
            <Text style={[tw`text-[9px] font-medium`, { color: colors.brightBlue }]}>QA Health</Text>
          </View>
        )}
      </View>

      {kind === 'depletion' ? (
        <View style={[tw`flex-row items-center justify-between mt-2.5 pt-2 border-t`, { borderColor: colors.borderColor }]}>
          <View style={tw`flex-row items-center flex-wrap`}>
            <TrendBadge value={s.trend_m_per_year} />
            <Text style={[tw`text-xs font-medium ml-3`, { color: colors.textPrimary }]}>
              Level: {fmt(s.latest_level_mbgl, 2, ' m bgl')}
            </Text>
            <Text style={[tw`text-xs ml-3 font-normal`, { color: colors.textMuted }]}>
              Recharge: {fmt(s.recharge_mm, 0, ' mm')}
            </Text>
          </View>
          <View
            style={[
              tw`border rounded-md px-2 py-0.5`,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
              },
            ]}>
            <Text style={[tw`text-[10px] font-semibold`, { color: isDark ? '#f87171' : '#dc2626' }]}>
              Intervention Priority
            </Text>
          </View>
        </View>
      ) : (
        <View style={[tw`mt-2 pt-2 border-t`, { borderColor: colors.borderColor }]}>
          <View style={tw`flex-row flex-wrap items-center`}>
            <Text style={[tw`text-[11px] font-medium mr-1.5`, { color: colors.textMuted }]}>Flagged:</Text>
            {s.anomalies.map((a) => (
              <AnomalyBadge key={a} anomaly={a} />
            ))}
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default function AlertsScreen() {
  const wide = useWideLayout();
  const { colors, isDark } = useTheme();
  const [tab, setTab] = useState<Tab>('depletion');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi<Record<Tab, Station[]>>('/alerts/');

  if (loading && !data) return <Loading />;
  if (error && !data)
    return (
      <SafeAreaView style={[tw`flex-1 justify-center`, { backgroundColor: colors.bgCanvas }]}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );

  const rows = data?.[tab] ?? [];
  const depletionCount = data?.depletion?.length ?? 0;
  const sensorCount = data?.sensor?.length ?? 0;

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, total);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.bgCanvas }]} edges={wide ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={tw`${wide ? 'px-8 pt-6' : 'px-4 pt-4'} pb-32`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}>
        {/* Mobile Header */}
        {!wide && (
          <View style={tw`pt-1 pb-1`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={[tw`text-[10px] font-semibold uppercase tracking-widest`, { color: colors.brightBlue }]}>
                DECISION SUPPORT
              </Text>
              <ThemeToggle compact />
            </View>
            <View style={tw`flex-row items-center justify-between mt-0.5`}>
              <Text style={[tw`text-xl font-bold tracking-tight`, { color: colors.textPrimary }]}>
                Early Warning &amp; Sensor Health
              </Text>
              <PulseBadge label="Continuous Scan" />
            </View>
            <Text style={[tw`text-xs mt-1 font-normal`, { color: colors.textMuted }]}>
              Targeted field interventions &amp; telemetry diagnostics
            </Text>
          </View>
        )}

        {/* Tab Segmented Switcher */}
        <View
          style={[
            tw`flex-row rounded-2xl p-1.5 mt-2 border`,
            {
              backgroundColor: colors.bgSubtle,
              borderColor: colors.borderColor,
            },
          ]}>
          {[
            {
              key: 'depletion',
              label: 'Critical Depletion',
              count: depletionCount,
              icon: AlertTriangle,
              color: isDark ? '#f87171' : '#dc2626',
            },
            {
              key: 'sensor',
              label: 'Sensor Telemetry Faults',
              count: sensorCount,
              icon: Cpu,
              color: colors.brightBlue,
            },
          ].map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <Pressable
                key={t.key}
                onPress={() => {
                  setTab(t.key as Tab);
                  setPage(1);
                }}
                style={[
                  tw`flex-1 flex-row items-center justify-center py-2.5 rounded-xl transition-all shadow-2xs border`,
                  active
                    ? {
                        backgroundColor: colors.bgPanel,
                        borderColor: colors.borderColor,
                      }
                    : {
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                      },
                ]}>
                <Icon
                  size={14}
                  color={active ? t.color : colors.textMuted}
                  strokeWidth={2}
                  style={tw`mr-2`}
                />
                <Text
                  style={[
                    tw`text-xs font-semibold`,
                    { color: active ? colors.textPrimary : colors.textMuted },
                  ]}>
                  {t.label} ({t.count})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Informational Guidance Banner */}
        <Card style={tw`mt-3 flex-row items-start p-3.5`}>
          <View
            style={[
              tw`w-8 h-8 rounded-xl items-center justify-center mr-3 border`,
              tab === 'depletion'
                ? {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                    borderColor: colors.borderColor,
                  },
            ]}>
            {tab === 'depletion' ? (
              <Droplets size={16} color={isDark ? '#f87171' : '#dc2626'} strokeWidth={2} />
            ) : (
              <Cpu size={16} color={colors.brightBlue} strokeWidth={2} />
            )}
          </View>
          <View style={tw`flex-1`}>
            <Text style={[tw`text-xs font-semibold`, { color: colors.textPrimary }]}>
              {tab === 'depletion'
                ? 'Rapid Depletion Criteria (> 0.3 m/year fall)'
                : 'Sensor Telemetry QA Screening'}
            </Text>
            <Text style={[tw`text-xs mt-0.5 leading-4.5 font-normal`, { color: colors.textMuted }]}>
              {tab === 'depletion'
                ? 'These aquifers exhibit continuous water table decline exceeding sustainable replenishment thresholds. High priority for artificial recharge construction.'
                : 'Recorders identified with flatlined signals, implausible step jumps, or transmission dropouts. Excluded from baseline computations until field serviced.'}
            </Text>
          </View>
        </Card>

        {/* Alert List Header */}
        <SectionTitle
          title={tab === 'depletion' ? `Flagged Depletion Zones (${rows.length})` : `Faulty Recorders (${rows.length})`}
          subtitle={tab === 'depletion' ? 'Sorted by annual rate of water table loss' : 'Sorted by lowest telemetry health score'}
          icon={List}
        />

        {/* Paginated Alert List Card */}
        <Card style={tw`p-0 overflow-hidden`}>
          <View style={tw`py-1`}>
            {loading && !data ? (
              <View style={tw`py-10 items-center justify-center`}>
                <ActivityIndicator size="small" color={colors.brightBlue} style={tw`mb-2`} />
                <Text style={[tw`text-xs font-normal`, { color: colors.textMuted }]}>
                  Scanning early warning alerts & sensor diagnostics…
                </Text>
              </View>
            ) : paginatedRows.length ? (
              paginatedRows.map((s) => <AlertRow key={s.code} s={s} kind={tab} />)
            ) : (
              <Empty label="No active anomalies flagged in this category" />
            )}
          </View>

          {/* Pagination Toolbar */}
          {totalPages > 1 && (
            <View
              style={[
                tw`flex-row items-center justify-between px-4 py-3 border-t`,
                {
                  backgroundColor: colors.bgSubtle,
                  borderColor: colors.borderColor,
                },
              ]}>
              <Text style={[tw`text-xs font-medium`, { color: colors.textMuted }]}>
                Showing <Text style={[tw`font-semibold`, { color: colors.textPrimary }]}>{from}–{to}</Text> of <Text style={[tw`font-semibold`, { color: colors.textPrimary }]}>{total}</Text>
              </Text>

              <View style={tw`flex-row items-center`}>
                {/* Prev Button */}
                <Pressable
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  style={[
                    tw`flex-row items-center px-2.5 py-1.5 rounded-lg border mr-2 transition-all`,
                    safePage === 1
                      ? {
                          backgroundColor: colors.bgSubtle,
                          borderColor: colors.borderColor,
                          opacity: 0.3,
                        }
                      : {
                          backgroundColor: colors.bgPanel,
                          borderColor: colors.borderColor,
                        },
                  ]}>
                  <ChevronLeft size={13} color={colors.textMuted} strokeWidth={2} />
                  <Text style={[tw`text-xs font-semibold ml-1`, { color: colors.textMuted }]}>Prev</Text>
                </Pressable>

                {/* Page Indicator */}
                <View
                  style={[
                    tw`px-2.5 py-1 border rounded-lg shadow-2xs mr-2`,
                    {
                      backgroundColor: colors.bgPanel,
                      borderColor: colors.borderColor,
                    },
                  ]}>
                  <Text style={[tw`text-xs font-medium`, { color: colors.textMuted }]}>
                    <Text style={[tw`font-bold`, { color: colors.brightBlue }]}>{safePage}</Text> / {totalPages}
                  </Text>
                </View>

                {/* Next Button */}
                <Pressable
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  style={[
                    tw`flex-row items-center px-2.5 py-1.5 rounded-lg border transition-all`,
                    safePage === totalPages
                      ? {
                          backgroundColor: colors.bgSubtle,
                          borderColor: colors.borderColor,
                          opacity: 0.3,
                        }
                      : {
                          backgroundColor: colors.bgPanel,
                          borderColor: colors.borderColor,
                        },
                  ]}>
                  <Text style={[tw`text-xs font-semibold mr-1`, { color: colors.textMuted }]}>Next</Text>
                  <ChevronRight size={13} color={colors.textMuted} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
