/**
 * BillBook Edit Profile Screen
 * Allows editing full business & personal details, including profile photo,
 * contact numbers, GSTIN, address, and social handles.
 * Fully synchronized with AuthContext and backend API.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import profileService from '../services/profileService';
import { Header, Icon, SafeAreaView } from '../components';
import { FONT_FAMILY } from '../components/fonts';
import { resolveProfileImageUrl } from '../utils/imageUrl';

export function EditProfileScreen({ navigation, onGoBack, onNavigate }) {
  const { user, updateUser, logout } = useAuth();
  const { colors } = useTheme();
  const { showAlert, showSuccess, showError, showConfirm } = useAlert();

  // Form Fields
  const [fullName, setFullName] = useState(user?.name || user?.full_name || '');
  const [businessName, setBusinessName] = useState(user?.business_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [gstin, setGstin] = useState(user?.gstin || user?.gst_number || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [facebook, setFacebook] = useState(user?.facebook || '');
  const [profileImage, setProfileImage] = useState(user?.profile_image || user?.image || '');

  // UI State
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Fetch latest profile details from API
  const fetchProfileDetails = async () => {
    setFetching(true);
    try {
      const res = await profileService.getMyProfile();
      if (res?.status && res?.data) {
        const u = res.data;
        setFullName(u.name || u.full_name || '');
        setBusinessName(u.business_name || '');
        setEmail(u.email || '');
        setMobile(u.mobile || u.phone || '');
        setAddress(u.address || '');
        setGstin(u.gstin || u.gst_number || '');
        setInstagram(u.instagram || '');
        setFacebook(u.facebook || '');
        if (u.profile_image || u.image) {
          setProfileImage(u.profile_image || u.image);
        }
        updateUser(u);
      }
    } catch {
      // Fallback to existing user object in context
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onGoBack) {
      onGoBack();
    }
  };

  const getInitials = (str) => {
    if (!str) return 'BB';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      showError({
        title: 'Full Name Required',
        message: 'Please enter your full name.',
      });
      return;
    }

    if (!businessName.trim()) {
      showError({
        title: 'Business Name Required',
        message: 'Please enter your business or store name.',
      });
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      showError({
        title: 'Valid Email Required',
        message: 'Please provide a valid email address.',
      });
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      showError({
        title: 'Invalid Mobile Number',
        message: 'Mobile number must be exactly 10 digits.',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: fullName.trim(),
        full_name: fullName.trim(),
        business_name: businessName.trim(),
        email: email.trim(),
        mobile: cleanMobile,
        address: address.trim(),
        gstin: gstin.trim(),
        instagram: instagram.trim(),
        facebook: facebook.trim(),
      };

      if (profileImage && profileImage.trim()) {
        payload.profile_image = profileImage.trim();
      }

      const res = await profileService.updateMyProfile(payload);
      if (res?.status) {
        const updatedData = res.data || payload;
        await updateUser(updatedData);

        showSuccess({
          title: 'Profile Updated 🎉',
          message: res.message || 'Your business profile details have been saved successfully.',
          onConfirm: handleBack,
        });
      } else {
        showError({
          title: 'Update Failed',
          message: res?.message || 'Unable to update profile. Please try again.',
        });
      }
    } catch (err) {
      showError({
        title: 'Network Error',
        message: err.response?.data?.message || err.message || 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    showConfirm({
      title: 'Sign Out',
      message: 'Are you sure you want to log out of your business account?',
      type: 'danger',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      onConfirm: logout,
    });
  };

  const resolvedAvatarUri = resolveProfileImageUrl(profileImage);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <Header
        title="Edit Profile"
        subtitle="Manage business & owner info"
        showBack={true}
        onBackPress={handleBack}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {fetching ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading profile information...
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── PROFILE PHOTO AVATAR CARD ── */}
            <View style={[styles.avatarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.avatarWrapper}>
                {resolvedAvatarUri && !imgError ? (
                  <Image
                    source={{ uri: resolvedAvatarUri }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                      {getInitials(fullName || businessName)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.cameraBadge, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                  onPress={() => setShowImageInput(!showImageInput)}
                >
                  <Icon name="edit" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.avatarName, { color: colors.text }]}>
                {fullName || 'Your Name'}
              </Text>
              <Text style={[styles.avatarBusiness, { color: colors.primary, fontWeight: '700' }]}>
                {businessName || 'Business Name'}
              </Text>

              <TouchableOpacity
                onPress={() => setShowImageInput(!showImageInput)}
                style={[styles.changePhotoBtn, { borderColor: colors.border }]}
              >
                <Icon name="camera" size={13} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.changePhotoText, { color: colors.textSecondary }]}>
                  {showImageInput ? 'Hide Photo Link' : 'Change Profile Photo URL'}
                </Text>
              </TouchableOpacity>

              {/* Collapsible Photo URL Input */}
              {showImageInput ? (
                <View style={styles.imageInputBox}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 4 }]}>
                    Image URL or Filename
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="https://... or filename.jpg"
                    placeholderTextColor={colors.textMuted}
                    value={profileImage}
                    onChangeText={(val) => {
                      setProfileImage(val);
                      setImgError(false);
                    }}
                    autoCapitalize="none"
                  />
                </View>
              ) : null}
            </View>

            {/* ── OWNER & BUSINESS IDENTITY ── */}
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Personal & Store Information</Text>

              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Full Name <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Icon name="user" size={16} color={colors.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.textInputField, { color: colors.text }]}
                    placeholder="e.g. Makwana Kaushik"
                    placeholderTextColor={colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              {/* Business Name */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Business / Store Name <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Icon name="briefcase" size={16} color={colors.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.textInputField, { color: colors.text }]}
                    placeholder="e.g. Kaushik Enterprises"
                    placeholderTextColor={colors.textMuted}
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                </View>
              </View>

              {/* Mobile Number */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Mobile Number <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.prefixText, { color: colors.textMuted }]}>+91</Text>
                  <TextInput
                    style={[styles.textInputField, { color: colors.text }]}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={colors.textMuted}
                    value={mobile}
                    onChangeText={(val) => setMobile(val.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Email Address <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Icon name="email" size={16} color={colors.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.textInputField, { color: colors.text }]}
                    placeholder="e.g. business@example.com"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            {/* ── TAX & BILLING ADDRESS ── */}
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Tax & Location Details</Text>

              {/* GSTIN */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  GSTIN / Tax Registration Number (Optional)
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Icon name="document" size={16} color={colors.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.textInputField, { color: colors.text }]}
                    placeholder="e.g. 24AAAAA0000A1Z5"
                    placeholderTextColor={colors.textMuted}
                    value={gstin}
                    onChangeText={setGstin}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Business Address */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Business Address
                </Text>
                <View style={[styles.textAreaWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.textAreaField, { color: colors.text }]}
                    placeholder="Enter full shop/office address, city, state and PIN code..."
                    placeholderTextColor={colors.textMuted}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </View>

            {/* ── SOCIAL & ONLINE HANDLES ── */}
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Social Media & Online Links</Text>

              {/* Instagram */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Instagram Handle</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.prefixText, { color: colors.textMuted }]}>@</Text>
                  <TextInput
                    style={[styles.textInputField, { color: colors.text }]}
                    placeholder="yourshopname"
                    placeholderTextColor={colors.textMuted}
                    value={instagram}
                    onChangeText={setInstagram}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Facebook */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Facebook Page</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Icon name="tag" size={15} color={colors.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.textInputField, { color: colors.text }]}
                    placeholder="facebook.com/yourshop"
                    placeholderTextColor={colors.textMuted}
                    value={facebook}
                    onChangeText={setFacebook}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            {/* ── ACTION BUTTONS ── */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[
                  styles.primarySaveBtn,
                  { backgroundColor: colors.primary },
                  saving && { opacity: 0.75 },
                ]}
                activeOpacity={0.8}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="check" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primarySaveBtnText}>Save Profile Changes</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={handleBack}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* ── LOGOUT / DANGER ZONE ── */}
            <View style={[styles.dangerCard, { backgroundColor: colors.card, borderColor: '#FEE2E2' }]}>
              <View style={styles.dangerRow}>
                <View style={styles.dangerIconBox}>
                  <Icon name="logout" size={16} color={colors.danger} />
                </View>
                <View style={styles.dangerTextCol}>
                  <Text style={[styles.dangerTitle, { color: colors.danger }]}>Sign Out of BillBook</Text>
                  <Text style={[styles.dangerSubtitle, { color: colors.textMuted }]}>
                    End your active session on this device
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.signOutBtn, { borderColor: colors.danger }]}
                  onPress={handleSignOut}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.signOutBtnText, { color: colors.danger }]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    marginTop: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
  },
  // Avatar Card
  avatarCard: {
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#F58220',
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F58220',
  },
  avatarInitials: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  avatarName: {
    fontFamily: FONT_FAMILY,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  avatarBusiness: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    marginTop: 3,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  changePhotoText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  imageInputBox: {
    width: '100%',
    marginTop: 14,
  },
  // Form Cards
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  fieldIcon: {
    marginRight: 10,
  },
  prefixText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  textInputField: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    height: '100%',
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 80,
  },
  textAreaField: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 64,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  // Action Buttons
  actionSection: {
    marginTop: 6,
    marginBottom: 18,
    gap: 10,
  },
  primarySaveBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  primarySaveBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  // Danger Card
  dangerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 6,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dangerTextCol: {
    flex: 1,
  },
  dangerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  dangerSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 2,
  },
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  signOutBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default EditProfileScreen;
