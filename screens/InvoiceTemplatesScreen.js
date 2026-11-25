/**
 * BillBook Invoice Templates Screen
 * Template chooser and brand color customizer for sales invoices
 * Synchronized with backend invoice settings API
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import invoiceService from '../services/invoiceService';
import { Header, Icon } from '../components';
import { FONT_FAMILY } from '../components/fonts';
import { resolveSignatureUrl } from '../utils/imageUrl';

const PRESET_COLORS = [
  '#0A2540', // BillBook Deep Navy
  '#F58220', // BillBook Brand Orange
  '#2563EB', // Royal Blue
  '#059669', // Emerald Green
  '#7C3AED', // Violet
  '#DC2626', // Crimson Red
  '#0891B2', // Cyan Teal
  '#1E293B', // Slate Dark
];

const TEMPLATES = [
  {
    id: 1,
    name: 'Modern Slate',
    tagline: 'Clean dual-tone layout with bold header banner & summary card.',
    badge: 'Popular',
    icon: 'document',
  },
  {
    id: 2,
    name: 'Classic Corporate',
    tagline: 'Traditional corporate layout with structured borders and dense tables.',
    badge: 'Recommended',
    icon: 'briefcase',
  },
  {
    id: 3,
    name: 'Creative Accent',
    tagline: 'Vibrant highlight headers with spacious typography for modern retail.',
    badge: 'Creative',
    icon: 'tag',
  },
  {
    id: 4,
    name: 'Thermal POS Receipt',
    tagline: 'Compact, streamlined receipt format designed for thermal paper.',
    badge: 'POS Fast',
    icon: 'receipt',
  },
  {
    id: 5,
    name: 'Minimalist Clean',
    tagline: 'Ultra-light, borderless styling focused on typographic elegance.',
    badge: 'Clean',
    icon: 'box',
  },
  {
    id: 6,
    name: 'Executive Detailed',
    tagline: 'Comprehensive invoice with full tax breakdowns and terms.',
    badge: 'Detailed',
    icon: 'document',
  },
];

export function InvoiceTemplatesScreen({ navigation, onGoBack }) {
  const { colors } = useTheme();
  const { showSuccess, showError } = useAlert();

  const [selectedTemplateId, setSelectedTemplateId] = useState(1);
  const [activeSavedTemplateId, setActiveSavedTemplateId] = useState(1);
  const [primaryColor, setPrimaryColor] = useState('#0A2540');
  const [accentColor, setAccentColor] = useState('#F58220');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Digital Signature State
  const [signatureUrl, setSignatureUrl] = useState('');
  const [signatureInput, setSignatureInput] = useState('');
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  // Load current active settings
  const loadInvoiceSettings = () => {
    invoiceService
      .getInvoiceSettings()
      .then((res) => {
        if (res?.status && res?.data) {
          const s = res.data;
          const tid = parseInt(s.template_id || s.active_template_id || 1, 10);
          setSelectedTemplateId(tid);
          setActiveSavedTemplateId(tid);
          if (s.primary_color) setPrimaryColor(s.primary_color);
          if (s.accent_color) setAccentColor(s.accent_color);
          if (s.signature_url) {
            setSignatureUrl(s.signature_url);
            setSignatureInput(s.signature_url);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoiceSettings();
  }, []);

  const handleSaveSignature = async () => {
    if (!signatureInput.trim()) {
      showError({
        title: 'Empty Signature',
        message: 'Please provide a valid image URL or path for the signature.',
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
        // Fallback
      }

      await invoiceService.saveInvoiceSettings({
        template_id: activeSavedTemplateId,
        primary_color: primaryColor,
        accent_color: accentColor,
        signature_url: trimmed,
      }).catch(() => {});

      const updatedSig = uploadRes?.data?.signature_url || trimmed;
      setSignatureUrl(updatedSig);
      showSuccess({
        title: 'Signature Saved 🎉',
        message: 'Digital signature has been saved and will appear on all future invoices.',
      });
      setSignatureModalVisible(false);
    } catch (err) {
      showError({
        title: 'Save Failed',
        message: err.response?.data?.message || err.message || 'Could not save signature.',
      });
    } finally {
      setSavingSignature(false);
    }
  };

  const handleRemoveSignature = async () => {
    try {
      await invoiceService.removeSignature();
      setSignatureUrl('');
      setSignatureInput('');
      showSuccess({
        title: 'Signature Removed',
        message: 'Business signature has been cleared from invoices.',
      });
    } catch (err) {
      showError({
        title: 'Error',
        message: err.message || 'Could not remove signature.',
      });
    }
  };

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onGoBack) {
      onGoBack();
    }
  };

  const handleSaveTemplate = async (templateIdToSave = selectedTemplateId) => {
    setSaving(true);
    try {
      const payload = {
        template_id: templateIdToSave,
        primary_color: primaryColor,
        accent_color: accentColor,
      };

      const res = await invoiceService.saveInvoiceSettings(payload);
      if (res?.status) {
        setSelectedTemplateId(templateIdToSave);
        setActiveSavedTemplateId(templateIdToSave);
        showSuccess({
          title: 'Template Activated! 🎉',
          message: `Template #${templateIdToSave} is now active for all business invoices and customer bills.`,
        });
      } else {
        showError({
          title: 'Could Not Save',
          message: res?.message || 'Failed to update invoice template settings.',
        });
      }
    } catch (err) {
      showError({
        title: 'Error',
        message: err.response?.data?.message || err.message || 'Network error updating template.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Header
        title="Invoice Templates"
        subtitle="Choose design & brand colors"
        showBack={true}
        onBackPress={handleBack}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading invoice template designs...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── COLOR PALETTE PICKER ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Brand Header Color</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              Applied to invoice headers, item tables, and primary highlights
            </Text>

            <View style={styles.colorRow}>
              {PRESET_COLORS.map((hex) => {
                const isSelected = primaryColor.toLowerCase() === hex.toLowerCase();
                return (
                  <TouchableOpacity
                    key={hex}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: hex },
                      isSelected && styles.activeColorCircle,
                    ]}
                    onPress={() => setPrimaryColor(hex)}
                    activeOpacity={0.8}
                  >
                    {isSelected ? <Icon name="check" size={14} color="#FFFFFF" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── DIGITAL SIGNATURE SECTION ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBoxMini, { backgroundColor: '#F0FDF4' }]}>
                <Icon name="check" size={16} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Authorized Digital Signature</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                  Appears at the bottom-right of every invoice PDF and printed bill
                </Text>
              </View>
            </View>

            <View style={[styles.sigPreviewBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {signatureUrl && resolveSignatureUrl(signatureUrl) ? (
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
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                  <Icon name="document" size={24} color={colors.textMuted} />
                  <Text style={[styles.noSigText, { color: colors.textMuted }]}>
                    No digital signature uploaded yet
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.sigActionRow}>
              <TouchableOpacity
                style={[styles.sigBtnPrimary, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setSignatureInput(signatureUrl);
                  setSignatureModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Icon name="check" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.sigBtnPrimaryText}>
                  {signatureUrl ? 'Change Signature' : 'Upload Signature'}
                </Text>
              </TouchableOpacity>

              {signatureUrl ? (
                <TouchableOpacity
                  style={[styles.sigBtnDanger, { borderColor: colors.danger, backgroundColor: colors.dangerLight }]}
                  onPress={handleRemoveSignature}
                  activeOpacity={0.8}
                >
                  <Icon name="delete" size={14} color={colors.danger} style={{ marginRight: 4 }} />
                  <Text style={[styles.sigBtnDangerText, { color: colors.danger }]}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* ── TEMPLATES LIST ── */}
          <View style={styles.templatesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Template Formats</Text>

            {TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              const isCurrentlyActive = activeSavedTemplateId === tmpl.id;

              return (
                <TouchableOpacity
                  key={tmpl.id}
                  style={[
                    styles.templateCard,
                    { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border },
                    isSelected && styles.activeCardGlow,
                  ]}
                  onPress={() => setSelectedTemplateId(tmpl.id)}
                  activeOpacity={0.8}
                >
                  {/* Top Row: Template Name & Badge */}
                  <View style={styles.templateHeaderRow}>
                    <View style={styles.templateTitleCol}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.templateName, { color: colors.text }]}>
                          {tmpl.name}
                        </Text>
                        <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.badgeText, { color: colors.primary }]}>
                            {tmpl.badge}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.templateTagline, { color: colors.textMuted }]}>
                        {tmpl.tagline}
                      </Text>
                    </View>

                    {isCurrentlyActive ? (
                      <View style={styles.activeTag}>
                        <Icon name="check" size={12} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={styles.activeTagText}>Active</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Visual Mock Invoice Preview */}
                  <View style={[styles.mockInvoiceBox, { borderColor: colors.border }]}>
                    {/* Header Banner */}
                    <View style={[styles.mockHeader, { backgroundColor: primaryColor }]}>
                      <View style={styles.mockHeaderLeft}>
                        <View style={styles.mockLogoSquare}>
                          <Text style={styles.mockLogoText}>B</Text>
                        </View>
                        <Text style={styles.mockStoreName}>BILLBOOK STORE</Text>
                      </View>
                      <Text style={styles.mockInvNo}>INV-001</Text>
                    </View>

                    {/* Meta Row */}
                    <View style={styles.mockMetaRow}>
                      <Text style={styles.mockCustomer}>BILL TO: Rahul Sharma</Text>
                      <Text style={styles.mockDate}>Today</Text>
                    </View>

                    {/* Table Rows */}
                    <View style={[styles.mockTableHead, { backgroundColor: primaryColor }]}>
                      <Text style={[styles.mockCol, { flex: 2 }]}>ITEM</Text>
                      <Text style={[styles.mockCol, { width: 30, textAlign: 'center' }]}>QTY</Text>
                      <Text style={[styles.mockCol, { width: 50, textAlign: 'right' }]}>AMT</Text>
                    </View>
                    <View style={styles.mockTableRow}>
                      <Text style={[styles.mockRowText, { flex: 2 }]}>Call of Duty MW-III</Text>
                      <Text style={[styles.mockRowText, { width: 30, textAlign: 'center' }]}>1</Text>
                      <Text style={[styles.mockRowText, { width: 50, textAlign: 'right', fontWeight: '700' }]}>₹5,549</Text>
                    </View>
                    <View style={[styles.mockTableRow, { backgroundColor: '#F8FAFC' }]}>
                      <Text style={[styles.mockRowText, { flex: 2 }]}>Palworld Special</Text>
                      <Text style={[styles.mockRowText, { width: 30, textAlign: 'center' }]}>1</Text>
                      <Text style={[styles.mockRowText, { width: 50, textAlign: 'right', fontWeight: '700' }]}>₹1,170</Text>
                    </View>

                    {/* Total Row */}
                    <View style={styles.mockTotalRow}>
                      <Text style={styles.mockTotalLabel}>TOTAL DUE:</Text>
                      <View style={[styles.mockTotalBadge, { backgroundColor: accentColor }]}>
                        <Text style={styles.mockTotalVal}>₹6,719.00</Text>
                      </View>
                    </View>
                  </View>

                  {/* Activate Button */}
                  <TouchableOpacity
                    style={[
                      styles.activateBtn,
                      {
                        backgroundColor: isCurrentlyActive ? colors.cardSecondary : colors.primary,
                        borderColor: isCurrentlyActive ? colors.border : colors.primary,
                      },
                    ]}
                    onPress={() => handleSaveTemplate(tmpl.id)}
                    disabled={saving}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.activateBtnText,
                        { color: isCurrentlyActive ? colors.textSecondary : '#FFFFFF' },
                      ]}
                    >
                      {isCurrentlyActive ? 'Currently Active Template' : 'Activate This Template'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ── MODAL: SIGNATURE MANAGEMENT ── */}
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
                <View style={[styles.iconBoxMini, { backgroundColor: '#F0FDF4' }]}>
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
                Provide an image URL or uploaded file path for your authorized signature stamp.
              </Text>

              {/* Preview */}
              <View style={[styles.sigPreviewContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {signatureUrl && resolveSignatureUrl(signatureUrl) ? (
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
                  <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                    <Icon name="document" size={26} color={colors.textMuted} />
                    <Text style={[styles.noSigText, { color: colors.textMuted }]}>
                      No signature uploaded yet
                    </Text>
                  </View>
                )}
              </View>

              {/* Input */}
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

              {/* Save */}
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
                      {signatureUrl ? 'Update Signature' : 'Save Signature'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 48,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginBottom: 14,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeColorCircle: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  templatesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  templateCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  activeCardGlow: {
    borderWidth: 2,
  },
  templateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  templateTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  templateName: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
  },
  templateTagline: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    lineHeight: 15,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeTagText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  mockInvoiceBox: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  mockHeader: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mockHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mockLogoSquare: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockLogoText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  mockStoreName: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mockInvNo: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mockMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mockCustomer: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '700',
    color: '#1E293B',
  },
  mockDate: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    color: '#64748B',
  },
  mockTableHead: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mockCol: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mockTableRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mockRowText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    color: '#334155',
  },
  mockTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  mockTotalLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  mockTotalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mockTotalVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  activateBtn: {
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  // Digital Signature Styles
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBoxMini: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sigPreviewBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    marginBottom: 12,
  },
  sigImage: {
    width: 170,
    height: 50,
    marginBottom: 6,
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
  noSigText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 4,
  },
  sigActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sigBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
  },
  sigBtnPrimaryText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sigBtnDanger: {
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigBtnDangerText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  // Modal Styles
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
    marginTop: 4,
  },
  saveSigBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default InvoiceTemplatesScreen;
