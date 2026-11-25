/**
 * BillBook Parties & Customers Screen
 * Customer ledger, supplier directory, contact lookup, party creation, editing, and direct POS sale linking.
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
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import partyService from '../services/partyService';
import { Header, BottomBar, SkeletonLoader, Icon, Pagination, SafeAreaView } from '../components';
import { FONT_FAMILY } from '../components/fonts';

const TYPE_FILTERS = [
  { id: 'all', label: 'All Parties' },
  { id: 'customer', label: 'Customers' },
  { id: 'supplier', label: 'Suppliers' },
];

const INITIAL_FORM_DATA = {
  name: '',
  phone: '',
  email: '',
  company: '',
  gstin: '',
  address: '',
  city: '',
  state: '',
  type: 'customer',
  opening_balance: '',
  notes: '',
};

export function PartiesScreen({ navigation, onNavigate }) {
  const { colors } = useTheme();
  const { showAlert, showConfirm, showSuccess, showError } = useAlert();

  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [errorMsg, setErrorMsg] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const limit = 10;

  // Add / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingParty, setEditingParty] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Customer Detail Modal State
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedParty, setSelectedParty] = useState(null);

  const handleOpenDetail = (party) => {
    setSelectedParty(party);
    setDetailModalVisible(true);
  };

  const fetchParties = useCallback(
    async (page = 1, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMsg('');

      try {
        const res = await partyService.getParties(
          {
            search: search.trim(),
            type: typeFilter,
            page,
            limit,
          },
          { useCache: !isRefresh }
        );

        if (res?.status && res?.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.parties || [];
          setParties(list);
          const tRows = res.data.total_rows !== undefined ? res.data.total_rows : list.length;
          const tPages =
            res.data.total_pages !== undefined
              ? res.data.total_pages
              : Math.max(1, Math.ceil(tRows / limit));
          setTotalRows(tRows);
          setTotalPages(tPages);
          setCurrentPage(res.data.current_page || page);
        } else {
          setParties([]);
          setTotalRows(0);
          setTotalPages(1);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error loading parties.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, typeFilter]
  );

  useEffect(() => {
    fetchParties(1);
  }, [fetchParties]);

  const onRefresh = () => {
    fetchParties(currentPage, true);
  };

  const handlePageChange = (newPage) => {
    fetchParties(newPage, false);
  };

  const getInitials = (name) => {
    if (!name) return 'P';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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

  // ── Open Add Modal ──
  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingParty(null);
    setFormData(INITIAL_FORM_DATA);
    setModalVisible(true);
  };

  // ── Open Edit Modal ──
  const handleOpenEdit = (party) => {
    setModalMode('edit');
    setEditingParty(party);
    setFormData({
      name: party.name || '',
      phone: party.phone || '',
      email: party.email || '',
      company: party.company || '',
      gstin: party.gstin || party.gst_number || '',
      address: party.address || '',
      city: party.city || '',
      state: party.state || '',
      type: party.type || 'customer',
      opening_balance: party.opening_balance ? String(party.opening_balance) : '',
      notes: party.notes || '',
    });
    setModalVisible(true);
  };

  // ── Submit Add / Edit Party ──
  const handleSubmitParty = async () => {
    if (!formData.name.trim()) {
      showError({
        title: 'Missing Party Name',
        message: 'Please provide a valid name for this customer or party.',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        const res = await partyService.addParty(formData);
        if (res?.status) {
          showSuccess({
            title: 'Party Created 🎉',
            message: `${formData.name} was added to your directory successfully.`,
          });
          setModalVisible(false);
          fetchParties(1);
        } else {
          showError({
            title: 'Failed to Add Party',
            message: res?.message || 'Server could not add party.',
          });
        }
      } else {
        const res = await partyService.updateParty({
          ...formData,
          id: editingParty.id,
        });
        if (res?.status) {
          showSuccess({
            title: 'Party Updated',
            message: `${formData.name} details have been updated.`,
          });
          setModalVisible(false);
          fetchParties(currentPage);
        } else {
          showError({
            title: 'Failed to Update Party',
            message: res?.message || 'Server could not update party details.',
          });
        }
      }
    } catch (err) {
      showError({
        title: 'Error',
        message: err.response?.data?.message || err.message || 'Network error.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Party ──
  const handleDeleteParty = (party) => {
    showConfirm({
      title: 'Delete Party',
      message: `Are you sure you want to permanently delete "${party.name}"? This will remove them from your directory.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await partyService.deleteParty(party.id);
          if (res?.status) {
            showSuccess({
              title: 'Party Deleted',
              message: `${party.name} was removed.`,
            });
            fetchParties(currentPage);
          } else {
            showError({
              title: 'Delete Failed',
              message: res?.message || 'Could not delete party.',
            });
          }
        } catch (err) {
          showError({
            title: 'Error',
            message: err.message || 'Failed to delete party.',
          });
        }
      },
    });
  };

  // ── Redirect to Create Sale with Auto-Fill ──
  const handleCreateSale = (party) => {
    if (!party) return;
    const fullAddress = [party.address, party.city, party.state].filter(Boolean).join(', ');
    const cleanPhone = String(party.phone || party.mobile || '').replace(/\D/g, '').slice(-10);
    const customerPayload = {
      id: party.id,
      party_id: party.id,
      name: party.name || party.company || '',
      phone: cleanPhone,
      address: fullAddress || party.address || '',
      company: party.company || '',
      email: party.email || '',
      gstin: party.gstin || party.gst_number || '',
    };

    if (onNavigate) {
      onNavigate('CreateSale', { customer: customerPayload, party: customerPayload });
    } else if (navigation?.navigate) {
      navigation.navigate('CreateSale', { customer: customerPayload, party: customerPayload });
    }
  };

  // Direct Call Action
  const handleCall = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      showAlert({ title: 'Call Failed', message: `Could not initiate call to ${phone}.`, type: 'warning' });
    });
  };

  // Direct WhatsApp Action
  const handleWhatsApp = (phone) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/91${clean}`).catch(() => {
      showAlert({ title: 'WhatsApp Failed', message: 'Could not open WhatsApp.', type: 'warning' });
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Header
        title="Parties & Ledger"
        subtitle={`${totalRows || parties.length} contacts linked`}
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
        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search" size={17} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name, phone or address..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => fetchParties(1)}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Type Filter Pills */}
        <View style={styles.filterRow}>
          {TYPE_FILTERS.map((item) => {
            const isActive = typeFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setTypeFilter(item.id)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Parties List */}
        {loading ? (
          <View>
            <SkeletonLoader.Row />
            <SkeletonLoader.Row />
            <SkeletonLoader.Row />
            <SkeletonLoader.Row />
          </View>
        ) : parties.length > 0 ? (
          <>
            {parties.map((party, idx) => {
              const isCustomer = String(party.type || 'customer').toLowerCase() === 'customer';
              const balance = parseFloat(party.balance || party.opening_balance || 0);
              const businessVol = parseFloat(party.total_business || party.total_sales || 0);

              return (
                <TouchableOpacity
                  key={party.id || idx}
                  style={[styles.partyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleOpenDetail(party)}
                  activeOpacity={0.9}
                >
                  {/* Row 1: Avatar, Name & Type Badge */}
                  <View style={styles.partyTopRow}>
                    <View
                      style={[
                        styles.partyAvatar,
                        {
                          backgroundColor: isCustomer ? colors.primaryLight : '#ECFDF5',
                          borderColor: isCustomer ? colors.borderFocus : '#A7F3D0',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          { color: isCustomer ? colors.primary : '#059669' },
                        ]}
                      >
                        {getInitials(party.name)}
                      </Text>
                    </View>

                    <View style={styles.partyInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.partyName, { color: colors.text }]} numberOfLines={1}>
                          {party.name}
                        </Text>
                        <View
                          style={[
                            styles.typeChip,
                            {
                              backgroundColor: isCustomer ? colors.primaryLight : '#ECFDF5',
                              borderColor: isCustomer ? colors.primary : '#059669',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeChipText,
                              { color: isCustomer ? colors.primary : '#059669' },
                            ]}
                          >
                            {isCustomer ? 'Customer' : 'Supplier'}
                          </Text>
                        </View>
                      </View>

                      {party.company ? (
                        <Text style={[styles.companyText, { color: colors.textMuted }]} numberOfLines={1}>
                          {party.company}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Row 2: Contact, Address, & Balance */}
                  <View style={[styles.partyDetailsBox, { borderTopColor: colors.border }]}>
                    <View style={styles.detailRow}>
                      <View style={{ flex: 1 }}>
                        {party.phone ? (
                          <View style={styles.contactItem}>
                            <Icon name="phone" size={12} color={colors.textMuted} style={{ marginRight: 5 }} />
                            <Text style={[styles.contactText, { color: colors.text }]}>+91 {party.phone}</Text>
                          </View>
                        ) : null}

                        {party.email ? (
                          <View style={styles.contactItem}>
                            <Icon name="document" size={12} color={colors.textMuted} style={{ marginRight: 5 }} />
                            <Text style={[styles.contactText, { color: colors.textMuted }]} numberOfLines={1}>
                              {party.email}
                            </Text>
                          </View>
                        ) : null}

                        {party.address ? (
                          <View style={styles.contactItem}>
                            <Icon name="tag" size={12} color={colors.textMuted} style={{ marginRight: 5 }} />
                            <Text style={[styles.contactText, { color: colors.textMuted }]} numberOfLines={1}>
                              {[party.address, party.city].filter(Boolean).join(', ')}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {businessVol > 0 || balance !== 0 ? (
                        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                          {businessVol > 0 ? (
                            <>
                              <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Business Vol</Text>
                              <Text style={[styles.businessVolText, { color: '#059669' }]}>
                                {formatCurrency(businessVol)}
                              </Text>
                            </>
                          ) : null}

                          {balance !== 0 ? (
                            <>
                              <Text style={[styles.balanceLabel, { color: colors.textMuted, marginTop: 4 }]}>
                                {balance > 0 ? 'To Collect' : 'To Pay'}
                              </Text>
                              <Text
                                style={[
                                  styles.balanceText,
                                  { color: balance > 0 ? colors.accent : colors.danger },
                                ]}
                              >
                                {formatCurrency(Math.abs(balance))}
                              </Text>
                            </>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Row 3: Action Toolbar - ONLY "Create Sale" stays out on the card */}
                  <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
                    {/* "Create Sale" Direct Redirect Button */}
                    <TouchableOpacity
                      style={[styles.createSaleBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                      onPress={() => handleCreateSale(party)}
                      activeOpacity={0.8}
                    >
                      <Icon name="receipt" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.createSaleBtnText, { color: colors.primary }]}>
                        Create Sale
                      </Text>
                    </TouchableOpacity>

                    {/* View Customer Details Button */}
                    <TouchableOpacity
                      style={[styles.viewDetailsBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => handleOpenDetail(party)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.viewDetailsBtnText, { color: colors.textSecondary }]}>
                        View Details
                      </Text>
                      <Icon name="chevron-right" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRows={totalRows}
              limit={limit}
              onPageChange={handlePageChange}
              itemName="parties"
            />
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="users" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Parties Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {search ? 'Try adjusting your search query' : 'Add customers or suppliers to manage accounts and track sales.'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={handleOpenAdd}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>+ Add New Party</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── MODAL: ADD / EDIT PARTY ── */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={{ width: '100%', maxHeight: '92%' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.modalIconBox, { backgroundColor: colors.primaryLight }]}>
                    <Icon name="users" size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {modalMode === 'add' ? 'Add New Party' : 'Edit Party Details'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                  <Icon name="close" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Form Content */}
              <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
                {/* Party Type Segment */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Party Type *</Text>
                  <View style={[styles.typeSegmentBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        formData.type === 'customer' && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setFormData((prev) => ({ ...prev, type: 'customer' }))}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          { color: formData.type === 'customer' ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        Customer
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        (formData.type === 'supplier' || formData.type === 'vendor') && { backgroundColor: '#059669' },
                      ]}
                      onPress={() => setFormData((prev) => ({ ...prev, type: 'supplier' }))}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          {
                            color:
                              formData.type === 'supplier' || formData.type === 'vendor'
                                ? '#FFFFFF'
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        Supplier / Vendor
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Name */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Party / Contact Name *</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={colors.textMuted}
                    value={formData.name}
                    onChangeText={(val) => setFormData((prev) => ({ ...prev, name: val }))}
                  />
                </View>

                {/* Mobile Phone */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Mobile Phone Number</Text>
                  <View style={[styles.phoneInputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.phonePrefix, { color: colors.textMuted }]}>+91</Text>
                    <TextInput
                      style={[styles.phoneTextInput, { color: colors.text }]}
                      placeholder="10-digit mobile number"
                      placeholderTextColor={colors.textMuted}
                      value={formData.phone}
                      onChangeText={(val) => setFormData((prev) => ({ ...prev, phone: val.replace(/\D/g, '').slice(0, 10) }))}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                </View>

                {/* Company Name */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Company / Business Name</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g. Sharma Enterprise"
                    placeholderTextColor={colors.textMuted}
                    value={formData.company}
                    onChangeText={(val) => setFormData((prev) => ({ ...prev, company: val }))}
                  />
                </View>

                {/* Email */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Email Address</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g. contact@domain.com"
                    placeholderTextColor={colors.textMuted}
                    value={formData.email}
                    onChangeText={(val) => setFormData((prev) => ({ ...prev, email: val }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* GSTIN */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>GSTIN / Tax ID</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="e.g. 24AAAAA0000A1Z5"
                    placeholderTextColor={colors.textMuted}
                    value={formData.gstin}
                    onChangeText={(val) => setFormData((prev) => ({ ...prev, gstin: val.toUpperCase() }))}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Address */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Billing / Street Address</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Shop #, Building, Area"
                    placeholderTextColor={colors.textMuted}
                    value={formData.address}
                    onChangeText={(val) => setFormData((prev) => ({ ...prev, address: val }))}
                    multiline={true}
                    numberOfLines={2}
                  />
                </View>

                {/* City & State (2 columns) */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>City</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="e.g. Ahmedabad"
                      placeholderTextColor={colors.textMuted}
                      value={formData.city}
                      onChangeText={(val) => setFormData((prev) => ({ ...prev, city: val }))}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>State</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="e.g. Gujarat"
                      placeholderTextColor={colors.textMuted}
                      value={formData.state}
                      onChangeText={(val) => setFormData((prev) => ({ ...prev, state: val }))}
                    />
                  </View>
                </View>

                {/* Opening Balance */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Opening Balance (₹)</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    value={formData.opening_balance}
                    onChangeText={(val) => setFormData((prev) => ({ ...prev, opening_balance: val }))}
                    keyboardType="numeric"
                  />
                </View>

                {/* Submit Action */}
                <TouchableOpacity
                  style={[styles.submitPartyBtn, { backgroundColor: colors.primary }, submitting && { opacity: 0.75 }]}
                  onPress={handleSubmitParty}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="check" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.submitPartyBtnText}>
                        {modalMode === 'add' ? 'Save & Add Party' : 'Update Party Details'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── MODAL: CUSTOMER DETAIL (FULL INFORMATION & WRITTEN BUTTONS) ── */}
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '90%' }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.modalIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Icon name="user" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Customer Details
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedParty ? (
              <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
                {/* Profile Header Box */}
                <View style={styles.detailProfileBox}>
                  <View
                    style={[
                      styles.detailAvatar,
                      {
                        backgroundColor:
                          String(selectedParty.type || 'customer').toLowerCase() === 'customer'
                            ? colors.primaryLight
                            : '#ECFDF5',
                        borderColor:
                          String(selectedParty.type || 'customer').toLowerCase() === 'customer'
                            ? colors.primary
                            : '#059669',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailAvatarText,
                        {
                          color:
                            String(selectedParty.type || 'customer').toLowerCase() === 'customer'
                              ? colors.primary
                              : '#059669',
                        },
                      ]}
                    >
                      {getInitials(selectedParty.name)}
                    </Text>
                  </View>
                  <Text style={[styles.detailName, { color: colors.text }]}>{selectedParty.name}</Text>
                  {selectedParty.company ? (
                    <Text style={[styles.detailCompany, { color: colors.textMuted }]}>
                      {selectedParty.company}
                    </Text>
                  ) : null}
                  <View
                    style={[
                      styles.typeChip,
                      {
                        marginTop: 6,
                        backgroundColor:
                          String(selectedParty.type || 'customer').toLowerCase() === 'customer'
                            ? colors.primaryLight
                            : '#ECFDF5',
                        borderColor:
                          String(selectedParty.type || 'customer').toLowerCase() === 'customer'
                            ? colors.primary
                            : '#059669',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        {
                          color:
                            String(selectedParty.type || 'customer').toLowerCase() === 'customer'
                              ? colors.primary
                              : '#059669',
                        },
                      ]}
                    >
                      {String(selectedParty.type || 'customer').toLowerCase() === 'customer'
                        ? 'Customer'
                        : 'Supplier / Vendor'}
                    </Text>
                  </View>
                </View>

                {/* Info Card Section */}
                <View style={[styles.detailInfoSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {selectedParty.phone ? (
                    <View style={styles.detailInfoRow}>
                      <Icon name="phone" size={15} color={colors.primary} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.detailInfoLabel, { color: colors.textMuted }]}>PHONE NUMBER</Text>
                        <Text style={[styles.detailInfoValue, { color: colors.text }]}>+91 {selectedParty.phone}</Text>
                      </View>
                    </View>
                  ) : null}

                  {selectedParty.email ? (
                    <View style={[styles.detailInfoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                      <Icon name="email" size={15} color={colors.textSecondary} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.detailInfoLabel, { color: colors.textMuted }]}>EMAIL ADDRESS</Text>
                        <Text style={[styles.detailInfoValue, { color: colors.text }]}>{selectedParty.email}</Text>
                      </View>
                    </View>
                  ) : null}

                  {selectedParty.gstin || selectedParty.gst_number ? (
                    <View style={[styles.detailInfoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                      <Icon name="tag" size={15} color={colors.textSecondary} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.detailInfoLabel, { color: colors.textMuted }]}>GSTIN / TAX ID</Text>
                        <Text style={[styles.detailInfoValue, { color: colors.text }]}>
                          {selectedParty.gstin || selectedParty.gst_number}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {selectedParty.address || selectedParty.city || selectedParty.state ? (
                    <View style={[styles.detailInfoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                      <Icon name="document" size={15} color={colors.textSecondary} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.detailInfoLabel, { color: colors.textMuted }]}>BILLING ADDRESS</Text>
                        <Text style={[styles.detailInfoValue, { color: colors.text }]}>
                          {[selectedParty.address, selectedParty.city, selectedParty.state].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {/* Financial Metrics */}
                  <View style={[styles.detailInfoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <Icon name="currency" size={15} color="#059669" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={[styles.detailInfoLabel, { color: colors.textMuted }]}>BUSINESS VOLUME</Text>
                        <Text style={[styles.detailInfoValue, { color: '#059669', fontWeight: '800' }]}>
                          {formatCurrency(selectedParty.total_business || selectedParty.total_sales || 0)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.detailInfoLabel, { color: colors.textMuted }]}>CURRENT BALANCE</Text>
                        <Text
                          style={[
                            styles.detailInfoValue,
                            {
                              color:
                                parseFloat(selectedParty.balance || selectedParty.opening_balance || 0) >= 0
                                  ? colors.accent
                                  : colors.danger,
                              fontWeight: '800',
                            },
                          ]}
                        >
                          {formatCurrency(Math.abs(parseFloat(selectedParty.balance || selectedParty.opening_balance || 0)))}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ── WRITTEN ACTION BUTTONS SECTION ── */}
                <Text style={[styles.actionSectionTitle, { color: colors.textMuted }]}>
                  CUSTOMER ACTIONS
                </Text>

                {/* 1. Call Button with Written Text */}
                {selectedParty.phone ? (
                  <TouchableOpacity
                    style={[styles.writtenActionBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                    onPress={() => handleCall(selectedParty.phone)}
                    activeOpacity={0.75}
                  >
                    <Icon name="phone" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                    <Text style={[styles.writtenActionBtnText, { color: '#2563EB' }]}>
                      Call Customer (+91 {selectedParty.phone})
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* 2. WhatsApp Button with Written Text */}
                {selectedParty.phone ? (
                  <TouchableOpacity
                    style={[styles.writtenActionBtn, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}
                    onPress={() => handleWhatsApp(selectedParty.phone)}
                    activeOpacity={0.75}
                  >
                    <Icon name="whatsapp" size={16} color="#16A34A" style={{ marginRight: 8 }} />
                    <Text style={[styles.writtenActionBtnText, { color: '#16A34A' }]}>
                      Chat on WhatsApp
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* 3. Create Sale Button with Written Text */}
                <TouchableOpacity
                  style={[styles.writtenActionBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => {
                    setDetailModalVisible(false);
                    handleCreateSale(selectedParty);
                  }}
                  activeOpacity={0.75}
                >
                  <Icon name="receipt" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.writtenActionBtnText, { color: colors.primary }]}>
                    Create Sale / New Invoice
                  </Text>
                </TouchableOpacity>

                {/* 4. Edit Party Details with Written Text */}
                <TouchableOpacity
                  style={[styles.writtenActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => {
                    setDetailModalVisible(false);
                    handleOpenEdit(selectedParty);
                  }}
                  activeOpacity={0.75}
                >
                  <Icon name="edit" size={16} color={colors.text} style={{ marginRight: 8 }} />
                  <Text style={[styles.writtenActionBtnText, { color: colors.text }]}>
                    Edit Customer Details
                  </Text>
                </TouchableOpacity>

                {/* 5. Delete Party with Written Text */}
                <TouchableOpacity
                  style={[styles.writtenActionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                  onPress={() => {
                    setDetailModalVisible(false);
                    handleDeleteParty(selectedParty);
                  }}
                  activeOpacity={0.75}
                >
                  <Icon name="delete" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                  <Text style={[styles.writtenActionBtnText, { color: '#DC2626' }]}>
                    Delete Party
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Shared Bottom Bar */}
      <BottomBar
        currentTab="Parties"
        onTabChange={(tabName) => {
          if (onNavigate) onNavigate(tabName);
        }}
      />
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
    paddingBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    marginHorizontal: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  // Party Card
  partyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  partyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  companyText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeChipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
  },
  partyDetailsBox: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  balanceLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  businessVolText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
  },
  balanceText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  // Action Row
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  createSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  createSaleBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  viewDetailsBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  // Customer Detail Modal Styles
  detailScroll: {
    paddingVertical: 14,
    paddingBottom: 28,
  },
  detailProfileBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  detailAvatarText: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
  },
  detailName: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  detailCompany: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  detailInfoSection: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 16,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  detailInfoLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  detailInfoValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
  },
  actionSectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  writtenActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  writtenActionBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  // Empty State
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalIconBox: {
    width: 32,
    height: 32,
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
  formScroll: {
    paddingVertical: 14,
    paddingBottom: 28,
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  typeSegmentBox: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  formTextArea: {
    height: 60,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  phoneInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
  },
  phonePrefix: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  phoneTextInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    height: '100%',
  },
  submitPartyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    marginTop: 8,
  },
  submitPartyBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PartiesScreen;
