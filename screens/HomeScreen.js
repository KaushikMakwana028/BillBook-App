/**
 * BillBook Ultra-Modern Home / Dashboard Screen
 * Live analytics, KPI stat cards, date filters, recent sales & low stock alerts
 * Dynamic Light & Pure AMOLED Black Theme support
 * Crisp Vector Icons (No emojis)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import homeService from '../services/homeService';
import { Header, StatCard, Card, Badge, Loading, Icon } from '../components';
import { FONT_FAMILY } from '../components/fonts';

const FILTER_PRESETS = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
];

export const HomeScreen = ({ onNavigate }) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [filter, setFilter] = useState('day');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch dashboard metrics
  const fetchDashboard = useCallback(async (activeFilter, isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg('');

    try {
      const res = await homeService.getDashboardData({ filter: activeFilter });
      if (res?.status && res?.data) {
        setData(res.data);
      } else {
        setErrorMsg(res?.message || 'Failed to load dashboard data.');
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Error fetching dashboard metrics.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(filter);
  }, [filter, fetchDashboard]);

  const onRefresh = () => {
    fetchDashboard(filter, true);
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return '₹ ' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleQuickAction = (action) => {
    if (onNavigate) {
      onNavigate(action);
    } else {
      Alert.alert(action, `Navigate to ${action} module`);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <Header />

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
        {/* Filter Presets Pill Bar */}
        <View
          style={[
            styles.filterBar,
            {
              backgroundColor: isDark ? colors.cardSecondary : '#E2E8F0',
            },
          ]}
        >
          {FILTER_PRESETS.map((item) => {
            const isActive = filter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => setFilter(item.id)}
                style={[
                  styles.filterPill,
                  isActive && [
                    styles.activeFilterPill,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      shadowColor: colors.shadow,
                    },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isActive ? colors.primary : colors.textMuted,
                      fontWeight: isActive ? '800' : '600',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Error Notice */}
        {!!errorMsg && (
          <View
            style={[
              styles.errorNotice,
              {
                backgroundColor: isDark
                  ? 'rgba(239, 68, 68, 0.15)'
                  : '#FEF2F2',
                borderColor: colors.danger,
              },
            ]}
          >
            <Text style={[styles.errorNoticeText, { color: colors.danger }]}>
              {errorMsg}
            </Text>
            <TouchableOpacity
              onPress={() => fetchDashboard(filter)}
              style={[styles.retryBtn, { backgroundColor: colors.danger }]}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !refreshing ? (
          <Loading message="Syncing metrics..." />
        ) : (
          <View>
            {/* KPI Stat Cards Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Sales"
                value={formatCurrency(data?.filtered_total_sales ?? data?.today_total_sales ?? 0)}
                subtitle={filter === 'day' ? "Today's Total" : `Sales in ${filter}`}
                icon={<Icon name="currency" size={15} color={colors.primary} />}
                accentColor={colors.primary}
              />
              <StatCard
                title="Net Profit"
                value={formatCurrency(data?.filtered_total_profit ?? data?.today_total_profit ?? 0)}
                subtitle="Calculated Margins"
                icon={<Icon name="trending-up" size={15} color={colors.accent} />}
                accentColor={colors.accent}
              />
              <StatCard
                title="Purchases"
                value={formatCurrency(data?.filtered_total_purchase ?? 0)}
                subtitle="Catalog Cost"
                icon={<Icon name="package" size={15} color={colors.warning} />}
                accentColor={colors.warning}
              />
              <StatCard
                title="Products"
                value={String(data?.product_count ?? 0)}
                subtitle="Catalog Items"
                icon={<Icon name="document" size={15} color="#06B6D4" />}
                accentColor="#06B6D4"
              />
              <StatCard
                title="Customers"
                value={String(data?.customer_count ?? 0)}
                subtitle="Parties Linked"
                icon={<Icon name="user" size={15} color="#8B5CF6" />}
                accentColor="#8B5CF6"
              />
              <StatCard
                title="Low Stock"
                value={String(data?.low_stock_count ?? 0)}
                subtitle="Items Qty ≤ 5"
                icon={<Icon name="alert" size={15} color={Number(data?.low_stock_count) > 0 ? colors.danger : colors.accent} />}
                accentColor={Number(data?.low_stock_count) > 0 ? colors.danger : colors.accent}
              />
            </View>

            {/* Quick Actions */}
            <Card title="Quick Actions" style={styles.sectionCard}>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleQuickAction('Sales')}
                  style={[
                    styles.quickActionBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(99, 102, 241, 0.15)'
                        : '#EEF2FF',
                    },
                  ]}
                >
                  <Icon name="bill" size={20} color={isDark ? '#A5B4FC' : '#4338CA'} />
                  <Text
                    style={[
                      styles.quickActionLabel,
                      { color: isDark ? '#A5B4FC' : '#4338CA' },
                    ]}
                  >
                    New Sale
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleQuickAction('Products')}
                  style={[
                    styles.quickActionBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.15)'
                        : '#ECFDF5',
                    },
                  ]}
                >
                  <Icon name="plus" size={20} color={isDark ? '#6EE7B7' : '#065F46'} />
                  <Text
                    style={[
                      styles.quickActionLabel,
                      { color: isDark ? '#6EE7B7' : '#065F46' },
                    ]}
                  >
                    Add Item
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleQuickAction('Parties')}
                  style={[
                    styles.quickActionBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(245, 158, 11, 0.15)'
                        : '#FEF3C7',
                    },
                  ]}
                >
                  <Icon name="user" size={20} color={isDark ? '#FCD34D' : '#92400E'} />
                  <Text
                    style={[
                      styles.quickActionLabel,
                      { color: isDark ? '#FCD34D' : '#92400E' },
                    ]}
                  >
                    Add Party
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleQuickAction('WhatsApp')}
                  style={[
                    styles.quickActionBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(34, 197, 94, 0.15)'
                        : '#F0FDF4',
                    },
                  ]}
                >
                  <Icon name="chat" size={20} color={isDark ? '#86EFAC' : '#166534'} />
                  <Text
                    style={[
                      styles.quickActionLabel,
                      { color: isDark ? '#86EFAC' : '#166534' },
                    ]}
                  >
                    WhatsApp
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Low Stock Warning Section */}
            {Array.isArray(data?.low_stock_products) && data.low_stock_products.length > 0 && (
              <Card
                title="Low Stock Alerts"
                subtitle="Items needing replenishment"
                rightComponent={
                  <Badge
                    label={`${data.low_stock_products.length} Critical`}
                    variant="danger"
                    size="sm"
                  />
                }
                style={styles.sectionCard}
              >
                {data.low_stock_products.slice(0, 5).map((item, idx) => (
                  <View
                    key={item.id || idx}
                    style={[
                      styles.lowStockRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={styles.lowStockInfo}>
                      <Text
                        style={[styles.lowStockName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.lowStockPrice,
                          { color: colors.textMuted },
                        ]}
                      >
                        Price: {formatCurrency(item.price)}
                      </Text>
                    </View>
                    <Badge
                      label={`${item.quantity} left`}
                      variant={Number(item.quantity) <= 2 ? 'danger' : 'warning'}
                      size="sm"
                    />
                  </View>
                ))}
              </Card>
            )}

            {/* Recent Sales Invoices */}
            <Card
              title="Recent Sales"
              subtitle="Latest billing transactions"
              style={styles.sectionCard}
            >
              {Array.isArray(data?.recent_sales) && data.recent_sales.length > 0 ? (
                data.recent_sales.map((sale, idx) => (
                  <View
                    key={sale.invoice_number || idx}
                    style={[
                      styles.saleRow,
                      { borderBottomColor: colors.border },
                      idx === data.recent_sales.length - 1 && styles.lastSaleRow,
                    ]}
                  >
                    <View style={styles.saleLeft}>
                      <Text
                        style={[styles.invoiceNo, { color: colors.text }]}
                      >
                        #{sale.invoice_number || `INV-${idx + 1}`}
                      </Text>
                      <Text
                        style={[
                          styles.customerName,
                          { color: colors.textMuted },
                        ]}
                      >
                        {sale.customer_name || 'Walk-in Customer'}
                      </Text>
                    </View>
                    <View style={styles.saleRight}>
                      <Text
                        style={[styles.saleAmount, { color: colors.accent }]}
                      >
                        {formatCurrency(sale.grand_total)}
                      </Text>
                      <Text
                        style={[
                          styles.saleDate,
                          { color: colors.textMuted },
                        ]}
                      >
                        {sale.sale_date ? String(sale.sale_date).slice(0, 10) : ''}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No recent sales recorded yet.
                  </Text>
                </View>
              )}
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  filterBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeFilterPill: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  filterPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  errorNotice: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  errorNoticeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  retryBtnText: {
    fontFamily: FONT_FAMILY,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionCard: {
    marginTop: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickActionLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  lowStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  lowStockInfo: {
    flex: 1,
    marginRight: 12,
  },
  lowStockName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  lowStockPrice: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lastSaleRow: {
    borderBottomWidth: 0,
  },
  saleLeft: {
    flex: 1,
    marginRight: 10,
  },
  invoiceNo: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
  },
  customerName: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  saleRight: {
    alignItems: 'flex-end',
  },
  saleAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
  },
  saleDate: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default HomeScreen;
