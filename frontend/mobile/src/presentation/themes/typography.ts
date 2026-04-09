import { TextStyle } from 'react-native';
import { fs } from '@/presentation/utils/scaling';

type FontWeight = TextStyle['fontWeight'];

/**                                                                                                                               
 * Inter font postscript names — must match the names that appear after
 * running `npx react-native-asset` (Step 2). On iOS the postscript name is                                                       
 * what `fontFamily` accepts; on Android the file basename is used.                                                               
 */
export const fontFamily = {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
} as const;

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

export const fontWeights: Record<
    'regular' | 'medium' | 'semibold' | 'bold',
    FontWeight
> = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
};

export type FontFamily = typeof fontFamily;
export type FontSizes = typeof fontSizes;
export type FontWeights = typeof fontWeights;  