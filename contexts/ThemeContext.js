/**
 * BillBook Theme Context
 * System theme auto-detection (Light / Pure Pitch Black Dark) & Manual Theme Switcher
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// In-memory fallback if AsyncStorage is not yet linked
const memoryStore = {};
let storageModule = null;

try {
  storageModule = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  storageModule = {
    getItem: async (key) => memoryStore[key] || null,
    setItem: async (key, val) => {
      memoryStore[key] = val;
    },
    removeItem: async (key) => {
      delete memoryStore[key];
    },
  };
}

const THEME_STORAGE_KEY = 'billbook_theme_mode';

// Ultra-clean Crisp Light Palette
export const LIGHT_THEME = {
  isDark: false,
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardSecondary: '#F1F5F9',
  border: '#E2E8F0',
  borderFocus: '#4F46E5',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  primaryGlow: 'rgba(79, 70, 229, 0.15)',
  accent: '#10B981',
  accentLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
  statusBar: 'dark-content',
  navBg: '#FFFFFF',
  shadow: '#0F172A',
};

// Pure Pitch Black AMOLED Dark Palette (No Dark Blue)
export const DARK_THEME = {
  isDark: true,
  background: '#000000',
  card: '#121212',
  cardSecondary: '#1C1C1E',
  border: '#262626',
  borderFocus: '#6366F1',
  text: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textMuted: '#666666',
  primary: '#6366F1',
  primaryLight: '#1E1B4B',
  primaryGlow: 'rgba(99, 102, 241, 0.25)',
  accent: '#10B981',
  accentLight: '#064E3B',
  warning: '#F59E0B',
  warningLight: '#78350F',
  danger: '#EF4444',
  dangerLight: '#7F1D1D',
  inputBg: '#141414',
  inputBorder: '#282828',
  statusBar: 'light-content',
  navBg: '#000000',
  shadow: '#000000',
};

export const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  themeMode: 'system',
  colors: LIGHT_THEME,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState('system');

  // Restore saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await storageModule.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setThemeModeState(saved);
        }
      } catch (e) {}
    };
    loadTheme();
  }, []);

  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    try {
      await storageModule.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {}
  };

  const toggleTheme = () => {
    const active = activeTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(active);
  };

  // Resolve current active theme
  const activeTheme = themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;
  const isDark = activeTheme === 'dark';
  const colors = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        isDark,
        themeMode,
        colors,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
