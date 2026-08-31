/**
 * El cable con el servidor.
 *
 * Solo transporte: abre el WebSocket, reconecta cuando se cae y guarda lo que
 * no alcanzó a salir. Quién aplica los eventos es la tienda; aquí no se sabe
 * qué es un proyecto.
 *
 * Lo que se manda mientras no hay red no se pierde: se forma en una cola y
 * sale en cuanto vuelve. Es el caso normal del oficio — se levanta en casas
 * con señal irregular, y perder media hora de captura por un túnel sería
 * exactamente el problema que veníamos a resolver.
 */

const URL_SYNC = () => {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}/sync`
}

let ws = null
let intentos = 0
let reintento = null
let cerradoAdrede = false

/** Eventos mandados que todavía no vuelven sellados por el servidor. */
const pendientes = new Map()

let manejadores = {}

const avisar = (estado) => manejadores.onConexion?.(estado)

function programarReintento() {
  if (cerradoAdrede || reintento) return
  // 1s, 2s, 4s… con techo de 15: insistir cada segundo contra un servidor
  // caído no lo levanta más rápido y sí calienta el teléfono
  const espera = Math.min(15_000, 1000 * 2 ** intentos++)
  reintento = setTimeout(() => {
    reintento = null
    abrir()
  }, espera)
}

function abrir() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  avisar('conectando')
  ws = new WebSocket(URL_SYNC())

  ws.onopen = () => {
    intentos = 0
    avisar('listo')
    // lo que quedó en cola se manda de nuevo: el servidor los aplica igual
    // porque todos los eventos son idempotentes
    for (const ev of pendientes.values()) ws.send(JSON.stringify({ t: 'ev', evento: ev }))
  }

  ws.onmessage = (m) => {
    let msg
    try {
      msg = JSON.parse(m.data)
    } catch {
      return
    }
    if (msg.t === 'hola') manejadores.onHola?.(msg)
    else if (msg.t === 'ev') {
      pendientes.delete(msg.evento.id)
      manejadores.onEvento?.(msg.evento)
    } else if (msg.t === 'presencia') manejadores.onPresencia?.(msg.conectados)
  }

  ws.onclose = () => {
    avisar('caido')
    programarReintento()
  }

  // onerror siempre viene seguido de onclose; reconectar aquí duplicaría
  ws.onerror = () => ws?.close()
}

export function conectar(nuevos) {
  manejadores = nuevos
  cerradoAdrede = false
  abrir()

  /* Un socket cuya red desaparece no se entera: sigue "abierto" hasta que TCP
     se rinde, que pueden ser minutos. Mientras tanto la barra diría que todo
     va bien y lo que se está capturando no le llega a nadie. El navegador sí
     sabe, y lo avisa — hay que preguntarle. */
  addEventListener('offline', () => avisar('caido'))
  addEventListener('online', () => {
    intentos = 0
    clearTimeout(reintento)
    reintento = null
    ws?.close()
    ws = null
    abrir()
  })
}

export function desconectar() {
  cerradoAdrede = true
  clearTimeout(reintento)
  reintento = null
  ws?.close()
  ws = null
}

/** @returns true si salió al aire; false si quedó en cola. */
export function mandar(evento) {
  pendientes.set(evento.id, evento)
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ t: 'ev', evento }))
    return true
  }
  return false
}

export const enCola = () => pendientes.size
