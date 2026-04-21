import type { AppTheme } from './theme_context';
import { spacing } from './spacing';
import { radius } from './radius';
import { fontFamily, fontSizes, fontWeights } from './typography';

/**
 * Dark theme — derived from the light brand palette. The Penpot file only
 * ships light tokens, so the dark variant mirrors them with sensible
 * inversions:
 *   - background/foreground are flipped
 *   - brand primary stays warm but slightly brighter for AA contrast on dark
 *   - status colors keep their hue but use darker tinted "light" surfaces
 */
export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    // Brand
    primary: '#FF7A4D',
    primaryHover: '#FF6633',
    primaryLight: '#3A1F18',
    primaryForeground: '#FFFFFF',

    secondary: '#A9B6D6',
    secondaryHover: '#C5CFE5',
    secondaryLight: '#1F2A44',
    secondaryForeground: '#0B1020',

    // Surfaces
    background: '#0B1020',
    foreground: '#F9FAFB',
    surface: '#111827',
    card: '#111827',
    cardForeground: '#F9FAFB',

    // Neutrals
    muted: '#1F2937',
    mutedForeground: '#9CA3AF',

    // Borders & inputs
    border: '#374151',
    borderStrong: '#4B5563',
    divider: '#1F2937',
    input: '#111827',
    ring: '#FF7A4D55',

    // Destructive
    destructive: '#F87171',
    destructiveForeground: '#FFFFFF',

    // Status
    status: {
      success: {
        base: '#34D399',
        foreground: '#A7F3D0',
        light: '#0F2A22',
      },
      warning: {
        base: '#FBBF24',
        foreground: '#FDE68A',
        light: '#2A1F09',
      },
      error: {
        base: '#F87171',
        foreground: '#FECACA',
        light: '#2A1212',
      },
      info: {
        base: '#60A5FA',
        foreground: '#BFDBFE',
        light: '#0F1B2E',
      },
    },

    // Leave type accent colors
    leaveTypes: {
      annual:       '#34D399', // brighter green for dark
      casual:       '#FBBF24', // brighter amber for dark
      sick:         '#F87171', // brighter red for dark
      compassionate:'#A78BFA', // lighter purple for dark
      unpaid:       '#9CA3AF', // lighter gray for dark
      hajj:         '#60A5FA', // brighter blue for dark
      marriage:     '#F472B6', // lighter pink for dark
    },

    // Legacy compat
    text: {
      primary: '#F9FAFB',
      secondary: '#9CA3AF',
      disabled: '#4B5563',
      inverse: '#111827',
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
