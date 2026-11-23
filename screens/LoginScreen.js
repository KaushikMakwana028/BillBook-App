/**
 * BillBook Ultra-Modern Login Screen
 * Features:
 * - Pure AMOLED Black & Crisp Light Theme support
 * - Vector icon branding (No emojis)
 * - Rock-solid input focus stability
 * - Real Urbanist typography
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Input, Card, Icon } from '../components';
import { FONT_FAMILY } from '../components/fonts';

export const LoginScreen = ({ onNavigateToRegister, onNavigateToOtp }) => {
  const { sendOtp } = useAuth();
  const { colors, isDark } = useTheme();

  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Send OTP & Navigate to dedicated OtpScreen
  const handleSendOtp = async () => {
    setErrorMsg('');
    const cleanMobile = mobile.trim();

    if (!cleanMobile || cleanMobile.length !== 10 || !/^\d+$/.test(cleanMobile)) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleanMobile);
      if (res?.status) {
        if (onNavigateToOtp) {
          onNavigateToOtp({
            mobile: cleanMobile,
            mode: 'login',
            autoOtp: res?.data?.otp || '',
          });
        }
      } else {
        setErrorMsg(res?.message || 'Failed to send OTP. Please check your number.');
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Error connecting to server.'
      );
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
    >
      {/* Brand Icon Header */}
      <View style={styles.heroSection}>
        <View
          style={[
            styles.logoOuterGlow,
            {
              backgroundColor: isDark
                ? 'rgba(99, 102, 241, 0.12)'
                : 'rgba(79, 70, 229, 0.08)',
              borderColor: colors.borderFocus,
            },
          ]}
        >
          <View
            style={[
              styles.logoBadge,
              { backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF' },
            ]}
          >
            <Icon name="bill" size={32} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.appName, { color: colors.text }]}>BillBook</Text>
        <Text style={[styles.appTagline, { color: colors.textMuted }]}>
          Fast, simple & intelligent billing for modern business
        </Text>
      </View>

      {/* Form Card */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            Enter your mobile number to sign in or get started
          </Text>
        </View>

        {/* Error Banner */}
        {!!errorMsg && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: isDark
                  ? 'rgba(239, 68, 68, 0.15)'
                  : '#FEF2F2',
                borderColor: colors.danger,
              },
            ]}
          >
            <Text style={[styles.errorBannerText, { color: colors.danger }]}>
              {errorMsg}
            </Text>
          </View>
        )}

        <Input
          label="Mobile Number"
          required
          prefix="+91"
          placeholder="Enter 10-digit number"
          keyboardType="number-pad"
          maxLength={10}
          value={mobile}
          onChangeText={(text) => setMobile(text.replace(/\D/g, ''))}
          helperText="We will send a 6-digit verification code"
        />

        <Button
          title="Get One-Time Password"
          onPress={handleSendOtp}
          loading={loading}
          size="lg"
          style={styles.actionBtn}
        />
      </Card>

      {/* Switch to Register */}
      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          New to BillBook?{' '}
        </Text>
        <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7}>
          <Text style={[styles.registerLink, { color: colors.primary }]}>
            Create Free Account
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView behavior="padding" style={styles.keyboardContainer}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoOuterGlow: {
    width: 80,
    height: 80,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  appName: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  appTagline: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    padding: 24,
    borderRadius: 24,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtn: {
    marginTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
  },
  footerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
  },
  registerLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default LoginScreen;
