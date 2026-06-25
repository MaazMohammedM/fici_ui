import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSupabaseConnectivityReturn {
  isOnline: boolean;
  supabaseReachable: boolean | null;
  checking: boolean;
  retry: () => void;
}

const DIRECT_SUPABASE_URL = 'https://qegaebazravcwofibtry.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZ2FlYmF6cmF2Y3dvZmlidHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODE4NzksImV4cCI6MjA2OTU1Nzg3OX0.YKP1oM0WIWzuaa47S6OTVEitBalCNqBQxgoLw0yiUg0';
const CHECK_TIMEOUT = 7000; // 7 seconds timeout
const SESSION_STORAGE_KEY = 'supabase-connectivity-dismissed';

// Singleton state to prevent multiple API calls
let singletonState: {
  isOnline: boolean;
  supabaseReachable: boolean | null;
  checking: boolean;
  listeners: Set<() => void>;
  checkInProgress: boolean;
  abortController: AbortController | null;
  eventListenersAdded: boolean;
} | null = null;

const getSingletonState = () => {
  if (!singletonState) {
    singletonState = {
      isOnline: navigator.onLine,
      supabaseReachable: null,
      checking: true,
      listeners: new Set(),
      checkInProgress: false,
      abortController: null,
      eventListenersAdded: false,
    };
  }
  return singletonState;
};

const notifyListeners = () => {
  singletonState?.listeners.forEach(listener => listener());
};

export const useSupabaseConnectivity = (): UseSupabaseConnectivityReturn => {
  const [localState, setLocalState] = useState(() => getSingletonState());
  const forceUpdate = useCallback(() => {
    setLocalState({ ...getSingletonState() });
  }, []);

  useEffect(() => {
    const state = getSingletonState();
    state.listeners.add(forceUpdate);
    return () => {
      state.listeners.delete(forceUpdate);
    };
  }, [forceUpdate]);

  // Check Supabase connectivity
  const checkSupabaseConnectivity = useCallback(async (): Promise<boolean> => {
    const state = getSingletonState();
    
    if (state.checkInProgress) {
      return state.supabaseReachable === true;
    }

    state.checkInProgress = true;
    notifyListeners();

    // Cancel any existing request
    if (state.abortController) {
      state.abortController.abort();
    }

    const controller = new AbortController();
    state.abortController = controller;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), CHECK_TIMEOUT);
      });

      // Use HEAD request to Supabase REST API with proper authentication
      const fetchPromise = fetch(`${DIRECT_SUPABASE_URL}/rest/v1/products`, {
        method: 'HEAD',
        mode: 'cors' as RequestMode,
        credentials: 'omit' as RequestCredentials,
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      // If we get any response (even 401), the server is reachable
      if (response instanceof Response) {
        state.supabaseReachable = true;
        notifyListeners();
        return true;
      }
      
      state.supabaseReachable = true;
      notifyListeners();
      return true;
    } catch (error) {
      // Check if it's a network error (unreachable)
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Abort errors happen during cleanup, but if supabaseReachable is still null (initial check), treat as unreachable
      if (errorMessage.includes('abort') || errorMessage.includes('AbortError')) {
        if (state.supabaseReachable === null) {
          state.supabaseReachable = false;
          notifyListeners();
          return false;
        }
        // Return current state without updating it for subsequent aborts
        return state.supabaseReachable === true;
      }
      
      // If it's a timeout or network error, it's unreachable
      if (errorMessage.includes('Timeout') || 
          errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('ECONNREFUSED') ||
          errorMessage.includes('ERR_NAME_NOT_RESOLVED')) {
        state.supabaseReachable = false;
        notifyListeners();
        return false;
      }
      
      // If it's an auth error (401), the server is actually reachable
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        state.supabaseReachable = true;
        notifyListeners();
        return true;
      }
      
      // For any other error, treat as unreachable to ensure modal shows
      state.supabaseReachable = false;
      notifyListeners();
      return false;
    } finally {
      state.checkInProgress = false;
      state.abortController = null;
      notifyListeners();
    }
  }, []);

  // Initial check on mount - only run once
  useEffect(() => {
    const state = getSingletonState();
    
    // Only perform initial check if it hasn't been done yet
    if (state.checking && state.supabaseReachable === null) {
      const performInitialCheck = async () => {
        state.checking = true;
        notifyListeners();
        try {
          await checkSupabaseConnectivity();
        } finally {
          state.checking = false;
          notifyListeners();
        }
      };

      performInitialCheck();
    }
  }, [checkSupabaseConnectivity]);

  // Listen for online/offline events - only add listeners once globally
  useEffect(() => {
    const state = getSingletonState();
    
    // Only add listeners if they haven't been added yet
    if (!state.eventListenersAdded) {
      state.eventListenersAdded = true;
      
      const handleOnline = () => {
        state.isOnline = true;
        notifyListeners();
        // Automatically recheck when network returns
        checkSupabaseConnectivity().then((reachable) => {
          if (reachable) {
            // Clear dismissed state when connectivity is restored
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
        });
      };

      const handleOffline = () => {
        state.isOnline = false;
        state.supabaseReachable = false;
        notifyListeners();
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        state.eventListenersAdded = false;
      };
    }
  }, [checkSupabaseConnectivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const state = getSingletonState();
      if (state.abortController) {
        state.abortController.abort();
      }
    };
  }, []);

  // Manual retry function
  const retry = useCallback(() => {
    const state = getSingletonState();
    state.checking = true;
    notifyListeners();
    checkSupabaseConnectivity().then(() => {
      state.checking = false;
      notifyListeners();
    });
  }, [checkSupabaseConnectivity]);

  return {
    isOnline: localState.isOnline,
    supabaseReachable: localState.supabaseReachable,
    checking: localState.checking,
    retry,
  };
};
