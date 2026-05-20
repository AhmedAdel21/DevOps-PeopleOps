import type { AppTheme } from './theme_context';
import { spacing } from './spacing';
import { radius } from './radius';
import { fontFamily, fontSizes, fontWeights } from './typography';
import { lightShadow } from './shadow';
import { lightGlass } from './glass';
import { lightGradient } from './gradient';
import { motion } from './motion';

/**
 * Light theme — Devopsolution design system (brand inversion).
 * Source of truth: design_system/colors_and_type.css.
 *
 * Primary is now deep indigo (#262261); the old orange survives only as
 * the sparing `spark`. `secondary*` are compat aliases pointing at the
 * new lavender `accent` so the 26 files reading `colors.secondary`
 * keep working without a mass find-replace (locked decision).
 */
export const lightTheme: AppTheme = {
  dark: false,
  colors: {
    // Brand — primary (deep indigo) + DS ramp
    primary: '#262261',
    primaryHover: '#1B1849', // --brand-primary-700
    primaryLight: '#EFEEF7', // --brand-primary-050
    primaryForeground: '#FFFFFF',
    primaryInk: '#262261', // primary as text/icon — same as primary on light
    primary700: '#1B1849',
    primary500: '#3A3680',
    primary300: '#6F6CA6',
    primary100: '#DCDBEC',
    primary050: '#EFEEF7',

    // Brand — accent (lavender) + ramp
    accent: '#787CF2',
    accentHover: '#5559D6', // --brand-accent-700
    accent300: '#A6A9F7',
    accent200: '#C9CBFA',
    accent100: '#E4E5FD',
    accent050: '#F2F3FE',
    accentForeground: '#FFFFFF',

    // Brand — spark (orange — status dots / illustration accents only)
    spark: '#EE5C2D',
    spark300: '#F49072',
    spark100: '#FBDDD0',

    // Legacy alias — secondary === accent
    secondary: '#787CF2',
    secondaryHover: '#5559D6',
    secondaryLight: '#E4E5FD',
    secondaryForeground: '#FFFFFF',

    // Surfaces (background stays white for compat; page wash adopted in Phase 3)
    background: '#FFFFFF',
    foreground: '#1F1D3D', // --ink-700
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardForeground: '#1F1D3D',

    // DS surface tokens
    page: '#F7F7FB', // --bg-page
    pageDeep: '#EFEFF7', // --bg-page-deep
    canvas: '#FFFFFF', // --bg-canvas
    inverted: '#262261', // --bg-inverted

    // Neutrals — cool indigo-tinted ink scale
    inkDeep: '#15133A',
    ink900: '#0E0D2A',
    ink700: '#1F1D3D',
    ink500: '#4A4870',
    ink400: '#6F6D8E',
    ink300: '#9794AE',
    ink200: '#C8C6D6',
    ink100: '#E5E4EE',
    ink050: '#F4F4F8',
    muted: '#F4F4F8', // --ink-050
    mutedForeground: '#4A4870', // --ink-500

    // Borders & inputs
    border: '#E5E4EE', // --ink-100
    borderStrong: '#C8C6D6', // --ink-200
    divider: '#E5E4EE',
    input: '#F4F4F8',
    ring: 'rgba(120, 124, 242, 0.45)', // accent focus ring

    // Destructive
    destructive: '#D14545', // --danger
    destructiveForeground: '#FFFFFF',

    // Status — DS semantic + app .base/.foreground/.light extension
    status: {
      success: { base: '#1F9D74', foreground: '#0E5C44', light: '#E5F5EE' },
      warning: { base: '#D98A00', foreground: '#7A4E00', light: '#FBF1DC' },
      error: { base: '#D14545', foreground: '#8A2E2E', light: '#FBE5E5' },
      info: { base: '#787CF2', foreground: '#3D3F9E', light: '#E4E5FD' },
    },

    // Leave type accents — semantic ones kept; arbitrary ones re-tinted
    // toward the indigo/lavender/spark family (locked decision).
    leaveTypes: {
      annual: '#1F9D74', // success green
      casual: '#D98A00', // warning amber
      sick: '#D14545', // danger red
      compassionate: '#5559D6', // accent-700 indigo-violet (was generic purple)
      unpaid: '#6F6D8E', // ink-400 (was generic gray)
      hajj: '#3A3680', // primary-500 (was generic blue)
      marriage: '#EE5C2D', // spark (celebration accent — allowed spark use)
    },

    // Legacy aliases — do NOT use in new code
    text: {
      primary: '#1F1D3D',
      secondary: '#4A4870',
      disabled: '#9794AE',
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
  shadow: lightShadow,
  glass: lightGlass,
  gradient: lightGradient,
  motion,
};
