import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWideLayout } from '@/components/AppShell';
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  CheckCircle2,
  CloudRain,
  Droplet,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from '@/components/Icons';
import {
  AnomalyBadge,
  Card,
  CategoryPill,
  Empty,
  ErrorState,
  GlassCard,
  Loading,
  PulseBadge,
  SectionTitle,
  Stat,
  TrendBadge,
} from '@/components/Ui';
import { Station, StationDetail, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 1,
  color: (o = 1) => `rgba(2, 132, 199, ${o})`,
  labelColor: (o = 1) => `rgba(71, 85, 105, ${o})`,
  propsForDots: { r: '0' },
  propsForBackgroundLines: { stroke: '#f8fafc', strokeDasharray: '' },
};

function thin<T>(rows: T[], n: number): T[] {
  if (rows.length <= n) return rows;
  const step = (rows.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => rows[Math.round(i * step)]);
}

export default function AnalyticsScreen() {
  const wide = useWideLayout();
  // Subscribed, not sampled: Dimensions.get() does not re-render on rotation,
  // and reads 0 during the web static export, which made the chart negative.
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ code?: string }>();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [code, setCode] = useState<string | null>(params.code ?? null);

  useEffect(() => {
    if (params.code) setCode(params.code);
  }, [params.code]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const list = useApi<{ count: number; results: Station[] }>(
    `/stations/?limit=30${debounced ? `&q=${encodeURIComponent(debounced)}` : '&order=trend'}`
  );
  const detail = useApi<StationDetail>(code ? `/stations/${code}/` : null);

  // Default to first station if none selected
  useEffect(() => {
    if (!code && list.data?.results?.length) setCode(list.data.results[0].code);
  }, [code, list.data]);

  const chart = useMemo(() => {
    const d = detail.data;
    if (!d?.series?.length) return null;
    const hist = thin(d.series, 36);
    const labels = hist.map((p, i) =>
      i % Math.max(1, Math.ceil(hist.length / 5)) === 0 ? p.date.slice(2, 7) : ''
    );
    return {
      labels,
      datasets: [
        {
          data: hist.map((p) => p.level_mbgl),
          color: (o = 1) => `rgba(2, 132, 199, ${o})`,
          strokeWidth: 2.2,
        },
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
  const chartWidth = wide ? Math.min(width - 340, 1140) : Math.max(width - 40, 1);

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50/50`} edges={wide ? [] : ['top']}>
      <ScrollView contentContainerStyle={tw`${wide ? 'px-8 pt-6' : 'px-4 pt-4'} pb-32`} keyboardShouldPersistTaps="handled">
        {/* Mobile Header */}
        {!wide && (
          <View style={tw`pt-1 pb-1`}>
            <Text style={tw`text-[10px] font-semibold text-sky-600 uppercase tracking-widest`}>
              DEEP METRICS
            </Text>
            <View style={tw`flex-row items-center justify-between mt-0.5`}>
              <Text style={tw`text-xl font-bold text-slate-900 tracking-tight`}>
                Station Analytics &amp; Forecasting
              </Text>
              <PulseBadge label="DWLR Online" />
            </View>
            <Text style={tw`text-xs text-slate-500 mt-1 font-normal`}>
              Hydrograph, GEC-2015 recharge &amp; predictive projection
            </Text>
          </View>
        )}

        {/* Station Search Input */}
        <View style={tw`flex-row items-center bg-white rounded-xl px-3.5 mt-2 border border-slate-200 shadow-2xs`}>
          <Search size={16} color="#0284c7" strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search station name, code, district, or state…"
            placeholderTextColor="#94a3b8"
            style={tw`flex-1 py-3 px-2.5 text-xs text-slate-900 font-medium`}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')}>
              <X size={16} color="#94a3b8" strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {/* Station Quick Switcher Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mt-2.5 -mx-1`}>
          {(list.data?.results ?? []).map((s) => {
            const isSelected = s.code === code;
            return (
              <Pressable
                key={s.code}
                onPress={() => setCode(s.code)}
                style={[
                  tw`mx-1 px-3.5 py-2.5 rounded-xl border shadow-2xs transition-all`,
                  isSelected
                    ? tw`bg-sky-600 border-sky-700`
                    : tw`bg-white border-slate-200 hover:border-slate-300`,
                ]}>
                <Text
                  style={[
                    tw`text-xs font-semibold`,
                    isSelected ? tw`text-white` : tw`text-slate-800`,
                  ]}
                  numberOfLines={1}>
                  {s.name}
                </Text>
                <Text
                  style={[
                    tw`text-[10px] mt-0.5 font-normal`,
                    isSelected ? tw`text-sky-100` : tw`text-slate-400`,
                  ]}
                  numberOfLines={1}>
                  {s.district}, {s.state}
                </Text>
              </Pressable>
            );
          })}
          {list.loading && <Text style={tw`text-xs text-slate-400 px-3 py-3 font-normal`}>Searching stations…</Text>}
        </ScrollView>

        {detail.error && <ErrorState message={detail.error} onRetry={detail.reload} />}
        {detail.loading && !d && <Loading label="Loading station hydrograph & telemetry series…" />}

        {d && (
          <>
            {/* Station Overview Profile Card */}
            <Card style={tw`mt-4 p-5`}>
              <View style={tw`flex-row items-start justify-between`}>
                <View style={tw`flex-1 pr-3`}>
                  <View style={tw`flex-row items-center flex-wrap`}>
                    <Text style={tw`text-lg font-bold text-slate-900 tracking-tight`}>{d.name}</Text>
                    <View style={tw`ml-2 bg-slate-100 border border-slate-200 rounded px-2 py-0.5`}>
                      <Text style={tw`text-[10px] font-mono font-medium text-slate-600`}>{d.code}</Text>
                    </View>
                  </View>
                  <Text style={tw`text-xs font-normal text-slate-600 mt-1`}>
                    {d.district}, {d.state} • Tehsil: {d.tehsil || '—'} • Block: {d.block || '—'}
                  </Text>
                  <View style={tw`flex-row items-center flex-wrap mt-2.5`}>
                    <View style={tw`bg-sky-50 border border-sky-200/80 rounded-md px-2 py-0.5 mr-2 mb-1`}>
                      <Text style={tw`text-[10px] font-medium text-sky-800`}>
                        {d.well_type || 'Borewell'} ({fmt(d.well_depth_m, 0, ' m depth')})
                      </Text>
                    </View>
                    <View style={tw`bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5 mr-2 mb-1`}>
                      <Text style={tw`text-[10px] font-medium text-slate-700`}>
                        Aquifer: {d.aquifer_type || 'Alluvial'}
                      </Text>
                    </View>
                    <View style={tw`bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5 mr-2 mb-1`}>
                      <Text style={tw`text-[10px] font-medium text-slate-700`}>
                        Agency: {d.agency || 'CGWB'}
                      </Text>
                    </View>
                  </View>
                </View>
                <CategoryPill category={d.category} />
              </View>

              <View style={tw`flex-row items-center justify-between mt-4 pt-3 border-t border-slate-100`}>
                <TrendBadge value={d.trend_m_per_year} />
                <Text style={tw`text-xs font-normal text-slate-500`}>
                  Last Observation: <Text style={tw`font-semibold text-slate-700`}>{d.latest_date || '—'}</Text>
                </Text>
              </View>
            </Card>

            {/* Historical Hydrograph Timeline */}
            <SectionTitle
              title="Historical Telemetry Hydrograph"
              subtitle="Daily depth below ground level (m bgl) recorded by automated sensor"
              icon={Activity}
            />
            <Card style={tw`px-2 pt-5 pb-3`}>
              {chart ? (
                <>
                  <LineChart
                    data={chart as any}
                    width={chartWidth}
                    height={230}
                    chartConfig={chartConfig}
                    bezier
                    withDots={false}
                    fromZero={false}
                    yAxisSuffix="m"
                    style={{ marginLeft: -10 }}
                  />
                  <Text style={tw`text-[11px] text-slate-500 px-4 mt-1 font-normal`}>
                    Depth below ground level. Upward curve indicates groundwater table deepening / depletion; drop indicates recharge.
                  </Text>
                </>
              ) : (
                <Empty label="No continuous series available for this recorder" />
              )}
            </Card>

            {/* 90-Day Predictive Water Table Simulator */}
            {projection && (
              <GlassCard style={tw`mt-4`}>
                <View style={tw`flex-row items-center justify-between mb-3`}>
                  <View style={tw`flex-row items-center`}>
                    <Sparkles size={16} color="#38bdf8" strokeWidth={2} style={tw`mr-2`} />
                    <Text style={tw`text-sm font-semibold text-white`}>
                      90-Day Predictive Groundwater Model
                    </Text>
                  </View>
                  <View style={tw`bg-sky-500/20 border border-sky-400/30 rounded-full px-2.5 py-0.5`}>
                    <Text style={tw`text-[10px] font-medium text-sky-300`}>Harmonic Forecast</Text>
                  </View>
                </View>

                <View style={tw`flex-row justify-between bg-slate-800/90 rounded-xl p-3.5 border border-slate-700/60`}>
                  {[
                    ['Current Level', d.latest_level_mbgl, 'Observed now'],
                    ['In 30 Days', projection.d30?.level_mbgl, 'Linear projection'],
                    ['In 90 Days', projection.d90?.level_mbgl, 'Monsoon harmonic fit'],
                  ].map(([label, value, hint], i) => {
                    const delta = (Number(value) || 0) - (d.latest_level_mbgl ?? 0);
                    return (
                      <View key={String(label)} style={tw`flex-1 ${i > 0 ? 'border-l border-slate-700/60 pl-3' : ''}`}>
                        <Text style={tw`text-[10px] font-medium text-slate-400 uppercase tracking-wider`}>{label}</Text>
                        <Text style={tw`text-lg font-bold text-white mt-1`}>
                          {fmt(value as number, 2)}
                          <Text style={tw`text-xs font-normal text-slate-400`}> m</Text>
                        </Text>
                        <Text style={tw`text-[10px] font-normal text-slate-400 mt-0.5`}>
                          {i > 0 ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)}m ${delta > 0 ? 'drop' : 'rise'}` : hint}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </GlassCard>
            )}

            {/* GEC-2015 Resource Evaluation Matrix */}
            <SectionTitle
              title="GEC-2015 Resource Evaluation Matrix"
              subtitle="Recharge estimation via Water Table Fluctuation (WTF) methodology"
              icon={Calculator}
            />
            <View style={tw`flex-row flex-wrap -mx-1`}>
              <Stat
                style={tw`${wide ? 'w-[31.5%]' : 'w-[48%]'} m-1`}
                label="Pre-Monsoon Level"
                value={fmt(d.pre_monsoon_mbgl, 2)}
                unit="m bgl"
                icon={Sun}
                tint="#f59e0b"
                hint="Apr–May baseline"
              />
              <Stat
                style={tw`${wide ? 'w-[31.5%]' : 'w-[48%]'} m-1`}
                label="Post-Monsoon Level"
                value={fmt(d.post_monsoon_mbgl, 2)}
                unit="m bgl"
                icon={CloudRain}
                tint="#0ea5e9"
                hint="Oct–Nov replenishment"
              />
              <Stat
                style={tw`${wide ? 'w-[31.5%]' : 'w-[48%]'} m-1`}
                label="Seasonal Rise (Δh)"
                value={fmt(d.seasonal_fluctuation_m, 2)}
                unit="m"
                icon={Layers}
                tint="#0891b2"
                hint="Water table fluctuation"
              />
              <Stat
                style={tw`${wide ? 'w-[31.5%]' : 'w-[48%]'} m-1`}
                label="Monsoon Recharge"
                value={fmt(d.recharge_mm, 0)}
                unit="mm"
                icon={Droplet}
                tint="#0284c7"
                hint={`Specific Yield Sy = ${d.specific_yield ?? '0.03'}`}
              />
              <Stat
                style={tw`${wide ? 'w-[31.5%]' : 'w-[48%]'} m-1`}
                label="Peak Shallowest"
                value={fmt(d.min_level_mbgl, 2)}
                unit="m bgl"
                icon={ArrowUpCircle}
                tint="#10b981"
                hint="Historical high"
              />
              <Stat
                style={tw`${wide ? 'w-[31.5%]' : 'w-[48%]'} m-1`}
                label="Peak Deepest"
                value={fmt(d.max_level_mbgl, 2)}
                unit="m bgl"
                icon={ArrowDownCircle}
                tint="#ef4444"
                hint="Historical low"
              />
            </View>

            {/* Sensor Telemetry Diagnostic Health */}
            <SectionTitle
              title="Sensor Telemetry QA &amp; Diagnostics"
              subtitle="Automated fault detection and data reliability index"
              icon={ShieldCheck}
            />
            <Card>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`flex-row items-baseline`}>
                  <Text style={tw`text-3xl font-bold text-slate-900`}>{fmt(d.data_quality, 0)}</Text>
                  <Text style={tw`text-xs font-normal text-slate-400 ml-1.5`}>/100 Health Score</Text>
                </View>
                <View style={tw`flex-1 ml-6`}>
                  <View style={tw`h-2 bg-slate-100 rounded-full overflow-hidden`}>
                    <View
                      style={[
                        tw`h-2 rounded-full`,
                        {
                          width: `${d.data_quality ?? 0}%`,
                          backgroundColor:
                            (d.data_quality ?? 0) >= 80
                              ? '#10b981'
                              : (d.data_quality ?? 0) >= 50
                              ? '#f59e0b'
                              : '#ef4444',
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {d.anomalies?.length ? (
                <View style={tw`mt-2 pt-3 border-t border-slate-100`}>
                  <Text style={tw`text-xs font-medium text-sky-800 mb-1.5`}>Detected Anomalies:</Text>
                  <View style={tw`flex-row flex-wrap`}>
                    {d.anomalies.map((a) => (
                      <AnomalyBadge key={a} anomaly={a} />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={tw`flex-row items-center mt-2 pt-3 border-t border-slate-100`}>
                  <CheckCircle2 size={16} color="#10b981" strokeWidth={2} />
                  <Text style={tw`text-xs font-medium text-slate-700 ml-2`}>
                    Telemetry stream healthy • 0 anomalies detected
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
