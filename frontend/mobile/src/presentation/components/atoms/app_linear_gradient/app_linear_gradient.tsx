import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import type { LinearGradientToken } from '@themes/index';

export interface GradientVector {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

/**
 * Convert a CSS gradient angle to react-native-linear-gradient
 * start/end unit points.
 *
 * CSS: `0deg` points "to top", increasing clockwise (`90deg` = to right,
 * `180deg` = to bottom). LinearGradient: points in the [0,1] box where
 * (0,0)=top-left, (1,1)=bottom-right. Direction vector for angle θ in
 * screen coords (y-down) is (sin θ, -cos θ); the line is centred on
 * (0.5,0.5) and extended ±0.5 along it.
 */
export function angleToStartEnd(angleDeg: number): GradientVector {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  // Kill float noise (sin π ≈ 1e-16) so cardinal angles return exact 0/0.5/1.
  const r = (n: number) => Math.round(n * 1e6) / 1e6;
  return {
    start: { x: r(0.5 - dx / 2), y: r(0.5 - dy / 2) },
    end: { x: r(0.5 + dx / 2), y: r(0.5 + dy / 2) },
  };
}

export interface AppLinearGradientProps {
  /** A `LinearGradientToken` from the theme (`theme.gradient.hero`, …). */
  token: LinearGradientToken;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Thin token-driven wrapper over react-native-linear-gradient. Always
 * feed it a theme gradient token — never hand-roll colors/angles at the
 * call site (keeps every gradient on-brand and flippable in dark mode).
 */
export const AppLinearGradient: React.FC<AppLinearGradientProps> = ({
  token,
  style,
  children,
}) => {
  const { start, end } = angleToStartEnd(token.angle);
  return (
    <LinearGradient
      colors={token.colors}
      locations={token.locations}
      start={start}
      end={end}
      style={style}>
      {children}
    </LinearGradient>
  );
};
