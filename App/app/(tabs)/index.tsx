import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWideLayout } from '@/components/AppShell';
import logo from '../../assets/images/logo.png';
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
import ThemeToggle from '@/components/ThemeToggle';
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
import { useTheme } from '@/constants/ThemeContext';
import { Station, Summary, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

interface TrendPoint {
  month: string;
  anomaly_m: number;
  level_mbgl: number;
  stations: number;
}

const StationRow = ({ s, rank }: { s: Station; rank: number }) => {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(tabs)/analytics', params: { code: s.code } })}
      style={[
        tw`flex-row items-center py-2.5 px-3 border-b rounded-xl transition-all`,
        { borderColor: colors.borderColor },
      ]}>
      <View
        style={[
          tw`w-6 h-6 rounded-lg items-center justify-center mr-3 border`,
          rank <= 3
            ? {
                backgroundColor: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: isDark ? 'rgba(248, 113, 113, 0.3)' : 'rgba(239, 68, 68, 0.2)',
              }
            : {
                backgroundColor: colors.bgSubtle,
                borderColor: colors.borderColor,
              },
        ]}>
        <Text
          style={[
            tw`text-xs font-semibold`,
            { color: rank <= 3 ? (isDark ? '#f87171' : '#dc2626') : colors.textMuted },
          ]}>
          #{rank}
        </Text>
      </View>
      <View style={tw`flex-1 pr-3`}>
        <Text style={[tw`text-sm font-semibold`, { color: colors.textPrimary }]} numberOfLines={1}>
          {s.name}
        </Text>
        <Text style={[tw`text-xs mt-0.5 font-normal`, { color: colors.textMuted }]} numberOfLines={1}>
          {s.district}, {s.state} • <Text style={[tw`font-mono text-[10px]`, { color: colors.textMuted }]}>{s.code}</Text>
        </Text>
      </View>
      <View style={tw`items-end mr-2`}>
        <TrendBadge value={s.trend_m_per_year} />
        <Text style={[tw`text-[11px] font-medium mt-0.5`, { color: colors.textMuted }]}>
          {fmt(s.latest_level_mbgl, 2, ' m bgl')}
        </Text>
      </View>
      <ChevronRight size={14} color={colors.textMuted} strokeWidth={2} />
    </Pressable>
  );
};

const defaultSummary: Summary = {
  total: 0,
  avg_trend: null,
  avg_level: null,
  avg_recharge: null,
  avg_fluctuation: null,
  avg_quality: null,
  latest: 'Syncing…',
  by_category: { safe: 0, semi_critical: 0, critical: 0, over_exploited: 0, unknown: 0 },
  declining: 0,
  recovering: 0,
  at_risk: 0,
  flagged_sensors: 0,
  readings: 0,
  states: 0,
  districts: 0,
  stations: 0,
  worst: [],
  best: [],
};

export default function DashboardScreen() {
  const wide = useWideLayout();
  const { colors, isDark } = useTheme();
  // Read here rather than beside chartWidth below: that sits after the early
  // returns, and a hook cannot run conditionally.
  const { width } = useWindowDimensions();
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
          color: (o = 1) => `rgba(47, 128, 255, ${o})`,
          strokeWidth: 2.2,
        },
      ],
    };
  }, [trend.data]);

  if (loading && !data) return <Loading />;
  if (error && !data)
    return (
      <SafeAreaView style={[tw`flex-1 justify-center`, { backgroundColor: colors.bgCanvas }]}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );

  const s = data ?? defaultSummary;
  const netTrend = s.avg_trend ?? 0;
  const rising = netTrend < 0;
  const chartWidth = wide ? Math.min(width - 340, 1140) : Math.max(width - 40, 1);

  const statCardStyle = tw`${wide ? 'w-[23.5%]' : 'w-[48%]'} m-1`;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.bgCanvas }]} edges={wide ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={tw`${wide ? 'px-7 pt-5' : 'px-4 pt-3'} pb-32`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}>
        
        {/* Mobile Header */}
        {!wide && (
          <View style={tw`mb-3 px-1`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={[tw`text-[10px] font-semibold uppercase tracking-widest`, { color: colors.brightBlue }]}>
                COMMAND DECK
              </Text>
              <ThemeToggle compact />
            </View>
            <View style={tw`flex-row items-center justify-between mt-0.5`}>
              <View style={tw`flex-row items-center`}>
                <View
                  style={[
                    tw`w-7 h-7 mr-2 rounded-lg items-center justify-center shadow-sm overflow-hidden border`,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.borderColor,
                    },
                  ]}>
                  <Image source={logo} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
                <Text style={[tw`text-2xl font-bold tracking-tight`, { color: colors.textPrimary }]}>
                  JalDrishti
                </Text>
              </View>
              <PulseBadge label="Live Telemetry" />
            </View>
            <Text style={[tw`text-xs font-normal mt-1`, { color: colors.textMuted }]}>
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
                style={[
                  tw`flex-row items-center border rounded-full px-2.5 py-0.5 mr-2 mb-1 shadow-2xs`,
                  {
                    backgroundColor: colors.bgPanel,
                    borderColor: colors.borderColor,
                  },
                ]}>
                <Icon size={11} color={colors.brightBlue} strokeWidth={2} style={tw`mr-1.5`} />
                <Text style={[tw`text-[10px] font-semibold`, { color: colors.textPrimary }]}>{chip.label}</Text>
              </View>
            );
          })}
        </View>

        {/* 8 Primary KPI Command Cards */}
        <View style={tw`flex-row flex-wrap -mx-1`}>
          <Stat
            style={statCardStyle}
            label="Mean Water Level"
            value={fmt(s.avg_level, 2)}
            unit="m bgl"
            icon={Droplet}
            tint={colors.primaryBlue}
            hint="Depth below ground"
          />
          <Stat
            style={statCardStyle}
            label="National Trend Rate"
            value={Math.abs(netTrend).toFixed(2)}
            unit="m/yr"
            icon={Activity}
            tint={rising ? (isDark ? '#34d399' : '#059669') : (isDark ? '#f87171' : '#dc2626')}
            delta={{ text: rising ? 'recovering' : 'deepening', good: rising }}
            hint="Linear regression fit"
          />
          <Stat
            style={statCardStyle}
            label="Monsoon Recharge"
            value={fmt(s.avg_recharge, 0)}
            unit="mm"
            icon={CloudRain}
            tint={colors.brightBlue}
            hint="WTF Method (GEC-2015)"
          />
          <Stat
            style={statCardStyle}
            label="Seasonal Fluctuation"
            value={fmt(s.avg_fluctuation, 2)}
            unit="m"
            icon={Layers}
            tint={colors.primaryBlue}
            hint="Pre vs Post monsoon"
          />
          <Stat
            style={statCardStyle}
            label="Critical Risk Wells"
            value={String(s.at_risk)}
            unit={`of ${s.total}`}
            icon={AlertTriangle}
            tint={isDark ? '#f87171' : '#dc2626'}
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
            tint={colors.brightBlue}
            hint="Stations losing table"
          />
          <Stat
            style={statCardStyle}
            label="Telemetry Reliability"
            value={fmt(s.avg_quality, 0)}
            unit="/100"
            icon={ShieldCheck}
            tint={colors.primaryBlue}
            hint={`${s.flagged_sensors} sensors flagged`}
          />
          <Stat
            style={statCardStyle}
            label="Telemetry Records"
            value={`${(s.readings / 1000).toFixed(0)}k`}
            unit="obs"
            icon={Server}
            tint={colors.textMuted}
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
              <View style={[tw`flex-row items-center px-4 mt-1.5 pt-2 border-t`, { borderColor: colors.borderColor }]}>
                <Info size={13} color={colors.brightBlue} strokeWidth={2} style={tw`mr-2`} />
                <Text style={[tw`flex-1 text-[10px] leading-4 font-normal`, { color: colors.textMuted }]}>
                  Anomaly is measured in metres relative to station baseline. Upward values reflect water table deepening; downward shifts indicate monsoon replenishment.
                </Text>
              </View>
            </>
          ) : (
            <View style={tw`py-10 items-center`}>
              <Text style={[tw`text-xs font-normal`, { color: colors.textMuted }]}>
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
              <View style={[tw`mt-3 pt-2.5 border-t flex-row items-center justify-between`, { borderColor: colors.borderColor }]}>
                <Text style={[tw`text-xs font-normal`, { color: colors.textMuted }]}>
                  Total Validated Recorders: <Text style={[tw`font-semibold`, { color: colors.textPrimary }]}>{s.total}</Text>
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/map')}>
                  <Text style={[tw`text-xs font-semibold`, { color: colors.brightBlue }]}>View GIS Map →</Text>
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
                  <Text style={[tw`text-xs font-semibold`, { color: colors.brightBlue }]}>All Alerts →</Text>
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
            <View
              style={[
                tw`w-8 h-8 rounded-xl border items-center justify-center mr-3`,
                {
                  backgroundColor: isDark ? 'rgba(47, 128, 255, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                  borderColor: isDark ? 'rgba(47, 128, 255, 0.3)' : 'rgba(37, 99, 235, 0.2)',
                },
              ]}>
              <Wrench size={16} color={colors.brightBlue} strokeWidth={2} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-sm font-semibold`, { color: colors.textPrimary }]}>
                Artificial Recharge Priority Allocation
              </Text>
              <Text style={[tw`text-xs mt-1 leading-5 font-normal`, { color: colors.textMuted }]}>
                <Text style={[tw`font-semibold`, { color: colors.brightBlue }]}>{s.at_risk} monitoring stations</Text> indicate severe groundwater stress (&gt; 0.3 m/yr depletion). Recommend immediate sanction of Check Dams and Percolation Tanks under PMKSY &amp; Jal Jeevan Mission in these identified blocks.
              </Text>
            </View>
          </View>

          <View style={[tw`h-px my-2`, { backgroundColor: colors.borderColor }]} />

          <View style={tw`flex-row items-start mt-2`}>
            <View
              style={[
                tw`w-8 h-8 rounded-xl border items-center justify-center mr-3`,
                {
                  backgroundColor: isDark ? 'rgba(47, 128, 255, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                  borderColor: isDark ? 'rgba(47, 128, 255, 0.3)' : 'rgba(37, 99, 235, 0.2)',
                },
              ]}>
              <Cpu size={16} color={colors.brightBlue} strokeWidth={2} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-sm font-semibold`, { color: colors.textPrimary }]}>
                Automated Sensor Quality Assurance
              </Text>
              <Text style={[tw`text-xs mt-1 leading-5 font-normal`, { color: colors.textMuted }]}>
                <Text style={[tw`font-semibold`, { color: colors.brightBlue }]}>{s.flagged_sensors} sensors</Text> exhibited stuck telemetry (flatline), implausible spikes, or transmission gaps. Automatically isolated from national baseline computations to safeguard policy integrity.
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Footer */}
        <View style={[tw`mt-6 pt-3 border-t items-center`, { borderColor: colors.borderColor }]}>
          <Text style={[tw`text-xs font-semibold`, { color: colors.textMuted }]}>
            JalDrishti • Ministry of Jal Shakti • Central Ground Water Board
          </Text>
          <Text style={[tw`text-[10px] mt-0.5 font-normal`, { color: colors.textMuted }]}>
            Smart India Hackathon 2024 (SIH25068) • National Telemetry Evaluation Engine
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
