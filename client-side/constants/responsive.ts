import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base dimensions (design reference - typically iPhone 14/15 or similar)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Scale factor based on screen width
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

/**
 * Width percentage - scales based on screen width
 * @param widthPercent - percentage of screen width (0-100)
 */
export const wp = (widthPercent: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * widthPercent) / 100);
};

/**
 * Height percentage - scales based on screen height
 * @param heightPercent - percentage of screen height (0-100)
 */
export const hp = (heightPercent: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * heightPercent) / 100);
};

/**
 * Font scale - scales font size based on screen width with moderation
 * @param size - base font size
 */
export const fp = (size: number): number => {
  const scale = widthScale;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Moderate scale - scales with a factor for more controlled scaling
 * Good for padding, margins, and element sizes
 * @param size - base size
 * @param factor - scaling factor (0-1, default 0.5)
 */
export const ms = (size: number, factor: number = 0.5): number => {
  return size + (widthScale - 1) * size * factor;
};

/**
 * Spacing scale - for consistent spacing throughout the app
 * @param size - base spacing size
 */
export const sp = (size: number): number => {
  return Math.round(ms(size, 0.3));
};

/**
 * Border radius scale
 * @param radius - base radius
 */
export const br = (radius: number): number => {
  return Math.round(ms(radius, 0.3));
};

/**
 * Icon size scale
 * @param size - base icon size
 */
export const iconSize = (size: number): number => {
  return Math.round(ms(size, 0.4));
};

/**
 * Check if device is a small screen (< 375px width)
 */
export const isSmallDevice = SCREEN_WIDTH < 375;

/**
 * Check if device is a large screen (> 414px width)
 */
export const isLargeDevice = SCREEN_WIDTH > 414;

/**
 * Get responsive value based on device size
 * @param small - value for small devices
 * @param medium - value for medium devices
 * @param large - value for large devices
 */
export const responsiveValue = <T>(small: T, medium: T, large: T): T => {
  if (isSmallDevice) return small;
  if (isLargeDevice) return large;
  return medium;
};

// Export screen dimensions
export { SCREEN_WIDTH, SCREEN_HEIGHT };
