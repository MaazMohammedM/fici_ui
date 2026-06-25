// Alert utility functions for displaying alerts and notifications

export interface AlertOptions {
  title?: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  showCancel?: boolean;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const showAlert = (options: AlertOptions): void => {
  // This would typically integrate with your alert/modal system
};

export const showSuccessAlert = (message: string, title?: string): void => {
  showAlert({
    title: title || 'Success',
    message,
    type: 'success'
  });
};

export const showErrorAlert = (message: string, title?: string): void => {
  showAlert({
    title: title || 'Error',
    message,
    type: 'error'
  });
};

export const showWarningAlert = (message: string, title?: string): void => {
  showAlert({
    title: title || 'Warning',
    message,
    type: 'warning'
  });
};

export const showInfoAlert = (message: string, title?: string): void => {
  showAlert({
    title: title || 'Info',
    message,
    type: 'info'
  });
};
