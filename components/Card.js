/**
 * BillBook Card Container Component
 * Styled card with light/dark support, soft elevation, and optional header
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from './fonts';

export const Card = ({
  title,
  subtitle,
  rightComponent,
  children,
  style,
  contentStyle,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        isDark && styles.darkShadow,
        style,
      ]}
    >
      {(title || subtitle || rightComponent) && (
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.cardSecondary },
          ]}
        >
          <View style={styles.titleArea}>
            {title && (
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            )}
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {subtitle}
              </Text>
            )}
          </View>
          {rightComponent && (
            <View style={styles.rightArea}>{rightComponent}</View>
          )}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  darkShadow: {
    shadowOpacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
  },
  rightArea: {
    marginLeft: 12,
  },
  content: {},
});

export default Card;
