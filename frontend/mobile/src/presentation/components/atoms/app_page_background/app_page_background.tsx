import React, { useMemo } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '@themes/index';
import { AppLinearGradient } from '../app_linear_gradient';

export interface AppPageBackgroundProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * The DS page wash (`--grad-page`): a soft cool linear base with two
 * radial halos at the top corners (lavender top-left, indigo top-right;
 * desaturated in dark). Rendered as an absolute-fill behind app content
 * so screens with a transparent root sit on it.
 *
 * Locked decision: halos use react-native-svg `RadialGradient` (already
 * a dependency) — true ellipses via `rx`/`ry`, not a linear approximation.
 * Light/dark flips automatically through `theme.gradient.page`.
 */
export const AppPageBackground: React.FC<AppPageBackgroundProps> = ({
  style,
  children,
}) => {
  const { theme } = useTheme();
  const page = theme.gradient.page;

  // Each halo: a full-bleed Rect filled with its own RadialGradient that
  // fades the halo colour to fully transparent (stopOpacity 0) by its
  // last location. Stacking the rects composites the layered glow.
  const halos = useMemo(
    () =>
      page.halos.map((h, i) => ({
        id: `pageHalo${i}`,
        h,
      })),
    [page.halos],
  );

  return (
    <View style={[styles.fill, style]}>
      <AppLinearGradient token={page.base} style={styles.fill} />
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          {halos.map(({ id, h }) => (
            <RadialGradient
              key={id}
              id={id}
              cx={String(h.cx)}
              cy={String(h.cy)}
              rx={String(h.rx)}
              ry={String(h.ry)}>
              <Stop
                offset={h.locations[0]}
                stopColor={h.colors[0]}
                stopOpacity={1}
              />
              <Stop
                offset={h.locations[1] ?? 1}
                stopColor={h.colors[0]}
                stopOpacity={0}
              />
            </RadialGradient>
          ))}
        </Defs>
        {halos.map(({ id }) => (
          <Rect
            key={`${id}-rect`}
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${id})`}
          />
        ))}
      </Svg>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
