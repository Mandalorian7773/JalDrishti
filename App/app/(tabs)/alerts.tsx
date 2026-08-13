import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, CategoryPill, Empty, ErrorState, Loading, TrendBadge } from '@/components/Ui';
import { ANOMALY_LABEL, Station, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

type Tab = 'depletion' | 'sensor';

const AlertRow = ({ s, kind }: { s: Station; kind: Tab }) => (
  <Pressable
    onPress={() => router.push({ pathname: '/(tabs)/analytics', params: { code: s.code } })}
    style={tw`py-3 border-b border-slate-100`}>
    <View style={tw`flex-row items-start`}>
      <View style={tw`flex-1 pr-2`}>
        <Text style={tw`text-sm font-semibold text-slate-900`} numberOfLines={1}>
          {s.name}
        </Text>
        <Text style={tw`text-xs text-slate-500 mt-0.5`}>
          {s.district}, {s.state} · {s.code}
        </Text>
      </View>
      {kind === 'depletion' ? (
        <CategoryPill category={s.category} small />
      ) : (
        <Text style={tw`text-xs font-bold text-orange-600`}>{fmt(s.data_quality, 0)}/100</Text>
      )}
    </View>

    {kind === 'depletion' ? (
      <View style={tw`flex-row items-center mt-2`}>
        <TrendBadge value={s.trend_m_per_year} />
        <Text style={tw`text-[11px] text-slate-400 ml-3`}>
          now {fmt(s.latest_level_mbgl, 2, ' m bgl')}
        </Text>
        <Text style={tw`text-[11px] text-slate-400 ml-3`}>
          recharge {fmt(s.recharge_mm, 0, ' mm')}
        </Text>
      </View>
    ) : (
      <View style={tw`flex-row flex-wrap mt-1.5`}>
        {s.anomalies.map((a) => (
          <View key={a} style={tw`flex-row items-center bg-orange-50 rounded px-2 py-0.5 mr-1.5 mt-1`}>
            <Ionicons name="alert-circle" size={11} color="#f97316" />
            <Text style={tw`text-[10px] text-orange-700 ml-1`}>{ANOMALY_LABEL[a] ?? a}</Text>
          </View>
        ))}
      </View>
    )}
  </Pressable>
);

export default function AlertsScreen() {
  const [tab, setTab] = useState<Tab>('depletion');
  const { data, error, loading, reload } = useApi<Record<Tab, Station[]>>('/alerts/');

  if (loading && !data) return <Loading label="Checking station alerts…" />;
  if (error && !data)
    return (
      <SafeAreaView style={tw`flex-1 bg-slate-50 justify-center`}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );

  const rows = data?.[tab] ?? [];

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`} edges={['top']}>
      <View style={tw`px-4 pt-4`}>
        <Text style={tw`text-2xl font-bold text-slate-900`}>Alerts</Text>
        <Text style={tw`text-sm text-slate-500 mt-0.5`}>
          Where to intervene, and which recorders to service first
        </Text>
      </View>

      <View style={tw`flex-row mx-3 mt-4 bg-slate-200 rounded-xl p-1`}>
        {(
          [
            ['depletion', 'Depletion', data?.depletion?.length ?? 0],
            ['sensor', 'Sensor faults', data?.sensor?.length ?? 0],
          ] as [Tab, string, number][]
        ).map(([key, label, n]) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={tw`flex-1 py-2 rounded-lg ${tab === key ? 'bg-white' : ''}`}>
            <Text
              style={tw`text-center text-xs font-semibold ${
                tab === key ? 'text-slate-900' : 'text-slate-500'
              }`}>
              {label} ({n})
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={tw`px-3 pb-28`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}>
        <Card style={tw`mt-3 flex-row items-start`}>
          <Ionicons
            name={tab === 'depletion' ? 'water' : 'hardware-chip'}
            size={18}
            color={tab === 'depletion' ? '#dc2626' : '#8b5cf6'}
          />
          <Text style={tw`flex-1 ml-2 text-xs text-slate-600 leading-4`}>
            {tab === 'depletion'
              ? 'Stations whose water table is falling faster than 0.3 m/yr over the observation period. Candidates for recharge structures and abstraction control.'
              : 'Recorders whose telemetry is stuck, spiking, stale or full of gaps. Their readings should not drive decisions until the sensor is checked.'}
          </Text>
        </Card>

        <Card style={tw`mt-3 py-0`}>
          {rows.length ? (
            rows.map((s) => <AlertRow key={s.code} s={s} kind={tab} />)
          ) : (
            <Empty label="Nothing flagged" />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
