/**
 * BillBook Mobile Application Root
 * Wraps SafeAreaProvider, ThemeProvider & AuthProvider
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppNavigator } from './navigation/AppNavigator';

const MainApp = () => {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
