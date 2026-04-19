import React from 'react';
import { Image, ImageStyle, StyleSheet } from 'react-native';
import { ws } from '@/presentation/utils/scaling';

const LOGO_SOURCE = require('@assets/images/logo.png');

export interface AppLogoProps {
  /** Logo width in design pixels (scaled with ws()). Default 120. */
  width?: number;
  /** Logo height in design pixels (scaled with ws()). Default 120. */
  height?: number;
  style?: ImageStyle;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  width = 120,
  height = 120,
  style,
}) => {
  return (
    <Image
      source={LOGO_SOURCE}
      resizeMode="contain"
      style={[styles.base, { width: ws(width), height: ws(height) }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="DevOps PeopleOps logo"
    />
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'center',
  },
});
