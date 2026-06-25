/**
 * Reusable Alert Utility
 * Provides a simple way to show alerts using AlertModal
 */

import React, { useState, useCallback } from 'react';
import AlertModal from '../../components/ui/AlertModal';

interface AlertState {
  isOpen: boolean;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title?: string;
}

let globalAlertState: AlertState | null = null;
let globalSetAlert: React.Dispatch<React.SetStateAction<AlertState | null>> | null = null;

/**
 * Initialize global alert state (call this in your app root)
 */
export const initializeGlobalAlert = () => {
  const [alert, setAlert] = useState<AlertState | null>(null);
  globalAlertState = alert;
  globalSetAlert = setAlert;
  return alert;
};

/**
 * Show alert globally
 */
export const showAlert = (
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info',
  title?: string
) => {
  if (globalSetAlert) {
    globalSetAlert({
      isOpen: true,
      message,
      type,
      title: title || (type.charAt(0).toUpperCase() + type.slice(1))
    });
  } else {
    // Fallback to browser alert if global state not initialized
    console.warn('Global alert not initialized, using browser alert');
    alert(`${title ? `${title}: ` : ''}${message}`);
  }
};

/**
 * Close global alert
 */
export const closeAlert = () => {
  if (globalSetAlert) {
    globalSetAlert(null);
  }
};

/**
 * Alert Modal Component - use this in your app root
 */
export const GlobalAlertModal: React.FC = () => {
  const alert = initializeGlobalAlert();
  
  if (!alert) return null;

  return (
    <AlertModal
      isOpen={alert.isOpen}
      message={alert.message}
      title={alert.title}
      type={alert.type}
      onClose={closeAlert}
    />
  );
};

/**
 * Hook for using alerts in components
 */
export const useAlert = () => {
  const [alert, setAlert] = useState<AlertState | null>(null);

  const showAlertCallback = useCallback((
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    title?: string
  ) => {
    setAlert({
      isOpen: true,
      message,
      type,
      title: title || (type.charAt(0).toUpperCase() + type.slice(1))
    });
  }, []);

  const closeAlertCallback = useCallback(() => {
    setAlert(null);
  }, []);

  return {
    showAlert: showAlertCallback,
    closeAlert: closeAlertCallback,
    alert
  };
};
