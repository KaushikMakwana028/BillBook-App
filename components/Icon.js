/**
 * BillBook Geometric Vector Icon Component
 * Crisp, modern UI icons with zero external dependencies
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

export const Icon = ({ name, size = 20, color = '#FFFFFF', style }) => {
  switch (name) {
    case 'home':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          {/* Roof triangle */}
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: size * 0.42,
              borderRightWidth: size * 0.42,
              borderBottomWidth: size * 0.36,
              borderStyle: 'solid',
              backgroundColor: 'transparent',
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
            }}
          />
          {/* House base */}
          <View
            style={{
              width: size * 0.65,
              height: size * 0.45,
              borderWidth: 2,
              borderColor: color,
              borderTopWidth: 0,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {/* Door */}
            <View
              style={{
                width: size * 0.22,
                height: size * 0.24,
                backgroundColor: color,
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
              }}
            />
          </View>
        </View>
      );

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
    case 'receipt':
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
              height: size * 0.58,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 4,
                height: 3,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
          </View>
        </View>
      );

    case 'arrow-left':
    case 'arrow-back':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          {/* Main stem */}
          <View
            style={{
              position: 'absolute',
              width: size * 0.65,
              height: 2.2,
              backgroundColor: color,
              borderRadius: 1,
              left: size * 0.15,
            }}
          />
          {/* Arrow head tip */}
          <View
            style={{
              position: 'absolute',
              left: size * 0.12,
              width: size * 0.36,
              height: size * 0.36,
              borderLeftWidth: 2.2,
              borderTopWidth: 2.2,
              borderColor: color,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      );

    case 'arrow-forward':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          {/* Main stem */}
          <View
            style={{
              position: 'absolute',
              width: size * 0.65,
              height: 2.2,
              backgroundColor: color,
              borderRadius: 1,
              right: size * 0.15,
            }}
          />
          {/* Arrow head tip */}
          <View
            style={{
              position: 'absolute',
              right: size * 0.12,
              width: size * 0.36,
              height: size * 0.36,
              borderRightWidth: 2.2,
              borderTopWidth: 2.2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'chevron-right':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.38,
              height: size * 0.38,
              borderTopWidth: 2.2,
              borderRightWidth: 2.2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginLeft: -size * 0.1,
            }}
          />
        </View>
      );

    case 'chevron-left':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.38,
              height: size * 0.38,
              borderBottomWidth: 2.2,
              borderLeftWidth: 2.2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginLeft: size * 0.1,
            }}
          />
        </View>
      );

    case 'chevron-down':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.38,
              height: size * 0.38,
              borderBottomWidth: 2.2,
              borderRightWidth: 2.2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginTop: -size * 0.1,
            }}
          />
        </View>
      );

    case 'chevron-up':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.38,
              height: size * 0.38,
              borderTopWidth: 2.2,
              borderLeftWidth: 2.2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginTop: size * 0.1,
            }}
          />
        </View>
      );

    case 'check':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.3,
              height: size * 0.55,
              borderBottomWidth: 2.5,
              borderRightWidth: 2.5,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginTop: -size * 0.1,
            }}
          />
        </View>
      );

    case 'close':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              position: 'absolute',
              width: size * 0.75,
              height: 2,
              backgroundColor: color,
              transform: [{ rotate: '45deg' }],
              borderRadius: 1,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: size * 0.75,
              height: 2,
              backgroundColor: color,
              transform: [{ rotate: '-45deg' }],
              borderRadius: 1,
            }}
          />
        </View>
      );

    case 'logout':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          {/* Door frame */}
          <View
            style={{
              position: 'absolute',
              left: 2,
              width: size * 0.52,
              height: size * 0.8,
              borderLeftWidth: 2,
              borderTopWidth: 2,
              borderBottomWidth: 2,
              borderColor: color,
              borderRadius: 3,
            }}
          />
          {/* Arrow passing through */}
          <View
            style={{
              position: 'absolute',
              right: 1,
              width: size * 0.55,
              height: 2,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 1,
              width: size * 0.25,
              height: size * 0.25,
              borderTopWidth: 2,
              borderRightWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'user':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          {/* Head */}
          <View
            style={{
              width: size * 0.42,
              height: size * 0.42,
              borderRadius: (size * 0.42) / 2,
              borderWidth: 2,
              borderColor: color,
              marginBottom: 1,
            }}
          />
          {/* Shoulders */}
          <View
            style={{
              width: size * 0.78,
              height: size * 0.36,
              borderTopLeftRadius: size * 0.38,
              borderTopRightRadius: size * 0.38,
              borderWidth: 2,
              borderColor: color,
              borderBottomWidth: 0,
            }}
          />
        </View>
      );

    case 'users':
    case 'people':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          {/* Back user */}
          <View
            style={{
              position: 'absolute',
              left: 1,
              top: 1,
              width: size * 0.34,
              height: size * 0.34,
              borderRadius: (size * 0.34) / 2,
              borderWidth: 1.5,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: size * 0.4,
              width: size * 0.5,
              height: size * 0.3,
              borderTopLeftRadius: size * 0.25,
              borderTopRightRadius: size * 0.25,
              borderWidth: 1.5,
              borderColor: color,
              borderBottomWidth: 0,
            }}
          />
          {/* Front user */}
          <View
            style={{
              position: 'absolute',
              right: 2,
              top: 3,
              width: size * 0.38,
              height: size * 0.38,
              borderRadius: (size * 0.38) / 2,
              borderWidth: 2,
              borderColor: color,
              backgroundColor: '#FFFFFF',
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 0,
              top: size * 0.45,
              width: size * 0.62,
              height: size * 0.35,
              borderTopLeftRadius: size * 0.3,
              borderTopRightRadius: size * 0.3,
              borderWidth: 2,
              borderColor: color,
              borderBottomWidth: 0,
              backgroundColor: '#FFFFFF',
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
              width: size * 0.75,
              height: 2.2,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              position: 'absolute',
              height: size * 0.75,
              width: 2.2,
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
              width: size * 0.85,
              height: size * 0.85,
              borderRadius: (size * 0.85) / 2,
              borderWidth: 2,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 2,
                height: size * 0.32,
                backgroundColor: color,
                borderRadius: 1,
                marginBottom: 2,
              }}
            />
            <View
              style={{
                width: 2.5,
                height: 2.5,
                borderRadius: 1.25,
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
              width: size * 0.7,
              height: size * 0.7,
              borderTopWidth: 2.2,
              borderRightWidth: 2.2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </View>
      );

    case 'currency':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.8,
              height: size * 0.8,
              borderRadius: size * 0.4,
              borderWidth: 1.8,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: size * 0.35,
                height: 2,
                backgroundColor: color,
                borderRadius: 1,
                marginBottom: 2,
              }}
            />
            <View
              style={{
                width: size * 0.25,
                height: 2,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
          </View>
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
                height: size * 0.32,
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

    case 'phone':
    case 'call':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.72,
              height: size * 0.72,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: '-25deg' }],
            }}
          >
            {/* Top earpiece */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: size * 0.32,
                height: size * 0.18,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
            {/* Curved handle */}
            <View
              style={{
                width: size * 0.58,
                height: size * 0.58,
                borderTopRightRadius: size * 0.35,
                borderRightWidth: 2.4,
                borderTopWidth: 2.4,
                borderColor: color,
                position: 'absolute',
                top: 2,
                right: 2,
              }}
            />
            {/* Bottom mouthpiece */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: size * 0.18,
                height: size * 0.32,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'whatsapp':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          {/* Circular bubble */}
          <View
            style={{
              width: size * 0.84,
              height: size * 0.84,
              borderRadius: (size * 0.84) / 2,
              borderWidth: 2,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Inner Phone receiver curve */}
            <View
              style={{
                width: size * 0.44,
                height: size * 0.44,
                borderLeftWidth: 2.2,
                borderBottomWidth: 2.2,
                borderColor: color,
                borderBottomLeftRadius: 4,
                transform: [{ rotate: '45deg' }],
                marginTop: -1,
                marginLeft: 1,
              }}
            />
          </View>
          {/* Small Speech Pointer Tail at bottom left */}
          <View
            style={{
              position: 'absolute',
              bottom: size * 0.04,
              left: size * 0.04,
              width: 0,
              height: 0,
              borderLeftWidth: size * 0.16,
              borderBottomWidth: size * 0.16,
              borderLeftColor: color,
              borderBottomColor: 'transparent',
              borderStyle: 'solid',
            }}
          />
        </View>
      );

    case 'email':
    case 'mail':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.85,
              height: size * 0.62,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: color,
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: size * 0.6,
                height: size * 0.35,
                borderBottomLeftRadius: size * 0.2,
                borderBottomRightRadius: size * 0.2,
                borderLeftWidth: 1.5,
                borderRightWidth: 1.5,
                borderBottomWidth: 1.5,
                borderColor: color,
                marginTop: -1,
              }}
            />
          </View>
        </View>
      );

    case 'bell':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.65,
              height: size * 0.6,
              borderTopLeftRadius: size * 0.32,
              borderTopRightRadius: size * 0.32,
              borderWidth: 2,
              borderColor: color,
              borderBottomWidth: 0,
            }}
          />
          <View
            style={{
              width: size * 0.8,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
          <View
            style={{
              width: size * 0.2,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              marginTop: 1,
            }}
          />
        </View>
      );

    case 'refresh':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.72,
              height: size * 0.72,
              borderRadius: (size * 0.72) / 2,
              borderWidth: 2,
              borderColor: color,
              borderRightColor: 'transparent',
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </View>
      );

    case 'search':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.55,
              height: size * 0.55,
              borderRadius: (size * 0.55) / 2,
              borderWidth: 2,
              borderColor: color,
              top: -size * 0.1,
              left: -size * 0.1,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: size * 0.32,
              height: 2.2,
              backgroundColor: color,
              bottom: size * 0.12,
              right: size * 0.1,
              transform: [{ rotate: '45deg' }],
              borderRadius: 1,
            }}
          />
        </View>
      );

    case 'calendar':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.8,
              height: size * 0.74,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: color,
              paddingTop: 3,
              alignItems: 'center',
            }}
          >
            {/* Header divider */}
            <View
              style={{
                width: '100%',
                height: 1.5,
                backgroundColor: color,
                marginBottom: 2,
              }}
            />
            {/* Dots */}
            <View style={{ flexDirection: 'row', gap: 3, marginTop: 1 }}>
              <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
              <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
              <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: color }} />
            </View>
          </View>
          {/* Top binder rings */}
          <View
            style={{
              position: 'absolute',
              top: 1,
              left: size * 0.28,
              width: 2,
              height: 4,
              borderRadius: 1,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 1,
              right: size * 0.28,
              width: 2,
              height: 4,
              borderRadius: 1,
              backgroundColor: color,
            }}
          />
        </View>
      );

    case 'filter':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.75,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              marginBottom: 3,
            }}
          />
          <View
            style={{
              width: size * 0.5,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              marginBottom: 3,
            }}
          />
          <View
            style={{
              width: size * 0.25,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
        </View>
      );

    case 'trash':
    case 'delete':
    case 'remove':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.32,
              height: 2.2,
              backgroundColor: color,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              marginBottom: 1,
            }}
          />
          <View
            style={{
              width: size * 0.7,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              marginBottom: 1,
            }}
          />
          <View
            style={{
              width: size * 0.52,
              height: size * 0.48,
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4,
              borderWidth: 1.8,
              borderColor: color,
              borderTopWidth: 0,
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              paddingHorizontal: 2,
            }}
          >
            <View style={{ width: 1.4, height: size * 0.26, backgroundColor: color, borderRadius: 1 }} />
            <View style={{ width: 1.4, height: size * 0.26, backgroundColor: color, borderRadius: 1 }} />
          </View>
        </View>
      );

    case 'download':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: 2,
              height: size * 0.42,
              backgroundColor: color,
              marginBottom: -1,
            }}
          />
          <View
            style={{
              width: size * 0.32,
              height: size * 0.32,
              borderBottomWidth: 2,
              borderRightWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              marginTop: -size * 0.18,
              marginBottom: 3,
            }}
          />
          <View
            style={{
              width: size * 0.72,
              height: size * 0.18,
              borderBottomWidth: 2,
              borderLeftWidth: 2,
              borderRightWidth: 2,
              borderColor: color,
              borderBottomLeftRadius: 2,
              borderBottomRightRadius: 2,
            }}
          />
        </View>
      );

    case 'camera':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.3,
              height: 2,
              backgroundColor: color,
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
              marginBottom: 1,
            }}
          />
          <View
            style={{
              width: size * 0.8,
              height: size * 0.58,
              borderRadius: 3.5,
              borderWidth: 1.8,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: size * 0.28,
                height: size * 0.28,
                borderRadius: (size * 0.28) / 2,
                borderWidth: 1.5,
                borderColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'image':
    case 'photo':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.82,
              height: size * 0.68,
              borderRadius: 3,
              borderWidth: 1.8,
              borderColor: color,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 2,
                right: 3,
                width: size * 0.18,
                height: size * 0.18,
                borderRadius: (size * 0.18) / 2,
                backgroundColor: color,
              }}
            />
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.28,
                borderRightWidth: size * 0.28,
                borderBottomWidth: size * 0.32,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'eye':
    case 'view':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.82,
              height: size * 0.52,
              borderTopLeftRadius: size * 0.5,
              borderBottomRightRadius: size * 0.5,
              borderWidth: 2,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: size * 0.24,
                height: size * 0.24,
                borderRadius: (size * 0.24) / 2,
                backgroundColor: color,
              }}
            />
          </View>
        </View>
      );

    case 'cart':
    case 'shopping-cart':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.65,
              height: size * 0.42,
              borderWidth: 1.8,
              borderColor: color,
              borderTopWidth: 0,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
              marginBottom: 2,
            }}
          />
          <View style={{ flexDirection: 'row', width: size * 0.48, justifyContent: 'space-between' }}>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
          </View>
        </View>
      );

    case 'edit':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.26,
              height: size * 0.62,
              borderRadius: 2,
              borderWidth: 1.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <View style={{ width: '100%', height: 2, backgroundColor: color, marginTop: 2 }} />
          </View>
        </View>
      );

    case 'tag':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: 3,
              borderWidth: 1.8,
              borderColor: color,
              transform: [{ rotate: '45deg' }],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 3,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: color,
                position: 'absolute',
                top: 3,
                left: 3,
              }}
            />
          </View>
        </View>
      );

    case 'barcode':
      return (
        <View
          style={[
            {
              width: size,
              height: size,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
            },
            style,
          ]}
        >
          <View style={{ width: 2, height: size * 0.65, backgroundColor: color, borderRadius: 0.5 }} />
          <View style={{ width: 1, height: size * 0.65, backgroundColor: color }} />
          <View style={{ width: 2.5, height: size * 0.65, backgroundColor: color, borderRadius: 0.5 }} />
          <View style={{ width: 1, height: size * 0.65, backgroundColor: color }} />
          <View style={{ width: 3, height: size * 0.65, backgroundColor: color, borderRadius: 0.5 }} />
          <View style={{ width: 1.2, height: size * 0.65, backgroundColor: color }} />
          <View style={{ width: 2, height: size * 0.65, backgroundColor: color, borderRadius: 0.5 }} />
        </View>
      );

    case 'layers':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.68,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              marginBottom: 3,
            }}
          />
          <View
            style={{
              width: size * 0.68,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              marginBottom: 3,
            }}
          />
          <View
            style={{
              width: size * 0.68,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
        </View>
      );

    case 'info':
      return (
        <View style={[{ width: size, height: size }, styles.center, style]}>
          <View
            style={{
              width: size * 0.85,
              height: size * 0.85,
              borderRadius: (size * 0.85) / 2,
              borderWidth: 1.8,
              borderColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 2.5,
                height: 2.5,
                borderRadius: 1.25,
                backgroundColor: color,
                marginBottom: 2,
              }}
            />
            <View
              style={{
                width: 2,
                height: size * 0.3,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
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
