/**
 * BillBook Modern Home / Dashboard Screen
 * High-polish fintech UI with BillBook brand colors & native API
 * - Horizontal scrollable filter pill bar (NO awkward line wrapping)
 * - Premium Turnover Card with Live Sync
 * - Sleek Sales & Profit Trends Chart with background tracks and guide lines
 * - Dedicated Custom Date Range Modal
 * - Full bottomNav redirection support
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import homeService from '../services/homeService';
import { BottomBar, SkeletonLoader, Icon } from '../components';
import { FONT_FAMILY } from '../components/fonts';
import { resolveProfileImageUrl } from '../utils/imageUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FILTER_PRESETS = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' },
];

const QUICK_ACTIONS = [
  {
    id: 'CreateSale',
    label: 'New Invoice',
    icon: 'receipt',
    color: '#F58220',
    bg: '#FFF4ED',
  },
  {
    id: 'AddProduct',
    label: 'Add Item',
    icon: 'box',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    id: 'Parties',
    label: 'Add Party',
    icon: 'users',
    color: '#0A2540',
    bg: '#EFF4F9',
  },
  {
    id: 'Products',
    label: 'Inventory',
    icon: 'briefcase',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
];

export function HomeScreen({ navigation, onNavigate }) {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const { showAlert, showConfirm } = useAlert();

  const [filter, setFilter] = useState('day');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Custom Date Modal State
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedCustomRange, setAppliedCustomRange] = useState(null);

  // Chart View State: 'weeks' | 'months'
  const [chartView, setChartView] = useState('weeks');
  const [selectedChartIndex, setSelectedChartIndex] = useState(null);
  const [profileImgError, setProfileImgError] = useState(false);

  const businessName = user?.business_name || user?.name || 'My Business';
  const ownerName = user?.name || 'Partner';

  const rawProfileImg =
    user?.profile_image ||
    user?.image ||
    data?.user?.profile_image ||
    data?.user?.image;
  const resolvedProfileImg = resolveProfileImageUrl(rawProfileImg);

  const getTodayFormatted = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getDaysAgoFormatted = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  // Fetch dashboard data
  const fetchDashboard = useCallback(
    async (activeFilter, isPullToRefresh = false, customFrom = '', customTo = '') => {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else if (!data) {
        setLoading(true);
      } else {
        setFilterLoading(true);
      }
      setErrorMsg('');

      try {
        const params = {};
        if (activeFilter === 'custom' || customFrom || customTo) {
          params.filter = 'custom';
          if (customFrom) params.from_date = customFrom;
          if (customTo) params.to_date = customTo;
        } else {
          params.filter = activeFilter;
        }

        const res = await homeService.getDashboardData(params, isPullToRefresh);
        if (res?.status && res?.data) {
          setData(res.data);
          if (params.filter === 'custom' && (customFrom || customTo)) {
            setAppliedCustomRange({ from: customFrom, to: customTo });
          } else {
            setAppliedCustomRange(null);
          }
        } else {
          setErrorMsg(res?.message || 'Failed to load dashboard metrics.');
        }
      } catch (err) {
        setErrorMsg(
          err.response?.data?.message || err.message || 'Error fetching dashboard metrics.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setFilterLoading(false);
      }
    },
    [data]
  );

  useEffect(() => {
    fetchDashboard(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    if (filter === 'custom' && appliedCustomRange) {
      fetchDashboard('custom', true, appliedCustomRange.from, appliedCustomRange.to);
    } else {
      fetchDashboard(filter, true);
    }
  };

  const handleSelectFilter = (presetId) => {
    if (presetId === 'custom') {
      setCustomModalVisible(true);
      return;
    }
    setFilter(presetId);
    setAppliedCustomRange(null);
    fetchDashboard(presetId);
  };

  const handleApplyCustomModal = () => {
    if (!fromDate && !toDate) {
      showAlert({
        title: 'Select Date Range',
        message: 'Please select or enter From or To date (YYYY-MM-DD).',
        type: 'warning',
      });
      return;
    }
    setCustomModalVisible(false);
    setFilter('custom');
    fetchDashboard('custom', false, fromDate, toDate);
  };

  const handleQuickPresetRange = (type) => {
    const today = getTodayFormatted();
    if (type === '7d') {
      setFromDate(getDaysAgoFormatted(7));
      setToDate(today);
    } else if (type === '30d') {
      setFromDate(getDaysAgoFormatted(30));
      setToDate(today);
    } else if (type === 'month') {
      const d = new Date();
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(today);
    }
  };

  const handleClearCustomRange = () => {
    setFromDate('');
    setToDate('');
    setAppliedCustomRange(null);
    setFilter('day');
    fetchDashboard('day');
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

  const handleLogout = () => {
    showConfirm({
      title: 'Sign Out',
      message: 'Are you sure you want to log out of your business account?',
      type: 'danger',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      onConfirm: logout,
    });
  };

  const handleTabSwitch = (target) => {
    if (onNavigate) {
      onNavigate(target);
    }
  };

  const getInitials = (str) => {
    if (!str) return 'BB';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  // ─────────────────────────────────────────
  // Process Chart Data
  // ─────────────────────────────────────────
  const chart = data?.chart_data || {};
  const rawLabels = chart.labels || [];
  const rawSales = chart.sales_values || [];
  const rawProfit = chart.profit_values || [];

  const processedChart = useMemo(() => {
    if (!rawLabels || rawLabels.length === 0) {
      return { labels: [], sales: [], profit: [] };
    }

    if (chartView === 'months') {
      const monthMap = {};
      rawLabels.forEach((lbl, i) => {
        const parts = String(lbl).trim().split(' ');
        const monthKey = parts.length > 1 ? parts[1] : lbl;
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { sales: 0, profit: 0 };
        }
        monthMap[monthKey].sales += Number(rawSales[i]) || 0;
        monthMap[monthKey].profit += Number(rawProfit[i]) || 0;
      });

      const mLabels = Object.keys(monthMap);
      return {
        labels: mLabels,
        sales: mLabels.map((m) => monthMap[m].sales),
        profit: mLabels.map((m) => monthMap[m].profit),
      };
    }

    return {
      labels: rawLabels,
      sales: rawSales.map((v) => Number(v) || 0),
      profit: rawProfit.map((v) => Number(v) || 0),
    };
  }, [rawLabels, rawSales, rawProfit, chartView]);

  const maxChartValue = useMemo(() => {
    const all = [...processedChart.sales, ...processedChart.profit];
    const max = Math.max(...all, 100);
    return max * 1.2; // 20% headroom for clean breathing space
  }, [processedChart]);

  const totalSalesView = useMemo(() => {
    return (
      processedChart.sales.reduce((acc, v) => acc + v, 0) ||
      Number(chart.total_sales) ||
      Number(data?.filtered_total_sales) ||
      0
    );
  }, [processedChart, chart.total_sales, data?.filtered_total_sales]);

  const totalProfitView = useMemo(() => {
    return (
      processedChart.profit.reduce((acc, v) => acc + v, 0) ||
      Number(chart.total_profit) ||
      Number(data?.filtered_total_profit) ||
      0
    );
  }, [processedChart, chart.total_profit, data?.filtered_total_profit]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* ── TOP HEADER ── */}
      <View style={[styles.headerBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate && onNavigate('Profile')}
            style={[styles.logoBadgeContainer, { backgroundColor: colors.primaryLight, borderColor: colors.borderFocus }]}
          >
            <Image
              source={require('../assets/logo-b.png')}
              style={styles.logoBadgeImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerBusinessName, { color: colors.text }]} numberOfLines={1}>
              {businessName}
            </Text>
            <Text style={[styles.headerGreeting, { color: colors.textMuted }]} numberOfLines={1}>
              Hi, {ownerName} 👋
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.headerAvatarBtn,
              {
                borderColor: colors.primary,
                backgroundColor: colors.primaryLight,
              },
            ]}
            onPress={() => onNavigate && onNavigate('EditProfile')}
            activeOpacity={0.8}
          >
            {resolvedProfileImg && !profileImgError ? (
              <Image
                source={{ uri: resolvedProfileImg }}
                style={styles.headerAvatarImg}
                resizeMode="cover"
                onError={() => setProfileImgError(true)}
              />
            ) : (
              <View style={[styles.headerAvatarFallback, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.headerAvatarInitials, { color: colors.primary }]}>
                  {getInitials(ownerName || businessName)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── MAIN SCROLLABLE DASHBOARD ── */}
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
        {/* ── HORIZONTAL SCROLLABLE FILTER PILL BAR (Clean single-line pills) ── */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTER_PRESETS.map((item) => {
              const isActive = filter === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => handleSelectFilter(item.id)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isActive ? colors.primary : colors.card,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                    isActive && styles.activeFilterShadow,
                  ]}
                >
                  {item.id === 'custom' ? (
                    <View style={styles.filterPillContent}>
                      <Icon
                        name="calendar"
                        size={12}
                        color={isActive ? '#FFFFFF' : colors.textSecondary}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.filterPillText,
                          {
                            color: isActive ? '#FFFFFF' : colors.textSecondary,
                            fontWeight: isActive ? '700' : '600',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.filterPillText,
                        {
                          color: isActive ? '#FFFFFF' : colors.textSecondary,
                          fontWeight: isActive ? '700' : '600',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Custom Date Filter Tag */}
          {appliedCustomRange && (
            <View style={styles.appliedFilterRow}>
              <View style={[styles.appliedFilterTag, { backgroundColor: colors.primaryLight }]}>
                <Icon name="calendar" size={12} color={colors.primary} />
                <Text style={[styles.appliedFilterText, { color: colors.primary }]}>
                  {appliedCustomRange.from || 'Start'} to {appliedCustomRange.to || 'Today'}
                </Text>
                <TouchableOpacity onPress={handleClearCustomRange} style={styles.appliedFilterClose}>
                  <Icon name="close" size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── TURNOVER BANNER CARD ── */}
        <View style={[styles.bannerCard, { backgroundColor: colors.card, borderColor: '#FED7AA' }]}>
          <View style={styles.bannerTopRow}>
            <View style={styles.bannerTagRow}>
              <View style={[styles.bannerPillTag, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.bannerPillTagText, { color: colors.primary }]}>
                  {appliedCustomRange
                    ? 'CUSTOM TURNOVER'
                    : filter === 'day'
                    ? "TODAY'S SALES"
                    : `${filter.toUpperCase()} TURNOVER`}
                </Text>
              </View>
              {filterLoading && (
                <Text style={[styles.syncingText, { color: colors.primary }]}>● Syncing</Text>
              )}
            </View>

            <View style={[styles.liveSyncBadge, { backgroundColor: colors.accentLight }]}>
              <View style={[styles.liveSyncDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.liveSyncText, { color: colors.accent }]}>Live Sync</Text>
            </View>
          </View>

          {/* Main Amount */}
          <Text style={[styles.bannerAmount, { color: colors.text }]}>
            {loading && !data
              ? '₹ ••••••'
              : formatCurrency(data?.filtered_total_sales ?? data?.today_total_sales ?? 0)}
          </Text>

          <Text style={[styles.bannerSubtext, { color: colors.textMuted }]}>
            {data?.filter_label
              ? `Calculated metrics for: ${data.filter_label}`
              : 'Real-time revenue synchronized with billing register'}
          </Text>
        </View>

        {/* ── QUICK ACTIONS (Redirects to other pages) ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        </View>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleTabSwitch(action.id)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIconBox, { backgroundColor: action.bg }]}>
                <Icon name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.text }]} numberOfLines={1}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error Notice */}
        {errorMsg ? (
          <View style={[styles.errorNotice, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
            <Icon name="alert" size={16} color={colors.danger} />
            <Text style={[styles.errorNoticeText, { color: colors.danger }]}>{errorMsg}</Text>
            <TouchableOpacity onPress={() => fetchDashboard(filter)} style={[styles.retryBtn, { backgroundColor: colors.danger }]}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ── SALES & PROFIT ANALYTICS CHART ── */}
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Chart Header */}
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Sales & Profit Trends</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>
                {data?.filter_label || 'Performance breakdown'}
              </Text>
            </View>

            {/* Segmented Switcher */}
            <View style={[styles.chartToggle, { backgroundColor: '#F1F5F9' }]}>
              <TouchableOpacity
                onPress={() => {
                  setChartView('weeks');
                  setSelectedChartIndex(null);
                }}
                style={[
                  styles.chartToggleBtn,
                  chartView === 'weeks' && [styles.chartToggleActive, { backgroundColor: colors.card }],
                ]}
              >
                <Text
                  style={[
                    styles.chartToggleText,
                    {
                      color: chartView === 'weeks' ? colors.primary : colors.textMuted,
                      fontWeight: chartView === 'weeks' ? '700' : '500',
                    },
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setChartView('months');
                  setSelectedChartIndex(null);
                }}
                style={[
                  styles.chartToggleBtn,
                  chartView === 'months' && [styles.chartToggleActive, { backgroundColor: colors.card }],
                ]}
              >
                <Text
                  style={[
                    styles.chartToggleText,
                    {
                      color: chartView === 'months' ? colors.primary : colors.textMuted,
                      fontWeight: chartView === 'months' ? '700' : '500',
                    },
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Legend Row */}
          <View style={styles.chartLegendRow}>
            <View style={[styles.legendChip, { backgroundColor: colors.primaryLight }]}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Sales: </Text>
              <Text style={[styles.legendVal, { color: colors.primary }]}>{formatCurrency(totalSalesView)}</Text>
            </View>

            <View style={[styles.legendChip, { backgroundColor: colors.accentLight }]}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Profit: </Text>
              <Text style={[styles.legendVal, { color: colors.accent }]}>{formatCurrency(totalProfitView)}</Text>
            </View>
          </View>

          {/* Interactive Inspection Tooltip */}
          {selectedChartIndex !== null && processedChart.labels[selectedChartIndex] ? (
            <View style={styles.chartTooltip}>
              <Text style={styles.chartTooltipTitle}>
                {processedChart.labels[selectedChartIndex]}
              </Text>
              <Text style={styles.chartTooltipBody}>
                Sales: {formatCurrency(processedChart.sales[selectedChartIndex] || 0)}  •  Profit:{' '}
                {formatCurrency(processedChart.profit[selectedChartIndex] || 0)}
              </Text>
            </View>
          ) : null}

          {/* Bar Chart Canvas with Guide Lines */}
          {loading && !data ? (
            <SkeletonLoader height={170} borderRadius={12} />
          ) : processedChart.labels.length > 0 ? (
            <View style={styles.chartCanvasBox}>
              {/* Background Guide Lines */}
              <View style={styles.guideLinesLayer} pointerEvents="none">
                <View style={[styles.guideLine, { borderBottomColor: '#EEF2F6' }]} />
                <View style={[styles.guideLine, { borderBottomColor: '#EEF2F6' }]} />
                <View style={[styles.guideLine, { borderBottomColor: '#EEF2F6' }]} />
              </View>

              {/* Scrollable Columns */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.barColumnsContainer,
                  processedChart.labels.length <= 3 && { justifyContent: 'space-around', width: '100%' },
                ]}
              >
                {processedChart.labels.map((lbl, idx) => {
                  const saleVal = processedChart.sales[idx] || 0;
                  const profitVal = processedChart.profit[idx] || 0;
                  const saleHeight = Math.max(10, Math.min(125, (saleVal / maxChartValue) * 125));
                  const profitHeight = Math.max(6, Math.min(125, (profitVal / maxChartValue) * 125));
                  const isSelected = selectedChartIndex === idx;

                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => setSelectedChartIndex(isSelected ? null : idx)}
                      style={[
                        styles.chartColumn,
                        isSelected && [styles.chartColumnSelected, { backgroundColor: colors.primaryLight }],
                      ]}
                    >
                      {/* Bars Group with Background Track */}
                      <View style={styles.barsGroupHolder}>
                        {/* Sales Bar Track */}
                        <View style={[styles.barTrack, { backgroundColor: '#F1F5F9' }]}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: saleHeight,
                                backgroundColor: isSelected ? colors.navy : colors.primary,
                              },
                            ]}
                          />
                        </View>

                        {/* Profit Bar Track */}
                        <View style={[styles.barTrack, { backgroundColor: '#F1F5F9' }]}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: profitHeight,
                                backgroundColor: isSelected ? '#047857' : colors.accent,
                              },
                            ]}
                          />
                        </View>
                      </View>

                      {/* X-axis Label */}
                      <Text
                        style={[
                          styles.barXLabel,
                          {
                            color: isSelected ? colors.primary : colors.textMuted,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {lbl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.emptyChartBox}>
              <Icon name="trending-up" size={24} color={colors.textMuted} />
              <Text style={[styles.emptyChartText, { color: colors.textMuted }]}>
                No chart data available for this range
              </Text>
            </View>
          )}
        </View>

        {/* ── 8 KEY BUSINESS METRICS GRID ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Business Metrics</Text>
        </View>

        {loading && !data ? (
          <View style={styles.statsGrid}>
            <SkeletonLoader.Card />
            <SkeletonLoader.Card />
            <SkeletonLoader.Card />
            <SkeletonLoader.Card />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {/* 1. Total Invoices */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statTitle, { color: colors.textMuted }]}>Total Invoices</Text>
                <View style={[styles.statIconBadge, { backgroundColor: colors.primaryLight }]}>
                  <Icon name="receipt" size={15} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {data?.filtered_total_invoices ?? data?.today_invoices_count ?? 0}
              </Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>Completed sales</Text>
            </View>

            {/* 2. Net Profit */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statTitle, { color: colors.textMuted }]}>Net Profit</Text>
                <View style={[styles.statIconBadge, { backgroundColor: colors.accentLight }]}>
                  <Icon name="trending-up" size={15} color={colors.accent} />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {formatCurrency(data?.filtered_total_profit ?? data?.today_total_profit ?? 0)}
              </Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>Estimated margin</Text>
            </View>

            {/* 3. Purchases */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statTitle, { color: colors.textMuted }]}>Purchases</Text>
                <View style={[styles.statIconBadge, { backgroundColor: '#F5F3FF' }]}>
                  <Icon name="box" size={15} color="#8B5CF6" />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatCurrency(data?.filtered_total_purchase ?? 0)}
              </Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>Inventory additions</Text>
            </View>

            {/* 4. Due / Pending */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statTitle, { color: colors.textMuted }]}>Pending Due</Text>
                <View style={[styles.statIconBadge, { backgroundColor: colors.dangerLight }]}>
                  <Icon name="alert" size={15} color={colors.danger} />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.danger }]}>
                {formatCurrency(data?.filtered_total_due ?? 0)}
              </Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>Awaiting payment</Text>
            </View>

            {/* 5. Low Stock Count */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statTitle, { color: colors.textMuted }]}>Low Stock</Text>
                <View
                  style={[
                    styles.statIconBadge,
                    {
                      backgroundColor:
                        Number(data?.low_stock_count) > 0 ? colors.dangerLight : colors.accentLight,
                    },
                  ]}
                >
                  <Icon
                    name="alert"
                    size={15}
                    color={Number(data?.low_stock_count) > 0 ? colors.danger : colors.accent}
                  />
                </View>
              </View>
              <Text
                style={[
                  styles.statValue,
                  { color: Number(data?.low_stock_count) > 0 ? colors.danger : colors.text },
                ]}
              >
                {data?.low_stock_count ?? (Array.isArray(data?.low_stock_products) ? data.low_stock_products.length : 0)}
              </Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>Items Qty ≤ 5</Text>
            </View>

            {/* 6. Catalog Products */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statTitle, { color: colors.textMuted }]}>Total Items</Text>
                <View style={[styles.statIconBadge, { backgroundColor: '#ECFEFF' }]}>
                  <Icon name="box" size={15} color="#06B6D4" />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {data?.product_count ?? 0}
              </Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>Active catalog</Text>
            </View>

            {/* 7. Total Parties / Customers */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statTitle, { color: colors.textMuted }]}>Customers</Text>
                <View style={[styles.statIconBadge, { backgroundColor: '#F0FDF4' }]}>
                  <Icon name="users" size={15} color="#16A34A" />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {data?.customer_count ?? 0}
              </Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>Linked accounts</Text>
            </View>

            {/* 8. Today Total Turnover */}
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statHeader}>
                <Text style={[styles.statTitle, { color: colors.textMuted }]}>Today Gross</Text>
                <View style={[styles.statIconBadge, { backgroundColor: colors.primaryLight }]}>
                  <Icon name="currency" size={15} color={colors.primary} />
                </View>
              </View>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {formatCurrency(data?.today_total_sales ?? 0)}
              </Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>24-hour total</Text>
            </View>
          </View>
        )}

        {/* ── LOW STOCK REPLENISHMENT SECTION ── */}
        {Array.isArray(data?.low_stock_products) && data.low_stock_products.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={styles.alertHeaderRow}>
                <Icon name="alert" size={16} color="#B45309" />
                <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 6 }]}>
                  Low Stock Replenishment ({data.low_stock_products.length})
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleTabSwitch('Products')} activeOpacity={0.7}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>View Catalog</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.lowStockCard, { backgroundColor: colors.card, borderColor: '#FED7AA' }]}>
              {data.low_stock_products.slice(0, 5).map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={[
                    styles.lowStockRow,
                    idx !== 0 && { borderTopWidth: 1, borderTopColor: '#FEEBC8' },
                  ]}
                >
                  <View style={styles.lowStockLeft}>
                    <Text style={[styles.lowStockName, { color: colors.text }]} numberOfLines={1}>
                      {item.name || item.product_name}
                    </Text>
                    <Text style={[styles.lowStockPrice, { color: colors.textMuted }]}>
                      Unit Price: {formatCurrency(item.price)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stockPill,
                      {
                        backgroundColor: Number(item.quantity) <= 2 ? '#FEE2E2' : '#FEF3C7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockPillText,
                        {
                          color: Number(item.quantity) <= 2 ? '#DC2626' : '#D97706',
                        },
                      ]}
                    >
                      {item.quantity} Left
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── RECENT INVOICES SECTION ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Invoices</Text>
          <TouchableOpacity onPress={() => handleTabSwitch('Sales')} activeOpacity={0.7}>
            <Text style={[styles.sectionLink, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading && !data ? (
          <View>
            <SkeletonLoader.Row />
            <SkeletonLoader.Row />
            <SkeletonLoader.Row />
          </View>
        ) : Array.isArray(data?.recent_sales) && data.recent_sales.length > 0 ? (
          data.recent_sales.slice(0, 6).map((sale, idx) => (
            <TouchableOpacity
              key={sale.id || idx}
              style={[
                styles.saleRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.shadow,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => handleTabSwitch('Sales')}
            >
              <View style={[styles.saleIconBox, { backgroundColor: colors.primaryLight }]}>
                <Icon name="bill" size={18} color={colors.primary} />
              </View>
              <View style={styles.saleInfo}>
                <Text style={[styles.saleCustomer, { color: colors.text }]} numberOfLines={1}>
                  {sale.customer_name || sale.party_name || `Invoice #${sale.invoice_number || sale.id}`}
                </Text>
                <Text style={[styles.saleDate, { color: colors.textMuted }]}>
                  {sale.date || sale.created_at || 'Today'} • #{sale.invoice_number || sale.id}
                </Text>
              </View>
              <View style={styles.saleAmountBox}>
                <Text style={[styles.saleAmount, { color: colors.text }]}>
                  {formatCurrency(sale.total_amount || sale.grand_total || 0)}
                </Text>
                <View
                  style={[
                    styles.saleStatusPill,
                    {
                      backgroundColor:
                        String(sale.payment_status).toLowerCase() === 'paid'
                          ? colors.accentLight
                          : colors.dangerLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.saleStatusText,
                      {
                        color:
                          String(sale.payment_status).toLowerCase() === 'paid'
                            ? colors.accent
                            : colors.danger,
                      },
                    ]}
                  >
                    {sale.payment_status ? String(sale.payment_status).toUpperCase() : 'COMPLETED'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="bill" size={32} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Invoices Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Create your first sale to start tracking metrics
            </Text>
            <TouchableOpacity
              style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleTabSwitch('Sales')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyActionText}>+ Create Invoice</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── CUSTOM DATE RANGE MODAL ── */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="calendar" size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Custom Date Range</Text>
              </View>
              <TouchableOpacity onPress={() => setCustomModalVisible(false)}>
                <Icon name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Filter dashboard metrics and charts by a custom timeframe
            </Text>

            {/* Quick Preset Buttons */}
            <View style={styles.modalPresetsRow}>
              <TouchableOpacity
                onPress={() => handleQuickPresetRange('7d')}
                style={[styles.modalPresetBtn, { backgroundColor: colors.primaryLight }]}
              >
                <Text style={[styles.modalPresetText, { color: colors.primary }]}>Last 7 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleQuickPresetRange('30d')}
                style={[styles.modalPresetBtn, { backgroundColor: colors.primaryLight }]}
              >
                <Text style={[styles.modalPresetText, { color: colors.primary }]}>Last 30 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleQuickPresetRange('month')}
                style={[styles.modalPresetBtn, { backgroundColor: colors.primaryLight }]}
              >
                <Text style={[styles.modalPresetText, { color: colors.primary }]}>This Month</Text>
              </TouchableOpacity>
            </View>

            {/* Date Inputs */}
            <View style={styles.modalInputsRow}>
              <View style={styles.modalInputCol}>
                <Text style={[styles.modalInputLabel, { color: colors.textSecondary }]}>From (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.modalDateInput, { borderColor: colors.border, color: colors.text }]}
                  placeholder="2026-11-01"
                  placeholderTextColor={colors.textMuted}
                  value={fromDate}
                  onChangeText={setFromDate}
                />
              </View>

              <View style={styles.modalInputCol}>
                <Text style={[styles.modalInputLabel, { color: colors.textSecondary }]}>To (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.modalDateInput, { borderColor: colors.border, color: colors.text }]}
                  placeholder={getTodayFormatted()}
                  placeholderTextColor={colors.textMuted}
                  value={toDate}
                  onChangeText={setToDate}
                />
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setCustomModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalApplyBtn, { backgroundColor: colors.primary }]}
                onPress={handleApplyCustomModal}
              >
                <Text style={styles.modalApplyText}>Apply Range</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── SHARED BOTTOM BAR (Connected to Navigation) ── */}
      <BottomBar
        currentTab="Home"
        onTabChange={(tabName) => {
          handleTabSwitch(tabName);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadgeContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  logoBadgeImage: {
    width: 40,
    height: 40,
  },
  avatar: {
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
    fontSize: 16,
    fontWeight: '800',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerBusinessName: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerGreeting: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  headerAvatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitials: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  filterSection: {
    marginBottom: 14,
  },
  filterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterShadow: {
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  filterPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  appliedFilterRow: {
    marginTop: 8,
    flexDirection: 'row',
  },
  appliedFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  appliedFilterText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  appliedFilterClose: {
    padding: 2,
  },
  bannerCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 20,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerPillTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bannerPillTagText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  syncingText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  liveSyncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveSyncText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  bannerAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  bannerSubtext: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chartTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  chartSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 2,
  },
  chartToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  chartToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chartToggleActive: {
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartToggleText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
  },
  chartLegendRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  legendText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
  },
  legendVal: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  chartTooltip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  chartTooltipTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chartTooltipBody: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 1,
  },
  chartCanvasBox: {
    height: 175,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  guideLinesLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingBottom: 35,
    paddingTop: 10,
  },
  guideLine: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    width: '100%',
  },
  barColumnsContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    gap: 16,
  },
  chartColumn: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chartColumnSelected: {
    borderRadius: 8,
  },
  barsGroupHolder: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 130,
  },
  barTrack: {
    width: 16,
    height: 130,
    borderRadius: 5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barXLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 6,
  },
  emptyChartBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 8,
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  errorNoticeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 3,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  lowStockCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  lowStockLeft: {
    flex: 1,
    marginRight: 12,
  },
  lowStockName: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  lowStockPrice: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 2,
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
  },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  saleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleCustomer: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  saleDate: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 2,
  },
  saleAmountBox: {
    alignItems: 'flex-end',
  },
  saleAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
  saleStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  saleStatusText: {
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
  emptyActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyActionText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '700',
  },
  modalSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginBottom: 16,
  },
  modalPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modalPresetBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalPresetText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },
  modalInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  modalInputCol: {
    flex: 1,
  },
  modalInputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalDateInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalCancelText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
  },
  modalApplyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalApplyText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HomeScreen;
