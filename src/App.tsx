// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './component/ErrorBoundary';
import Header from 'component/Header';
import Footer from 'component/Footer';

// Lazy-loaded pages
const HomePage = React.lazy(() => import('@features/home/HomePage'));
const ContactPage = React.lazy(() => import('@features/contact/ContactPage'));
const CartPage = React.lazy(() => import('@features/cart/CartPage'));
const AboutPage = React.lazy(() => import('@features/about/AboutPage'));
const SignIn = React.lazy(() => import('@auth/components/SignIn'));
const Register = React.lazy(() => import('@auth/components/Register'));
const AuthCallback = React.lazy(() => import('@auth/components/AuthCallback'));
const AdminPage = React.lazy(() => import('@features/admin/AdminPanel'));
const ProductPage = React.lazy(() => import('@features/product/ProductPage'));
const ProductDetailPage = React.lazy(() => import('@features/product/components/ProductDetailPage'));
const OrderHistoryPage = React.lazy(() => import('@features/orders/OrderHistoryPage'));
const CheckoutPage = React.lazy(() => import('@features/checkout/CheckoutPage'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark flex items-center justify-center px-4">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col bg-gradient-light dark:bg-gradient-dark">
          <Header />
          <main className="flex-1 flex flex-col">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/cartpage" element={<CartPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/auth/signin" element={<SignIn />} />
                <Route path="/auth/signup" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/products" element={<ProductPage />} />
                <Route path="/products/:article_id" element={<ProductDetailPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route
                  path="*"
                  element={
                    <div className="text-primary dark:text-secondary text-center text-2xl font-bold w-full h-[calc(100svh-8rem)] flex items-center justify-center bg-gradient-light dark:bg-gradient-dark">
                      404 Not Found
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
