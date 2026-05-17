import type { GlassTokens } from './theme_context';

/**
 * Glassmorphism tokens. `blur` feeds @react-native-community/blur in
 * Phase 3. Android `backdrop-filter` has no RN equivalent and the
 * community blur is inconsistent there — the DS prescribes a higher
 * fill opacity as the fallback, which these `*-strong` values cover.
 *
 * Source: design_system/colors_and_type.css (--glass-*).
 */
export const lightGlass: GlassTokens = {
  fill: 'rgba(255, 255, 255, 0.55)',
  fillStrong: 'rgba(255, 255, 255, 0.72)',
  fillOnBrand: 'rgba(255, 255, 255, 0.10)',
  fillOnBrandStrong: 'rgba(255, 255, 255, 0.16)',
  stroke: 'rgba(255, 255, 255, 0.65)',
  strokeOnBrand: 'rgba(255, 255, 255, 0.22)',
  blur: 18,
  blurStrong: 28,
};

/** Dark: inverted — dark canvas with a faint white stroke that catches light. */
export const darkGlass: GlassTokens = {
  fill: 'rgba(26, 24, 56, 0.65)',
  fillStrong: 'rgba(26, 24, 56, 0.85)',
  fillOnBrand: 'rgba(255, 255, 255, 0.06)',
  fillOnBrandStrong: 'rgba(255, 255, 255, 0.10)',
  stroke: 'rgba(255, 255, 255, 0.08)',
  strokeOnBrand: 'rgba(255, 255, 255, 0.10)',
  blur: 18,
  blurStrong: 28,
};
