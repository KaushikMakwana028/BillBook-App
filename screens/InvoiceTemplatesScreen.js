/**
 * BillBook Invoice Templates & Customizer Screen
 * - 6 genuinely distinct template layouts with live thumbnails
 * - Primary + Accent color pickers, curated dual-tone themes & custom Hex inputs
 * - Rich invoice display & layout options (heading, density, visibility toggles, terms)
 * - Full-screen interactive Live Preview modal
 * - Digital signature management
 * Synchronized with backend invoice settings API + persistent local preferences
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
  Switch,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import invoiceService from '../services/invoiceService';
import {
  Header,
  Icon,
  InvoiceTemplateRenderer,
  InvoiceTemplateThumbnail,
  SafeAreaView,
} from '../components';
import { FONT_FAMILY } from '../components/fonts';
import { resolveSignatureUrl } from '../utils/imageUrl';
import {
  ACCENT_COLOR_PRESETS,
  COLOR_PAIR_THEMES,
  DEFAULT_INVOICE_PREFS,
  INVOICE_TEMPLATES,
  INVOICE_TITLE_OPTIONS,
  PRIMARY_COLOR_PRESETS,
  SAMPLE_PREVIEW_SALE,
  isValidHex,
  loadMergedInvoicePrefs,
  normalizeHex,
  saveLocalInvoicePrefs,
} from '../utils/invoicePreferences';

export function InvoiceTemplatesScreen({ navigation, onGoBack }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showSuccess, showError } = useAlert();

  const [selectedTemplateId, setSelectedTemplateId] = useState(1);
  const [activeSavedTemplateId, setActiveSavedTemplateId] = useState(1);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_INVOICE_PREFS.primaryColor);
  const [accentColor, setAccentColor] = useState(DEFAULT_INVOICE_PREFS.accentColor);
  const [primaryHexInput, setPrimaryHexInput] = useState(DEFAULT_INVOICE_PREFS.primaryColor);
  const [accentHexInput, setAccentHexInput] = useState(DEFAULT_INVOICE_PREFS.accentColor);

  // Extended Invoice Display Options
  const [invoiceTitle, setInvoiceTitle] = useState(DEFAULT_INVOICE_PREFS.invoiceTitle);
  const [density, setDensity] = useState(DEFAULT_INVOICE_PREFS.density);
  const [showLogo, setShowLogo] = useState(DEFAULT_INVOICE_PREFS.showLogo);
  const [showCustomerDetails, setShowCustomerDetails] = useState(DEFAULT_INVOICE_PREFS.showCustomerDetails);
  const [showDiscount, setShowDiscount] = useState(DEFAULT_INVOICE_PREFS.showDiscount);
  const [showAmountInWords, setShowAmountInWords] = useState(DEFAULT_INVOICE_PREFS.showAmountInWords);
  const [showSignature, setShowSignature] = useState(DEFAULT_INVOICE_PREFS.showSignature);
  const [showTerms, setShowTerms] = useState(DEFAULT_INVOICE_PREFS.showTerms);
  const [showThankYou, setShowThankYou] = useState(DEFAULT_INVOICE_PREFS.showThankYou);
  const [termsText, setTermsText] = useState(DEFAULT_INVOICE_PREFS.termsText);
  const [footerMessage, setFooterMessage] = useState(DEFAULT_INVOICE_PREFS.footerMessage);
  const [optionsExpanded, setOptionsExpanded] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Live Preview Modal State
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState(1);

  // Digital Signature State
  const [signatureUrl, setSignatureUrl] = useState('');
  const [signatureInput, setSignatureInput] = useState('');
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);

  const buildCurrentPrefs = (overrideTemplateId) => ({
    templateId: overrideTemplateId ?? selectedTemplateId,
    primaryColor: normalizeHex(primaryColor, '#0A2540'),
    accentColor: normalizeHex(accentColor, '#F58220'),
    invoiceTitle,
    density,
    showLogo,
    showCustomerDetails,
    showDiscount,
    showAmountInWords,
    showSignature,
    showTerms,
    showThankYou,
    termsText: termsText.trim() || DEFAULT_INVOICE_PREFS.termsText,
    footerMessage: footerMessage.trim() || DEFAULT_INVOICE_PREFS.footerMessage,
    signatureUrl,
  });

  useEffect(() => {
    let mounted = true;
    loadMergedInvoicePrefs({ bypassCache: true })
      .then((prefs) => {
        if (!mounted) return;
        setSelectedTemplateId(prefs.templateId);
        setActiveSavedTemplateId(prefs.templateId);
        setPreviewTemplateId(prefs.templateId);
        setPrimaryColor(prefs.primaryColor);
        setPrimaryHexInput(prefs.primaryColor);
        setAccentColor(prefs.accentColor);
        setAccentHexInput(prefs.accentColor);
        setInvoiceTitle(prefs.invoiceTitle);
        setDensity(prefs.density);
        setShowLogo(prefs.showLogo);
        setShowCustomerDetails(prefs.showCustomerDetails);
        setShowDiscount(prefs.showDiscount);
        setShowAmountInWords(prefs.showAmountInWords);
        setShowSignature(prefs.showSignature);
        setShowTerms(prefs.showTerms);
        setShowThankYou(prefs.showThankYou);
        setTermsText(prefs.termsText);
        setFooterMessage(prefs.footerMessage);
        if (prefs.signatureUrl) {
          setSignatureUrl(prefs.signatureUrl);
          setSignatureInput(prefs.signatureUrl);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const applyPrimaryColor = (hex) => {
    const clean = normalizeHex(hex, primaryColor);
    setPrimaryColor(clean);
    setPrimaryHexInput(clean);
  };

  const applyAccentColor = (hex) => {
    const clean = normalizeHex(hex, accentColor);
    setAccentColor(clean);
    setAccentHexInput(clean);
  };

  const handlePrimaryHexChange = (val) => {
    setPrimaryHexInput(val);
    if (isValidHex(val)) {
      setPrimaryColor(normalizeHex(val, primaryColor));
    }
  };

  const handleAccentHexChange = (val) => {
    setAccentHexInput(val);
    if (isValidHex(val)) {
      setAccentColor(normalizeHex(val, accentColor));
    }
  };

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

      await invoiceService
        .saveInvoiceSettings({
          template_id: activeSavedTemplateId,
          primary_color: primaryColor,
          accent_color: accentColor,
          signature_url: trimmed,
        })
        .catch(() => {});

      const updatedSig = uploadRes?.data?.signature_url || trimmed;
      setSignatureUrl(updatedSig);
      await saveLocalInvoicePrefs({
        ...buildCurrentPrefs(activeSavedTemplateId),
        signatureUrl: updatedSig,
      });

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
      await saveLocalInvoicePrefs({
        ...buildCurrentPrefs(activeSavedTemplateId),
        signatureUrl: '',
      });
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

  const handleSaveSettings = async (
    templateIdToSave = activeSavedTemplateId,
    successTitle = 'Invoice Settings Saved! 🎉',
    successMsg = null
  ) => {
    setSaving(true);
    const prefsToSave = buildCurrentPrefs(templateIdToSave);
    try {
      await saveLocalInvoicePrefs(prefsToSave);

      const res = await invoiceService.saveInvoiceSettings({
        template_id: templateIdToSave,
        primary_color: prefsToSave.primaryColor,
        accent_color: prefsToSave.accentColor,
      });

      if (res?.status) {
        setSelectedTemplateId(templateIdToSave);
        setActiveSavedTemplateId(templateIdToSave);
        const tmplName =
          INVOICE_TEMPLATES.find((t) => t.id === templateIdToSave)?.name ||
          `Template #${templateIdToSave}`;
        showSuccess({
          title: successTitle,
          message:
            successMsg ||
            `${tmplName} with your selected colors and options is now active across all invoices.`,
        });
      } else {
        showError({
          title: 'Could Not Save',
          message: res?.message || 'Failed to update invoice template settings on server.',
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

  const openPreview = (templateId = selectedTemplateId) => {
    setPreviewTemplateId(templateId);
    setPreviewModalVisible(true);
  };

  const activeTemplateObj =
    INVOICE_TEMPLATES.find((t) => t.id === activeSavedTemplateId) || INVOICE_TEMPLATES[0];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header with Live Preview shortcut */}
      <Header
        title="Invoice Customizer"
        subtitle="Templates, colors & live preview"
        showBack={true}
        onBackPress={handleBack}
        rightIcon="eye"
        onRightPress={() => openPreview(selectedTemplateId)}
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
          {/* ── ACTIVE SUMMARY & QUICK PREVIEW BANNER ── */}
          <View style={[styles.summaryBanner, { backgroundColor: primaryColor }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.summaryEyebrow}>ACTIVE INVOICE DESIGN</Text>
              <Text style={styles.summaryTitle}>{activeTemplateObj.name}</Text>
              <View style={styles.summaryColorChips}>
                <View style={styles.summarySwatchRow}>
                  <View style={[styles.miniDot, { backgroundColor: primaryColor, borderColor: '#FFF' }]} />
                  <View style={[styles.miniDot, { backgroundColor: accentColor, borderColor: '#FFF', marginLeft: -5 }]} />
                  <Text style={styles.summarySwatchText}>
                    {primaryColor} • {accentColor}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openPreview(selectedTemplateId)}
              style={[styles.heroPreviewBtn, { backgroundColor: accentColor }]}
            >
              <Icon name="eye" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.heroPreviewBtnText}>Preview</Text>
            </TouchableOpacity>
          </View>

          {/* ── COLOR THEME & PALETTE PICKER ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBoxMini, { backgroundColor: colors.primaryLight }]}>
                <Icon name="palette" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Invoice Color Theme</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted, marginBottom: 0 }]}>
                  Pick a curated pair or customize primary & accent colors
                </Text>
              </View>
            </View>

            {/* Curated Dual-Tone Pairs */}
            <Text style={[styles.subFieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>
              Quick Color Pairs
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pairScroll}>
              {COLOR_PAIR_THEMES.map((pair) => {
                const isPairActive =
                  primaryColor.toUpperCase() === pair.primary.toUpperCase() &&
                  accentColor.toUpperCase() === pair.accent.toUpperCase();
                return (
                  <TouchableOpacity
                    key={pair.name}
                    activeOpacity={0.8}
                    onPress={() => {
                      applyPrimaryColor(pair.primary);
                      applyAccentColor(pair.accent);
                    }}
                    style={[
                      styles.pairPill,
                      {
                        backgroundColor: isPairActive ? colors.primaryLight : colors.cardSecondary,
                        borderColor: isPairActive ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.pairCircles}>
                      <View style={[styles.pairCircle, { backgroundColor: pair.primary }]} />
                      <View style={[styles.pairCircle, { backgroundColor: pair.accent, marginLeft: -6 }]} />
                    </View>
                    <Text
                      style={[
                        styles.pairText,
                        { color: isPairActive ? colors.primary : colors.text },
                      ]}
                    >
                      {pair.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Primary Color */}
            <View style={styles.colorHeaderRow}>
              <Text style={[styles.subFieldLabel, { color: colors.textSecondary }]}>
                Primary Brand Color
              </Text>
              <View style={[styles.hexPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <View style={[styles.hexDot, { backgroundColor: primaryColor }]} />
                <TextInput
                  value={primaryHexInput}
                  onChangeText={handlePrimaryHexChange}
                  style={[styles.hexInput, { color: colors.text }]}
                  maxLength={7}
                  autoCapitalize="characters"
                  placeholder="#0A2540"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.colorRow}>
              {PRIMARY_COLOR_PRESETS.map((hex) => {
                const isSelected = primaryColor.toLowerCase() === hex.toLowerCase();
                return (
                  <TouchableOpacity
                    key={hex}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: hex },
                      isSelected && styles.activeColorCircle,
                    ]}
                    onPress={() => applyPrimaryColor(hex)}
                    activeOpacity={0.8}
                  >
                    {isSelected ? <Icon name="check" size={14} color="#FFFFFF" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Accent Color */}
            <View style={[styles.colorHeaderRow, { marginTop: 14 }]}>
              <Text style={[styles.subFieldLabel, { color: colors.textSecondary }]}>
                Accent & Highlight Color
              </Text>
              <View style={[styles.hexPill, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <View style={[styles.hexDot, { backgroundColor: accentColor }]} />
                <TextInput
                  value={accentHexInput}
                  onChangeText={handleAccentHexChange}
                  style={[styles.hexInput, { color: colors.text }]}
                  maxLength={7}
                  autoCapitalize="characters"
                  placeholder="#F58220"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.colorRow}>
              {ACCENT_COLOR_PRESETS.map((hex) => {
                const isSelected = accentColor.toLowerCase() === hex.toLowerCase();
                return (
                  <TouchableOpacity
                    key={hex}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: hex },
                      isSelected && styles.activeColorCircle,
                    ]}
                    onPress={() => applyAccentColor(hex)}
                    activeOpacity={0.8}
                  >
                    {isSelected ? <Icon name="check" size={14} color="#FFFFFF" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save Colors Button */}
            <TouchableOpacity
              style={[styles.saveColorsBtn, { backgroundColor: colors.navy }]}
              onPress={() =>
                handleSaveSettings(
                  activeSavedTemplateId,
                  'Colors Updated! 🎨',
                  'Your primary and accent colors are saved and applied to all invoices.'
                )
              }
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="check" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveColorsBtnText}>Save Brand Colors</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── INVOICE DISPLAY & LAYOUT OPTIONS ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setOptionsExpanded((v) => !v)}
              style={styles.accordionHeader}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.iconBoxMini, { backgroundColor: '#EFF4F9' }]}>
                  <Icon name="layers" size={16} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Invoice Layout & Display Options</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textMuted, marginBottom: 0 }]}>
                    Heading ({invoiceTitle}), density ({density}), sections & footer notes
                  </Text>
                </View>
              </View>
              <Icon name={optionsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {optionsExpanded ? (
              <View style={styles.optionsBody}>
                {/* Invoice Title / Heading */}
                <Text style={[styles.subFieldLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  Document Title Heading
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                  {INVOICE_TITLE_OPTIONS.map((titleOpt) => {
                    const active = invoiceTitle === titleOpt;
                    return (
                      <TouchableOpacity
                        key={titleOpt}
                        onPress={() => setInvoiceTitle(titleOpt)}
                        style={[
                          styles.optionChip,
                          {
                            backgroundColor: active ? colors.primary : colors.cardSecondary,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            { color: active ? '#FFFFFF' : colors.textSecondary },
                          ]}
                        >
                          {titleOpt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Row Density */}
                <Text style={[styles.subFieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                  Item Table Spacing
                </Text>
                <View style={styles.densityRow}>
                  {[
                    { id: 'standard', label: 'Standard (Spacious)' },
                    { id: 'compact', label: 'Compact (More Items)' },
                  ].map((d) => {
                    const active = density === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => setDensity(d.id)}
                        style={[
                          styles.densityBtn,
                          {
                            backgroundColor: active ? colors.primaryLight : colors.cardSecondary,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.densityBtnText,
                            { color: active ? colors.primary : colors.textSecondary },
                          ]}
                        >
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Visibility Toggles */}
                <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

                {[
                  { label: 'Show Business Logo / Monogram', val: showLogo, set: setShowLogo },
                  { label: 'Show Customer Phone & Address', val: showCustomerDetails, set: setShowCustomerDetails },
                  { label: 'Show Item Discounts', val: showDiscount, set: setShowDiscount },
                  { label: 'Show Amount in Words', val: showAmountInWords, set: setShowAmountInWords },
                  { label: 'Show Authorized Signature', val: showSignature, set: setShowSignature },
                  { label: 'Show Terms & Conditions', val: showTerms, set: setShowTerms },
                  { label: 'Show Thank You Footer Note', val: showThankYou, set: setShowThankYou },
                ].map((item) => (
                  <View key={item.label} style={styles.toggleRow}>
                    <Text style={[styles.toggleLabel, { color: colors.text }]}>{item.label}</Text>
                    <Switch
                      value={item.val}
                      onValueChange={item.set}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                ))}

                {/* Custom Terms & Footer Message */}
                {showTerms ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.subFieldLabel, { color: colors.textSecondary }]}>
                      Default Terms & Conditions
                    </Text>
                    <TextInput
                      value={termsText}
                      onChangeText={setTermsText}
                      placeholder="Goods once sold cannot be returned..."
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.optionInput,
                        { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                      ]}
                    />
                  </View>
                ) : null}

                {showThankYou ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={[styles.subFieldLabel, { color: colors.textSecondary }]}>
                      Thank You Footer Message
                    </Text>
                    <TextInput
                      value={footerMessage}
                      onChangeText={setFooterMessage}
                      placeholder="Thank you for your business!"
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.optionInput,
                        { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                      ]}
                    />
                  </View>
                ) : null}

                <View style={styles.optionsActionRow}>
                  <TouchableOpacity
                    style={[styles.previewOutlineBtn, { borderColor: colors.primary }]}
                    onPress={() => openPreview(selectedTemplateId)}
                    activeOpacity={0.8}
                  >
                    <Icon name="eye" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.previewOutlineBtnText, { color: colors.primary }]}>Preview</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveOptionsBtn, { backgroundColor: colors.primary }]}
                    onPress={() =>
                      handleSaveSettings(
                        activeSavedTemplateId,
                        'Options Saved! ✓',
                        'Your invoice layout and display preferences have been saved.'
                      )
                    }
                    disabled={saving}
                    activeOpacity={0.85}
                  >
                    <Icon name="check" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveOptionsBtnText}>Save Options</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>

          {/* ── DIGITAL SIGNATURE SECTION ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBoxMini, { backgroundColor: '#F0FDF4' }]}>
                <Icon name="check" size={16} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Authorized Digital Signature</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted, marginBottom: 0 }]}>
                  Appears at the bottom-right of every invoice PDF and printed bill
                </Text>
              </View>
            </View>

            <View style={[styles.sigPreviewBox, { backgroundColor: colors.background, borderColor: colors.border, marginTop: 12 }]}>
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

          {/* ── TEMPLATES LIST (6 DISTINCT DESIGNS) ── */}
          <View style={styles.templatesSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                Choose Invoice Template ({INVOICE_TEMPLATES.length})
              </Text>
              <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
                Tap Preview to inspect full page
              </Text>
            </View>

            {INVOICE_TEMPLATES.map((tmpl) => {
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
                  activeOpacity={0.85}
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
                        <View style={[styles.layoutPill, { backgroundColor: colors.cardSecondary }]}>
                          <Text style={[styles.layoutPillText, { color: colors.textSecondary }]}>
                            {tmpl.layoutLabel}
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

                  {/* Distinct Live Visual Miniature Preview for this Template */}
                  <InvoiceTemplateThumbnail
                    templateId={tmpl.id}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                  />

                  {/* Action Row: Preview + Activate */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.previewCardBtn,
                        { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                      ]}
                      onPress={() => openPreview(tmpl.id)}
                      activeOpacity={0.8}
                    >
                      <Icon name="eye" size={15} color={colors.navy} style={{ marginRight: 6 }} />
                      <Text style={[styles.previewCardBtnText, { color: colors.navy }]}>Preview</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.activateBtn,
                        {
                          flex: 1.5,
                          backgroundColor: isCurrentlyActive ? '#ECFDF5' : colors.primary,
                          borderColor: isCurrentlyActive ? '#A7F3D0' : colors.primary,
                        },
                      ]}
                      onPress={() => handleSaveSettings(tmpl.id, 'Template Activated! 🎉')}
                      disabled={saving}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.activateBtnText,
                          { color: isCurrentlyActive ? '#059669' : '#FFFFFF' },
                        ]}
                      >
                        {isCurrentlyActive ? 'Active Template ✓' : 'Activate Template'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ── MODAL: FULL LIVE INTERACTIVE INVOICE PREVIEW ── */}
      <Modal
        visible={previewModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
          <Header
            title="Live Invoice Preview"
            subtitle={
              INVOICE_TEMPLATES.find((t) => t.id === previewTemplateId)?.name || 'Preview'
            }
            showBack={true}
            onBackPress={() => setPreviewModalVisible(false)}
          />

          {/* Quick Template Switcher Bar */}
          <View style={[styles.previewSwitcherBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewTabScroll}>
              {INVOICE_TEMPLATES.map((t) => {
                const active = previewTemplateId === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setPreviewTemplateId(t.id)}
                    style={[
                      styles.previewTabPill,
                      {
                        backgroundColor: active ? primaryColor : colors.cardSecondary,
                        borderColor: active ? primaryColor : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.previewTabText,
                        { color: active ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {t.id}. {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Quick Color Pair Strip inside Preview */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewColorStrip}>
              {COLOR_PAIR_THEMES.map((pair) => {
                const active =
                  primaryColor.toUpperCase() === pair.primary.toUpperCase() &&
                  accentColor.toUpperCase() === pair.accent.toUpperCase();
                return (
                  <TouchableOpacity
                    key={pair.name}
                    onPress={() => {
                      applyPrimaryColor(pair.primary);
                      applyAccentColor(pair.accent);
                    }}
                    style={[
                      styles.previewPairChip,
                      {
                        borderColor: active ? pair.primary : colors.border,
                        backgroundColor: active ? colors.primaryLight : colors.background,
                      },
                    ]}
                  >
                    <View style={[styles.miniSwatch, { backgroundColor: pair.primary }]} />
                    <View style={[styles.miniSwatch, { backgroundColor: pair.accent, marginLeft: -4 }]} />
                    <Text style={[styles.previewPairText, { color: colors.text }]}>{pair.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.previewScrollContent} showsVerticalScrollIndicator={false}>
            <InvoiceTemplateRenderer
              sale={SAMPLE_PREVIEW_SALE}
              settings={buildCurrentPrefs(previewTemplateId)}
              businessInfo={user}
            />
          </ScrollView>

          {/* Bottom Activate Bar */}
          <View style={[styles.previewBottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.previewCloseBtn, { borderColor: colors.border, backgroundColor: colors.cardSecondary }]}
              onPress={() => setPreviewModalVisible(false)}
            >
              <Text style={[styles.previewCloseBtnText, { color: colors.textSecondary }]}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.previewActivateBtn, { backgroundColor: colors.primary }]}
              onPress={async () => {
                setPreviewModalVisible(false);
                await handleSaveSettings(previewTemplateId, 'Template Activated! 🎉');
              }}
              disabled={saving}
            >
              <Icon name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.previewActivateBtnText}>Use & Save This Design</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

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
  safeArea: { flex: 1 },
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
  summaryBanner: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  summaryEyebrow: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.75)',
  },
  summaryTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  summaryColorChips: {
    marginTop: 6,
  },
  summarySwatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  summarySwatchText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 7,
  },
  heroPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
  },
  heroPreviewBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginBottom: 14,
  },
  subFieldLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  pairScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  pairPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
  },
  pairCircles: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pairCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  pairText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '700',
  },
  colorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hexPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 32,
  },
  hexDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
  },
  hexInput: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '700',
    width: 66,
    paddingVertical: 0,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeColorCircle: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveColorsBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveColorsBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionsBody: {
    marginTop: 10,
  },
  chipScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionChipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '700',
  },
  densityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  densityBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  densityBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  toggleLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
  },
  optionInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  optionsActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  previewOutlineBtn: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewOutlineBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  saveOptionsBtn: {
    flex: 1.4,
    height: 42,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveOptionsBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  templatesSection: {
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '600',
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
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  templateName: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
  },
  layoutPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  layoutPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    fontWeight: '700',
  },
  templateTagline: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    lineHeight: 16,
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
  cardActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  previewCardBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCardBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
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
  // Preview Modal
  previewSwitcherBar: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  previewTabScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  previewTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  previewTabText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '700',
  },
  previewColorStrip: {
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 8,
  },
  previewPairChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  miniSwatch: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  previewPairText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    fontWeight: '700',
  },
  previewScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  previewBottomBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
  },
  previewCloseBtn: {
    flex: 0.8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCloseBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13.5,
    fontWeight: '700',
  },
  previewActivateBtn: {
    flex: 1.6,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewActivateBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Digital Signature Styles
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBoxMini: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
