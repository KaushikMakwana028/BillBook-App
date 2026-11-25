/**
 * BillBook Crisp Code-128 Barcode Visual Component
 * Renders scannable Code-128B bar patterns with human-readable digits.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { encodeCode128B } from '../utils/barcode';
import { FONT_FAMILY } from './fonts';

export function BarcodeView({
  value,
  height = 54,
  barWidth = 1.6,
  barColor = '#0F172A',
  backgroundColor = '#FFFFFF',
  showText = true,
  fontSize = 12,
  style,
}) {
  const encoded = useMemo(() => encodeCode128B(value), [value]);

  if (!encoded.text || encoded.segments.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <View style={[styles.barsRow, { height }]}>
        {encoded.segments.map((seg, idx) => (
          <View
            key={idx}
            style={{
              width: seg.width * barWidth,
              height: '100%',
              backgroundColor: seg.isBar ? barColor : 'transparent',
            }}
          />
        ))}
      </View>
      {showText ? (
        <Text
          style={[
            styles.digits,
            {
              color: barColor,
              fontSize,
            },
          ]}
          numberOfLines={1}
        >
          {encoded.text}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  digits: {
    fontFamily: FONT_FAMILY,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginTop: 5,
  },
});

export default BarcodeView;
