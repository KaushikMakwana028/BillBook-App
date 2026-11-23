/**
 * BillBook Modern Text Input Component
 * Ultra-stable without re-rendering loops on focus
 * Supports Light & Pure Black themes, icons, prefix, and errors
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FONT_FAMILY } from './fonts';

export const Input = ({
  label,
  required = false,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  maxLength,
  secureTextEntry = false,
  error,
  helperText,
  prefix,
  leftIcon,
  rightIcon,
  onRightIconPress,
  editable = true,
  containerStyle,
  inputStyle,
  returnKeyType = 'done',
  onSubmitEditing,
  inputRef,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {label}
          </Text>
          {required && (
            <Text style={[styles.required, { color: colors.danger }]}> *</Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDark ? colors.inputBg : '#FFFFFF',
            borderColor: error ? colors.danger : colors.inputBorder,
          },
          !editable && styles.disabledWrapper,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        {prefix && (
          <Text style={[styles.prefix, { color: colors.textMuted }]}>
            {prefix}
          </Text>
        )}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={[styles.input, { color: colors.text }, inputStyle]}
        />

        {rightIcon && (
          <TouchableOpacity
            disabled={!onRightIconPress}
            onPress={onRightIconPress}
            style={styles.iconRight}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.textMuted }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  required: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 52,
  },
  disabledWrapper: {
    opacity: 0.6,
  },
  prefix: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    paddingVertical: 0,
    fontWeight: '500',
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
    padding: 4,
  },
  errorText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  helperText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input;
