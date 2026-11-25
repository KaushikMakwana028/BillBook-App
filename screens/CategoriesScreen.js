/**
 * BillBook Categories Management Screen
 * Full CRUD for product categories: list, search, add, edit, and delete
 * Styled with BillBook brand colors (#F58220, #0A2540) and CustomAlert
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import categoryService from '../services/categoryService';
import { Header, SkeletonLoader, Icon, SafeAreaView } from '../components';
import { FONT_FAMILY } from '../components/fonts';

export function CategoriesScreen({ navigation, onGoBack }) {
  const { colors } = useTheme();
  const { showConfirm, showSuccess, showError } = useAlert();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State for Add / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryStatus, setCategoryStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg('');

    try {
      const res = await categoryService.getCategories({ search: search.trim() });
      if (res?.status && res?.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.categories || [];
        setCategories(list);
      } else {
        setCategories([]);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error loading categories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = () => {
    fetchCategories(true);
  };

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onGoBack) {
      onGoBack();
    }
  };

  // Open modal for Adding
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryStatus('active');
    setModalVisible(true);
  };

  // Open modal for Editing
  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name || '');
    setCategoryStatus(cat.status === 'inactive' ? 'inactive' : 'active');
    setModalVisible(true);
  };

  // Submit Category
  const handleSaveCategory = async () => {
    const trimmed = categoryName.trim();
    if (!trimmed) {
      showError({
        title: 'Validation Error',
        message: 'Please enter a category name.',
      });
      return;
    }

    setSaving(true);
    try {
      let res;
      if (editingCategory) {
        res = await categoryService.updateCategory({
          id: editingCategory.id,
          name: trimmed,
          status: categoryStatus,
        });
      } else {
        res = await categoryService.addCategory({
          name: trimmed,
          status: categoryStatus,
        });
      }

      if (res?.status) {
        setModalVisible(false);
        showSuccess({
          title: editingCategory ? 'Category Updated' : 'Category Created',
          message: `Category "${trimmed}" has been ${editingCategory ? 'updated' : 'added'} successfully.`,
          onConfirm: () => fetchCategories(false),
        });
      } else {
        showError({
          title: 'Operation Failed',
          message: res?.message || 'Unable to save category. Please try again.',
        });
      }
    } catch (err) {
      showError({
        title: 'Error',
        message: err.message || 'Network error while saving category.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete Category with Confirmation Dialog
  const handleDeleteCategory = (cat) => {
    showConfirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${cat.name}"? Products under this category might become uncategorized.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await categoryService.deleteCategory(cat.id);
          if (res?.status) {
            showSuccess({
              title: 'Deleted',
              message: `Category "${cat.name}" was successfully removed.`,
              onConfirm: () => fetchCategories(false),
            });
          } else {
            showError({
              title: 'Cannot Delete',
              message: res?.message || 'Failed to delete category.',
            });
          }
        } catch (err) {
          showError({
            title: 'Error',
            message: err.message || 'Failed to delete category.',
          });
        }
      },
    });
  };

  const filteredCategories = categories.filter((cat) => {
    if (!search.trim()) return true;
    return String(cat.name).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Header
        title="Product Categories"
        subtitle={`${filteredCategories.length} categories`}
        showBack={true}
        onBackPress={handleBack}
        rightIcon="plus"
        onRightPress={handleOpenAdd}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Search Input Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search" size={17} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search categories..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Categories List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <SkeletonLoader width="100%" height={74} borderRadius={18} style={{ marginBottom: 12 }} />
            <SkeletonLoader width="100%" height={74} borderRadius={18} style={{ marginBottom: 12 }} />
            <SkeletonLoader width="100%" height={74} borderRadius={18} style={{ marginBottom: 12 }} />
          </View>
        ) : filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => {
            const isActive = cat.status !== 'inactive';
            return (
              <View
                key={cat.id}
                style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Tag Icon Badge */}
                <View style={[styles.tagIconHolder, { backgroundColor: colors.primaryLight }]}>
                  <Icon name="tag" size={20} color={colors.primary} />
                </View>

                {/* Details */}
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  <View style={styles.categoryMetaRow}>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isActive ? '#ECFDF5' : '#F1F5F9',
                          borderColor: isActive ? '#A7F3D0' : '#E2E8F0',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: isActive ? '#10B981' : '#94A3B8' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isActive ? '#047857' : '#64748B' },
                        ]}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    {cat.product_count !== undefined && (
                      <Text style={[styles.productCountText, { color: colors.textMuted }]}>
                        {cat.product_count} {cat.product_count === 1 ? 'item' : 'items'}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleOpenEdit(cat)}
                    style={[styles.actionBtn, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}
                  >
                    <Icon name="edit" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDeleteCategory(cat)}
                    style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}
                  >
                    <Icon name="trash" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.primaryLight }]}>
              <Icon name="tag" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Categories Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {search ? 'No categories matched your search.' : 'Create categories to organize your product inventory.'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={handleOpenAdd}
            >
              <Text style={styles.emptyBtnText}>+ Create Category</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── ADD / EDIT CATEGORY MODAL ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Modal Title */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Icon name="tag" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {editingCategory ? 'Update category name and status' : 'Add a new group for your products'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Category Name Input */}
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
                placeholder="e.g. Beverages, Electronics, Groceries"
                placeholderTextColor={colors.textMuted}
                value={categoryName}
                onChangeText={setCategoryName}
                autoFocus
              />
            </View>

            {/* Status Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Status</Text>
              <View style={styles.statusToggleRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCategoryStatus('active')}
                  style={[
                    styles.statusToggleBtn,
                    {
                      backgroundColor: categoryStatus === 'active' ? '#10B981' : colors.cardSecondary,
                      borderColor: categoryStatus === 'active' ? '#10B981' : colors.border,
                    },
                  ]}
                >
                  <Icon
                    name="check"
                    size={14}
                    color={categoryStatus === 'active' ? '#FFFFFF' : colors.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.statusToggleText,
                      { color: categoryStatus === 'active' ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCategoryStatus('inactive')}
                  style={[
                    styles.statusToggleBtn,
                    {
                      backgroundColor: categoryStatus === 'inactive' ? colors.textSecondary : colors.cardSecondary,
                      borderColor: categoryStatus === 'inactive' ? colors.textSecondary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusToggleText,
                      { color: categoryStatus === 'inactive' ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border, backgroundColor: colors.cardSecondary }]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveCategory}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </Text>
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
    paddingBottom: 28,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    marginHorizontal: 8,
  },
  loadingContainer: {
    marginTop: 6,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tagIconHolder: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  categoryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  statusText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  productCountText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusToggleBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusToggleText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
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

export default CategoriesScreen;
