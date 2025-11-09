import { lazy } from 'react';

// Lazy load components for code splitting
export const LazySignIn = lazy(() => import('@auth/components/SignIn'));
export const LazyRegister = lazy(() => import('@auth/components/Register'));
export const LazyAuthCallback = lazy(() => import('@auth/components/AuthCallback'));