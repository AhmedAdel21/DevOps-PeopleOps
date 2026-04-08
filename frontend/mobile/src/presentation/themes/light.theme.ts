import { TextStyle } from 'react-native';
import { fs } from '@/presentation/utils/scaling';

type FontWeight = TextStyle['fontWeight'];

export interface AppTheme {
  dark: boolean;
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    background: string;
    surface: string;
    card: string;
    border: string;
    divider: string;
    status: {
      success: string;
      warning: string;
      error: string;
      neutral: string;
      info: string;
    };
    text: {
      primary: string;
      secondary: string;
      disabled: string;
      inverse: string;
    };
  };
  typography: {
    sizes: {
      display: number;
      heading: number;
      subheading: number;
      body: number;
      caption: number;
      micro: number;
    };
    weights: {
      regular: FontWeight;
      medium: FontWeight;
      semibold: FontWeight;
      bold: FontWeight;
    };
  };
}

export const lightTheme: AppTheme = {
  dark: false,
  colors: {
    primary: '#E8522A',
    primaryDark: '#C4421F',
    secondary: '#1B2A4A',
    secondaryLight: '#2A3F6A',

    background: '#F8F9FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E5E7EB',
    divider: '#F3F4F6',

    status: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      neutral: '#9CA3AF',
      info: '#3B82F6',
    },

    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#D1D5DB',
      inverse: '#FFFFFF',
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
