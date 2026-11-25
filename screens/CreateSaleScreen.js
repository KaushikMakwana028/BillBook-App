/**
 * BillBook Create Multi-Bill & POS Sales Screen
 * Multi-Bill POS system allowing cashiers and store owners to manage multiple draft bills simultaneously
 * (e.g. Bill 1, Bill 2, Bill 3) with customer auto-lookup, item quantity counters, discounts, and instant invoice creation.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import storage from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import salesService from '../services/salesService';
import productService from '../services/productService';
import partyService from '../services/partyService';
import { Header, Icon, SafeAreaView } from '../components';
import { FONT_FAMILY } from '../components/fonts';
import { resolveProductImageUrl } from '../utils/imageUrl';

const DRAFT_BILLS_STORAGE_KEY = 'billbook_draft_bills_v2';

const getTodayLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createEmptyItem = () => ({
  id: Date.now() + Math.random(),
  product_id: '',
  product_name: '',
  product_image: '',
  stock_quantity: 0,
  unit_price: 0,
  quantity: 1,
  discount: 0,
  discount_percent: 0,
  line_total: 0,
});

const createEmptyBill = (id, title) => ({
  id,
  title,
  customer_phone: '',
  customer_name: '',
  customer_address: '',
  sale_date: getTodayLocalDate(),
  notes: '',
  items: [createEmptyItem()],
});

export function CreateSaleScreen({ navigation, route, params: propParams, onGoBack, onNavigate }) {
  const { colors } = useTheme();
  const { showSuccess, showError, showAlert, showConfirm } = useAlert();

  const passedCustomer =
    route?.params?.customer ||
    propParams?.customer ||
    route?.params?.party ||
    propParams?.party ||
    null;

  // Multi-Bill State: map of bill_id -> bill object
  const [bills, setBills] = useState(() => {
    const initialBill = createEmptyBill('bill_1', 'Bill 1');
    if (passedCustomer) {
      const cleanPhone = String(passedCustomer.phone || passedCustomer.mobile || '').replace(/\D/g, '').slice(-10);
      initialBill.customer_name = passedCustomer.name || passedCustomer.customer_name || '';
      initialBill.customer_phone = cleanPhone;
      initialBill.customer_address = passedCustomer.address || passedCustomer.customer_address || '';
    }
    return { bill_1: initialBill };
  });
  const [activeBillId, setActiveBillId] = useState('bill_1');

  // Auto-fill customer info when navigated from Parties ("Create Sale")
  useEffect(() => {
    if (passedCustomer) {
      const cleanPhone = String(passedCustomer.phone || passedCustomer.mobile || '').replace(/\D/g, '').slice(-10);
      const name = passedCustomer.name || passedCustomer.customer_name || '';
      const address = passedCustomer.address || passedCustomer.customer_address || '';

      setBills((prev) => {
        const active = prev[activeBillId] || createEmptyBill(activeBillId, 'Bill 1');
        return {
          ...prev,
          [activeBillId]: {
            ...active,
            customer_name: name || active.customer_name,
            customer_phone: cleanPhone || active.customer_phone,
            customer_address: address || active.customer_address,
          },
        };
      });
    }
  }, [passedCustomer, activeBillId]);

  // Catalog Products for Item Picker Modal
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [targetItemIndex, setTargetItemIndex] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  // Status flags
  const [submitting, setSubmitting] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Active Bill Shortcut
  const currentBill = bills[activeBillId] || createEmptyBill(activeBillId, 'Bill 1');

  // Load draft bills from storage on mount
  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const saved = await storage.getItem(DRAFT_BILLS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.bills && Object.keys(parsed.bills).length > 0) {
            let loadedBills = parsed.bills;
            const targetId = parsed.activeBillId && parsed.bills[parsed.activeBillId] ? parsed.activeBillId : 'bill_1';
            // If customer was explicitly selected from Parties, merge it into the active bill so draft doesn't erase it
            if (passedCustomer) {
              const cleanPhone = String(passedCustomer.phone || passedCustomer.mobile || '').replace(/\D/g, '').slice(-10);
              const name = passedCustomer.name || passedCustomer.customer_name || '';
              const address = passedCustomer.address || passedCustomer.customer_address || '';
              loadedBills = {
                ...loadedBills,
                [targetId]: {
                  ...(loadedBills[targetId] || createEmptyBill(targetId, 'Bill 1')),
                  customer_name: name,
                  customer_phone: cleanPhone,
                  customer_address: address,
                },
              };
            }
            setBills(loadedBills);
            setActiveBillId(targetId);
          }
        }
      } catch {
        // Fallback to default
      }
    };

    loadDrafts();
  }, [passedCustomer]);

  // Persist draft bills on change
  useEffect(() => {
    try {
      storage.setItem(
        DRAFT_BILLS_STORAGE_KEY,
        JSON.stringify({ bills, activeBillId })
      ).catch(() => {});
    } catch {
      // ignore
    }
  }, [bills, activeBillId]);

  // Load product catalog
  useEffect(() => {
    setLoadingProducts(true);
    productService
      .getProducts({ limit: 100 })
      .then((res) => {
        if (res?.status && res?.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.products || [];
          setAllProducts(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onGoBack) {
      onGoBack();
    }
  };

  // ── Open Bills Tab Handlers ──
  const handleAddBill = () => {
    const existingKeys = Object.keys(bills);
    const nextIndex = existingKeys.length + 1;
    const newId = `bill_${Date.now()}`;
    const newTitle = `Bill ${nextIndex}`;
    const newBill = createEmptyBill(newId, newTitle);

    setBills((prev) => ({
      ...prev,
      [newId]: newBill,
    }));
    setActiveBillId(newId);
  };

  const handleCloseBill = (billIdToClose) => {
    const billKeys = Object.keys(bills);
    if (billKeys.length <= 1) {
      // Reset single bill
      setBills({
        bill_1: createEmptyBill('bill_1', 'Bill 1'),
      });
      setActiveBillId('bill_1');
      return;
    }

    const remainingKeys = billKeys.filter((id) => id !== billIdToClose);
    const renumbered = {};
    remainingKeys.forEach((id, index) => {
      renumbered[id] = {
        ...bills[id],
        title: `Bill ${index + 1}`,
      };
    });

    let nextActive = activeBillId;
    if (activeBillId === billIdToClose) {
      const closedIndex = billKeys.indexOf(billIdToClose);
      const nextIndex = Math.max(0, closedIndex - 1);
      nextActive = remainingKeys[nextIndex] || remainingKeys[0];
    }

    setBills(renumbered);
    setActiveBillId(nextActive);
  };

  // Update current active bill attributes
  const updateCurrentBill = (patch) => {
    setBills((prev) => ({
      ...prev,
      [activeBillId]: {
        ...prev[activeBillId],
        ...patch,
      },
    }));
  };

  // Customer phone change with auto-lookup
  const handlePhoneChange = async (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    updateCurrentBill({ customer_phone: clean });

    if (clean.length === 10) {
      setLookupLoading(true);
      try {
        const res = await partyService.customerLookup(clean);
        if (res?.status && res?.data) {
          const c = res.data;
          updateCurrentBill({
            customer_phone: clean,
            customer_name: c.name || c.customer_name || currentBill.customer_name,
            customer_address: c.address || currentBill.customer_address,
          });
        }
      } catch {
        // ignore
      } finally {
        setLookupLoading(false);
      }
    }
  };

  // ── Items Management ──
  const handleAddItemRow = () => {
    const updated = [...(currentBill.items || []), createEmptyItem()];
    updateCurrentBill({ items: updated });
  };

  const handleRemoveItemRow = (index) => {
    if ((currentBill.items || []).length <= 1) {
      updateCurrentBill({ items: [createEmptyItem()] });
      return;
    }
    const updated = currentBill.items.filter((_, idx) => idx !== index);
    updateCurrentBill({ items: updated });
  };

  const handleOpenProductPicker = (index) => {
    setTargetItemIndex(index);
    setProductSearch('');
    setProductPickerVisible(true);
  };

  const handleSelectProduct = (prod) => {
    if (targetItemIndex === null) return;
    const items = [...(currentBill.items || [])];
    const target = items[targetItemIndex] || createEmptyItem();

    const unitPrice = parseFloat(prod.sale_price || prod.price || 0);
    const qty = target.quantity || 1;
    const discount = target.discount || 0;
    const discPercent = target.discount_percent || 0;
    const lineTotal = Math.max(0, unitPrice * qty - discount);
    const prodImg = prod.image || prod.product_image || prod.image_url || '';

    items[targetItemIndex] = {
      ...target,
      product_id: prod.id,
      product_name: prod.name,
      product_image: prodImg,
      stock_quantity: parseInt(prod.quantity || prod.stock || 0, 10),
      unit_price: unitPrice,
      quantity: qty,
      discount: discount,
      discount_percent: discPercent,
      line_total: lineTotal,
    };

    updateCurrentBill({ items });
    setProductPickerVisible(false);
    setTargetItemIndex(null);
  };

  const handleQuantityChange = (index, delta) => {
    const items = [...(currentBill.items || [])];
    const it = items[index];
    if (!it) return;

    const newQty = Math.max(1, (parseInt(it.quantity, 10) || 1) + delta);
    const lineSubtotal = (parseFloat(it.unit_price) || 0) * newQty;
    let discRupees = parseFloat(it.discount) || 0;
    let discPercent = parseFloat(it.discount_percent) || 0;

    // Recalculate discount based on percent if active, else adapt percent
    if (discPercent > 0) {
      discRupees = Number(((lineSubtotal * discPercent) / 100).toFixed(2));
    } else if (discRupees > 0 && lineSubtotal > 0) {
      discPercent = Number(((discRupees / lineSubtotal) * 100).toFixed(2));
    }
    const lineTotal = Math.max(0, lineSubtotal - discRupees);

    items[index] = {
      ...it,
      quantity: newQty,
      discount: discRupees,
      discount_percent: discPercent,
      line_total: lineTotal,
    };

    updateCurrentBill({ items });
  };

  // Dual discount synchronization: Type in Rupees -> Auto-calculates %
  const handleDiscountRupeeChange = (index, val) => {
    const items = [...(currentBill.items || [])];
    const it = items[index];
    if (!it) return;

    const cleanVal = val.replace(/[^0-9.]/g, '');
    const discRupees = parseFloat(cleanVal) || 0;
    const lineSubtotal = (parseFloat(it.unit_price) || 0) * (parseInt(it.quantity, 10) || 1);
    const discPercent = (lineSubtotal > 0 && discRupees > 0)
      ? Number(((discRupees / lineSubtotal) * 100).toFixed(2))
      : 0;
    const lineTotal = Math.max(0, lineSubtotal - discRupees);

    items[index] = {
      ...it,
      discount: cleanVal === '' ? '' : discRupees,
      discount_percent: cleanVal === '' ? '' : discPercent,
      line_total: lineTotal,
    };

    updateCurrentBill({ items });
  };

  // Dual discount synchronization: Type in % -> Auto-calculates Rupees
  const handleDiscountPercentChange = (index, val) => {
    const items = [...(currentBill.items || [])];
    const it = items[index];
    if (!it) return;

    const cleanVal = val.replace(/[^0-9.]/g, '');
    const discPercent = parseFloat(cleanVal) || 0;
    const lineSubtotal = (parseFloat(it.unit_price) || 0) * (parseInt(it.quantity, 10) || 1);
    const discRupees = (lineSubtotal > 0 && discPercent > 0)
      ? Number(((lineSubtotal * discPercent) / 100).toFixed(2))
      : 0;
    const lineTotal = Math.max(0, lineSubtotal - discRupees);

    items[index] = {
      ...it,
      discount: cleanVal === '' ? '' : discRupees,
      discount_percent: cleanVal === '' ? '' : discPercent,
      line_total: lineTotal,
    };

    updateCurrentBill({ items });
  };

  const handleDiscountChange = handleDiscountRupeeChange;

  // Financial Totals
  const subtotal = (currentBill.items || []).reduce((acc, it) => {
    return acc + (parseFloat(it.unit_price) || 0) * (parseInt(it.quantity, 10) || 0);
  }, 0);

  const totalDiscount = (currentBill.items || []).reduce((acc, it) => {
    return acc + (parseFloat(it.discount) || 0);
  }, 0);

  const grandTotal = Math.max(0, subtotal - totalDiscount);

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

  // ── Submit Order & Generate Invoice ──
  const handleSaveAndGenerateInvoice = async () => {
    const validItems = (currentBill.items || []).filter(
      (it) => it.product_id && it.quantity > 0
    );

    if (validItems.length === 0) {
      showError({
        title: 'Empty Bill Items',
        message: 'Please add at least one valid product to generate an invoice.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_name: (currentBill.customer_name || '').trim() || 'Walk-in Customer',
        customer_phone: (currentBill.customer_phone || '').trim(),
        customer_address: (currentBill.customer_address || '').trim(),
        sale_date: currentBill.sale_date,
        notes: (currentBill.notes || '').trim(),
        status: 'paid',
        items: validItems.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          price: it.unit_price,
          discount: it.discount || 0,
          discount_percent: it.discount_percent || 0,
        })),
      };

      const res = await salesService.createSale(payload);
      if (res?.status && res?.data) {
        const createdSale = res.data.sale || res.data;

        // If multiple bills were open, close this fulfilled bill and renumber remaining
        const billKeys = Object.keys(bills);
        if (billKeys.length > 1) {
          const remainingKeys = billKeys.filter((id) => id !== activeBillId);
          const renumbered = {};
          remainingKeys.forEach((id, index) => {
            renumbered[id] = {
              ...bills[id],
              title: `Bill ${index + 1}`,
            };
          });
          setBills(renumbered);
          setActiveBillId(remainingKeys[0]);
        } else {
          // Reset single bill
          updateCurrentBill({
            customer_phone: '',
            customer_name: '',
            customer_address: '',
            notes: '',
            items: [createEmptyItem()],
          });
        }

        showSuccess({
          title: 'Invoice Created 🎉',
          message: `Tax Invoice #${createdSale.invoice_number || createdSale.id} was generated successfully!`,
          onConfirm: () => {
            if (onNavigate) {
              onNavigate('SaleDetail', {
                sale: createdSale,
                saleId: createdSale.id,
                fromCreate: true,
              });
            } else {
              handleBack();
            }
          },
        });
      } else {
        showError({
          title: 'Failed to Create Invoice',
          message: res?.message || 'Server could not process sale.',
        });
      }
    } catch (err) {
      showError({
        title: 'Error Creating Invoice',
        message: err.response?.data?.message || err.message || 'Network error.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = allProducts.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.category_name?.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <Header
        title="Create Invoice (POS)"
        subtitle={`${Object.keys(bills).length} Active Draft Bills`}
        showBack={true}
        onBackPress={handleBack}
      />

      {/* ── MULTI-BILL HORIZONTAL TAB BAR (Bill 1, Bill 2, Bill 3...) ── */}
      <View style={[styles.tabBarWrapper, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {Object.keys(bills).map((bId) => {
            const b = bills[bId];
            const isActive = activeBillId === bId;
            const itemCount = (b.items || []).filter((it) => it.product_id).length;

            return (
              <TouchableOpacity
                key={bId}
                style={[
                  styles.billTab,
                  {
                    backgroundColor: isActive ? colors.primary : colors.cardSecondary,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveBillId(bId)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.billTabText,
                    {
                      color: isActive ? '#FFFFFF' : colors.text,
                      fontWeight: isActive ? '800' : '600',
                    },
                  ]}
                >
                  {b.title} {itemCount > 0 ? `(${itemCount})` : ''}
                </Text>

                {/* Close Bill Tab button */}
                <TouchableOpacity
                  onPress={() => handleCloseBill(bId)}
                  style={styles.closeTabBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon
                    name="close"
                    size={11}
                    color={isActive ? '#FFFFFF' : colors.textMuted}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          {/* "+ New Bill" Tab Button */}
          <TouchableOpacity
            style={[styles.addBillBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
            onPress={handleAddBill}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={13} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.addBillBtnText, { color: colors.primary }]}>+ New Bill</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── CUSTOMER SECTION ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconBox, { backgroundColor: colors.primaryLight }]}>
                <Icon name="user" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Customer Information</Text>
            </View>

            {/* Mobile with Auto-Lookup */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Mobile Number</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.prefixText, { color: colors.textMuted }]}>+91</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor={colors.textMuted}
                  value={currentBill.customer_phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="numeric"
                  maxLength={10}
                />
                {lookupLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
              </View>
            </View>

            {/* Customer Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Customer Name</Text>
              <TextInput
                style={[styles.textInputFull, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Walk-in Customer"
                placeholderTextColor={colors.textMuted}
                value={currentBill.customer_name}
                onChangeText={(val) => updateCurrentBill({ customer_name: val })}
              />
            </View>

            {/* Sale Date with Today Quick Button */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Sale / Invoice Date</Text>
                <TouchableOpacity
                  onPress={() => updateCurrentBill({ sale_date: getTodayLocalDate() })}
                  style={[styles.todayQuickPill, { backgroundColor: colors.primaryLight }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.todayQuickText, { color: colors.primary }]}>Today</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.textInputFull, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={currentBill.sale_date}
                onChangeText={(val) => updateCurrentBill({ sale_date: val })}
              />
            </View>

            {/* Customer Address */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Customer Address</Text>
              <TextInput
                style={[styles.textAreaInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Enter customer billing / delivery address"
                placeholderTextColor={colors.textMuted}
                value={currentBill.customer_address}
                onChangeText={(val) => updateCurrentBill({ customer_address: val })}
                multiline={true}
                numberOfLines={2}
              />
            </View>
          </View>

          {/* ── INVOICE ITEMS SECTION ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.itemsHeaderRow}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Icon name="box" size={16} color="#059669" />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Invoice Items</Text>
              </View>

              <TouchableOpacity
                onPress={handleAddItemRow}
                style={[styles.addItemChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              >
                <Icon name="plus" size={12} color={colors.primary} style={{ marginRight: 3 }} />
                <Text style={[styles.addItemChipText, { color: colors.primary }]}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {/* Item Rows */}
            {(currentBill.items || []).map((item, index) => {
              const itemImg = resolveProductImageUrl(item.product_image);

              return (
                <View
                  key={item.id || index}
                  style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  {/* Row 1: Product Image Thumbnail & Selector & Remove */}
                  <View style={styles.itemTopRow}>
                    {itemImg ? (
                      <Image
                        source={{ uri: itemImg }}
                        style={styles.itemThumbImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.itemThumbPlaceholder, { backgroundColor: colors.primaryLight }]}>
                        <Icon name="box" size={14} color={colors.primary} />
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.selectProductBtn, { borderColor: item.product_name ? colors.primary : colors.border }]}
                      onPress={() => handleOpenProductPicker(index)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.selectProductBtnText,
                          {
                            color: item.product_name ? colors.text : colors.textMuted,
                            fontWeight: item.product_name ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.product_name || 'Select Product / Item'}
                      </Text>
                      <Icon name="chevron-down" size={14} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRemoveItemRow(index)}
                      style={styles.removeItemBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="delete" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  {/* Row 2: Price, Qty Counter, and Amount */}
                  <View style={styles.itemBottomRow}>
                    {/* Unit Price */}
                    <View style={styles.itemCol}>
                      <Text style={[styles.itemColLabel, { color: colors.textMuted }]}>Rate (₹)</Text>
                      <Text style={[styles.itemColVal, { color: colors.text }]}>
                        {item.unit_price > 0 ? `₹${item.unit_price}` : '₹0'}
                      </Text>
                    </View>

                    {/* Quantity Counter */}
                    <View style={styles.itemCol}>
                      <Text style={[styles.itemColLabel, { color: colors.textMuted }]}>Qty</Text>
                      <View style={[styles.counterBox, { borderColor: colors.border }]}>
                        <TouchableOpacity
                          onPress={() => handleQuantityChange(index, -1)}
                          style={styles.counterBtn}
                        >
                          <Text style={[styles.counterBtnText, { color: colors.text }]}>−</Text>
                        </TouchableOpacity>
                        <Text style={[styles.counterVal, { color: colors.text }]}>
                          {item.quantity}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleQuantityChange(index, 1)}
                          style={styles.counterBtn}
                        >
                          <Text style={[styles.counterBtnText, { color: colors.text }]}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Line Total */}
                    <View style={[styles.itemCol, { alignItems: 'flex-end' }]}>
                      <Text style={[styles.itemColLabel, { color: colors.textMuted }]}>Total</Text>
                      <Text style={[styles.lineTotalText, { color: colors.primary }]}>
                        {formatCurrency(item.line_total)}
                      </Text>
                    </View>
                  </View>

                  {/* Row 3: Dual Discount (₹ and %) */}
                  <View style={[styles.discountRow, { borderTopColor: colors.border }]}>
                    <View style={styles.dualDiscCol}>
                      <Text style={[styles.itemColLabel, { color: colors.textMuted }]}>Disc (₹)</Text>
                      <TextInput
                        style={[styles.miniInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        value={item.discount !== '' && item.discount !== undefined ? String(item.discount) : ''}
                        onChangeText={(val) => handleDiscountRupeeChange(index, val)}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.dualDiscCol}>
                      <Text style={[styles.itemColLabel, { color: colors.textMuted }]}>Disc (%)</Text>
                      <TextInput
                        style={[styles.miniInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                        placeholder="0%"
                        placeholderTextColor={colors.textMuted}
                        value={item.discount_percent !== '' && item.discount_percent !== undefined ? String(item.discount_percent) : ''}
                        onChangeText={(val) => handleDiscountPercentChange(index, val)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── BILL SUMMARY CARD ── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Sub Total</Text>
              <Text style={[styles.summaryVal, { color: colors.text }]}>{formatCurrency(subtotal)}</Text>
            </View>

            {totalDiscount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.danger }]}>Discount</Text>
                <Text style={[styles.summaryVal, { color: colors.danger }]}>
                  - {formatCurrency(totalDiscount)}
                </Text>
              </View>
            ) : null}

            <View style={[styles.grandTotalBanner, { backgroundColor: colors.primary }]}>
              <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
              <Text style={styles.grandTotalVal}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>

          {/* ── SUBMIT BUTTON ── */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.primary },
              submitting && { opacity: 0.75 },
            ]}
            onPress={handleSaveAndGenerateInvoice}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="check" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Save & Generate Invoice</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── MODAL: PRODUCT CATALOG PICKER ── */}
      <Modal
        visible={productPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProductPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: colors.card }]}>
            {/* Modal Header */}
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Choose Inventory Product</Text>
              <TouchableOpacity onPress={() => setProductPickerVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Product Search Box */}
            <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Icon name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by product name, SKU or barcode..."
                placeholderTextColor={colors.textMuted}
                value={productSearch}
                onChangeText={setProductSearch}
              />
            </View>

            {/* Products List */}
            {loadingProducts ? (
              <View style={styles.pickerLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.pickerList}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const pImg = resolveProductImageUrl(p.image || p.product_image || p.image_url);

                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.productPickRow, { borderBottomColor: colors.border }]}
                        onPress={() => handleSelectProduct(p)}
                        activeOpacity={0.7}
                      >
                        {pImg ? (
                          <Image
                            source={{ uri: pImg }}
                            style={styles.productPickImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.productIconMini, { backgroundColor: colors.primaryLight }]}>
                            <Icon name="box" size={16} color={colors.primary} />
                          </View>
                        )}
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={[styles.productPickName, { color: colors.text }]} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <Text style={[styles.productPickSub, { color: colors.textMuted }]}>
                            Stock: {p.quantity || p.stock || 0} • {p.category_name || 'General'}
                          </Text>
                        </View>
                        <Text style={[styles.productPickPrice, { color: colors.primary }]}>
                          {formatCurrency(p.sale_price || p.price)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.noProductsBox}>
                    <Text style={[styles.noProductsText, { color: colors.textMuted }]}>
                      No products match your search.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
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
  tabBarWrapper: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tabScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  billTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  billTabText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  closeTabBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  addBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  addBillBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 32,
    height: 32,
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
  inputGroup: {
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  todayQuickPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayQuickText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  prefixText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    height: '100%',
  },
  textInputFull: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 60,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  itemThumbImg: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  itemThumbPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addItemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  addItemChipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  selectProductBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  selectProductBtnText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  removeItemBtn: {
    padding: 6,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCol: {
    alignItems: 'flex-start',
  },
  itemColLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    marginBottom: 3,
  },
  itemColVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 30,
  },
  counterBtn: {
    paddingHorizontal: 8,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  counterVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  miniInput: {
    width: 60,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 0,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  dualDiscCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lineTotalText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  summaryVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  grandTotalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  grandTotalLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grandTotalVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginTop: 4,
  },
  submitBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    height: '100%',
  },
  pickerLoading: {
    padding: 32,
    alignItems: 'center',
  },
  pickerList: {
    paddingBottom: 24,
  },
  productPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  productPickImg: {
    width: 38,
    height: 38,
    borderRadius: 8,
    marginRight: 10,
  },
  productIconMini: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  productPickName: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  productPickSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 2,
  },
  productPickPrice: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
  },
  noProductsBox: {
    padding: 32,
    alignItems: 'center',
  },
  noProductsText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
});

export default CreateSaleScreen;
