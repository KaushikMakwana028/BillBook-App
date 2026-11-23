/**
 * BillBook Main Application Navigator
 * Manages screen routing between Authentication (Login / Register / Otp) and Authenticated App (Home)
 * Full Light & Dark theme support
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { setNavigationHandler } from './navigationRef';
import { FONT_FAMILY } from '../components/fonts';
import { Icon } from '../components/Icon';

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();

  const [currentScreen, setCurrentScreen] = useState('Login');
  const [screenParams, setScreenParams] = useState({});

  // Bind custom navigation handler to navigationRef
  useEffect(() => {
    setNavigationHandler({
      navigate: (screenName, params = {}) => {
        setCurrentScreen(screenName);
        setScreenParams(params);
      },
      goBack: () => {
        if (currentScreen === 'Otp') {
          setCurrentScreen(screenParams.mode === 'register' ? 'Register' : 'Login');
        } else if (currentScreen === 'Register') {
          setCurrentScreen('Login');
        }
      },
      reset: (screenName, params = {}) => {
        setCurrentScreen(screenName);
        setScreenParams(params);
      },
    });
  }, [currentScreen, screenParams]);

  // Loading / Session Restoration Splash
  if (isLoading) {
    return (
      <View
        style={[styles.splashContainer, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.splashBadge,
            {
              backgroundColor: isDark ? colors.card : '#EEF2FF',
              borderColor: colors.borderFocus,
            },
          ]}
        >
          <Icon name="bill" size={34} color={colors.primary} />
        </View>
        <Text style={[styles.splashTitle, { color: colors.text }]}>
          BillBook
        </Text>
        <Text style={[styles.splashSubtitle, { color: colors.textMuted }]}>
          Loading your account...
        </Text>
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={styles.splashSpinner}
        />
      </View>
    );
  }

  // Authenticated State -> Render Home
  if (isAuthenticated) {
    return (
      <HomeScreen
        params={screenParams}
        onNavigate={(screen) => {
          console.log(`[Navigation] Navigating to ${screen}`);
        }}
      />
    );
  }

  // Unauthenticated State -> Auth Stack with Single Unified OTP Screen
  if (currentScreen === 'Otp') {
    return (
      <OtpScreen
        params={screenParams}
        onGoBack={() => {
          setCurrentScreen(screenParams.mode === 'register' ? 'Register' : 'Login');
        }}
      />
    );
  }

  if (currentScreen === 'Register') {
    return (
      <RegisterScreen
        onNavigateToLogin={() => setCurrentScreen('Login')}
        onNavigateToOtp={(otpParams) => {
          setScreenParams(otpParams);
          setCurrentScreen('Otp');
        }}
      />
    );
  }

  return (
    <LoginScreen
      onNavigateToRegister={() => setCurrentScreen('Register')}
      onNavigateToOtp={(otpParams) => {
        setScreenParams(otpParams);
        setCurrentScreen('Otp');
      }}
    />
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashBadge: {
    width: 76,
    height: 76,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashIcon: {
    fontSize: 34,
  },
  splashTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  splashSpinner: {
    marginTop: 20,
  },
});

export default AppNavigator;
