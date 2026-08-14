import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWideLayout } from '@/components/AppShell';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Building2,
  ChevronRight,
  Clock,
  CloudRain,
  Cpu,
  Droplet,
  Info,
  Layers,
  MapPin,
  PieChart,
  Server,
  ShieldCheck,
  TrendingDown,
  Wrench,
} from '@/components/Icons';
import {
  Card,
  CategoryBar,
  ErrorState,
  GlassCard,
  Loading,
  PulseBadge,
  SectionTitle,
  Stat,
  TrendBadge,
} from '@/components/Ui';
import { Station, Summary, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

interface TrendPoint {
  month: string;
  anomaly_m: number;
  level_mbgl: number;
  stations: number;
}

const StationRow = ({ s, rank }: { s: Station; rank: number }) => (
  <Pressable
    onPress={() => router.push({ pathname: '/(tabs)/analytics', params: { code: s.code } })}
    style={tw`flex-row items-center py-2.5 px-3 border-b border-slate-100 hover:bg-slate-50 rounded-xl transition-all`}>
    <View
      style={[
        tw`w-6 h-6 rounded-lg items-center justify-center mr-3`,
        rank <= 3 ? tw`bg-rose-50 border border-rose-200/70` : tw`bg-slate-100`,
      ]}>
      <Text
        style={[
          tw`text-xs font-semibold`,
          rank <= 3 ? tw`text-rose-700` : tw`text-slate-600`,
        ]}>
        #{rank}
      </Text>
    </View>
    <View style={tw`flex-1 pr-3`}>
      <Text style={tw`text-sm font-semibold text-slate-800`} numberOfLines={1}>
        {s.name}
      </Text>
      <Text style={tw`text-xs text-slate-500 mt-0.5 font-normal`} numberOfLines={1}>
        {s.district}, {s.state} • <Text style={tw`font-mono text-[10px] text-slate-400`}>{s.code}</Text>
      </Text>
    </View>
    <View style={tw`items-end mr-2`}>
      <TrendBadge value={s.trend_m_per_year} />
      <Text style={tw`text-[11px] font-medium text-slate-500 mt-0.5`}>
        {fmt(s.latest_level_mbgl, 2, ' m bgl')}
      </Text>
    </View>
    <ChevronRight size={14} color="#94a3b8" strokeWidth={2} />
  </Pressable>
);

export default function DashboardScreen() {
  const wide = useWideLayout();
  const { data, error, loading, reload } = useApi<Summary>('/summary/');
  const trend = useApi<TrendPoint[]>('/trend/');

  const chart = useMemo(() => {
    const rows = trend.data ?? [];
    if (rows.length < 2) return null;
    const step = Math.max(1, Math.ceil(rows.length / 6));
    return {
      labels: rows.map((r, i) => (i % step === 0 ? r.month.slice(2, 7) : '')),
      datasets: [
        {
          data: rows.map((r) => r.anomaly_m),
          color: (o = 1) => `rgba(2, 132, 199, ${o})`,
          strokeWidth: 2.2,
        },
      ],
    };
  }, [trend.data]);

  if (loading && !data) return <Loading label="Loading national groundwater telemetry…" />;
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
  const chartWidth = wide
    ? Math.min(Dimensions.get('window').width - 340, 1140)
    : Dimensions.get('window').width - 40;

  const statCardStyle = tw`${wide ? 'w-[23.5%]' : 'w-[48%]'} m-1`;

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50/50`} edges={wide ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={tw`${wide ? 'px-7 pt-5' : 'px-4 pt-3'} pb-32`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}>
        
        {/* Mobile Header */}
        {!wide && (
          <View style={tw`mb-3 px-1`}>
            <Text style={tw`text-[10px] font-semibold text-sky-600 uppercase tracking-widest`}>
              COMMAND DECK
            </Text>
            <View style={tw`flex-row items-center justify-between mt-0.5`}>
              <Text style={tw`text-2xl font-bold text-slate-900 tracking-tight`}>
                JalDrishti
              </Text>
              <PulseBadge label="Live Telemetry" />
            </View>
            <Text style={tw`text-xs font-normal text-slate-500 mt-1`}>
              National groundwater telemetry &amp; resource evaluation
            </Text>
          </View>
        )}

        {/* Telemetry Status Bar */}
        <View style={tw`flex-row items-center flex-wrap px-1 mb-2.5`}>
          {[
            { icon: Cpu, label: `${s.stations.toLocaleString()} DWLR Nodes` },
            { icon: Building2, label: `${s.districts} Districts` },
            { icon: MapPin, label: `${s.states} States Covered` },
            { icon: Clock, label: `Updated ${s.latest ?? 'Today'}` },
          ].map((chip) => {
            const Icon = chip.icon;
            return (
              <View
                key={chip.label}
                style={tw`flex-row items-center bg-white border border-slate-200/90 rounded-full px-2.5 py-0.5 mr-2 mb-1 shadow-2xs`}>
                <Icon size={11} color="#0284c7" strokeWidth={2} style={tw`mr-1.5`} />
                <Text style={tw`text-[10px] font-semibold text-slate-700`}>{chip.label}</Text>
              </View>
            );
          })}
        </View>

        {/* 8 Primary KPI Command Cards (Sleek, Compact 4-Across Grid) */}
        <View style={tw`flex-row flex-wrap -mx-1`}>
          <Stat
            style={statCardStyle}
            label="Mean Water Level"
            value={fmt(s.avg_level, 2)}
            unit="m bgl"
            icon={Droplet}
            tint="#0ea5e9"
            hint="Depth below ground"
          />
          <Stat
            style={statCardStyle}
            label="National Trend Rate"
            value={Math.abs(netTrend).toFixed(2)}
            unit="m/yr"
            icon={Activity}
            tint={rising ? '#10b981' : '#ef4444'}
            delta={{ text: rising ? 'recovering' : 'deepening', good: rising }}
            hint="Linear regression fit"
          />
          <Stat
            style={statCardStyle}
            label="Monsoon Recharge"
            value={fmt(s.avg_recharge, 0)}
            unit="mm"
            icon={CloudRain}
            tint="#6366f1"
            hint="WTF Method (GEC-2015)"
          />
          <Stat
            style={statCardStyle}
            label="Seasonal Fluctuation"
            value={fmt(s.avg_fluctuation, 2)}
            unit="m"
            icon={Layers}
            tint="#0284c7"
            hint="Pre vs Post monsoon"
          />
          <Stat
            style={statCardStyle}
            label="Critical Risk Wells"
            value={String(s.at_risk)}
            unit={`of ${s.total}`}
            icon={AlertTriangle}
            tint="#dc2626"
            delta={{
              text: `${((s.at_risk / Math.max(s.total, 1)) * 100).toFixed(0)}% at risk`,
              good: false,
            }}
          />
          <Stat
            style={statCardStyle}
            label="Declining vs Recovering"
            value={`${s.declining}`}
            unit={`/ ${s.recovering} up`}
            icon={TrendingDown}
            tint="#0369a1"
            hint="Stations losing table"
          />
          <Stat
            style={statCardStyle}
            label="Telemetry Reliability"
            value={fmt(s.avg_quality, 0)}
            unit="/100"
            icon={ShieldCheck}
            tint="#8b5cf6"
            hint={`${s.flagged_sensors} sensors flagged`}
          />
          <Stat
            style={statCardStyle}
            label="Telemetry Records"
            value={`${(s.readings / 1000).toFixed(0)}k`}
            unit="obs"
            icon={Server}
            tint="#334155"
            hint="Daily observations"
          />
        </View>

        {/* National Water Table Monthly Anomaly Hydrograph */}
        <SectionTitle
          title="National Water Table Dynamics"
          subtitle="Monthly water table anomaly deviation relative to station baseline"
          icon={Activity}
        />
        <Card style={tw`px-2 pt-4 pb-2.5`}>
          {chart ? (
            <>
              <LineChart
                data={chart as any}
                width={chartWidth}
                height={210}
                chartConfig={{
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (o = 1) => `rgba(2, 132, 199, ${o})`,
                  labelColor: (o = 1) => `rgba(71, 85, 105, ${o})`,
                  propsForDots: { r: '0' },
                  propsForBackgroundLines: { stroke: '#f8fafc', strokeDasharray: '' },
                }}
                bezier
                withDots={false}
                fromZero={false}
                yAxisSuffix="m"
                style={{ marginLeft: -10 }}
              />
              <View style={tw`flex-row items-center px-4 mt-1.5 pt-2 border-t border-slate-100`}>
                <Info size={13} color="#0284c7" strokeWidth={2} style={tw`mr-2`} />
                <Text style={tw`flex-1 text-[10px] text-slate-500 leading-4 font-normal`}>
                  Anomaly is measured in metres relative to station baseline. Upward values reflect water table deepening; downward shifts indicate monsoon replenishment.
                </Text>
              </View>
            </>
          ) : (
            <View style={tw`py-10 items-center`}>
              <Text style={tw`text-slate-400 text-xs font-normal`}>
                {trend.loading ? 'Building national anomaly hydrograph…' : 'No time-series data available'}
              </Text>
            </View>
          )}
        </Card>

        {/* Resource Breakdown & Fastest Depleting Leaderboard */}
        <View style={tw`${wide ? 'flex-row' : ''} -mx-1.5`}>
          {/* Resource Categorization */}
          <View style={tw`${wide ? 'w-1/2' : ''} px-1.5`}>
            <SectionTitle
              title="Aquifer Vulnerability Distribution"
              subtitle="GEC-2015 categorization across reliable telemetry nodes"
              icon={PieChart}
            />
            <Card>
              <CategoryBar counts={s.by_category} />
              <View style={tw`mt-3 pt-2.5 border-t border-slate-100 flex-row items-center justify-between`}>
                <Text style={tw`text-xs text-slate-500 font-normal`}>
                  Total Validated Recorders: <Text style={tw`font-semibold text-slate-900`}>{s.total}</Text>
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/map')}>
                  <Text style={tw`text-xs font-semibold text-sky-600`}>View GIS Map →</Text>
                </Pressable>
              </View>
            </Card>
          </View>

          {/* Fastest Depleting Stations Leaderboard */}
          <View style={tw`${wide ? 'w-1/2' : ''} px-1.5`}>
            <SectionTitle
              title="Fastest Depleting Wells"
              subtitle="High-priority intervention candidates"
              icon={AlertCircle}
              action={
                <Pressable onPress={() => router.push('/(tabs)/alerts')}>
                  <Text style={tw`text-xs text-sky-600 font-semibold`}>All Alerts →</Text>
                </Pressable>
              }
            />
            <Card style={tw`py-1`}>
              {s.worst.slice(0, 5).map((st, i) => (
                <StationRow key={st.code} s={st} rank={i + 1} />
              ))}
            </Card>
          </View>
        </View>

        {/* Policy Decision Support System */}
        <SectionTitle
          title="Policy Decision Support System (SIH25068)"
          subtitle="Data-driven interventions derived from real-time DWLR telemetry"
          icon={Wrench}
        />
        <GlassCard>
          <View style={tw`flex-row items-start mb-3`}>
            <View style={tw`w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 items-center justify-center mr-3`}>
              <Wrench size={16} color="#38bdf8" strokeWidth={2} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-semibold text-white`}>
                Artificial Recharge Priority Allocation
              </Text>
              <Text style={tw`text-xs text-slate-300 mt-1 leading-5 font-normal`}>
                <Text style={tw`font-semibold text-sky-400`}>{s.at_risk} monitoring stations</Text> indicate severe groundwater stress (&gt; 0.3 m/yr depletion). Recommend immediate sanction of Check Dams and Percolation Tanks under PMKSY &amp; Jal Jeevan Mission in these identified blocks.
              </Text>
            </View>
          </View>

          <View style={tw`h-px bg-slate-800 my-2`} />

          <View style={tw`flex-row items-start mt-2`}>
            <View style={tw`w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 items-center justify-center mr-3`}>
              <Cpu size={16} color="#c084fc" strokeWidth={2} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-semibold text-white`}>
                Automated Sensor Quality Assurance
              </Text>
              <Text style={tw`text-xs text-slate-300 mt-1 leading-5 font-normal`}>
                <Text style={tw`font-semibold text-purple-300`}>{s.flagged_sensors} sensors</Text> exhibited stuck telemetry (flatline), implausible spikes, or transmission gaps. Automatically isolated from national baseline computations to safeguard policy integrity.
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Footer */}
        <View style={tw`mt-6 pt-3 border-t border-slate-200 items-center`}>
          <Text style={tw`text-xs font-semibold text-slate-700`}>
            JalDrishti • Ministry of Jal Shakti • Central Ground Water Board
          </Text>
          <Text style={tw`text-[10px] text-slate-400 mt-0.5 font-normal`}>
            Smart India Hackathon 2024 (SIH25068) • National Telemetry Evaluation Engine
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
