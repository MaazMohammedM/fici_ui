// src/hooks/useTrackVisit.ts
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { updateTrafficSource } from '../lib/utils/analytics';
import { useAuthStore } from '../store/authStore';

export const useTrackVisit = () => {
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const { user, role, loading, initialized } = useAuthStore();

  useEffect(() => {
    // Wait for auth store to be initialized
    if (!initialized) return;

    // Mark auth as checked
    if (!authChecked) {
      setAuthChecked(true);
    }
  }, [initialized, authChecked]);

  useEffect(() => {
    // Only proceed with tracking if auth is checked
    if (!authChecked) return;

    if (typeof window === 'undefined') return;

    // Check if user is admin before tracking
    const isAdmin = role?.toLowerCase() === 'admin' || 
                    user?.user_metadata?.role?.toLowerCase() === 'admin' ||
                    localStorage.getItem('userRole') === 'admin';

    // Skip tracking for admin users
    if (isAdmin) {
      console.log('Skipping traffic source tracking for admin user');
      return;
    }

    const url = window.location.href;
    const userAgent = navigator.userAgent;
    const referrer = document.referrer;

    const key = `ts_tracked:${new Date().toISOString().split('T')[0]}:${btoa(url).slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    updateTrafficSource(url, userAgent, referrer);
  }, [location.search, authChecked, user, role, initialized]);
};