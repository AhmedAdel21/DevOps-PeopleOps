import { fs } from '@/presentation/utils/scaling';
import type { AppTheme } from './light.theme';

export const darkTheme: AppTheme = {
  dark: true,
  colors: {
    primary: '#F06A45',
    primaryDark: '#E8522A',
    secondary: '#A3B8D9',
    secondaryLight: '#7A94BF',

    background: '#111827',
    surface: '#1F2937',
    card: '#1F2937',
    border: '#374151',
    divider: '#1F2937',

    status: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      neutral: '#9CA3AF',
      info: '#3B82F6',
    },

    text: {
      primary: '#F9FAFB',
      secondary: '#9CA3AF',
      disabled: '#4B5563',
      inverse: '#111827',
    },
  },
  typography: {
    sizes: {
      display: fs(32),
      heading: fs(22),
      subheading: fs(18),
      body: fs(15),
      caption: fs(13),
      micro: fs(11),
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};
