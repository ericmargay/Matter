import crypto from 'node:crypto'

/**
 * Usuarios y sesión.
 *
 * Vivía dentro de `index.js`; se sacó porque ahora también lo necesita el
 * WebSocket, que tiene que saber QUIÉN manda cada cambio. El autor de un
 * evento se toma de aquí y nunca de lo que diga el cliente: si el navegador
 * pudiera declarar su propio nombre, el historial no probaría nada.
 */

const HORAS = 12

export const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')

if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  SESSION_SECRET no está definida: las sesiones mueren en cada despliegue.')
}

/* PANEL_USERS = "margay:scrypt$sal$hash,carpio:scrypt$sal$hash"
   Los hashes se generan con `npm run hash-password`. Nunca se guardan
   contraseñas en claro, ni en el repo ni en las variables de entorno. */
export const USERS = Object.fromEntries(
  (process.env.PANEL_USERS ?? '')
    .split(',')
    .map((par) => par.trim())
    .filter(Boolean)
    .map((par) => {
      const i = par.indexOf(':')
      return [par.slice(0, i).toLowerCase(), par.slice(i + 1)]
    }),
)

export function verificar(usuario, contrasena) {
  const guardado = USERS[String(usuario).toLowerCase().trim()]
  if (!guardado) return false

  const [alg, salBase64, hashBase64] = guardado.split('$')
  if (alg !== 'scrypt') return false

  const esperado = Buffer.from(hashBase64, 'base64')
  const calculado = crypto.scryptSync(contrasena, Buffer.from(salBase64, 'base64'), esperado.length)
  // comparación en tiempo constante: comparar con === filtra información
  return esperado.length === calculado.length && crypto.timingSafeEqual(esperado, calculado)
}

/* ── sesión en cookie firmada ────────────────────────────────────
   Sin base de datos: la cookie lleva usuario y caducidad, y un HMAC que
   impide falsificarla. Suficiente para dos socios; si crecen, esto se
   cambia por una tabla de sesiones. */
const firmar = (datos) => crypto.createHmac('sha256', SECRET).update(datos).digest('base64url')

export function crearSesion(usuario) {
  const datos = Buffer.from(JSON.stringify({ u: usuario, exp: Date.now() + HORAS * 3600e3 })).toString(
    'base64url',
  )
  return `${datos}.${firmar(datos)}`
}

export function leerSesion(cookie) {
  if (!cookie) return null
  const [datos, mac] = cookie.split('.')
  if (!datos || !mac) return null

  const esperado = firmar(datos)
  if (mac.length !== esperado.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(esperado)))
    return null

  try {
    const s = JSON.parse(Buffer.from(datos, 'base64url').toString())
    return s.exp > Date.now() ? s : null
  } catch {
    return null
  }
}

/** Saca la sesión del encabezado Cookie crudo — sirve igual en HTTP y en el
 *  handshake del WebSocket, que no pasa por el middleware de Express. */
export function sesionDeCookies(raw) {
  const par = (raw ?? '').split(';').find((c) => c.trim().startsWith('mtr_s='))
  return par ? leerSesion(par.split('=')[1].trim()) : null
}

export const MAX_EDAD_COOKIE = HORAS * 3600e3

/* ── enlace del cliente ──────────────────────────────────────────
   El cliente no tiene cuenta ni la va a tener. El enlace ES la credencial:
   un HMAC del id del proyecto con el mismo secreto de las sesiones. No hay
   que guardar nada, no caduca, y solo abre UN proyecto y solo su inventario
   —no el levantamiento, no los precios, no el catálogo de operaciones—. */

export function tokenCliente(proyectoId) {
  return `${proyectoId}.${firmar(`inv:${proyectoId}`)}`
}

export function leerTokenCliente(token) {
  if (typeof token !== 'string') return null
  const i = token.lastIndexOf('.')
  if (i < 1) return null
  const id = token.slice(0, i)
  const esperado = firmar(`inv:${id}`)
  const dado = token.slice(i + 1)
  if (dado.length !== esperado.length) return null
  return crypto.timingSafeEqual(Buffer.from(dado), Buffer.from(esperado)) ? id : null
}
