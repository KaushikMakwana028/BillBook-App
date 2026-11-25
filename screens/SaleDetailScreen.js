/**
 * BillBook Sale Detail & Tax Invoice Screen
 * Displays comprehensive invoice with:
 * - View Invoice (in-app modal preview)
 * - View PDF (opens official print / PDF view)
 * - View JPG (opens official rendered JPG image)
 * - Send WhatsApp (routes via BillBook Official Account / Meta Cloud API or connected WhatsApp)
 * - Delete Invoice (with confirmation)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import salesService from '../services/salesService';
import whatsappService from '../services/whatsappService';
import { resolveProductImageUrl, resolveSignatureUrl } from '../utils/imageUrl';
import { Header, Icon, InvoiceTemplateRenderer, SafeAreaView } from '../components';
import { FONT_FAMILY } from '../components/fonts';
import {
  DEFAULT_INVOICE_PREFS,
  INVOICE_TEMPLATES,
  loadMergedInvoicePrefs,
  normalizeHex,
  numberToWordsIndian as sharedNumberToWordsIndian,
} from '../utils/invoicePreferences';

export function SaleDetailScreen({ navigation, route, params: propParams, onGoBack, onNavigate }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showAlert, showConfirm, showSuccess, showError } = useAlert();

  const initialSale = route?.params?.sale || propParams?.sale || {};
  const saleId = initialSale.id || route?.params?.saleId || propParams?.saleId;

  const [sale, setSale] = useState(initialSale);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);
  const [viewInvoiceModal, setViewInvoiceModal] = useState(false);
  const [viewJpgModal, setViewJpgModal] = useState(false);
  const [invoicePrefs, setInvoicePrefs] = useState(DEFAULT_INVOICE_PREFS);
  const [previewTemplateOverride, setPreviewTemplateOverride] = useState(null);

  // Fetch full details
  const fetchSaleDetail = useCallback(async () => {
    if (!saleId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await salesService.getSaleDetail(saleId);
      if (res?.status && res?.data) {
        setSale(res.data);
      }
    } catch {
      // Keep initialSale
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    fetchSaleDetail();
    // Load active invoice template, colors, options & signature
    loadMergedInvoicePrefs({ bypassCache: true })
      .then((prefs) => {
        setInvoicePrefs(prefs);
      })
      .catch(() => {});
  }, [fetchSaleDetail]);

  const handleBack = () => {
    if (propParams?.fromCreate || route?.params?.fromCreate) {
      if (onNavigate) {
        onNavigate('Sales', { refresh: Date.now() });
        return;
      }
    }
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onGoBack) {
      onGoBack();
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return (
      '₹' +
      num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  // Generated document URLs
  const pdfUrl =
    sale.invoice_pdf_url ||
    sale.print_invoice_url ||
    `https://billbook.visiontechnolabs.com/sales/print_invoice/${sale.id}`;

  const jpgUrl =
    sale.invoice_image_url ||
    `https://billbook.visiontechnolabs.com/uploads/invoices/invoice-${sale.id}.jpg`;

  // 1. View PDF Action
  const handleOpenPdf = () => {
    Linking.openURL(pdfUrl).catch(() => {
      showAlert({
        title: 'Unable to Open PDF',
        message: 'Could not open PDF in browser. URL: ' + pdfUrl,
        type: 'warning',
      });
    });
  };

  // 2. View JPG Action
  const handleOpenJpg = () => {
    setViewJpgModal(true);
  };

  // 3. WhatsApp Dispatch Action (Uses BillBook Official Meta Cloud Account when not connected)
  const handleSendWhatsApp = async () => {
    const customerPhone = sale.customer_phone || sale.phone || '';
    if (!customerPhone || customerPhone === '-') {
      showAlert({
        title: 'Missing Customer Phone',
        message: 'This sale does not have a customer phone number attached.',
        type: 'warning',
      });
      return;
    }

    setSendingWa(true);
    try {
      const res = await whatsappService.sendInvoice(sale.id, customerPhone);
      if (res?.status) {
        const routeMsg =
          res?.data?.route === 'official'
            ? 'via BillBook Official Account (Meta Cloud API)'
            : 'via Connected WhatsApp Account';

        showSuccess({
          title: 'Invoice Dispatched! 🎉',
          message: `Invoice #${sale.invoice_number || sale.id} was successfully sent ${routeMsg} to +91 ${customerPhone}.`,
        });
      } else {
        // Fallback: offer to open native WhatsApp
        showConfirm({
          title: 'WhatsApp Dispatch',
          message:
            res?.message ||
            'Could not dispatch automatically. Would you like to open your WhatsApp app to send it directly?',
          confirmText: 'Open WhatsApp',
          cancelText: 'Cancel',
          onConfirm: () => {
            const cleanPhone = customerPhone.replace(/\D/g, '');
            const msg = encodeURIComponent(
              `Hello! Here is your Tax Invoice #${sale.invoice_number || sale.id} for ${formatCurrency(
                sale.grand_total || sale.total_amount
              )}.\nView invoice: ${pdfUrl}`
            );
            Linking.openURL(`whatsapp://send?phone=91${cleanPhone}&text=${msg}`).catch(() => {
              Linking.openURL(`https://wa.me/91${cleanPhone}?text=${msg}`);
            });
          },
        });
      }
    } catch (err) {
      showError({
        title: 'WhatsApp Error',
        message: err.response?.data?.message || err.message || 'Failed to dispatch WhatsApp message.',
      });
    } finally {
      setSendingWa(false);
    }
  };

  // 4. Delete Sale Action
  const handleDeleteSale = () => {
    showConfirm({
      title: 'Delete Sale Record',
      message: `Are you sure you want to permanently delete Invoice #${sale.invoice_number || sale.id}? This will remove it from your sales ledger.`,
      type: 'danger',
      confirmText: 'Delete Sale',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setDeleting(true);
        try {
          const res = await salesService.deleteSale(sale.id);
          if (res?.status) {
            showSuccess({
              title: 'Sale Deleted',
              message: `Invoice #${sale.invoice_number || sale.id} has been removed.`,
              onConfirm: () => {
                if (onNavigate) {
                  onNavigate('Sales', { refresh: true });
                } else {
                  handleBack();
                }
              },
            });
          } else {
            showError({
              title: 'Delete Failed',
              message: res?.message || 'Could not delete invoice.',
            });
          }
        } catch (err) {
          showError({
            title: 'Error',
            message: err.message || 'Failed to delete sale record.',
          });
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  // Financial fields & Active Invoice Theme
  const subtotal = parseFloat(sale.subtotal || sale.total_amount || 0);
  const discountAmount = parseFloat(sale.discount_amount || sale.discount || 0);
  const grandTotal = parseFloat(sale.grand_total || sale.total_amount || 0);
  const items = Array.isArray(sale.items) ? sale.items : [];
  const activeTemplateId = Number(
    invoicePrefs.templateId || sale.invoice_settings?.template_id || 1
  );
  const primaryColor = normalizeHex(
    invoicePrefs.primaryColor || sale.invoice_settings?.primary_color,
    '#0A2540'
  );
  const accentColor = normalizeHex(
    invoicePrefs.accentColor || sale.invoice_settings?.accent_color,
    '#F58220'
  );
  const activeSignature = resolveSignatureUrl(
    sale.signature_url || sale.invoice_settings?.signature_url || invoicePrefs.signatureUrl
  );

  const handleOpenInvoicePreview = () => {
    setPreviewTemplateOverride(null);
    loadMergedInvoicePrefs({ bypassCache: true })
      .then((prefs) => setInvoicePrefs(prefs))
      .catch(() => {});
    setViewInvoiceModal(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Header
        title={`Invoice #${sale.invoice_number || sale.id || ''}`}
        subtitle={sale.customer_name || 'Walk-in Customer'}
        showBack={true}
        onBackPress={handleBack}
        rightIcon="delete"
        onRightPress={handleDeleteSale}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading invoice details...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── ACTION BUTTONS TOOLBAR (View, WhatsApp, PDF, JPG) - 2x2 Grid, No Overflow ── */}
          <View style={[styles.toolbarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.toolbarTitle, { color: colors.textMuted }]}>INVOICE ACTIONS</Text>

            <View style={styles.actionGrid}>
              {/* 1. View / Preview Invoice Button */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: primaryColor, borderColor: primaryColor }]}
                onPress={handleOpenInvoicePreview}
                activeOpacity={0.75}
              >
                <Icon name="eye" size={16} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Preview Invoice</Text>
              </TouchableOpacity>

              {/* 2. WhatsApp Button */}
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
                  sendingWa && { opacity: 0.6 },
                ]}
                onPress={handleSendWhatsApp}
                disabled={sendingWa}
                activeOpacity={0.75}
              >
                {sendingWa ? (
                  <ActivityIndicator size="small" color="#16A34A" />
                ) : (
                  <>
                    <Icon name="whatsapp" size={16} color="#16A34A" />
                    <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>WhatsApp</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* 3. PDF View Button */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                onPress={handleOpenPdf}
                activeOpacity={0.75}
              >
                <Icon name="document" size={16} color="#DC2626" />
                <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>PDF</Text>
              </TouchableOpacity>

              {/* 4. JPG View Button */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                onPress={handleOpenJpg}
                activeOpacity={0.75}
              >
                <Icon name="camera" size={16} color="#059669" />
                <Text style={[styles.actionBtnText, { color: '#059669' }]}>JPG</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 1. ORDER & SALE OVERVIEW CARD ── */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconBox, { backgroundColor: colors.primaryLight }]}>
                <Icon name="receipt" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Invoice #{sale.invoice_number || sale.id}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                  Date: {sale.sale_date || sale.date || 'Today'}
                </Text>
              </View>
              <View style={styles.statusPillPaid}>
                <Text style={styles.statusPillPaidText}>PAID</Text>
              </View>
            </View>

            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metaRow}>
              <Text style={[styles.metaRowLabel, { color: colors.textMuted }]}>Payment Method</Text>
              <Text style={[styles.metaRowValue, { color: colors.text }]}>
                {sale.payment_mode || sale.payment_method || 'Cash / POS Counter'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={[styles.metaRowLabel, { color: colors.textMuted }]}>Total Items Count</Text>
              <Text style={[styles.metaRowValue, { color: colors.text }]}>
                {items.length} {items.length === 1 ? 'Product' : 'Products'}
              </Text>
            </View>
          </View>

          {/* ── 2. CUSTOMER DETAILS CARD ── */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconBox, { backgroundColor: '#EFF4F9' }]}>
                <Icon name="user" size={16} color="#0A2540" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Customer Details</Text>
            </View>

            <View style={styles.infoField}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>CUSTOMER NAME</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                {sale.customer_name || 'Walk-in Customer'}
              </Text>
            </View>

            {sale.customer_phone ? (
              <View style={styles.infoField}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>MOBILE NUMBER</Text>
                <View style={styles.fieldValueWithAction}>
                  <Text style={[styles.fieldValue, { color: colors.text }]}>+91 {sale.customer_phone}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${sale.customer_phone}`)}
                      style={[styles.miniActionPill, { backgroundColor: colors.primaryLight }]}
                      activeOpacity={0.7}
                    >
                      <Icon name="phone" size={11} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.miniActionText, { color: colors.primary }]}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const clean = (sale.customer_phone || '').replace(/\D/g, '');
                        Linking.openURL(`https://wa.me/91${clean}`);
                      }}
                      style={[styles.miniActionPill, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', borderWidth: 1 }]}
                      activeOpacity={0.7}
                    >
                      <Icon name="whatsapp" size={11} color="#16A34A" style={{ marginRight: 4 }} />
                      <Text style={[styles.miniActionText, { color: '#16A34A' }]}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : null}

            {sale.customer_address ? (
              <View style={styles.infoField}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>BILLING / DELIVERY ADDRESS</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>{sale.customer_address}</Text>
              </View>
            ) : null}
          </View>

          {/* ── 3. PURCHASED ITEMS BREAKDOWN ── */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="box" size={16} color="#059669" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Purchased Items ({items.length})
              </Text>
            </View>

            {items.map((it, idx) => {
              const itemImg = resolveProductImageUrl(it.product_image || it.image || it.image_url);

              return (
                <View
                  key={idx}
                  style={[styles.itemDetailCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <View style={styles.itemDetailTop}>
                    {itemImg ? (
                      <Image source={{ uri: itemImg }} style={styles.itemDetailThumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.itemDetailPlaceholder, { backgroundColor: colors.primaryLight }]}>
                        <Icon name="box" size={14} color={colors.primary} />
                      </View>
                    )}

                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={[styles.itemDetailName, { color: colors.text }]} numberOfLines={2}>
                        {it.product_name || `Product #${it.product_id}`}
                      </Text>
                      <Text style={[styles.itemDetailSub, { color: colors.textMuted }]}>
                        Qty: {it.quantity} × {formatCurrency(it.unit_price || it.price)}
                      </Text>
                    </View>

                    <Text style={[styles.itemDetailTotal, { color: colors.primary }]}>
                      {formatCurrency(it.line_total || (parseFloat(it.unit_price || it.price) * it.quantity))}
                    </Text>
                  </View>

                  {(parseFloat(it.discount) > 0 || parseFloat(it.discount_percent) > 0) ? (
                    <View style={styles.itemDiscTag}>
                      <Text style={styles.itemDiscTagText}>
                        Discount: {it.discount ? `₹${it.discount}` : ''} {it.discount_percent ? `(${it.discount_percent}%)` : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* ── 4. PAYMENT & TOTAL SUMMARY ── */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="receipt" size={16} color="#D97706" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Summary</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Sub Total</Text>
              <Text style={[styles.summaryVal, { color: colors.text }]}>{formatCurrency(subtotal)}</Text>
            </View>

            {discountAmount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>Total Discount</Text>
                <Text style={[styles.summaryVal, { color: '#DC2626' }]}>- {formatCurrency(discountAmount)}</Text>
              </View>
            ) : null}

            <View style={[styles.grandTotalBanner, { backgroundColor: primaryColor }]}>
              <Text style={styles.grandTotalBannerLabel}>GRAND TOTAL</Text>
              <View style={{ backgroundColor: accentColor, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={styles.grandTotalBannerVal}>{formatCurrency(grandTotal)}</Text>
              </View>
            </View>

            <View style={[styles.amountWordsCard, { backgroundColor: colors.background, borderColor: accentColor }]}>
              <Text style={[styles.amountWordsLabel, { color: accentColor }]}>INVOICE AMOUNT IN WORDS</Text>
              <Text style={[styles.amountWordsText, { color: colors.text }]}>{sharedNumberToWordsIndian(grandTotal)}</Text>
            </View>
          </View>

          {/* ── 5. AUTHORIZED DIGITAL SIGNATURE CARD ── */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Icon name="check" size={16} color="#16A34A" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Authorized Digital Signature</Text>
            </View>

            {activeSignature ? (
              <View style={[styles.signaturePreviewBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Image
                  source={{ uri: activeSignature }}
                  style={styles.signatureImage}
                  resizeMode="contain"
                />
                <Text style={[styles.signatureLabel, { color: colors.textMuted }]}>
                  Officially verified & stamped for Invoice #{sale.invoice_number || sale.id}
                </Text>
              </View>
            ) : (
              <View style={[styles.noSignatureBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.noSignatureText, { color: colors.textMuted }]}>
                  Standard authorization applied. Manage signature in Profile / Templates.
                </Text>
              </View>
            )}
          </View>

          {/* Delete Invoice Button */}
          <TouchableOpacity
            style={[styles.deleteCardBtn, { borderColor: colors.danger, backgroundColor: colors.dangerLight }]}
            onPress={handleDeleteSale}
            disabled={deleting}
            activeOpacity={0.8}
          >
            <Icon name="delete" size={17} color={colors.danger} />
            <Text style={[styles.deleteCardBtnText, { color: colors.danger }]}>
              {deleting ? 'Deleting...' : 'Delete Sale Record'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── MODAL: VIEW JPG IMAGE MODAL ── */}
      <Modal
        visible={viewJpgModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewJpgModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Invoice JPG Image</Text>
              <TouchableOpacity onPress={() => setViewJpgModal(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.imageScrollContainer}>
              <Image
                source={{ uri: jpgUrl }}
                style={styles.modalImagePreview}
                resizeMode="contain"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.primaryModalBtn, { backgroundColor: colors.primary }]}
                onPress={() => Linking.openURL(jpgUrl)}
              >
                <Icon name="download" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryModalBtnText}>Open Original JPG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: FULL VIEW / PREVIEW INVOICE MODAL ── */}
      <Modal
        visible={viewInvoiceModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setViewInvoiceModal(false)}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
          <Header
            title={`Invoice #${sale.invoice_number || sale.id}`}
            subtitle={
              INVOICE_TEMPLATES.find(
                (t) => t.id === (previewTemplateOverride ?? activeTemplateId)
              )?.name || 'Full Document Preview'
            }
            showBack={true}
            onBackPress={() => setViewInvoiceModal(false)}
            rightIcon="palette"
            onRightPress={() => {
              setViewInvoiceModal(false);
              if (onNavigate) onNavigate('InvoiceTemplates');
            }}
          />

          {/* Template Quick Switcher Strip */}
          <View style={[styles.templateSwitcherBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateSwitcherScroll}>
              {INVOICE_TEMPLATES.map((t) => {
                const currentId = previewTemplateOverride ?? activeTemplateId;
                const isSelected = currentId === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setPreviewTemplateOverride(t.id)}
                    style={[
                      styles.templateSwitchPill,
                      {
                        backgroundColor: isSelected ? primaryColor : colors.cardSecondary,
                        borderColor: isSelected ? primaryColor : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.templateSwitchText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {t.id}. {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.modalFullSheetScroll} showsVerticalScrollIndicator={false}>
            <InvoiceTemplateRenderer
              sale={sale}
              settings={{
                ...invoicePrefs,
                templateId: previewTemplateOverride ?? activeTemplateId,
                primaryColor,
                accentColor,
                signatureUrl: activeSignature || invoicePrefs.signatureUrl,
              }}
              businessInfo={user}
            />
          </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 48,
  },
  // Toolbar Card
  toolbarCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  toolbarTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionBtn: {
    width: '48%',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  // Info Cards
  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
  },
  statusPillPaid: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillPaidText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  metaDivider: {
    height: 1,
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metaRowLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  metaRowValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  infoField: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  fieldValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldValueWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniActionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  itemDetailCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  itemDetailTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetailThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  itemDetailPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetailName: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  itemDetailSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
  },
  itemDetailTotal: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
  },
  itemDiscTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  itemDiscTagText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  grandTotalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  grandTotalBannerLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grandTotalBannerVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  amountWordsCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  signaturePreviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  signatureImage: {
    width: 140,
    height: 50,
    marginBottom: 6,
  },
  signatureLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontStyle: 'italic',
  },
  noSignatureBox: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },
  noSignatureText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#64748B',
  },
  summaryVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  amountWordsLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  amountWordsText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontStyle: 'italic',
    color: '#0369A1',
  },
  // Delete Button
  deleteCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  deleteCardBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  imageScrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalImagePreview: {
    width: 320,
    height: 420,
    borderRadius: 12,
  },
  modalFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  primaryModalBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryModalBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalFullSheetScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  templateSwitcherBar: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  templateSwitcherScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  templateSwitchPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  templateSwitchText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '700',
  },
});

export default SaleDetailScreen;
