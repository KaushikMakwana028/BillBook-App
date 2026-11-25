/**
 * BillBook Startup Loader / Splash Screen
 * Displays the full horizontal BillBook24 brand logo on initial app load
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from '../components/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const { colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    if (onFinish) {
      const timer = setTimeout(() => {
        onFinish();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Full Horizontal BillBook24 Logo */}
        <Image
          source={require('../assets/logo-full.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Modern Loader & Status */}
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Loading your business workspace...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: Math.min(SCREEN_WIDTH * 0.85, 340),
    height: 120,
    marginBottom: 40,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 12,
  },
  loadingText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
