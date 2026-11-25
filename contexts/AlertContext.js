/**
 * BillBook Alert Context & Provider
 * Global, app-wide replacement for default React Native Alert.alert
 * Supplies sleek, animated custom dialogs with brand styling and icon headers.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert from '../components/CustomAlert';

export const AlertContext = createContext({
  showAlert: () => {},
  showConfirm: () => {},
  showSuccess: () => {},
  showError: () => {},
  hideAlert: () => {},
});

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info', // 'success' | 'danger' | 'warning' | 'info'
    buttons: [],
  });

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  /**
   * General Alert Dialog (Single or multiple buttons)
   */
  const showAlert = useCallback(
    ({ title = '', message = '', type = 'info', confirmText = 'OK', onConfirm }) => {
      setAlertConfig({
        visible: true,
        title,
        message,
        type,
        buttons: [
          {
            text: confirmText,
            style: 'default',
            onPress: () => {
              hideAlert();
              if (onConfirm) onConfirm();
            },
          },
        ],
      });
    },
    [hideAlert]
  );

  /**
   * Confirmation Dialog (Cancel + Confirm/Delete buttons)
   */
  const showConfirm = useCallback(
    ({
      title = 'Confirm Action',
      message = '',
      type = 'danger',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      onConfirm,
      onCancel,
    }) => {
      setAlertConfig({
        visible: true,
        title,
        message,
        type,
        buttons: [
          {
            text: cancelText,
            style: 'cancel',
            onPress: () => {
              hideAlert();
              if (onCancel) onCancel();
            },
          },
          {
            text: confirmText,
            style: type === 'danger' ? 'destructive' : 'default',
            onPress: () => {
              hideAlert();
              if (onConfirm) onConfirm();
            },
          },
        ],
      });
    },
    [hideAlert]
  );

  /**
   * Quick Success Alert Helper
   */
  const showSuccess = useCallback(
    ({ title = 'Success', message = '', onConfirm }) => {
      showAlert({
        title,
        message,
        type: 'success',
        confirmText: 'Done',
        onConfirm,
      });
    },
    [showAlert]
  );

  /**
   * Quick Error Alert Helper
   */
  const showError = useCallback(
    ({ title = 'Oops!', message = 'Something went wrong. Please try again.', onConfirm }) => {
      showAlert({
        title,
        message,
        type: 'danger',
        confirmText: 'Close',
        onConfirm,
      });
    },
    [showAlert]
  );

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showConfirm,
        showSuccess,
        showError,
        hideAlert,
      }}
    >
      {children}
      {alertConfig.visible ? (
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={hideAlert}
        />
      ) : null}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);

export default AlertContext;
