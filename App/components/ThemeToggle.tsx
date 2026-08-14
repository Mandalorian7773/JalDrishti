import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Moon, Sun } from '@/components/Icons';
import { useTheme } from '@/constants/ThemeContext';
import tw from '@/constants/tailwind';

interface ThemeToggleProps {
  compact?: boolean;
  style?: any;
}

export default function ThemeToggle({ compact = false, style }: ThemeToggleProps) {
  const { isDark, toggleTheme, colors } = useTheme();

  if (compact) {
    return (
      <Pressable
        onPress={toggleTheme}
        accessibilityRole="button"
        accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        style={[
          tw`w-9 h-9 rounded-xl items-center justify-center border transition-all shadow-2xs self-center`,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.borderColor,
          },
          style,
        ]}>
        {isDark ? (
          <Sun size={17} color={colors.brightBlue} strokeWidth={2} />
        ) : (
          <Moon size={17} color={colors.primaryBlue} strokeWidth={2} />
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={[
        tw`flex-row items-center justify-between rounded-xl px-3 py-2 border transition-all shadow-2xs`,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.borderColor,
        },
        style,
      ]}>
      <View style={tw`flex-row items-center`}>
        <View
          style={[
            tw`w-7 h-7 rounded-lg items-center justify-center mr-2.5 border`,
            {
              backgroundColor: isDark ? 'rgba(47, 128, 255, 0.15)' : 'rgba(37, 99, 235, 0.08)',
              borderColor: isDark ? 'rgba(47, 128, 255, 0.3)' : 'rgba(37, 99, 235, 0.2)',
            },
          ]}>
          {isDark ? (
            <Sun size={14} color={colors.brightBlue} strokeWidth={2} />
          ) : (
            <Moon size={14} color={colors.primaryBlue} strokeWidth={2} />
          )}
        </View>
        <View>
          <Text
            style={[
              tw`text-xs font-semibold tracking-tight`,
              { color: colors.textPrimary },
            ]}>
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </Text>
          <Text
            style={[
              tw`text-[9px] font-normal`,
              { color: colors.textMuted },
            ]}>
            {isDark ? 'Click for Light' : 'Click for Dark'}
          </Text>
        </View>
      </View>

      {/* Pill Switch Track */}
      <View
        style={[
          tw`w-8 h-4.5 rounded-full p-0.5 border flex-row items-center`,
          {
            backgroundColor: isDark ? colors.bgSubtle : colors.bgSubtle,
            borderColor: colors.borderColor,
            justifyContent: isDark ? 'flex-end' : 'flex-start',
          },
        ]}>
        <View
          style={[
            tw`w-3.5 h-3.5 rounded-full shadow-xs`,
            { backgroundColor: isDark ? colors.brightBlue : colors.primaryBlue },
          ]}
        />
      </View>
    </Pressable>
  );
}
