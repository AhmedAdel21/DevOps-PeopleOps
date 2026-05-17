import { TextStyle } from 'react-native';
import { fs } from '@/presentation/utils/scaling';

type FontWeight = TextStyle['fontWeight'];

/**
 * Devopsolution design system fonts. EN = Livvic, AR = Cairo.
 *
 * Keys are the iOS PostScript names (verified via `mdls`), which equal
 * the file basenames Android uses — the same convention the prior Inter
 * setup relied on. Self-hosted from `src/assets/fonts/`, registered by
 * `npx react-native-asset`. Cairo uses the STATIC weight files, not the
 * variable font (RN resolves static weights reliably; the variable file
 * does not).
 */
export interface FontFamily {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
}

export const livvicFamily: FontFamily = {
    regular: 'Livvic-Regular',
    medium: 'Livvic-Medium',
    semibold: 'Livvic-SemiBold',
    bold: 'Livvic-Bold',
};

export const cairoFamily: FontFamily = {
    regular: 'Cairo-Regular',
    medium: 'Cairo-Medium',
    semibold: 'Cairo-SemiBold',
    bold: 'Cairo-Bold',
};

/**
 * Default family map (English / Livvic). Kept as `fontFamily` for
 * backward-compat: `theme.typography.fontFamily` and any non-hook
 * consumer renders Livvic. Locale-aware consumers resolve per language
 * via `fontFamilyFor` (see `useFontFamily`).
 */
export const fontFamily: FontFamily = livvicFamily;

/**
 * Locale-conditional font resolver. Arabic (`ar`, `ar-EG`, …) → Cairo;
 * everything else → Livvic. Defensive default (empty/undefined) → Livvic.
 *
 * Real branching logic on a runtime-changeable input — unit-tested in
 * `__tests__/font_family.test.ts`.
 */
export function fontFamilyFor(language?: string): FontFamily {
    const isArabic = !!language && language.toLowerCase().startsWith('ar');
    return isArabic ? cairoFamily : livvicFamily;
}

/**
 * Type-scale matching the design (design.pen typography section).
 * All values pass through `fs()` for moderate accessibility scaling.
 *
 * The legacy aliases (display, heading, subheading, body, caption, micro)
 * are kept so existing screens (placeholder, splash) keep compiling.
 */
export const fontSizes = {
    // semantic
    xs: fs(11),
    sm: fs(12),
    base: fs(14),
    md: fs(15),
    lg: fs(16),
    xl: fs(18),
    xxl: fs(20),
    xxxl: fs(22),
    title: fs(24),
    display: fs(28),
    hero: fs(32),

    // legacy aliases (do not use in new code)
    heading: fs(22),
    subheading: fs(18),
    body: fs(15),
    caption: fs(13),
    micro: fs(11),
} as const;

/**
 * Letter-spacing tokens, in em (DS --ls-* scale). RN `letterSpacing` is
 * absolute points, so consumers multiply by the font size: `em * size`.
 * Arabic (Cairo) does not tolerate tracking — callers pass 0 for AR.
 */
export const letterSpacing = {
    tight: -0.02, // --ls-tight  (display / h1 / h2)
    snug: -0.01, // --ls-snug   (h3 / subtitles)
    normal: 0, // --ls-default
    wide: 0.06, // --ls-wide
    eyebrow: 0.18, // --ls-eyebrow (uppercase section labels)
} as const;

export const fontWeights: Record<
    'regular' | 'medium' | 'semibold' | 'bold',
    FontWeight
> = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
};

export type FontSizes = typeof fontSizes;
export type FontWeights = typeof fontWeights;
export type LetterSpacing = typeof letterSpacing;
