import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

import { MAX_EDAD_COOKIE, USERS, crearSesion, leerTokenCliente, tokenCliente, sesionDeCookies, verificar } from './auth.js'
import { SOCIOS } from './socios.js'
import { registrar, verEstado, verEventos } from './registro.js'

/**
 * La aplicación HTTP.
 *
 * Se separó de `index.js` para que el servidor de desarrollo de Vite pueda
 * montarla tal cual: en local el panel necesita el mismo login y el mismo
 * WebSocket que en Railway, o se prueba una cosa distinta de la que se
 * despliega.
 *
 *   /        → dist/        el sitio público, sin autenticación
 *   /panel/  → dist-admin/  el panel de operaciones, detrás de login
 *   /sync    → WebSocket    los cambios en vivo (lo monta sync.js)
 *
 * Son DOS compilaciones separadas a propósito. Si fueran una sola, el chunk
 * del panel viviría en /assets/ junto a todo lo demás y cualquiera podría
 * pedirlo por su URL — con el catálogo, las tarifas y los márgenes dentro.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

/** En producción SIEMPRE hay usuarios configurados; que no los haya es la
 *  señal de que esto corre en la máquina de alguien. */
export const EN_DESARROLLO = process.env.NODE_ENV !== 'production' && Object.keys(USERS).length === 0

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
  .dev { margin-top:1.25rem; font-size:.72rem; color:#9c9388; line-height:1.6 }
  .dev a { color:#ff9a4d }
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
  ${
    EN_DESARROLLO
      ? `<p class="dev">Desarrollo, sin PANEL_USERS. Entra como
         ${Object.entries(SOCIOS)
           .map(([id, s]) => `<a href="/panel/dev-login?u=${id}">${s.corto}</a>`)
           .join(' · ')}
         — sirve para probar en dos ventanas cómo se ven los cambios del otro.</p>`
      : ''
  }
</form>
</body></html>`

export function crearApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1) // Railway va detrás de proxy: necesario para cookies secure
  app.use(express.urlencoded({ extended: false }))
  // el anexador del cliente manda JSON; el login manda formulario
  app.use(express.json({ limit: '64kb' }))

  app.use((req, _res, next) => {
    req.sesion = sesionDeCookies(req.headers.cookie)
    next()
  })

  app.get('/salud', (_req, res) => res.json({ ok: true }))

  const ponerCookie = (res, usuario) =>
    res.cookie('mtr_s', crearSesion(usuario), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: MAX_EDAD_COOKIE,
    })

  /* ── login ── */
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
    ponerCookie(res, usuario.toLowerCase().trim())
    res.redirect('/panel/')
  })

  /* Atajo de desarrollo: entrar como cualquiera de los socios sin contraseña,
     para poder abrir dos ventanas y ver la sincronización de verdad. Solo
     existe cuando NO hay usuarios configurados, que nunca es el caso en
     producción — ahí PANEL_USERS siempre viene lleno. */
  if (EN_DESARROLLO) {
    app.get('/panel/dev-login', (req, res) => {
      const u = String(req.query.u ?? 'margay').toLowerCase()
      ponerCookie(res, u)
      res.redirect(req.query.volver ? String(req.query.volver) : '/panel/')
    })
  }

  app.post('/panel/logout', (_req, res) => {
    res.clearCookie('mtr_s')
    res.redirect('/panel/login')
  })

  /* ── quién soy y qué hay ──
     El WebSocket ya manda esto al conectarse; el endpoint existe para poder
     revisar el estado con curl sin abrir el navegador. */
  app.get('/api/yo', (req, res) => {
    if (!req.sesion) return res.status(401).json({ error: 'sin sesión' })
    res.json({ usuario: req.sesion.u, socios: SOCIOS })
  })

  app.get('/api/estado', (req, res) => {
    if (!req.sesion) return res.status(401).json({ error: 'sin sesión' })
    res.json({ estado: verEstado(), eventos: verEventos().length })
  })

  // el enlace se arma del lado del servidor: la firma nunca sale al navegador
  app.get('/api/enlace-inventario/:id', (req, res) => {
    if (!req.sesion) return res.status(401).json({ error: 'sin sesión' })
    res.json({ token: tokenCliente(req.params.id) })
  })

  /* ── el inventario del cliente, sin sesión ──
     Lo abre quien tenga el enlace. Devuelve solo el nombre del proyecto y su
     inventario: nada de precios, nada de proveedores, nada del resto del
     levantamiento. El autor del cambio se registra como el cliente, así que
     en el historial se distingue de lo que capturamos nosotros. */
  app.get('/api/inventario/:token', (req, res) => {
    const id = leerTokenCliente(req.params.token)
    if (!id) return res.status(404).json({ error: 'enlace inválido' })
    const pr = verEstado().proyectos.find((p) => p.id === id)
    if (!pr) return res.status(404).json({ error: 'no existe' })
    res.json({
      proyecto: pr.nombre,
      cliente: pr.cliente?.nombre ?? '',
      inv: pr.perfil?.inv ?? [],
      // los espacios del proyecto, para que el cliente ubique cada aparato
      espacios: (pr.rooms ?? []).map((r) => r.nombre),
    })
  })

  app.post('/api/inventario/:token', (req, res) => {
    const id = leerTokenCliente(req.params.token)
    if (!id) return res.status(404).json({ error: 'enlace inválido' })
    const inv = req.body?.inv
    if (!Array.isArray(inv) || inv.length > 200) return res.status(400).json({ error: 'lista inválida' })
    const limpio = inv
      .filter((l) => l && typeof l.id === 'string' && l.id.length < 40)
      .map((l) => ({
        uid: String(l.uid ?? '').slice(0, 40),
        id: l.id,
        modelo: String(l.modelo ?? '').slice(0, 60),
        // de quién es y en qué espacio está: el cliente los contesta mejor
        // que nosotros, porque es su casa
        quien: String(l.quien ?? '').slice(0, 40),
        espacio: String(l.espacio ?? '').slice(0, 60),
        // la nota la escribimos nosotros ("el suyo y el de Gaby"); si el
        // cliente toca su lista no tiene por qué perderse
        nota: String(l.nota ?? '').slice(0, 200),
        creado: String(l.creado ?? '').slice(0, 40) || new Date().toISOString(),
        modificado: l.modificado ? String(l.modificado).slice(0, 40) : null,
      }))
    registrar({ tipo: 'perfil.editar', proyectoId: id, datos: { patch: { inv: limpio } } }, 'cliente')
    res.json({ ok: true, inv: limpio })
  })

  return app
}

/** Los estáticos van aparte: en desarrollo los sirve Vite, no Express. */
export function montarEstaticos(app) {
  app.use('/panel', (req, res, next) => {
    if (req.sesion) return next()
    res.redirect('/panel/login')
  })
  app.use('/panel', express.static(path.join(ROOT, 'dist-admin'), { index: 'index.html' }))
  app.get(/^\/panel(\/.*)?$/, (_req, res) => res.sendFile(path.join(ROOT, 'dist-admin', 'index.html')))

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
  return app
}
