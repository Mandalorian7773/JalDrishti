import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  mode: ThemeMode;
  isDark: boolean;
  bgCanvas: string;
  bgSidebar: string;
  bgPanel: string;
  bgSubtle: string;
  bgInput: string;
  borderColor: string;
  borderSubtle: string;
  primaryBlue: string;
  brightBlue: string;
  textPrimary: string;
  textMuted: string;
  textSubtle: string;
  chartBg: string;
  chartGrid: string;
  cardBg: string;
  glassBg: string;
  accentBg: string;
  shadowColor: string;
}

export const darkThemeColors: ThemeColors = {
  mode: 'dark',
  isDark: true,
  bgCanvas: '#07111F',
  bgSidebar: '#081525',
  bgPanel: '#0C1A2B',
  bgSubtle: '#13263C',
  bgInput: '#081525',
  borderColor: '#19304A',
  borderSubtle: '#19304A',
  primaryBlue: '#2F80FF',
  brightBlue: '#55A8FF',
  textPrimary: '#F4F8FF',
  textMuted: '#7890AA',
  textSubtle: '#4A627A',
  chartBg: '#0C1A2B',
  chartGrid: '#19304A',
  cardBg: '#0C1A2B',
  glassBg: '#0C1A2B',
  accentBg: '#2F80FF',
  shadowColor: '#07111F',
};

export const lightThemeColors: ThemeColors = {
  mode: 'light',
  isDark: false,
  bgCanvas: '#F4F6F9',
  bgSidebar: '#FFFFFF',
  bgPanel: '#FFFFFF',
  bgSubtle: '#F1F5F9',
  bgInput: '#FFFFFF',
  borderColor: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  primaryBlue: '#2563EB',
  brightBlue: '#1D4ED8',
  textPrimary: '#0F172A',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  chartBg: '#FFFFFF',
  chartGrid: '#F1F5F9',
  cardBg: '#FFFFFF',
  glassBg: '#FFFFFF',
  accentBg: '#2563EB',
  shadowColor: '#0F172A',
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: darkThemeColors,
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

const THEME_STORAGE_KEY = 'jal_drishti_theme';

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* ignore */
    }
  }
  return 'dark';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  const colors = theme === 'dark' ? darkThemeColors : lightThemeColors;
  const isDark = theme === 'dark';

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = isDark ? '#07111F' : '#F4F6F9';
      document.body.style.backgroundColor = isDark ? '#07111F' : '#F4F6F9';
    }
  }, [isDark]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {
        /* ignore */
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
