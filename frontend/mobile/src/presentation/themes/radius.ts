import { ws } from '@/presentation/utils/scaling';

/**
 * Border-radius scale. Pre-scaled with width-scale (except `pill` which                                                          
 * stays at 9999 to always produce a fully-rounded shape).                                                                        
 *                                                                                                                                
 * Source: design.pen tokens $--radius-none..pill                                                                                 
 */
export const radius = {
    none: 0,
    s: ws(4),
    m: ws(8),
    l: ws(12),
    xl: ws(16),
    pill: 9999,
} as const;

export type Radius = typeof radius;
