import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWideLayout } from '@/components/AppShell';
import { ArrowDown, ArrowUp, Award, Droplets, Info } from '@/components/Icons';
import ThemeToggle from '@/components/ThemeToggle';
import {
  Card,
  Empty,
  ErrorState,
  GlassCard,
  Loading,
  PulseBadge,
  SectionTitle,
} from '@/components/Ui';
import { useTheme } from '@/constants/ThemeContext';
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
  const { colors, isDark } = useTheme();
  const { data, error, loading, reload } = useApi<StateRow[]>('/states/');
  const rows = (data ?? []).filter((r) => r.stations > 0);
  const worstTrend = Math.max(...rows.map((r) => Math.abs(r.avg_trend ?? 0)), 0.001);

  if (loading && !data) return <Loading />;
  if (error && !data)
    return (
      <SafeAreaView style={[tw`flex-1 justify-center`, { backgroundColor: colors.bgCanvas }]}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.bgCanvas }]} edges={wide ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={tw`${wide ? 'px-8 pt-6' : 'px-4 pt-4'} pb-32`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}>
        {/* Mobile Header */}
        {!wide && (
          <View style={tw`pt-1 pb-1`}>
            <View style={tw`flex-row items-center justify-between`}>
              <Text style={[tw`text-[10px] font-semibold uppercase tracking-widest`, { color: colors.brightBlue }]}>
                VULNERABILITY INDEX
              </Text>
              <ThemeToggle compact />
            </View>
            <View style={tw`flex-row items-center justify-between mt-0.5`}>
              <Text style={[tw`text-xl font-bold tracking-tight`, { color: colors.textPrimary }]}>
                State Comparison &amp; Benchmarks
              </Text>
              <PulseBadge label={`${rows.length} States`} />
            </View>
            <Text style={[tw`text-xs mt-1 font-normal`, { color: colors.textMuted }]}>
              Water-table dynamics &amp; vulnerability ranking across Indian states
            </Text>
          </View>
        )}

        {/* State Rankings List */}
        <SectionTitle
          title={`State Groundwater Vulnerability Index (${rows.length ? rows.length : (loading ? '…' : '0')})`}
          subtitle="Ranked from highest rate of depletion to fastest recovering"
          icon={Award}
        />
        <Card style={tw`py-1`}>
          {loading && !data ? (
            <View style={tw`py-10 items-center justify-center`}>
              <ActivityIndicator size="small" color={colors.brightBlue} style={tw`mb-2`} />
              <Text style={[tw`text-xs font-normal`, { color: colors.textMuted }]}>
                Evaluating state groundwater benchmarks…
              </Text>
            </View>
          ) : rows.length ? (
            rows.map((r, i) => {
              const trend = r.avg_trend ?? 0;
              const declining = trend > 0;
              const atRiskPct = Math.round((r.at_risk / Math.max(r.stations, 1)) * 100);

              return (
                <View key={r.state} style={[tw`py-3 px-3 border-b`, { borderColor: colors.borderColor }]}>
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center flex-1 pr-2`}>
                      <View
                        style={[
                          tw`w-6 h-6 rounded-lg items-center justify-center mr-2.5 border`,
                          i < 3
                            ? {
                                backgroundColor: isDark ? 'rgba(47, 128, 255, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                                borderColor: isDark ? 'rgba(47, 128, 255, 0.4)' : 'rgba(37, 99, 235, 0.25)',
                              }
                            : {
                                backgroundColor: colors.bgSubtle,
                                borderColor: colors.borderColor,
                              },
                        ]}>
                        <Text
                          style={[
                            tw`text-xs font-semibold`,
                            { color: i < 3 ? colors.brightBlue : colors.textMuted },
                          ]}>
                          {i + 1}
                        </Text>
                      </View>
                      <Text style={[tw`text-sm font-semibold`, { color: colors.textPrimary }]}>{r.state}</Text>
                    </View>

                    <View
                      style={[
                        tw`flex-row items-center rounded-lg px-2 py-0.5 border`,
                        declining
                          ? {
                              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                            }
                          : {
                              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                              borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                            },
                      ]}>
                      {declining ? (
                        <ArrowDown size={11} color={isDark ? '#f87171' : '#dc2626'} strokeWidth={2.5} />
                      ) : (
                        <ArrowUp size={11} color={isDark ? '#4ade80' : '#16a34a'} strokeWidth={2.5} />
                      )}
                      <Text
                        style={[
                          tw`text-xs font-semibold ml-1`,
                          { color: declining ? (isDark ? '#f87171' : '#dc2626') : (isDark ? '#4ade80' : '#16a34a') },
                        ]}>
                        {Math.abs(trend).toFixed(2)} m/yr {declining ? 'fall' : 'rise'}
                      </Text>
                    </View>
                  </View>

                  {/* Relative Progress Bar */}
                  <View style={tw`flex-row items-center mt-2 ml-8.5`}>
                    <View
                      style={[
                        tw`flex-1 h-1.5 rounded-full overflow-hidden mr-3 border`,
                        {
                          backgroundColor: colors.bgSubtle,
                          borderColor: colors.borderColor,
                        },
                      ]}>
                      <View
                        style={[
                          tw`h-1.5 rounded-full`,
                          {
                            width: `${Math.min((Math.abs(trend) / worstTrend) * 100, 100)}%`,
                            backgroundColor: declining ? (isDark ? '#f87171' : '#dc2626') : (isDark ? '#34d399' : '#10b981'),
                          },
                        ]}
                      />
                    </View>
                    <Text style={[tw`text-[11px] font-medium`, { color: colors.textMuted }]}>
                      {r.stations} stations • <Text style={[tw`font-semibold`, { color: r.at_risk > 0 ? colors.brightBlue : colors.textMuted }]}>{r.at_risk} at risk ({atRiskPct}%)</Text>
                    </Text>
                  </View>

                  {/* Sub Metrics */}
                  <View style={tw`flex-row items-center mt-1.5 ml-8.5`}>
                    <Text style={[tw`text-[10px] mr-3 font-normal`, { color: colors.textMuted }]}>
                      Mean Level: <Text style={[tw`font-medium`, { color: colors.textPrimary }]}>{fmt(r.avg_level, 2, ' m bgl')}</Text>
                    </Text>
                    <Text style={[tw`text-[10px] font-normal`, { color: colors.textMuted }]}>
                      Avg Recharge: <Text style={[tw`font-medium`, { color: colors.textPrimary }]}>{fmt(r.avg_recharge, 0, ' mm')}</Text>
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
            <View
              style={[
                tw`w-9 h-9 rounded-xl border items-center justify-center mr-2.5`,
                {
                  backgroundColor: isDark ? 'rgba(47, 128, 255, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                  borderColor: isDark ? 'rgba(47, 128, 255, 0.3)' : 'rgba(37, 99, 235, 0.2)',
                },
              ]}>
              <Droplets size={19} color={colors.brightBlue} strokeWidth={2} />
            </View>
            <View>
              <Text style={[tw`text-sm font-semibold`, { color: colors.textPrimary }]}>
                Automated Groundwater Intelligence Engine
              </Text>
              <Text style={[tw`text-xs font-medium`, { color: colors.brightBlue }]}>
                Ministry of Jal Shakti • Central Ground Water Board (CGWB)
              </Text>
            </View>
          </View>

          <Text style={[tw`text-xs leading-5 mb-4 font-normal`, { color: colors.textMuted }]}>
            JalDrishti continuously assimilates 6-hourly telemetric Digital Water Level Recorder (DWLR) feeds across India, evaluating recharge dynamics via the GEC-2015 Water Table Fluctuation methodology and isolating sensor anomalies to provide decision support for artificial recharge structures.
          </Text>

          {[
            ['Data Pipeline', 'India-WRIS Automated Telemetry Gateway'],
            ['Recharge Estimation', 'Water Table Fluctuation (WTF) • GEC-2015 Standard'],
            ['Predictive Modeling', '90-Day Linear + Monsoon Harmonic Fit'],
            ['Backend API URL', API_BASE],
          ].map(([k, v]) => (
            <View key={k} style={[tw`flex-row justify-between py-2 border-t`, { borderColor: colors.borderColor }]}>
              <Text style={[tw`text-xs font-normal`, { color: colors.textMuted }]}>{k}</Text>
              <Text style={[tw`text-xs font-medium text-right ml-4`, { color: colors.textPrimary }]}>{v}</Text>
            </View>
          ))}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
