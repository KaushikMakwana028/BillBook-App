/**
 * BillBook Navigation Reference
 * Enables imperative navigation from any context, service, or component
 */

import React from 'react';

// Ref container for React Navigation if installed
export const navigationRef = React.createRef();

let customNavigatorHandler = null;

/**
 * Register a custom navigation handler (used by AppNavigator)
 */
export const setNavigationHandler = (handler) => {
  customNavigatorHandler = handler;
};

/**
 * Navigate to a specific screen
 * @param {string} name - Screen route name
 * @param {object} params - Optional route parameters
 */
export const navigate = (name, params) => {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.navigate(name, params);
  } else if (customNavigatorHandler?.navigate) {
    customNavigatorHandler.navigate(name, params);
  } else {
    console.warn(`[NavigationRef] Navigator is not ready for route "${name}".`);
  }
};

/**
 * Navigate back to previous screen
 */
export const goBack = () => {
  if (navigationRef.current?.isReady() && navigationRef.current.canGoBack()) {
    navigationRef.current.goBack();
  } else if (customNavigatorHandler?.goBack) {
    customNavigatorHandler.goBack();
  }
};

/**
 * Reset navigation stack to a root screen
 */
export const reset = (name, params) => {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name, params }],
    });
  } else if (customNavigatorHandler?.reset) {
    customNavigatorHandler.reset(name, params);
  }
};

export default {
  navigationRef,
  setNavigationHandler,
  navigate,
  goBack,
  reset,
};
