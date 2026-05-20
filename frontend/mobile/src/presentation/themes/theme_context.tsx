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

/**
 * Cross-platform elevation token. iOS reads shadow*; Android reads
 * elevation. Indigo-tinted in light, near-black in dark (per DS).
 */
export interface ShadowToken {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ShadowScale {
  xs: ShadowToken;
  sm: ShadowToken;
  md: ShadowToken;
  lg: ShadowToken;
  xl: ShadowToken;
  glowAccent: ShadowToken;
}

/** Glassmorphism tokens. `blur`/`blurStrong` feed @react-native-community/blur. */
export interface GlassTokens {
  fill: string;
  fillStrong: string;
  fillOnBrand: string;
  fillOnBrandStrong: string;
  stroke: string;
  strokeOnBrand: string;
  blur: number;
  blurStrong: number;
}

/** RN-consumable linear gradient (react-native-linear-gradient shape). */
export interface LinearGradientToken {
  angle: number;
  colors: string[];
  locations: number[];
}

/** One radial halo, rendered via react-native-svg in Phase 3. */
export interface RadialHaloToken {
  colors: string[];
  locations: number[];
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** `--grad-page`: a linear base with two radial highlights on top. */
export interface PageGradientToken {
  base: LinearGradientToken;
  halos: RadialHaloToken[];
}

export interface GradientSet {
  hero: LinearGradientToken;
  heroSoft: LinearGradientToken;
  spark: LinearGradientToken;
  glassLight: LinearGradientToken;
  glassOnBrand: LinearGradientToken;
  page: PageGradientToken;
}

/** Easing curves are bezier control-point tuples for Easing.bezier(...). */
export interface MotionTokens {
  duration: { fast: number; base: number; slow: number };
  easing: {
    standard: [number, number, number, number];
    out: [number, number, number, number];
    in: [number, number, number, number];
  };
}

type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  dark: boolean;
  colors: {
    // Brand — primary (deep indigo) + full DS shade ramp
    primary: string;
    primaryHover: string;
    primaryLight: string;
    primaryForeground: string;
    primaryInk: string; // primary used as text/icon/border (flips in dark mode)
    primary700: string;
    primary500: string;
    primary300: string;
    primary100: string;
    primary050: string;

    // Brand — accent (lavender) + ramp
    accent: string;
    accentHover: string;
    accent300: string;
    accent200: string;
    accent100: string;
    accent050: string;
    accentForeground: string;

    // Brand — spark (orange, sparing: status dots / illustration accents only)
    spark: string;
    spark300: string;
    spark100: string;

    // Legacy alias — `secondary` now points at `accent` (26 files read it)
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

    // DS surface tokens — page wash vs white canvas (adopted in Phase 3)
    page: string;
    pageDeep: string;
    canvas: string;
    inverted: string;

    // Neutrals — cool indigo-tinted ink scale (DS --ink-*)
    inkDeep: string;
    ink900: string;
    ink700: string;
    ink500: string;
    ink400: string;
    ink300: string;
    ink200: string;
    ink100: string;
    ink050: string;
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
  shadow: ShadowScale;
  glass: GlassTokens;
  gradient: GradientSet;
  motion: MotionTokens;
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
