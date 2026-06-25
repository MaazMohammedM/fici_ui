import { useEffect, useState } from 'react';
import { useSupabaseConnectivity } from '../../hooks/useSupabaseConnectivity';
import AlertModal from '../../components/ui/AlertModal';

interface AuthConnectivityGuardProps {
  children: React.ReactNode;
}

const SESSION_STORAGE_KEY = 'supabase-connectivity-dismissed';

export const AuthConnectivityGuard: React.FC<AuthConnectivityGuardProps> = ({ children }) => {
  const { isOnline, supabaseReachable, checking, retry } = useSupabaseConnectivity();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(SESSION_STORAGE_KEY);
    
    // Only show modal when we have a definitive result (not checking) and there's an issue
    const shouldShow = !checking && supabaseReachable !== null && (!isOnline || !supabaseReachable) && !dismissed;
    
    if (shouldShow) {
      setShowModal(true);
    } else if (isOnline && supabaseReachable) {
      setShowModal(false);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [checking, isOnline, supabaseReachable]);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    setShowModal(false);
  };

  const handleRetry = () => {
    retry();
  };

  return (
    <>
      {children}
      <AlertModal
        isOpen={showModal}
        title="Unable to Connect"
          message={`We couldn't establish a connection required for sign in, account access, and order management.

Please try one of the following:

• Connect to a Wi-Fi network
• Use a different mobile data provider
• Disable or enable your VPN
• Refresh the website and try again

Need help? Contact FiCi Shoes Support.`}
        type="warning"
        showCancel={true}
        onConfirm={handleRetry}
        confirmText="Retry Connection"
        cancelText="Dismiss"
        onClose={handleDismiss}
      />
    </>
  );
};

export const useAuthConnectivity = () => {
  const { isOnline, supabaseReachable, checking, retry } = useSupabaseConnectivity();
  
  const shouldBlockAction = !checking && (!isOnline || supabaseReachable === false);
  
  return {
    isOnline,
    supabaseReachable,
    checking,
    shouldBlockAction,
    retry
  };
};
