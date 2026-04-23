import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme, type AppTheme } from '@themes/index';

export interface AppSkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
}

export const AppSkeleton: React.FC<AppSkeletonProps> = ({
  width = '100%',
  height = 12,
  radius,
  style,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width: width as ViewStyle['width'],
          height: height as ViewStyle['height'],
          borderRadius: radius ?? theme.radius.s,
          opacity,
        },
        style as ViewStyle,
      ]}
    />
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    base: {
      backgroundColor: theme.colors.muted,
    },
  });

interface SkeletonViewProps {
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

export const AppSkeletonGroup: React.FC<SkeletonViewProps> = ({ style, children }) => (
  <View style={style}>{children}</View>
);
