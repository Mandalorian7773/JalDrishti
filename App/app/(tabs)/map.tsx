import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StationMap from '@/components/StationMap';
import { Card, ErrorState, Loading } from '@/components/Ui';
import { CATEGORY_META, Category, Station, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

const FILTERS: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'over_exploited', label: 'Over-Exploited' },
  { key: 'critical', label: 'Critical' },
  { key: 'semi_critical', label: 'Semi-Critical' },
  { key: 'safe', label: 'Safe' },
];

export default function MapScreen() {
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [state, setState] = useState<string | null>(null);
  const { data, error, loading, reload } = useApi<{ count: number; results: Station[] }>(
    '/stations/?limit=6000'
  );

  // Must be memoised: a fresh array each render rebuilds the map HTML and
  // remounts the iframe, so the map would reset on every keystroke or tap.
  const all = useMemo(() => data?.results ?? [], [data]);
  const states = useMemo(() => Array.from(new Set(all.map((s) => s.state))).sort(), [all]);
  const shown = useMemo(
    () =>
      all.filter(
        (s) => (category === 'all' || s.category === category) && (!state || s.state === state)
      ),
    [all, category, state]
  );

  if (loading && !data) return <Loading label="Loading station network…" />;
  if (error && !data)
    return (
      <SafeAreaView style={tw`flex-1 bg-slate-50 justify-center`}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`} edges={['top']}>
      <View style={tw`px-4 pt-4 pb-2`}>
        <Text style={tw`text-2xl font-bold text-slate-900`}>Station network</Text>
        <Text style={tw`text-sm text-slate-500 mt-0.5`}>
          {shown.length.toLocaleString()} of {all.length.toLocaleString()} DWLR recorders
          {state ? ` in ${state}` : ' across India'} · tap a marker for analytics
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`px-3 max-h-11`}>
        {FILTERS.map((f) => {
          const active = category === f.key;
          const color = f.key === 'all' ? '#0ea5e9' : CATEGORY_META[f.key as Category].color;
          return (
            <Pressable
              key={f.key}
              onPress={() => setCategory(f.key)}
              style={[
                tw`px-3 py-2 mx-1 rounded-full border h-9 justify-center`,
                active
                  ? { backgroundColor: color, borderColor: color }
                  : tw`bg-white border-slate-200`,
              ]}>
              <Text style={tw`text-xs font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`px-3 mt-2 max-h-10`}>
        <Pressable
          onPress={() => setState(null)}
          style={tw`px-3 py-1.5 mx-1 rounded-lg border h-8 justify-center ${
            !state ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-200'
          }`}>
          <Text style={tw`text-xs ${!state ? 'text-white' : 'text-slate-600'}`}>All states</Text>
        </Pressable>
        {states.map((st) => (
          <Pressable
            key={st}
            onPress={() => setState(st === state ? null : st)}
            style={tw`px-3 py-1.5 mx-1 rounded-lg border h-8 justify-center ${
              st === state ? 'bg-slate-800 border-slate-800' : 'bg-white border-slate-200'
            }`}>
            <Text style={tw`text-xs ${st === state ? 'text-white' : 'text-slate-600'}`}>{st}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={tw`flex-1 mx-3 my-3 rounded-xl overflow-hidden border border-slate-200`}>
        <StationMap
          stations={shown}
          style={tw`flex-1`}
          onSelect={(code) =>
            router.push({ pathname: '/(tabs)/analytics', params: { code } })
          }
        />
      </View>

      <Card style={tw`mx-3 mb-24 py-2`}>
        <Text style={tw`text-[11px] text-slate-500 leading-4`}>
          Marker colour is the depletion category derived from each recorder&apos;s own trend. Basemap
          © OpenStreetMap/CARTO · station data India-WRIS (CGWB).
        </Text>
      </Card>
    </SafeAreaView>
  );
}
