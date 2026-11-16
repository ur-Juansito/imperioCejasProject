import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // O el plugin que uses
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})