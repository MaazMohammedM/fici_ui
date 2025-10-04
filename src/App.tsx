// src/App.tsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ProtectedRoute from '@auth/ProtectedRoute';

const GuestOrderLookup = lazy(() => import('./features/orders/GuestOrderLookup'));
const OrderDetailsPage = lazy(() => import('./features/orders/OrderDetailsPage'));
import ErrorBoundary from './component/ErrorBoundary';
import Header from 'component/Header';
import Footer from 'component/Footer';
import SEOHead from '@lib/components/SEOHead';
import ScrollToTop from './components/ScrollToTop';

// Lazy-loaded pages
// Import enhanced pages
const HomePage = React.lazy(() => import('@features/home/HomePage'));
const ContactPage = React.lazy(() => import('@features/contact/ContactPage'));
const CartPage = React.lazy(() => import('@features/cart/CartPage'));
const AboutPage = React.lazy(() => import('@features/about/AboutPage'));
const SignIn = React.lazy(() => import('@auth/components/SignIn'));
const Register = React.lazy(() => import('@auth/components/Register'));
const AuthCallback = React.lazy(() => import('@auth/components/AuthCallback'));
const ForgotPassword = React.lazy(() => import('@auth/components/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@auth/components/ResetPassword'));
const ProfilePage = React.lazy(() => import('@features/profile/ProfilePage'));
const AdminPage = React.lazy(() => import('@features/admin/AdminPanel.refactored'));
const ProductPage = React.lazy(() => import('@features/product/ProductPage'));
const ProductDetailPage = React.lazy(() => import('@features/product/components/ProductDetailPage'));
const OrderHistoryPage = React.lazy(() => import('@features/orders/OrderHistoryPage'));
const CheckoutPage = React.lazy(() => import('@features/checkout/CheckoutPage'));
const ShoeCarePage = React.lazy(() => import('@features/shoe-care/ShoeCarePage'));
const WishlistPage = React.lazy(() => import('@features/wishlist/WishlistPage'));
const NotFoundPage = React.lazy(() => import('@features/error/NotFoundPage'));
const PrivacyPolicy = React.lazy(() => import('@features/policy/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('@features/policy/TermsOfService'));
const ShippingReturnsPolicy = React.lazy(() => import('@features/policy/ShippingReturnsPolicy'));

// Loading component
import FiciLoader from './components/ui/FiciLoader';
import FloatingWhatsApp from './components/FloatingWhatsApp';

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4">
    <div className="text-center">
      <FiciLoader size="lg" className="mx-auto mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <ErrorBoundary>
          <div className="min-h-screen flex flex-col bg-gradient-light dark:bg-gradient-dark">
            <SEOHead />
            <Header />
            <main className="flex-1 flex flex-col">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/auth/signin" element={<SignIn />} />
                  <Route path="/auth/signup" element={<Register />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                  <Route path="/auth/reset-password" element={<ResetPassword />} />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/products" element={<ProductPage />} />
                  <Route path="/products/:article_id" element={<ProductDetailPage />} />
                  <Route path="/shoe-care" element={<ShoeCarePage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/shipping" element={<ShippingReturnsPolicy />} />
                  <Route path="/orders" element={
                      <OrderHistoryPage />
                  } />
                  <Route path="/orders/:orderId" element={
                    <Suspense fallback={<FiciLoader />}>
                      <OrderDetailsPage isGuest={false} />
                    </Suspense>
                  } />
                  <Route path="/guest/orders" element={
                    <Suspense fallback={<FiciLoader />}>
                      <GuestOrderLookup />
                    </Suspense>
                  } />
                  <Route path="/guest/orders/:orderId" element={
                    <Suspense fallback={<FiciLoader />}>
                      <OrderDetailsPage isGuest={true} />
                    </Suspense>
                  } />
                  <Route path="/checkout" element={
                    <ErrorBoundary fallback={
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                          <h2 className="text-xl font-semibold mb-4">Checkout Unavailable</h2>
                          <p className="text-gray-600 mb-4">Please try again or contact support.</p>
                          <button 
                            onClick={() => window.location.href = '/cart'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                          >
                            Return to Cart
                          </button>
                        </div>
                      </div>
                    }>
                      <CheckoutPage />
                    </ErrorBoundary>
                  } />
                  <Route
                    path="*"
                    element={
                      <Suspense fallback={<FiciLoader />}>
                        <NotFoundPage />
                      </Suspense>
                    }
                  />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          <FloatingWhatsApp />
        </div>
      </ErrorBoundary>
    </Router>
    </HelmetProvider>

  );
};

export default App;
