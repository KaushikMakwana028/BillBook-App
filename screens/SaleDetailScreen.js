/**
 * BillBook Sale Detail & Tax Invoice Screen
 * Displays comprehensive invoice with:
 * - View Invoice (in-app modal preview)
 * - View PDF (opens official print / PDF view)
 * - View JPG (opens official rendered JPG image)
 * - Send WhatsApp (routes via BillBook Official Account / Meta Cloud API or connected WhatsApp)
 * - Delete Invoice (with confirmation)
 */

import React, { useState, useEffect } from 'react';
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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import salesService from '../services/salesService';
import whatsappService from '../services/whatsappService';
import invoiceService from '../services/invoiceService';
import { resolveProductImageUrl, resolveSignatureUrl } from '../utils/imageUrl';
import { Header, Icon } from '../components';
import { FONT_FAMILY } from '../components/fonts';

// Indian currency words converter
const numberToWordsIndian = (num) => {
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Zero Rupees only';
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convert = (n) => {
    let str = '';
    if (n >= 10000000) {
      str += convert(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += convert(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += convert(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str;
  };
  return convert(num).trim() + ' Rupees only';
};

export function SaleDetailScreen({ navigation, route, params: propParams, onGoBack, onNavigate }) {
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
  const [signatureUrl, setSignatureUrl] = useState('');

  // Fetch full details
  const fetchSaleDetail = async () => {
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
  };

  useEffect(() => {
    fetchSaleDetail();
    // Fetch authorized digital signature from invoice settings
    invoiceService
      .getInvoiceSettings()
      .then((res) => {
        if (res?.status && res?.data?.signature_url) {
          setSignatureUrl(res.data.signature_url);
        }
      })
      .catch(() => {});
  }, [saleId]);

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

  // Financial fields
  const subtotal = parseFloat(sale.subtotal || sale.total_amount || 0);
  const discountAmount = parseFloat(sale.discount_amount || sale.discount || 0);
  const grandTotal = parseFloat(sale.grand_total || sale.total_amount || 0);
  const items = Array.isArray(sale.items) ? sale.items : [];
  const primaryColor = sale.invoice_settings?.primary_color || '#0A2540';
  const accentColor = sale.invoice_settings?.accent_color || '#F58220';
  const activeSignature = resolveSignatureUrl(
    sale.signature_url || sale.invoice_settings?.signature_url || signatureUrl
  );

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
              {/* 1. View Invoice Button */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                onPress={() => setViewInvoiceModal(true)}
                activeOpacity={0.75}
              >
                <Icon name="eye" size={16} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>View</Text>
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

            <View style={[styles.grandTotalBanner, { backgroundColor: colors.primary }]}>
              <Text style={styles.grandTotalBannerLabel}>GRAND TOTAL</Text>
              <Text style={styles.grandTotalBannerVal}>{formatCurrency(grandTotal)}</Text>
            </View>

            <View style={[styles.amountWordsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.amountWordsLabel, { color: colors.primary }]}>INVOICE AMOUNT IN WORDS</Text>
              <Text style={[styles.amountWordsText, { color: colors.text }]}>{numberToWordsIndian(grandTotal)}</Text>
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

      {/* ── MODAL: FULL VIEW INVOICE MODAL ── */}
      <Modal
        visible={viewInvoiceModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setViewInvoiceModal(false)}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
          <Header
            title={`Invoice #${sale.invoice_number || sale.id}`}
            subtitle="Full Document View"
            showBack={true}
            onBackPress={() => setViewInvoiceModal(false)}
          />

          <ScrollView contentContainerStyle={styles.modalFullSheetScroll}>
            <View style={[styles.invoiceSheet, { backgroundColor: '#FFFFFF', borderColor: colors.border }]}>
              {/* Top Banner */}
              <View style={[styles.sheetBanner, { backgroundColor: primaryColor }]}>
                <View style={styles.bannerLeft}>
                  <View style={styles.storeLogoBox}>
                    <Text style={styles.storeLogoText}>
                      {(sale.business_info?.name || 'BILLBOOK').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.bannerInfo}>
                    <Text style={styles.bannerStoreName}>
                      {sale.business_info?.name || 'BILLBOOK STORE'}
                    </Text>
                    <Text style={styles.bannerStoreAddress}>
                      {sale.business_info?.address || 'Ahmedabad, Gujarat, India'}
                    </Text>
                  </View>
                </View>
                <View style={styles.bannerRight}>
                  <Text style={styles.bannerTagline}>TAX INVOICE</Text>
                  <Text style={styles.bannerInvoiceNum}>#{sale.invoice_number || sale.id}</Text>
                </View>
              </View>

              {/* Meta */}
              <View style={styles.sheetMetaRow}>
                <View style={styles.billToBox}>
                  <Text style={[styles.metaLabel, { color: accentColor }]}>BILL TO</Text>
                  <Text style={styles.customerName}>{sale.customer_name || 'Walk-in Customer'}</Text>
                  {sale.customer_phone ? <Text style={styles.metaSub}>Phone: {sale.customer_phone}</Text> : null}
                  {sale.customer_address ? <Text style={styles.metaSub}>Address: {sale.customer_address}</Text> : null}
                </View>
                <View style={styles.invoiceMetaBox}>
                  <Text style={[styles.metaLabel, { color: accentColor }]}>INVOICE DETAILS</Text>
                  <Text style={styles.metaSub}>Date: {sale.sale_date || sale.date || 'Today'}</Text>
                  <View style={styles.statusPillPaid}>
                    <Text style={styles.statusPillPaidText}>PAID</Text>
                  </View>
                </View>
              </View>

              {/* Table */}
              <View style={styles.tableCard}>
                <View style={[styles.tableHeader, { backgroundColor: primaryColor }]}>
                  <Text style={[styles.tableCol, styles.colIndex]}>#</Text>
                  <Text style={[styles.tableCol, styles.colName]}>Item Name</Text>
                  <Text style={[styles.tableCol, styles.colQty]}>Qty</Text>
                  <Text style={[styles.tableCol, styles.colPrice]}>Rate</Text>
                  <Text style={[styles.tableCol, styles.colTotal]}>Amount</Text>
                </View>
                {items.map((it, idx) => (
                  <View key={idx} style={[styles.tableRow, idx % 2 === 1 && { backgroundColor: '#F8FAFC' }]}>
                    <Text style={[styles.tableRowCol, styles.colIndex]}>{idx + 1}</Text>
                    <Text style={[styles.tableRowCol, styles.colName, styles.boldDark]}>
                      {it.product_name || `Product #${it.product_id}`}
                    </Text>
                    <Text style={[styles.tableRowCol, styles.colQty, styles.boldDark]}>{it.quantity}</Text>
                    <Text style={[styles.tableRowCol, styles.colPrice]}>{formatCurrency(it.unit_price || it.price)}</Text>
                    <Text style={[styles.tableRowCol, styles.colTotal, styles.boldDark]}>
                      {formatCurrency(it.line_total || (it.unit_price || it.price) * it.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Summary */}
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Sub Total</Text>
                  <Text style={styles.summaryVal}>{formatCurrency(subtotal)}</Text>
                </View>
                {discountAmount > 0 ? (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>Discount</Text>
                    <Text style={[styles.summaryVal, { color: '#DC2626' }]}>- {formatCurrency(discountAmount)}</Text>
                  </View>
                ) : null}
                <View style={[styles.grandTotalRow, { backgroundColor: accentColor }]}>
                  <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
                  <Text style={styles.grandTotalVal}>{formatCurrency(grandTotal)}</Text>
                </View>
              </View>

              {/* Words */}
              <View style={styles.amountWordsBox}>
                <Text style={[styles.amountWordsLabel, { color: accentColor }]}>INVOICE AMOUNT IN WORDS</Text>
                <Text style={styles.amountWordsText}>{numberToWordsIndian(grandTotal)}</Text>
              </View>

              {/* Sign */}
              <View style={styles.footerNoteRow}>
                <View style={styles.termsBox}>
                  <Text style={styles.termsLabel}>TERMS & CONDITIONS</Text>
                  <Text style={styles.termsText}>{sale.notes || 'Goods once sold cannot be returned.'}</Text>
                </View>
                <View style={styles.signatoryBox}>
                  {activeSignature ? (
                    <Image
                      source={{ uri: activeSignature }}
                      style={styles.sheetSignatureImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.signLine} />
                  )}
                  <Text style={styles.signLabel}>Authorized Signatory</Text>
                </View>
              </View>
            </View>
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
  sheetSignatureImg: {
    width: 100,
    height: 40,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  // Authentic Tax Invoice Sheet Preview
  invoiceSheet: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  sheetBanner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  storeLogoText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerStoreName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerStoreAddress: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  bannerRight: {
    alignItems: 'flex-end',
  },
  bannerTagline: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bannerInvoiceNum: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  billToBox: {
    flex: 1,
  },
  invoiceMetaBox: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  customerName: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  boldDark: {
    fontWeight: '700',
    color: '#0F172A',
  },
  statusPillPaid: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusPillPaidText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  // Table
  tableCard: {
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableCol: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tableRowCol: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#334155',
  },
  colIndex: {
    width: 24,
    textAlign: 'center',
  },
  colName: {
    flex: 1,
    paddingHorizontal: 6,
  },
  colQty: {
    width: 36,
    textAlign: 'center',
  },
  colPrice: {
    width: 65,
    textAlign: 'right',
  },
  colTotal: {
    width: 75,
    textAlign: 'right',
  },
  emptyTable: {
    padding: 16,
    alignItems: 'center',
  },
  emptyTableText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: '#94A3B8',
  },
  // Summary
  summarySection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
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
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grandTotalVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  // Words
  amountWordsBox: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
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
  // Terms & Signatory
  footerNoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 12,
  },
  termsBox: {
    flex: 1,
  },
  termsLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 2,
  },
  termsText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: '#78350F',
    lineHeight: 14,
  },
  signatoryBox: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  signLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#94A3B8',
    marginBottom: 4,
  },
  signLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    color: '#64748B',
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
});

export default SaleDetailScreen;
