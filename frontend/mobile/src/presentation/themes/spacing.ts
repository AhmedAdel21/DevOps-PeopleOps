import { ws } from '@/presentation/utils/scaling';

/**             
 * Spacing scale (4-point grid). Pre-scaled with width-scale so components                                                        
 * can read these values directly without re-scaling.                                                                             
 *
 * Source: design.pen tokens $--spacing-xs..xl                                                                                    
 */
export const spacing = {
    xs: ws(4),
    s: ws(8),
    m: ws(16),
    l: ws(24),
    xl: ws(32),
    xxl: ws(40),
} as const;

export type Spacing = typeof spacing;                                                                                             