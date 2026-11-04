import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // o el framework que uses

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite escuchar en todas las interfaces locales
    port: 5173,
    hmr: {
      host: 'localhost',
    }
  }
})