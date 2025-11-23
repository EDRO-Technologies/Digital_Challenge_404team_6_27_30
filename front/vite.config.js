import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Слушать на всех адресах (для Docker)
    port: 3000,
    watch: {
      usePolling: true // Необходимо для работы горячей перезагрузки в Docker на Windows
    }
  }
})