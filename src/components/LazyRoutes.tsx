import React, { Suspense, lazy } from 'react';

// Lazy load route components for code splitting
export const HomePage = lazy(() => import('../features/home/HomePage'));
export const ProductPage = lazy(() => import('../features/product/ProductPage'));
export const CartPage = lazy(() => import('../features/cart/CartPage'));
export const CheckoutPage = lazy(() => import('../features/checkout/CheckoutPage'));
export const AboutPage = lazy(() => import('../features/about/AboutPage'));
export const ContactPage = lazy(() => import('../features/contact/ContactPage'));
export const SignIn = lazy(() => import('../auth/components/SignIn'));
export const Register = lazy(() => import('../auth/components/Register'));

// Loading component for Suspense fallback
export const RouteLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading page...</p>
    </div>
  </div>
);

// Higher-order component for lazy route wrapping
export const withSuspense = (Component: React.ComponentType) => {
  return (props: any) => (
    <Suspense fallback={<RouteLoader />}>
      <Component {...props} />
    </Suspense>
  );
};
