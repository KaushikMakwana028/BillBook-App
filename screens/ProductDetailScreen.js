/**
 * BillBook Product Detail Screen
 * Comprehensive product overview: pricing, profit margin, stock valuation, barcode,
 * and direct actions to Edit Product or Delete Product with custom confirmation.
 * Styled with BillBook brand colors (#F58220, #0A2540) and CustomAlert
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Modal,
  Linking,
  Switch,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import productService from '../services/productService';
import { Header, Icon, BarcodeView, SafeAreaView } from '../components';
import { FONT_FAMILY } from '../components/fonts';
import { resolveProductImageUrl } from '../utils/imageUrl';

export function ProductDetailScreen({ navigation, route, params: propParams, onGoBack, onNavigate }) {
  const { colors } = useTheme();
  const { showAlert, showConfirm, showSuccess, showError } = useAlert();

  const initialProduct = route?.params?.product || propParams?.product || {};
  const productId = initialProduct.id || route?.params?.productId || propParams?.productId;

  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(!initialProduct.name && !!productId);
  const [deleting, setDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Print Barcode Modal State
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [barcodeCopies, setBarcodeCopies] = useState(1);
  const [showLabelName, setShowLabelName] = useState(true);
  const [showLabelPrice, setShowLabelPrice] = useState(true);
  const [compactLabel, setCompactLabel] = useState(false);
  const [printingSheet, setPrintingSheet] = useState(false);

  // Fetch full details if needed
  useEffect(() => {
    if (productId) {
      productService
        .getProductDetail(productId)
        .then((res) => {
          if (res?.status && res?.data) {
            setProduct(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [productId]);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onGoBack) {
      onGoBack();
    }
  };

  const handleEdit = () => {
    if (onNavigate) {
      onNavigate('EditProduct', { product });
    } else if (navigation?.navigate) {
      navigation.navigate('EditProduct', { product });
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"? This action will remove the item from your catalog.`,
      type: 'danger',
      confirmText: 'Delete Item',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setDeleting(true);
        try {
          const res = await productService.deleteProduct(product.id);
          if (res?.status) {
            showSuccess({
              title: 'Product Deleted',
              message: `"${product.name}" has been permanently removed.`,
              onConfirm: () => {
                if (onNavigate) {
                  onNavigate('Products', { refresh: true });
                } else {
                  handleBack();
                }
              },
            });
          } else {
            showError({
              title: 'Could Not Delete',
              message: res?.message || 'Failed to delete product. Please try again.',
            });
          }
        } catch (err) {
          showError({
            title: 'Error',
            message: err.message || 'Failed to delete product due to network error.',
          });
        } finally {
          setDeleting(false);
        }
      },
    });
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

  // Calculations
  const sellingPrice = parseFloat(product.sale_price || product.price || 0);
  const purchasePrice = parseFloat(product.purchase_price || product.costPrice || 0);
  const stockQty = parseInt(product.quantity || product.stock || 0, 10);
  const profitMargin = sellingPrice - purchasePrice;
  const marginPercentage =
    sellingPrice > 0 ? ((profitMargin / sellingPrice) * 100).toFixed(1) : 0;
  const stockValuation = stockQty * (purchasePrice || sellingPrice);

  const isOutOfStock = stockQty <= 0;
  const isLowStock = !isOutOfStock && stockQty <= 5;

  const rawImg = product.image || product.product_image || product.image_url || product.photo || product.img;
  const resolvedImg = resolveProductImageUrl(rawImg);

  const effectiveBarcode = String(
    product.barcode || product.sku || (product.id ? `BB${String(product.id).padStart(6, '0')}` : '')
  ).trim();
  const hasExplicitBarcode = Boolean(product.barcode && String(product.barcode).trim());

  const handleOpenPrintBarcode = () => {
    if (!effectiveBarcode) {
      showError({
        title: 'No Barcode Available',
        message: 'Please edit this product and assign or generate a barcode first.',
      });
      return;
    }
    setBarcodeModalVisible(true);
  };

  const handlePrintBarcodeSheet = async () => {
    if (!product.id) {
      showAlert({
        title: 'Barcode Label Ready',
        message: 'Use the Share Label option to send or print this barcode label.',
        type: 'info',
      });
      return;
    }

    setPrintingSheet(true);
    try {
      const res = await productService.getBarcodeSheet(`${product.id}:${barcodeCopies}`);
      const sheetUrl =
        res?.data?.url ||
        res?.data?.pdf_url ||
        res?.data?.print_url ||
        res?.url ||
        res?.print_url;

      if (sheetUrl && typeof sheetUrl === 'string') {
        await Linking.openURL(sheetUrl);
      } else {
        showSuccess({
          title: 'Print Sheet Prepared',
          message: `${barcodeCopies} ${barcodeCopies === 1 ? 'label' : 'labels'} for "${product.name}" (${effectiveBarcode}) ready in the sheet preview above. Tap "Share Barcode" to send or print from your device.`,
        });
      }
    } catch {
      showAlert({
        title: 'Offline Label Preview Ready',
        message: `Your ${barcodeCopies}-copy barcode sheet for "${product.name}" (${effectiveBarcode}) is rendered above. Use "Share Barcode" to send or print via a connected printer app.`,
        type: 'info',
      });
    } finally {
      setPrintingSheet(false);
    }
  };

  const handleShareBarcode = async () => {
    try {
      await Share.share({
        title: `${product.name || 'Product'} Barcode`,
        message: `Product: ${product.name || 'Item'}\nPrice: ${formatCurrency(sellingPrice)}\nBarcode / SKU: ${effectiveBarcode}\nCopies: ${barcodeCopies}`,
      });
    } catch {
      // ignore user cancel
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Header
        title="Product Details"
        subtitle={product.name || 'Catalog Item'}
        showBack={true}
        onBackPress={handleBack}
        rightIcon="edit"
        onRightPress={handleEdit}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading product data...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── PRODUCT IMAGE SHOWCASE (If Available) ── */}
          {resolvedImg && !imgError ? (
            <View style={[styles.productImageContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Image
                source={{ uri: resolvedImg }}
                style={styles.heroBannerImage}
                resizeMode="contain"
                onError={() => setImgError(true)}
              />
            </View>
          ) : null}

          {/* ── HERO PRODUCT CARD ── */}
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.heroTopRow}>
              <View style={[styles.productIconHolder, { backgroundColor: colors.primaryLight, overflow: 'hidden' }]}>
                {resolvedImg && !imgError ? (
                  <Image
                    source={{ uri: resolvedImg }}
                    style={styles.thumbImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Icon name="box" size={32} color={colors.primary} />
                )}
              </View>
              <View style={styles.heroMeta}>
                {product.category_name || product.category ? (
                  <View style={[styles.categoryTag, { backgroundColor: colors.primaryLight }]}>
                    <Icon name="tag" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.categoryTagText, { color: colors.primary }]}>
                      {product.category_name || product.category}
                    </Text>
                  </View>
                ) : null}

                {/* Stock Status Badge */}
                <View
                  style={[
                    styles.stockStatusBadge,
                    {
                      backgroundColor: isOutOfStock
                        ? '#FEF2F2'
                        : isLowStock
                        ? '#FFFBEB'
                        : '#ECFDF5',
                      borderColor: isOutOfStock
                        ? '#FECACA'
                        : isLowStock
                        ? '#FDE68A'
                        : '#A7F3D0',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.stockDot,
                      {
                        backgroundColor: isOutOfStock
                          ? colors.danger
                          : isLowStock
                          ? '#F59E0B'
                          : '#10B981',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.stockStatusText,
                      {
                        color: isOutOfStock
                          ? colors.danger
                          : isLowStock
                          ? '#B45309'
                          : '#047857',
                      },
                    ]}
                  >
                    {isOutOfStock
                      ? 'Out of Stock'
                      : isLowStock
                      ? `Low Stock (${stockQty} left)`
                      : `In Stock (${stockQty} units)`}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.heroProductName, { color: colors.text }]}>{product.name}</Text>

            {/* Barcode Visual & Quick Print Option */}
            <View style={[styles.barcodeCard, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
              <View style={styles.barcodeHeaderRow}>
                <View style={styles.barcodeTitleRow}>
                  <Icon name="barcode" size={18} color={colors.navy} style={{ marginRight: 7 }} />
                  <Text style={[styles.barcodeSectionTitle, { color: colors.text }]}>
                    {hasExplicitBarcode ? 'Product Barcode' : 'Generated Item Code'}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleOpenPrintBarcode}
                  style={[styles.printInlineBtn, { backgroundColor: colors.navy }]}
                >
                  <Icon name="printer" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <Text style={styles.printInlineBtnText}>Print Barcode</Text>
                </TouchableOpacity>
              </View>

              {effectiveBarcode ? (
                <View style={styles.barcodeGraphicWrap}>
                  <BarcodeView
                    value={effectiveBarcode}
                    height={52}
                    barWidth={1.7}
                    showText={false}
                    barColor="#0A2540"
                    backgroundColor="#FFFFFF"
                  />
                  {!hasExplicitBarcode ? (
                    <Text style={[styles.barcodeHintText, { color: colors.textMuted }]}>
                      Using catalog ID fallback. Tap Edit to assign a custom barcode.
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={[styles.barcodeHintText, { color: colors.textMuted }]}>
                  No barcode assigned yet. Tap Edit to generate one.
                </Text>
              )}
            </View>
          </View>

          {/* ── PRICING & MARGIN KPI CARD ── */}
          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.kpiCardHeader}>
              <View style={[styles.kpiHeaderIcon, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="currency" size={18} color="#10B981" />
              </View>
              <Text style={[styles.kpiCardTitle, { color: colors.text }]}>Pricing & Valuation</Text>
            </View>

            <View style={styles.kpiGrid}>
              {/* Selling Price */}
              <View style={[styles.kpiItem, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Selling Price</Text>
                <Text style={[styles.kpiVal, { color: colors.primary }]}>
                  {formatCurrency(sellingPrice)}
                </Text>
              </View>

              {/* Purchase Price */}
              <View style={[styles.kpiItem, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Cost / Purchase</Text>
                <Text style={[styles.kpiVal, { color: colors.text }]}>
                  {formatCurrency(purchasePrice)}
                </Text>
              </View>

              {/* Profit Margin */}
              <View style={[styles.kpiItem, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Profit Margin</Text>
                <Text style={[styles.kpiVal, { color: profitMargin >= 0 ? '#10B981' : colors.danger }]}>
                  {formatCurrency(profitMargin)} ({marginPercentage}%)
                </Text>
              </View>

              {/* Total Stock Valuation */}
              <View style={[styles.kpiItem, { backgroundColor: colors.cardSecondary }]}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Stock Valuation</Text>
                <Text style={[styles.kpiVal, { color: colors.navy }]}>
                  {formatCurrency(stockValuation)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── SPECIFICATIONS LIST CARD ── */}
          <View style={[styles.specCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Item Specifications</Text>

            <View style={styles.specRow}>
              <Text style={[styles.specLabel, { color: colors.textMuted }]}>Category</Text>
              <Text style={[styles.specValue, { color: colors.text }]}>
                {product.category_name || product.category || 'General'}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.specRow}>
              <Text style={[styles.specLabel, { color: colors.textMuted }]}>Barcode / SKU</Text>
              <Text style={[styles.specValue, { color: colors.text }]}>
                {product.barcode || 'Not assigned'}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.specRow}>
              <Text style={[styles.specLabel, { color: colors.textMuted }]}>Current Stock</Text>
              <Text style={[styles.specValue, { color: colors.text, fontWeight: '700' }]}>
                {stockQty} units
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.specRow}>
              <Text style={[styles.specLabel, { color: colors.textMuted }]}>Unit</Text>
              <Text style={[styles.specValue, { color: colors.text }]}>
                {product.unit || 'PCS (Pieces)'}
              </Text>
            </View>
          </View>

          {/* ── DESCRIPTION / NOTES ── */}
          {product.description ? (
            <View style={[styles.specCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes & Description</Text>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>
                {product.description}
              </Text>
            </View>
          ) : null}

          {/* ── ACTION BUTTONS DOCK ── */}
          <View style={styles.actionDock}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenPrintBarcode}
              style={[styles.printDockBtn, { backgroundColor: colors.navy }]}
            >
              <Icon name="printer" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.editBtnText}>Print</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleEdit}
              style={[styles.editBtn, { backgroundColor: colors.primary }]}
            >
              <Icon name="edit" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDelete}
              disabled={deleting}
              style={[styles.deleteBtn, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <>
                  <Icon name="trash" size={17} color={colors.danger} style={{ marginRight: 6 }} />
                  <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ── PRINT BARCODE MODAL ── */}
      <Modal
        visible={barcodeModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setBarcodeModalVisible(false)}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
          <Header
            title="Print Barcode"
            subtitle={product.name || 'Label Preview'}
            showBack={true}
            onBackPress={() => setBarcodeModalVisible(false)}
            rightIcon="share"
            onRightPress={handleShareBarcode}
          />

          <ScrollView contentContainerStyle={styles.printModalScroll} showsVerticalScrollIndicator={false}>
            {/* Label Controls Card */}
            <View style={[styles.specCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Label Print Options</Text>

              {/* Copies Stepper + Quick Chips */}
              <View style={styles.copiesRow}>
                <View>
                  <Text style={[styles.specLabel, { color: colors.text, fontWeight: '700' }]}>Number of Copies</Text>
                  <Text style={[styles.barcodeHintText, { color: colors.textMuted, marginTop: 2 }]}>
                    Sticker labels in print sheet
                  </Text>
                </View>

                <View style={styles.stepperBox}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                    onPress={() => setBarcodeCopies((c) => Math.max(1, c - 1))}
                  >
                    <Text style={[styles.stepperBtnText, { color: colors.text }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.stepperVal, { color: colors.text }]}>{barcodeCopies}</Text>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                    onPress={() => setBarcodeCopies((c) => Math.min(24, c + 1))}
                  >
                    <Text style={[styles.stepperBtnText, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.presetCopiesRow}>
                {[1, 2, 4, 6, 8, 12].map((qty) => {
                  const active = barcodeCopies === qty;
                  return (
                    <TouchableOpacity
                      key={qty}
                      onPress={() => setBarcodeCopies(qty)}
                      style={[
                        styles.presetCopyChip,
                        {
                          backgroundColor: active ? colors.primary : colors.cardSecondary,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetCopyText,
                          { color: active ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {qty}x
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

              <View style={styles.toggleRow}>
                <Text style={[styles.specLabel, { color: colors.text }]}>Show Product Name</Text>
                <Switch
                  value={showLabelName}
                  onValueChange={setShowLabelName}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={[styles.specLabel, { color: colors.text }]}>Show Selling Price</Text>
                <Switch
                  value={showLabelPrice}
                  onValueChange={setShowLabelPrice}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={[styles.specLabel, { color: colors.text }]}>Compact Thermal Label</Text>
                <Switch
                  value={compactLabel}
                  onValueChange={setCompactLabel}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Live Printable Sheet Preview */}
            <View style={[styles.specCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sheetPreviewHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                  Printable Sheet Preview ({barcodeCopies} {barcodeCopies === 1 ? 'Label' : 'Labels'})
                </Text>
                <View style={[styles.readyPill, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={styles.readyPillText}>Code 128</Text>
                </View>
              </View>

              <View style={styles.paperSheet}>
                <View style={styles.labelsGrid}>
                  {Array.from({ length: barcodeCopies }).map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.stickerLabel,
                        compactLabel && styles.stickerLabelCompact,
                      ]}
                    >
                      {showLabelName ? (
                        <Text style={styles.stickerName} numberOfLines={1}>
                          {product.name || 'Product Item'}
                        </Text>
                      ) : null}

                      <BarcodeView
                        value={effectiveBarcode}
                        height={compactLabel ? 34 : 46}
                        barWidth={compactLabel ? 1.15 : 1.4}
                        showText={false}
                        barColor="#0F172A"
                        backgroundColor="#FFFFFF"
                        style={{ paddingVertical: 4, paddingHorizontal: 4 }}
                      />

                      {showLabelPrice ? (
                        <View style={styles.stickerFooterRow}>
                          <Text style={styles.stickerPriceLabel}>MRP / PRICE</Text>
                          <Text style={styles.stickerPriceVal}>{formatCurrency(sellingPrice)}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Print Actions */}
            <View style={styles.printActionsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePrintBarcodeSheet}
                disabled={printingSheet}
                style={[styles.printPrimaryBtn, { backgroundColor: colors.primary }]}
              >
                {printingSheet ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="printer" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.printPrimaryBtnText}>Print Barcode Sheet</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleShareBarcode}
                style={[styles.shareSecondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Icon name="share" size={17} color={colors.navy} style={{ marginRight: 6 }} />
                <Text style={[styles.shareSecondaryBtnText, { color: colors.navy }]}>Share</Text>
              </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    marginTop: 12,
  },
  productImageContainer: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  productIconHolder: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroMeta: {
    flex: 1,
    gap: 6,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryTagText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  stockStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  stockStatusText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  heroProductName: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  barcodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  barcodeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
  },
  barcodeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  barcodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  barcodeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcodeSectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  printInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  printInlineBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  barcodeGraphicWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  barcodeHintText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  kpiCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  kpiHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  kpiCardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiItem: {
    flex: 1,
    minWidth: '46%',
    padding: 12,
    borderRadius: 14,
  },
  kpiLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  kpiVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
  },
  specCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  specLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  specValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  descText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    lineHeight: 20,
  },
  actionDock: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  printDockBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  editBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F58220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  editBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  printModalScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  copiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  stepperVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  presetCopiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCopyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetCopyText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sheetPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  readyPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  readyPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  paperSheet: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 12,
  },
  labelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  stickerLabel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#94A3B8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 148,
    maxWidth: '100%',
  },
  stickerLabelCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 126,
  },
  stickerName: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
    maxWidth: 180,
    textAlign: 'center',
  },
  stickerFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    width: '100%',
  },
  stickerPriceLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
  },
  stickerPriceVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '900',
    color: '#0A2540',
  },
  printActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  printPrimaryBtn: {
    flex: 2,
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  printPrimaryBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareSecondaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareSecondaryBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ProductDetailScreen;
