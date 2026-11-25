/**
 * BillBook Mobile Application Root
 * Wraps SafeAreaProvider, ThemeProvider & AuthProvider
 */

import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { AppNavigator } from './navigation/AppNavigator';

const MainApp = () => {
  const { isDark, colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <AlertProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </AlertProvider>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
