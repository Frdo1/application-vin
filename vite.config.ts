import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Cela injecte la clé API de Vercel dans le code du navigateur de manière sécurisée au moment du build
    // Le || '' empêche le crash si la variable n'est pas encore définie
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
})