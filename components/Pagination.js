/**
 * BillBook Reusable Pagination Component
 * Renders record count indicators and page navigation buttons (Prev, Page Pills, Next)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from './fonts';
import { Icon } from './Icon';

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalRows = 0,
  limit = 10,
  onPageChange,
  itemName = 'records',
}) {
  const { colors } = useTheme();

  if (totalRows <= 0 || totalPages <= 1) {
    return null;
  }

  const startRecord = Math.min((currentPage - 1) * limit + 1, totalRows);
  const endRecord = Math.min(currentPage * limit, totalRows);

  // Generate page pill list
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      {/* Records Count Text */}
      <Text style={[styles.countText, { color: colors.textMuted }]}>
        Showing <Text style={[styles.boldText, { color: colors.text }]}>{startRecord}</Text> to{' '}
        <Text style={[styles.boldText, { color: colors.text }]}>{endRecord}</Text> of{' '}
        <Text style={[styles.boldText, { color: colors.text }]}>{totalRows}</Text> {itemName}
      </Text>

      {/* Page Navigation Controls */}
      <View style={styles.controlsRow}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.navBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
            currentPage <= 1 && styles.disabledBtn,
          ]}
          disabled={currentPage <= 1}
          onPress={() => currentPage > 1 && onPageChange && onPageChange(currentPage - 1)}
          activeOpacity={0.7}
        >
          <Icon
            name="chevron-left"
            size={12}
            color={currentPage <= 1 ? colors.textMuted : colors.text}
          />
          <Text
            style={[
              styles.navBtnText,
              { color: currentPage <= 1 ? colors.textMuted : colors.text },
            ]}
          >
            Prev
          </Text>
        </TouchableOpacity>

        {/* Page Number Pills */}
        <View style={styles.pillsRow}>
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <Text key={`ellipsis-${idx}`} style={[styles.ellipsisText, { color: colors.textMuted }]}>
                  •••
                </Text>
              );
            }

            const isActive = p === currentPage;
            return (
              <TouchableOpacity
                key={`page-${p}`}
                style={[
                  styles.pagePill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => onPageChange && onPageChange(p)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.pagePillText,
                    {
                      color: isActive ? '#FFFFFF' : colors.text,
                      fontWeight: isActive ? '700' : '600',
                    },
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.navBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
            currentPage >= totalPages && styles.disabledBtn,
          ]}
          disabled={currentPage >= totalPages}
          onPress={() => currentPage < totalPages && onPageChange && onPageChange(currentPage + 1)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navBtnText,
              { color: currentPage >= totalPages ? colors.textMuted : colors.text },
            ]}
          >
            Next
          </Text>
          <Icon
            name="chevron-right"
            size={12}
            color={currentPage >= totalPages ? colors.textMuted : colors.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  countText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  boldText: {
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  navBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.45,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pagePill: {
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pagePillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  ellipsisText: {
    paddingHorizontal: 4,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
  },
});

export default Pagination;
