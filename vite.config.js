import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * En GitHub Pages el sitio no vive en la raíz del dominio sino en
 * /<repo>/, así que todo lo que apunte a una ruta absoluta tiene que
 * llevar ese prefijo. Vite lo inyecta en el HTML y el CSS; lo que se pide
 * en tiempo de ejecución (los modelos) usa `import.meta.env.BASE_URL`.
 *
 * En Railway o cualquier host propio se despliega en la raíz:
 *   BASE_PATH=/ npm run build
 */
const BASE = process.env.BASE_PATH ?? '/Matter/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // three cambia poco y pesa mucho: separarlo hace que el caché del
        // navegador sobreviva a los deploys de contenido.
        // (rolldown solo acepta la forma de función)
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('@react-three') || id.includes('node_modules/postprocessing')) return 'r3f'
          return null
        },
      },
    },
  },
}))
