/**
 * BillBook KPI StatCard Component
 * Displays key business metrics with accents, amounts, and trends
 * Light & Dark theme support
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from './fonts';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = '#4F46E5',
  style,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: accentColor,
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: colors.textMuted }]} numberOfLines={1}>
          {title}
        </Text>
        {icon && (
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: accentColor + (isDark ? '30' : '18') },
            ]}
          >
            <Text style={[styles.iconText, { color: accentColor }]}>
              {icon}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>

      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
    minWidth: '46%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  iconText: {
    fontSize: 15,
  },
  value: {
    fontFamily: FONT_FAMILY,
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
  },
});

export default StatCard;
