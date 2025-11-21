// src/hooks/useTrackVisit.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updateTrafficSource } from '../lib/utils/analytics';

export const useTrackVisit = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = window.location.href;
    const userAgent = navigator.userAgent;
    const referrer = document.referrer;

    const key = `ts_tracked:${new Date().toISOString().split('T')[0]}:${btoa(url).slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    updateTrafficSource(url, userAgent, referrer);
  }, [location.search]);
};