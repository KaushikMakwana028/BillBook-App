/**
 * BillBook Animated Bottom Navigation Bar
 * High-precision tab switcher with spring indicator animations & badges
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { FONT_FAMILY } from './fonts';

export const DEFAULT_TABS = [
  { name: 'Home', icon: 'home', label: 'Home' },
  { name: 'Sales', icon: 'receipt', label: 'Invoices' },
  { name: 'Products', icon: 'box', label: 'Products' },
  { name: 'Parties', icon: 'users', label: 'Parties' },
  { name: 'Profile', icon: 'user', label: 'Profile' },
];

function TabItem({
  tab,
  isFocused,
  badge,
  onPress,
  colors,
}) {
  const progress = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: isFocused ? 1 : 0,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [isFocused, progress]);

  const indicatorScaleX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  });

  const indicatorOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const iconScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const iconTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  const activeColor = colors.primary;
  const inactiveColor = colors.textMuted;
  const currentIconColor = isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tabItem, pressed && styles.tabPressed]}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={tab.label}
    >
      {/* Top indicator bar */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            backgroundColor: activeColor,
            opacity: indicatorOpacity,
            transform: [{ scaleX: indicatorScaleX }],
          },
        ]}
      />

      {/* Icon with scale and lift animation */}
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [
              { scale: iconScale },
              { translateY: iconTranslateY },
            ],
          },
        ]}
      >
        <Icon name={tab.icon} size={22} color={currentIconColor} />

        {/* Optional Badge */}
        {badge !== undefined && badge !== null && badge > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.card }]}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        ) : null}
      </Animated.View>

      {/* Label */}
      <Text
        style={[
          styles.label,
          {
            color: currentIconColor,
            fontWeight: isFocused ? '700' : '500',
          },
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

export default function BottomBar({
  currentTab = 'Home',
  onTabChange,
  tabs = DEFAULT_TABS,
  badges = {},
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8),
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.content}>
        {tabs.map((tab) => {
          const isFocused = currentTab === tab.name;
          return (
            <TabItem
              key={tab.name}
              tab={tab}
              isFocused={isFocused}
              badge={badges[tab.name]}
              onPress={() => {
                if (onTabChange) onTabChange(tab.name);
              }}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 4,
    elevation: 12,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  tabPressed: {
    opacity: 0.8,
  },
  indicator: {
    position: 'absolute',
    top: -4,
    left: '20%',
    right: '20%',
    height: 3,
    borderRadius: 2,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 3,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    letterSpacing: 0.1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
  },
  badgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
