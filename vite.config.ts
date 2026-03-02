import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'esbuild', // Use esbuild for minification (default)
  },
  esbuild: {
    drop: ['console', 'debugger'], // Removes all console.* and debugger statements in production
  },
})
