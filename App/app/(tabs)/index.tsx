import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWideLayout } from '@/components/AppShell';
import { Card, CategoryBar, ErrorState, Loading, SectionTitle, TrendBadge } from '@/components/Ui';
import { Station, Summary, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

interface TrendPoint {
  month: string;
  anomaly_m: number;
  level_mbgl: number;
  stations: number;
}

const Kpi = ({
  label,
  value,
  unit,
  icon,
  tint,
  delta,
  hint,
  wide,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: any;
  tint: string;
  delta?: { text: string; good: boolean };
  hint?: string;
  wide: boolean;
}) => (
  <View style={tw`${wide ? 'w-1/4' : 'w-1/2'} p-1.5`}>
    <Card style={tw`h-full`}>
      <View style={tw`flex-row items-start justify-between mb-3`}>
        <Text style={tw`text-xs text-slate-500 flex-1 pr-2`} numberOfLines={2}>
          {label}
        </Text>
        <View
          style={[tw`w-8 h-8 rounded-lg items-center justify-center`, { backgroundColor: `${tint}1a` }]}>
          <Ionicons name={icon} size={16} color={tint} />
        </View>
      </View>
      <View style={tw`flex-row items-baseline`}>
        <Text style={tw`text-2xl font-bold text-slate-900`}>{value}</Text>
        {!!unit && <Text style={tw`text-xs text-slate-400 ml-1`}>{unit}</Text>}
      </View>
      <View style={tw`flex-row items-center mt-2`}>
        {delta && (
          <View
            style={tw`flex-row items-center rounded-full px-2 py-0.5 mr-2 ${
              delta.good ? 'bg-emerald-50' : 'bg-red-50'
            }`}>
            <Ionicons
              name={delta.good ? 'trending-up' : 'trending-down'}
              size={11}
              color={delta.good ? '#059669' : '#dc2626'}
            />
            <Text
              style={tw`text-[10px] font-semibold ml-1 ${
                delta.good ? 'text-emerald-700' : 'text-red-700'
              }`}>
              {delta.text}
            </Text>
          </View>
        )}
        {!!hint && (
          <Text style={tw`text-[10px] text-slate-400 flex-1`} numberOfLines={1}>
            {hint}
          </Text>
        )}
      </View>
    </Card>
  </View>
);

const StationRow = ({ s, rank }: { s: Station; rank: number }) => (
  <Pressable
    onPress={() => router.push({ pathname: '/(tabs)/analytics', params: { code: s.code } })}
    style={tw`flex-row items-center py-3 border-b border-slate-100`}>
    <View style={tw`w-6 h-6 rounded-md bg-slate-100 items-center justify-center mr-3`}>
      <Text style={tw`text-[10px] text-slate-500 font-bold`}>{rank}</Text>
    </View>
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
  const wide = useWideLayout();
  const { data, error, loading, reload } = useApi<Summary>('/summary/');
  const trend = useApi<TrendPoint[]>('/trend/');

  const chart = useMemo(() => {
    const rows = trend.data ?? [];
    if (rows.length < 2) return null;
    const step = Math.ceil(rows.length / 6);
    return {
      labels: rows.map((r, i) => (i % step === 0 ? r.month.slice(2, 7) : '')),
      datasets: [
        {
          data: rows.map((r) => r.anomaly_m),
          color: (o = 1) => `rgba(14,165,233,${o})`,
          strokeWidth: 2.5,
        },
      ],
    };
  }, [trend.data]);

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
  const rising = netTrend < 0;
  const chartWidth = wide ? Math.min(Dimensions.get('window').width - 340, 1100) : Dimensions.get('window').width - 40;

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`} edges={wide ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={tw`${wide ? 'px-6 pt-5' : 'px-3 pt-4'} pb-28`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}>
        {!wide && (
          <View style={tw`pb-2 px-1`}>
            <Text style={tw`text-2xl font-bold text-slate-900`}>JalDrishti</Text>
            <Text style={tw`text-sm text-slate-500 mt-0.5`}>
              Real-time groundwater evaluation from CGWB DWLR telemetry
            </Text>
          </View>
        )}

        <View style={tw`flex-row items-center flex-wrap px-1 mb-2`}>
          {[
            `${s.stations.toLocaleString()} recorders`,
            `${s.districts} districts`,
            `${s.states} states`,
            `updated ${s.latest ?? '—'}`,
          ].map((chip) => (
            <View key={chip} style={tw`bg-white border border-slate-200 rounded-full px-2.5 py-1 mr-2 mb-1`}>
              <Text style={tw`text-[10px] text-slate-500`}>{chip}</Text>
            </View>
          ))}
        </View>

        <View style={tw`flex-row flex-wrap -mx-1.5`}>
          <Kpi
            wide={wide}
            label="Mean water level"
            value={fmt(s.avg_level, 2)}
            unit="m bgl"
            icon="water"
            tint="#0ea5e9"
            hint="depth below ground"
          />
          <Kpi
            wide={wide}
            label="National trend"
            value={Math.abs(netTrend).toFixed(2)}
            unit="m/yr"
            icon="pulse"
            tint={rising ? '#16a34a' : '#dc2626'}
            delta={{ text: rising ? 'recovering' : 'deepening', good: rising }}
          />
          <Kpi
            wide={wide}
            label="Monsoon recharge"
            value={fmt(s.avg_recharge, 0)}
            unit="mm"
            icon="rainy"
            tint="#6366f1"
            hint="WTF method, GEC-2015"
          />
          <Kpi
            wide={wide}
            label="Seasonal fluctuation"
            value={fmt(s.avg_fluctuation, 2)}
            unit="m"
            icon="swap-vertical"
            tint="#0891b2"
            hint="pre vs post monsoon"
          />
          <Kpi
            wide={wide}
            label="Recorders at risk"
            value={String(s.at_risk)}
            unit={`of ${s.total}`}
            icon="warning"
            tint="#f97316"
            delta={{ text: `${((s.at_risk / Math.max(s.total, 1)) * 100).toFixed(0)}%`, good: false }}
          />
          <Kpi
            wide={wide}
            label="Declining"
            value={String(s.declining)}
            unit="stations"
            icon="arrow-down"
            tint="#dc2626"
            hint={`vs ${s.recovering} recovering`}
          />
          <Kpi
            wide={wide}
            label="Data quality"
            value={fmt(s.avg_quality, 0)}
            unit="/100"
            icon="hardware-chip"
            tint="#8b5cf6"
            hint={`${s.flagged_sensors} excluded`}
          />
          <Kpi
            wide={wide}
            label="Observations"
            value={`${(s.readings / 1000000).toFixed(2)}M`}
            unit="daily"
            icon="server"
            tint="#334155"
            hint="since Jan 2024"
          />
        </View>

        <SectionTitle title="National water table, monthly anomaly" />
        <Card style={tw`px-0 pt-4 pb-2`}>
          {chart ? (
            <>
              <LineChart
                data={chart as any}
                width={chartWidth}
                height={230}
                chartConfig={{
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (o = 1) => `rgba(14,165,233,${o})`,
                  labelColor: (o = 1) => `rgba(100,116,139,${o})`,
                  propsForDots: { r: '0' },
                  propsForBackgroundLines: { stroke: '#f1f5f9' },
                }}
                bezier
                withDots={false}
                fromZero={false}
                yAxisSuffix="m"
                style={{ marginLeft: -10 }}
              />
              <Text style={tw`text-[11px] text-slate-400 px-5`}>
                Metres relative to each recorder&apos;s own average, so the curve is unaffected by
                which stations reported that month. Above zero the table sits deeper than normal;
                the annual sawtooth is the monsoon refilling it each autumn.
              </Text>
            </>
          ) : (
            <View style={tw`py-10 items-center`}>
              <Text style={tw`text-slate-400 text-sm`}>
                {trend.loading ? 'Building national series…' : 'No series available'}
              </Text>
            </View>
          )}
        </Card>

        <View style={tw`${wide ? 'flex-row' : ''} -mx-1.5`}>
          <View style={tw`${wide ? 'w-1/2' : ''} px-1.5`}>
            <SectionTitle title="Resource categorisation" />
            <Card>
              <CategoryBar counts={s.by_category} />
              <Text style={tw`text-[11px] text-slate-400 mt-3 leading-4`}>
                {s.total.toLocaleString()} recorders with trustworthy telemetry, categorised by
                rate of water-table decline. The {s.flagged_sensors} flagged recorders are excluded
                from every figure here.
              </Text>
            </Card>
          </View>

          <View style={tw`${wide ? 'w-1/2' : ''} px-1.5`}>
            <SectionTitle
              title="Fastest depleting"
              action={
                <Pressable onPress={() => router.push('/(tabs)/alerts')}>
                  <Text style={tw`text-xs text-sky-600 font-semibold`}>All alerts</Text>
                </Pressable>
              }
            />
            <Card style={tw`py-0`}>
              {s.worst.slice(0, 5).map((st, i) => (
                <StationRow key={st.code} s={st} rank={i + 1} />
              ))}
            </Card>
          </View>
        </View>

        <SectionTitle title="What this means" />
        <Card>
          <View style={tw`flex-row`}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
            <Text style={tw`flex-1 ml-2 text-sm text-slate-700 leading-5`}>
              {s.at_risk} recorders show sustained depletion beyond 0.3 m/yr — prioritise those
              blocks for artificial recharge and abstraction limits.
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

        <Text style={tw`text-[10px] text-slate-400 text-center mt-6`}>
          Source: India-WRIS telemetric groundwater level data, Central Ground Water Board
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
