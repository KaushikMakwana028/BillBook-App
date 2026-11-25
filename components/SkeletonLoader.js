/**
 * BillBook Skeleton Loader Component
 * Smooth 60fps pulsing placeholder loader for asynchronous data states
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) {
  const { isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  const baseColor = isDark ? '#262626' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

// Compound Helpers
SkeletonLoader.Circle = function SkeletonCircle({ size = 44, style }) {
  return <SkeletonLoader width={size} height={size} borderRadius={size / 2} style={style} />;
};

SkeletonLoader.Line = function SkeletonLine({
  width = '100%',
  height = 14,
  borderRadius = 4,
  style,
}) {
  return <SkeletonLoader width={width} height={height} borderRadius={borderRadius} style={style} />;
};

SkeletonLoader.Card = function SkeletonCard({ height = 110, style }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          height,
        },
        style,
      ]}
    >
      <View style={styles.cardHeader}>
        <SkeletonLoader.Circle size={32} />
        <SkeletonLoader.Line width="40%" height={12} />
      </View>
      <SkeletonLoader.Line width="65%" height={20} style={{ marginTop: 14 }} />
      <SkeletonLoader.Line width="30%" height={10} style={{ marginTop: 8 }} />
    </View>
  );
};

SkeletonLoader.Row = function SkeletonRow({ style }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.rowContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <SkeletonLoader.Circle size={40} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <SkeletonLoader.Line width="55%" height={14} />
        <SkeletonLoader.Line width="35%" height={10} style={{ marginTop: 6 }} />
      </View>
      <SkeletonLoader.Line width="20%" height={14} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
});
