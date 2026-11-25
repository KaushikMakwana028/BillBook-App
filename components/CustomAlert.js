/**
 * BillBook Custom Alert Dialog
 * High-polish modal alert replacing default system alerts
 * Styled with BillBook brand colors (#F58220, #0A2540), smooth spring animations,
 * and contextual status badges (success, danger, warning, info).
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './Icon';
import { FONT_FAMILY } from './fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function CustomAlert({
  visible = false,
  title = '',
  message = '',
  type = 'info', // 'success' | 'danger' | 'warning' | 'info'
  buttons = [],
  onClose,
}) {
  const { colors } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!visible) return null;

  // Resolve Badge Color & Icon according to Type
  let iconName = 'alert';
  let iconColor = colors.primary;
  let iconBg = colors.primaryLight;

  if (type === 'success') {
    iconName = 'check';
    iconColor = colors.accent || '#10B981';
    iconBg = colors.accentLight || '#ECFDF5';
  } else if (type === 'danger') {
    iconName = 'alert';
    iconColor = colors.danger || '#EF4444';
    iconBg = colors.dangerLight || '#FEF2F2';
  } else if (type === 'warning') {
    iconName = 'alert';
    iconColor = colors.warning || '#F59E0B';
    iconBg = colors.warningLight || '#FFFBEB';
  } else if (type === 'info') {
    iconName = 'document';
    iconColor = colors.navy || '#0A2540';
    iconBg = colors.navyLight || '#EFF4F9';
  }

  // Default button if none provided
  const actionButtons =
    buttons && buttons.length > 0
      ? buttons
      : [
          {
            text: 'OK',
            style: 'default',
            onPress: onClose,
          },
        ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Type Badge Icon */}
              <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
                <Icon name={iconName} size={28} color={iconColor} />
              </View>

              {/* Title */}
              {title ? (
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              ) : null}

              {/* Message */}
              {message ? (
                <Text style={[styles.message, { color: colors.textSecondary }]}>
                  {message}
                </Text>
              ) : null}

              {/* Action Buttons Row */}
              <View
                style={[
                  styles.buttonRow,
                  actionButtons.length > 2 && styles.buttonCol,
                ]}
              >
                {actionButtons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';

                  let btnBg = colors.primary;
                  let textColor = '#FFFFFF';
                  let borderColor = 'transparent';

                  if (isCancel) {
                    btnBg = colors.cardSecondary || '#F1F5F9';
                    textColor = colors.textSecondary;
                    borderColor = colors.border;
                  } else if (isDestructive) {
                    btnBg = colors.danger || '#EF4444';
                    textColor = '#FFFFFF';
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (btn.onPress) {
                          btn.onPress();
                        } else if (onClose) {
                          onClose();
                        }
                      }}
                      style={[
                        styles.button,
                        {
                          backgroundColor: btnBg,
                          borderColor: borderColor,
                          borderWidth: isCancel ? 1 : 0,
                          flex: actionButtons.length <= 2 ? 1 : undefined,
                        },
                        actionButtons.length > 2 && { width: '100%', marginBottom: 8 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          {
                            color: textColor,
                            fontWeight: isCancel ? '600' : '700',
                          },
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 64, 0.45)', // Rich brand navy translucent backdrop
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(SCREEN_WIDTH * 0.88, 360),
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 26,
    paddingBottom: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  buttonCol: {
    flexDirection: 'column',
  },
  button: {
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
});

export default CustomAlert;
