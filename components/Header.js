/**
 * BillBook Main Header Component
 * Business branding, greeting, user profile avatar, compact theme icon switcher, and logout
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { FONT_FAMILY } from './fonts';

export const Header = ({ onLogoutPress }) => {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const businessName = user?.business_name || user?.name || 'BillBook';
  const ownerName = user?.name || 'User';

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            if (onLogoutPress) {
              onLogoutPress();
            } else {
              logout();
            }
          },
        },
      ]
    );
  };

  const getInitials = (str) => {
    if (!str) return 'BB';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.leftArea}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.primaryLight,
              borderColor: colors.borderFocus,
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {getInitials(businessName)}
          </Text>
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[styles.businessName, { color: colors.text }]}
            numberOfLines={1}
          >
            {businessName}
          </Text>
          <Text
            style={[styles.greeting, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            Hi, {ownerName}
          </Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        {/* Compact Theme Switcher Icon */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleTheme}
          style={[
            styles.themeToggle,
            {
              backgroundColor: isDark ? colors.cardSecondary : colors.cardSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Icon
            name={isDark ? 'sun' : 'moon'}
            size={18}
            color={isDark ? '#F59E0B' : '#6366F1'}
          />
        </TouchableOpacity>

        {/* Minimal Logout Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLogout}
          style={[
            styles.logoutButton,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
            },
          ]}
        >
          <Icon name="logout" size={15} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>
            Exit
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  leftArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
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
  textContainer: {
    flex: 1,
  },
  businessName: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  greeting: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 1,
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  logoutText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default Header;
