import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWideLayout } from '@/components/AppShell';
import { ArrowRight, ChevronDown, Grid, MapPin, Radio, Search, X } from '@/components/Icons';
import StationMap from '@/components/StationMap';
import { Card, CategoryPill, ErrorState, Loading, PulseBadge, TrendBadge } from '@/components/Ui';
import { CATEGORY_META, Category, Station, fmt, useApi } from '@/constants/api';
import tw from '@/constants/tailwind';

const FILTERS: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'All Recorders' },
  { key: 'over_exploited', label: 'Over-Exploited' },
  { key: 'critical', label: 'Critical' },
  { key: 'semi_critical', label: 'Semi-Critical' },
  { key: 'safe', label: 'Safe' },
];

export default function MapScreen() {
  const wide = useWideLayout();
  const [mode, setMode] = useState<'stations' | 'area'>('stations');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [state, setState] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  const { data, error, loading, reload } = useApi<{ count: number; results: Station[] }>(
    '/stations/?limit=6000'
  );

  const all = useMemo(() => data?.results ?? [], [data]);

  const stateCounts = useMemo(() => {
    const map = new Map<string, number>();
    all.forEach((s) => {
      if (s.state) {
        map.set(s.state, (map.get(s.state) ?? 0) + 1);
      }
    });
    return map;
  }, [all]);

  const states = useMemo(() => Array.from(stateCounts.keys()).sort(), [stateCounts]);

  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return states;
    const q = stateSearch.toLowerCase();
    return states.filter((st) => st.toLowerCase().includes(q));
  }, [states, stateSearch]);

  const shown = useMemo(
    () =>
      all.filter(
        (s) => (category === 'all' || s.category === category) && (!state || s.state === state)
      ),
    [all, category, state]
  );

  const selectedStation = useMemo(
    () => (selectedCode ? all.find((s) => s.code === selectedCode) : null),
    [all, selectedCode]
  );

  if (loading && !data) return <Loading label="Rendering spatial DWLR telemetry operations network…" />;
  if (error && !data)
    return (
      <SafeAreaView style={tw`flex-1 bg-slate-50 justify-center`}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );

  const currentFilterMeta = FILTERS.find((f) => f.key === category) ?? FILTERS[0];
  const currentCategoryCount =
    category === 'all'
      ? all.length
      : all.filter((s) => s.category === category).length;
  const currentCategoryColor =
    category === 'all'
      ? '#2563eb'
      : CATEGORY_META[category as Category]?.color ?? '#2563eb';

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50/50`} edges={wide ? [] : ['top']}>
      {/* Mobile Header */}
      {!wide && (
        <View style={tw`px-4 pt-2.5 pb-1`}>
          <Text style={tw`text-[10px] font-semibold text-blue-600 uppercase tracking-widest`}>
            SPATIAL INTELLIGENCE
          </Text>
          <View style={tw`flex-row items-center justify-between mt-0.5`}>
            <Text style={tw`text-lg font-bold text-slate-900 tracking-tight`}>
              Live Operations Map
            </Text>
            <PulseBadge label={`${shown.length} Active`} />
          </View>
        </View>
      )}

      {/* Unified Compact Single Row Toolbar (Strictly 1 Row) */}
      <View style={tw`px-4 py-2 z-30 flex-row items-center border-b border-slate-200/80 bg-white/95`}>
        {/* Left: Mode Switcher */}
        <View style={tw`flex-row items-center bg-slate-100/90 rounded-xl p-0.5 border border-slate-200/80 mr-3 flex-shrink-0`}>
          <Pressable
            onPress={() => setMode('stations')}
            style={[
              tw`flex-row items-center px-3 py-1.5 rounded-lg transition-all`,
              mode === 'stations'
                ? tw`bg-white border border-slate-200 shadow-2xs`
                : tw`bg-transparent`,
            ]}>
            <Radio
              size={12}
              color={mode === 'stations' ? '#2563eb' : '#64748b'}
              strokeWidth={2}
              style={tw`mr-1.5`}
            />
            <Text
              style={[
                tw`text-xs font-semibold`,
                mode === 'stations' ? tw`text-blue-700` : tw`text-slate-600`,
              ]}>
              Station Map
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode('area')}
            style={[
              tw`flex-row items-center px-3 py-1.5 rounded-lg transition-all`,
              mode === 'area'
                ? tw`bg-white border border-slate-200 shadow-2xs`
                : tw`bg-transparent`,
            ]}>
            <Grid
              size={12}
              color={mode === 'area' ? '#2563eb' : '#64748b'}
              strokeWidth={2}
              style={tw`mr-1.5`}
            />
            <Text
              style={[
                tw`text-xs font-semibold`,
                mode === 'area' ? tw`text-blue-700` : tw`text-slate-600`,
              ]}>
              Area Map
            </Text>
          </Pressable>
        </View>

        {/* Center: Category / Vulnerability Dropdown */}
        <View style={tw`relative z-40 mr-3 flex-shrink-0`}>
          <Pressable
            onPress={() => setCategoryDropdownOpen((prev) => !prev)}
            style={[
              tw`flex-row items-center justify-between px-3 py-1.5 bg-white border rounded-xl shadow-2xs min-w-[185px]`,
              category !== 'all' ? tw`border-blue-400 bg-blue-50/50` : tw`border-slate-200`,
            ]}>
            <View style={tw`flex-row items-center flex-1 mr-2`}>
              <View
                style={[
                  tw`w-2 h-2 rounded-full mr-2 flex-shrink-0`,
                  { backgroundColor: currentCategoryColor },
                ]}
              />
              <Text
                style={[
                  tw`text-xs font-semibold`,
                  category !== 'all' ? tw`text-blue-800` : tw`text-slate-700`,
                ]}
                numberOfLines={1}>
                {currentFilterMeta.label} ({currentCategoryCount})
              </Text>
            </View>
            <ChevronDown size={13} color={category !== 'all' ? '#2563eb' : '#94a3b8'} strokeWidth={2} />
          </Pressable>

          {/* Category Dropdown Modal */}
          {categoryDropdownOpen && (
            <Modal
              transparent
              visible={categoryDropdownOpen}
              animationType="fade"
              onRequestClose={() => setCategoryDropdownOpen(false)}>
              <Pressable
                style={tw`flex-1 bg-black/20 justify-center items-center p-4`}
                onPress={() => setCategoryDropdownOpen(false)}>
                <Pressable
                  style={tw`w-full max-w-xs bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden`}
                  onPress={(e) => e.stopPropagation()}>
                  <View style={tw`p-3.5 border-b border-slate-100 flex-row items-center justify-between bg-slate-50`}>
                    <Text style={tw`text-sm font-bold text-slate-900`}>Filter by Health Category</Text>
                    <Pressable
                      onPress={() => setCategoryDropdownOpen(false)}
                      style={tw`p-1 rounded-lg hover:bg-slate-200`}>
                      <X size={16} color="#64748b" strokeWidth={2} />
                    </Pressable>
                  </View>

                  <View style={tw`p-2`}>
                    {FILTERS.map((f) => {
                      const count =
                        f.key === 'all'
                          ? all.length
                          : all.filter((s) => s.category === f.key).length;
                      const isSelected = category === f.key;
                      const dotColor =
                        f.key === 'all' ? '#2563eb' : CATEGORY_META[f.key as Category].color;

                      return (
                        <Pressable
                          key={f.key}
                          onPress={() => {
                            setCategory(f.key);
                            setCategoryDropdownOpen(false);
                          }}
                          style={[
                            tw`flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1`,
                            isSelected
                              ? tw`bg-blue-50 border border-blue-200`
                              : tw`hover:bg-slate-50`,
                          ]}>
                          <View style={tw`flex-row items-center`}>
                            <View
                              style={[
                                tw`w-2.5 h-2.5 rounded-full mr-2.5`,
                                { backgroundColor: dotColor },
                              ]}
                            />
                            <Text
                              style={[
                                tw`text-xs`,
                                isSelected
                                  ? tw`font-semibold text-blue-800`
                                  : tw`font-medium text-slate-700`,
                              ]}>
                              {f.label}
                            </Text>
                          </View>
                          <View
                            style={[
                              tw`rounded-full px-2 py-0.5`,
                              isSelected ? tw`bg-blue-100` : tw`bg-slate-100`,
                            ]}>
                            <Text
                              style={[
                                tw`text-[10px] font-medium`,
                                isSelected ? tw`text-blue-800` : tw`text-slate-500`,
                              ]}>
                              {count}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          )}
        </View>

        {/* Right: State Selector Dropdown Button */}
        <View style={tw`relative z-40 flex-shrink-0`}>
          <Pressable
            onPress={() => setStateDropdownOpen((prev) => !prev)}
            style={[
              tw`flex-row items-center justify-between px-3 py-1.5 bg-white border rounded-xl shadow-2xs min-w-[185px]`,
              state ? tw`border-blue-400 bg-blue-50/50` : tw`border-slate-200`,
            ]}>
            <View style={tw`flex-row items-center flex-1 mr-2`}>
              <MapPin size={13} color={state ? '#2563eb' : '#64748b'} strokeWidth={2} style={tw`mr-1.5`} />
              <Text
                style={[
                  tw`text-xs font-semibold`,
                  state ? tw`text-blue-800` : tw`text-slate-700`,
                ]}
                numberOfLines={1}>
                {state ? state : `All States (${states.length})`}
              </Text>
            </View>
            <ChevronDown size={13} color={state ? '#2563eb' : '#94a3b8'} strokeWidth={2} />
          </Pressable>

          {/* State Dropdown Modal / Popover */}
          {stateDropdownOpen && (
            <Modal
              transparent
              visible={stateDropdownOpen}
              animationType="fade"
              onRequestClose={() => setStateDropdownOpen(false)}>
              <Pressable
                style={tw`flex-1 bg-black/20 justify-center items-center p-4`}
                onPress={() => setStateDropdownOpen(false)}>
                <Pressable
                  style={tw`w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden`}
                  onPress={(e) => e.stopPropagation()}>
                  {/* Dropdown Header */}
                  <View style={tw`p-3.5 border-b border-slate-100 flex-row items-center justify-between bg-slate-50`}>
                    <View style={tw`flex-row items-center`}>
                      <MapPin size={15} color="#2563eb" strokeWidth={2} style={tw`mr-2`} />
                      <Text style={tw`text-sm font-bold text-slate-900`}>Select State / UT</Text>
                    </View>
                    <Pressable
                      onPress={() => setStateDropdownOpen(false)}
                      style={tw`p-1 rounded-lg hover:bg-slate-200`}>
                      <X size={16} color="#64748b" strokeWidth={2} />
                    </Pressable>
                  </View>

                  {/* Search Input */}
                  <View style={tw`p-3 border-b border-slate-100 bg-white`}>
                    <View style={tw`flex-row items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-200`}>
                      <Search size={14} color="#64748b" strokeWidth={2} style={tw`mr-2 flex-shrink-0`} />
                      <TextInput
                        value={stateSearch}
                        onChangeText={setStateSearch}
                        placeholder="Search state name…"
                        placeholderTextColor="#94a3b8"
                        style={[
                          tw`flex-1 text-xs text-slate-800 font-medium bg-transparent border-0`,
                          Platform.OS === 'web'
                            ? ({
                                outlineStyle: 'none',
                                outline: 'none',
                                border: 'none',
                                borderWidth: 0,
                              } as any)
                            : {},
                        ]}
                        autoFocus
                      />
                      {!!stateSearch && (
                        <Pressable onPress={() => setStateSearch('')}>
                          <X size={14} color="#94a3b8" strokeWidth={2} />
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {/* State Options List */}
                  <ScrollView style={tw`max-h-72 p-2`}>
                    {/* All States Option */}
                    <Pressable
                      onPress={() => {
                        setState(null);
                        setStateDropdownOpen(false);
                      }}
                      style={[
                        tw`flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1`,
                        !state ? tw`bg-blue-50 border border-blue-200` : tw`hover:bg-slate-50`,
                      ]}>
                      <Text
                        style={[
                          tw`text-xs font-semibold`,
                          !state ? tw`text-blue-700` : tw`text-slate-700`,
                        ]}>
                        All States &amp; UTs
                      </Text>
                      <View style={tw`bg-slate-100 rounded-full px-2 py-0.5`}>
                        <Text style={tw`text-[10px] font-medium text-slate-600`}>
                          {all.length} stations
                        </Text>
                      </View>
                    </Pressable>

                    {/* Individual States */}
                    {filteredStates.map((st) => {
                      const count = stateCounts.get(st) ?? 0;
                      const isSelected = state === st;
                      return (
                        <Pressable
                          key={st}
                          onPress={() => {
                            setState(st);
                            setStateDropdownOpen(false);
                          }}
                          style={[
                            tw`flex-row items-center justify-between px-3 py-2 rounded-xl mb-1`,
                            isSelected
                              ? tw`bg-blue-50 border border-blue-200`
                              : tw`hover:bg-slate-50`,
                          ]}>
                          <Text
                            style={[
                              tw`text-xs font-medium`,
                              isSelected ? tw`text-blue-700 font-semibold` : tw`text-slate-700`,
                            ]}>
                            {st}
                          </Text>
                          <View
                            style={[
                              tw`rounded-full px-2 py-0.5`,
                              isSelected ? tw`bg-blue-100` : tw`bg-slate-100`,
                            ]}>
                            <Text
                              style={[
                                tw`text-[10px] font-medium`,
                                isSelected ? tw`text-blue-800` : tw`text-slate-500`,
                              ]}>
                              {count}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </Modal>
          )}
        </View>
      </View>

      {/* Expanded Interactive Map Viewport */}
      <View style={tw`flex-1 mx-3.5 my-2 rounded-[20px] overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 relative`}>
        <StationMap
          stations={shown}
          mode={mode}
          style={tw`flex-1`}
          onSelect={(code) => setSelectedCode(code)}
        />
      </View>

      {/* Selected Station Quick Preview Card */}
      {selectedStation && (
        <Card style={tw`mx-3.5 mb-2 p-3 border-blue-300/80 bg-blue-50/50 shadow-sm`}>
          <View style={tw`flex-row items-start justify-between`}>
            <View style={tw`flex-1 pr-2`}>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-sm font-semibold text-slate-900`} numberOfLines={1}>
                  {selectedStation.name}
                </Text>
                <Text style={tw`ml-2 text-[10px] font-mono text-slate-500`}>
                  {selectedStation.code}
                </Text>
              </View>
              <Text style={tw`text-xs text-slate-500 mt-0.5 font-normal`}>
                {selectedStation.district}, {selectedStation.state}
              </Text>
            </View>
            <CategoryPill category={selectedStation.category} small />
          </View>

          <View style={tw`flex-row items-center justify-between mt-2 pt-1.5 border-t border-blue-200/60`}>
            <View style={tw`flex-row items-center flex-wrap`}>
              <TrendBadge value={selectedStation.trend_m_per_year} />
              <Text style={tw`text-xs font-medium text-slate-700 ml-3`}>
                {fmt(selectedStation.latest_level_mbgl, 2, ' m bgl')}
              </Text>
              <Text style={tw`text-xs text-slate-500 ml-3 font-normal`}>
                Recharge: {fmt(selectedStation.recharge_mm, 0, ' mm')}
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/analytics',
                  params: { code: selectedStation.code },
                })
              }
              style={tw`bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg flex-row items-center shadow-2xs`}>
              <Text style={tw`text-white text-xs font-semibold mr-1`}>Analytics</Text>
              <ArrowRight size={12} color="#fff" strokeWidth={2} />
            </Pressable>
          </View>
        </Card>
      )}

      {/* Footer Info */}
      <View style={tw`mx-4 mb-1.5 flex-row items-center justify-between`}>
        <Text style={tw`text-[10px] text-slate-400 font-normal`}>
          Showing {shown.length} DWLR nodes • Click any telemetry marker for instant hydrograph
        </Text>
        <Text style={tw`text-[10px] font-medium text-slate-500`}>
          CGWB India-WRIS Telemetry Engine
        </Text>
      </View>
    </SafeAreaView>
  );
}
