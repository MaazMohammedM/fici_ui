import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths({
      loose: true
    }),
    nodePolyfills({
      // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
      include: ['buffer'],
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src').replace(/\\/g, '/')
      },
      {
        find: '@lib',
        replacement: path.resolve(__dirname, './src/lib').replace(/\\/g, '/')
      },
      {
        find: '@components',
        replacement: path.resolve(__dirname, './src/components').replace(/\\/g, '/')
      },
      {
        find: '@features',
        replacement: path.resolve(__dirname, './src/features').replace(/\\/g, '/')
      },
      {
        find: '@types',
        replacement: path.resolve(__dirname, './src/types').replace(/\\/g, '/')
      },
      {
        find: '@store',
        replacement: path.resolve(__dirname, './src/store').replace(/\\/g, '/')
      },
      {
        find: '@auth',
        replacement: path.resolve(__dirname, './src/auth').replace(/\\/g, '/')
      },
      {
        find: '@orders',
        replacement: path.resolve(__dirname, './src/features/orders').replace(/\\/g, '/')
      },
      {
        find: '@checkout',
        replacement: path.resolve(__dirname, './src/features/checkout').replace(/\\/g, '/')
      },
      {
        find: '@hooks',
        replacement: path.resolve(__dirname, './src/hooks').replace(/\\/g, '/')
      }
    ]
  },
  server: {
    hmr: {
      overlay: true  // Enable HMR overlay for better debugging
    }
    // Removed usePolling as it can cause issues
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@supabase/realtime-js']
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Only externalize Node.js modules that Supabase realtime-js needs but can't be polyfilled
        return ['stream', 'http', 'https', 'url', 'zlib', 'util', 'events', 'assert'].includes(id);
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs'],
      strictRequires: true,
      transformMixedEsModules: true
    }
  },
  define: {
    global: 'globalThis'
  }
});
