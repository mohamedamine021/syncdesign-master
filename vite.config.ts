import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  base: './', // ← add this line for Electron to load assets correctly
  server: {
    host: '0.0.0.0',
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true, // Empêche Vite de changer de port tout seul
  }
})