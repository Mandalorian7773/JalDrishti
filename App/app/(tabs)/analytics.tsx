import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Card,
  CategoryPill,
  Empty,
  ErrorState,
  Loading,
  SectionTitle,
  Stat,
  TrendBadge,
} from '@/components/Ui';
import { ANOMALY_LABEL, Station, StationDetail, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

const CHART_W = Dimensions.get('window').width - 40;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 1,
  color: (o = 1) => `rgba(14,165,233,${o})`,
  labelColor: (o = 1) => `rgba(100,116,139,${o})`,
  propsForDots: { r: '0' },
  propsForBackgroundLines: { stroke: '#f1f5f9' },
};

/** Charting 900 daily points is unreadable and slow — thin to `n` evenly spaced. */
function thin<T>(rows: T[], n: number): T[] {
  if (rows.length <= n) return rows;
  const step = (rows.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => rows[Math.round(i * step)]);
}

export default function AnalyticsScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [code, setCode] = useState<string | null>(params.code ?? null);

  useEffect(() => {
    if (params.code) setCode(params.code);
  }, [params.code]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const list = useApi<{ count: number; results: Station[] }>(
    `/stations/?limit=25${debounced ? `&q=${encodeURIComponent(debounced)}` : '&order=trend'}`
  );
  const detail = useApi<StationDetail>(code ? `/stations/${code}/` : null);

  // Default to the worst-declining station so the screen is never empty.
  useEffect(() => {
    if (!code && list.data?.results?.length) setCode(list.data.results[0].code);
  }, [code, list.data]);

  const chart = useMemo(() => {
    const d = detail.data;
    if (!d?.series?.length) return null;
    // Observed only — padding this series to overlay the forecast would draw a
    // flat tail that reads as real data. The projection gets its own row below.
    const hist = thin(d.series, 40);
    const labels = hist.map((p, i) =>
      i % Math.ceil(hist.length / 5) === 0 ? p.date.slice(2, 7) : ''
    );
    return {
      labels,
      datasets: [
        { data: hist.map((p) => p.level_mbgl), color: (o = 1) => `rgba(14,165,233,${o})`, strokeWidth: 2 },
      ],
    };
  }, [detail.data]);

  const projection = useMemo(() => {
    const fc = detail.data?.forecast ?? [];
    if (!fc.length) return null;
    const at = (days: number) => fc[Math.min(Math.round(days / 7) - 1, fc.length - 1)];
    return { d30: at(30), d90: fc[fc.length - 1] };
  }, [detail.data]);

  const d = detail.data;

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`} edges={['top']}>
      <ScrollView contentContainerStyle={tw`px-3 pb-28`} keyboardShouldPersistTaps="handled">
        <View style={tw`pt-4 px-1`}>
          <Text style={tw`text-2xl font-bold text-slate-900`}>Station analytics</Text>
          <Text style={tw`text-sm text-slate-500 mt-0.5`}>
            Water-level history, recharge and 90-day projection
          </Text>
        </View>

        <View style={tw`flex-row items-center bg-white rounded-xl px-3 mt-4 border border-slate-200`}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search station, district or state"
            placeholderTextColor="#94a3b8"
            style={tw`flex-1 py-3 px-2 text-slate-900`}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#cbd5e1" />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mt-3 -mx-1`}>
          {(list.data?.results ?? []).map((s) => (
            <Pressable
              key={s.code}
              onPress={() => setCode(s.code)}
              style={tw`mx-1 px-3 py-2 rounded-xl border ${
                s.code === code ? 'bg-sky-600 border-sky-600' : 'bg-white border-slate-200'
              }`}>
              <Text
                style={tw`text-xs font-semibold ${s.code === code ? 'text-white' : 'text-slate-700'}`}
                numberOfLines={1}>
                {s.name}
              </Text>
              <Text
                style={tw`text-[10px] ${s.code === code ? 'text-sky-100' : 'text-slate-400'}`}
                numberOfLines={1}>
                {s.district}
              </Text>
            </Pressable>
          ))}
          {list.loading && <Text style={tw`text-xs text-slate-400 px-2 py-3`}>searching…</Text>}
          {!list.loading && !list.data?.results?.length && (
            <Text style={tw`text-xs text-slate-400 px-2 py-3`}>no station matches “{debounced}”</Text>
          )}
        </ScrollView>

        {detail.error && <ErrorState message={detail.error} onRetry={detail.reload} />}
        {detail.loading && !d && <Loading label="Loading station series…" />}

        {d && (
          <>
            <Card style={tw`mt-4`}>
              <View style={tw`flex-row items-start justify-between`}>
                <View style={tw`flex-1 pr-2`}>
                  <Text style={tw`text-lg font-bold text-slate-900`}>{d.name}</Text>
                  <Text style={tw`text-xs text-slate-500 mt-0.5`}>
                    {d.district}, {d.state} · {d.code}
                  </Text>
                  <Text style={tw`text-[11px] text-slate-400 mt-1`}>
                    {d.well_type || 'Well'} · {fmt(d.well_depth_m, 0, ' m deep')} · aquifer{' '}
                    {d.aquifer_type || 'n/a'} · {d.reading_count} daily records
                  </Text>
                </View>
                <CategoryPill category={d.category} />
              </View>
              <View style={tw`flex-row items-center mt-3 pt-3 border-t border-slate-100`}>
                <TrendBadge value={d.trend_m_per_year} />
                <Text style={tw`text-xs text-slate-400 ml-auto`}>last reading {d.latest_date}</Text>
              </View>
            </Card>

            <SectionTitle title="Water table over time" />
            <Card style={tw`px-0 pt-4 pb-2`}>
              {chart ? (
                <>
                  <LineChart
                    data={chart as any}
                    width={CHART_W}
                    height={230}
                    chartConfig={chartConfig}
                    bezier
                    withDots={false}
                    fromZero={false}
                    yAxisSuffix="m"
                    style={{ marginLeft: -10 }}
                  />
                  <Text style={tw`text-[11px] text-slate-400 px-4`}>
                    Depth below ground level — a rising line means the water table is getting
                    deeper.
                  </Text>
                </>
              ) : (
                <Empty label="No series for this station" />
              )}
            </Card>

            {projection && (
              <Card style={tw`mt-3`}>
                <Text style={tw`text-xs font-semibold text-slate-900 mb-3`}>
                  Projected water table
                </Text>
                <View style={tw`flex-row`}>
                  {(
                    [
                      ['Now', d.latest_level_mbgl],
                      ['In 30 days', projection.d30?.level_mbgl],
                      ['In 90 days', projection.d90?.level_mbgl],
                    ] as [string, number | null | undefined][]
                  ).map(([label, value], i) => {
                    const delta = (value ?? 0) - (d.latest_level_mbgl ?? 0);
                    return (
                      <View key={label} style={tw`flex-1`}>
                        <Text style={tw`text-[11px] text-slate-500`}>{label}</Text>
                        <Text style={tw`text-lg font-bold text-slate-900`}>{fmt(value, 2)}</Text>
                        <Text style={tw`text-[10px] text-slate-400`}>
                          m bgl
                          {i > 0 &&
                            ` · ${delta > 0 ? '+' : ''}${delta.toFixed(2)} ${
                              delta > 0 ? 'deeper' : 'shallower'
                            }`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={tw`text-[11px] text-slate-400 mt-3`}>
                  {projection.d90?.seasonal
                    ? "Linear trend plus annual monsoon cycle fitted to this station's own record."
                    : 'Trend only — under two years of record, so no monsoon cycle is fitted yet.'}
                </Text>
              </Card>
            )}

            <SectionTitle title="Resource evaluation" />
            <View style={tw`flex-row flex-wrap -mx-1`}>
              <Stat
                label="Pre-monsoon (Apr–May)"
                value={fmt(d.pre_monsoon_mbgl, 2)}
                unit="m bgl"
                icon="sunny"
                tint="#f59e0b"
              />
              <Stat
                label="Post-monsoon (Oct–Nov)"
                value={fmt(d.post_monsoon_mbgl, 2)}
                unit="m bgl"
                icon="rainy"
                tint="#0ea5e9"
              />
              <Stat
                label="Seasonal rise"
                value={fmt(d.seasonal_fluctuation_m, 2)}
                unit="m"
                icon="swap-vertical"
                tint="#0891b2"
              />
              <Stat
                label="Recharge"
                value={fmt(d.recharge_mm, 0)}
                unit="mm"
                icon="water"
                tint="#6366f1"
                hint={`Sy = ${d.specific_yield ?? '—'}`}
              />
              <Stat
                label="Shallowest"
                value={fmt(d.min_level_mbgl, 2)}
                unit="m bgl"
                icon="arrow-up-circle"
                tint="#16a34a"
              />
              <Stat
                label="Deepest"
                value={fmt(d.max_level_mbgl, 2)}
                unit="m bgl"
                icon="arrow-down-circle"
                tint="#dc2626"
              />
            </View>

            <Card style={tw`mt-3`}>
              <Text style={tw`text-xs text-slate-600 leading-5`}>
                <Text style={tw`font-semibold`}>How recharge is computed. </Text>
                Water Table Fluctuation method (GEC-2015): recharge ={' '}
                {fmt(d.seasonal_fluctuation_m, 2)} m rise × specific yield {d.specific_yield} × 1000
                = {fmt(d.recharge_mm, 0)} mm over the monsoon season.
              </Text>
            </Card>

            <SectionTitle title="Sensor health" />
            <Card>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-3xl font-bold text-slate-900`}>{fmt(d.data_quality, 0)}</Text>
                <Text style={tw`text-slate-400 ml-1 mt-2`}>/100</Text>
                <View style={tw`flex-1 ml-4`}>
                  <View style={tw`h-2 bg-slate-100 rounded-full overflow-hidden`}>
                    <View
                      style={[
                        tw`h-2 rounded-full`,
                        {
                          width: `${d.data_quality ?? 0}%`,
                          backgroundColor:
                            (d.data_quality ?? 0) > 75
                              ? '#16a34a'
                              : (d.data_quality ?? 0) > 50
                                ? '#eab308'
                                : '#dc2626',
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
              {d.anomalies?.length ? (
                d.anomalies.map((a) => (
                  <View key={a} style={tw`flex-row items-center mt-2`}>
                    <Ionicons name="alert-circle" size={15} color="#f97316" />
                    <Text style={tw`text-xs text-slate-700 ml-2`}>{ANOMALY_LABEL[a] ?? a}</Text>
                  </View>
                ))
              ) : (
                <View style={tw`flex-row items-center mt-2`}>
                  <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                  <Text style={tw`text-xs text-slate-700 ml-2`}>
                    Transmitting cleanly, no anomalies detected
                  </Text>
                </View>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
