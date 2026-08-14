import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWideLayout } from '@/components/AppShell';
import { ArrowRight, ChevronDown, Grid, MapPin, Radio, Search, X } from '@/components/Icons';
import StationMap from '@/components/StationMap';
import ThemeToggle from '@/components/ThemeToggle';
import { Card, CategoryPill, ErrorState, Loading, PulseBadge, TrendBadge } from '@/components/Ui';
import { useTheme } from '@/constants/ThemeContext';
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
  const { colors, isDark } = useTheme();
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

  if (loading && !data) return <Loading />;
  if (error && !data)
    return (
      <SafeAreaView style={[tw`flex-1 justify-center`, { backgroundColor: colors.bgCanvas }]}>
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
      ? colors.primaryBlue
      : CATEGORY_META[category as Category]?.color ?? colors.primaryBlue;

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: colors.bgCanvas }]} edges={wide ? [] : ['top']}>
      {/* Mobile Header */}
      {!wide && (
        <View style={tw`px-4 pt-2.5 pb-1`}>
          <View style={tw`flex-row items-center justify-between`}>
            <Text style={[tw`text-[10px] font-semibold uppercase tracking-widest`, { color: colors.brightBlue }]}>
              SPATIAL INTELLIGENCE
            </Text>
            <ThemeToggle compact />
          </View>
          <View style={tw`flex-row items-center justify-between mt-0.5`}>
            <Text style={[tw`text-lg font-bold tracking-tight`, { color: colors.textPrimary }]}>
              Live Operations Map
            </Text>
            <PulseBadge label={`${shown.length} Active`} />
          </View>
        </View>
      )}

      {/* Unified Compact Single Row Toolbar */}
      <View
        style={[
          tw`px-4 py-2 z-30 flex-row items-center border-b`,
          {
            backgroundColor: colors.bgPanel,
            borderColor: colors.borderColor,
          },
        ]}>
        {/* Left: Mode Switcher */}
        <View
          style={[
            tw`flex-row items-center rounded-xl p-0.5 border mr-3 flex-shrink-0`,
            {
              backgroundColor: colors.bgSubtle,
              borderColor: colors.borderColor,
            },
          ]}>
          <Pressable
            onPress={() => setMode('stations')}
            style={[
              tw`flex-row items-center px-3 py-1.5 rounded-lg transition-all border`,
              mode === 'stations'
                ? {
                    backgroundColor: colors.bgPanel,
                    borderColor: colors.borderColor,
                  }
                : {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                  },
            ]}>
            <Radio
              size={12}
              color={mode === 'stations' ? colors.brightBlue : colors.textMuted}
              strokeWidth={2}
              style={tw`mr-1.5`}
            />
            <Text
              style={[
                tw`text-xs font-semibold`,
                { color: mode === 'stations' ? colors.brightBlue : colors.textMuted },
              ]}>
              Station Map
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode('area')}
            style={[
              tw`flex-row items-center px-3 py-1.5 rounded-lg transition-all border`,
              mode === 'area'
                ? {
                    backgroundColor: colors.bgPanel,
                    borderColor: colors.borderColor,
                  }
                : {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                  },
            ]}>
            <Grid
              size={12}
              color={mode === 'area' ? colors.brightBlue : colors.textMuted}
              strokeWidth={2}
              style={tw`mr-1.5`}
            />
            <Text
              style={[
                tw`text-xs font-semibold`,
                { color: mode === 'area' ? colors.brightBlue : colors.textMuted },
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
              tw`flex-row items-center justify-between px-3 py-1.5 border rounded-xl shadow-2xs min-w-[185px]`,
              category !== 'all'
                ? {
                    backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                    borderColor: colors.primaryBlue,
                  }
                : {
                    backgroundColor: colors.bgPanel,
                    borderColor: colors.borderColor,
                  },
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
                  { color: category !== 'all' ? colors.brightBlue : colors.textPrimary },
                ]}
                numberOfLines={1}>
                {currentFilterMeta.label} ({currentCategoryCount})
              </Text>
            </View>
            <ChevronDown size={13} color={category !== 'all' ? colors.brightBlue : colors.textMuted} strokeWidth={2} />
          </Pressable>

          {/* Category Dropdown Modal */}
          {categoryDropdownOpen && (
            <Modal
              transparent
              visible={categoryDropdownOpen}
              animationType="fade"
              onRequestClose={() => setCategoryDropdownOpen(false)}>
              <Pressable
                style={tw`flex-1 bg-black/50 justify-center items-center p-4`}
                onPress={() => setCategoryDropdownOpen(false)}>
                <Pressable
                  style={[
                    tw`w-full max-w-xs rounded-2xl border shadow-xl overflow-hidden`,
                    {
                      backgroundColor: colors.bgPanel,
                      borderColor: colors.borderColor,
                    },
                  ]}
                  onPress={(e) => e.stopPropagation()}>
                  <View
                    style={[
                      tw`p-3.5 border-b flex-row items-center justify-between`,
                      {
                        backgroundColor: colors.bgSubtle,
                        borderColor: colors.borderColor,
                      },
                    ]}>
                    <Text style={[tw`text-sm font-bold`, { color: colors.textPrimary }]}>Filter by Health Category</Text>
                    <Pressable
                      onPress={() => setCategoryDropdownOpen(false)}
                      style={tw`p-1 rounded-lg`}>
                      <X size={16} color={colors.textMuted} strokeWidth={2} />
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
                        f.key === 'all' ? colors.primaryBlue : CATEGORY_META[f.key as Category].color;

                      return (
                        <Pressable
                          key={f.key}
                          onPress={() => {
                            setCategory(f.key);
                            setCategoryDropdownOpen(false);
                          }}
                          style={[
                            tw`flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1 border`,
                            isSelected
                              ? {
                                  backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                                  borderColor: isDark ? 'rgba(47, 128, 255, 0.4)' : 'rgba(37, 99, 235, 0.3)',
                                }
                              : {
                                  backgroundColor: 'transparent',
                                  borderColor: 'transparent',
                                },
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
                                {
                                  color: isSelected ? colors.brightBlue : colors.textPrimary,
                                  fontWeight: isSelected ? '600' : '500',
                                },
                              ]}>
                              {f.label}
                            </Text>
                          </View>
                          <View
                            style={[
                              tw`rounded-full px-2 py-0.5 border`,
                              {
                                backgroundColor: isSelected ? (isDark ? 'rgba(47, 128, 255, 0.25)' : 'rgba(37, 99, 235, 0.15)') : colors.bgSubtle,
                                borderColor: colors.borderColor,
                              },
                            ]}>
                            <Text
                              style={[
                                tw`text-[10px] font-medium`,
                                { color: isSelected ? colors.brightBlue : colors.textMuted },
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
              tw`flex-row items-center justify-between px-3 py-1.5 border rounded-xl shadow-2xs min-w-[185px]`,
              state
                ? {
                    backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                    borderColor: colors.primaryBlue,
                  }
                : {
                    backgroundColor: colors.bgPanel,
                    borderColor: colors.borderColor,
                  },
            ]}>
            <View style={tw`flex-row items-center flex-1 mr-2`}>
              <MapPin size={13} color={state ? colors.brightBlue : colors.textMuted} strokeWidth={2} style={tw`mr-1.5`} />
              <Text
                style={[
                  tw`text-xs font-semibold`,
                  { color: state ? colors.brightBlue : colors.textPrimary },
                ]}
                numberOfLines={1}>
                {state ? state : `All States (${states.length})`}
              </Text>
            </View>
            <ChevronDown size={13} color={state ? colors.brightBlue : colors.textMuted} strokeWidth={2} />
          </Pressable>

          {/* State Dropdown Modal / Popover */}
          {stateDropdownOpen && (
            <Modal
              transparent
              visible={stateDropdownOpen}
              animationType="fade"
              onRequestClose={() => setStateDropdownOpen(false)}>
              <Pressable
                style={tw`flex-1 bg-black/50 justify-center items-center p-4`}
                onPress={() => setStateDropdownOpen(false)}>
                <Pressable
                  style={[
                    tw`w-full max-w-sm rounded-2xl border shadow-xl overflow-hidden`,
                    {
                      backgroundColor: colors.bgPanel,
                      borderColor: colors.borderColor,
                    },
                  ]}
                  onPress={(e) => e.stopPropagation()}>
                  {/* Dropdown Header */}
                  <View
                    style={[
                      tw`p-3.5 border-b flex-row items-center justify-between`,
                      {
                        backgroundColor: colors.bgSubtle,
                        borderColor: colors.borderColor,
                      },
                    ]}>
                    <View style={tw`flex-row items-center`}>
                      <MapPin size={15} color={colors.brightBlue} strokeWidth={2} style={tw`mr-2`} />
                      <Text style={[tw`text-sm font-bold`, { color: colors.textPrimary }]}>Select State / UT</Text>
                    </View>
                    <Pressable
                      onPress={() => setStateDropdownOpen(false)}
                      style={tw`p-1 rounded-lg`}>
                      <X size={16} color={colors.textMuted} strokeWidth={2} />
                    </Pressable>
                  </View>

                  {/* Search Input */}
                  <View style={[tw`p-3 border-b`, { backgroundColor: colors.bgPanel, borderColor: colors.borderColor }]}>
                    <View
                      style={[
                        tw`flex-row items-center rounded-xl px-3 py-2 border`,
                        {
                          backgroundColor: colors.bgInput,
                          borderColor: colors.borderColor,
                        },
                      ]}>
                      <Search size={14} color={colors.textMuted} strokeWidth={2} style={tw`mr-2 flex-shrink-0`} />
                      <TextInput
                        value={stateSearch}
                        onChangeText={setStateSearch}
                        placeholder="Search state name…"
                        placeholderTextColor={colors.textMuted}
                        style={[
                          tw`flex-1 text-xs font-medium bg-transparent border-0`,
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
                        autoFocus
                      />
                      {!!stateSearch && (
                        <Pressable onPress={() => setStateSearch('')}>
                          <X size={14} color={colors.textMuted} strokeWidth={2} />
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
                        tw`flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-1 border`,
                        !state
                          ? {
                              backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                              borderColor: isDark ? 'rgba(47, 128, 255, 0.4)' : 'rgba(37, 99, 235, 0.3)',
                            }
                          : {
                              backgroundColor: 'transparent',
                              borderColor: 'transparent',
                            },
                      ]}>
                      <Text
                        style={[
                          tw`text-xs font-semibold`,
                          { color: !state ? colors.brightBlue : colors.textPrimary },
                        ]}>
                        All States &amp; UTs
                      </Text>
                      <View
                        style={[
                          tw`border rounded-full px-2 py-0.5`,
                          {
                            backgroundColor: colors.bgSubtle,
                            borderColor: colors.borderColor,
                          },
                        ]}>
                        <Text style={[tw`text-[10px] font-medium`, { color: colors.textMuted }]}>
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
                            tw`flex-row items-center justify-between px-3 py-2 rounded-xl mb-1 border`,
                            isSelected
                              ? {
                                  backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                                  borderColor: isDark ? 'rgba(47, 128, 255, 0.4)' : 'rgba(37, 99, 235, 0.3)',
                                }
                              : {
                                  backgroundColor: 'transparent',
                                  borderColor: 'transparent',
                                },
                          ]}>
                          <Text
                            style={[
                              tw`text-xs`,
                              {
                                color: isSelected ? colors.brightBlue : colors.textPrimary,
                                fontWeight: isSelected ? '600' : '500',
                              },
                            ]}>
                            {st}
                          </Text>
                          <View
                            style={[
                              tw`rounded-full px-2 py-0.5 border`,
                              {
                                backgroundColor: isSelected ? (isDark ? 'rgba(47, 128, 255, 0.25)' : 'rgba(37, 99, 235, 0.15)') : colors.bgSubtle,
                                borderColor: colors.borderColor,
                              },
                            ]}>
                            <Text
                              style={[
                                tw`text-[10px] font-medium`,
                                { color: isSelected ? colors.brightBlue : colors.textMuted },
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
      <View
        style={[
          tw`flex-1 mx-3.5 my-2 rounded-[20px] overflow-hidden border shadow-sm relative`,
          {
            backgroundColor: colors.bgSubtle,
            borderColor: colors.borderColor,
          },
        ]}>
        <StationMap
          stations={shown}
          mode={mode}
          style={tw`flex-1`}
          onSelect={(code) => setSelectedCode(code)}
        />
      </View>

      {/* Selected Station Quick Preview Card */}
      {selectedStation && (
        <Card
          style={[
            tw`mx-3.5 mb-2 p-3 shadow-sm border`,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.primaryBlue,
            },
          ]}>
          <View style={tw`flex-row items-start justify-between`}>
            <View style={tw`flex-1 pr-2`}>
              <View style={tw`flex-row items-center`}>
                <Text style={[tw`text-sm font-semibold`, { color: colors.textPrimary }]} numberOfLines={1}>
                  {selectedStation.name}
                </Text>
                <Text style={[tw`ml-2 text-[10px] font-mono`, { color: colors.textMuted }]}>
                  {selectedStation.code}
                </Text>
              </View>
              <Text style={[tw`text-xs mt-0.5 font-normal`, { color: colors.textMuted }]}>
                {selectedStation.district}, {selectedStation.state}
              </Text>
            </View>
            <CategoryPill category={selectedStation.category} small />
          </View>

          <View style={[tw`flex-row items-center justify-between mt-2 pt-1.5 border-t`, { borderColor: colors.borderColor }]}>
            <View style={tw`flex-row items-center flex-wrap`}>
              <TrendBadge value={selectedStation.trend_m_per_year} />
              <Text style={[tw`text-xs font-medium ml-3`, { color: colors.textPrimary }]}>
                {fmt(selectedStation.latest_level_mbgl, 2, ' m bgl')}
              </Text>
              <Text style={[tw`text-xs ml-3 font-normal`, { color: colors.textMuted }]}>
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
              style={[
                tw`px-3 py-1 rounded-lg flex-row items-center shadow-2xs`,
                { backgroundColor: colors.primaryBlue },
              ]}>
              <Text style={tw`text-white text-xs font-semibold mr-1`}>Analytics</Text>
              <ArrowRight size={12} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
        </Card>
      )}

      {/* Footer Info */}
      <View style={tw`mx-4 mb-1.5 flex-row items-center justify-between`}>
        <Text style={[tw`text-[10px] font-normal`, { color: colors.textMuted }]}>
          Showing {shown.length} DWLR nodes • Click any telemetry marker for instant hydrograph
        </Text>
        <Text style={[tw`text-[10px] font-medium`, { color: colors.textMuted }]}>
          CGWB India-WRIS Telemetry Engine
        </Text>
      </View>
    </SafeAreaView>
  );
}
