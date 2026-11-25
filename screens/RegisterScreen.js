/**
 * BillBook Modern Registration Screen
 * Styled in high-polish Divya Shakti UI pattern with BillBook's brand colors & native API
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import { Icon } from '../components/Icon';
import { FONT_FAMILY } from '../components/fonts';

const TERMS_URL = 'https://billbook.visiontechnolabs.com/terms';
const PRIVACY_URL = 'https://billbook.visiontechnolabs.com/privacy';

export function RegisterScreen({ navigation, onNavigateToLogin, onNavigateToOtp }) {
  const { registerInitiate } = useAuth();
  const { colors, isDark } = useTheme();
  const { showAlert, showConfirm } = useAlert();

  const [form, setForm] = useState({
    fullName: '',
    businessName: '',
    mobile: '',
    email: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const updateForm = (key, value) => {
    setErrorMsg('');
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const navigateToLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else if (navigation?.navigate) {
      navigation.navigate('Login');
    }
  };

  const navigateToOtp = (params) => {
    if (onNavigateToOtp) {
      onNavigateToOtp(params);
    } else if (navigation?.navigate) {
      navigation.navigate('OtpVerify', params);
    }
  };

  const isValid =
    form.fullName.trim().length >= 2 &&
    form.businessName.trim().length >= 2 &&
    form.mobile.trim().length === 10 &&
    form.email.trim().includes('@');

  const handleRegister = async () => {
    setErrorMsg('');
    const cleanMobile = form.mobile.trim().replace(/[^0-9]/g, '');
    const cleanEmail = form.email.trim();
    const cleanFullName = form.fullName.trim();
    const cleanBusiness = form.businessName.trim();

    if (!cleanFullName) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!cleanBusiness) {
      setErrorMsg('Please enter your business or shop name.');
      return;
    }
    if (cleanMobile.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const result = await registerInitiate(cleanEmail, cleanMobile);

      if (result?.status) {
        navigateToOtp({
          phone: cleanMobile,
          mobile: cleanMobile,
          maskedMobile: `+91 ${cleanMobile.slice(0, 2)}••••••${cleanMobile.slice(-2)}`,
          email: cleanEmail,
          full_name: cleanFullName,
          business_name: cleanBusiness,
          isRegister: true,
          mode: 'register',
          autoOtp: result?.data?.otp || '',
        });
      } else {
        const msg = result?.message || 'Registration failed to send verification OTP.';
        if (msg.toLowerCase().includes('already registered')) {
          showConfirm({
            title: 'Account Exists',
            message: msg,
            type: 'info',
            confirmText: 'Sign In',
            cancelText: 'Cancel',
            onConfirm: navigateToLogin,
          });
        } else {
          setErrorMsg(msg);
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
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
              Create your business billing account in 1 minute
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
            <Text style={[styles.cardTitle, { color: colors.text }]}>Create Account 🚀</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              Enter your details to get started
            </Text>

            {/* Error Banner */}
            {errorMsg ? (
              <View style={[styles.errorBox, { backgroundColor: isDark ? '#3E1818' : colors.dangerLight, borderColor: colors.danger }]}>
                <Icon name="alert" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: form.fullName.trim() ? colors.primary : colors.inputBorder,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={colors.textMuted}
                  value={form.fullName}
                  onChangeText={(val) => updateForm('fullName', val)}
                />
              </View>
            </View>

            {/* Business Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Business / Shop Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: form.businessName.trim() ? colors.primary : colors.inputBorder,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. Acme Electronics"
                  placeholderTextColor={colors.textMuted}
                  value={form.businessName}
                  onChangeText={(val) => updateForm('businessName', val)}
                />
              </View>
            </View>

            {/* Mobile Number Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mobile Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: form.mobile.length === 10 ? colors.primary : colors.inputBorder,
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
                  value={form.mobile}
                  onChangeText={(val) => updateForm('mobile', val.replace(/[^0-9]/g, ''))}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: form.email.includes('@') ? colors.primary : colors.inputBorder,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. contact@business.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(val) => updateForm('email', val)}
                />
              </View>
            </View>

            {/* Register Submit Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                loading && styles.primaryBtnDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.primaryBtnText}>Verify & Continue</Text>
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

            {/* Sign In Link */}
            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  borderColor: isDark ? colors.border : colors.borderFocus,
                  backgroundColor: isDark ? colors.cardSecondary : colors.primaryLight,
                },
              ]}
              onPress={navigateToLogin}
              activeOpacity={0.75}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            By creating an account, you agree to our{' '}
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
    marginBottom: 20,
  },
  logoWrapper: {
    width: 74,
    height: 74,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  brandLogoImage: {
    width: 62,
    height: 62,
  },
  brandName: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
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
    marginBottom: 20,
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
    marginBottom: 18,
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
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    height: 50,
    overflow: 'hidden',
    paddingHorizontal: 12,
  },
  countryCode: {
    paddingRight: 10,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 22,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
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
    marginTop: 6,
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
    marginVertical: 16,
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

export default RegisterScreen;
