// src/hooks/useTrackVisit.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updateTrafficSource } from '../lib/utils/analytics';
import { useAuthStore } from '../store/authStore';

export const useTrackVisit = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user is admin or in development/preview environment
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isNetlifyPreview = window.location.hostname.includes('netlify.app');
    
    // Check admin role from auth store
    let isAdmin = false;
    try {
      const authState = useAuthStore.getState();
      const storeRole = authState?.role;
      const storeUser = authState?.user;
      
      isAdmin = storeRole?.toLowerCase() === 'admin' || 
                storeUser?.user_metadata?.role?.toLowerCase() === 'admin';
      
      // Fallback to localStorage check
      if (!isAdmin) {
        isAdmin = localStorage.getItem('userRole') === 'admin';
      }
    } catch (error) {
      // Fallback to localStorage if store access fails
      isAdmin = localStorage.getItem('userRole') === 'admin';
    }

    // Don't track traffic sources for admin users or development/preview environments
    if (isAdmin || isLocalhost || isNetlifyPreview) {
      return;
    }

    const url = window.location.href;
    const userAgent = navigator.userAgent;
    const referrer = document.referrer;

    const key = `ts_tracked:${new Date().toISOString().split('T')[0]}:${btoa(url).slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    updateTrafficSource(url, userAgent, referrer);
  }, [location.search]);
};