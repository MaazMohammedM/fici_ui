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
    include: ['react', 'react-dom', 'react-router-dom']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs'],
      strictRequires: true,
      transformMixedEsModules: true
    }
  }
});
