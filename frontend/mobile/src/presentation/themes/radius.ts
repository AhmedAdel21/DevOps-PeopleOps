import { ws } from '@/presentation/utils/scaling';

/**
 * Border-radius scale. Pre-scaled with width-scale (except `pill` which                                                          
 * stays at 9999 to always produce a fully-rounded shape).                                                                        
 *                                                                                                                                
 * Source: design.pen tokens $--radius-none..pill                                                                                 
 */
/**
 * Surgical / least-churn (locked decision): legacy names keep their
 * ORIGINAL values so nothing changes shape at Phase 1 — the 23 screens
 * render identically. The DS scale is added on top under DS-named keys;
 * components opt into the rounder DS radii during the Phase 4 pass
 * (e.g. cards move `radius.l` 12 -> `radius.lg` 20).
 *
 * Source: design_system/colors_and_type.css (--radius-xs..2xl, pill).
 */
export const radius = {
    none: 0,

    // --- Legacy scale (unchanged — pre-migration values) ---
    s: ws(4),
    m: ws(8),
    l: ws(12),
    xl: ws(16),

    // --- DS scale (additive — migrate components onto these in Phase 4) ---
    xs: ws(6),   // DS --radius-xs
    md: ws(14),  // DS --radius-md  (default for inputs / most surfaces)
    lg: ws(20),  // DS --radius-lg  (cards)
    xxl: ws(36), // DS --radius-2xl (hero / feature cards)

    pill: 9999,  // DS --radius-pill (buttons, chips)
} as const;

export type Radius = typeof radius;
