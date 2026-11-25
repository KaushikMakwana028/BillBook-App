/**
 * BillBook Authentication Context
 * Global state provider for user authentication, token storage, and session lifecycle
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import storage from '../utils/storage';
import apiClient from '../services/apiClient';
import authService from '../services/authService';

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

  // Restore session permanently on app launch
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        let storedToken = await storage.getItem(TOKEN_KEY);
        let storedUser = await storage.getItem(USER_KEY);

        if (storedToken) {
          if (!isMounted) return;
          setToken(storedToken);
          apiClient.setToken(storedToken);
          setIsAuthenticated(true);

          if (storedUser) {
            try {
              const parsedUser = typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser;
              setUser(parsedUser);
            } catch {
              // fallback
            }
          }

          // Fetch fresh profile in background
          authService
            .getMyProfile()
            .then((res) => {
              if (res?.status && res?.data && isMounted) {
                setUser(res.data);
                storage.setItem(USER_KEY, JSON.stringify(res.data)).catch(() => {});
              }
            })
            .catch(() => {});
        } else {
          // Fallback: Check if active cookie session exists on server
          try {
            const profileRes = await authService.getMyProfile();
            if (profileRes?.status && profileRes?.data && isMounted) {
              const freshUser = profileRes.data;
              const recoveredToken = freshUser.token || profileRes.token;
              if (recoveredToken) {
                setToken(recoveredToken);
                apiClient.setToken(recoveredToken);
                await storage.setItem(TOKEN_KEY, recoveredToken);
              }
              setUser(freshUser);
              setIsAuthenticated(true);
              await storage.setItem(USER_KEY, JSON.stringify(freshUser));
            }
          } catch {
            // Not authenticated on server
          }
        }
      } catch (err) {
        // Safe silent catch
      } finally {
        if (isMounted) {
          setTimeout(() => {
            setIsLoading(false);
          }, 1000);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Save session permanently to storage and memory state
   */
  const saveSession = useCallback(async (newToken, newUser) => {
    try {
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      apiClient.setToken(newToken);

      if (newToken) {
        await storage.setItem(TOKEN_KEY, String(newToken));
      }
      if (newUser) {
        await storage.setItem(USER_KEY, JSON.stringify(newUser));
      }
    } catch (err) {
      // Safe fallback
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
        await storage.removeItem(TOKEN_KEY);
        await storage.removeItem(USER_KEY);
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
      storage.setItem(USER_KEY, JSON.stringify(merged)).catch(() => {});
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
