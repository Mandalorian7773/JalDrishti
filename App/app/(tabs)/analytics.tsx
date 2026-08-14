import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
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
import ThemeToggle from '@/components/ThemeToggle';
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
import { useTheme } from '@/constants/ThemeContext';
import { Station, StationDetail, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

function thin<T>(rows: T[], n: number): T[] {
  if (rows.length <= n) return rows;
  const step = (rows.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => rows[Math.round(i * step)]);
}

export default function AnalyticsScreen() {
  const wide = useWideLayout();
  const { colors, isDark } = useTheme();
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
          color: (o = 1) => (isDark ? `rgba(47, 128, 255, ${o})` : `rgba(37, 99, 235, ${o})`),
          strokeWidth: 2.2,
        },
      ],
    };
  }, [detail.data, isDark]);

  const projection = useMemo(() => {
    const fc = detail.data?.forecast ?? [];
    if (!fc.length) return null;
    const at = (days: number) => fc[Math.min(Math.round(days / 7) - 1, fc.length - 1)];
    return { d30: at(30), d90: fc[fc.length - 1] };
  }, [detail.data]);

  if (list.loading && !list.data) return <Loading />;

  const d = detail.data;
  const chartWidth = wide ? Math.min(width - 340, 1140) : Math.max(width - 40, 1);

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.bgCanvas }]} edges={wide ? [] : ['top']}>
      <ScrollView contentContainerStyle={tw`${wide ? 'px-8 pt-6' : 'px-4 pt-4'} pb-32`} keyboardShouldPersistTaps="handled">
        {/* Mobile Header */}
        {!wide && (
          <View style={tw`pt-1 pb-1`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={[tw`text-[10px] font-semibold uppercase tracking-widest`, { color: colors.brightBlue }]}>
                DEEP METRICS
              </Text>
              <ThemeToggle compact />
            </View>
            <View style={tw`flex-row items-center justify-between mt-0.5`}>
              <Text style={[tw`text-xl font-bold tracking-tight`, { color: colors.textPrimary }]}>
                Station Analytics &amp; Forecasting
              </Text>
              <PulseBadge label="DWLR Online" />
            </View>
            <Text style={[tw`text-xs mt-1 font-normal`, { color: colors.textMuted }]}>
              Hydrograph, GEC-2015 recharge &amp; predictive projection
            </Text>
          </View>
        )}

        {/* Station Search Input */}
        <View
          style={[
            tw`flex-row items-center rounded-xl px-3.5 mt-2 border shadow-2xs`,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.borderColor,
            },
          ]}>
          <Search size={16} color={colors.brightBlue} strokeWidth={2} style={tw`flex-shrink-0`} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search station name, code, district, or state…"
            placeholderTextColor={colors.textMuted}
            style={[
              tw`flex-1 py-3 px-2.5 text-xs font-medium bg-transparent border-0`,
              { color: colors.textPrimary },
              Platform.OS === 'web'
                ? ({
                    outlineStyle: 'none',
                    outline: 'none',
                    border: 'none',
                    borderWidth: 0,
                  } as any)
                : {},
            ]}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')}>
              <X size={16} color={colors.textMuted} strokeWidth={2} />
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
                    ? {
                        backgroundColor: colors.primaryBlue,
                        borderColor: colors.brightBlue,
                      }
                    : {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.borderColor,
                      },
                ]}>
                <Text
                  style={[
                    tw`text-xs font-semibold`,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                  ]}
                  numberOfLines={1}>
                  {s.name}
                </Text>
                <Text
                  style={[
                    tw`text-[10px] mt-0.5 font-normal`,
                    { color: isSelected ? 'rgba(255, 255, 255, 0.8)' : colors.textMuted },
                  ]}
                  numberOfLines={1}>
                  {s.district}, {s.state}
                </Text>
              </Pressable>
            );
          })}
          {list.loading && <Text style={[tw`text-xs px-3 py-3 font-normal`, { color: colors.textMuted }]}>Searching stations…</Text>}
        </ScrollView>

        {detail.error && <ErrorState message={detail.error} onRetry={detail.reload} />}
        {detail.loading && !d && (
          <Card style={tw`mt-4 py-12 items-center justify-center`}>
            <ActivityIndicator size="small" color={colors.brightBlue} style={tw`mb-2`} />
            <Text style={[tw`text-xs font-normal`, { color: colors.textMuted }]}>
              Loading station hydrograph &amp; telemetry series…
            </Text>
          </Card>
        )}

        {d && (
          <>
            {/* Station Overview Profile Card */}
            <Card style={tw`mt-4 p-5`}>
              <View style={tw`flex-row items-start justify-between`}>
                <View style={tw`flex-1 pr-3`}>
                  <View style={tw`flex-row items-center flex-wrap`}>
                    <Text style={[tw`text-lg font-bold tracking-tight`, { color: colors.textPrimary }]}>{d.name}</Text>
                    <View
                      style={[
                        tw`ml-2 border rounded px-2 py-0.5`,
                        {
                          backgroundColor: colors.bgSubtle,
                          borderColor: colors.borderColor,
                        },
                      ]}>
                      <Text style={[tw`text-[10px] font-mono font-medium`, { color: colors.textMuted }]}>{d.code}</Text>
                    </View>
                  </View>
                  <Text style={[tw`text-xs font-normal mt-1`, { color: colors.textMuted }]}>
                    {d.district}, {d.state} • Tehsil: {d.tehsil || '—'} • Block: {d.block || '—'}
                  </Text>
                  <View style={tw`flex-row items-center flex-wrap mt-2.5`}>
                    <View
                      style={[
                        tw`border rounded-md px-2 py-0.5 mr-2 mb-1`,
                        {
                          backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                          borderColor: colors.borderColor,
                        },
                      ]}>
                      <Text style={[tw`text-[10px] font-medium`, { color: colors.brightBlue }]}>
                        {d.well_type || 'Borewell'} ({fmt(d.well_depth_m, 0, ' m depth')})
                      </Text>
                    </View>
                    <View
                      style={[
                        tw`border rounded-md px-2 py-0.5 mr-2 mb-1`,
                        {
                          backgroundColor: colors.bgSubtle,
                          borderColor: colors.borderColor,
                        },
                      ]}>
                      <Text style={[tw`text-[10px] font-medium`, { color: colors.textMuted }]}>
                        Aquifer: {d.aquifer_type || 'Alluvial'}
                      </Text>
                    </View>
                    <View
                      style={[
                        tw`border rounded-md px-2 py-0.5 mr-2 mb-1`,
                        {
                          backgroundColor: colors.bgSubtle,
                          borderColor: colors.borderColor,
                        },
                      ]}>
                      <Text style={[tw`text-[10px] font-medium`, { color: colors.textMuted }]}>
                        Agency: {d.agency || 'CGWB'}
                      </Text>
                    </View>
                  </View>
                </View>
                <CategoryPill category={d.category} />
              </View>

              <View style={[tw`flex-row items-center justify-between mt-4 pt-3 border-t`, { borderColor: colors.borderColor }]}>
                <TrendBadge value={d.trend_m_per_year} />
                <Text style={[tw`text-xs font-normal`, { color: colors.textMuted }]}>
                  Last Observation: <Text style={[tw`font-semibold`, { color: colors.textPrimary }]}>{d.latest_date || '—'}</Text>
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
                    chartConfig={{
                      backgroundGradientFrom: colors.chartBg,
                      backgroundGradientTo: colors.chartBg,
                      decimalPlaces: 1,
                      color: (o = 1) => (isDark ? `rgba(47, 128, 255, ${o})` : `rgba(37, 99, 235, ${o})`),
                      labelColor: (o = 1) => (isDark ? `rgba(120, 144, 170, ${o})` : `rgba(100, 116, 139, ${o})`),
                      propsForDots: { r: '0' },
                      propsForBackgroundLines: { stroke: colors.chartGrid, strokeDasharray: '' },
                    }}
                    bezier
                    withDots={false}
                    fromZero={false}
                    yAxisSuffix="m"
                    style={{ marginLeft: -10 }}
                  />
                  <Text style={[tw`text-[11px] px-4 mt-1 font-normal`, { color: colors.textMuted }]}>
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
                    <Sparkles size={16} color={colors.brightBlue} strokeWidth={2} style={tw`mr-2`} />
                    <Text style={[tw`text-sm font-semibold`, { color: colors.textPrimary }]}>
                      90-Day Predictive Groundwater Model
                    </Text>
                  </View>
                  <View
                    style={[
                      tw`border rounded-full px-2.5 py-0.5`,
                      {
                        backgroundColor: isDark ? 'rgba(47, 128, 255, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                        borderColor: isDark ? 'rgba(47, 128, 255, 0.3)' : 'rgba(37, 99, 235, 0.2)',
                      },
                    ]}>
                    <Text style={[tw`text-[10px] font-medium`, { color: colors.brightBlue }]}>Harmonic Forecast</Text>
                  </View>
                </View>

                <View
                  style={[
                    tw`flex-row justify-between rounded-xl p-3.5 border`,
                    {
                      backgroundColor: colors.bgSubtle,
                      borderColor: colors.borderColor,
                    },
                  ]}>
                  {[
                    ['Current Level', d.latest_level_mbgl, 'Observed now'],
                    ['In 30 Days', projection.d30?.level_mbgl, 'Linear projection'],
                    ['In 90 Days', projection.d90?.level_mbgl, 'Monsoon harmonic fit'],
                  ].map(([label, value, hint], i) => {
                    const delta = (Number(value) || 0) - (d.latest_level_mbgl ?? 0);
                    return (
                      <View
                        key={String(label)}
                        style={[
                          tw`flex-1`,
                          i > 0
                            ? [tw`border-l pl-3`, { borderColor: colors.borderColor }]
                            : {},
                        ]}>
                        <Text style={[tw`text-[10px] font-medium uppercase tracking-wider`, { color: colors.textMuted }]}>{label}</Text>
                        <Text style={[tw`text-lg font-bold mt-1`, { color: colors.textPrimary }]}>
                          {fmt(value as number, 2)}
                          <Text style={[tw`text-xs font-normal`, { color: colors.textMuted }]}> m</Text>
                        </Text>
                        <Text style={[tw`text-[10px] font-normal mt-0.5`, { color: colors.textMuted }]}>
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
                tint={colors.primaryBlue}
                hint="Oct–Nov replenishment"
              />
              <Stat
                style={tw`${wide ? 'w-[31.5%]' : 'w-[48%]'} m-1`}
                label="Seasonal Rise (Δh)"
                value={fmt(d.seasonal_fluctuation_m, 2)}
                unit="m"
                icon={Layers}
                tint={colors.brightBlue}
                hint="Water table fluctuation"
              />
              <Stat
                style={tw`${wide ? 'w-[31.5%]' : 'w-[48%]'} m-1`}
                label="Monsoon Recharge"
                value={fmt(d.recharge_mm, 0)}
                unit="mm"
                icon={Droplet}
                tint={colors.primaryBlue}
                hint={`Specific Yield Sy = ${d.specific_yield ?? '0.03'}`}
              />
              <Stat
                style={tw`${wide ? 'w-[31.5%]' : 'w-[48%]'} m-1`}
                label="Peak Shallowest"
                value={fmt(d.min_level_mbgl, 2)}
                unit="m bgl"
                icon={ArrowUpCircle}
                tint={isDark ? '#34d399' : '#059669'}
                hint="Historical high"
              />
              <Stat
                style={tw`${wide ? 'w-[31.5%]' : 'w-[48%]'} m-1`}
                label="Peak Deepest"
                value={fmt(d.max_level_mbgl, 2)}
                unit="m bgl"
                icon={ArrowDownCircle}
                tint={isDark ? '#f87171' : '#dc2626'}
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
                  <Text style={[tw`text-3xl font-bold`, { color: colors.textPrimary }]}>{fmt(d.data_quality, 0)}</Text>
                  <Text style={[tw`text-xs font-normal ml-1.5`, { color: colors.textMuted }]}>/100 Health Score</Text>
                </View>
                <View style={tw`flex-1 ml-6`}>
                  <View
                    style={[
                      tw`h-2 rounded-full overflow-hidden border`,
                      {
                        backgroundColor: colors.bgSubtle,
                        borderColor: colors.borderColor,
                      },
                    ]}>
                    <View
                      style={[
                        tw`h-2 rounded-full`,
                        {
                          width: `${d.data_quality ?? 0}%`,
                          backgroundColor:
                            (d.data_quality ?? 0) >= 80
                              ? (isDark ? '#34d399' : '#10b981')
                              : (d.data_quality ?? 0) >= 50
                              ? '#f59e0b'
                              : (isDark ? '#f87171' : '#ef4444'),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {d.anomalies?.length ? (
                <View style={[tw`mt-2 pt-3 border-t`, { borderColor: colors.borderColor }]}>
                  <Text style={[tw`text-xs font-medium mb-1.5`, { color: colors.brightBlue }]}>Detected Anomalies:</Text>
                  <View style={tw`flex-row flex-wrap`}>
                    {d.anomalies.map((a) => (
                      <AnomalyBadge key={a} anomaly={a} />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={[tw`flex-row items-center mt-2 pt-3 border-t`, { borderColor: colors.borderColor }]}>
                  <CheckCircle2 size={16} color={isDark ? '#34d399' : '#10b981'} strokeWidth={2} />
                  <Text style={[tw`text-xs font-medium ml-2`, { color: colors.textMuted }]}>
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
