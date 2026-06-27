import { Dimensions, PixelRatio } from "react-native";

const BASE_WIDTH = 390; // iPhone 14 design base
const BASE_HEIGHT = 844;

const { width: W, height: H } = Dimensions.get("window");

// Scale a size relative to screen width
export const sw = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel((W / BASE_WIDTH) * size));

// Scale a size relative to screen height
export const sh = (size: number) =>
  Math.round(PixelRatio.roundToNearestPixel((H / BASE_HEIGHT) * size));

// Scale font size (moderately — don't over-scale text)
export const sf = (size: number) => {
  const scale = W / BASE_WIDTH;
  const clamped = Math.min(scale, 1.3); // cap at 30% growth for readability
  return Math.round(PixelRatio.roundToNearestPixel(size * clamped));
};

// Useful constants
export const SCREEN_W = W;
export const SCREEN_H = H;

// True for tablets / large devices
export const isTablet = W >= 768;

// Clamp a value between min and max
export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

export default { sw, sh, sf, SCREEN_W, SCREEN_H, isTablet, clamp };
