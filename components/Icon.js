/**
 * BillBook Geometric Vector Icon Component
 * Crisp, modern UI icons with zero external dependencies
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export const Icon = ({ name, size = 20, color = '#FFFFFF', style }) => {
  switch (name) {
    case 'sun':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.5,
              height: size * 0.5,
              borderRadius: (size * 0.5) / 2,
              backgroundColor: color,
            }}
          />
          {/* Subtle outer ring */}
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: size / 2,
                borderWidth: 1.5,
                borderColor: color,
                borderStyle: 'dashed',
              },
            ]}
          />
        </View>
      );

    case 'moon':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.75,
              height: size * 0.75,
              borderRadius: (size * 0.75) / 2,
              borderWidth: 2,
              borderColor: color,
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      );

    case 'lock':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          {/* Shackle */}
          <View
            style={{
              width: size * 0.52,
              height: size * 0.44,
              borderTopLeftRadius: size * 0.3,
              borderTopRightRadius: size * 0.3,
              borderWidth: 2,
              borderColor: color,
              borderBottomWidth: 0,
              marginBottom: -1,
            }}
          />
          {/* Body */}
          <View
            style={{
              width: size * 0.74,
              height: size * 0.52,
              borderRadius: 4,
              backgroundColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 3,
                height: 5,
                backgroundColor: '#000000',
                borderRadius: 1,
              }}
            />
          </View>
        </View>
      );

    case 'bill':
    case 'document':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.7,
              height: size * 0.88,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: color,
              padding: 2,
              justifyContent: 'space-around',
            }}
          >
            <View
              style={{
                width: '60%',
                height: 1.5,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            <View
              style={{
                width: '80%',
                height: 1.5,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
            <View
              style={{
                width: '50%',
                height: 1.5,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
          </View>
        </View>
      );

    case 'briefcase':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.4,
              height: size * 0.2,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
              borderWidth: 1.5,
              borderColor: color,
              borderBottomWidth: 0,
            }}
          />
          <View
            style={{
              width: size * 0.85,
              height: size * 0.6,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: '100%',
                height: 1,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'arrow-left':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.45,
              height: size * 0.45,
              borderLeftWidth: 2.2,
              borderTopWidth: 2.2,
              borderColor: color,
              transform: [{ rotate: '-45deg' }],
              marginLeft: size * 0.15,
            }}
          />
        </View>
      );

    case 'logout':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          {/* Bracket / Door */}
          <View
            style={{
              width: size * 0.65,
              height: size * 0.8,
              borderLeftWidth: 2,
              borderTopWidth: 2,
              borderBottomWidth: 2,
              borderColor: color,
              borderTopLeftRadius: 4,
              borderBottomLeftRadius: 4,
            }}
          />
          {/* Arrow */}
          <View
            style={{
              position: 'absolute',
              right: 1,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ width: size * 0.4, height: 2, backgroundColor: color }} />
            <View
              style={{
                width: size * 0.25,
                height: size * 0.25,
                borderTopWidth: 2,
                borderRightWidth: 2,
                borderColor: color,
                transform: [{ rotate: '45deg' }],
                marginLeft: -3,
              }}
            />
          </View>
        </View>
      );

    case 'user':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          {/* Head */}
          <View
            style={{
              width: size * 0.38,
              height: size * 0.38,
              borderRadius: (size * 0.38) / 2,
              borderWidth: 2,
              borderColor: color,
              marginBottom: 2,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: size * 0.72,
              height: size * 0.38,
              borderTopLeftRadius: size * 0.4,
              borderTopRightRadius: size * 0.4,
              borderWidth: 2,
              borderColor: color,
              borderBottomWidth: 0,
            }}
          />
        </View>
      );

    case 'plus':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              position: 'absolute',
              width: size * 0.7,
              height: 2.2,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 2.2,
              height: size * 0.7,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
        </View>
      );

    case 'alert':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.75,
              height: size * 0.75,
              borderRadius: size * 0.38,
              borderWidth: 2,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 2,
                height: size * 0.25,
                backgroundColor: color,
                borderRadius: 1,
                marginBottom: 2,
              }}
            />
            <View
              style={{
                width: 2.5,
                height: 2.5,
                borderRadius: 1.5,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'trending-up':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.5,
              height: size * 0.5,
              borderTopWidth: 2.2,
              borderRightWidth: 2.2,
              borderColor: color,
            }}
          />
        </View>
      );

    case 'currency':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <Text
            style={{
              fontSize: size * 0.85,
              fontWeight: '800',
              color,
              marginTop: -2,
            }}
          >
            ₹
          </Text>
        </View>
      );

    case 'box':
    case 'package':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.78,
              height: size * 0.78,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: color,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: '60%',
                height: size * 0.35,
                borderBottomWidth: 1.5,
                borderLeftWidth: 1.5,
                borderRightWidth: 1.5,
                borderColor: color,
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3,
              }}
            />
          </View>
        </View>
      );

    case 'chat':
    case 'whatsapp':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.78,
              height: size * 0.65,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: color,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', gap: 2 }}>
              <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
              <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
              <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
            </View>
          </View>
        </View>
      );

    default:
      return null;
  }
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Icon;
