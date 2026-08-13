import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Empty, ErrorState, Loading, SectionTitle } from '@/components/Ui';
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
  const { data, error, loading, reload } = useApi<StateRow[]>('/states/');
  const rows = (data ?? []).filter((r) => r.stations > 0);
  const worstTrend = Math.max(...rows.map((r) => Math.abs(r.avg_trend ?? 0)), 0.001);

  if (loading && !data) return <Loading label="Ranking states…" />;
  if (error && !data)
    return (
      <SafeAreaView style={tw`flex-1 bg-slate-50 justify-center`}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`} edges={['top']}>
      <ScrollView
        contentContainerStyle={tw`px-3 pb-28`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}>
        <View style={tw`pt-4 px-1`}>
          <Text style={tw`text-2xl font-bold text-slate-900`}>State comparison</Text>
          <Text style={tw`text-sm text-slate-500 mt-0.5`}>
            Mean water-table trend across each state&apos;s clean recorders
          </Text>
        </View>

        <SectionTitle title={`${rows.length} states with DWLR coverage`} />
        <Card style={tw`py-0`}>
          {rows.length ? (
            rows.map((r, i) => {
              const trend = r.avg_trend ?? 0;
              const declining = trend > 0;
              return (
                <View key={r.state} style={tw`py-3 border-b border-slate-100`}>
                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`w-6 text-xs text-slate-400 font-semibold`}>{i + 1}</Text>
                    <Text style={tw`flex-1 text-sm font-semibold text-slate-900`}>{r.state}</Text>
                    <Text
                      style={tw`text-xs font-bold ${declining ? 'text-red-600' : 'text-green-600'}`}>
                      {declining ? '↓' : '↑'} {Math.abs(trend).toFixed(2)} m/yr
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center mt-2 ml-6`}>
                    <View style={tw`flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mr-3`}>
                      <View
                        style={[
                          tw`h-1.5 rounded-full`,
                          {
                            width: `${Math.min((Math.abs(trend) / worstTrend) * 100, 100)}%`,
                            backgroundColor: declining ? '#dc2626' : '#16a34a',
                          },
                        ]}
                      />
                    </View>
                    <Text style={tw`text-[10px] text-slate-400`}>
                      {r.stations} clean stn · {r.at_risk} at risk ·{' '}
                      {fmt(r.avg_level, 1, ' m bgl')} ·{' '}
                      {fmt(r.avg_recharge, 0, ' mm')}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Empty label="No state data yet" />
          )}
        </Card>

        <SectionTitle title="About" />
        <Card>
          <Text style={tw`text-sm font-semibold text-slate-900`}>JalDrishti</Text>
          <Text style={tw`text-xs text-slate-600 mt-1 leading-5`}>
            Real-time groundwater resource evaluation from Digital Water Level Recorder telemetry —
            SIH25068, Ministry of Jal Shakti.
          </Text>
          {[
            ['Data source', 'India-WRIS telemetric groundwater levels (CGWB)'],
            ['Recharge method', 'Water Table Fluctuation, GEC-2015'],
            ['Projection', 'Linear trend + annual harmonic, 90 days'],
            ['API', API_BASE],
          ].map(([k, v]) => (
            <View key={k} style={tw`flex-row justify-between mt-3 pt-3 border-t border-slate-100`}>
              <Text style={tw`text-xs text-slate-500`}>{k}</Text>
              <Text style={tw`text-xs text-slate-800 font-medium flex-1 text-right ml-4`}>{v}</Text>
            </View>
          ))}
          <View style={tw`flex-row items-center mt-4`}>
            <Ionicons name="refresh" size={14} color="#0ea5e9" />
            <Text style={tw`text-[11px] text-slate-400 ml-1.5`}>
              Pull down on any screen to refresh from the API
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
