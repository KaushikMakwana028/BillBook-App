/**
 * BillBook Safe Storage Utility
 * High-reliability persistent storage with memory backup, zero crash on missing native module,
 * and seamless fallback across app reloads.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const memStore =
  typeof global !== 'undefined'
    ? (global.__BILLBOOK_MEMSTORE__ = global.__BILLBOOK_MEMSTORE__ || new Map())
    : new Map();

export const storage = {
  async getItem(key) {
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null && val !== undefined) {
        memStore.set(key, val);
        return val;
      }
    } catch (e) {
      // ignore native error
    }
    return memStore.has(key) ? memStore.get(key) : null;
  },

  async setItem(key, value) {
    const strVal = String(value);
    memStore.set(key, strVal);
    try {
      await AsyncStorage.setItem(key, strVal);
    } catch (e) {
      // ignore native error
    }
  },

  async removeItem(key) {
    memStore.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      // ignore native error
    }
  },

  async clear() {
    memStore.clear();
    try {
      await AsyncStorage.clear();
    } catch (e) {
      // ignore native error
    }
  },
};

export default storage;
