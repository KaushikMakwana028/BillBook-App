/**
 * BillBook Invoices & Sales Screen
 * List of sales transactions, search, status filters, invoice details, and quick invoice creation
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
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import salesService from '../services/salesService';
import { Header, BottomBar, SkeletonLoader, Icon, Pagination, SafeAreaView } from '../components';
import { FONT_FAMILY } from '../components/fonts';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
];

export function SalesScreen({ navigation, route, params: propParams, onNavigate }) {
  const { colors } = useTheme();
  const { showAlert } = useAlert();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [errorMsg, setErrorMsg] = useState('');

  // Refresh trigger when navigated back with refresh param
  const refreshTrigger = propParams?.refresh || route?.params?.refresh;

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const limit = 10;

  const fetchSales = useCallback(
    async (page = 1, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMsg('');

      try {
        const res = await salesService.getSales(
          {
            search: search.trim(),
            page,
            limit,
          },
          { useCache: !isRefresh }
        );

        if (res?.status && res?.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.sales || [];
          setSales(list);
          const tRows = res.data.total_rows !== undefined ? res.data.total_rows : list.length;
          const tPages =
            res.data.total_pages !== undefined
              ? res.data.total_pages
              : Math.max(1, Math.ceil(tRows / limit));
          setTotalRows(tRows);
          setTotalPages(tPages);
          setCurrentPage(res.data.current_page || page);
        } else {
          setSales([]);
          setTotalRows(0);
          setTotalPages(1);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error loading invoices.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search]
  );

  useEffect(() => {
    fetchSales(1);
  }, [fetchSales, refreshTrigger]);

  const onRefresh = () => {
    fetchSales(currentPage, true);
  };

  const handlePageChange = (newPage) => {
    fetchSales(newPage, false);
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

  const filteredSales = sales.filter((item) => {
    if (statusFilter === 'all') return true;
    const itemStatus = String(item.status || item.payment_status || 'paid').toLowerCase();
    return itemStatus === statusFilter;
  });

  const totalAmount = filteredSales.reduce(
    (acc, curr) => acc + (parseFloat(curr.total_amount || curr.grand_total) || 0),
    0
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Header
        title="Invoices & Sales"
        subtitle={`${totalRows || filteredSales.length} invoices recorded`}
        rightIcon="plus"
        onRightPress={() => {
          if (onNavigate) {
            onNavigate('CreateSale');
          }
        }}
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
            placeholder="Search by invoice # or customer..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => fetchSales()}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Pills */}
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setStatusFilter(f.id)}
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
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Invoices Summary Banner & Quick Create Button */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>TOTAL INVOICED</Text>
            <Text style={[styles.summaryAmount, { color: colors.primary }]}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.createInvoiceBtn, { backgroundColor: colors.primary }]}
            onPress={() => onNavigate && onNavigate('CreateSale')}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.createInvoiceBtnText}>+ New Bill</Text>
          </TouchableOpacity>
        </View>

        {/* Invoices List */}
        {loading ? (
          <View>
            <SkeletonLoader.Row />
            <SkeletonLoader.Row />
            <SkeletonLoader.Row />
            <SkeletonLoader.Row />
          </View>
        ) : filteredSales.length > 0 ? (
          <>
            {filteredSales.map((sale, idx) => (
              <TouchableOpacity
                key={sale.id || idx}
                style={[
                  styles.invoiceCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                activeOpacity={0.75}
                onPress={() => {
                  if (onNavigate) {
                    onNavigate('SaleDetail', { sale, saleId: sale.id });
                  }
                }}
              >
                <View style={[styles.invoiceIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Icon name="receipt" size={18} color={colors.primary} />
                </View>

                <View style={styles.invoiceInfo}>
                  <Text style={[styles.invoiceCustomer, { color: colors.text }]} numberOfLines={1}>
                    {sale.customer_name || sale.party_name || 'Walk-in Customer'}
                  </Text>
                  <Text style={[styles.invoiceMeta, { color: colors.textMuted }]}>
                    #{sale.invoice_number || sale.id} • {sale.sale_date || sale.date || 'Today'}
                  </Text>
                </View>

                <View style={styles.invoiceRight}>
                  <Text style={[styles.invoiceAmount, { color: colors.text }]}>
                    {formatCurrency(sale.total_amount || sale.grand_total || 0)}
                  </Text>
                  <View
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor:
                          String(sale.status || sale.payment_status || 'paid').toLowerCase() === 'paid'
                            ? colors.accentLight
                            : colors.dangerLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color:
                            String(sale.status || sale.payment_status || 'paid').toLowerCase() === 'paid'
                              ? colors.accent
                              : colors.danger,
                        },
                      ]}
                    >
                      {String(sale.status || sale.payment_status || 'PAID').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRows={totalRows}
              limit={limit}
              onPageChange={handlePageChange}
              itemName="invoices"
            />
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="receipt" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Invoices Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {search ? 'Try adjusting your search query' : 'Create your first invoice to get started'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => onNavigate && onNavigate('CreateSale')}
            >
              <Text style={styles.emptyBtnText}>+ Create Invoice</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Shared Bottom Bar */}
      <BottomBar
        currentTab="Sales"
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  badgeCount: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeCountText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
  createInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  createInvoiceBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  invoiceIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceCustomer: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  invoiceMeta: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 2,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
  statusChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  statusChipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '700',
  },
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
});

export default SalesScreen;
