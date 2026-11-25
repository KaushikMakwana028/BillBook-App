/**
 * BillBook Theme Context
 * Official BillBook24 Brand Colors:
 * - Brand Vibrant Orange: #F58220
 * - Deep Corporate Navy: #0A2540
 * - Light theme active (Dark theme commented out)
 */

import React, { createContext, useContext, useState } from 'react';

// Official BillBook24 Crisp Light Palette
export const LIGHT_THEME = {
  isDark: false,
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardSecondary: '#F1F5F9',
  border: '#E2E8F0',
  borderFocus: '#F58220', // Brand Orange Focus
  text: '#0A2540',        // Deep Brand Navy Text
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#F58220',     // Official BillBook Orange
  primaryLight: '#FFF4ED',// Soft Peach/Orange Tint
  primaryGlow: 'rgba(245, 130, 32, 0.15)',
  navy: '#0A2540',        // Official BillBook Navy
  navyLight: '#EFF4F9',
  accent: '#10B981',      // Emerald Green for profits and paid status
  accentLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
  statusBar: 'dark-content',
  navBg: '#FFFFFF',
  shadow: '#0A2540',
};

/*
// DARK THEME (Commented out for now - not needed right now)
export const DARK_THEME = {
  isDark: true,
  background: '#000000',
  card: '#121212',
  cardSecondary: '#1C1C1E',
  border: '#262626',
  borderFocus: '#F58220',
  text: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textMuted: '#666666',
  primary: '#F58220',
  primaryLight: '#2A1808',
  primaryGlow: 'rgba(245, 130, 32, 0.25)',
  navy: '#0A2540',
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
*/

export const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  themeMode: 'light',
  colors: LIGHT_THEME,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [themeMode] = useState('light');
  const isDark = false;
  const colors = LIGHT_THEME;

  const setThemeMode = () => {};
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider
      value={{
        theme: 'light',
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
