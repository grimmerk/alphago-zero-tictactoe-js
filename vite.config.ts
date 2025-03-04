import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  // Base path for GitHub Pages deployment
  base: '/alphago-zero-tictactoe-js/',
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      globals: {
        Buffer: true,
        global: true,
        process: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'buffer': 'buffer',
    },
  },
  define: {
    // This ensures compatibility with react-scripts
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || ''),
    // This helps with libraries that assume Node.js globals exist
    global: 'window',
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      // Externalize dependencies that can't be bundled correctly
      external: [],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Enable node globals for libraries that depend on them
      define: {
        global: 'globalThis',
      },
    },
  },
});