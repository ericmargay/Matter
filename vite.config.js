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

/**
 * En desarrollo el panel necesita lo mismo que en Railway: el login, el
 * registro de cambios y el WebSocket por el que los socios se sincronizan.
 * En vez de levantar un segundo proceso y andar con dos puertos, se monta el
 * servidor de verdad dentro del de Vite. Se prueba lo que se despliega.
 *
 * El import es dinámico y va dentro del hook: en `vite build` este plugin no
 * corre, y no tiene por qué arrastrar Express al proceso de compilación.
 */
function servidorDeOperaciones() {
  return {
    name: 'matter-operaciones',
    apply: 'serve',
    async configureServer(vite) {
      const [{ crearApp }, registro, { eventosIniciales }, { montarSync }] = await Promise.all([
        import('./server/app.js'),
        import('./server/registro.js'),
        import('./server/seed.js'),
        import('./server/sync.js'),
      ])

      await registro.cargar()
      await registro.sembrar(eventosIniciales())

      // sin montarEstaticos: en desarrollo los archivos los sirve Vite
      vite.middlewares.use(crearApp())
      montarSync(vite.httpServer)
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? BASE : '/',
  plugins: [react(), tailwindcss(), servidorDeOperaciones()],
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
