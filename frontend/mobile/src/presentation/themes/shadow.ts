import type { ShadowScale } from './theme_context';

/**
 * Elevation scale — cross-platform RN shadow tokens.
 *
 * Light: indigo-tinted (DS shadows are rgba(38,34,97,a) — never gray).
 * RN can't set shadow alpha via the color string reliably across
 * platforms, so the indigo is the solid `shadowColor` and the DS alpha
 * becomes `shadowOpacity`. `elevation` is the Android counterpart.
 *
 * Source: design_system/colors_and_type.css (--shadow-xs..xl, glow).
 */
export const lightShadow: ShadowScale = {
  xs: { shadowColor: '#262261', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  sm: { shadowColor: '#262261', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  md: { shadowColor: '#262261', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
  lg: { shadowColor: '#262261', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.12, shadowRadius: 48, elevation: 12 },
  xl: { shadowColor: '#262261', shadowOffset: { width: 0, height: 32 }, shadowOpacity: 0.18, shadowRadius: 80, elevation: 24 },
  glowAccent: { shadowColor: '#787CF2', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.45, shadowRadius: 60, elevation: 16 },
};

/**
 * Dark: indigo-tinted shadows vanish on dark indigo, so the DS dark block
 * switches to near-black at higher opacity.
 */
export const darkShadow: ShadowScale = {
  xs: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.35, shadowRadius: 2, elevation: 1 },
  sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 2 },
  md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.40, shadowRadius: 24, elevation: 6 },
  lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.50, shadowRadius: 48, elevation: 12 },
  xl: { shadowColor: '#000000', shadowOffset: { width: 0, height: 32 }, shadowOpacity: 0.60, shadowRadius: 80, elevation: 24 },
  glowAccent: { shadowColor: '#787CF2', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.55, shadowRadius: 60, elevation: 16 },
};
