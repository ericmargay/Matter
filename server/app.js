import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

import { MAX_EDAD_COOKIE, USERS, crearSesion, leerTokenCliente, tokenCliente, sesionDeCookies, verificar } from './auth.js'
import { SOCIOS } from './socios.js'
import { acortar, alRegistrar, enlacesCortos, registrar, resolver, ultimoSeq, verEstado, verEventos } from './registro.js'
import { DEVICE_BY_ID } from '../src/content/catalog.js'

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

  /* ── el acortador ──
     `/i/<codigo>` redirige. Va antes que los estáticos y usa un prefijo de
     una letra para no chocar con ninguna ruta del sitio. */
  /* Los robots que arman la vista previa —WhatsApp, Telegram, Slack— piden la
     URL y leen sus etiquetas Open Graph. Si les damos el 302 acaban en el
     index del sitio y la tarjeta sale con el texto genérico de la página
     principal, que no dice nada del enlace que se mandó.

     Así que al robot se le contesta con una página de puras etiquetas, hecha
     a la medida del destino; a la persona se le sigue dando el 302 de
     siempre. Es la única forma de que un enlace corto tenga vista previa
     propia: el destino real va en el hash, y el hash no viaja al servidor. */
  const ES_ROBOT = /whatsapp|facebookexternalhit|twitterbot|slackbot|telegrambot|discordbot|linkedinbot|bot\b|preview/i

  const TARJETAS = {
    'mi-equipo': ['¿Qué ya tienes en casa?', 'Anexa lo que ya haya en tu casa desde el teléfono. Toma dos minutos y nos sirve para ajustar la propuesta.'],
    'mi-casa': ['Qué le puedes pedir a tu casa', 'Tu guía, armada con lo que quedó instalado. Con las frases que sí funcionan en tu bocina.'],
    catalogo: ['El catálogo', 'Lo que se le puede poner a una casa, explicado sin tecnicismos.'],
    cotizacion: ['Tu cotización', 'Con los precios congelados del día que se generó.'],
  }

  const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

  function paginaVistaPrevia(destino, base) {
    const cual = Object.keys(TARJETAS).find((k) => destino.includes(k)) ?? 'default'
    const [titulo, bajada] = TARJETAS[cual] ?? ['Matter', 'Casas que te entienden.']
    const img = `${base}/og/${cual}.png`
    return `<!doctype html><html lang="es-MX"><head><meta charset="utf-8">
<title>${escapar(titulo)} · Matter</title>
<meta name="description" content="${escapar(bajada)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Matter">
<meta property="og:locale" content="es_MX">
<meta property="og:title" content="${escapar(titulo)}">
<meta property="og:description" content="${escapar(bajada)}">
<meta property="og:image" content="${escapar(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${escapar(destino)}">
</head><body></body></html>`
  }

  app.get('/i/:codigo', (req, res) => {
    const destino = resolver(req.params.codigo)
    if (!destino) return res.status(404).redirect('/')

    if (ES_ROBOT.test(req.get('user-agent') ?? '')) {
      const base = `${req.protocol}://${req.get('host')}`
      res.type('html').send(paginaVistaPrevia(destino, base))
      return
    }
    res.redirect(302, destino)
  })

  app.post('/api/acortar', (req, res) => {
    if (!req.sesion) return res.status(401).json({ error: 'sin sesión' })
    const { destino, etiqueta } = req.body ?? {}
    if (typeof destino !== 'string' || !/^https?:\/\/|^\//.test(destino) || destino.length > 2000) {
      return res.status(400).json({ error: 'destino inválido' })
    }
    const codigo = acortar(destino, req.sesion.u, String(etiqueta ?? '').slice(0, 80))
    res.json({ codigo })
  })

  app.get('/api/enlaces', (req, res) => {
    if (!req.sesion) return res.status(401).json({ error: 'sin sesión' })
    res.json({ enlaces: enlacesCortos() })
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

  /* La guía del cliente: solo lectura y solo su proyecto. Devuelve el nombre
     de cada espacio y qué hay en él — de ahí el navegador arma el resto. Sin
     precios ni proveedores, igual que el anexador. */
  app.get('/api/guia/:token', (req, res) => {
    const id = leerTokenCliente(req.params.token)
    if (!id) return res.status(404).json({ error: 'enlace inválido' })
    const pr = verEstado().proyectos.find((p) => p.id === id)
    if (!pr) return res.status(404).json({ error: 'no existe' })
    res.json({
      proyecto: pr.nombre,
      rooms: (pr.rooms ?? []).map((r) => ({ nombre: r.nombre, items: r.items ?? {} })),
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

  /* ── el plano aéreo del cliente ──
     Mismo enlace firmado que el anexador. El cliente ve sus espacios desde
     arriba y lo que va en cada uno, y los puede acomodar; nada de precios ni
     de tiendas. Lo que mueve entra al registro como cualquier otro cambio, así
     que el panel lo ve en vivo, y lo que se mueva en el panel le llega a él
     por /vivo. */
  const proyectoDeToken = (token) => {
    const id = leerTokenCliente(token)
    return id ? (verEstado().proyectos.find((p) => p.id === id) ?? null) : null
  }

  const planoDe = (pr) => {
    const tarifas = verEstado().tarifas?.productos ?? {}
    const propios = Object.fromEntries((pr.devices ?? []).map((d) => [d.id, d]))
    const aparatos = {}
    const espacios = (pr.rooms ?? []).map((r) => {
      for (const [id, q] of Object.entries(r.items ?? {})) {
        if (q <= 0 || aparatos[id]) continue
        const d = DEVICE_BY_ID[id] ?? propios[id]
        if (d) aparatos[id] = { nombre: tarifas[id]?.nombre || d.name, cat: d.cat, marca: d.brand ?? '' }
      }
      const pl = r.plano ?? {}
      return { id: r.id, nombre: r.nombre, m2: r.m2, items: r.items ?? {}, plano: { pos: pl.pos, ancho: pl.ancho, largo: pl.largo, mapa: pl.mapa } }
    })
    // `sello`: el último cambio que esta foto ya incluye, para que el navegador
    // no deje que una foto vieja deshaga lo que acaba de mover
    return { proyecto: pr.nombre, espacios, aparatos, sello: ultimoSeq() }
  }

  app.get('/api/plano/:token', (req, res) => {
    const pr = proyectoDeToken(req.params.token)
    if (!pr) return res.status(404).json({ error: 'enlace inválido' })
    res.json(planoDe(pr))
  })

  const numero = (v, max) => (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max ? Math.round(v * 100) / 100 : null)

  app.post('/api/plano/:token', (req, res) => {
    const pr = proyectoDeToken(req.params.token)
    if (!pr) return res.status(404).json({ error: 'enlace inválido' })
    const cambios = req.body?.cambios
    // hasta un cambio por espacio: el primero fija también los que se acomodaban solos
    if (!Array.isArray(cambios) || !cambios.length || cambios.length > Math.max(4, pr.rooms.length)) return res.status(400).json({ error: 'cambios inválidos' })

    /* Lo que se acepta, y nada más: medidas y posiciones con números de casa,
       y piezas que se MUEVEN. Desde el enlace se puede llevar un foco de un
       cuarto a otro, no crear focos ni borrarlos —eso es levantamiento, y lo
       hace un socio—: por eso la cuenta de cada aparato tiene que cuadrar. */
    const limpios = []
    const balance = {}
    for (const c of cambios) {
      const cuarto = pr.rooms.find((r) => r.id === c?.cuartoId)
      if (!cuarto) return res.status(400).json({ error: 'espacio desconocido' })
      const plano = {}
      if (c.plano?.pos !== undefined) {
        const x = numero(c.plano.pos?.[0], 500)
        const z = numero(c.plano.pos?.[1], 500)
        if (x === null || z === null) return res.status(400).json({ error: 'posición inválida' })
        plano.pos = [x, z]
      }
      for (const k of ['ancho', 'largo']) {
        if (c.plano?.[k] === undefined) continue
        const v = numero(c.plano[k], 100)
        if (v === null || v < 0.5) return res.status(400).json({ error: 'medida inválida' })
        plano[k] = v
      }
      if (c.plano?.mapa !== undefined) {
        if (!c.plano.mapa || typeof c.plano.mapa !== 'object' || Array.isArray(c.plano.mapa)) return res.status(400).json({ error: 'mapa inválido' })
        const mapa = {}
        for (const [id, lista] of Object.entries(c.plano.mapa).slice(0, 80)) {
          if (!Array.isArray(lista) || lista.length > 200 || id.length > 60) return res.status(400).json({ error: 'mapa inválido' })
          mapa[id] = lista.map((p) => [numero(p?.[0], 100) ?? 0, numero(p?.[1], 100) ?? 0])
        }
        plano.mapa = mapa
      }
      const items = {}
      for (const [id, q] of Object.entries(c.items ?? {})) {
        if (!Number.isInteger(q) || q < 0 || q > 999) return res.status(400).json({ error: 'cantidad inválida' })
        items[id] = q
        balance[id] = (balance[id] ?? 0) + q - (cuarto.items?.[id] ?? 0)
      }
      limpios.push({ cuarto, plano, items })
    }
    if (Object.values(balance).some((d) => d !== 0)) return res.status(400).json({ error: 'solo se pueden mover piezas' })

    for (const { cuarto, plano, items } of limpios) {
      if (Object.keys(plano).length) {
        registrar(
          {
            tipo: 'plano.editar',
            proyectoId: pr.id,
            datos: { cuartoId: cuarto.id, cuartoNombre: cuarto.nombre, plano, que: Object.keys(items).length ? 'Cambió una pieza de espacio en el plano aéreo' : 'Acomodó el plano aéreo' },
          },
          'cliente',
        )
      }
      for (const [deviceId, qty] of Object.entries(items)) {
        registrar(
          {
            tipo: 'equipo.cantidad',
            proyectoId: pr.id,
            datos: { cuartoId: cuarto.id, cuartoNombre: cuarto.nombre, deviceId, qty, anterior: cuarto.items?.[deviceId] ?? 0 },
          },
          'cliente',
        )
      }
    }
    res.json(planoDe(verEstado().proyectos.find((p) => p.id === pr.id)))
  })

  /* En vivo: cada navegador con el enlace abierto se queda escuchando aquí.
     Un gesto puede ser varios eventos —llevar un foco a otro cuarto son
     cuatro—, así que se espera un momento y se manda UNA foto con todo, no
     cuatro a medias que harían brincar la pantalla. */
  const escuchas = new Map() // proyectoId → Set(res)
  const pendientes = new Map() // proyectoId → timer
  const TOCAN = new Set(['plano.editar', 'equipo.cantidad', 'equipo.vaciar', 'cuarto.agregar', 'cuarto.editar', 'cuarto.eliminar', 'cuartos.reordenar', 'device.crear'])
  alRegistrar((ev) => {
    if (!ev.proyectoId || !TOCAN.has(ev.tipo) || !escuchas.get(ev.proyectoId)?.size) return
    clearTimeout(pendientes.get(ev.proyectoId))
    pendientes.set(
      ev.proyectoId,
      setTimeout(() => {
        pendientes.delete(ev.proyectoId)
        const pr = verEstado().proyectos.find((p) => p.id === ev.proyectoId)
        if (!pr) return
        const foto = `data: ${JSON.stringify(planoDe(pr))}\n\n`
        for (const r of escuchas.get(ev.proyectoId) ?? []) r.write(foto)
      }, 120),
    )
  })

  app.get('/api/plano/:token/vivo', (req, res) => {
    const pr = proyectoDeToken(req.params.token)
    if (!pr) return res.status(404).end()
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.write(': en vivo\n\n')
    if (!escuchas.has(pr.id)) escuchas.set(pr.id, new Set())
    escuchas.get(pr.id).add(res)
    // los proxies cortan una conexión callada: un latido cada 25 segundos
    const latido = setInterval(() => res.write(': latido\n\n'), 25000)
    req.on('close', () => {
      clearInterval(latido)
      escuchas.get(pr.id)?.delete(res)
    })
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
