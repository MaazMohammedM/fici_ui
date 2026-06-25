import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import '@fortawesome/fontawesome-free/css/all.min.css';
import "./lib/fontawesome";
import { AuthProvider } from 'context/AuthContext.tsx';

// Polyfill Buffer for Node.js compatibility (if needed)
if (typeof window !== 'undefined') {
  // Buffer is externalized in Vite config, so we don't import it directly
  // The polyfill is handled in index.html
  window.global = window.global || window;
}

// SSG options for vite-plugin-ssg
export const ssgOptions = {
  includedRoutes: async () => {
    // Static routes
    const staticRoutes = [
      '/',
      '/about',
      '/contact',
      '/products',
      '/shoe-care',
      '/ambur-leather-excellence',
      '/faq',
      '/privacy',
      '/terms',
      '/shipping',
    ];

    // Dynamic routes - fetch from database
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      // Use environment variables for Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials not found, returning static routes only');
        return staticRoutes;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Fetch all products
      const { data: products, error } = await supabase
        .from('products')
        .select('article_id');
      
      if (error) {
        console.error('Error fetching products for SSG:', error);
        return staticRoutes;
      }

      // Generate dynamic product routes
      const productRoutes = products?.map(product => `/products/${product.article_id}`) || [];
      
      return [...staticRoutes, ...productRoutes];
    } catch (error) {
      console.error('Error generating dynamic routes for SSG:', error);
      return staticRoutes;
    }
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
