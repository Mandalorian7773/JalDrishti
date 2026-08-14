import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWideLayout } from '@/components/AppShell';
import { AlertTriangle, Cpu, Droplets, List } from '@/components/Icons';
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
import { Station, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

type Tab = 'depletion' | 'sensor';

const AlertRow = ({ s, kind }: { s: Station; kind: Tab }) => (
  <Pressable
    onPress={() => router.push({ pathname: '/(tabs)/analytics', params: { code: s.code } })}
    style={tw`py-3 px-3 border-b border-slate-100 hover:bg-slate-50 rounded-xl transition-all`}>
    <View style={tw`flex-row items-start justify-between`}>
      <View style={tw`flex-1 pr-3`}>
        <View style={tw`flex-row items-center flex-wrap`}>
          <Text style={tw`text-sm font-semibold text-slate-800`} numberOfLines={1}>
            {s.name}
          </Text>
          <View style={tw`ml-2 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.2`}>
            <Text style={tw`text-[10px] font-mono font-medium text-slate-600`}>{s.code}</Text>
          </View>
        </View>
        <Text style={tw`text-xs text-slate-500 mt-0.5 font-normal`}>
          {s.district}, {s.state}
        </Text>
      </View>

      {kind === 'depletion' ? (
        <CategoryPill category={s.category} small />
      ) : (
        <View style={tw`bg-purple-50 border border-purple-200/80 rounded-lg px-2.5 py-1 items-end`}>
          <Text style={tw`text-xs font-semibold text-purple-700`}>
            {fmt(s.data_quality, 0)}/100
          </Text>
          <Text style={tw`text-[9px] font-medium text-purple-500`}>QA Health</Text>
        </View>
      )}
    </View>

    {kind === 'depletion' ? (
      <View style={tw`flex-row items-center justify-between mt-2.5 pt-2 border-t border-slate-100`}>
        <View style={tw`flex-row items-center flex-wrap`}>
          <TrendBadge value={s.trend_m_per_year} />
          <Text style={tw`text-xs font-medium text-slate-600 ml-3`}>
            Level: {fmt(s.latest_level_mbgl, 2, ' m bgl')}
          </Text>
          <Text style={tw`text-xs text-slate-500 ml-3 font-normal`}>
            Recharge: {fmt(s.recharge_mm, 0, ' mm')}
          </Text>
        </View>
        <View style={tw`bg-rose-50 border border-rose-200/70 rounded-md px-2 py-0.5`}>
          <Text style={tw`text-[10px] font-semibold text-rose-700`}>
            Intervention Priority
          </Text>
        </View>
      </View>
    ) : (
      <View style={tw`mt-2 pt-2 border-t border-slate-100`}>
        <View style={tw`flex-row flex-wrap items-center`}>
          <Text style={tw`text-[11px] font-medium text-slate-500 mr-1.5`}>Flagged:</Text>
          {s.anomalies.map((a) => (
            <AnomalyBadge key={a} anomaly={a} />
          ))}
        </View>
      </View>
    )}
  </Pressable>
);

export default function AlertsScreen() {
  const wide = useWideLayout();
  const [tab, setTab] = useState<Tab>('depletion');
  const { data, error, loading, reload } = useApi<Record<Tab, Station[]>>('/alerts/');

  if (loading && !data) return <Loading label="Scanning early warning alerts & sensor diagnostics…" />;
  if (error && !data)
    return (
      <SafeAreaView style={tw`flex-1 bg-slate-50 justify-center`}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );

  const rows = data?.[tab] ?? [];
  const depletionCount = data?.depletion?.length ?? 0;
  const sensorCount = data?.sensor?.length ?? 0;

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50/50`} edges={wide ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={tw`${wide ? 'px-8 pt-6' : 'px-4 pt-4'} pb-32`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}>
        {/* Mobile Header */}
        {!wide && (
          <View style={tw`pt-1 pb-1`}>
            <Text style={tw`text-[10px] font-semibold text-sky-600 uppercase tracking-widest`}>
              DECISION SUPPORT
            </Text>
            <View style={tw`flex-row items-center justify-between mt-0.5`}>
              <Text style={tw`text-xl font-bold text-slate-900 tracking-tight`}>
                Early Warning &amp; Sensor Health
              </Text>
              <PulseBadge label="Continuous Scan" />
            </View>
            <Text style={tw`text-xs text-slate-500 mt-1 font-normal`}>
              Targeted field interventions &amp; telemetry diagnostics
            </Text>
          </View>
        )}

        {/* Tab Segmented Switcher */}
        <View style={tw`flex-row bg-slate-200/80 rounded-2xl p-1.5 mt-2 border border-slate-300/60`}>
          {[
            {
              key: 'depletion',
              label: 'Critical Depletion',
              count: depletionCount,
              icon: AlertTriangle,
              color: '#dc2626',
            },
            {
              key: 'sensor',
              label: 'Sensor Telemetry Faults',
              count: sensorCount,
              icon: Cpu,
              color: '#8b5cf6',
            },
          ].map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key as Tab)}
                style={[
                  tw`flex-1 flex-row items-center justify-center py-2.5 rounded-xl transition-all shadow-2xs`,
                  active ? tw`bg-white` : tw`bg-transparent`,
                ]}>
                <Icon
                  size={14}
                  color={active ? t.color : '#64748b'}
                  strokeWidth={2}
                  style={tw`mr-2`}
                />
                <Text
                  style={[
                    tw`text-xs font-semibold`,
                    active ? tw`text-slate-900` : tw`text-slate-600`,
                  ]}>
                  {t.label} ({t.count})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Informational Guidance Banner */}
        <Card style={tw`mt-3 flex-row items-start p-3.5 border-slate-200 bg-white`}>
          <View
            style={[
              tw`w-8 h-8 rounded-xl items-center justify-center mr-3`,
              tab === 'depletion' ? tw`bg-rose-50 border border-rose-100` : tw`bg-purple-50 border border-purple-100`,
            ]}>
            {tab === 'depletion' ? (
              <Droplets size={16} color="#dc2626" strokeWidth={2} />
            ) : (
              <Cpu size={16} color="#8b5cf6" strokeWidth={2} />
            )}
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-xs font-semibold text-slate-800`}>
              {tab === 'depletion'
                ? 'Rapid Depletion Criteria (> 0.3 m/year fall)'
                : 'Sensor Telemetry QA Screening'}
            </Text>
            <Text style={tw`text-xs text-slate-500 mt-0.5 leading-4.5 font-normal`}>
              {tab === 'depletion'
                ? 'These aquifers exhibit continuous water table decline exceeding sustainable replenishment thresholds. High priority for artificial recharge construction.'
                : 'Recorders identified with flatlined signals, implausible step jumps, or transmission dropouts. Excluded from baseline computations until field serviced.'}
            </Text>
          </View>
        </Card>

        {/* Alert List */}
        <SectionTitle
          title={tab === 'depletion' ? `Flagged Depletion Zones (${rows.length})` : `Faulty Recorders (${rows.length})`}
          subtitle={tab === 'depletion' ? 'Sorted by annual rate of water table loss' : 'Sorted by lowest telemetry health score'}
          icon={List}
        />
        <Card style={tw`py-1`}>
          {rows.length ? (
            rows.map((s) => <AlertRow key={s.code} s={s} kind={tab} />)
          ) : (
            <Empty label="No active anomalies flagged in this category" />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
