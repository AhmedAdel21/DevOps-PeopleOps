import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '@/core/keys/storage.key';
import { lightTheme } from './light.theme';
import { darkTheme } from './dark.theme';
import { TextStyle } from 'react-native';
import type { Spacing } from './spacing';
import type { Radius } from './radius';
import type { FontFamily, FontSizes, FontWeights } from './typography';

/**
 * Status color group — each semantic status exposes its base, the foreground
 * color to render text/icons on the base, and a tinted "light" surface
 * variant used for alert backgrounds.
 */
export interface StatusColor {
  base: string;
  foreground: string;
  light: string;
}
type FontWeight = TextStyle['fontWeight'];

type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  dark: boolean;
  colors: {
    // Brand
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryForeground: string;

    secondary: string;
    secondaryHover: string;
    secondaryLight: string;
    secondaryForeground: string;

    // Surfaces
    background: string;
    foreground: string;
    surface: string;
    card: string;
    cardForeground: string;

    // Neutrals
    muted: string;
    mutedForeground: string;

    // Borders & inputs
    border: string;
    borderStrong: string;
    divider: string;
    input: string;
    ring: string;

    // Destructive (separate from status.error so buttons can use it)
    destructive: string;
    destructiveForeground: string;

    // Status
    status: {
      success: StatusColor;
      warning: StatusColor;
      error: StatusColor;
      info: StatusColor;
    };

    // Leave type dot/badge colors — keyed by LeaveType union member.
    leaveTypes: {
      annual: string;
      casual: string;
      sick: string;
      compassionate: string;
      unpaid: string;
      hajj: string;
      marriage: string;
    };

    // Legacy aliases (kept so placeholder_screen.tsx still compiles).
    // Do NOT use in new code.
    text: {
      primary: string;
      secondary: string;
      disabled: string;
      inverse: string;
    };
  };
  spacing: Spacing;
  radius: Radius;
  typography: {
    fontFamily: FontFamily;
    sizes: FontSizes;
    weights: FontWeights;
  };
}

interface ThemeContextValue {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(StorageKeys.THEME).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
      }
    });
  }, []);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem(StorageKeys.THEME, newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setThemeMode]);

  const value: ThemeContextValue = {
    theme: mode === 'light' ? lightTheme : darkTheme,
    isDark: mode === 'dark',
    toggleTheme,
    setThemeMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
