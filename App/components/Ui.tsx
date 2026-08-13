import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CATEGORY_META, Category } from '@/constants/api';
import tw from '@/constants/tailwind';

export const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <View style={[tw`bg-white rounded-2xl p-4 border border-slate-200`, style]}>{children}</View>
);

export const SectionTitle = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <View style={tw`flex-row items-center justify-between mt-6 mb-3`}>
    <Text style={tw`text-base font-bold text-slate-900`}>{title}</Text>
    {action}
  </View>
);

export const Stat = ({
  label,
  value,
  unit,
  icon,
  tint = '#0ea5e9',
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: any;
  tint?: string;
  hint?: string;
}) => (
  <Card style={tw`flex-1 min-w-[46%] m-1`}>
    <View style={tw`flex-row items-center mb-2`}>
      <View style={[tw`w-7 h-7 rounded-lg items-center justify-center mr-2`, { backgroundColor: `${tint}1a` }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={tw`text-xs text-slate-500 flex-1`} numberOfLines={2}>
        {label}
      </Text>
    </View>
    <View style={tw`flex-row items-baseline`}>
      <Text style={tw`text-xl font-bold text-slate-900`}>{value}</Text>
      {!!unit && <Text style={tw`text-xs text-slate-500 ml-1`}>{unit}</Text>}
    </View>
    {!!hint && <Text style={tw`text-[11px] text-slate-400 mt-1`}>{hint}</Text>}
  </Card>
);

export const CategoryPill = ({ category, small }: { category: Category; small?: boolean }) => {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.unknown;
  return (
    <View
      style={[
        tw`rounded-full ${small ? 'px-2 py-0.5' : 'px-3 py-1'}`,
        { backgroundColor: `${meta.color}1a` },
      ]}>
      <Text style={[tw`${small ? 'text-[10px]' : 'text-xs'} font-semibold`, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
};

export const TrendBadge = ({ value }: { value: number | null }) => {
  if (value === null || value === undefined)
    return <Text style={tw`text-xs text-slate-400`}>no trend</Text>;
  const declining = value > 0;
  const color = declining ? '#dc2626' : '#16a34a';
  return (
    <View style={tw`flex-row items-center`}>
      <Ionicons name={declining ? 'arrow-down' : 'arrow-up'} size={13} color={color} />
      <Text style={[tw`text-xs font-semibold ml-0.5`, { color }]}>
        {Math.abs(value).toFixed(2)} m/yr {declining ? 'falling' : 'rising'}
      </Text>
    </View>
  );
};

export const Loading = ({ label = 'Loading…' }: { label?: string }) => (
  <View style={tw`flex-1 items-center justify-center py-16`}>
    <ActivityIndicator size="large" color="#0ea5e9" />
    <Text style={tw`mt-3 text-slate-500`}>{label}</Text>
  </View>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <Card style={tw`m-4 items-center`}>
    <Ionicons name="cloud-offline" size={30} color="#dc2626" />
    <Text style={tw`mt-2 text-center text-slate-700 font-semibold`}>Cannot reach the API</Text>
    <Text style={tw`mt-1 text-center text-xs text-slate-500`}>{message}</Text>
    <Text style={tw`mt-2 text-center text-[11px] text-slate-400`}>
      Start it with: python manage.py runserver 0.0.0.0:8000
    </Text>
    {onRetry && (
      <Pressable onPress={onRetry} style={tw`mt-3 bg-sky-600 px-4 py-2 rounded-lg`}>
        <Text style={tw`text-white font-semibold`}>Retry</Text>
      </Pressable>
    )}
  </Card>
);

export const Empty = ({ label }: { label: string }) => (
  <View style={tw`items-center py-10`}>
    <Ionicons name="water-outline" size={28} color="#cbd5e1" />
    <Text style={tw`text-slate-400 mt-2 text-sm`}>{label}</Text>
  </View>
);

/** Horizontal proportional bar, one segment per category. */
export const CategoryBar = ({ counts }: { counts: Record<string, number> }) => {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const order: Category[] = ['safe', 'semi_critical', 'critical', 'over_exploited', 'unknown'];
  return (
    <View>
      <View style={tw`flex-row h-3 rounded-full overflow-hidden bg-slate-100`}>
        {order.map((c) =>
          counts[c] ? (
            <View
              key={c}
              style={[{ flex: counts[c] / total, backgroundColor: CATEGORY_META[c].color }]}
            />
          ) : null
        )}
      </View>
      <View style={tw`flex-row flex-wrap mt-3`}>
        {order.map((c) => (
          <View key={c} style={tw`flex-row items-center mr-4 mb-1`}>
            <View
              style={[tw`w-2.5 h-2.5 rounded-full mr-1.5`, { backgroundColor: CATEGORY_META[c].color }]}
            />
            <Text style={tw`text-xs text-slate-600`}>
              {CATEGORY_META[c].label} {counts[c] ?? 0}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
