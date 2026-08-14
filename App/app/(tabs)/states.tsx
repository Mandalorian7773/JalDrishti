import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWideLayout } from '@/components/AppShell';
import { ArrowDown, ArrowUp, Award, Droplets, Info } from '@/components/Icons';
import {
  Card,
  Empty,
  ErrorState,
  GlassCard,
  Loading,
  PulseBadge,
  SectionTitle,
} from '@/components/Ui';
import { API_BASE, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

interface StateRow {
  state: string;
  stations: number;
  avg_trend: number | null;
  avg_level: number | null;
  avg_recharge: number | null;
  at_risk: number;
}

export default function StatesScreen() {
  const wide = useWideLayout();
  const { data, error, loading, reload } = useApi<StateRow[]>('/states/');
  const rows = (data ?? []).filter((r) => r.stations > 0);
  const worstTrend = Math.max(...rows.map((r) => Math.abs(r.avg_trend ?? 0)), 0.001);

  if (loading && !data) return <Loading label="Evaluating state groundwater benchmarks…" />;
  if (error && !data)
    return (
      <SafeAreaView style={tw`flex-1 bg-slate-50 justify-center`}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50/50`} edges={wide ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={tw`${wide ? 'px-8 pt-6' : 'px-4 pt-4'} pb-32`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}>
        {/* Mobile Header */}
        {!wide && (
          <View style={tw`pt-1 pb-1`}>
            <Text style={tw`text-[10px] font-semibold text-sky-600 uppercase tracking-widest`}>
              VULNERABILITY INDEX
            </Text>
            <View style={tw`flex-row items-center justify-between mt-0.5`}>
              <Text style={tw`text-xl font-bold text-slate-900 tracking-tight`}>
                State Comparison &amp; Benchmarks
              </Text>
              <PulseBadge label={`${rows.length} States`} />
            </View>
            <Text style={tw`text-xs text-slate-500 mt-1 font-normal`}>
              Water-table dynamics &amp; vulnerability ranking across Indian states
            </Text>
          </View>
        )}

        {/* State Rankings List */}
        <SectionTitle
          title={`State Groundwater Vulnerability Index (${rows.length})`}
          subtitle="Ranked from highest rate of depletion to fastest recovering"
          icon={Award}
        />
        <Card style={tw`py-1`}>
          {rows.length ? (
            rows.map((r, i) => {
              const trend = r.avg_trend ?? 0;
              const declining = trend > 0;
              const atRiskPct = Math.round((r.at_risk / Math.max(r.stations, 1)) * 100);

              return (
                <View key={r.state} style={tw`py-3 px-3 border-b border-slate-100`}>
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center flex-1 pr-2`}>
                      <View
                        style={[
                          tw`w-6 h-6 rounded-lg items-center justify-center mr-2.5`,
                          i < 3 ? tw`bg-slate-900` : tw`bg-slate-100`,
                        ]}>
                        <Text
                          style={[
                            tw`text-xs font-semibold`,
                            i < 3 ? tw`text-white` : tw`text-slate-600`,
                          ]}>
                          {i + 1}
                        </Text>
                      </View>
                      <Text style={tw`text-sm font-semibold text-slate-900`}>{r.state}</Text>
                    </View>

                    <View
                      style={[
                        tw`flex-row items-center rounded-lg px-2 py-0.5 border`,
                        declining ? tw`bg-rose-50 border-rose-200/70` : tw`bg-emerald-50 border-emerald-200/70`,
                      ]}>
                      {declining ? (
                        <ArrowDown size={11} color="#dc2626" strokeWidth={2.5} />
                      ) : (
                        <ArrowUp size={11} color="#16a34a" strokeWidth={2.5} />
                      )}
                      <Text
                        style={[
                          tw`text-xs font-semibold ml-1`,
                          declining ? tw`text-rose-700` : tw`text-emerald-700`,
                        ]}>
                        {Math.abs(trend).toFixed(2)} m/yr {declining ? 'fall' : 'rise'}
                      </Text>
                    </View>
                  </View>

                  {/* Relative Progress Bar */}
                  <View style={tw`flex-row items-center mt-2 ml-8.5`}>
                    <View style={tw`flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-3`}>
                      <View
                        style={[
                          tw`h-1.5 rounded-full`,
                          {
                            width: `${Math.min((Math.abs(trend) / worstTrend) * 100, 100)}%`,
                            backgroundColor: declining ? '#ef4444' : '#10b981',
                          },
                        ]}
                      />
                    </View>
                    <Text style={tw`text-[11px] font-medium text-slate-500`}>
                      {r.stations} stations • <Text style={tw`font-semibold ${r.at_risk > 0 ? 'text-sky-700' : 'text-slate-600'}`}>{r.at_risk} at risk ({atRiskPct}%)</Text>
                    </Text>
                  </View>

                  {/* Sub Metrics */}
                  <View style={tw`flex-row items-center mt-1.5 ml-8.5`}>
                    <Text style={tw`text-[10px] text-slate-400 mr-3 font-normal`}>
                      Mean Level: <Text style={tw`text-slate-600 font-medium`}>{fmt(r.avg_level, 2, ' m bgl')}</Text>
                    </Text>
                    <Text style={tw`text-[10px] text-slate-400 font-normal`}>
                      Avg Recharge: <Text style={tw`text-slate-600 font-medium`}>{fmt(r.avg_recharge, 0, ' mm')}</Text>
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Empty label="No state data currently loaded" />
          )}
        </Card>

        {/* Hackathon & Technical Documentation */}
        <SectionTitle
          title="About JalDrishti (SIH25068)"
          subtitle="Ministry of Jal Shakti • Smart India Hackathon 2024"
          icon={Info}
        />
        <GlassCard>
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 items-center justify-center mr-2.5`}>
              <Droplets size={19} color="#38bdf8" strokeWidth={2} />
            </View>
            <View>
              <Text style={tw`text-sm font-semibold text-white`}>
                Automated Groundwater Intelligence Engine
              </Text>
              <Text style={tw`text-xs text-sky-300 font-medium`}>
                Ministry of Jal Shakti • Central Ground Water Board (CGWB)
              </Text>
            </View>
          </View>

          <Text style={tw`text-xs text-slate-300 leading-5 mb-4 font-normal`}>
            JalDrishti continuously assimilates 6-hourly telemetric Digital Water Level Recorder (DWLR) feeds across India, evaluating recharge dynamics via the GEC-2015 Water Table Fluctuation methodology and isolating sensor anomalies to provide decision support for artificial recharge structures.
          </Text>

          {[
            ['Data Pipeline', 'India-WRIS Automated Telemetry Gateway'],
            ['Recharge Estimation', 'Water Table Fluctuation (WTF) • GEC-2015 Standard'],
            ['Predictive Modeling', '90-Day Linear + Monsoon Harmonic Fit'],
            ['Backend API URL', API_BASE],
          ].map(([k, v]) => (
            <View key={k} style={tw`flex-row justify-between py-2 border-t border-slate-800`}>
              <Text style={tw`text-xs text-slate-400 font-normal`}>{k}</Text>
              <Text style={tw`text-xs font-medium text-slate-200 text-right ml-4`}>{v}</Text>
            </View>
          ))}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
