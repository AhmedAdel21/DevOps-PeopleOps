import type { GradientSet, LinearGradientToken } from './theme_context';

/**
 * Brand gradients. RN has no CSS gradient strings, so each is stored as
 * react-native-linear-gradient-shaped data (angle + colors + locations).
 * `page` keeps its two radial halos as structured data — rendered via
 * react-native-svg RadialGradient in Phase 3 (locked decision).
 *
 * hero / spark / glass are DS identity tokens (do not flip). Only `page`
 * changes between light and dark.
 *
 * Source: design_system/colors_and_type.css (--grad-*).
 */
const identity: Omit<GradientSet, 'page'> = {
  hero: { angle: 135, colors: ['#262261', '#3D3A8A', '#787CF2'], locations: [0, 0.45, 1] },
  heroSoft: { angle: 135, colors: ['#EFEEF7', '#E4E5FD', '#F2F3FE'], locations: [0, 0.6, 1] },
  spark: { angle: 120, colors: ['#787CF2', '#EE5C2D'], locations: [0, 1] },
  glassLight: {
    angle: 135,
    colors: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.45)'],
    locations: [0, 1],
  },
  glassOnBrand: {
    angle: 135,
    colors: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)'],
    locations: [0, 1],
  },
};

const lightPageBase: LinearGradientToken = {
  angle: 180,
  colors: ['#F7F7FB', '#EFEFF7'],
  locations: [0, 1],
};

const darkPageBase: LinearGradientToken = {
  angle: 180,
  colors: ['#0F0E2A', '#080719'],
  locations: [0, 1],
};

export const lightGradient: GradientSet = {
  ...identity,
  page: {
    base: lightPageBase,
    halos: [
      { colors: ['#E4E5FD', 'transparent'], locations: [0, 0.6], cx: 0.1, cy: -0.1, rx: 1.2, ry: 0.6 },
      { colors: ['#DCDBEC', 'transparent'], locations: [0, 0.55], cx: 1.1, cy: 0.1, rx: 0.9, ry: 0.5 },
    ],
  },
};

export const darkGradient: GradientSet = {
  ...identity,
  page: {
    base: darkPageBase,
    halos: [
      { colors: ['rgba(120,124,242,0.16)', 'transparent'], locations: [0, 0.6], cx: 0.1, cy: -0.1, rx: 1.2, ry: 0.6 },
      { colors: ['rgba(38,34,97,0.45)', 'transparent'], locations: [0, 0.55], cx: 1.1, cy: 0.1, rx: 0.9, ry: 0.5 },
    ],
  },
};
