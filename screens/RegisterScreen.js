/**
 * BillBook Ultra-Modern Registration Screen
 * Collects User and Business Profile details
 * Pure AMOLED Black & Light theme support with stable input focus
 */

import React, { useState, useRef } from 'react';
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

export const RegisterScreen = ({ onNavigateToLogin, onNavigateToOtp }) => {
  const { registerInitiate } = useAuth();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const bizRef = useRef(null);
  const emailRef = useRef(null);
  const mobileRef = useRef(null);

  // Validate & Proceed to OTP Screen
  const handleProceed = async () => {
    setErrorMsg('');

    const cleanEmail = email.trim();
    const cleanMobile = mobile.trim();
    const cleanFullName = fullName.trim();
    const cleanBiz = businessName.trim();

    if (!cleanFullName) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!cleanBiz) {
      setErrorMsg('Please enter your business or shop name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (cleanMobile.length !== 10 || !/^\d+$/.test(cleanMobile)) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerInitiate(cleanEmail, cleanMobile);
      if (res?.status) {
        if (onNavigateToOtp) {
          onNavigateToOtp({
            mobile: cleanMobile,
            email: cleanEmail,
            full_name: cleanFullName,
            business_name: cleanBiz,
            mode: 'register',
            autoOtp: res?.data?.otp || '',
          });
        }
      } else {
        setErrorMsg(res?.message || 'Registration initiation failed.');
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
      {/* Hero Section */}
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
            <Icon name="briefcase" size={30} color={colors.primary} />
          </View>
        </View>

        <Text style={[styles.appName, { color: colors.text }]}>
          Create Account
        </Text>
        <Text style={[styles.appTagline, { color: colors.textMuted }]}>
          Manage inventory, GST billing & invoices in one place
        </Text>
      </View>

      {/* Form Card */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Business Profile
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            Fill in your details to set up your dashboard
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
          label="Your Full Name"
          required
          placeholder="e.g. Kaushik Patel"
          value={fullName}
          onChangeText={setFullName}
          returnKeyType="next"
          onSubmitEditing={() => bizRef.current?.focus()}
        />

        <Input
          inputRef={bizRef}
          label="Business / Store Name"
          required
          placeholder="e.g. Vision Electronics"
          value={businessName}
          onChangeText={setBusinessName}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />

        <Input
          inputRef={emailRef}
          label="Email Address"
          required
          placeholder="owner@business.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
          onSubmitEditing={() => mobileRef.current?.focus()}
        />

        <Input
          inputRef={mobileRef}
          label="Mobile Number"
          required
          prefix="+91"
          placeholder="Enter 10-digit number"
          keyboardType="number-pad"
          maxLength={10}
          value={mobile}
          onChangeText={(text) => setMobile(text.replace(/\D/g, ''))}
          helperText="OTP will be sent to this phone number"
          returnKeyType="done"
          onSubmitEditing={handleProceed}
        />

        <Button
          title="Continue to Verification"
          onPress={handleProceed}
          loading={loading}
          size="lg"
          style={styles.actionBtn}
        />
      </Card>

      {/* Switch to Login */}
      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Already registered?{' '}
        </Text>
        <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
          <Text style={[styles.loginLink, { color: colors.primary }]}>
            Sign In
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
    paddingTop: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoOuterGlow: {
    width: 76,
    height: 76,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoBadge: {
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
  appName: {
    fontFamily: FONT_FAMILY,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    padding: 24,
    borderRadius: 24,
  },
  cardHeader: {
    marginBottom: 18,
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
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default RegisterScreen;
