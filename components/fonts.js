/**
 * BillBook Typography & Font Family Configuration
 * Uses downloaded native TrueType fonts for Urbanist on Android/iOS/Web
 */

import { Platform } from 'react-native';

export const FONT_FAMILY = Platform.select({
  ios: 'Urbanist',
  android: 'Urbanist',
  web: '"Urbanist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  default: 'Urbanist',
});

export const FONTS = {
  regular: Platform.select({
    ios: 'Urbanist',
    android: 'Urbanist-Regular',
    default: 'Urbanist',
  }),
  medium: Platform.select({
    ios: 'Urbanist',
    android: 'Urbanist-Medium',
    default: 'Urbanist',
  }),
  semiBold: Platform.select({
    ios: 'Urbanist',
    android: 'Urbanist-SemiBold',
    default: 'Urbanist',
  }),
  bold: Platform.select({
    ios: 'Urbanist',
    android: 'Urbanist-Bold',
    default: 'Urbanist',
  }),
};

export default FONT_FAMILY;
