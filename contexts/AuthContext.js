/**
 * BillBook Authentication Context
 * Global state provider for user authentication, token storage, and session lifecycle
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import apiClient from '../services/apiClient';
import authService from '../services/authService';

// In-memory fallback if AsyncStorage is not yet linked/installed
const memoryStore = {};
let storageModule = null;

try {
  storageModule = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Use memory store fallback
  storageModule = {
    getItem: async (key) => memoryStore[key] || null,
    setItem: async (key, val) => {
      memoryStore[key] = val;
    },
    removeItem: async (key) => {
      delete memoryStore[key];
    },
  };
}

export const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  sendOtp: async () => {},
  resendOtp: async () => {},
  registerInitiate: async () => {},
  registerComplete: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

const TOKEN_KEY = 'billbook_token';
const USER_KEY = 'billbook_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from storage on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await storageModule.getItem(TOKEN_KEY);
        const storedUser = await storageModule.getItem(USER_KEY);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          apiClient.setToken(storedToken);

          // Fetch fresh profile in background
          authService
            .getMyProfile()
            .then((res) => {
              if (res?.status && res?.data) {
                setUser(res.data);
                storageModule.setItem(USER_KEY, JSON.stringify(res.data));
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        console.warn('Session restoration failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Save session to state and storage
   */
  const saveSession = useCallback(async (newToken, newUser) => {
    try {
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      apiClient.setToken(newToken);

      await storageModule.setItem(TOKEN_KEY, newToken);
      await storageModule.setItem(USER_KEY, JSON.stringify(newUser));
    } catch (err) {
      console.warn('Error saving session:', err);
    }
  }, []);

  /**
   * Step 1: Send Login OTP
   */
  const sendOtp = useCallback(async (mobile) => {
    return await authService.sendLoginOtp(mobile);
  }, []);

  /**
   * Resend Login OTP
   */
  const resendOtp = useCallback(async (mobile) => {
    return await authService.resendLoginOtp(mobile);
  }, []);

  /**
   * Step 2: Verify Login OTP and establish session
   */
  const login = useCallback(
    async (mobile, otp) => {
      const res = await authService.verifyLoginOtp(mobile, otp);
      if (res?.status && res?.data?.token) {
        const userData = res.data.user || {};
        await saveSession(res.data.token, userData);
        return { success: true, message: res.message, user: userData };
      }
      return { success: false, message: res?.message || 'Invalid or expired OTP.' };
    },
    [saveSession]
  );

  /**
   * Step 1: Initiate Registration
   */
  const registerInitiate = useCallback(async (email, mobile) => {
    return await authService.registerUser(email, mobile);
  }, []);

  /**
   * Step 2: Complete Registration & establish session
   */
  const registerComplete = useCallback(
    async (payload) => {
      const res = await authService.verifyRegisterOtp(payload);
      if (res?.status && res?.data?.token) {
        const userData = res.data.user || {};
        await saveSession(res.data.token, userData);
        return { success: true, message: res.message, user: userData };
      }
      return { success: false, message: res?.message || 'Could not verify registration.' };
    },
    [saveSession]
  );

  /**
   * Logout user and clear all stored credentials
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      apiClient.clearToken();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      try {
        await storageModule.removeItem(TOKEN_KEY);
        await storageModule.removeItem(USER_KEY);
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, []);

  /**
   * Update active user profile
   */
  const updateUser = useCallback(async (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      storageModule.setItem(USER_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        sendOtp,
        resendOtp,
        registerInitiate,
        registerComplete,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
