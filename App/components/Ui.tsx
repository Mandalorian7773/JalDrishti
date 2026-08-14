import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  WifiOff,
} from '@/components/Icons';
import { ANOMALY_LABEL, CATEGORY_META, Category } from '@/constants/api';
import tw from '@/constants/tailwind';

export const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => (
  <View
    style={[
      tw`bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs`,
      {
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)',
      },
      style,
    ]}>
    {children}
  </View>
);

export const GlassCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => (
  <View
    style={[
      tw`bg-slate-900 rounded-2xl p-4.5 border border-slate-800 shadow-md`,
      style,
    ]}>
    {children}
  </View>
);

export const SectionTitle = ({
  title,
  subtitle,
  action,
  icon: IconComponent,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: any;
}) => (
  <View style={tw`flex-row items-center justify-between mt-5 mb-2.5`}>
    <View style={tw`flex-1 mr-2`}>
      <View style={tw`flex-row items-center`}>
        {IconComponent && (
          <View style={tw`w-5.5 h-5.5 rounded-lg bg-blue-600/10 items-center justify-center mr-2 border border-blue-600/20`}>
            {typeof IconComponent === 'function' ? (
              <IconComponent size={12} color="#2563eb" strokeWidth={2} />
            ) : (
              <Activity size={12} color="#2563eb" strokeWidth={2} />
            )}
          </View>
        )}
        <Text style={tw`text-sm font-semibold text-slate-900 tracking-tight`}>{title}</Text>
      </View>
      {subtitle && (
        <Text style={tw`text-[11px] text-slate-500 mt-0.5 font-normal`}>{subtitle}</Text>
      )}
    </View>
    {action}
  </View>
);

export const PulseBadge = ({
  label = 'Live Telemetry',
  active = true,
}: {
  label?: string;
  active?: boolean;
}) => (
  <View
    style={tw`flex-row items-center bg-white border border-slate-200/90 rounded-full px-2.5 py-0.5 shadow-2xs`}>
    <View
      style={[
        tw`w-1.5 h-1.5 rounded-full mr-1.5`,
        { backgroundColor: active ? '#2563eb' : '#94a3b8' },
      ]}
    />
    <Text style={tw`text-[10px] font-medium text-slate-700 tracking-wide`}>{label}</Text>
  </View>
);

export const BlueBadge = ({ label }: { label: string }) => (
  <View style={tw`bg-blue-50 border border-blue-200/80 rounded-full px-2.5 py-0.5`}>
    <Text style={tw`text-[9px] font-semibold text-blue-700 uppercase tracking-wider`}>
      {label}
    </Text>
  </View>
);

export const Stat = ({
  label,
  value,
  unit,
  icon: IconComponent,
  tint = '#2563eb',
  hint,
  delta,
  style,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: any;
  tint?: string;
  hint?: string;
  delta?: { text: string; good: boolean };
  style?: any;
}) => (
  <View
    style={[
      tw`bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs`,
      {
        boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.03)',
      },
      style,
    ]}>
    <View style={tw`flex-row items-center justify-between mb-1.5`}>
      <Text style={tw`text-[11px] font-medium text-slate-500 flex-1 pr-1`} numberOfLines={1}>
        {label}
      </Text>
      <View
        style={[
          tw`w-6 h-6 rounded-lg items-center justify-center border`,
          {
            backgroundColor: `${tint}12`,
            borderColor: `${tint}25`,
          },
        ]}>
        {typeof IconComponent === 'function' ? (
          <IconComponent size={12} color={tint} strokeWidth={2} />
        ) : (
          <Activity size={12} color={tint} strokeWidth={2} />
        )}
      </View>
    </View>
    <View style={tw`flex-row items-baseline`}>
      <Text style={tw`text-lg font-bold text-slate-900 tracking-tight`}>{value}</Text>
      {!!unit && <Text style={tw`text-[11px] font-medium text-slate-500 ml-1`}>{unit}</Text>}
    </View>
    <View style={tw`flex-row items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100`}>
      {delta ? (
        <View
          style={[
            tw`flex-row items-center rounded px-1.5 py-0.5`,
            delta.good ? tw`bg-emerald-50 border border-emerald-200/60` : tw`bg-rose-50 border border-rose-200/60`,
          ]}>
          {delta.good ? (
            <TrendingUp size={10} color="#059669" strokeWidth={2.5} />
          ) : (
            <TrendingDown size={10} color="#e11d48" strokeWidth={2.5} />
          )}
          <Text
            style={[
              tw`text-[9px] font-semibold ml-1`,
              delta.good ? tw`text-emerald-700` : tw`text-rose-700`,
            ]}>
            {delta.text}
          </Text>
        </View>
      ) : null}
      {!!hint && (
        <Text style={tw`text-[9px] text-slate-400 font-normal flex-1 ${delta ? 'ml-1.5 text-right' : ''}`} numberOfLines={1}>
          {hint}
        </Text>
      )}
    </View>
  </View>
);

export const CategoryPill = ({
  category,
  small,
}: {
  category: Category;
  small?: boolean;
}) => {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.unknown;
  return (
    <View
      style={[
        tw`rounded-full border flex-row items-center ${
          small ? 'px-2 py-0.5' : 'px-2.5 py-1'
        }`,
        {
          backgroundColor: `${meta.color}15`,
          borderColor: `${meta.color}35`,
        },
      ]}>
      <View
        style={[
          tw`w-1.5 h-1.5 rounded-full mr-1.5`,
          { backgroundColor: meta.color },
        ]}
      />
      <Text
        style={[
          tw`${small ? 'text-[10px]' : 'text-xs'} font-semibold tracking-tight`,
          { color: meta.color },
        ]}>
        {meta.label}
      </Text>
    </View>
  );
};

export const TrendBadge = ({ value }: { value: number | null }) => {
  if (value === null || value === undefined)
    return <Text style={tw`text-xs text-slate-400 font-normal`}>no trend</Text>;
  const declining = value > 0;
  const color = declining ? '#dc2626' : '#16a34a';
  return (
    <View
      style={[
        tw`flex-row items-center rounded-lg px-2 py-0.5 border`,
        declining
          ? tw`bg-rose-50 border-rose-200/70`
          : tw`bg-emerald-50 border-emerald-200/70`,
      ]}>
      {declining ? (
        <ArrowDown size={11} color={color} strokeWidth={2.5} />
      ) : (
        <ArrowUp size={11} color={color} strokeWidth={2.5} />
      )}
      <Text style={[tw`text-xs font-semibold ml-1`, { color }]}>
        {Math.abs(value).toFixed(2)} m/yr {declining ? 'fall' : 'rise'}
      </Text>
    </View>
  );
};

export const AnomalyBadge = ({ anomaly }: { anomaly: string }) => (
  <View
    style={tw`flex-row items-center bg-blue-50 border border-blue-200/70 rounded-md px-2 py-0.5 mr-1.5 mt-1`}>
    <AlertTriangle size={11} color="#2563eb" strokeWidth={2} />
    <Text style={tw`text-[10px] font-medium text-blue-800 ml-1`}>
      {ANOMALY_LABEL[anomaly] ?? anomaly}
    </Text>
  </View>
);

export const Loading = ({ label = 'Loading DWLR telemetry feed…' }: { label?: string }) => (
  <View style={tw`flex-1 items-center justify-center py-20 bg-slate-50/50`}>
    <View style={tw`w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 items-center justify-center mb-3 shadow-2xs`}>
      <ActivityIndicator size="small" color="#2563eb" />
    </View>
    <Text style={tw`text-sm font-semibold text-slate-800`}>{label}</Text>
    <Text style={tw`text-xs text-slate-400 mt-1 font-normal`}>
      Central Ground Water Board • India-WRIS Telemetry Engine
    </Text>
  </View>
);

export const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <Card style={tw`m-4 items-center p-6 bg-rose-50/50 border-rose-200`}>
    <View style={tw`w-12 h-12 rounded-2xl bg-rose-100 items-center justify-center mb-3`}>
      <WifiOff size={24} color="#dc2626" strokeWidth={2} />
    </View>
    <Text style={tw`text-base text-center text-slate-900 font-bold`}>
      Telemetry Feed Offline
    </Text>
    <Text style={tw`mt-1 text-center text-xs text-slate-600 max-w-md leading-5 font-normal`}>
      {message}
    </Text>
    <View style={tw`mt-3 bg-white/90 border border-slate-200 rounded-lg px-3 py-1.5`}>
      <Text style={tw`text-[11px] text-slate-600 font-mono`}>
        python manage.py runserver 0.0.0.0:8000
      </Text>
    </View>
    {onRetry && (
      <Pressable
        onPress={onRetry}
        style={tw`mt-4 bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl shadow-sm`}>
        <Text style={tw`text-white text-xs font-semibold`}>Retry Connection</Text>
      </Pressable>
    )}
  </Card>
);

export const Empty = ({
  label,
}: {
  label: string;
  icon?: any;
}) => (
  <View style={tw`items-center py-12 px-4`}>
    <View style={tw`w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-2`}>
      <HelpCircle size={22} color="#94a3b8" strokeWidth={1.75} />
    </View>
    <Text style={tw`text-slate-500 text-sm font-normal text-center`}>{label}</Text>
  </View>
);

/** Horizontal proportional category distribution bar */
export const CategoryBar = ({ counts }: { counts: Record<string, number> }) => {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const order: Category[] = [
    'safe',
    'semi_critical',
    'critical',
    'over_exploited',
    'unknown',
  ];
  return (
    <View>
      <View style={tw`flex-row h-2 rounded-full overflow-hidden bg-slate-100`}>
        {order.map((c) =>
          counts[c] ? (
            <View
              key={c}
              style={[
                {
                  flex: counts[c] / total,
                  backgroundColor: CATEGORY_META[c].color,
                },
              ]}
            />
          ) : null
        )}
      </View>
      <View style={tw`flex-row flex-wrap mt-3`}>
        {order.map((c) => {
          const count = counts[c] ?? 0;
          const pct = Math.round((count / total) * 100);
          return (
            <View key={c} style={tw`flex-row items-center mr-3.5 mb-1.5`}>
              <View
                style={[
                  tw`w-2 h-2 rounded-full mr-1.5`,
                  { backgroundColor: CATEGORY_META[c].color },
                ]}
              />
              <Text style={tw`text-[11px] font-normal text-slate-700`}>
                {CATEGORY_META[c].label} <Text style={tw`font-semibold text-slate-900`}>{count}</Text>
                <Text style={tw`text-slate-400 text-[9px]`}> ({pct}%)</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
