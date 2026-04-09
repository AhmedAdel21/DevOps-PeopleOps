import type { AppTheme } from './theme_context';
import { spacing } from './spacing';
import { radius } from './radius';
import { fontFamily, fontSizes, fontWeights } from './typography';

/**
 * Light theme — exact tokens from design.pen (Colors & Typography frame).
 * This is the canonical brand palette.
 */
export const lightTheme: AppTheme = {
  dark: false,
  colors: {
    // Brand
    primary: '#FF6633',
    primaryHover: '#E85A2B',
    primaryLight: '#FFF0EB',
    primaryForeground: '#FFFFFF',

    secondary: '#1B2A5B',
    secondaryHover: '#152248',
    secondaryLight: '#E8EAF0',
    secondaryForeground: '#FFFFFF',

    // Surfaces
    background: '#FFFFFF',
    foreground: '#111827',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardForeground: '#111827',

    // Neutrals
    muted: '#F3F4F6',
    mutedForeground: '#6B7280',

    // Borders & inputs
    border: '#E5E7EB',
    borderStrong: '#D1D5DB',
    divider: '#F3F4F6',
    input: '#F9FAFB',
    ring: '#FF663333',

    // Destructive
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',

    // Status
    status: {
      success: {
        base: '#10B981',
        foreground: '#065F46',
        light: '#ECFDF5',
      },
      warning: {
        base: '#F59E0B',
        foreground: '#92400E',
        light: '#FFFBEB',
      },
      error: {
        base: '#EF4444',
        foreground: '#991B1B',
        light: '#FEF2F2',
      },
      info: {
        base: '#3B82F6',
        foreground: '#1E40AF',
        light: '#EFF6FF',
      },
    },

    // Legacy compat
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#D1D5DB',
      inverse: '#FFFFFF',
    },
  },
  spacing,
  radius,
  typography: {
    fontFamily,
    sizes: fontSizes,
    weights: fontWeights,
  },
};
