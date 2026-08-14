import React from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';

import logo from '@/assets/images/logo.png';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  WifiOff,
} from '@/components/Icons';
import { useTheme } from '@/constants/ThemeContext';
import { ANOMALY_LABEL, CATEGORY_META, Category } from '@/constants/api';
import tw from '@/constants/tailwind';

export const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        tw`rounded-2xl p-3.5 border shadow-2xs`,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.borderColor,
        },
        style,
      ]}>
      {children}
    </View>
  );
};

export const GlassCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        tw`rounded-2xl p-4.5 border shadow-sm`,
        {
          backgroundColor: colors.glassBg,
          borderColor: colors.borderColor,
        },
        style,
      ]}>
      {children}
    </View>
  );
};

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
}) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={tw`flex-row items-center justify-between mt-5 mb-2.5`}>
      <View style={tw`flex-1 mr-2`}>
        <View style={tw`flex-row items-center`}>
          {IconComponent && (
            <View
              style={[
                tw`w-5.5 h-5.5 rounded-lg items-center justify-center mr-2 border`,
                {
                  backgroundColor: isDark ? 'rgba(47, 128, 255, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                  borderColor: isDark ? 'rgba(47, 128, 255, 0.25)' : 'rgba(37, 99, 235, 0.2)',
                },
              ]}>
              {typeof IconComponent === 'function' ? (
                <IconComponent size={12} color={colors.brightBlue} strokeWidth={2} />
              ) : (
                <Activity size={12} color={colors.brightBlue} strokeWidth={2} />
              )}
            </View>
          )}
          <Text
            style={[
              tw`text-sm font-semibold tracking-tight`,
              { color: colors.textPrimary },
            ]}>
            {title}
          </Text>
        </View>
        {subtitle && (
          <Text style={[tw`text-[11px] mt-0.5 font-normal`, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
};

export const PulseBadge = ({
  label = 'Live Telemetry',
  active = true,
}: {
  label?: string;
  active?: boolean;
}) => {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        tw`flex-row items-center border rounded-full px-2.5 py-0.5 shadow-2xs`,
        {
          backgroundColor: colors.bgPanel,
          borderColor: colors.borderColor,
        },
      ]}>
      <View
        style={[
          tw`w-1.5 h-1.5 rounded-full mr-1.5`,
          { backgroundColor: active ? colors.primaryBlue : colors.textMuted },
        ]}
      />
      <Text style={[tw`text-[10px] font-medium tracking-wide`, { color: colors.textPrimary }]}>
        {label}
      </Text>
    </View>
  );
};

export const BlueBadge = ({ label }: { label: string }) => {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        tw`border rounded-full px-2.5 py-0.5`,
        {
          backgroundColor: isDark ? 'rgba(47, 128, 255, 0.12)' : 'rgba(37, 99, 235, 0.08)',
          borderColor: colors.borderColor,
        },
      ]}>
      <Text style={[tw`text-[9px] font-semibold uppercase tracking-wider`, { color: colors.brightBlue }]}>
        {label}
      </Text>
    </View>
  );
};

export const Stat = ({
  label,
  value,
  unit,
  icon: IconComponent,
  tint,
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
}) => {
  const { colors, isDark } = useTheme();
  const iconTint = tint ?? colors.primaryBlue;

  return (
    <View
      style={[
        tw`rounded-xl p-3 border shadow-2xs`,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.borderColor,
        },
        style,
      ]}>
      <View style={tw`flex-row items-center justify-between mb-1.5`}>
        <Text
          style={[tw`text-[11px] font-medium flex-1 pr-1`, { color: colors.textMuted }]}
          numberOfLines={1}>
          {label}
        </Text>
        <View
          style={[
            tw`w-6 h-6 rounded-lg items-center justify-center border`,
            {
              backgroundColor: `${iconTint}18`,
              borderColor: `${iconTint}35`,
            },
          ]}>
          {typeof IconComponent === 'function' ? (
            <IconComponent size={12} color={iconTint} strokeWidth={2} />
          ) : (
            <Activity size={12} color={iconTint} strokeWidth={2} />
          )}
        </View>
      </View>
      <View style={tw`flex-row items-baseline`}>
        <Text
          style={[tw`text-lg font-bold tracking-tight`, { color: colors.textPrimary }]}>
          {value}
        </Text>
        {!!unit && (
          <Text style={[tw`text-[11px] font-medium ml-1`, { color: colors.textMuted }]}>
            {unit}
          </Text>
        )}
      </View>
      <View
        style={[
          tw`flex-row items-center justify-between mt-1.5 pt-1.5 border-t`,
          { borderColor: colors.borderColor },
        ]}>
        {delta ? (
          <View
            style={[
              tw`flex-row items-center rounded px-1.5 py-0.5 border`,
              delta.good
                ? {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                  },
            ]}>
            {delta.good ? (
              <TrendingUp size={10} color={isDark ? '#34d399' : '#059669'} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={10} color={isDark ? '#f87171' : '#dc2626'} strokeWidth={2.5} />
            )}
            <Text
              style={[
                tw`text-[9px] font-semibold ml-1`,
                { color: delta.good ? (isDark ? '#34d399' : '#059669') : (isDark ? '#f87171' : '#dc2626') },
              ]}>
              {delta.text}
            </Text>
          </View>
        ) : null}
        {!!hint && (
          <Text
            style={[
              tw`text-[9px] font-normal flex-1 ${delta ? 'ml-1.5 text-right' : ''}`,
              { color: colors.textMuted },
            ]}
            numberOfLines={1}>
            {hint}
          </Text>
        )}
      </View>
    </View>
  );
};

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
  const { colors, isDark } = useTheme();
  if (value === null || value === undefined)
    return <Text style={[tw`text-xs font-normal`, { color: colors.textMuted }]}>no trend</Text>;
  const declining = value > 0;
  const color = declining ? (isDark ? '#f87171' : '#dc2626') : (isDark ? '#4ade80' : '#16a34a');

  return (
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

export const AnomalyBadge = ({ anomaly }: { anomaly: string }) => {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        tw`flex-row items-center border rounded-md px-2 py-0.5 mr-1.5 mt-1`,
        {
          backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.08)',
          borderColor: colors.borderColor,
        },
      ]}>
      <AlertTriangle size={11} color={colors.brightBlue} strokeWidth={2} />
      <Text style={[tw`text-[10px] font-medium ml-1`, { color: colors.brightBlue }]}>
        {ANOMALY_LABEL[anomaly] ?? anomaly}
      </Text>
    </View>
  );
};

export const Loading = ({ label }: { label?: string }) => {
  return (
    <View style={tw`flex-1 items-center justify-center bg-white`}>
      <ActivityIndicator size="large" color="#2563EB" />
      {label ? (
        <Text style={tw`text-xs mt-3 text-slate-500 font-medium`}>{label}</Text>
      ) : null}
    </View>
  );
};

export const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => {
  const { colors, isDark } = useTheme();
  return (
    <Card
      style={[
        tw`m-4 items-center p-6`,
        {
          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
          borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
        },
      ]}>
      <View
        style={[
          tw`w-12 h-12 rounded-2xl items-center justify-center mb-3`,
          {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
          },
        ]}>
        <WifiOff size={24} color="#EF4444" strokeWidth={2} />
      </View>
      <Text style={[tw`text-base text-center font-bold`, { color: colors.textPrimary }]}>
        Telemetry Feed Offline
      </Text>
      <Text style={[tw`mt-1 text-center text-xs max-w-md leading-5 font-normal`, { color: colors.textMuted }]}>
        {message}
      </Text>
      <View
        style={[
          tw`mt-3 border rounded-lg px-3 py-1.5`,
          {
            backgroundColor: colors.bgSubtle,
            borderColor: colors.borderColor,
          },
        ]}>
        <Text style={[tw`text-[11px] font-mono`, { color: colors.textMuted }]}>
          python manage.py runserver 0.0.0.0:8000
        </Text>
      </View>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={[
            tw`mt-4 px-5 py-2.5 rounded-xl shadow-sm`,
            { backgroundColor: colors.primaryBlue },
          ]}>
          <Text style={tw`text-white text-xs font-semibold`}>Retry Connection</Text>
        </Pressable>
      )}
    </Card>
  );
};

export const Empty = ({
  label,
}: {
  label: string;
  icon?: any;
}) => {
  const { colors } = useTheme();
  return (
    <View style={tw`items-center py-12 px-4`}>
      <View
        style={[
          tw`w-12 h-12 rounded-2xl border items-center justify-center mb-2`,
          {
            backgroundColor: colors.bgSubtle,
            borderColor: colors.borderColor,
          },
        ]}>
        <HelpCircle size={22} color={colors.textMuted} strokeWidth={1.75} />
      </View>
      <Text style={[tw`text-sm font-normal text-center`, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
};

/** Horizontal proportional category distribution bar */
export const CategoryBar = ({ counts }: { counts: Record<string, number> }) => {
  const { colors } = useTheme();
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
      <View
        style={[
          tw`flex-row h-2 rounded-full overflow-hidden border`,
          {
            backgroundColor: colors.bgSubtle,
            borderColor: colors.borderColor,
          },
        ]}>
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
              <Text style={[tw`text-[11px] font-normal`, { color: colors.textMuted }]}>
                {CATEGORY_META[c].label}{' '}
                <Text style={[tw`font-semibold`, { color: colors.textPrimary }]}>{count}</Text>
                <Text style={[tw`text-[9px]`, { color: colors.textMuted }]}> ({pct}%)</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

