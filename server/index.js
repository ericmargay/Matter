import http from 'node:http'

import { crearApp, montarEstaticos } from './app.js'
import { USERS } from './auth.js'
import { cargar, sembrar } from './registro.js'
import { eventosIniciales } from './seed.js'
import { montarSync } from './sync.js'

/**
 * Servidor de Railway.
 *
 * Sirve el sitio público, el panel detrás de login y el WebSocket por el que
 * los socios se ven trabajar. El orden del arranque importa: primero se carga
 * el registro de cambios —que es de donde sale el estado— y solo entonces se
 * abre el puerto. Si se aceptaran conexiones antes, el primero en entrar
 * vería un panel vacío y creería que se perdió todo.
 */

const PORT = process.env.PORT || 3000

if (Object.keys(USERS).length === 0) {
  console.warn('⚠️  PANEL_USERS vacío: nadie puede entrar al panel.')
}

await cargar()
await sembrar(eventosIniciales())

const app = montarEstaticos(crearApp())
const server = http.createServer(app)
montarSync(server)

server.listen(PORT, () => {
  console.log(`Matter en :${PORT} · panel /panel · usuarios: ${Object.keys(USERS).join(', ') || 'ninguno'}`)
})
