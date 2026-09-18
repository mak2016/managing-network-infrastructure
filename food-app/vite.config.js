import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works unmodified from any subpath —
  // a GitHub Pages project site, a jsDelivr/raw-CDN mirror, or a local dir.
  base: './',
})
