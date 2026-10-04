import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    include: /src\/.*\.(js|ts|tsx)$/,
    exclude: [],
    loader: 'tsx',
    jsx: 'automatic'
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js'
  }
});
