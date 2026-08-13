import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Card,
  CategoryBar,
  CategoryPill,
  ErrorState,
  Loading,
  SectionTitle,
  Stat,
  TrendBadge,
} from '@/components/Ui';
import { Station, Summary, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

const StationRow = ({ s, rank }: { s: Station; rank: number }) => (
  <Pressable
    onPress={() => router.push({ pathname: '/(tabs)/analytics', params: { code: s.code } })}
    style={tw`flex-row items-center py-3 border-b border-slate-100`}>
    <Text style={tw`w-6 text-xs text-slate-400 font-semibold`}>{rank}</Text>
    <View style={tw`flex-1 pr-2`}>
      <Text style={tw`text-sm font-semibold text-slate-900`} numberOfLines={1}>
        {s.name}
      </Text>
      <Text style={tw`text-xs text-slate-500`} numberOfLines={1}>
        {s.district}, {s.state}
      </Text>
    </View>
    <View style={tw`items-end`}>
      <TrendBadge value={s.trend_m_per_year} />
      <Text style={tw`text-[11px] text-slate-400 mt-0.5`}>
        {fmt(s.latest_level_mbgl, 2, ' m bgl')}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color="#cbd5e1" style={tw`ml-1`} />
  </Pressable>
);

export default function DashboardScreen() {
  const { data, error, loading, reload } = useApi<Summary>('/summary/');

  if (loading && !data) return <Loading label="Loading national groundwater status…" />;
  if (error && !data)
    return (
      <SafeAreaView style={tw`flex-1 bg-slate-50 justify-center`}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  if (!data) return null;

  const s = data;
  const netTrend = s.avg_trend ?? 0;

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`} edges={['top']}>
      <ScrollView
        contentContainerStyle={tw`px-3 pb-28`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}>
        <View style={tw`pt-4 pb-2 px-1`}>
          <Text style={tw`text-2xl font-bold text-slate-900`}>JalDrishti</Text>
          <Text style={tw`text-sm text-slate-500 mt-0.5`}>
            Real-time groundwater evaluation from CGWB DWLR telemetry
          </Text>
          <Text style={tw`text-[11px] text-slate-400 mt-1`}>
            {s.stations.toLocaleString()} recorders · {s.districts} districts · {s.states} states
            · latest reading {s.latest ?? '—'}
          </Text>
        </View>

        <View style={tw`flex-row flex-wrap -mx-1 mt-2`}>
          <Stat
            label="Mean water level"
            value={fmt(s.avg_level, 2)}
            unit="m bgl"
            icon="water"
            tint="#0ea5e9"
            hint="depth below ground"
          />
          <Stat
            label="Net trend"
            value={`${netTrend > 0 ? '↓' : '↑'} ${Math.abs(netTrend).toFixed(2)}`}
            unit="m/yr"
            icon="trending-down"
            tint={netTrend > 0 ? '#dc2626' : '#16a34a'}
            hint={netTrend > 0 ? 'table deepening' : 'table recovering'}
          />
          <Stat
            label="Monsoon recharge"
            value={fmt(s.avg_recharge, 0)}
            unit="mm"
            icon="rainy"
            tint="#6366f1"
            hint="WTF method, GEC-2015"
          />
          <Stat
            label="Seasonal fluctuation"
            value={fmt(s.avg_fluctuation, 2)}
            unit="m"
            icon="swap-vertical"
            tint="#0891b2"
            hint="pre vs post monsoon"
          />
          <Stat
            label="Stations at risk"
            value={String(s.at_risk)}
            unit={`of ${s.total}`}
            icon="warning"
            tint="#f97316"
            hint="critical + over-exploited"
          />
          <Stat
            label="Data quality"
            value={fmt(s.avg_quality, 0)}
            unit="/100"
            icon="pulse"
            tint="#8b5cf6"
            hint={`${s.flagged_sensors} excluded as faulty`}
          />
        </View>

        <SectionTitle title="Resource categorisation" />
        <Card>
          <CategoryBar counts={s.by_category} />
          <Text style={tw`text-[11px] text-slate-400 mt-3 leading-4`}>
            {s.total.toLocaleString()} recorders with trustworthy telemetry, categorised by rate
            of water-table decline: safe &lt;0.1, semi-critical 0.1–0.3, critical 0.3–0.6,
            over-exploited &gt;0.6 m/yr. The {s.flagged_sensors} flagged recorders are excluded from
            every figure on this screen.
          </Text>
          <View style={tw`flex-row mt-3 pt-3 border-t border-slate-100`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-red-600`}>{s.declining}</Text>
              <Text style={tw`text-xs text-slate-500`}>stations declining</Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-green-600`}>{s.recovering}</Text>
              <Text style={tw`text-xs text-slate-500`}>stations recovering</Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-slate-900`}>
                {(s.readings / 1000).toFixed(0)}k
              </Text>
              <Text style={tw`text-xs text-slate-500`}>daily observations</Text>
            </View>
          </View>
        </Card>

        <SectionTitle
          title="Fastest depleting stations"
          action={
            <Pressable onPress={() => router.push('/(tabs)/alerts')}>
              <Text style={tw`text-xs text-sky-600 font-semibold`}>All alerts</Text>
            </Pressable>
          }
        />
        <Card style={tw`py-0`}>
          {s.worst.slice(0, 6).map((st, i) => (
            <StationRow key={st.code} s={st} rank={i + 1} />
          ))}
        </Card>

        <SectionTitle title="Strongest recovery" />
        <Card style={tw`py-0`}>
          {s.best.slice(0, 5).map((st, i) => (
            <StationRow key={st.code} s={st} rank={i + 1} />
          ))}
        </Card>

        <SectionTitle title="What this means" />
        <Card>
          <View style={tw`flex-row`}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={tw`flex-1 ml-2 text-sm text-slate-700 leading-5`}>
              {s.at_risk > 0
                ? `${s.at_risk} recorders show sustained depletion beyond 0.3 m/yr. At that rate their aquifers lose roughly ${fmt(
                    (s.avg_recharge ?? 0) / 1000,
                    2
                  )} m of the monsoon gain each year — prioritise these blocks for artificial recharge and abstraction limits.`
                : 'No station is currently depleting faster than 0.3 m/yr across the analysed period.'}
            </Text>
          </View>
          <View style={tw`flex-row mt-3`}>
            <Ionicons name="hardware-chip" size={20} color="#8b5cf6" />
            <Text style={tw`flex-1 ml-2 text-sm text-slate-700 leading-5`}>
              {s.flagged_sensors} recorders report stuck, spiking, stale or patchy data. Their
              readings are excluded from decision-making until serviced.
            </Text>
          </View>
        </Card>

        <View style={tw`items-center mt-6`}>
          <CategoryPill category="safe" small />
          <Text style={tw`text-[10px] text-slate-400 mt-2 text-center`}>
            Source: India-WRIS telemetric groundwater level data, Central Ground Water Board
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
