/**
 * BillBook Products & Inventory Screen
 * Catalog management, barcode scanning, stock tracking, and product creation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import { Header, BottomBar, SkeletonLoader, Icon, Pagination } from '../components';
import { FONT_FAMILY } from '../components/fonts';
import { resolveProductImageUrl } from '../utils/imageUrl';

function ProductListItem({ prod, colors, formatCurrency, onNavigate }) {
  const [imgError, setImgError] = useState(false);
  const qty = Number(prod.quantity ?? prod.stock ?? 0);
  const isLow = qty <= 5;
  const rawImg = prod.image || prod.product_image || prod.image_url || prod.photo || prod.img;
  const resolvedImg = resolveProductImageUrl(rawImg);

  return (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.75}
      onPress={() => {
        if (onNavigate) {
          onNavigate('ProductDetail', { product: prod, productId: prod.id });
        }
      }}
    >
      <View style={[styles.productIconBox, { backgroundColor: colors.primaryLight, overflow: 'hidden' }]}>
        {resolvedImg && !imgError ? (
          <Image
            source={{ uri: resolvedImg }}
            style={styles.productThumbImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Icon name="box" size={18} color={colors.primary} />
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
          {prod.name}
        </Text>
        <Text style={[styles.productMeta, { color: colors.textMuted }]}>
          {prod.category_name || 'General Item'} • {prod.sku || prod.barcode || `ID: ${prod.id}`}
        </Text>
      </View>

      <View style={styles.productRight}>
        <Text style={[styles.productPrice, { color: colors.text }]}>
          {formatCurrency(prod.price || prod.sale_price)}
        </Text>
        <View
          style={[
            styles.stockBadge,
            {
              backgroundColor: isLow ? colors.dangerLight : colors.accentLight,
            },
          ]}
        >
          <Text
            style={[
              styles.stockBadgeText,
              { color: isLow ? colors.danger : colors.accent },
            ]}
          >
            {qty} In Stock
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const STOCK_FILTERS = [
  { id: 'all', label: 'All Items' },
  { id: 'low', label: 'Low Stock' },
  { id: 'in_stock', label: 'In Stock' },
];

export function ProductsScreen({ navigation, onNavigate }) {
  const { colors } = useTheme();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const limit = 10;

  const fetchProducts = useCallback(
    async (page = 1, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMsg('');

      try {
        const params = { search: search.trim(), page, limit };
        if (selectedCategory !== 'all') params.category_id = selectedCategory;
        if (stockFilter !== 'all') params.stock_filter = stockFilter;

        const res = await productService.getProducts(params, { useCache: !isRefresh });
        if (res?.status && res?.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.products || [];
          setProducts(list);
          const tRows = res.data.total_rows !== undefined ? res.data.total_rows : list.length;
          const tPages =
            res.data.total_pages !== undefined
              ? res.data.total_pages
              : Math.max(1, Math.ceil(tRows / limit));
          setTotalRows(tRows);
          setTotalPages(tPages);
          setCurrentPage(res.data.current_page || page);
        } else {
          setProducts([]);
          setTotalRows(0);
          setTotalPages(1);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Error fetching products.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, selectedCategory, stockFilter]
  );

  // Fetch Categories for Filter Bar
  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => {
        if (res?.status && res?.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.categories || [];
          setCategories(list);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const onRefresh = () => {
    fetchProducts(currentPage, true);
  };

  const handlePageChange = (newPage) => {
    fetchProducts(newPage, false);
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Header
        title="Products Catalog"
        subtitle={`${products.length} inventory items`}
        rightIcon="plus"
        onRightPress={() => {
          if (onNavigate) onNavigate('AddProduct');
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
        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search" size={17} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name, SKU or barcode..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => fetchProducts()}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Stock Filter Pills */}
        <View style={styles.stockFilterRow}>
          {STOCK_FILTERS.map((item) => {
            const isActive = stockFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setStockFilter(item.id)}
                style={[
                  styles.stockFilterPill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stockFilterText,
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

        {/* Category Filter Scroll with "+ Categories" button */}
        <View style={styles.catScrollWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {/* Quick Button to Open Categories Screen */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigate && onNavigate('Categories')}
              style={[
                styles.catPill,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                },
              ]}
            >
              <Icon name="tag" size={13} color={colors.primary} style={{ marginRight: 5 }} />
              <Text style={[styles.catText, { color: colors.primary, fontWeight: '700' }]}>
                + Categories
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedCategory('all')}
              style={[
                styles.catPill,
                {
                  backgroundColor: selectedCategory === 'all' ? colors.primary : colors.card,
                  borderColor: selectedCategory === 'all' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  {
                    color: selectedCategory === 'all' ? '#FFFFFF' : colors.textMuted,
                    fontWeight: selectedCategory === 'all' ? '700' : '500',
                  },
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => {
              const isCatActive = String(selectedCategory) === String(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: isCatActive ? colors.primary : colors.card,
                      borderColor: isCatActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catText,
                      {
                        color: isCatActive ? '#FFFFFF' : colors.textMuted,
                        fontWeight: isCatActive ? '700' : '500',
                      },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Products List */}
        {loading ? (
          <View>
            <SkeletonLoader.Row />
            <SkeletonLoader.Row />
            <SkeletonLoader.Row />
            <SkeletonLoader.Row />
          </View>
        ) : products.length > 0 ? (
          <>
            {products.map((prod, idx) => (
              <ProductListItem
                key={prod.id || idx}
                prod={prod}
                colors={colors}
                formatCurrency={formatCurrency}
                onNavigate={onNavigate}
              />
            ))}

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRows={totalRows}
              limit={limit}
              onPageChange={handlePageChange}
              itemName="items"
            />
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Icon name="box" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Products Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {search ? 'Try adjusting your search filter' : 'Add items to your inventory to start selling'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (onNavigate) onNavigate('AddProduct');
              }}
            >
              <Text style={styles.emptyBtnText}>+ Add New Product</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Shared Bottom Bar */}
      <BottomBar
        currentTab="Products"
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
  stockFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  stockFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  stockFilterText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  catScrollWrapper: {
    marginBottom: 14,
  },
  catScroll: {
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  catText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  productIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productThumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
  },
  productMeta: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    marginTop: 2,
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  stockBadgeText: {
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

export default ProductsScreen;
