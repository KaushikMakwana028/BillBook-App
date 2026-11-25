/**
 * BillBook Modern Login Screen
 * Styled in high-polish Divya Shakti UI pattern with BillBook's brand colors & native API
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import { SafeAreaView } from '../components';
import { Icon } from '../components/Icon';
import { FONT_FAMILY } from '../components/fonts';

const TERMS_URL = 'https://billbook.visiontechnolabs.com/terms';
const PRIVACY_URL = 'https://billbook.visiontechnolabs.com/privacy';

export function LoginScreen({ navigation, onNavigateToRegister, onNavigateToOtp }) {
  const { sendOtp } = useAuth();
  const { colors, isDark } = useTheme();
  const { showAlert, showConfirm } = useAlert();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const navigateToRegister = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else if (navigation?.navigate) {
      navigation.navigate('Register');
    }
  };

  const navigateToOtp = (params) => {
    if (onNavigateToOtp) {
      onNavigateToOtp(params);
    } else if (navigation?.navigate) {
      navigation.navigate('OtpVerify', params);
    }
  };

  const handleLogin = async () => {
    setErrorMsg('');
    const cleanPhone = (phoneNumber || '').trim().replace(/[^0-9]/g, '');

    if (!cleanPhone) {
      setErrorMsg('Please enter your 10-digit mobile number.');
      return;
    }

    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const result = await sendOtp(cleanPhone);

      if (result?.status) {
        navigateToOtp({
          phone: cleanPhone,
          mobile: cleanPhone,
          maskedMobile: `+91 ${cleanPhone.slice(0, 2)}••••••${cleanPhone.slice(-2)}`,
          mode: 'login',
          autoOtp: result?.data?.otp || '',
        });
      } else {
        const msg = result?.message || 'Failed to send OTP';
        if (msg.toLowerCase().includes('not registered') || msg.toLowerCase().includes('not found')) {
          showConfirm({
            title: 'Account Not Found',
            message: msg,
            type: 'warning',
            confirmText: 'Register Now',
            cancelText: 'Cancel',
            onConfirm: navigateToRegister,
          });
        } else {
          setErrorMsg(msg);
        }
      }
    } catch (error) {
      console.error('Login send OTP error:', error);
      setErrorMsg(
        error.response?.data?.message || error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(() =>
      showAlert({
        title: 'Notice',
        message: 'Unable to open link in external browser.',
        type: 'warning',
      })
    );
  };

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
          {/* Brand Section */}
          <View style={styles.brandSection}>
            <View
              style={[
                styles.logoWrapper,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? colors.borderFocus : colors.primaryLight,
                  shadowColor: colors.shadow,
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
              Smart & effortless billing for modern business
            </Text>
          </View>

          {/* Main Card */}
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
            <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome Back 👋</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              Enter your mobile number to sign in
            </Text>

            {/* Error Banner */}
            {errorMsg ? (
              <View style={[styles.errorBox, { backgroundColor: isDark ? '#3E1818' : colors.dangerLight, borderColor: colors.danger }]}>
                <Icon name="alert" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: phoneNumber.length === 10 ? colors.primary : colors.inputBorder,
                  },
                ]}
              >
                <View style={styles.countryCode}>
                  <Text style={[styles.countryCodeText, { color: colors.text }]}>+91</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={(val) => {
                    setErrorMsg('');
                    setPhoneNumber(val.replace(/[^0-9]/g, ''));
                  }}
                />
              </View>
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                loading && styles.primaryBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.primaryBtnText}>Send OTP</Text>
                  <Icon name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.orRow}>
              <View style={[styles.orLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.orText, { color: colors.textMuted }]}>or</Text>
              <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Register Link */}
            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  borderColor: isDark ? colors.border : colors.borderFocus,
                  backgroundColor: isDark ? colors.cardSecondary : colors.primaryLight,
                },
              ]}
              onPress={navigateToRegister}
              activeOpacity={0.75}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                Create New Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            By continuing, you agree to our{' '}
            <Text style={[styles.footerLink, { color: colors.primary }]} onPress={() => openLink(TERMS_URL)}>
              Terms
            </Text>
            {' '}&{' '}
            <Text style={[styles.footerLink, { color: colors.primary }]} onPress={() => openLink(PRIVACY_URL)}>
              Privacy Policy
            </Text>
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  brandLogoImage: {
    width: 68,
    height: 68,
  },
  brandName: {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    marginBottom: 24,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    height: 52,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 24,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    paddingHorizontal: 12,
    height: '100%',
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
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginHorizontal: 12,
    textTransform: 'uppercase',
  },
  secondaryBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
  footerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
