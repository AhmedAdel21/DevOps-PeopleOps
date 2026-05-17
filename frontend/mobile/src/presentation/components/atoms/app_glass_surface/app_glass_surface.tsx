import React, { useMemo } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useTheme, type AppTheme } from '@themes/index';

export type AppGlassVariant = 'light' | 'onBrand';

export interface AppGlassSurfaceProps {
  /** `light` over the page wash; `onBrand` over indigo/gradient. */
  variant?: AppGlassVariant;
  /** Heavier fill + blur (DS `*-strong` tokens). */
  strong?: boolean;
  /** Corner radius. Defaults to the DS card radius (`radius.lg`). */
  radius?: number;
  /** Layout style for the content area (padding, size, …). */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * DS glassmorphism surface. iOS gets a real backdrop blur; Android uses
 * the DS-prescribed higher-opacity translucent fill instead (locked
 * decision — community/blur is inconsistent on Android). Both keep the
 * hairline stroke, indigo-tinted shadow, and radius so glass still reads
 * as glass either way. Always pair with a colourful/gradient background
 * behind it (page wash or indigo) — that's where the effect lives.
 */
export const AppGlassSurface: React.FC<AppGlassSurfaceProps> = ({
  variant = 'light',
  strong = false,
  radius,
  style,
  children,
}) => {
  const { theme } = useTheme();
  const r = radius ?? theme.radius.lg;
  const tokens = useMemo(
    () => resolveGlass(theme, variant, strong),
    [theme, variant, strong],
  );

  return (
    <View
      style={[
        theme.shadow.md,
        { borderRadius: r },
      ]}>
      <View
        style={[
          {
            borderRadius: r,
            borderWidth: 1,
            borderColor: tokens.stroke,
            overflow: 'hidden',
            // Android fallback: opaque-ish fill stands in for live blur.
            backgroundColor:
              Platform.OS === 'android' ? tokens.androidFill : tokens.fill,
          },
          style,
        ]}>
        {Platform.OS === 'ios' && (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={theme.dark ? 'dark' : 'light'}
            blurAmount={tokens.blur}
            reducedTransparencyFallbackColor={tokens.fill}
          />
        )}
        {children}
      </View>
    </View>
  );
};

function resolveGlass(
  theme: AppTheme,
  variant: AppGlassVariant,
  strong: boolean,
) {
  const g = theme.glass;
  const onBrand = variant === 'onBrand';
  return {
    fill: onBrand
      ? strong
        ? g.fillOnBrandStrong
        : g.fillOnBrand
      : strong
        ? g.fillStrong
        : g.fill,
    // Android has no live blur — always use the stronger fill so the
    // surface still reads as a distinct panel (DS +opacity fallback).
    androidFill: onBrand ? g.fillOnBrandStrong : g.fillStrong,
    stroke: onBrand ? g.strokeOnBrand : g.stroke,
    blur: strong ? g.blurStrong : g.blur,
  };
}
