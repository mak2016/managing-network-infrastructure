import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Project pages are served from /<repo>/, not the domain root.
  base: process.env.GITHUB_PAGES ? '/managing-network-infrastructure/' : '/',
})
