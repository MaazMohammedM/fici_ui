import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths({
      loose: true
    })
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
      }
    ]
  },
  server: {
    hmr: {
      overlay: false
    },
    watch: {
      usePolling: true
    }
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
