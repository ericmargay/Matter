import { WebSocketServer } from 'ws'

import { sesionDeCookies } from './auth.js'
import { registrar, ultimoSeq, verEstado, verEventos } from './registro.js'
import { SOCIOS, socio } from './socios.js'

/**
 * Sincronización en vivo entre socios.
 *
 * Cada panel abierto mantiene un WebSocket. Cuando alguien cambia algo, su
 * navegador manda el evento, el servidor le pone autor y hora y lo reparte a
 * todos los demás. No hay "guardar": el cambio ya viajó.
 *
 * La conexión pasa por el mismo login del panel — se lee la cookie de sesión
 * en el handshake. Sin sesión válida no hay socket, así que el registro no
 * puede recibir cambios de nadie de fuera.
 */

/** Tipos que el servidor acepta. Un cliente no puede inventar operaciones. */
const TIPOS = new Set([
  'proyecto.crear',
  'proyecto.editar',
  'proyecto.eliminar',
  'cliente.editar',
  'obra.editar',
  'perfil.editar',
  'servicios.editar',
  'cuarto.agregar',
  'cuarto.editar',
  'cuarto.eliminar',
  'cuartos.reordenar',
  'equipo.cantidad',
  'equipo.vaciar',
  'plano.editar',
])

/** Un evento honesto no pesa ni 2 kB; el tope corta cualquier abuso. */
const MAX_BYTES = 64 * 1024

export function montarSync(server) {
  // noServer: el upgrade se atiende a mano para poder rechazar por sesión
  // antes de que el socket exista
  const wss = new WebSocketServer({ noServer: true })
  const vivos = new Map() // ws -> { usuario, id }

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://x')
    if (url.pathname !== '/sync') return

    const sesion = sesionDeCookies(req.headers.cookie)
    if (!sesion) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req, sesion))
  })

  const aTodos = (mensaje) => {
    const texto = JSON.stringify(mensaje)
    for (const ws of wss.clients) if (ws.readyState === ws.OPEN) ws.send(texto)
  }

  /** Va a todos, incluido quien acaba de entrar: él también quiere saber
   *  quién más está adentro. */
  const presencia = () =>
    aTodos({ t: 'presencia', conectados: [...new Set([...vivos.values()].map((v) => v.usuario))] })

  wss.on('connection', (ws, _req, sesion) => {
    vivos.set(ws, { usuario: sesion.u })
    ws.estaVivo = true
    ws.on('pong', () => {
      ws.estaVivo = true
    })

    ws.send(
      JSON.stringify({
        t: 'hola',
        usuario: sesion.u,
        socios: SOCIOS,
        seq: ultimoSeq(),
        estado: verEstado(),
        eventos: verEventos(),
      }),
    )
    presencia()

    ws.on('message', (crudo) => {
      if (crudo.length > MAX_BYTES) return
      let msg
      try {
        msg = JSON.parse(crudo)
      } catch {
        return
      }

      if (msg.t !== 'ev' || !msg.evento || !TIPOS.has(msg.evento.tipo)) return

      const { tipo, proyectoId, datos, id } = msg.evento
      // el autor sale de la sesión: lo que el cliente diga al respecto se tira
      const ev = registrar({ id, tipo, proyectoId, datos }, sesion.u)

      // se devuelve también a quien lo mandó, para que cambie su copia
      // optimista por la sellada (con seq, autor y hora del servidor)
      aTodos({ t: 'ev', evento: ev })
    })

    ws.on('close', () => {
      vivos.delete(ws)
      presencia()
    })
  })

  /* Un socket que se cae sin avisar (tapa del laptop, túnel) queda abierto del
     lado del servidor y falsearía la presencia. El ping lo detecta. */
  const latido = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.estaVivo) {
        vivos.delete(ws)
        ws.terminate()
        continue
      }
      ws.estaVivo = false
      ws.ping()
    }
  }, 30_000)

  wss.on('close', () => clearInterval(latido))

  return { wss, socios: SOCIOS, socio }
}
