/**
 * BillBook Pill Badge Component
 * Displays status indicators and tags with Light & Dark theme support
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from './fonts';

export const Badge = ({
  label,
  variant = 'neutral', // 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'
  size = 'md', // 'sm' | 'md'
  style,
  textStyle,
}) => {
  const { colors, isDark } = useTheme();

  const getBadgeStyle = () => {
    switch (variant) {
      case 'success':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
          text: isDark ? '#34D399' : '#059669',
        };
      case 'warning':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB',
          text: isDark ? '#FBBF24' : '#D97706',
        };
      case 'danger':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
          text: isDark ? '#F87171' : '#DC2626',
        };
      case 'info':
        return {
          bg: isDark ? 'rgba(6, 182, 212, 0.2)' : '#F0F9FF',
          text: isDark ? '#38BDF8' : '#0284C7',
        };
      case 'primary':
        return {
          bg: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF',
          text: isDark ? '#A5B4FC' : '#4F46E5',
        };
      case 'neutral':
      default:
        return {
          bg: isDark ? colors.cardSecondary : '#F1F5F9',
          text: isDark ? colors.textSecondary : '#475569',
        };
    }
  };

  const currentTheme = getBadgeStyle();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: currentTheme.bg },
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        style,
      ]}
    >
      <Text
        style={[
          styles.baseText,
          { color: currentTheme.text },
          size === 'sm' ? styles.textSm : styles.textMd,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
  },
  sizeSm: {
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  sizeMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 12,
  },
});

export default Badge;
