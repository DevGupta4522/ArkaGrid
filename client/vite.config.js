import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // Load .env from the project root (parent of client/)
  envDir: path.resolve(__dirname, '..'),
  server: {
    port: 3000,
    strictPort: false,
    open: true,
  },
})
