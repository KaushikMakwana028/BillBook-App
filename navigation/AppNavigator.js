/**
 * BillBook Main Application Navigator
 * Manages screen routing between Authentication (Login / Register / OtpVerify)
 * and Authenticated App Tabs (Home / Sales / Products / Parties / Profile / Subscreens)
 * Intercepts Android hardwareBackPress to ensure physical phone back buttons
 * smoothly navigate backwards rather than prematurely exiting the app.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, BackHandler } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LoginScreen,
  RegisterScreen,
  OtpVerifyScreen,
  HomeScreen,
  SalesScreen,
  ProductsScreen,
  ProductDetailScreen,
  AddProductScreen,
  EditProductScreen,
  CategoriesScreen,
  PartiesScreen,
  ProfileScreen,
  EditProfileScreen,
  SaleDetailScreen,
  CreateSaleScreen,
  InvoiceTemplatesScreen,
  SplashScreen,
} from '../screens';
import { setNavigationHandler } from './navigationRef';
import { FONT_FAMILY } from '../components/fonts';
import { Icon } from '../components/Icon';

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  // Screen state for unauthenticated flow
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [screenParams, setScreenParams] = useState({});

  // Active tab state for authenticated flow: 'Home' | 'Sales' | 'Products' | 'Parties' | 'Profile'
  const [activeTab, setActiveTab] = useState('Home');

  // Navigation History Stack for sub-screen drill-downs
  const [navHistory, setNavHistory] = useState([]);

  // Handle Tab and Screen switching
  const handleNavigate = (target, params = {}) => {
    const normal = String(target).toLowerCase();

    if (normal === 'home') {
      setActiveTab('Home');
      setCurrentScreen('');
      setNavHistory([]);
      setScreenParams({});
    } else if (normal === 'sales' || normal === 'invoices') {
      setActiveTab('Sales');
      setCurrentScreen('');
      setNavHistory([]);
      setScreenParams(params || {});
    } else if (normal === 'products' || normal === 'catalog') {
      setActiveTab('Products');
      setCurrentScreen('');
      setNavHistory([]);
      setScreenParams({});
    } else if (normal === 'parties' || normal === 'customers') {
      setActiveTab('Parties');
      setCurrentScreen('');
      setNavHistory([]);
      setScreenParams({});
    } else if (normal === 'profile' || normal === 'settings') {
      setActiveTab('Profile');
      setCurrentScreen('');
      setNavHistory([]);
      setScreenParams({});
    } else {
      // Sub-screen navigation: push current state into history
      setNavHistory((prev) => [
        ...prev,
        { screen: currentScreen, tab: activeTab, params: screenParams },
      ]);
      setScreenParams(params);
      setCurrentScreen(target);
    }
  };

  const handleGoBack = () => {
    // 1. Pop from navigation history if available
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory((hist) => hist.slice(0, -1));

      if (prev.screen && prev.screen !== '') {
        setCurrentScreen(prev.screen);
        setScreenParams(prev.params || {});
      } else {
        setCurrentScreen('');
        setActiveTab(prev.tab || 'Home');
        setScreenParams({});
      }
      return;
    }

    // 2. Deterministic Fallbacks
    if (currentScreen === 'ProductDetail') {
      setCurrentScreen('');
      setActiveTab('Products');
    } else if (currentScreen === 'EditProduct') {
      setCurrentScreen('ProductDetail');
    } else if (currentScreen === 'AddProduct') {
      setCurrentScreen('');
      setActiveTab('Products');
    } else if (currentScreen === 'Categories') {
      setCurrentScreen('');
      setActiveTab('Products');
    } else if (currentScreen === 'EditProfile') {
      setCurrentScreen('');
      setActiveTab('Profile');
    } else if (currentScreen === 'SaleDetail') {
      setCurrentScreen('');
      setActiveTab('Sales');
    } else if (currentScreen === 'CreateSale') {
      setCurrentScreen('');
      setActiveTab('Sales');
    } else if (currentScreen === 'InvoiceTemplates') {
      setCurrentScreen('');
      setActiveTab('Profile');
    } else if (currentScreen === 'OtpVerify' || currentScreen === 'Otp') {
      setCurrentScreen(screenParams.mode === 'register' ? 'Register' : 'Login');
    } else if (currentScreen === 'Register') {
      setCurrentScreen('Login');
    } else if (activeTab !== 'Home') {
      setActiveTab('Home');
    }
  };

  // Android Hardware Back Button Interception
  useEffect(() => {
    const onBackPress = () => {
      // If currently on any authenticated sub-screen -> go back to previous screen
      if (
        isAuthenticated &&
        [
          'ProductDetail',
          'EditProduct',
          'AddProduct',
          'Categories',
          'EditProfile',
          'SaleDetail',
          'CreateSale',
          'InvoiceTemplates',
        ].includes(currentScreen)
      ) {
        handleGoBack();
        return true; // Prevents app from closing!
      }

      // If in unauthenticated flow sub-screen -> go back
      if (!isAuthenticated) {
        if (currentScreen === 'OtpVerify' || currentScreen === 'Otp') {
          handleGoBack();
          return true;
        }
        if (currentScreen === 'Register') {
          setCurrentScreen('Login');
          return true;
        }
        // Exit app on root login screen
        return false;
      }

      // If on any tab screen other than Home -> go back to Home tab
      if (isAuthenticated && activeTab !== 'Home') {
        setActiveTab('Home');
        return true;
      }

      // On root Home screen: allow Android OS to exit/minimize
      return false;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => backSubscription.remove();
  }, [currentScreen, activeTab, isAuthenticated, screenParams, navHistory]);

  // Bind custom navigation handler to navigationRef
  useEffect(() => {
    setNavigationHandler({
      navigate: (screenName, params = {}) => {
        handleNavigate(screenName, params);
      },
      goBack: handleGoBack,
      reset: (screenName, params = {}) => {
        handleNavigate(screenName, params);
      },
    });
  }, [currentScreen, screenParams, activeTab, navHistory]);

  // Startup Splash / Loader Screen with Full Horizontal Logo
  if (isLoading) {
    return <SplashScreen />;
  }

  // Navigation object to pass to screens
  const navigationObj = {
    navigate: handleNavigate,
    goBack: handleGoBack,
  };

  // ─────────────────────────────────────────
  // AUTHENTICATED STATE -> Render Main Tab Screens or Sub-screens
  // ─────────────────────────────────────────
  if (isAuthenticated) {
    if (currentScreen === 'ProductDetail') {
      return (
        <ProductDetailScreen
          navigation={navigationObj}
          route={{ params: screenParams }}
          params={screenParams}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
        />
      );
    }

    if (currentScreen === 'AddProduct') {
      return (
        <AddProductScreen
          navigation={navigationObj}
          route={{ params: screenParams }}
          params={screenParams}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
        />
      );
    }

    if (currentScreen === 'EditProduct') {
      return (
        <EditProductScreen
          navigation={navigationObj}
          route={{ params: screenParams }}
          params={screenParams}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
        />
      );
    }

    if (currentScreen === 'Categories') {
      return (
        <CategoriesScreen
          navigation={navigationObj}
          route={{ params: screenParams }}
          params={screenParams}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
        />
      );
    }

    if (currentScreen === 'EditProfile') {
      return (
        <EditProfileScreen
          navigation={navigationObj}
          route={{ params: screenParams }}
          params={screenParams}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
        />
      );
    }

    if (currentScreen === 'SaleDetail') {
      return (
        <SaleDetailScreen
          navigation={navigationObj}
          route={{ params: screenParams }}
          params={screenParams}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
        />
      );
    }

    if (currentScreen === 'CreateSale' || currentScreen === 'AddSale') {
      return (
        <CreateSaleScreen
          navigation={navigationObj}
          route={{ params: screenParams }}
          params={screenParams}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
        />
      );
    }

    if (currentScreen === 'InvoiceTemplates') {
      return (
        <InvoiceTemplatesScreen
          navigation={navigationObj}
          route={{ params: screenParams }}
          params={screenParams}
          onNavigate={handleNavigate}
          onGoBack={handleGoBack}
        />
      );
    }

    switch (activeTab) {
      case 'Sales':
        return (
          <SalesScreen
            navigation={navigationObj}
            route={{ params: screenParams }}
            params={screenParams}
            onNavigate={handleNavigate}
          />
        );
      case 'Products':
        return (
          <ProductsScreen
            navigation={navigationObj}
            route={{ params: screenParams }}
            params={screenParams}
            onNavigate={handleNavigate}
          />
        );
      case 'Parties':
        return (
          <PartiesScreen
            navigation={navigationObj}
            route={{ params: screenParams }}
            params={screenParams}
            onNavigate={handleNavigate}
          />
        );
      case 'Profile':
        return (
          <ProfileScreen
            navigation={navigationObj}
            route={{ params: screenParams }}
            params={screenParams}
            onNavigate={handleNavigate}
          />
        );
      case 'Home':
      default:
        return (
          <HomeScreen
            navigation={navigationObj}
            route={{ params: screenParams }}
            params={screenParams}
            onNavigate={handleNavigate}
          />
        );
    }
  }

  // ─────────────────────────────────────────
  // UNAUTHENTICATED STATE -> Render Auth Stack
  // ─────────────────────────────────────────
  if (currentScreen === 'OtpVerify' || currentScreen === 'Otp') {
    return (
      <OtpVerifyScreen
        navigation={navigationObj}
        params={screenParams}
        onGoBack={() => {
          setCurrentScreen(screenParams.mode === 'register' ? 'Register' : 'Login');
        }}
      />
    );
  }

  if (currentScreen === 'Register') {
    return (
      <RegisterScreen
        navigation={navigationObj}
        onNavigateToLogin={() => setCurrentScreen('Login')}
        onNavigateToOtp={(otpParams) => {
          setScreenParams(otpParams);
          setCurrentScreen('OtpVerify');
        }}
      />
    );
  }

  return (
    <LoginScreen
      navigation={navigationObj}
      onNavigateToRegister={() => setCurrentScreen('Register')}
      onNavigateToOtp={(otpParams) => {
        setScreenParams(otpParams);
        setCurrentScreen('OtpVerify');
      }}
    />
  );
};

export default AppNavigator;
