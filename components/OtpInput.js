/**
 * BillBook 6-Box OTP PIN Input Component
 * High-performance, single-input overlay architecture
 * Prevents all keyboard blur/flicker and auto-focus loop issues
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from './fonts';

export const OtpInput = ({
  codeLength = 6,
  value = '',
  onChangeCode,
  onCodeFilled,
  disabled = false,
  autoFocus = true,
}) => {
  const { colors, isDark } = useTheme();
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const cleanValue = String(value || '').replace(/\D/g, '').slice(0, codeLength);

  const handleTextChange = (text) => {
    const clean = text.replace(/\D/g, '').slice(0, codeLength);
    onChangeCode?.(clean);
    if (clean.length === codeLength) {
      onCodeFilled?.(clean);
    }
  };

  const handlePress = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* 6 Visual Display Boxes */}
      <View style={styles.boxesRow}>
        {Array(codeLength)
          .fill(0)
          .map((_, index) => {
            const digit = cleanValue[index] || '';
            const isCurrentBox = isFocused && (index === cleanValue.length || (index === codeLength - 1 && cleanValue.length === codeLength));
            const isFilled = !!digit;

            return (
              <View
                key={index}
                style={[
                  styles.box,
                  {
                    backgroundColor: isDark ? colors.inputBg : '#FFFFFF',
                    borderColor: isCurrentBox
                      ? colors.primary
                      : isFilled
                      ? colors.borderFocus
                      : colors.inputBorder,
                  },
                  isCurrentBox && {
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 4,
                    transform: [{ scale: 1.05 }],
                  },
                ]}
              >
                <Text style={[styles.digitText, { color: colors.text }]}>
                  {digit}
                </Text>
                {/* Subtle blinking cursor if empty & active */}
                {isCurrentBox && !digit && (
                  <View
                    style={[styles.cursorIndicator, { backgroundColor: colors.primary }]}
                  />
                )}
              </View>
            );
          })}
      </View>

      {/* Invisible Native TextInput covering the whole area */}
      <TextInput
        ref={inputRef}
        value={cleanValue}
        onChangeText={handleTextChange}
        keyboardType="number-pad"
        maxLength={codeLength}
        autoFocus={autoFocus}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        caretHidden={true}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 18,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
  },
  box: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  cursorIndicator: {
    position: 'absolute',
    width: 2,
    height: 24,
    borderRadius: 1,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01, // Nearly invisible, but receives native focus cleanly
    color: 'transparent',
    fontSize: 1,
  },
});

export default OtpInput;
