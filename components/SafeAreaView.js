/**
 * Zero-flicker SafeAreaView wrapper
 * Uses pre-measured SafeAreaProvider insets synchronously on Frame 1
 * to prevent Fabric NativeSafeAreaView mount jumps/shakes during screen transitions.
 */

import React, { useMemo } from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_EDGES = ['top', 'right', 'bottom', 'left'];

export function SafeAreaView({
  children,
  style,
  edges = DEFAULT_EDGES,
  ...rest
}) {
  const insets = useSafeAreaInsets();

  const insetStyle = useMemo(() => {
    const edgeSet = Array.isArray(edges)
      ? edges
      : Object.keys(edges || {}).filter((k) => edges[k] && edges[k] !== 'off');

    const fallbackTop =
      Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
    const topInset = insets.top > 0 ? insets.top : fallbackTop;

    const padding = {};
    if (edgeSet.includes('top')) padding.paddingTop = topInset;
    if (edgeSet.includes('bottom')) padding.paddingBottom = insets.bottom;
    if (edgeSet.includes('left')) padding.paddingLeft = insets.left;
    if (edgeSet.includes('right')) padding.paddingRight = insets.right;
    return padding;
  }, [edges, insets.top, insets.bottom, insets.left, insets.right]);

  return (
    <View style={[insetStyle, style]} {...rest}>
      {children}
    </View>
  );
}

export default SafeAreaView;
