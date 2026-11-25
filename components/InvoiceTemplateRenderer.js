/**
 * BillBook Shared Invoice Template Renderer & Mini Thumbnails
 * Renders 6 genuinely distinct, color-accurate invoice designs:
 * 1. Modern Slate (Banner + Tinted Cards)
 * 2. Classic Corporate (Formal Letterhead + Full Grid Table)
 * 3. Creative Accent (Left Accent Stripe + Floating Pills)
 * 4. Thermal POS Receipt (Narrow 80mm Receipt + Dashed Rules + Barcode)
 * 5. Minimalist Clean (Editorial Whitespace + Typographic Rules)
 * 6. Executive Detailed (Double-Framed Tax Invoice + 3-Col Meta)
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FONT_FAMILY } from './fonts';
import { BarcodeView } from './BarcodeView';
import { resolveSignatureUrl } from '../utils/imageUrl';
import {
  DEFAULT_INVOICE_PREFS,
  formatInvoiceCurrency,
  hexToRgba,
  normalizeHex,
  numberToWordsIndian,
} from '../utils/invoicePreferences';

function resolveInvoiceContext(sale = {}, settings = {}, businessInfo = {}) {
  const prefs = { ...DEFAULT_INVOICE_PREFS, ...settings };
  const templateId = Number(prefs.templateId || 1);
  const primaryColor = normalizeHex(prefs.primaryColor, '#0A2540');
  const accentColor = normalizeHex(prefs.accentColor, '#F58220');
  const isCompact = prefs.density === 'compact';

  const bizName =
    sale?.business_info?.name ||
    businessInfo?.business_name ||
    businessInfo?.name ||
    'BILLBOOK STORE';
  const bizAddress =
    sale?.business_info?.address ||
    businessInfo?.address ||
    'Ahmedabad, Gujarat, India';
  const bizPhone =
    sale?.business_info?.phone ||
    businessInfo?.mobile ||
    businessInfo?.phone ||
    '';
  const bizGstin =
    sale?.business_info?.gstin ||
    businessInfo?.gstin ||
    businessInfo?.gst_number ||
    '';

  const items = Array.isArray(sale?.items) ? sale.items : [];
  const subtotal = parseFloat(sale?.subtotal ?? sale?.total_amount ?? 0);
  const discountAmount = parseFloat(sale?.discount_amount ?? sale?.discount ?? 0);
  const grandTotal = parseFloat(sale?.grand_total ?? sale?.total_amount ?? 0);
  const invoiceNo = String(sale?.invoice_number || sale?.id || '001');
  const saleDate = sale?.sale_date || sale?.date || 'Today';
  const paymentMode = sale?.payment_mode || sale?.payment_method || 'Cash / UPI';
  const paymentStatus = String(sale?.status || sale?.payment_status || 'PAID').toUpperCase();
  const customerName = sale?.customer_name || sale?.party_name || 'Walk-in Customer';
  const customerPhone = sale?.customer_phone || sale?.phone || '';
  const customerAddress = sale?.customer_address || '';
  const notes = sale?.notes || prefs.termsText;

  const activeSignature = resolveSignatureUrl(
    sale?.signature_url || sale?.invoice_settings?.signature_url || prefs.signatureUrl
  );

  return {
    prefs,
    templateId,
    primaryColor,
    accentColor,
    isCompact,
    bizName,
    bizAddress,
    bizPhone,
    bizGstin,
    items,
    subtotal,
    discountAmount,
    grandTotal,
    invoiceNo,
    saleDate,
    paymentMode,
    paymentStatus,
    customerName,
    customerPhone,
    customerAddress,
    notes,
    activeSignature,
  };
}

function SignatureBlock({ activeSignature, showSignature, bizName, align = 'flex-end', labelColor = '#64748B' }) {
  if (!showSignature) return null;
  return (
    <View style={[styles.signatoryBox, { alignItems: align }]}>
      {activeSignature ? (
        <Image source={{ uri: activeSignature }} style={styles.sheetSignatureImg} resizeMode="contain" />
      ) : (
        <View style={styles.signLine} />
      )}
      <Text style={[styles.signLabel, { color: labelColor }]}>
        {bizName ? `For ${bizName}` : 'Authorized Signatory'}
      </Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 1: MODERN SLATE (Banner + Tinted Cards + Total Pill)
// ══════════════════════════════════════════════════════════════
function ModernSlateTemplate({ ctx }) {
  const {
    prefs, primaryColor, accentColor, isCompact,
    bizName, bizAddress, bizPhone, bizGstin,
    items, subtotal, discountAmount, grandTotal,
    invoiceNo, saleDate, paymentMode, paymentStatus,
    customerName, customerPhone, customerAddress, notes, activeSignature,
  } = ctx;

  const rowPadV = isCompact ? 6 : 9;
  const primarySoft = hexToRgba(primaryColor, 0.06);
  const accentSoft = hexToRgba(accentColor, 0.14);

  return (
    <View style={[styles.sheetBase, { borderColor: hexToRgba(primaryColor, 0.25) }]}>
      {/* Top Banner */}
      <View style={[styles.modernBanner, { backgroundColor: primaryColor }]}>
        <View style={styles.rowFlex1}>
          {prefs.showLogo ? (
            <View style={[styles.modernLogoBox, { borderColor: hexToRgba(accentColor, 0.7) }]}>
              <Text style={styles.modernLogoText}>{bizName.slice(0, 2).toUpperCase()}</Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.modernBizName}>{bizName}</Text>
            {bizAddress ? <Text style={styles.modernBizSub}>{bizAddress}</Text> : null}
            {bizPhone || bizGstin ? (
              <Text style={styles.modernBizSub}>
                {[bizPhone ? `Ph: ${bizPhone}` : '', bizGstin ? `GSTIN: ${bizGstin}` : ''].filter(Boolean).join(' • ')}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[styles.modernTitleBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.modernTitleBadgeText}>{prefs.invoiceTitle}</Text>
          </View>
          <Text style={styles.modernInvNo}>#{invoiceNo}</Text>
        </View>
      </View>

      {/* Meta Cards */}
      <View style={[styles.modernMetaGrid, { backgroundColor: primarySoft }]}>
        {prefs.showCustomerDetails ? (
          <View style={[styles.modernMetaCard, { borderColor: hexToRgba(primaryColor, 0.12) }]}>
            <Text style={[styles.metaEyebrow, { color: accentColor }]}>BILL TO</Text>
            <Text style={styles.customerName}>{customerName}</Text>
            {customerPhone ? <Text style={styles.metaSub}>+91 {customerPhone}</Text> : null}
            {customerAddress ? <Text style={styles.metaSub}>{customerAddress}</Text> : null}
          </View>
        ) : null}
        <View style={[styles.modernMetaCard, { borderColor: hexToRgba(primaryColor, 0.12) }]}>
          <Text style={[styles.metaEyebrow, { color: accentColor }]}>INVOICE INFO</Text>
          <Text style={styles.metaSub}>Date: {saleDate}</Text>
          <Text style={styles.metaSub}>Mode: {paymentMode}</Text>
          <View style={[styles.statusBadge, { backgroundColor: accentSoft }]}>
            <Text style={[styles.statusBadgeText, { color: accentColor }]}>{paymentStatus}</Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <View style={[styles.modernTableWrap, { borderColor: hexToRgba(primaryColor, 0.16) }]}>
        <View style={[styles.tableHeader, { backgroundColor: primaryColor }]}>
          <Text style={[styles.tableCol, styles.colIndex]}>#</Text>
          <Text style={[styles.tableCol, styles.colName]}>Item</Text>
          <Text style={[styles.tableCol, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableCol, styles.colPrice]}>Rate</Text>
          <Text style={[styles.tableCol, styles.colTotal]}>Amount</Text>
        </View>
        {items.map((it, idx) => {
          const lineDisc = parseFloat(it.discount || 0);
          return (
            <View
              key={idx}
              style={[
                styles.tableRow,
                { paddingVertical: rowPadV },
                idx % 2 === 1 && { backgroundColor: primarySoft },
              ]}
            >
              <Text style={[styles.tableRowCol, styles.colIndex]}>{idx + 1}</Text>
              <View style={styles.colName}>
                <Text style={[styles.tableRowCol, styles.boldDark]}>
                  {it.product_name || `Product #${it.product_id}`}
                </Text>
                {prefs.showDiscount && lineDisc > 0 ? (
                  <Text style={[styles.discNote, { color: accentColor }]}>
                    Disc: -{formatInvoiceCurrency(lineDisc)}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.tableRowCol, styles.colQty, styles.boldDark]}>{it.quantity}</Text>
              <Text style={[styles.tableRowCol, styles.colPrice]}>
                {formatInvoiceCurrency(it.unit_price || it.price)}
              </Text>
              <Text style={[styles.tableRowCol, styles.colTotal, styles.boldDark]}>
                {formatInvoiceCurrency(it.line_total || (it.unit_price || it.price) * it.quantity)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sub Total</Text>
          <Text style={styles.summaryVal}>{formatInvoiceCurrency(subtotal)}</Text>
        </View>
        {prefs.showDiscount && discountAmount > 0 ? (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>Discount</Text>
            <Text style={[styles.summaryVal, { color: '#DC2626' }]}>
              - {formatInvoiceCurrency(discountAmount)}
            </Text>
          </View>
        ) : null}
        <View style={[styles.grandTotalPill, { backgroundColor: accentColor }]}>
          <Text style={styles.grandTotalLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.grandTotalVal}>{formatInvoiceCurrency(grandTotal)}</Text>
        </View>
      </View>

      {/* Words */}
      {prefs.showAmountInWords ? (
        <View style={[styles.wordsCallout, { backgroundColor: primarySoft, borderLeftColor: primaryColor }]}>
          <Text style={[styles.metaEyebrow, { color: primaryColor }]}>AMOUNT IN WORDS</Text>
          <Text style={styles.wordsText}>{numberToWordsIndian(grandTotal)}</Text>
        </View>
      ) : null}

      {/* Footer */}
      {(prefs.showTerms || prefs.showSignature) ? (
        <View style={styles.footerNoteRow}>
          {prefs.showTerms ? (
            <View style={{ flex: 1 }}>
              <Text style={[styles.metaEyebrow, { color: primaryColor }]}>TERMS & CONDITIONS</Text>
              <Text style={styles.termsText}>{notes}</Text>
            </View>
          ) : <View style={{ flex: 1 }} />}
          <SignatureBlock activeSignature={activeSignature} showSignature={prefs.showSignature} bizName={bizName} />
        </View>
      ) : null}

      {prefs.showThankYou ? (
        <View style={[styles.thankYouStrip, { backgroundColor: primarySoft }]}>
          <Text style={[styles.thankYouText, { color: primaryColor }]}>{prefs.footerMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 2: CLASSIC CORPORATE (White Letterhead + Full Grid)
// ══════════════════════════════════════════════════════════════
function ClassicCorporateTemplate({ ctx }) {
  const {
    prefs, primaryColor, accentColor, isCompact,
    bizName, bizAddress, bizPhone, bizGstin,
    items, subtotal, discountAmount, grandTotal,
    invoiceNo, saleDate, paymentMode, paymentStatus,
    customerName, customerPhone, customerAddress, notes, activeSignature,
  } = ctx;

  const gridBorder = hexToRgba(primaryColor, 0.28);
  const headTint = hexToRgba(primaryColor, 0.1);
  const cellPad = isCompact ? 5 : 8;

  return (
    <View style={[styles.sheetBase, { borderColor: primaryColor, borderWidth: 1.5, borderRadius: 6 }]}>
      {/* Thick Top Corporate Rule */}
      <View style={{ height: 6, backgroundColor: primaryColor }} />

      {/* White Formal Letterhead */}
      <View style={[styles.classicHeader, { borderBottomColor: primaryColor }]}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {prefs.showLogo ? (
              <View style={[styles.classicLogoMark, { borderColor: primaryColor, backgroundColor: headTint }]}>
                <Text style={[styles.classicLogoText, { color: primaryColor }]}>
                  {bizName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            ) : null}
            <Text style={[styles.classicBizTitle, { color: primaryColor }]}>{bizName}</Text>
          </View>
          {bizAddress ? <Text style={styles.classicBizSub}>{bizAddress}</Text> : null}
          {bizPhone || bizGstin ? (
            <Text style={styles.classicBizSub}>
              {[bizPhone ? `Tel: ${bizPhone}` : '', bizGstin ? `GSTIN: ${bizGstin}` : ''].filter(Boolean).join('  |  ')}
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <View style={[styles.classicStampBox, { borderColor: accentColor }]}>
            <Text style={[styles.classicStampText, { color: accentColor }]}>{prefs.invoiceTitle}</Text>
          </View>
          <Text style={[styles.classicInvMeta, { color: primaryColor }]}>No: #{invoiceNo}</Text>
          <Text style={styles.classicBizSub}>Date: {saleDate}</Text>
        </View>
      </View>

      {/* Structured 2-Cell Metadata Box */}
      <View style={[styles.classicMetaRow, { borderColor: gridBorder }]}>
        {prefs.showCustomerDetails ? (
          <View style={[styles.classicMetaCell, { borderRightWidth: 1, borderRightColor: gridBorder }]}>
            <Text style={[styles.metaEyebrow, { color: primaryColor }]}>BILLED TO</Text>
            <Text style={styles.customerName}>{customerName}</Text>
            {customerPhone ? <Text style={styles.metaSub}>Phone: +91 {customerPhone}</Text> : null}
            {customerAddress ? <Text style={styles.metaSub}>{customerAddress}</Text> : null}
          </View>
        ) : null}
        <View style={styles.classicMetaCell}>
          <Text style={[styles.metaEyebrow, { color: primaryColor }]}>PAYMENT DETAILS</Text>
          <Text style={styles.metaSub}>Mode: {paymentMode}</Text>
          <Text style={[styles.metaSub, { fontWeight: '700', color: accentColor }]}>Status: {paymentStatus}</Text>
        </View>
      </View>

      {/* Full Grid Bordered Table */}
      <View style={[styles.classicGridWrap, { borderColor: gridBorder }]}>
        <View style={[styles.classicGridRow, { backgroundColor: headTint, borderBottomColor: primaryColor, borderBottomWidth: 1.5 }]}>
          <Text style={[styles.classicGridHead, styles.colIndex, { color: primaryColor, borderRightColor: gridBorder, paddingVertical: cellPad }]}>#</Text>
          <Text style={[styles.classicGridHead, styles.colName, { color: primaryColor, borderRightColor: gridBorder, paddingVertical: cellPad }]}>Description</Text>
          <Text style={[styles.classicGridHead, styles.colQty, { color: primaryColor, borderRightColor: gridBorder, paddingVertical: cellPad }]}>Qty</Text>
          <Text style={[styles.classicGridHead, styles.colPrice, { color: primaryColor, borderRightColor: gridBorder, paddingVertical: cellPad }]}>Rate</Text>
          <Text style={[styles.classicGridHead, styles.colTotal, { color: primaryColor, borderRightWidth: 0, paddingVertical: cellPad }]}>Amount</Text>
        </View>
        {items.map((it, idx) => (
          <View key={idx} style={[styles.classicGridRow, { borderBottomColor: gridBorder }]}>
            <Text style={[styles.classicGridCell, styles.colIndex, { borderRightColor: gridBorder, paddingVertical: cellPad }]}>{idx + 1}</Text>
            <Text style={[styles.classicGridCell, styles.colName, styles.boldDark, { borderRightColor: gridBorder, paddingVertical: cellPad }]}>
              {it.product_name || `Product #${it.product_id}`}
            </Text>
            <Text style={[styles.classicGridCell, styles.colQty, { borderRightColor: gridBorder, paddingVertical: cellPad }]}>{it.quantity}</Text>
            <Text style={[styles.classicGridCell, styles.colPrice, { borderRightColor: gridBorder, paddingVertical: cellPad }]}>
              {formatInvoiceCurrency(it.unit_price || it.price)}
            </Text>
            <Text style={[styles.classicGridCell, styles.colTotal, styles.boldDark, { borderRightWidth: 0, paddingVertical: cellPad }]}>
              {formatInvoiceCurrency(it.line_total || (it.unit_price || it.price) * it.quantity)}
            </Text>
          </View>
        ))}
      </View>

      {/* Split Ledger Summary */}
      <View style={[styles.classicLedgerSplit, { borderColor: gridBorder }]}>
        <View style={[styles.classicLedgerLeft, { borderRightColor: gridBorder }]}>
          {prefs.showAmountInWords ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.metaEyebrow, { color: primaryColor }]}>AMOUNT IN WORDS</Text>
              <Text style={[styles.wordsText, { color: '#334155' }]}>{numberToWordsIndian(grandTotal)}</Text>
            </View>
          ) : null}
          {prefs.showTerms ? (
            <View>
              <Text style={[styles.metaEyebrow, { color: primaryColor }]}>DECLARATION / TERMS</Text>
              <Text style={styles.termsText}>{notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.classicLedgerRight}>
          <View style={styles.classicLedgerLine}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>{formatInvoiceCurrency(subtotal)}</Text>
          </View>
          {prefs.showDiscount && discountAmount > 0 ? (
            <View style={styles.classicLedgerLine}>
              <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>Discount</Text>
              <Text style={[styles.summaryVal, { color: '#DC2626' }]}>-{formatInvoiceCurrency(discountAmount)}</Text>
            </View>
          ) : null}
          <View style={[styles.classicNetBox, { backgroundColor: primaryColor }]}>
            <Text style={styles.classicNetLabel}>NET PAYABLE</Text>
            <Text style={styles.classicNetVal}>{formatInvoiceCurrency(grandTotal)}</Text>
          </View>
        </View>
      </View>

      {/* Signatory Footer */}
      <View style={styles.classicFooter}>
        <Text style={styles.termsText}>{prefs.showThankYou ? prefs.footerMessage : ''}</Text>
        <SignatureBlock activeSignature={activeSignature} showSignature={prefs.showSignature} bizName={bizName} labelColor={primaryColor} />
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 3: CREATIVE ACCENT (Left Color Stripe + Floating Pills)
// ══════════════════════════════════════════════════════════════
function CreativeAccentTemplate({ ctx }) {
  const {
    prefs, primaryColor, accentColor, isCompact,
    bizName, bizAddress, bizPhone, bizGstin,
    items, subtotal, discountAmount, grandTotal,
    invoiceNo, saleDate, paymentMode, paymentStatus,
    customerName, customerPhone, customerAddress, notes, activeSignature,
  } = ctx;

  const accentTint = hexToRgba(accentColor, 0.12);
  const primaryTint = hexToRgba(primaryColor, 0.06);
  const rowPad = isCompact ? 7 : 11;

  return (
    <View style={[styles.sheetBase, { borderColor: hexToRgba(accentColor, 0.35), flexDirection: 'row' }]}>
      {/* Left Vertical Accent Stripe */}
      <View style={[styles.creativeStripe, { backgroundColor: accentColor }]}>
        <View style={[styles.creativeStripeDot, { backgroundColor: primaryColor }]} />
      </View>

      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.creativeHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {prefs.showLogo ? (
                <View style={[styles.creativeCircleLogo, { backgroundColor: accentColor }]}>
                  <Text style={styles.creativeCircleLogoText}>{bizName.slice(0, 2).toUpperCase()}</Text>
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={[styles.creativeBizName, { color: primaryColor }]}>{bizName}</Text>
                {bizAddress ? <Text style={styles.metaSub}>{bizAddress}</Text> : null}
                {bizPhone || bizGstin ? (
                  <Text style={styles.metaSub}>
                    {[bizPhone, bizGstin].filter(Boolean).join(' • ')}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={[styles.creativeInvoicePill, { backgroundColor: accentTint, borderColor: accentColor }]}>
            <Text style={[styles.creativePillType, { color: accentColor }]}>{prefs.invoiceTitle}</Text>
            <Text style={[styles.creativePillNo, { color: primaryColor }]}>#{invoiceNo}</Text>
          </View>
        </View>

        {/* Floating Info Pills */}
        <View style={styles.creativeChipsRow}>
          {prefs.showCustomerDetails ? (
            <View style={[styles.creativeInfoPill, { backgroundColor: primaryTint }]}>
              <Text style={[styles.metaEyebrow, { color: primaryColor }]}>BILLED TO</Text>
              <Text style={styles.customerName}>{customerName}</Text>
              {customerPhone ? <Text style={styles.metaSub}>+91 {customerPhone}</Text> : null}
              {customerAddress ? <Text style={styles.metaSub}>{customerAddress}</Text> : null}
            </View>
          ) : null}

          <View style={[styles.creativeInfoPill, { backgroundColor: accentTint }]}>
            <Text style={[styles.metaEyebrow, { color: accentColor }]}>DATE & STATUS</Text>
            <Text style={[styles.customerName, { color: primaryColor }]}>{saleDate}</Text>
            <Text style={styles.metaSub}>{paymentMode} • {paymentStatus}</Text>
          </View>
        </View>

        {/* Floating Item List with Numbered Accent Badges */}
        <View style={{ paddingHorizontal: 14, paddingTop: 6 }}>
          <View style={[styles.creativeListHead, { borderBottomColor: hexToRgba(primaryColor, 0.2) }]}>
            <Text style={[styles.metaEyebrow, { flex: 1, color: primaryColor }]}>ITEMIZED BILLING</Text>
            <Text style={[styles.metaEyebrow, { width: 40, textAlign: 'center', color: primaryColor }]}>QTY</Text>
            <Text style={[styles.metaEyebrow, { width: 74, textAlign: 'right', color: primaryColor }]}>TOTAL</Text>
          </View>

          {items.map((it, idx) => (
            <View
              key={idx}
              style={[
                styles.creativeItemRow,
                { paddingVertical: rowPad, borderBottomColor: hexToRgba(primaryColor, 0.08) },
              ]}
            >
              <View style={[styles.creativeIndexDot, { backgroundColor: accentColor }]}>
                <Text style={styles.creativeIndexDotText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1, paddingHorizontal: 8 }}>
                <Text style={styles.customerName}>{it.product_name || `Product #${it.product_id}`}</Text>
                <Text style={styles.metaSub}>
                  Rate: {formatInvoiceCurrency(it.unit_price || it.price)}
                  {prefs.showDiscount && parseFloat(it.discount || 0) > 0
                    ? `  •  Disc -${formatInvoiceCurrency(it.discount)}`
                    : ''}
                </Text>
              </View>
              <Text style={[styles.tableRowCol, { width: 40, textAlign: 'center', fontWeight: '700', color: primaryColor }]}>
                ×{it.quantity}
              </Text>
              <Text style={[styles.tableRowCol, { width: 74, textAlign: 'right', fontWeight: '800', color: primaryColor }]}>
                {formatInvoiceCurrency(it.line_total || (it.unit_price || it.price) * it.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Bold Highlight Total Banner */}
        <View style={[styles.creativeTotalCard, { backgroundColor: primaryColor }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.creativeTotalMeta}>
              Subtotal {formatInvoiceCurrency(subtotal)}
              {prefs.showDiscount && discountAmount > 0 ? `  •  Saved ${formatInvoiceCurrency(discountAmount)}` : ''}
            </Text>
            {prefs.showAmountInWords ? (
              <Text style={styles.creativeTotalWords}>{numberToWordsIndian(grandTotal)}</Text>
            ) : null}
          </View>
          <View style={[styles.creativeGrandPill, { backgroundColor: accentColor }]}>
            <Text style={styles.creativeGrandLabel}>GRAND TOTAL</Text>
            <Text style={styles.creativeGrandVal}>{formatInvoiceCurrency(grandTotal)}</Text>
          </View>
        </View>

        {/* Footer */}
        {(prefs.showTerms || prefs.showSignature || prefs.showThankYou) ? (
          <View style={styles.footerNoteRow}>
            <View style={{ flex: 1 }}>
              {prefs.showTerms ? (
                <>
                  <Text style={[styles.metaEyebrow, { color: accentColor }]}>NOTES & TERMS</Text>
                  <Text style={styles.termsText}>{notes}</Text>
                </>
              ) : null}
              {prefs.showThankYou ? (
                <Text style={[styles.thankYouInline, { color: primaryColor }]}>{prefs.footerMessage}</Text>
              ) : null}
            </View>
            <SignatureBlock activeSignature={activeSignature} showSignature={prefs.showSignature} bizName={bizName} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 4: THERMAL POS RECEIPT (80mm Narrow Dashed + Barcode)
// ══════════════════════════════════════════════════════════════
function ThermalPosTemplate({ ctx }) {
  const {
    prefs, primaryColor, accentColor,
    bizName, bizAddress, bizPhone, bizGstin,
    items, subtotal, discountAmount, grandTotal,
    invoiceNo, saleDate, paymentMode, paymentStatus,
    customerName, customerPhone, notes, activeSignature,
  } = ctx;

  const primaryTint = hexToRgba(primaryColor, 0.09);

  return (
    <View style={[styles.thermalWrap, { borderColor: hexToRgba(primaryColor, 0.3) }]}>
      {/* Top Color Strip */}
      <View style={{ flexDirection: 'row', height: 5 }}>
        <View style={{ flex: 2, backgroundColor: primaryColor }} />
        <View style={{ flex: 1, backgroundColor: accentColor }} />
      </View>

      <View style={styles.thermalInner}>
        {/* Store Header */}
        <View style={styles.thermalCenter}>
          {prefs.showLogo ? (
            <View style={[styles.thermalBadge, { backgroundColor: primaryColor }]}>
              <Text style={styles.thermalBadgeText}>{bizName.slice(0, 2).toUpperCase()}</Text>
            </View>
          ) : null}
          <Text style={[styles.thermalStore, { color: primaryColor }]}>{bizName.toUpperCase()}</Text>
          {bizAddress ? <Text style={styles.thermalSub}>{bizAddress}</Text> : null}
          {bizPhone ? <Text style={styles.thermalSub}>Tel: {bizPhone}</Text> : null}
          {bizGstin ? <Text style={styles.thermalSub}>GSTIN: {bizGstin}</Text> : null}

          <View style={[styles.thermalTitlePill, { backgroundColor: primaryTint, borderColor: accentColor }]}>
            <Text style={[styles.thermalTitleText, { color: primaryColor }]}>{prefs.invoiceTitle}</Text>
          </View>
        </View>

        <View style={styles.dashedRule} />

        {/* Key-Value Receipt Meta */}
        <View style={styles.thermalKvRow}>
          <Text style={styles.thermalKvKey}>BILL NO:</Text>
          <Text style={[styles.thermalKvVal, { color: primaryColor }]}>#{invoiceNo}</Text>
        </View>
        <View style={styles.thermalKvRow}>
          <Text style={styles.thermalKvKey}>DATE:</Text>
          <Text style={styles.thermalKvVal}>{saleDate}</Text>
        </View>
        {prefs.showCustomerDetails ? (
          <View style={styles.thermalKvRow}>
            <Text style={styles.thermalKvKey}>CUSTOMER:</Text>
            <Text style={styles.thermalKvVal}>
              {customerName}{customerPhone ? ` (${customerPhone})` : ''}
            </Text>
          </View>
        ) : null}
        <View style={styles.thermalKvRow}>
          <Text style={styles.thermalKvKey}>PAYMENT:</Text>
          <Text style={[styles.thermalKvVal, { color: accentColor }]}>{paymentMode} • {paymentStatus}</Text>
        </View>

        <View style={styles.dashedRule} />

        {/* Items Table */}
        <View style={styles.thermalTableHead}>
          <Text style={[styles.thermalHeadText, { flex: 1, color: primaryColor }]}>ITEM</Text>
          <Text style={[styles.thermalHeadText, { width: 32, textAlign: 'center', color: primaryColor }]}>QTY</Text>
          <Text style={[styles.thermalHeadText, { width: 64, textAlign: 'right', color: primaryColor }]}>AMT</Text>
        </View>

        {items.map((it, idx) => (
          <View key={idx} style={styles.thermalItemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.thermalItemName}>{it.product_name || `Product #${it.product_id}`}</Text>
              <Text style={styles.thermalItemSub}>
                @ {formatInvoiceCurrency(it.unit_price || it.price)}
              </Text>
            </View>
            <Text style={[styles.thermalItemQty, { color: primaryColor }]}>{it.quantity}</Text>
            <Text style={styles.thermalItemAmt}>
              {formatInvoiceCurrency(it.line_total || (it.unit_price || it.price) * it.quantity)}
            </Text>
          </View>
        ))}

        <View style={styles.dashedRule} />

        {/* Totals */}
        <View style={styles.thermalKvRow}>
          <Text style={styles.thermalKvKey}>SUBTOTAL</Text>
          <Text style={styles.thermalKvVal}>{formatInvoiceCurrency(subtotal)}</Text>
        </View>
        {prefs.showDiscount && discountAmount > 0 ? (
          <View style={styles.thermalKvRow}>
            <Text style={[styles.thermalKvKey, { color: '#DC2626' }]}>DISCOUNT</Text>
            <Text style={[styles.thermalKvVal, { color: '#DC2626' }]}>-{formatInvoiceCurrency(discountAmount)}</Text>
          </View>
        ) : null}

        <View style={[styles.thermalTotalBanner, { backgroundColor: primaryColor }]}>
          <Text style={styles.thermalTotalLabel}>TOTAL PAID</Text>
          <Text style={[styles.thermalTotalVal, { color: accentColor === primaryColor ? '#FFFFFF' : '#FFFFFF' }]}>
            {formatInvoiceCurrency(grandTotal)}
          </Text>
        </View>

        {/* Barcode Footer */}
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <BarcodeView
            value={`INV-${invoiceNo}`}
            height={32}
            barWidth={1.25}
            fontSize={9.5}
            barColor={primaryColor}
            backgroundColor="#FFFFFF"
            style={{ paddingVertical: 2 }}
          />
        </View>

        {prefs.showSignature && activeSignature ? (
          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <Image source={{ uri: activeSignature }} style={{ width: 84, height: 30 }} resizeMode="contain" />
          </View>
        ) : null}

        {prefs.showTerms ? (
          <Text style={[styles.thermalFooterNote, { marginTop: 6 }]}>{notes}</Text>
        ) : null}
        {prefs.showThankYou ? (
          <Text style={[styles.thermalThankYou, { color: accentColor }]}>★ {prefs.footerMessage} ★</Text>
        ) : null}
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 5: MINIMALIST CLEAN (Editorial Whitespace + Rules)
// ══════════════════════════════════════════════════════════════
function MinimalistCleanTemplate({ ctx }) {
  const {
    prefs, primaryColor, accentColor, isCompact,
    bizName, bizAddress, bizPhone, bizGstin,
    items, subtotal, discountAmount, grandTotal,
    invoiceNo, saleDate, paymentMode, paymentStatus,
    customerName, customerPhone, customerAddress, notes, activeSignature,
  } = ctx;

  const rowPad = isCompact ? 8 : 12;

  return (
    <View style={[styles.sheetBase, { borderColor: '#E2E8F0', padding: 20 }]}>
      {/* Editorial Header */}
      <View style={styles.minimalTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.minimalDisplayTitle, { color: primaryColor }]}>{prefs.invoiceTitle}</Text>
          <View style={[styles.minimalUnderline, { backgroundColor: accentColor }]} />
          <Text style={styles.minimalInvId}>NO. {invoiceNo}  •  {saleDate}</Text>
        </View>

        <View style={{ alignItems: 'flex-end', maxWidth: '48%' }}>
          {prefs.showLogo ? (
            <View style={[styles.minimalMonoBadge, { borderColor: accentColor }]}>
              <Text style={[styles.minimalMonoText, { color: primaryColor }]}>
                {bizName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.minimalBizName, { color: primaryColor }]}>{bizName}</Text>
          {bizAddress ? <Text style={[styles.metaSub, { textAlign: 'right' }]}>{bizAddress}</Text> : null}
          {bizGstin ? <Text style={[styles.metaSub, { textAlign: 'right' }]}>GSTIN {bizGstin}</Text> : null}
        </View>
      </View>

      <View style={[styles.hairlineDivider, { marginVertical: 14 }]} />

      {/* Clean Meta Block */}
      <View style={styles.minimalMetaRow}>
        {prefs.showCustomerDetails ? (
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.metaEyebrow, { color: accentColor }]}>BILLED TO</Text>
            <Text style={[styles.customerName, { fontSize: 14 }]}>{customerName}</Text>
            {customerPhone ? <Text style={styles.metaSub}>+91 {customerPhone}</Text> : null}
            {customerAddress ? <Text style={styles.metaSub}>{customerAddress}</Text> : null}
          </View>
        ) : null}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.metaEyebrow, { color: accentColor }]}>PAYMENT</Text>
          <Text style={styles.metaSub}>{paymentMode}</Text>
          <View style={styles.minimalStatusRow}>
            <View style={[styles.minimalDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.minimalStatusText, { color: primaryColor }]}>{paymentStatus}</Text>
          </View>
        </View>
      </View>

      {/* Borderless Editorial Table */}
      <View style={{ marginTop: 14 }}>
        <View style={[styles.minimalTableHead, { borderBottomColor: primaryColor }]}>
          <Text style={[styles.minimalHeadLabel, { flex: 1, color: primaryColor }]}>ITEM</Text>
          <Text style={[styles.minimalHeadLabel, { width: 38, textAlign: 'center', color: primaryColor }]}>QTY</Text>
          <Text style={[styles.minimalHeadLabel, { width: 65, textAlign: 'right', color: primaryColor }]}>RATE</Text>
          <Text style={[styles.minimalHeadLabel, { width: 76, textAlign: 'right', color: primaryColor }]}>AMOUNT</Text>
        </View>

        {items.map((it, idx) => (
          <View key={idx} style={[styles.minimalRow, { paddingVertical: rowPad }]}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={[styles.customerName, { fontSize: 12.5 }]}>
                {it.product_name || `Product #${it.product_id}`}
              </Text>
              {prefs.showDiscount && parseFloat(it.discount || 0) > 0 ? (
                <Text style={[styles.discNote, { color: accentColor }]}>
                  Discount -{formatInvoiceCurrency(it.discount)}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.tableRowCol, { width: 38, textAlign: 'center' }]}>{it.quantity}</Text>
            <Text style={[styles.tableRowCol, { width: 65, textAlign: 'right' }]}>
              {formatInvoiceCurrency(it.unit_price || it.price)}
            </Text>
            <Text style={[styles.tableRowCol, { width: 76, textAlign: 'right', fontWeight: '700', color: primaryColor }]}>
              {formatInvoiceCurrency(it.line_total || (it.unit_price || it.price) * it.quantity)}
            </Text>
          </View>
        ))}
      </View>

      {/* Understated Right-Aligned Totals */}
      <View style={styles.minimalTotalsWrap}>
        <View style={styles.minimalTotalsBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>{formatInvoiceCurrency(subtotal)}</Text>
          </View>
          {prefs.showDiscount && discountAmount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#DC2626' }]}>Discount</Text>
              <Text style={[styles.summaryVal, { color: '#DC2626' }]}>-{formatInvoiceCurrency(discountAmount)}</Text>
            </View>
          ) : null}
          <View style={[styles.minimalTotalDivider, { backgroundColor: primaryColor }]} />
          <View style={styles.minimalFinalRow}>
            <Text style={[styles.minimalFinalLabel, { color: accentColor }]}>TOTAL</Text>
            <Text style={[styles.minimalFinalVal, { color: primaryColor }]}>
              {formatInvoiceCurrency(grandTotal)}
            </Text>
          </View>
        </View>
      </View>

      {prefs.showAmountInWords ? (
        <Text style={[styles.minimalWords, { color: '#64748B' }]}>
          In words: {numberToWordsIndian(grandTotal)}
        </Text>
      ) : null}

      {(prefs.showTerms || prefs.showSignature) ? (
        <View style={[styles.footerNoteRow, { paddingHorizontal: 0, paddingBottom: 0, marginTop: 14 }]}>
          {prefs.showTerms ? (
            <View style={{ flex: 1 }}>
              <Text style={[styles.metaEyebrow, { color: primaryColor }]}>TERMS</Text>
              <Text style={styles.termsText}>{notes}</Text>
            </View>
          ) : <View style={{ flex: 1 }} />}
          <SignatureBlock activeSignature={activeSignature} showSignature={prefs.showSignature} bizName={bizName} />
        </View>
      ) : null}

      {prefs.showThankYou ? (
        <Text style={[styles.minimalThanks, { color: accentColor }]}>{prefs.footerMessage}</Text>
      ) : null}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE 6: EXECUTIVE DETAILED (Double-Framed + 3-Col Meta)
// ══════════════════════════════════════════════════════════════
function ExecutiveDetailedTemplate({ ctx }) {
  const {
    prefs, primaryColor, accentColor, isCompact,
    bizName, bizAddress, bizPhone, bizGstin,
    items, subtotal, discountAmount, grandTotal,
    invoiceNo, saleDate, paymentMode, paymentStatus,
    customerName, customerPhone, customerAddress, notes, activeSignature,
  } = ctx;

  const primarySoft = hexToRgba(primaryColor, 0.07);
  const accentSoft = hexToRgba(accentColor, 0.14);
  const borderCol = hexToRgba(primaryColor, 0.3);
  const cellPad = isCompact ? 5 : 7;

  return (
    <View style={[styles.sheetBase, { borderColor: primaryColor, borderWidth: 2, borderRadius: 10, padding: 4 }]}>
      <View style={[styles.execInnerFrame, { borderColor: accentColor }]}>
        {/* Top Status Ribbon */}
        <View style={[styles.execRibbon, { backgroundColor: accentColor }]}>
          <Text style={styles.execRibbonText}>{prefs.invoiceTitle}  •  ORIGINAL FOR RECIPIENT</Text>
          <Text style={styles.execRibbonText}>{paymentStatus}</Text>
        </View>

        {/* Executive Dark Header */}
        <View style={[styles.execHeader, { backgroundColor: primaryColor }]}>
          <View style={styles.rowFlex1}>
            {prefs.showLogo ? (
              <View style={[styles.execLogoBox, { backgroundColor: accentColor }]}>
                <Text style={styles.execLogoText}>{bizName.slice(0, 2).toUpperCase()}</Text>
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.modernBizName}>{bizName}</Text>
              {bizAddress ? <Text style={styles.modernBizSub}>{bizAddress}</Text> : null}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.execInvLabel}>INVOICE NO.</Text>
            <Text style={styles.execInvVal}>#{invoiceNo}</Text>
          </View>
        </View>

        {/* 3-Panel Bordered Metadata Strip */}
        <View style={[styles.execTriGrid, { borderBottomColor: borderCol }]}>
          <View style={[styles.execTriCell, { borderRightColor: borderCol }]}>
            <Text style={[styles.metaEyebrow, { color: primaryColor }]}>SELLER</Text>
            <Text style={styles.execMetaBold}>{bizName}</Text>
            {bizPhone ? <Text style={styles.execMetaSmall}>Ph: {bizPhone}</Text> : null}
            {bizGstin ? <Text style={styles.execMetaSmall}>GST: {bizGstin}</Text> : null}
          </View>

          {prefs.showCustomerDetails ? (
            <View style={[styles.execTriCell, { borderRightColor: borderCol }]}>
              <Text style={[styles.metaEyebrow, { color: accentColor }]}>BUYER</Text>
              <Text style={styles.execMetaBold}>{customerName}</Text>
              {customerPhone ? <Text style={styles.execMetaSmall}>+91 {customerPhone}</Text> : null}
              {customerAddress ? <Text style={styles.execMetaSmall} numberOfLines={2}>{customerAddress}</Text> : null}
            </View>
          ) : null}

          <View style={styles.execTriCell}>
            <Text style={[styles.metaEyebrow, { color: primaryColor }]}>METADATA</Text>
            <Text style={styles.execMetaSmall}>Date: {saleDate}</Text>
            <Text style={styles.execMetaSmall}>Mode: {paymentMode}</Text>
            <Text style={[styles.execMetaSmall, { color: accentColor, fontWeight: '700' }]}>Items: {items.length}</Text>
          </View>
        </View>

        {/* Detailed Tax Table */}
        <View style={[styles.execTableWrap, { borderColor: borderCol }]}>
          <View style={[styles.classicGridRow, { backgroundColor: primarySoft, borderBottomColor: primaryColor, borderBottomWidth: 1 }]}>
            <Text style={[styles.classicGridHead, { width: 22, textAlign: 'center', color: primaryColor, borderRightColor: borderCol, paddingVertical: cellPad }]}>#</Text>
            <Text style={[styles.classicGridHead, { flex: 1, paddingHorizontal: 5, color: primaryColor, borderRightColor: borderCol, paddingVertical: cellPad }]}>Item</Text>
            <Text style={[styles.classicGridHead, { width: 28, textAlign: 'center', color: primaryColor, borderRightColor: borderCol, paddingVertical: cellPad }]}>Qty</Text>
            <Text style={[styles.classicGridHead, { width: 56, textAlign: 'right', paddingHorizontal: 4, color: primaryColor, borderRightColor: borderCol, paddingVertical: cellPad }]}>Rate</Text>
            {prefs.showDiscount ? (
              <Text style={[styles.classicGridHead, { width: 46, textAlign: 'right', paddingHorizontal: 4, color: primaryColor, borderRightColor: borderCol, paddingVertical: cellPad }]}>Disc</Text>
            ) : null}
            <Text style={[styles.classicGridHead, { width: 64, textAlign: 'right', paddingHorizontal: 4, color: primaryColor, borderRightWidth: 0, paddingVertical: cellPad }]}>Total</Text>
          </View>

          {items.map((it, idx) => (
            <View key={idx} style={[styles.classicGridRow, { borderBottomColor: borderCol }]}>
              <Text style={[styles.classicGridCell, { width: 22, textAlign: 'center', borderRightColor: borderCol, paddingVertical: cellPad }]}>{idx + 1}</Text>
              <Text style={[styles.classicGridCell, styles.boldDark, { flex: 1, paddingHorizontal: 5, borderRightColor: borderCol, paddingVertical: cellPad }]}>
                {it.product_name || `Product #${it.product_id}`}
              </Text>
              <Text style={[styles.classicGridCell, { width: 28, textAlign: 'center', borderRightColor: borderCol, paddingVertical: cellPad }]}>{it.quantity}</Text>
              <Text style={[styles.classicGridCell, { width: 56, textAlign: 'right', paddingHorizontal: 4, borderRightColor: borderCol, paddingVertical: cellPad }]}>
                {formatInvoiceCurrency(it.unit_price || it.price)}
              </Text>
              {prefs.showDiscount ? (
                <Text style={[styles.classicGridCell, { width: 46, textAlign: 'right', paddingHorizontal: 4, borderRightColor: borderCol, paddingVertical: cellPad }]}>
                  {parseFloat(it.discount || 0) > 0 ? formatInvoiceCurrency(it.discount) : '—'}
                </Text>
              ) : null}
              <Text style={[styles.classicGridCell, styles.boldDark, { width: 64, textAlign: 'right', paddingHorizontal: 4, borderRightWidth: 0, paddingVertical: cellPad }]}>
                {formatInvoiceCurrency(it.line_total || (it.unit_price || it.price) * it.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Financial Breakdown & Words */}
        <View style={styles.execBottomGrid}>
          <View style={{ flex: 1.15, paddingRight: 10 }}>
            {prefs.showAmountInWords ? (
              <View style={[styles.execWordsBox, { backgroundColor: accentSoft, borderColor: hexToRgba(accentColor, 0.35) }]}>
                <Text style={[styles.metaEyebrow, { color: primaryColor }]}>TOTAL IN WORDS</Text>
                <Text style={[styles.wordsText, { color: primaryColor }]}>{numberToWordsIndian(grandTotal)}</Text>
              </View>
            ) : null}
            {prefs.showTerms ? (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.metaEyebrow, { color: primaryColor }]}>TERMS & DECLARATION</Text>
                <Text style={styles.termsText}>{notes}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.execTotalsCard, { borderColor: borderCol }]}>
            <View style={styles.classicLedgerLine}>
              <Text style={styles.execMetaSmall}>Gross Amount</Text>
              <Text style={styles.execMetaBold}>{formatInvoiceCurrency(subtotal)}</Text>
            </View>
            {prefs.showDiscount && discountAmount > 0 ? (
              <View style={styles.classicLedgerLine}>
                <Text style={[styles.execMetaSmall, { color: '#DC2626' }]}>Total Discount</Text>
                <Text style={[styles.execMetaBold, { color: '#DC2626' }]}>-{formatInvoiceCurrency(discountAmount)}</Text>
              </View>
            ) : null}
            <View style={[styles.execNetStrip, { backgroundColor: primaryColor, borderLeftColor: accentColor }]}>
              <Text style={styles.execNetLabel}>NET TOTAL</Text>
              <Text style={styles.execNetVal}>{formatInvoiceCurrency(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Signature Stamp Footer */}
        <View style={[styles.classicFooter, { borderTopWidth: 1, borderTopColor: borderCol, paddingTop: 10 }]}>
          <Text style={[styles.thankYouInline, { color: primaryColor }]}>
            {prefs.showThankYou ? prefs.footerMessage : ''}
          </Text>
          <SignatureBlock activeSignature={activeSignature} showSignature={prefs.showSignature} bizName={bizName} labelColor={primaryColor} />
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// PUBLIC FULL SHEET RENDERER
// ══════════════════════════════════════════════════════════════
export function InvoiceTemplateRenderer({ sale, settings, businessInfo }) {
  const ctx = resolveInvoiceContext(sale, settings, businessInfo);

  switch (ctx.templateId) {
    case 2:
      return <ClassicCorporateTemplate ctx={ctx} />;
    case 3:
      return <CreativeAccentTemplate ctx={ctx} />;
    case 4:
      return <ThermalPosTemplate ctx={ctx} />;
    case 5:
      return <MinimalistCleanTemplate ctx={ctx} />;
    case 6:
      return <ExecutiveDetailedTemplate ctx={ctx} />;
    case 1:
    default:
      return <ModernSlateTemplate ctx={ctx} />;
  }
}

// ══════════════════════════════════════════════════════════════
// DISTINCT MINI THUMBNAIL PREVIEWS FOR TEMPLATE CHOOSER CARDS
// ══════════════════════════════════════════════════════════════
export function InvoiceTemplateThumbnail({ templateId, primaryColor = '#0A2540', accentColor = '#F58220' }) {
  const p = normalizeHex(primaryColor, '#0A2540');
  const a = normalizeHex(accentColor, '#F58220');
  const pSoft = hexToRgba(p, 0.08);
  const aSoft = hexToRgba(a, 0.16);

  if (templateId === 2) {
    // Classic Corporate: white letterhead + boxed stamp + grid lines
    return (
      <View style={[thumbStyles.box, { borderColor: p, borderWidth: 1.5, borderRadius: 6 }]}>
        <View style={{ height: 4, backgroundColor: p }} />
        <View style={thumbStyles.classicTop}>
          <View>
            <Text style={[thumbStyles.boldTitle, { color: p }]}>BILLBOOK CORP</Text>
            <Text style={thumbStyles.miniSub}>GSTIN: 24ABCDE1234F</Text>
          </View>
          <View style={[thumbStyles.classicStamp, { borderColor: a }]}>
            <Text style={[thumbStyles.classicStampText, { color: a }]}>TAX INVOICE</Text>
          </View>
        </View>
        <View style={[thumbStyles.gridTable, { borderColor: hexToRgba(p, 0.3) }]}>
          <View style={[thumbStyles.gridRow, { backgroundColor: pSoft, borderBottomColor: p }]}>
            <Text style={[thumbStyles.gridHead, { flex: 2, color: p }]}>ITEM</Text>
            <Text style={[thumbStyles.gridHead, { width: 26, textAlign: 'center', color: p }]}>QTY</Text>
            <Text style={[thumbStyles.gridHead, { width: 46, textAlign: 'right', color: p }]}>AMT</Text>
          </View>
          <View style={[thumbStyles.gridRow, { borderBottomColor: hexToRgba(p, 0.2) }]}>
            <Text style={[thumbStyles.gridCell, { flex: 2 }]}>Barcode Scanner</Text>
            <Text style={[thumbStyles.gridCell, { width: 26, textAlign: 'center' }]}>1</Text>
            <Text style={[thumbStyles.gridCell, { width: 46, textAlign: 'right', fontWeight: '700' }]}>₹3,250</Text>
          </View>
          <View style={thumbStyles.gridRowNoBorder}>
            <Text style={[thumbStyles.gridCell, { flex: 2 }]}>Thermal Rolls</Text>
            <Text style={[thumbStyles.gridCell, { width: 26, textAlign: 'center' }]}>2</Text>
            <Text style={[thumbStyles.gridCell, { width: 46, textAlign: 'right', fontWeight: '700' }]}>₹1,650</Text>
          </View>
        </View>
        <View style={[thumbStyles.classicFoot, { backgroundColor: p }]}>
          <Text style={thumbStyles.footWhite}>NET PAYABLE</Text>
          <Text style={thumbStyles.footWhite}>₹4,900.00</Text>
        </View>
      </View>
    );
  }

  if (templateId === 3) {
    // Creative Accent: left vertical stripe + circle logo + floating rows
    return (
      <View style={[thumbStyles.box, { flexDirection: 'row', borderColor: hexToRgba(a, 0.4) }]}>
        <View style={{ width: 6, backgroundColor: a }} />
        <View style={{ flex: 1 }}>
          <View style={thumbStyles.creativeHead}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[thumbStyles.circleBadge, { backgroundColor: a }]}>
                <Text style={thumbStyles.circleBadgeText}>B</Text>
              </View>
              <Text style={[thumbStyles.boldTitle, { color: p }]}>BILLBOOK STUDIO</Text>
            </View>
            <View style={[thumbStyles.softPill, { backgroundColor: aSoft }]}>
              <Text style={[thumbStyles.softPillText, { color: a }]}>#INV-042</Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 8, paddingBottom: 6, gap: 4 }}>
            <View style={[thumbStyles.creativeItem, { backgroundColor: pSoft }]}>
              <View style={[thumbStyles.numDot, { backgroundColor: a }]}>
                <Text style={thumbStyles.numDotText}>1</Text>
              </View>
              <Text style={[thumbStyles.gridCell, { flex: 1 }]}>Barcode Scanner</Text>
              <Text style={[thumbStyles.gridCell, { fontWeight: '800', color: p }]}>₹3,250</Text>
            </View>
            <View style={[thumbStyles.creativeItem, { backgroundColor: pSoft }]}>
              <View style={[thumbStyles.numDot, { backgroundColor: a }]}>
                <Text style={thumbStyles.numDotText}>2</Text>
              </View>
              <Text style={[thumbStyles.gridCell, { flex: 1 }]}>Thermal Rolls</Text>
              <Text style={[thumbStyles.gridCell, { fontWeight: '800', color: p }]}>₹1,650</Text>
            </View>
          </View>
          <View style={[thumbStyles.creativeTotalBar, { backgroundColor: p }]}>
            <Text style={thumbStyles.footWhite}>GRAND TOTAL</Text>
            <View style={[thumbStyles.softPill, { backgroundColor: a }]}>
              <Text style={thumbStyles.footWhite}>₹4,900.00</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (templateId === 4) {
    // Thermal POS Receipt: centered narrow paper + dashed rules + barcode bars
    return (
      <View style={thumbStyles.thermalOuter}>
        <View style={[thumbStyles.thermalCard, { borderColor: hexToRgba(p, 0.3) }]}>
          <View style={{ height: 3, flexDirection: 'row' }}>
            <View style={{ flex: 2, backgroundColor: p }} />
            <View style={{ flex: 1, backgroundColor: a }} />
          </View>
          <View style={{ padding: 8, alignItems: 'center' }}>
            <Text style={[thumbStyles.boldTitle, { color: p, textAlign: 'center' }]}>BILLBOOK MART</Text>
            <Text style={[thumbStyles.miniSub, { color: a, fontWeight: '700' }]}>POS RECEIPT #042</Text>
            <View style={thumbStyles.miniDashed} />
            <View style={thumbStyles.thermalLine}>
              <Text style={thumbStyles.gridCell}>1x Scanner Pro</Text>
              <Text style={[thumbStyles.gridCell, { fontWeight: '700' }]}>₹3,250</Text>
            </View>
            <View style={thumbStyles.thermalLine}>
              <Text style={thumbStyles.gridCell}>2x Paper Roll</Text>
              <Text style={[thumbStyles.gridCell, { fontWeight: '700' }]}>₹1,650</Text>
            </View>
            <View style={thumbStyles.miniDashed} />
            <View style={[thumbStyles.thermalTotal, { backgroundColor: p }]}>
              <Text style={thumbStyles.footWhite}>TOTAL</Text>
              <Text style={thumbStyles.footWhite}>₹4,900</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 1.5, marginTop: 5 }}>
              {[2, 1, 3, 1, 2, 1, 2, 3, 1, 2, 1, 2].map((w, i) => (
                <View key={i} style={{ width: w, height: 10, backgroundColor: i % 2 === 0 ? p : 'transparent' }} />
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (templateId === 5) {
    // Minimalist Clean: airy white editorial layout + thin accent rule
    return (
      <View style={[thumbStyles.box, { padding: 10, borderColor: '#E2E8F0' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={[thumbStyles.minimalTitle, { color: p }]}>INVOICE</Text>
            <View style={{ width: 24, height: 2.5, backgroundColor: a, marginTop: 2 }} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[thumbStyles.miniSub, { color: p, fontWeight: '700' }]}>BillBook Store</Text>
            <Text style={thumbStyles.miniSub}>#INV-042</Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: p, marginTop: 8, marginBottom: 5 }} />
        <View style={thumbStyles.minimalRow}>
          <Text style={[thumbStyles.gridCell, { flex: 1 }]}>Wireless Barcode Scanner</Text>
          <Text style={[thumbStyles.gridCell, { fontWeight: '700', color: p }]}>₹3,250</Text>
        </View>
        <View style={thumbStyles.minimalRow}>
          <Text style={[thumbStyles.gridCell, { flex: 1 }]}>Thermal Billing Rolls</Text>
          <Text style={[thumbStyles.gridCell, { fontWeight: '700', color: p }]}>₹1,650</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 6, gap: 6 }}>
          <Text style={[thumbStyles.miniSub, { color: a, fontWeight: '800' }]}>TOTAL</Text>
          <Text style={[thumbStyles.boldTitle, { color: p }]}>₹4,900.00</Text>
        </View>
      </View>
    );
  }

  if (templateId === 6) {
    // Executive Detailed: double frame + top accent ribbon + 3-col meta
    return (
      <View style={[thumbStyles.box, { borderColor: p, borderWidth: 1.5, padding: 2 }]}>
        <View style={{ borderWidth: 1, borderColor: a, borderRadius: 8, overflow: 'hidden' }}>
          <View style={{ backgroundColor: a, paddingHorizontal: 8, paddingVertical: 2, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#FFF', fontSize: 7, fontWeight: '800' }}>TAX INVOICE • ORIGINAL</Text>
            <Text style={{ color: '#FFF', fontSize: 7, fontWeight: '800' }}>PAID</Text>
          </View>
          <View style={{ backgroundColor: p, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={thumbStyles.footWhite}>BILLBOOK ENTERPRISES</Text>
            <Text style={thumbStyles.footWhite}>#INV-042</Text>
          </View>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: hexToRgba(p, 0.25) }}>
            <View style={{ flex: 1, padding: 4, borderRightWidth: 1, borderRightColor: hexToRgba(p, 0.25) }}>
              <Text style={[thumbStyles.miniSub, { color: p, fontWeight: '700' }]}>SELLER</Text>
              <Text style={thumbStyles.miniSub}>BillBook</Text>
            </View>
            <View style={{ flex: 1, padding: 4, borderRightWidth: 1, borderRightColor: hexToRgba(p, 0.25) }}>
              <Text style={[thumbStyles.miniSub, { color: a, fontWeight: '700' }]}>BUYER</Text>
              <Text style={thumbStyles.miniSub}>Aarav Patel</Text>
            </View>
            <View style={{ flex: 1, padding: 4 }}>
              <Text style={[thumbStyles.miniSub, { color: p, fontWeight: '700' }]}>META</Text>
              <Text style={thumbStyles.miniSub}>UPI Paid</Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[thumbStyles.miniSub, { color: '#64748B' }]}>3 Items • Disc Applied</Text>
            <View style={{ backgroundColor: p, borderLeftWidth: 3, borderLeftColor: a, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 }}>
              <Text style={thumbStyles.footWhite}>₹4,900.00</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Template 1: Modern Slate
  return (
    <View style={[thumbStyles.box, { borderColor: hexToRgba(p, 0.25) }]}>
      <View style={[thumbStyles.modernBanner, { backgroundColor: p }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={thumbStyles.modernLogo}>
            <Text style={thumbStyles.footWhite}>BB</Text>
          </View>
          <Text style={thumbStyles.footWhite}>BILLBOOK STORE</Text>
        </View>
        <View style={{ backgroundColor: a, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
          <Text style={{ color: '#FFF', fontSize: 7.5, fontWeight: '800' }}>#INV-042</Text>
        </View>
      </View>
      <View style={[thumbStyles.modernMeta, { backgroundColor: pSoft }]}>
        <Text style={[thumbStyles.miniSub, { color: p, fontWeight: '700' }]}>BILL TO: Aarav Patel</Text>
        <Text style={[thumbStyles.miniSub, { color: a, fontWeight: '700' }]}>PAID</Text>
      </View>
      <View style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
          <Text style={thumbStyles.gridCell}>Wireless Scanner Pro</Text>
          <Text style={[thumbStyles.gridCell, { fontWeight: '700' }]}>₹3,250</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
          <Text style={thumbStyles.gridCell}>Thermal Paper Rolls</Text>
          <Text style={[thumbStyles.gridCell, { fontWeight: '700' }]}>₹1,650</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 7 }}>
        <Text style={[thumbStyles.miniSub, { fontWeight: '700', color: '#64748B' }]}>TOTAL DUE</Text>
        <View style={{ backgroundColor: a, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
          <Text style={thumbStyles.footWhite}>₹4,900.00</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetBase: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  rowFlex1: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  metaEyebrow: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  customerName: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1.5,
  },
  boldDark: {
    fontWeight: '700',
    color: '#0F172A',
  },
  discNote: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    fontWeight: '800',
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
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  tableRowCol: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#334155',
  },
  colIndex: { width: 22, textAlign: 'center' },
  colName: { flex: 1, paddingHorizontal: 5 },
  colQty: { width: 32, textAlign: 'center' },
  colPrice: { width: 64, textAlign: 'right' },
  colTotal: { width: 72, textAlign: 'right' },
  summarySection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2.5,
  },
  summaryLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    color: '#64748B',
  },
  summaryVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  grandTotalPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grandTotalVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  wordsCallout: {
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3.5,
  },
  wordsText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontStyle: 'italic',
    color: '#1E293B',
  },
  footerNoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  termsText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },
  signatoryBox: {
    width: 112,
    justifyContent: 'flex-end',
  },
  sheetSignatureImg: {
    width: 96,
    height: 36,
    marginBottom: 3,
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
    fontWeight: '600',
    textAlign: 'right',
  },
  thankYouStrip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  thankYouText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  thankYouInline: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 6,
  },

  // Modern Slate
  modernBanner: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernLogoBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modernLogoText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modernBizName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modernBizSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 1,
  },
  modernTitleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modernTitleBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  modernInvNo: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  modernMetaGrid: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
  },
  modernMetaCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  modernTableWrap: {
    marginHorizontal: 12,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Classic Corporate
  classicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1.5,
  },
  classicLogoMark: {
    width: 34,
    height: 34,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classicLogoText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '900',
  },
  classicBizTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '900',
    flexShrink: 1,
  },
  classicBizSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
  },
  classicStampBox: {
    borderWidth: 1.5,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  classicStampText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  classicInvMeta: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  classicMetaRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  classicMetaCell: {
    flex: 1,
    padding: 10,
  },
  classicGridWrap: {
    margin: 10,
    borderWidth: 1,
  },
  classicGridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    alignItems: 'stretch',
  },
  classicGridHead: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    fontWeight: '800',
    borderRightWidth: 1,
    paddingHorizontal: 4,
  },
  classicGridCell: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    color: '#334155',
    borderRightWidth: 1,
    paddingHorizontal: 4,
  },
  classicLedgerSplit: {
    flexDirection: 'row',
    marginHorizontal: 10,
    borderWidth: 1,
  },
  classicLedgerLeft: {
    flex: 1.15,
    padding: 10,
    borderRightWidth: 1,
  },
  classicLedgerRight: {
    flex: 0.85,
    padding: 10,
    justifyContent: 'space-between',
  },
  classicLedgerLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  classicNetBox: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 4,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classicNetLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  classicNetVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  classicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 12,
  },

  // Creative Accent
  creativeStripe: {
    width: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 18,
  },
  creativeStripeDot: {
    width: 8,
    height: 36,
  },
  creativeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    gap: 8,
  },
  creativeCircleLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creativeCircleLogoText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  creativeBizName: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '900',
  },
  creativeInvoicePill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'flex-end',
  },
  creativePillType: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '900',
  },
  creativePillNo: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
  },
  creativeChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 8,
  },
  creativeInfoPill: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
  },
  creativeListHead: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1.5,
  },
  creativeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  creativeIndexDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creativeIndexDotText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  creativeTotalCard: {
    margin: 14,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  creativeTotalMeta: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  creativeTotalWords: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontStyle: 'italic',
    marginTop: 3,
  },
  creativeGrandPill: {
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignItems: 'flex-end',
  },
  creativeGrandLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  creativeGrandVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // Thermal POS Receipt
  thermalWrap: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 336,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
  },
  thermalInner: {
    padding: 16,
  },
  thermalCenter: {
    alignItems: 'center',
  },
  thermalBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  thermalBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  thermalStore: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  thermalSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    marginTop: 1,
  },
  thermalTitlePill: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  thermalTitleText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dashedRule: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    marginVertical: 10,
  },
  thermalKvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  thermalKvKey: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  thermalKvVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  thermalTableHead: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  thermalHeadText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    fontWeight: '800',
  },
  thermalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  thermalItemName: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  thermalItemSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    color: '#64748B',
  },
  thermalItemQty: {
    width: 32,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  thermalItemAmt: {
    width: 64,
    textAlign: 'right',
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  thermalTotalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 6,
    marginTop: 8,
  },
  thermalTotalLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  thermalTotalVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '900',
  },
  thermalFooterNote: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center',
  },
  thermalThankYou: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  },

  // Minimalist Clean
  minimalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  minimalDisplayTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  minimalUnderline: {
    width: 42,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    marginBottom: 6,
  },
  minimalInvId: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  minimalMonoBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  minimalMonoText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '900',
  },
  minimalBizName: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  hairlineDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  minimalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  minimalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  minimalDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  minimalStatusText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    fontWeight: '800',
  },
  minimalTableHead: {
    flexDirection: 'row',
    paddingBottom: 7,
    borderBottomWidth: 1.5,
  },
  minimalHeadLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  minimalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  minimalTotalsWrap: {
    alignItems: 'flex-end',
    marginTop: 14,
  },
  minimalTotalsBox: {
    width: '62%',
  },
  minimalTotalDivider: {
    height: 2,
    marginVertical: 6,
  },
  minimalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  minimalFinalLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  minimalFinalVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '900',
  },
  minimalWords: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    fontStyle: 'italic',
    marginTop: 10,
  },
  minimalThanks: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 14,
  },

  // Executive Detailed
  execInnerFrame: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  execRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  execRibbonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  execHeader: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  execLogoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  execLogoText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  execInvLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 8.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
  },
  execInvVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  execTriGrid: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  execTriCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
  },
  execMetaBold: {
    fontFamily: FONT_FAMILY,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  execMetaSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 9.5,
    color: '#475569',
    marginTop: 1.5,
  },
  execTableWrap: {
    margin: 8,
    borderWidth: 1,
  },
  execBottomGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  execWordsBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 7,
  },
  execTotalsCard: {
    flex: 0.85,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  execNetStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderLeftWidth: 4,
    marginTop: 4,
  },
  execNetLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  execNetVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});

const thumbStyles = StyleSheet.create({
  box: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  boldTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
  },
  miniSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    color: '#64748B',
  },
  footWhite: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modernBanner: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernLogo: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  classicTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  classicStamp: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  classicStampText: {
    fontFamily: FONT_FAMILY,
    fontSize: 7.5,
    fontWeight: '900',
  },
  gridTable: {
    marginHorizontal: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 3.5,
    borderBottomWidth: 1,
  },
  gridRowNoBorder: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 3.5,
  },
  gridHead: {
    fontFamily: FONT_FAMILY,
    fontSize: 7.5,
    fontWeight: '800',
  },
  gridCell: {
    fontFamily: FONT_FAMILY,
    fontSize: 8.5,
    color: '#334155',
  },
  classicFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  creativeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  circleBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  softPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  softPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    fontWeight: '800',
  },
  creativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  numDot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numDotText: {
    color: '#FFF',
    fontSize: 7.5,
    fontWeight: '800',
  },
  creativeTotalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  thermalOuter: {
    alignItems: 'center',
    marginBottom: 14,
  },
  thermalCard: {
    width: '74%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  miniDashed: {
    width: '100%',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    marginVertical: 4,
  },
  thermalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 1.5,
  },
  thermalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 2,
  },
  minimalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  minimalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3.5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
});

export default InvoiceTemplateRenderer;
