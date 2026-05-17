import type { MotionTokens } from './theme_context';

/**
 * Motion tokens — identity tokens (do not flip with light/dark), straight
 * from the DS: durations 140/220/380ms; easing curves as bezier control
 * points for `Easing.bezier(...)`. No bouncy springs.
 *
 * Source: design_system/colors_and_type.css (--ease-* / --dur-*).
 */
export const motion: MotionTokens = {
  duration: { fast: 140, base: 220, slow: 380 },
  easing: {
    standard: [0.2, 0.7, 0.2, 1], // --ease-standard
    out: [0.16, 0.84, 0.32, 1], // --ease-out (entrances)
    in: [0.7, 0.0, 0.84, 0.0], // --ease-in
  },
};
