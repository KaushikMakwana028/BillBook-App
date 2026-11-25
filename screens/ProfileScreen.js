/**
 * BillBook Profile & Settings Screen
 * Business details, invoice configuration, digital signature, and account management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import profileService from '../services/profileService';
import invoiceService from '../services/invoiceService';
import whatsappService from '../services/whatsappService';
import { Header, BottomBar, Icon, SafeAreaView } from '../components';
import { FONT_FAMILY } from '../components/fonts';
import { resolveProfileImageUrl, resolveSignatureUrl } from '../utils/imageUrl';

const TERMS_URL = 'https://billbook.visiontechnolabs.com/terms';
const PRIVACY_URL = 'https://billbook.visiontechnolabs.com/privacy';

export function ProfileScreen({ navigation, onNavigate }) {
  const { user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const { showAlert, showConfirm, showSuccess, showError } = useAlert();

  const [profileData, setProfileData] = useState(user || {});
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Digital Signature State
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [signatureInput, setSignatureInput] = useState('');
  const [loadingSignature, setLoadingSignature] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  // WhatsApp Integration State
  const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [waConnectUrl, setWaConnectUrl] = useState('https://billbook.moneymitraa.com/whatsapp');
  const [waCheckingStatus, setWaCheckingStatus] = useState(false);
  const [waLoggingOut, setWaLoggingOut] = useState(false);

  // Check WhatsApp connection status on mount
  useEffect(() => {
    checkWhatsAppStatus(false);
  }, []);

  // Auto-poll WhatsApp live connection status while modal is open
  useEffect(() => {
    let interval = null;
    if (whatsappModalVisible && !waConnected) {
      interval = setInterval(async () => {
        try {
          const res = await whatsappService.getStatus();
          if (res?.data?.connect_url) {
            setWaConnectUrl(res.data.connect_url);
          }
          if (res?.data?.connected) {
            setWaConnected(true);
            showSuccess({
              title: 'WhatsApp Connected 🎉',
              message: 'Your WhatsApp is now active! All customer invoices will be sent directly from your WhatsApp number.',
            });
            if (interval) clearInterval(interval);
          }
        } catch {
          // ignore background polling errors
        }
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [whatsappModalVisible, waConnected]);

  // Check WhatsApp live connection status with manual hard refresh
  const checkWhatsAppStatus = async (showFeedback = false) => {
    try {
      setWaCheckingStatus(true);
      const res = await whatsappService.getStatus();
      const isConn = !!res?.data?.connected;
      if (res?.data?.connect_url) {
        setWaConnectUrl(res.data.connect_url);
      }
      setWaConnected(isConn);
      if (showFeedback) {
        if (isConn) {
          showSuccess({
            title: 'WhatsApp Active ✅',
            message: 'Your WhatsApp session is live and connected. Invoices will be dispatched from your number.',
          });
        } else {
          showAlert({
            title: 'WhatsApp Status',
            message: 'Not connected yet. Please tap "Connect WhatsApp on Web" to link your account.',
            type: 'info',
          });
        }
      }
    } catch (err) {
      if (showFeedback) {
        showError({
          title: 'Status Check Failed',
          message: err.message || 'Could not reach WhatsApp gateway service.',
        });
      }
    } finally {
      setWaCheckingStatus(false);
    }
  };

  // Open Web Connect URL in system browser
  const handleOpenWebConnect = async () => {
    const targetUrl = waConnectUrl || 'https://billbook.moneymitraa.com/whatsapp';
    try {
      await Linking.openURL(targetUrl);
    } catch {
      showAlert({
        title: 'Open Link Failed',
        message: `Please open this link in your browser:\n${targetUrl}`,
        type: 'warning',
      });
    }
  };

  // Share Web link to PC / another device
  const handleShareWebLink = async () => {
    const targetUrl = waConnectUrl || 'https://billbook.moneymitraa.com/whatsapp';
    try {
      await Share.share({
        title: 'BillBook WhatsApp Web Connect',
        message: `Open this link on your PC, laptop, or browser to connect WhatsApp for BillBook:\n${targetUrl}\n\nOnce opened, scan the QR code from WhatsApp > Linked Devices!`,
      });
    } catch {
      // ignore
    }
  };

  // Disconnect WhatsApp
  const handleLogoutWhatsApp = () => {
    showConfirm({
      title: 'Disconnect WhatsApp',
      message: 'Are you sure you want to unlink your WhatsApp account? Invoices will no longer be dispatched from your personal number.',
      type: 'danger',
      confirmText: 'Disconnect',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setWaLoggingOut(true);
        try {
          await whatsappService.logout();
          setWaConnected(false);
          showSuccess({
            title: 'WhatsApp Disconnected',
            message: 'Your WhatsApp session has been removed.',
          });
        } catch (err) {
          showError({
            title: 'Logout Failed',
            message: err.message || 'Could not disconnect session.',
          });
        } finally {
          setWaLoggingOut(false);
        }
      },
    });
  };

  // Open WhatsApp Modal
  const handleOpenWhatsAppModal = () => {
    setWhatsappModalVisible(true);
    checkWhatsAppStatus(false);
  };

  const handleOpenWhatsAppApp = async () => {
    const urls = [
      'whatsapp://app',
      'whatsapp://send',
      'https://api.whatsapp.com/send',
      'https://wa.me/',
    ];
    for (const url of urls) {
      try {
        await Linking.openURL(url);
        return;
      } catch {
        // try next candidate
      }
    }
    showAlert({
      title: 'WhatsApp Not Found',
      message: 'WhatsApp app does not appear to be installed on this device.',
      type: 'warning',
    });
  };

  // Fetch signature settings from invoice settings
  const fetchSignatureSettings = async () => {
    try {
      setLoadingSignature(true);
      const res = await invoiceService.getInvoiceSettings();
      if (res?.status && res?.data) {
        const sig = res.data.signature_url || '';
        setSignatureUrl(sig);
        setSignatureInput(sig);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSignature(false);
    }
  };

  useEffect(() => {
    fetchSignatureSettings();
    checkWhatsAppStatus();
  }, []);

  const handleSaveSignature = async () => {
    if (!signatureInput.trim()) {
      showAlert({
        title: 'Empty Signature',
        message: 'Please provide a valid image URL or path for the signature.',
        type: 'warning',
      });
      return;
    }

    setSavingSignature(true);
    try {
      const trimmed = signatureInput.trim();
      const formData = new FormData();
      formData.append('signature_image', trimmed);
      formData.append('signature_url', trimmed);

      let uploadRes = null;
      try {
        uploadRes = await invoiceService.uploadSignature(formData);
      } catch {
        // Fallback to saveInvoiceSettings
      }

      await invoiceService
        .saveInvoiceSettings({
          signature_url: trimmed,
        })
        .catch(() => {});

      const updatedSig = uploadRes?.data?.signature_url || trimmed;
      setSignatureUrl(updatedSig);
      showSuccess({
        title: 'Signature Saved 🎉',
        message: 'Authorized digital signature was updated and will appear on all future invoices.',
      });
      setSignatureModalVisible(false);
    } catch (err) {
      showError({
        title: 'Signature Save Failed',
        message: err.response?.data?.message || err.message || 'Could not update signature.',
      });
    } finally {
      setSavingSignature(false);
    }
  };

  const handleRemoveSignature = () => {
    showConfirm({
      title: 'Remove Digital Signature',
      message: 'Are you sure you want to remove your business digital signature from all future invoices?',
      type: 'danger',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await invoiceService.removeSignature();
          setSignatureUrl('');
          setSignatureInput('');
          showSuccess({
            title: 'Signature Removed',
            message: 'Business signature has been cleared.',
          });
        } catch (err) {
          showError({
            title: 'Error',
            message: err.message || 'Could not remove signature.',
          });
        }
      },
    });
  };

  useEffect(() => {
    profileService
      .getMyProfile()
      .then((res) => {
        if (res?.status && res?.data) {
          setProfileData(res.data);
        }
      })
      .catch(() => {});
  }, [user]);

  const businessName = profileData?.business_name || profileData?.name || user?.business_name || 'My Business';
  const ownerName = profileData?.name || profileData?.full_name || user?.name || 'Partner';
  const phone = profileData?.mobile || profileData?.phone || user?.mobile || 'Not provided';
  const email = profileData?.email || user?.email || 'Not provided';
  const address = profileData?.address || user?.address || 'India';
  const gstin = profileData?.gstin || profileData?.gst_number || 'Not registered';

  const rawImg = profileData?.profile_image || profileData?.image || user?.profile_image || user?.image;
  const resolvedAvatar = resolveProfileImageUrl(rawImg);

  const getInitials = (str) => {
    if (!str) return 'BB';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const handleEditProfile = () => {
    if (onNavigate) {
      onNavigate('EditProfile');
    } else if (navigation?.navigate) {
      navigation.navigate('EditProfile');
    }
  };

  const handleLogout = () => {
    showConfirm({
      title: 'Sign Out',
      message: 'Are you sure you want to log out of your account?',
      type: 'danger',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      onConfirm: logout,
    });
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Header
        title="Business Profile"
        rightIcon="edit"
        onRightPress={handleEditProfile}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User / Business Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEditProfile}
            style={[styles.avatar, { backgroundColor: colors.primaryLight, borderColor: colors.borderFocus, overflow: 'hidden' }]}
          >
            {resolvedAvatar && !imgError ? (
              <Image
                source={{ uri: resolvedAvatar }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                {getInitials(ownerName || businessName)}
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={[styles.businessName, { color: colors.text }]}>{businessName}</Text>
            <Text style={[styles.ownerName, { color: colors.textMuted }]}>Owner: {ownerName}</Text>
            <TouchableOpacity
              onPress={handleEditProfile}
              style={[styles.editProfileBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Icon name="edit" size={12} color={colors.primary} style={{ marginRight: 5 }} />
              <Text style={[styles.editProfileBtnText, { color: colors.primary }]}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Business Details Section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact & Identification</Text>

          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.menuRow}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.primaryLight }]}>
                <Icon name="phone" size={17} color={colors.primary} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={[styles.menuLabel, { color: colors.textMuted }]}>Phone Number</Text>
                <Text style={[styles.menuValue, { color: colors.text }]}>+91 {phone}</Text>
              </View>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <View style={styles.menuRow}>
              <View style={[styles.menuIconBox, { backgroundColor: '#F5F3FF' }]}>
                <Icon name="email" size={17} color="#8B5CF6" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={[styles.menuLabel, { color: colors.textMuted }]}>Email Address</Text>
                <Text style={[styles.menuValue, { color: colors.text }]}>{email}</Text>
              </View>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <View style={styles.menuRow}>
              <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="document" size={17} color={colors.accent} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={[styles.menuLabel, { color: colors.textMuted }]}>GSTIN / Tax ID</Text>
                <Text style={[styles.menuValue, { color: colors.text }]}>{gstin}</Text>
              </View>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <View style={styles.menuRow}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Icon name="briefcase" size={17} color="#F59E0B" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={[styles.menuLabel, { color: colors.textMuted }]}>Business Location</Text>
                <Text style={[styles.menuValue, { color: colors.text }]}>{address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Invoice & Tools Section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences & Customization</Text>

          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => onNavigate && onNavigate('InvoiceTemplates')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.primaryLight }]}>
                <Icon name="receipt" size={17} color={colors.primary} />
              </View>
              <Text style={[styles.actionRowText, { color: colors.text }]}>Invoice Templates & Design</Text>
              <Icon name="chevron-right" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleOpenWhatsAppModal}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Icon name="whatsapp" size={17} color="#16A34A" />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.actionRowText, { color: colors.text }]}>
                  {waConnected ? 'WhatsApp Connected' : 'WhatsApp Connect'}
                </Text>
                <Text style={[styles.actionRowSub, { color: waConnected ? '#059669' : colors.textMuted }]}>
                  {waConnected ? '● Connected (Ready to send bills)' : '○ Not Connected • Connect on Web'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadgePill,
                  { backgroundColor: waConnected ? '#DCFCE7' : '#FEF3C7' },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgePillText,
                    { color: waConnected ? '#15803D' : '#D97706' },
                  ]}
                >
                  {waConnected ? 'Connected' : 'Connect'}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => {
                setSignatureInput(signatureUrl);
                setSignatureModalVisible(true);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Icon name="check" size={17} color="#16A34A" />
              </View>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.actionRowText, { color: colors.text }]}>Authorized Digital Signature</Text>
                <Text style={[styles.actionRowSub, { color: signatureUrl ? '#059669' : colors.textMuted }]}>
                  {signatureUrl ? 'Active & Stamped on Invoices ✓' : 'Upload or set digital signature'}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal & App Info */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal & Support</Text>

          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.actionRow} onPress={() => openLink(TERMS_URL)}>
              <Text style={[styles.actionRowText, { color: colors.text }]}>Terms & Conditions</Text>
              <Icon name="chevron-right" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.actionRow} onPress={() => openLink(PRIVACY_URL)}>
              <Text style={[styles.actionRowText, { color: colors.text }]}>Privacy Policy</Text>
              <Icon name="chevron-right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.danger, backgroundColor: colors.dangerLight }]}
          onPress={handleLogout}
        >
          <Icon name="logout" size={18} color={colors.danger} />
          <Text style={[styles.logoutBtnText, { color: colors.danger }]}>Sign Out of BillBook</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Shared Bottom Bar */}
      <BottomBar
        currentTab="Profile"
        onTabChange={(tabName) => {
          if (onNavigate) onNavigate(tabName);
        }}
      />

      {/* ── MODAL: AUTHORIZED DIGITAL SIGNATURE MANAGEMENT ── */}
      <Modal
        visible={signatureModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSignatureModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.modalIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Icon name="check" size={16} color="#16A34A" />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Digital Signature</Text>
              </View>
              <TouchableOpacity onPress={() => setSignatureModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBodyScroll}>
              <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                Your authorized signature or business stamp appears on all generated PDF invoices, printed bills, and WhatsApp invoices.
              </Text>

              {/* Current Signature Preview */}
              <View style={[styles.sigPreviewContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {loadingSignature ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : signatureUrl && resolveSignatureUrl(signatureUrl) ? (
                  <View style={{ alignItems: 'center' }}>
                    <Image
                      source={{ uri: resolveSignatureUrl(signatureUrl) }}
                      style={styles.sigImage}
                      resizeMode="contain"
                    />
                    <View style={styles.sigBadge}>
                      <Text style={styles.sigBadgeText}>Active Stamped Signature ✓</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptySigBox}>
                    <Icon name="document" size={28} color={colors.textMuted} />
                    <Text style={[styles.emptySigText, { color: colors.textMuted }]}>
                      No digital signature uploaded yet
                    </Text>
                  </View>
                )}
              </View>

              {/* Input for Signature Image URL / File Path */}
              <View style={styles.sigInputGroup}>
                <Text style={[styles.sigInputLabel, { color: colors.textSecondary }]}>
                  Signature Image URL or Relative Path
                </Text>
                <TextInput
                  style={[styles.sigTextInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="https://... or uploads/signatures/sign.png"
                  placeholderTextColor={colors.textMuted}
                  value={signatureInput}
                  onChangeText={setSignatureInput}
                  autoCapitalize="none"
                />
              </View>

              {/* Save / Upload Action */}
              <TouchableOpacity
                style={[styles.saveSigBtn, { backgroundColor: colors.primary }, savingSignature && { opacity: 0.7 }]}
                onPress={handleSaveSignature}
                disabled={savingSignature}
                activeOpacity={0.8}
              >
                {savingSignature ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveSigBtnText}>
                      {signatureUrl ? 'Update Signature' : 'Upload Signature'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Remove Signature Action */}
              {signatureUrl ? (
                <TouchableOpacity
                  style={[styles.removeSigBtn, { borderColor: colors.danger, backgroundColor: colors.dangerLight }]}
                  onPress={handleRemoveSignature}
                  activeOpacity={0.8}
                >
                  <Icon name="delete" size={15} color={colors.danger} style={{ marginRight: 6 }} />
                  <Text style={[styles.removeSigBtnText, { color: colors.danger }]}>Remove Signature</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── MODAL: WHATSAPP CONNECT & QR (PAIRING CODE + QR) ── */}
      <Modal
        visible={whatsappModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWhatsappModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '92%' }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.modalIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Icon name="whatsapp" size={18} color="#16A34A" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>WhatsApp Connect</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                    Link your WhatsApp to send invoices
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setWhatsappModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.waModalScroll} showsVerticalScrollIndicator={false}>
              {/* Connection Status Card */}
              <View
                style={[
                  styles.waStatusCard,
                  {
                    backgroundColor: waConnected ? '#F0FDF4' : '#FFFBEB',
                    borderColor: waConnected ? '#86EFAC' : '#FDE68A',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={[
                        styles.waStatusDot,
                        { backgroundColor: waConnected ? '#16A34A' : '#D97706' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.waStatusTitle,
                        { color: waConnected ? '#15803D' : '#B45309' },
                      ]}
                    >
                      {waConnected ? 'Connected & Active' : 'Not Connected'}
                    </Text>
                  </View>

                  {/* Hard Refresh WhatsApp Status Button */}
                  <TouchableOpacity
                    style={[
                      styles.waStatusRefreshBtn,
                      { borderColor: waConnected ? '#86EFAC' : '#FDE68A', backgroundColor: '#FFFFFF' },
                    ]}
                    onPress={() => checkWhatsAppStatus(true)}
                    disabled={waCheckingStatus}
                    activeOpacity={0.7}
                  >
                    {waCheckingStatus ? (
                      <ActivityIndicator size="small" color={waConnected ? '#16A34A' : '#D97706'} />
                    ) : (
                      <>
                        <Icon name="refresh" size={13} color={waConnected ? '#16A34A' : '#D97706'} style={{ marginRight: 4 }} />
                        <Text style={[styles.waStatusRefreshText, { color: waConnected ? '#16A34A' : '#D97706' }]}>
                          Hard Refresh
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <Text
                  style={[
                    styles.waStatusDesc,
                    { color: waConnected ? '#166534' : '#92400E' },
                  ]}
                >
                  {waConnected
                    ? 'All customer invoices will be sent directly from your connected WhatsApp account.'
                    : 'WhatsApp is not connected yet. Click below to connect via WhatsApp Web.'}
                </Text>

                {waConnected ? (
                  <TouchableOpacity
                    style={[styles.waDisconnectBtn, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}
                    onPress={handleLogoutWhatsApp}
                    disabled={waLoggingOut}
                    activeOpacity={0.8}
                  >
                    {waLoggingOut ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <>
                        <Icon name="delete" size={14} color="#DC2626" style={{ marginRight: 6 }} />
                        <Text style={[styles.waDisconnectBtnText, { color: '#DC2626' }]}>
                          Disconnect WhatsApp
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>

              {!waConnected ? (
                <View style={styles.tabContent}>
                  {/* Web Connect Highlight Card */}
                  <View style={[styles.waWebCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
                    <View style={styles.waWebCardHeader}>
                      <View style={[styles.waWebIconCircle, { backgroundColor: '#DCFCE7' }]}>
                        <Icon name="whatsapp" size={26} color="#16A34A" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.tabSectionTitle, { color: colors.text, marginBottom: 2 }]}>
                          Connect on WhatsApp Web
                        </Text>
                        <Text style={[styles.tabSectionDesc, { color: colors.textMuted }]}>
                          Link your device via WhatsApp Web to send bills directly from your WhatsApp number.
                        </Text>
                      </View>
                    </View>

                    {/* Web Link Display Box */}
                    <View style={[styles.waLinkBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Icon name="link" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                      <Text style={[styles.waLinkText, { color: colors.primary }]} numberOfLines={1}>
                        {waConnectUrl}
                      </Text>
                    </View>

                    {/* Primary Action Button: Open Web Link */}
                    <TouchableOpacity
                      style={[styles.waActionBtn, { backgroundColor: '#16A34A' }]}
                      onPress={handleOpenWebConnect}
                      activeOpacity={0.85}
                    >
                      <Icon name="whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.waActionBtnText}>
                        Connect WhatsApp on Web ↗
                      </Text>
                    </TouchableOpacity>

                    {/* Secondary Action: Share Link to PC / Another Device */}
                    <TouchableOpacity
                      style={[styles.shareQrBtn, { backgroundColor: colors.primary }]}
                      onPress={handleShareWebLink}
                      activeOpacity={0.85}
                    >
                      <Icon name="share" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.shareQrBtnText}>
                        Share Link to PC / Laptop
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Step-by-Step Instructions */}
                  <View style={[styles.instructionsBox, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 14 }]}>
                    <Text style={[styles.instructionsTitle, { color: colors.text }]}>
                      📋 How to Connect:
                    </Text>
                    <View style={styles.stepItem}>
                      <Text style={[styles.stepNumber, { backgroundColor: colors.primaryLight, color: colors.primary }]}>1</Text>
                      <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                        Open <Text style={{ fontWeight: '700', color: colors.primary }}>{waConnectUrl}</Text> on your PC, laptop, or browser.
                      </Text>
                    </View>
                    <View style={styles.stepItem}>
                      <Text style={[styles.stepNumber, { backgroundColor: colors.primaryLight, color: colors.primary }]}>2</Text>
                      <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                        On your phone, open <Text style={{ fontWeight: '700', color: colors.text }}>WhatsApp</Text> ➔ tap <Text style={{ fontWeight: '700', color: colors.text }}>Settings</Text> (or 3-dots Menu ⋮) ➔ <Text style={{ fontWeight: '700', color: colors.text }}>Linked Devices</Text>.
                      </Text>
                    </View>
                    <View style={styles.stepItem}>
                      <Text style={[styles.stepNumber, { backgroundColor: colors.primaryLight, color: colors.primary }]}>3</Text>
                      <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                        Tap <Text style={{ fontWeight: '700', color: colors.text }}>Link a Device</Text> and scan the QR code on the web screen.
                      </Text>
                    </View>
                    <View style={styles.stepItem}>
                      <Text style={[styles.stepNumber, { backgroundColor: colors.primaryLight, color: colors.primary }]}>4</Text>
                      <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                        Once linked, return here and tap <Text style={{ fontWeight: '700', color: '#16A34A' }}>"Hard Refresh"</Text> above to confirm connection!
                      </Text>
                    </View>
                  </View>

                  {/* Open WhatsApp App Direct Button */}
                  <TouchableOpacity
                    style={[styles.openWaBtn, { borderColor: '#16A34A', backgroundColor: isDark ? '#142E1F' : '#F0FDF4', marginTop: 12 }]}
                    onPress={handleOpenWhatsAppApp}
                    activeOpacity={0.8}
                  >
                    <Icon name="whatsapp" size={17} color="#16A34A" style={{ marginRight: 8 }} />
                    <Text style={[styles.openWaBtnText, { color: '#16A34A' }]}>
                      Open WhatsApp App on this Device
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLogoImage: {
    width: 52,
    height: 52,
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 18,
  },
  avatarInitials: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  businessName: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  ownerName: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  editProfileBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    gap: 4,
  },
  activeBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
  },
  menuLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
  },
  menuValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    marginLeft: 62,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionRowText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  actionRowSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginLeft: 12,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  logoutBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  // Signature Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBodyScroll: {
    paddingVertical: 14,
  },
  modalSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  sigPreviewContainer: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    marginBottom: 14,
  },
  sigImage: {
    width: 180,
    height: 60,
    marginBottom: 8,
  },
  sigBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sigBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  emptySigBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  emptySigText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 6,
  },
  sigInputGroup: {
    marginBottom: 14,
  },
  sigInputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  sigTextInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  saveSigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    marginBottom: 10,
  },
  saveSigBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  removeSigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  removeSigBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  // WhatsApp Integration Styles
  statusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgePillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 1,
  },
  waModalScroll: {
    paddingVertical: 14,
    paddingBottom: 32,
  },
  waStatusCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  waStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  waStatusTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
  },
  waStatusRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  waStatusRefreshText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  waStatusDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  waDisconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  waDisconnectBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  waWebCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  waWebCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  waWebIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  waLinkText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  tabContent: {
    marginTop: 4,
  },
  tabSectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
  },
  tabSectionDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
    lineHeight: 18,
  },
  waActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  waActionBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  codeDisplayCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  codeLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  codeRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 8,
  },
  codeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
  },
  codeHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  instructionsBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    marginRight: 10,
    marginTop: 1,
  },
  stepText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 18,
  },
  openWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  openWaBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  qrContainer: {
    width: 220,
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 10,
    marginBottom: 14,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLoadingText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 8,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrActionRow: {
    gap: 10,
    marginBottom: 16,
  },
  shareQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  shareQrBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  refreshQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  refreshQrBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  waNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  waNoticeBannerText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 18,
  },
});

export default ProfileScreen;
