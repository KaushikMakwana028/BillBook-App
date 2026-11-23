/**
 * BillBook Loading Component
 * Fullscreen or inline activity indicator with Light & Dark support
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from './fonts';

export const Loading = ({ message = 'Loading...', fullScreen = false }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        fullScreen && [styles.fullScreen, { backgroundColor: colors.background }],
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text style={[styles.message, { color: colors.textMuted }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    fontFamily: FONT_FAMILY,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Loading;
