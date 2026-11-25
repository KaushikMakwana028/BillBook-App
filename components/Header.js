/**
 * BillBook Universal Header Component
 * Clean, modern navigation header with back button, screen title, right action & badge
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { FONT_FAMILY } from './fonts';

export default function Header({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightIcon,
  onRightPress,
  badgeCount = 0,
  // Set true ONLY if the screen does not already handle the top safe area
  safeArea = false,
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const topPadding = safeArea ? insets.top + 6 : 8;
  const surface = isDark ? colors.card : '#FFFFFF';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: topPadding,
          backgroundColor: surface,
          shadowColor: isDark ? '#000000' : '#0F172A',
          shadowOpacity: isDark ? 0.35 : 0.08,
        },
      ]}
    >
      {/* Left Area (Back Button if showBack is true) */}
      {showBack ? (
        <TouchableOpacity
          onPress={onBackPress}
          activeOpacity={0.7}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
              borderColor: colors.border,
            },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      ) : null}

      {/* Center / Main Title & Subtitle */}
      <View style={[styles.center, !showBack && styles.centerNoBack]}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {subtitle ? (
          <View style={styles.subtitleRow}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text
              style={[styles.subtitle, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Right Area (Action Icon or Badge) */}
      {Boolean(rightIcon) ? (
        <TouchableOpacity
          onPress={onRightPress}
          activeOpacity={0.85}
          style={[
            styles.actionBtn,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name={rightIcon} size={20} color="#FFFFFF" />
          {badgeCount > 0 ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark ? '#FFFFFF' : colors.text,
                  borderColor: surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isDark ? colors.primary : '#FFFFFF' },
                ]}
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
  },
  center: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  centerNoBack: {
    paddingLeft: 4,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    fontWeight: '500',
    flexShrink: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
  },
});