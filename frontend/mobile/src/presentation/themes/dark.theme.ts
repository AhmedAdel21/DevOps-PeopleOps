import type { AppTheme } from './theme_context';
import { spacing } from './spacing';
import { radius } from './radius';
import { fontFamily, fontSizes, fontWeights } from './typography';
import { darkShadow } from './shadow';
import { darkGlass } from './glass';
import { darkGradient } from './gradient';
import { motion } from './motion';

/**
 * Dark theme — from the DS `html.dark` override block.
 *
 * Brand tokens (primary / accent / spark ramps, hero gradient, motion,
 * radii, type) are identity tokens and do NOT flip — only the canvas
 * (surfaces, ink scale, glass, semantic bg tints, shadows) inverts.
 * Structure mirrors light.theme.ts key-for-key.
 *
 * Source: design_system/colors_and_type.css (html.dark { ... }).
 */
export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    // Brand — unchanged (identity tokens)
    primary: '#262261',
    primaryHover: '#1B1849',
    primaryLight: '#EFEEF7',
    primaryForeground: '#FFFFFF',
    primary700: '#1B1849',
    primary500: '#3A3680',
    primary300: '#6F6CA6',
    primary100: '#DCDBEC',
    primary050: '#EFEEF7',

    accent: '#787CF2',
    accentHover: '#5559D6',
    accent300: '#A6A9F7',
    accent200: '#C9CBFA',
    accent100: '#E4E5FD',
    accent050: '#F2F3FE',
    accentForeground: '#FFFFFF',

    spark: '#EE5C2D',
    spark300: '#F49072',
    spark100: '#FBDDD0',

    // Legacy alias — secondary === accent
    secondary: '#787CF2',
    secondaryHover: '#5559D6',
    secondaryLight: '#E4E5FD',
    secondaryForeground: '#FFFFFF',

    // Surfaces — dark canvas (background = canvas for compat)
    background: '#1A1838', // --bg-canvas (dark)
    foreground: '#E5E4EE', // --ink-700 (dark)
    surface: '#1A1838',
    card: '#1A1838',
    cardForeground: '#E5E4EE',

    // DS surface tokens
    page: '#0F0E2A', // --bg-page (dark)
    pageDeep: '#080719', // --bg-page-deep (dark)
    canvas: '#1A1838', // --bg-canvas (dark)
    inverted: '#FFFFFF', // --bg-inverted (dark)

    // Neutrals — inverted ink scale (hierarchy preserved)
    inkDeep: '#FFFFFF',
    ink900: '#FFFFFF',
    ink700: '#E5E4EE',
    ink500: '#C8C6D6',
    ink400: '#9794AE',
    ink300: '#6F6D8E',
    ink200: '#2A2848',
    ink100: '#1E1C3A',
    ink050: '#131228',
    muted: '#131228', // --ink-050 (dark)
    mutedForeground: '#9794AE', // --ink-400 (dark)

    // Borders & inputs
    border: '#1E1C3A', // --ink-100 (dark)
    borderStrong: '#2A2848', // --ink-200 (dark)
    divider: '#1E1C3A',
    input: '#131228',
    ring: 'rgba(120, 124, 242, 0.55)',

    // Destructive
    destructive: '#E06B6B',
    destructiveForeground: '#FFFFFF',

    // Status — foreground hues stay; backgrounds become low-alpha tints
    status: {
      success: { base: '#1F9D74', foreground: '#6FE0BD', light: 'rgba(31, 157, 116, 0.18)' },
      warning: { base: '#D98A00', foreground: '#F4C56B', light: 'rgba(217, 138, 0, 0.20)' },
      error: { base: '#D14545', foreground: '#F0908F', light: 'rgba(209, 69, 69, 0.18)' },
      info: { base: '#787CF2', foreground: '#B9BBFA', light: 'rgba(120, 124, 242, 0.18)' },
    },

    // Leave type accents — brightened for dark surfaces
    leaveTypes: {
      annual: '#34D399',
      casual: '#FBBF24',
      sick: '#F0908F',
      compassionate: '#A6A9F7', // accent-300
      unpaid: '#9794AE', // ink-400 (dark)
      hajj: '#6F6CA6', // primary-300
      marriage: '#F49072', // spark-300
    },

    // Legacy aliases — do NOT use in new code
    text: {
      primary: '#FFFFFF',
      secondary: '#C8C6D6',
      disabled: '#6F6D8E',
      inverse: '#1A1838',
    },
  },
  spacing,
  radius,
  typography: {
    fontFamily,
    sizes: fontSizes,
    weights: fontWeights,
  },
  shadow: darkShadow,
  glass: darkGlass,
  gradient: darkGradient,
  motion,
};
