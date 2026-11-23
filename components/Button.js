/**
 * BillBook Reusable Button Component
 * Supports variants: primary, secondary, outline, danger, success
 * Full Light & Dark Theme dynamic styling with press animations
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from './fonts';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon = null,
  style,
  textStyle,
}) => {
  const { colors, isDark } = useTheme();

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: isDark ? colors.cardSecondary : '#0F172A',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
        };
      case 'success':
        return {
          backgroundColor: colors.accent,
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.4 : 0.3,
          shadowRadius: 10,
          elevation: 4,
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return { color: colors.primary };
      case 'secondary':
        return { color: colors.text };
      default:
        return { color: '#FFFFFF' };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  const getTextSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.textSm;
      case 'lg':
        return styles.textLg;
      case 'md':
      default:
        return styles.textMd;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        getContainerStyle(),
        getSizeStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.primary : '#FFFFFF'}
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.baseText,
              getTextStyle(),
              getTextSizeStyle(),
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  baseText: {
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  sizeSm: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  sizeMd: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  sizeLg: {
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  textSm: {
    fontSize: 13,
  },
  textMd: {
    fontSize: 15,
  },
  textLg: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
