import { ws } from '@/presentation/utils/scaling';

/**             
 * Spacing scale (4-point grid). Pre-scaled with width-scale so components                                                        
 * can read these values directly without re-scaling.                                                                             
 *
 * Source: design.pen tokens $--spacing-xs..xl                                                                                    
 */
/**
 * Legacy names (xs/s/m/l/xl/xxl) keep their original values so the 23
 * screens compile unchanged. The DS-only steps (sm=12, ml=20, xxxl=48,
 * huge=64) are added on top — locked decision: extend, don't rename.
 */
export const spacing = {
    xs: ws(4),    // DS space-1
    s: ws(8),     // DS space-2
    sm: ws(12),   // DS space-3  (new — was a gap)
    m: ws(16),    // DS space-4
    ml: ws(20),   // DS space-5  (new — was a gap)
    l: ws(24),    // DS space-6
    xl: ws(32),   // DS space-8
    xxl: ws(40),  // DS space-10
    xxxl: ws(48), // DS space-12 (new)
    huge: ws(64), // DS space-16 (new)
} as const;

export type Spacing = typeof spacing;                                                                                             