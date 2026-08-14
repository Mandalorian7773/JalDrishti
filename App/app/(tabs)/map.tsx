import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWideLayout } from '@/components/AppShell';
import { ArrowRight, Grid, Radio } from '@/components/Icons';
import StationMap from '@/components/StationMap';
import { Card, CategoryPill, ErrorState, Loading, PulseBadge, TrendBadge } from '@/components/Ui';
import { CATEGORY_META, Category, Station, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

const FILTERS: { key: Category | 'all'; label: string; countKey?: string }[] = [
  { key: 'all', label: 'All Recorders' },
  { key: 'over_exploited', label: 'Over-Exploited' },
  { key: 'critical', label: 'Critical' },
  { key: 'semi_critical', label: 'Semi-Critical' },
  { key: 'safe', label: 'Safe' },
];

export default function MapScreen() {
  const wide = useWideLayout();
  const [mode, setMode] = useState<'stations' | 'area'>('stations');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [state, setState] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const { data, error, loading, reload } = useApi<{ count: number; results: Station[] }>(
    '/stations/?limit=6000'
  );

  const all = useMemo(() => data?.results ?? [], [data]);
  const states = useMemo(() => Array.from(new Set(all.map((s) => s.state))).sort(), [all]);
  const shown = useMemo(
    () =>
      all.filter(
        (s) => (category === 'all' || s.category === category) && (!state || s.state === state)
      ),
    [all, category, state]
  );

  const selectedStation = useMemo(
    () => (selectedCode ? all.find((s) => s.code === selectedCode) : null),
    [all, selectedCode]
  );

  if (loading && !data) return <Loading label="Rendering spatial DWLR telemetry operations network…" />;
  if (error && !data)
    return (
      <SafeAreaView style={tw`flex-1 bg-slate-50 justify-center`}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50/50`} edges={wide ? [] : ['top']}>
      {/* Mobile Title (Wide screen already handled in AppShell) */}
      {!wide && (
        <View style={tw`px-4 pt-3 pb-1`}>
          <Text style={tw`text-[10px] font-semibold text-sky-600 uppercase tracking-widest`}>
            SPATIAL INTELLIGENCE
          </Text>
          <View style={tw`flex-row items-center justify-between mt-0.5`}>
            <Text style={tw`text-xl font-bold text-slate-900 tracking-tight`}>
              Live Operations Map
            </Text>
            <PulseBadge label={`${shown.length} Active`} />
          </View>
          <Text style={tw`text-xs text-slate-500 mt-1 font-normal`}>
            Switch between Live Station Map or Aquifer Area Map.
          </Text>
        </View>
      )}

      {/* Mode View Switcher (Live Station Map vs Live Area Map) */}
      <View style={tw`flex-row items-center px-4 pt-2.5 pb-1`}>
        <Pressable
          onPress={() => setMode('stations')}
          style={[
            tw`flex-row items-center px-3.5 py-1.5 rounded-xl mr-2.5 border shadow-2xs transition-all`,
            mode === 'stations'
              ? tw`bg-sky-50 border-sky-300 text-sky-700`
              : tw`bg-white border-slate-200 text-slate-600`,
          ]}>
          <Radio
            size={13}
            color={mode === 'stations' ? '#0284c7' : '#64748b'}
            strokeWidth={2}
            style={tw`mr-1.5`}
          />
          <Text
            style={[
              tw`text-xs font-semibold tracking-tight`,
              mode === 'stations' ? tw`text-sky-700` : tw`text-slate-600`,
            ]}>
            Live Station Map
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode('area')}
          style={[
            tw`flex-row items-center px-3.5 py-1.5 rounded-xl border shadow-2xs transition-all`,
            mode === 'area'
              ? tw`bg-sky-50 border-sky-300 text-sky-700`
              : tw`bg-white border-slate-200 text-slate-600`,
          ]}>
          <Grid
            size={13}
            color={mode === 'area' ? '#0284c7' : '#64748b'}
            strokeWidth={2}
            style={tw`mr-1.5`}
          />
          <Text
            style={[
              tw`text-xs font-semibold tracking-tight`,
              mode === 'area' ? tw`text-sky-700` : tw`text-slate-600`,
            ]}>
            Live Area Map
          </Text>
        </Pressable>
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`px-4 py-1.5`}
        style={tw`max-h-12`}>
        {FILTERS.map((f) => {
          const active = category === f.key;
          const color = f.key === 'all' ? '#0284c7' : CATEGORY_META[f.key as Category].color;
          const count =
            f.key === 'all'
              ? all.length
              : all.filter((s) => s.category === f.key).length;

          return (
            <Pressable
              key={f.key}
              onPress={() => setCategory(f.key)}
              style={[
                tw`flex-row items-center px-3 py-1 mr-2 rounded-full border shadow-2xs`,
                active
                  ? { backgroundColor: color, borderColor: color }
                  : tw`bg-white border-slate-200`,
              ]}>
              <View
                style={[
                  tw`w-2 h-2 rounded-full mr-1.5`,
                  { backgroundColor: active ? '#ffffff' : color },
                ]}
              />
              <Text
                style={[
                  tw`text-xs font-medium`,
                  active ? tw`text-white font-semibold` : tw`text-slate-700`,
                ]}>
                {f.label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* State Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`px-4 py-1`}
        style={tw`max-h-10`}>
        <Pressable
          onPress={() => setState(null)}
          style={[
            tw`px-3 py-1 mr-2 rounded-lg border justify-center`,
            !state
              ? tw`bg-slate-900 border-slate-900 shadow-2xs`
              : tw`bg-white border-slate-200`,
          ]}>
          <Text style={[tw`text-xs font-medium`, !state ? tw`text-white font-semibold` : tw`text-slate-700`]}>
            All States ({states.length})
          </Text>
        </Pressable>
        {states.map((st) => (
          <Pressable
            key={st}
            onPress={() => setState(st === state ? null : st)}
            style={[
              tw`px-3 py-1 mr-2 rounded-lg border justify-center`,
              st === state
                ? tw`bg-slate-900 border-slate-900 shadow-2xs`
                : tw`bg-white border-slate-200`,
            ]}>
            <Text style={[tw`text-xs font-medium`, st === state ? tw`text-white font-semibold` : tw`text-slate-700`]}>
              {st}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Map Container Viewport */}
      <View style={tw`flex-1 mx-4 my-2 rounded-[20px] overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 relative`}>
        <StationMap
          stations={shown}
          mode={mode}
          style={tw`flex-1`}
          onSelect={(code) => setSelectedCode(code)}
        />
      </View>

      {/* Selected Station Quick Preview Card */}
      {selectedStation && (
        <Card style={tw`mx-4 mb-2 p-3.5 border-sky-300/80 bg-sky-50/40 shadow-sm`}>
          <View style={tw`flex-row items-start justify-between`}>
            <View style={tw`flex-1 pr-2`}>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-sm font-semibold text-slate-900`} numberOfLines={1}>
                  {selectedStation.name}
                </Text>
                <Text style={tw`ml-2 text-[10px] font-mono text-slate-500`}>
                  {selectedStation.code}
                </Text>
              </View>
              <Text style={tw`text-xs text-slate-500 mt-0.5 font-normal`}>
                {selectedStation.district}, {selectedStation.state}
              </Text>
            </View>
            <CategoryPill category={selectedStation.category} small />
          </View>

          <View style={tw`flex-row items-center justify-between mt-2.5 pt-2 border-t border-sky-200/60`}>
            <View style={tw`flex-row items-center flex-wrap`}>
              <TrendBadge value={selectedStation.trend_m_per_year} />
              <Text style={tw`text-xs font-medium text-slate-700 ml-3`}>
                {fmt(selectedStation.latest_level_mbgl, 2, ' m bgl')}
              </Text>
              <Text style={tw`text-xs text-slate-500 ml-3 font-normal`}>
                Recharge: {fmt(selectedStation.recharge_mm, 0, ' mm')}
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/analytics',
                  params: { code: selectedStation.code },
                })
              }
              style={tw`bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded-lg flex-row items-center shadow-2xs`}>
              <Text style={tw`text-white text-xs font-semibold mr-1`}>Analytics</Text>
              <ArrowRight size={12} color="#fff" strokeWidth={2} />
            </Pressable>
          </View>
        </Card>
      )}

      {/* Footer Info */}
      <View style={tw`mx-4 mb-2 flex-row items-center justify-between`}>
        <Text style={tw`text-[10px] text-slate-400 font-normal`}>
          Click any telemetry marker for instant hydrograph &amp; diagnostics
        </Text>
        <Text style={tw`text-[10px] font-medium text-slate-500`}>
          CGWB India-WRIS Telemetry Engine
        </Text>
      </View>
    </SafeAreaView>
  );
}
