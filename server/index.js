import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

/**
 * Servidor de Railway.
 *
 * Sirve dos cosas distintas desde el mismo proceso:
 *
 *   /        → dist/        el sitio público, sin autenticación
 *   /panel/  → dist-admin/  el panel de operaciones, detrás de login
 *
 * Son DOS compilaciones separadas a propósito. Si fueran una sola, el chunk
 * del panel viviría en /assets/ junto a todo lo demás y cualquiera podría
 * pedirlo por su URL — con el catálogo, las tarifas y los márgenes dentro.
 * Al vivir en otra carpeta, el middleware de sesión lo cubre de verdad.
 *
 * El login no se puede hacer en el cliente: el ruteo del sitio es por hash
 * (#/admin) y el hash nunca llega al servidor. Por eso el panel cuelga de
 * una ruta real.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const PORT = process.env.PORT || 3000
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')
const HORAS = 12

if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  SESSION_SECRET no está definida: las sesiones mueren en cada despliegue.')
}

/* ── usuarios ─────────────────────────────────────────────────────
   PANEL_USERS = "margay:scrypt$sal$hash,carpio:scrypt$sal$hash"
   Los hashes se generan con `npm run hash-password`. Nunca se guardan
   contraseñas en claro, ni en el repo ni en las variables de entorno. */
const USERS = Object.fromEntries(
  (process.env.PANEL_USERS ?? '')
    .split(',')
    .map((par) => par.trim())
    .filter(Boolean)
    .map((par) => {
      const i = par.indexOf(':')
      return [par.slice(0, i).toLowerCase(), par.slice(i + 1)]
    }),
)

if (Object.keys(USERS).length === 0) {
  console.warn('⚠️  PANEL_USERS vacío: nadie puede entrar al panel.')
}

function verificar(usuario, contrasena) {
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

function crearSesion(usuario) {
  const datos = Buffer.from(JSON.stringify({ u: usuario, exp: Date.now() + HORAS * 3600e3 })).toString('base64url')
  return `${datos}.${firmar(datos)}`
}

function leerSesion(cookie) {
  if (!cookie) return null
  const [datos, mac] = cookie.split('.')
  if (!datos || !mac) return null

  const esperado = firmar(datos)
  if (mac.length !== esperado.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(esperado))) return null

  try {
    const s = JSON.parse(Buffer.from(datos, 'base64url').toString())
    return s.exp > Date.now() ? s : null
  } catch {
    return null
  }
}

/* ── app ──────────────────────────────────────────────────────── */
const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1) // Railway va detrás de proxy: necesario para cookies secure
app.use(express.urlencoded({ extended: false }))

app.use((req, _res, next) => {
  const raw = req.headers.cookie ?? ''
  const par = raw.split(';').find((c) => c.trim().startsWith('mtr_s='))
  req.sesion = par ? leerSesion(par.split('=')[1]) : null
  next()
})

app.get('/salud', (_req, res) => res.json({ ok: true }))

/* ── login ── */
const paginaLogin = (error = '') => `<!doctype html>
<html lang="es-MX"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Matter · Operaciones</title>
<link rel="icon" href="/matter.svg">
<style>
  :root { color-scheme: dark }
  * { box-sizing: border-box }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; background:#0a0908; color:#f7f2ea;
         font-family: Inter, ui-sans-serif, system-ui, sans-serif; padding:1.5rem }
  form { width:100%; max-width:20rem }
  h1 { font-size:1.35rem; font-weight:400; letter-spacing:-.02em; margin:0 0 .35rem }
  p.sub { margin:0 0 1.75rem; font-size:.8rem; color:#9c9388 }
  label { display:block; font-size:.65rem; letter-spacing:.12em; text-transform:uppercase; color:#9c9388; margin-bottom:.35rem }
  input { width:100%; padding:.6rem .7rem; margin-bottom:1rem; border-radius:.6rem; border:1px solid #2a2521;
          background:#131110; color:#f7f2ea; font-size:.9rem; outline:none }
  input:focus { border-color:#ff9a4d }
  button { width:100%; padding:.65rem; border:0; border-radius:.6rem; background:#ff9a4d; color:#0a0908;
           font-size:.9rem; font-weight:500; cursor:pointer }
  button:hover { background:#ffc48a }
  .err { background:rgba(255,77,77,.1); border:1px solid rgba(255,77,77,.35); color:#ffb4b4;
         padding:.5rem .7rem; border-radius:.5rem; font-size:.8rem; margin-bottom:1rem }
  .logo { display:flex; align-items:center; gap:.6rem; margin-bottom:1.5rem }
</style></head><body>
<form method="post" action="/panel/login">
  <div class="logo">
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <path d="M6 22V12.5L16 7l10 5.5V22" stroke="#f7f2ea" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="16" cy="17" r="3" fill="#ff9a4d"/>
    </svg>
    <strong style="font-weight:400;font-size:1.05rem">Matter</strong>
  </div>
  <h1>Operaciones</h1>
  <p class="sub">Catálogo, levantamientos y cotizaciones.</p>
  ${error ? `<div class="err">${error}</div>` : ''}
  <label for="u">Usuario</label>
  <input id="u" name="usuario" autocomplete="username" autocapitalize="off" autofocus required>
  <label for="p">Contraseña</label>
  <input id="p" name="contrasena" type="password" autocomplete="current-password" required>
  <button type="submit">Entrar</button>
</form>
</body></html>`

app.get('/panel/login', (req, res) => {
  if (req.sesion) return res.redirect('/panel/')
  res.type('html').send(paginaLogin())
})

app.post('/panel/login', (req, res) => {
  const { usuario = '', contrasena = '' } = req.body
  if (!verificar(usuario, contrasena)) {
    // el mismo mensaje para usuario inexistente y contraseña mala: decir
    // cuál falló le regala al atacante la mitad del trabajo
    return res.status(401).type('html').send(paginaLogin('Usuario o contraseña incorrectos.'))
  }
  res.cookie('mtr_s', crearSesion(usuario.toLowerCase().trim()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: HORAS * 3600e3,
  })
  res.redirect('/panel/')
})

app.post('/panel/logout', (_req, res) => {
  res.clearCookie('mtr_s')
  res.redirect('/panel/login')
})

/* ── panel, ya protegido ── */
app.use('/panel', (req, res, next) => {
  if (req.sesion) return next()
  res.redirect('/panel/login')
})
app.use('/panel', express.static(path.join(ROOT, 'dist-admin'), { index: 'index.html' }))
app.get(/^\/panel(\/.*)?$/, (_req, res) => res.sendFile(path.join(ROOT, 'dist-admin', 'index.html')))

/* ── sitio público ── */
app.use(
  express.static(path.join(ROOT, 'dist'), {
    // los assets llevan hash en el nombre: se pueden cachear para siempre
    setHeaders(res, file) {
      if (file.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }
    },
  }),
)
app.get(/.*/, (_req, res) => res.sendFile(path.join(ROOT, 'dist', 'index.html')))

app.listen(PORT, () => {
  console.log(`Matter en :${PORT} · panel /panel · usuarios: ${Object.keys(USERS).join(', ') || 'ninguno'}`)
})
