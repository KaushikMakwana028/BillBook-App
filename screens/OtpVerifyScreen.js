/**
 * BillBook Modern 6-Box OTP Verification Screen
 * High-polish FinTech UI with BillBook's brand colors (#F58220, #0A2540)
 * Responsive spaced boxes, smooth focus state, and native API integration
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import { Icon } from '../components/Icon';
import { FONT_FAMILY } from '../components/fonts';

export function OtpVerifyScreen({ navigation, route, params: propParams, onGoBack }) {
  const { showSuccess } = useAlert();
  const params = route?.params || propParams || {};
  const {
    phone = '',
    mobile = '',
    maskedMobile = '',
    email = '',
    full_name = '',
    business_name = '',
    mode = 'login', // 'login' | 'register'
    isRegister = false,
    autoOtp = '',
  } = params;

  const targetMobile = mobile || phone || '';
  const displayPhone =
    maskedMobile ||
    (targetMobile.length === 10
      ? `+91 ${targetMobile.slice(0, 2)}••••••${targetMobile.slice(-2)}`
      : targetMobile);

  const { login, registerComplete, resendOtp, registerInitiate } = useAuth();
  const { colors, isDark } = useTheme();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  // Auto-fill OTP if provided (e.g. from backend in dev/demo mode)
  useEffect(() => {
    if (autoOtp && String(autoOtp).length === 6) {
      const digits = String(autoOtp).split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      setFocusedIndex(5);
    }
  }, [autoOtp]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleGoBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onGoBack) {
      onGoBack();
    }
  };

  // 6-digit Auto-advancing input logic
  const handleOTPChange = (value, index) => {
    setErrorMsg('');
    const cleaned = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (cleaned.length > 1) {
      // Pasted full 6-digit code
      const pasted = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      if (pasted.length === 6) {
        inputRefs.current[5]?.focus();
        setFocusedIndex(5);
        handleVerifyOTP(newOtp.join(''));
      }
      return;
    }

    newOtp[index] = cleaned.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input box
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }

    // Auto-submit when all 6 digits are populated
    if (index === 5 && cleaned) {
      const completeCode = newOtp.join('');
      if (completeCode.length === 6) {
        handleVerifyOTP(completeCode);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    }
  };

  // Submit & Verify
  const handleVerifyOTP = async (code = otp.join('')) => {
    const finalCode = (code || otp.join('')).trim();
    setErrorMsg('');

    if (finalCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      if (mode === 'register' || isRegister) {
        // Complete Registration Flow
        const payload = {
          mobile: targetMobile.trim(),
          otp: finalCode,
          full_name: (full_name || '').trim(),
          business_name: (business_name || '').trim(),
          email: (email || '').trim(),
        };

        const result = await registerComplete(payload);
        if (!result?.success) {
          setErrorMsg(result?.message || 'Invalid or expired OTP code.');
        }
      } else {
        // Complete Login Flow
        const result = await login(targetMobile.trim(), finalCode);
        if (!result?.success) {
          setErrorMsg(result?.message || 'Invalid or expired OTP code.');
        }
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setErrorMsg(
        error.response?.data?.message || error.message || 'Verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;

    setErrorMsg('');
    setResending(true);

    try {
      let res;
      if (mode === 'register' || isRegister) {
        res = await registerInitiate(email, targetMobile);
      } else {
        res = await resendOtp(targetMobile);
      }

      if (res?.status) {
        setResendTimer(30);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setFocusedIndex(0);
        showSuccess({
          title: 'Code Sent',
          message: 'A fresh verification code has been sent to your mobile.',
        });
      } else {
        setErrorMsg(res?.message || 'Failed to resend code. Please try again.');
      }
    } catch (error) {
      setErrorMsg('Network error while resending code.');
    } finally {
      setResending(false);
    }
  };

  const isOtpComplete = otp.join('').length === 6;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={handleGoBack}
              style={[
                styles.backBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Icon name="arrow-back" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Brand Logo & Title */}
          <View style={styles.brandSection}>
            <View
              style={[
                styles.logoWrapper,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#FED7AA',
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Image
                source={require('../assets/logo-b.png')}
                style={styles.brandLogoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandName, { color: colors.text }]}>BillBook</Text>
            <Text style={[styles.brandTagline, { color: colors.textMuted }]}>
              Fast & Smart Billing
            </Text>
          </View>

          {/* Main Verification Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            {/* Header info */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Verification Code
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                We sent a 6-digit code to
              </Text>
              <View
                style={[
                  styles.phoneBadge,
                  {
                    backgroundColor: isDark ? '#2D1E10' : '#FFF5ED',
                    borderColor: '#FED7AA',
                  },
                ]}
              >
                <Icon name="phone" size={13} color={colors.primary} />
                <Text style={[styles.phoneBadgeText, { color: colors.primary }]}>
                  {displayPhone}
                </Text>
              </View>
            </View>

            {/* Error Banner */}
            {errorMsg ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: isDark ? '#3E1818' : colors.dangerLight,
                    borderColor: colors.danger,
                  },
                ]}
              >
                <Icon name="alert" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* 6 OTP Input Boxes with Guaranteed Spacing */}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => {
                const isFocused = focusedIndex === index;
                const isFilled = Boolean(digit);

                return (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: isFocused
                          ? isDark
                            ? '#2D1808'
                            : '#FFF9F5'
                          : isFilled
                          ? isDark
                            ? '#221508'
                            : '#FFFBF7'
                          : colors.inputBg,
                        borderColor: isFocused
                          ? colors.primary
                          : isFilled
                          ? colors.primary
                          : colors.border,
                      },
                      isFocused && styles.otpBoxFocused,
                      isFilled && styles.otpBoxFilled,
                    ]}
                  >
                    <TextInput
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={[styles.otpInput, { color: colors.text }]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(val) => handleOTPChange(val, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex((prev) => (prev === index ? -1 : prev))}
                      selectTextOnFocus
                      textAlign="center"
                    />
                  </View>
                );
              })}
            </View>

            {/* Verify & Proceed Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                (!isOtpComplete || loading) && styles.primaryBtnDisabled,
              ]}
              onPress={() => handleVerifyOTP()}
              disabled={loading || !isOtpComplete}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.primaryBtnText}>Verify & Proceed</Text>
                  <Icon name="check" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendContainer}>
              {resendTimer > 0 ? (
                <View style={styles.timerBadge}>
                  <Text style={[styles.resendTimerText, { color: colors.textMuted }]}>
                    Resend code in{' '}
                    <Text style={{ fontWeight: '700', color: colors.primary }}>
                      {resendTimer}s
                    </Text>
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resending}
                  activeOpacity={0.7}
                  style={styles.resendBtn}
                >
                  {resending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View style={styles.resendBtnRow}>
                      <Icon name="refresh" size={15} color={colors.primary} />
                      <Text style={[styles.resendBtnText, { color: colors.primary }]}>
                        Resend Code
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Edit / Change Mobile Number Shortcut */}
            <TouchableOpacity
              onPress={handleGoBack}
              style={styles.changeNumberBtn}
              activeOpacity={0.7}
            >
              <Icon name="edit" size={13} color={colors.textMuted} />
              <Text style={[styles.changeNumberText, { color: colors.textMuted }]}>
                Incorrect number?{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Change</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    justifyContent: 'center',
  },
  topBar: {
    marginBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  brandLogoImage: {
    width: 52,
    height: 52,
  },
  brandName: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 26,
    borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    marginTop: 5,
    textAlign: 'center',
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  phoneBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    flex: 1,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  otpBox: {
    flex: 1,
    maxWidth: 44,
    minWidth: 36,
    height: 54,
    marginHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    borderWidth: 2,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  otpBoxFilled: {
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    padding: 0,
    includeFontPadding: false,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendTimerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  resendBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  changeNumberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 16,
  },
  changeNumberText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
});

export default OtpVerifyScreen;
