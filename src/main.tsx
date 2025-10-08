import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { AuthProvider } from 'context/AuthContext.tsx';

// Polyfill Buffer for Node.js compatibility (if needed)
if (typeof window !== 'undefined') {
  // Buffer is externalized in Vite config, so we don't import it directly
  // The polyfill is handled in index.html
  window.global = window.global || window;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);