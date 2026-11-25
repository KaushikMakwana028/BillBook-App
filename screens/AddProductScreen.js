/**
 * BillBook Add Product Screen
 * Create new catalog items with name, category, pricing, stock, barcode generation & inline category addition
 * Styled with BillBook brand colors (#F58220, #0A2540) and CustomAlert
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import { Header, Icon, SafeAreaView } from '../components';
import { FONT_FAMILY } from '../components/fonts';
import { resolveProductImageUrl } from '../utils/imageUrl';

export function AddProductScreen({ navigation, onGoBack, onNavigate }) {
  const { colors } = useTheme();
  const { showSuccess, showError } = useAlert();

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [productImage, setProductImage] = useState('');
  const [imgError, setImgError] = useState(false);

  // Auxiliary State
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quick Inline Category Modal
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // Fetch Categories for Dropdown
  const fetchCategories = async (autoSelectNewId = null) => {
    try {
      setLoadingCategories(true);
      const res = await categoryService.getCategories();
      if (res?.status && res?.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.categories || [];
        setCategories(list);
        if (autoSelectNewId) {
          setCategoryId(String(autoSelectNewId));
        } else if (list.length > 0 && !categoryId) {
          setCategoryId(String(list[0].id));
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onGoBack) {
      onGoBack();
    }
  };

  // Generate Unique Barcode
  const handleGenerateBarcode = async () => {
    setGeneratingBarcode(true);
    try {
      const res = await productService.generateBarcode();
      if (res?.status && res?.data?.barcode) {
        setBarcode(String(res.data.barcode));
      } else {
        const fallback = String(Math.floor(1000000000 + Math.random() * 9000000000));
        setBarcode(fallback);
      }
    } catch {
      const fallback = String(Math.floor(1000000000 + Math.random() * 9000000000));
      setBarcode(fallback);
    } finally {
      setGeneratingBarcode(false);
    }
  };

  // Create Category from quick modal
  const handleCreateQuickCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showError({
        title: 'Validation',
        message: 'Please enter a category name.',
      });
      return;
    }

    setSavingCategory(true);
    try {
      const res = await categoryService.addCategory({ name: trimmed, status: 'active' });
      if (res?.status) {
        setCategoryModalVisible(false);
        setNewCategoryName('');
        const newId = res.data?.id || res.data?.category?.id;
        await fetchCategories(newId);
        showSuccess({
          title: 'Category Created',
          message: `Category "${trimmed}" has been added and selected!`,
        });
      } else {
        showError({
          title: 'Failed',
          message: res?.message || 'Could not create category.',
        });
      }
    } catch (err) {
      showError({
        title: 'Error',
        message: err.message || 'Network error while creating category.',
      });
    } finally {
      setSavingCategory(false);
    }
  };

  // Save New Product
  const handleSaveProduct = async () => {
    if (!name.trim()) {
      showError({
        title: 'Missing Required Field',
        message: 'Please enter a product name.',
      });
      return;
    }

    if (!salePrice.trim() || isNaN(parseFloat(salePrice))) {
      showError({
        title: 'Missing Selling Price',
        message: 'Please enter a valid selling price.',
      });
      return;
    }

    if (!quantity.trim() || isNaN(parseInt(quantity, 10))) {
      showError({
        title: 'Missing Stock Quantity',
        message: 'Please enter initial stock quantity.',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category: categoryId || (categories[0]?.id || ''),
        category_id: categoryId || (categories[0]?.id || ''),
        price: salePrice.trim(),
        sale_price: salePrice.trim(),
        costPrice: purchasePrice.trim() || '0',
        purchase_price: purchasePrice.trim() || '0',
        stock: quantity.trim() || '0',
        quantity: quantity.trim() || '0',
        barcode: barcode.trim(),
        description: description.trim(),
      };

      if (productImage && productImage.trim()) {
        payload.product_image = productImage.trim();
        payload.image = productImage.trim();
      }

      const res = await productService.addProduct(payload);

      if (res?.status) {
        showSuccess({
          title: 'Product Created 🎉',
          message: `"${name.trim()}" has been added to your inventory.`,
          onConfirm: () => {
            handleBack();
          },
        });
      } else {
        showError({
          title: 'Unable to Save',
          message: res?.message || 'Could not save product. Please check input values.',
        });
      }
    } catch (err) {
      showError({
        title: 'Error',
        message: err.message || 'Failed to save product due to a network error.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Header
        title="Add New Product"
        subtitle="Catalog & Inventory"
        showBack={true}
        onBackPress={handleBack}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── SECTION 1: BASIC INFORMATION ── */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: colors.primaryLight }]}>
                <Icon name="box" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Basic Details</Text>
            </View>

            {/* Product Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Product / Item Name *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Parle-G Biscuit 100g, Samsung Charger"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Category Selector with Quick "+ Category" */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithActionRow}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category *</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCategoryModalVisible(true)}
                  style={styles.inlineAddBtn}
                >
                  <Icon name="plus" size={13} color={colors.primary} />
                  <Text style={[styles.inlineAddBtnText, { color: colors.primary }]}>+ Add Category</Text>
                </TouchableOpacity>
              </View>

              {loadingCategories ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
              ) : categories.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                  {categories.map((cat) => {
                    const isSelected = String(categoryId) === String(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        activeOpacity={0.75}
                        onPress={() => setCategoryId(String(cat.id))}
                        style={[
                          styles.categoryPill,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.cardSecondary,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            {
                              color: isSelected ? '#FFFFFF' : colors.textSecondary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <TouchableOpacity
                  onPress={() => setCategoryModalVisible(true)}
                  style={[styles.noCategoryBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
                >
                  <Text style={[styles.noCategoryText, { color: colors.primary }]}>
                    + No categories found. Tap to add your first category!
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── SECTION 2: PRICING & INVENTORY ── */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="currency" size={18} color="#10B981" />
              </View>
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Pricing & Stock</Text>
            </View>

            {/* Price Row: Selling Price & Purchase Price */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Selling Price (₹) *</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={salePrice}
                  onChangeText={setSalePrice}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cost Price (₹)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Initial Stock Quantity */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Initial Stock Quantity *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. 50"
                placeholderTextColor={colors.textMuted}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>

            {/* Barcode / SKU with Generator Button */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Barcode / SKU</Text>
              <View style={styles.barcodeInputRow}>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      flex: 1,
                      backgroundColor: colors.inputBg,
                      borderColor: colors.border,
                      color: colors.text,
                      marginRight: 10,
                    },
                  ]}
                  placeholder="Enter or generate barcode"
                  placeholderTextColor={colors.textMuted}
                  value={barcode}
                  onChangeText={setBarcode}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleGenerateBarcode}
                  disabled={generatingBarcode}
                  style={[styles.barcodeGenBtn, { backgroundColor: colors.navy }]}
                >
                  {generatingBarcode ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="barcode" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.barcodeGenText}>Auto</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── SECTION 3: NOTES & DESCRIPTION ── */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#F5F3FF' }]}>
                <Icon name="document" size={18} color="#8B5CF6" />
              </View>
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Additional Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Item Description / Notes</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Product description, rack location, warranty or brand notes..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ── PRODUCT IMAGE SECTION ── */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="box" size={18} color="#10B981" />
              </View>
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Product Image</Text>
            </View>

            {productImage && !imgError && resolveProductImageUrl(productImage) ? (
              <View style={[styles.imagePreviewBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Image
                  source={{ uri: resolveProductImageUrl(productImage) }}
                  style={styles.previewImage}
                  resizeMode="contain"
                  onError={() => setImgError(true)}
                />
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Image URL or Path</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="https://... or uploads/products/..."
                placeholderTextColor={colors.textMuted}
                value={productImage}
                onChangeText={(val) => {
                  setProductImage(val);
                  setImgError(false);
                }}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* ── SAVE PRODUCT BUTTON ── */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSaveProduct}
            disabled={saving}
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="check" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Save Product to Inventory</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── QUICK ADD CATEGORY MODAL ── */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Icon name="tag" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Category</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  Create a category for your products
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category Name *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Snacks, Electronics, Beverages"
                placeholderTextColor={colors.textMuted}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border, backgroundColor: colors.cardSecondary }]}
                onPress={() => setCategoryModalVisible(false)}
                disabled={savingCategory}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateQuickCategory}
                disabled={savingCategory}
              >
                {savingCategory ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Add Category</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  formCard: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardHeaderTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelWithActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  inlineAddBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  imagePreviewBox: {
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  noCategoryBtn: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  noCategoryText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
  },
  barcodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcodeGenBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeGenText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#F58220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AddProductScreen;
