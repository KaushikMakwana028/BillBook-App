/**
 * BillBook Ultra-Modern 6-Box OTP Verification Screen
 * Features:
 * - 6 distinct auto-advancing PIN input boxes
 * - Pure AMOLED Black & Clean Light theme support
 * - Vector icons (No emojis)
 * - Rock-solid keyboard and focus stability
 * - Real Urbanist typography
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Card, OtpInput, Icon } from '../components';
import { FONT_FAMILY } from '../components/fonts';

export const OtpScreen = ({ params = {}, onGoBack }) => {
  const {
    mobile = '',
    mode = 'login', // 'login' | 'register'
    email = '',
    full_name = '',
    business_name = '',
    autoOtp = '',
  } = params;

  const { login, registerComplete, resendOtp, registerInitiate } = useAuth();
  const { colors, isDark } = useTheme();

  const [otp, setOtp] = useState(autoOtp ? String(autoOtp) : '');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // 30-second Countdown Timer
  useEffect(() => {
    let timer = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Handle Verify & Submit
  const handleVerify = async (codeToVerify) => {
    const finalCode = (codeToVerify || otp).trim();
    setErrorMsg('');

    if (!finalCode || finalCode.length < 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(mobile.trim(), finalCode);
        if (!res.success) {
          setErrorMsg(res.message || 'Invalid or expired code.');
        }
      } else {
        const payload = {
          mobile: mobile.trim(),
          otp: finalCode,
          full_name: full_name.trim(),
          business_name: business_name.trim(),
          email: email.trim(),
        };

        const res = await registerComplete(payload);
        if (!res.success) {
          setErrorMsg(res.message || 'Could not complete registration.');
        }
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      let res;
      if (mode === 'login') {
        res = await resendOtp(mobile.trim());
      } else {
        res = await registerInitiate(email.trim(), mobile.trim());
      }

      if (res?.status) {
        setCountdown(30);
        if (res?.data?.otp) {
          setOtp(String(res.data.otp));
        }
        Alert.alert('Code Sent', res.message || 'A new 6-digit code was sent to your phone.');
      } else {
        setErrorMsg(res?.message || 'Failed to resend code.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error resending code.');
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
      {/* Top Bar with Back Action */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onGoBack}
          style={[
            styles.backButton,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <Icon name="arrow-left" size={14} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.text }]}>
            {mode === 'login' ? 'Change Phone' : 'Edit Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hero Icon Badge */}
      <View style={styles.heroSection}>
        <View
          style={[
            styles.badgeOuterRing,
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
              styles.badgeInner,
              { backgroundColor: isDark ? colors.cardSecondary : '#FFFFFF' },
            ]}
          >
            <Icon name="lock" size={30} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Verification Code
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Please enter the 6-digit code sent to
        </Text>
        <View
          style={[
            styles.phonePill,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#F1F5F9',
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.phoneText, { color: colors.text }]}>
            +91 {mobile}
          </Text>
        </View>
      </View>

      {/* Modern Card with 6 PIN Boxes */}
      <Card style={styles.card}>
        {/* Error Message */}
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

        {/* Info Notice */}
        {!!infoMsg && (
          <View
            style={[
              styles.infoBanner,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[styles.infoBannerText, { color: colors.primary }]}
            >
              {infoMsg}
            </Text>
          </View>
        )}

        <Text
          style={[
            styles.inputLabel,
            { color: colors.textSecondary },
          ]}
        >
          ENTER 6-DIGIT CODE
        </Text>

        {/* 6 Individual Auto-advancing Digit Boxes */}
        <OtpInput
          codeLength={6}
          value={otp}
          onChangeCode={(code) => setOtp(code)}
          onCodeFilled={(code) => handleVerify(code)}
          disabled={loading}
          autoFocus
        />

        <Button
          title={
            mode === 'login'
              ? 'Verify & Sign In'
              : 'Verify & Finish Registration'
          }
          onPress={() => handleVerify(otp)}
          loading={loading}
          size="lg"
          style={styles.verifyBtn}
        />

        {/* Resend Link & Timer */}
        <View style={styles.resendContainer}>
          <Text style={[styles.resendPrompt, { color: colors.textMuted }]}>
            Didn't receive code?{' '}
          </Text>
          <TouchableOpacity
            disabled={countdown > 0 || loading}
            onPress={handleResend}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.resendLink,
                {
                  color:
                    countdown > 0 ? colors.textMuted : colors.primary,
                },
              ]}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Trust Badge Footer */}
      <View style={styles.footerNote}>
        <Text style={[styles.footerNoteText, { color: colors.textMuted }]}>
          Encrypted authentication session
        </Text>
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
    paddingTop: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  backText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 26,
  },
  badgeOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeInner: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  phoneText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  card: {
    padding: 24,
    borderRadius: 24,
  },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  verifyBtn: {
    marginTop: 12,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  resendPrompt: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
  },
  resendLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
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
    textAlign: 'center',
  },
  infoBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  footerNote: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerNoteText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default OtpScreen;
