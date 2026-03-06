import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8081,
    strictPort: true,
    host: true,
    hmr: {
        clientPort: 8081
    }
  }
})
