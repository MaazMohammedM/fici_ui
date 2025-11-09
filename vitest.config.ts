/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    // Handle CSS imports
    css: true,
    // Handle module resolution
    deps: {
      inline: ['@testing-library/user-event'],
    },
  },
});
