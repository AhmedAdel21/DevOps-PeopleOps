import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (iPhone 14 Pro)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

/**
 * Width scale — for horizontal dimensions: padding-x, margin-x, width, borderRadius, icon size
 */
export function ws(size: number): number {
  return Math.round(size * widthScale);
}

/**
 * Height scale — for vertical dimensions: padding-y, margin-y, height
 */
export function hs(size: number): number {
  return Math.round(size * heightScale);
}

/**
 * Font scale — for all font sizes. Uses moderate scaling to avoid extremes.
 */
export function fs(size: number): number {
  const scale = (widthScale + heightScale) / 2;
  const moderateScale = 0.5;
  return Math.round(size + (scale - 1) * size * moderateScale);
}
