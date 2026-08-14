/**
 * Descarga la foto de cada producto del catálogo.
 *
 *   npm run photos          — solo los que faltan
 *   npm run photos -- --all — vuelve a bajar todo
 *   npm run photos -- hue-a19 aqara-fp2
 *
 * Por qué así y no scrapeando Amazon o MercadoLibre: los marketplaces
 * bloquean la descarga automática (403 / "tráfico sospechoso") y la API de
 * MercadoLibre pide credenciales. Los fabricantes, en cambio, publican su
 * propio catálogo, y la foto oficial además es mejor: fondo limpio, producto
 * completo y sin la marca de agua de un vendedor.
 *
 * Tres fuentes, todas públicas:
 *
 *   shop — tienda Shopify del fabricante. `/products.json` es un endpoint
 *          abierto de la plataforma; se baja el catálogo entero una vez por
 *          dominio y se busca el producto por título.
 *   url  — imagen directa del CDN del fabricante, cuando su sitio no es
 *          Shopify pero sí publica la foto del producto (Sonos, Ubiquiti,
 *          Reolink). Va a mano porque es la única forma de garantizar que la
 *          foto sea de ESE modelo y no del hermano de la misma familia.
 *   commons — Wikimedia Commons, para la marca grande (Apple, Amazon, Google,
 *          LG) que no vende por Shopify. Material con licencia libre; el
 *          crédito queda guardado en el manifiesto.
 *
 * Lo que no se encuentra NO se inventa: se queda sin archivo y la interfaz
 * pinta un mosaico procedural. Un hueco honesto es mejor que la foto de otro
 * producto parecido — de ahí `sinFoto`, que apunta los casos ya revisados a
 * mano y descartados para que la siguiente corrida no los vuelva a bajar.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'

import { DEVICES } from '../src/content/catalog.js'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = path.join(RAIZ, 'public', 'catalogo')
const MANIFIESTO = path.join(RAIZ, 'src', 'content', 'photos.js')

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

/** Wikimedia pide identificarse en su política de uso de la API. */
const UA_WIKI = 'MatterCatalogo/1.0 (https://matter.mx; ericmargay@gmail.com) node-fetch'

/** Pausa entre consultas a Commons: su límite es estricto y prefiere ritmo a ráfaga. */
const RITMO_COMMONS = 900

/** Lado del cuadro final. 640 basta para la ficha a pantalla completa. */
const LADO = 640
/** Los productos vienen fotografiados sobre blanco; se unifican todos sobre
 *  el mismo papel claro para que la cuadrícula no se vea de retazos. */
const PAPEL = { r: 244, g: 239, b: 231 }

/* ── fotos "en uso" ────────────────────────────────────────────────
   Lista blanca, revisada a ojo. Es a mano y no automática porque no hay
   forma de distinguirlas por programa: se midió entropía y área plana sobre
   una muestra y los rangos de una foto de ambiente y de una lámina de
   marketing se solapan por completo (2.8–7.2 contra 2.3–7.2).

   El fabricante mezcla, en el mismo arreglo de imágenes, la foto del aparato
   instalado —que es la que le sirve al cliente— con láminas de "1 year
   battery" y tablas de compatibilidad en inglés. Poner una de esas en el
   catálogo es peor que no poner nada.

   Para sumar una: corre `npm run photos -- --all`, mira
   `public/catalogo/<id>-uso.webp` y si sirve, agrega el id aquí. */
const CON_AMBIENTE = new Set([
  'aqara-fan',
  'aqara-fp2',
  'aqara-g5pro',
  'inovelli-blue',
  'levoit-core',
  'lifx-color',
  'petkit-fountain',
  'shelly-1mini',
  'switchbot-hub2',
  'thirdreality-switch',
  'ultraloq-bolt',
])

/* ── de dónde sale la foto de cada uno ─────────────────────────────
   `q` es lo que se busca en el catálogo del fabricante; se afina a mano
   cuando el nombre comercial no coincide con el del catálogo. */
const FUENTES = {
  /* Iluminación */
  'hue-a19': { sinFoto: 'philips-hue.com devuelve su tarjeta social genérica, no el producto' },
  'hue-bridge': { commons: 'Philips Hue Bridge' },
  'nanoleaf-shapes': { shop: 'nanoleaf.me', q: 'Nanoleaf Shapes' },
  'nanoleaf-lines': { shop: 'nanoleaf.me', q: 'Lines' },
  'nanoleaf-essentials': { shop: 'nanoleaf.me', q: 'Nanoleaf Smart LED Bulbs' },
  'lifx-color': { shop: 'www.lifx.com', q: 'LIFX A19 Smart Light 1-Pack' },
  'hue-lightstrip': { commons: 'Philips Hue lightstrip' },
  'govee-strip': { sinFoto: 'las tiras de Commons no son Govee' },
  'hue-downlight': { sinFoto: 'foto genérica de instalación, no del producto Hue' },
  'hue-gradient': { sinFoto: 'philips-hue.com devuelve su tarjeta social genérica, no el producto' },
  'wiz-a19': { sinFoto: 'wizconnected.com devuelve su tarjeta social genérica' },
  'aqara-t1m': { shop: 'us.aqara.com', q: 'Ceiling Light T1M' },
  'hue-outdoor': { sinFoto: 'philips-hue.com devuelve su tarjeta social genérica, no el producto' },

  /* Interruptores y dimmers */
  'lutron-diva': { sinFoto: 'lutron.com bloquea la descarga (403)' },
  'lutron-bridge': { sinFoto: 'lutron.com bloquea la descarga (403)' },
  'inovelli-blue': { shop: 'inovelli.com', q: 'Blue Series 2-1 Switch' },
  'shelly-dimmer': { shop: 'shelly.com', q: 'Dimmer' },
  'shelly-1mini': { shop: 'shelly.com', q: '1 Mini Gen4' },
  'aqara-h1': { sinFoto: 'descontinuado: no está ni en la tienda ni en el sitio de Aqara' },
  'aqara-cube': { shop: 'us.aqara.com', q: 'Cube T1 Pro' },
  'friends-fob': { sinFoto: 'sin sitio de fabricante con foto accesible' },
  'thirdreality-switch': { shop: '3reality.com', q: 'Smart Switch' },

  /* Sensores */
  'aqara-fp2': { shop: 'us.aqara.com', q: 'Presence Sensor FP2' },
  'aqara-fp300': { shop: 'us.aqara.com', q: 'Presence Multi-Sensor FP300' },
  'eve-motion': { sinFoto: 'evehome.com solo publica su tarjeta social' },
  'aqara-p2': { shop: 'us.aqara.com', q: 'Door and Window Sensor P2' },
  'aqara-th': { shop: 'us.aqara.com', q: 'Temperature and Humidity Sensor' },
  'aqara-leak': { shop: 'us.aqara.com', q: 'Water Leak Sensor' },
  'firstalert-smoke': { sinFoto: 'en Commons solo hay detectores genéricos de otra marca' },
  'thirdreality-vibration': { shop: '3reality.com', q: 'Vibration Sensor' },
  'aqara-tvoc': { url: 'https://www.aqara.com/wp-content/uploads/2023/05/TVOC-Air-Quality-Monitor.jpg', credito: 'Aqara' },

  /* Acceso y seguridad */
  'yale-assure2': { commons: 'Smart door lock keypad' },
  'nuki-4': { commons: 'Nuki Smart Lock' },
  'ultraloq-bolt': { shop: 'u-tec.com', q: 'ULTRALOQ Latch 5 Fingerprint' },
  'aqara-g4': { shop: 'us.aqara.com', q: 'Video Doorbell G4' },
  'reolink-doorbell': { sinFoto: 'timbres genéricos de otra marca en Commons' },
  'switchbot-keypad': { shop: 'switch-bot.com', q: 'Keypad Vision' },
  'aqara-hub-m3': { shop: 'us.aqara.com', q: 'Hub M3' },

  /* Cámaras */
  'reolink-810a': { url: 'https://home-cdn.reolink.us/wp-content/uploads/2025/04/210833481745224428.1219.jpg', credito: 'Reolink' },
  'reolink-nvr': { url: 'https://home-cdn.reolink.us/wp-content/uploads/2024/11/070925081730971508.9166.jpg', credito: 'Reolink' },
  'unifi-g5': { url: 'https://cdn.ecomm.ui.com/products/48ca8dea-109e-4d35-af46-b7ad03764207/0cd9d5ff-af60-45bd-a01f-b0fb050e76bb.png', credito: 'Ubiquiti' },
  'eufy-indoor': { shop: 'us.eufy.com', q: 'Indoor Cam S350' },
  'aqara-g5pro': { shop: 'us.aqara.com', q: 'Camera Hub G5 Pro' },
  'logitech-view': { sinFoto: 'logitech.com rechaza la conexión automatizada' },

  /* Clima */
  'ecobee-premium': { commons: 'Ecobee thermostat' },
  'sensibo-air': { shop: 'sensibo.com', q: 'Air Pro' },
  'tado-ac': { url: 'https://shop.tado.com/cdn/shop/files/sacc_product_shop_e94ba71c-8d82-4d28-8876-1be5b4a83beb.webp?v=1758016793', credito: 'tado°' },
  'broadlink-rm4': { sinFoto: 'ibroadlink.com carga las fotos por script, no vienen en el HTML' },
  'levoit-core': { shop: 'levoit.com', q: 'Core 400S' },
  'aqara-fan': { shop: 'sonoff.tech', q: 'Fan Light Controller' },

  /* Cortinas y persianas */
  'switchbot-roller': { shop: 'switch-bot.com', q: 'Roller Shade' },
  'switchbot-curtain3': { shop: 'switch-bot.com', q: 'Curtain 3' },
  'somfy-roll': { sinFoto: 'la ficha de somfysystems.com ya no existe (404)' },
  'aqara-driver-e1': { shop: 'us.aqara.com', q: 'Curtain Driver E1' },
  'ikea-fyrtur': { sinFoto: 'Commons devuelve puertas y ventanas, no la persiana' },

  /* Energía */
  'eve-energy': { sinFoto: 'evehome.com solo publica su tarjeta social' },
  'meross-plug': { shop: 'shop.meross.com', q: 'Smart Plug Matter' },
  'shelly-em': { shop: 'shelly.com', q: '3EM' },
  'apc-ups': { url: 'https://download.schneider-electric.com/files?p_Doc_Ref=SPD_JVAN-ATHND6_FL_V&p_File_Type=rendition_369_jpg', credito: 'APC by Schneider Electric' },
  'thirdreality-plug': { shop: '3reality.com', q: 'Smart Plug' },

  /* Agua y riego */
  'moen-flo': { sinFoto: 'llave de paso genérica, no la válvula Flo' },
  'aqara-valve': { shop: 'us.aqara.com', q: 'Water Valve Controller' },
  'rachio-3': { sinFoto: 'la ficha de rachio.com ya no existe (404)' },
  'netro-pixie': { sinFoto: 'netrohome.com responde 500' },

  /* Audio y video */
  'sonos-era100': { url: 'https://media.sonos.com/images/znqtjj88/production/c730c924a2d9fe4d3a3b9b9cb7432b7afd0ab392-2000x2000.png?w=1200&q=100', credito: 'Sonos' },
  'sonos-arc': { url: 'https://media.sonos.com/images/znqtjj88/production/a27135e0222d228e5ab9c49c6d8b34472c7bd0df-2000x2000.png?w=1200&q=100', credito: 'Sonos' },
  'homepod-mini': { commons: 'HomePod mini' },
  'appletv-4k': { commons: 'Apple TV 4K' },
  'echo-show8': { commons: 'Amazon Echo Show' },
  'echo-dot': { url: 'https://m.media-amazon.com/images/G/01/kindle/journeys/2XxFNDAxteQdPdLF_nav/echodot_5th_TAbG9z3YkMVM_104mmTall.jpg', credito: 'Amazon' },
  'nest-hub2': { commons: 'Google Nest Hub' },
  'hue-syncbox': { sinFoto: 'philips-hue.com devuelve su tarjeta social genérica, no el producto' },

  /* Hubs y controladores */
  'ha-green': { sinFoto: 'Seeed publica la foto de un kit en carcasa acrílica, no del Green' },
  'ha-yellow': { sinFoto: 'sin ficha accesible con foto del producto' },
  'skyconnect': { sinFoto: 'la ficha de Seeed ya no existe (404)' },
  'ikea-dirigera': { sinFoto: 'ikea.com arma la galería por script; el HTML no trae la foto' },
  'switchbot-hub2': { shop: 'switch-bot.com', q: 'Hub 2' },

  /* Red */
  'unifi-u7': { commons: 'Ubiquiti UniFi access point' },
  'unifi-cloudgw': { url: 'https://cdn.ecomm.ui.com/products/8d2d9e4b-89f3-49a1-9c17-5d774c0067b4/2e179331-f85a-4bc9-bf3e-d00192522732.png', credito: 'Ubiquiti' },
  'unifi-switch8': { url: 'https://cdn.ecomm.ui.com/products/75c44878-4e73-446e-8e86-f207db6b2b7c/53b8b06b-69c7-424f-bb81-2f8405356c65.png', credito: 'Ubiquiti' },
  'tplink-deco': { commons: 'Wi-Fi mesh system Deco' },
  'rack-6u': { sinFoto: 'Commons devuelve cuartos de site, no el gabinete' },
  'patch-panel': { commons: 'Patch panel Cat6' },

  /* Mascotas */
  'petlibro-granary': { shop: 'petlibro.com', q: 'Granary Camera Feeder' },
  'sureflap-hub': { url: 'https://www.surepetcare.com/images/ogs/generic_og_images/sureflap_product_range.jpg', credito: 'Sure Petcare' },
  'petkit-fountain': { shop: 'petkit.com', q: 'Eversweet' },
  'tractive-gps': { url: 'https://assets.tractive.com/assets/image/shop-frontend/product/trdog6bk/tractive-dog-6-black.png', credito: 'Tractive' },

  /* Pantallas */
  'samsung-frame-65': { sinFoto: 'samsung.com devuelve fotos de otras líneas, no The Frame' },
  'samsung-qn90': { commons: 'Samsung QLED television' },
  'lg-c5-oled': { commons: 'LG OLED television' },
  'hisense-u7': { commons: 'Hisense television' },
  'appletv-4k-hub': { commons: 'Apple TV 4K' },
  'mx-luz-medida': { sinFoto: 'producto propio: la foto sale cuando exista la primera pieza' },

  /* Electrodomésticos */
  'roborock-s8': { shop: 'us.roborock.com', q: 'S8 MaxV Ultra' },
  'lg-thinq': { commons: 'LG washing machine front load' },
  'midea-minisplit': { sinFoto: 'midea.com no expone ficha del modelo con WiFi' },
  'samsung-frame': { sinFoto: 'samsung.com devuelve fotos de otras líneas, no The Frame' },
}

/* ── utilidades ───────────────────────────────────────────────── */

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * fetch con reintento.
 *
 * Wikimedia responde 429 en cuanto le llegan varias peticiones seguidas y pide
 * —en sus condiciones de uso de la API— un User-Agent que identifique a quien
 * consulta. Las dos cosas se respetan: se anuncia el proyecto y se espera lo
 * que el servidor diga en Retry-After antes de volver a tocar.
 */
async function traer(url, init = {}) {
  let espera = 1200
  for (let intento = 0; intento < 4; intento++) {
    const r = await fetch(url, {
      ...init,
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: '*/*', ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(30_000),
    })
    if (r.status !== 429 && r.status !== 503) return r
    const dice = Number(r.headers.get('retry-after'))
    await dormir(Number.isFinite(dice) && dice > 0 ? dice * 1000 : espera)
    espera *= 2
  }
  return fetch(url, {
    ...init,
    redirect: 'follow',
    headers: { 'user-agent': UA, accept: '*/*', ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(30_000),
  })
}

/** Palabras significativas de un título, para comparar sin depender del orden. */
const palabras = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)

/** Cuántas palabras de la búsqueda aparecen en el título del producto. */
function puntaje(titulo, consulta) {
  const t = new Set(palabras(titulo))
  const q = palabras(consulta)
  if (q.length === 0) return 0
  const aciertos = q.filter((w) => t.has(w)).length
  // penaliza títulos larguísimos: "Bundle de 3 con extras" no es el producto
  return aciertos / q.length - Math.max(0, t.size - q.length) * 0.012
}

/* ── fuente: tienda Shopify del fabricante ─────────────────────── */

const cacheTienda = new Map()

async function catalogoDe(dominio) {
  if (cacheTienda.has(dominio)) return cacheTienda.get(dominio)
  const productos = []
  // products.json pagina de 250 en 250; tres páginas cubren cualquier catálogo
  // de estos fabricantes con margen de sobra.
  for (let pagina = 1; pagina <= 3; pagina++) {
    const r = await traer(`https://${dominio}/products.json?limit=250&page=${pagina}`)
    if (!r.ok) break
    const lote = (await r.json()).products ?? []
    productos.push(...lote)
    if (lote.length < 250) break
  }
  cacheTienda.set(dominio, productos)
  return productos
}

async function desdeTienda({ shop, q }) {
  const productos = await catalogoDe(shop)
  if (productos.length === 0) throw new Error(`${shop} no devolvió catálogo`)

  const mejor = productos
    .map((p) => ({ p, s: puntaje(p.title, q) }))
    .sort((a, b) => b.s - a.s)[0]

  if (!mejor || mejor.s < 0.6) throw new Error(`sin coincidencia para "${q}" en ${shop}`)

  const fotos = mejor.p.images ?? []
  const imagen = fotos[0]?.src
  if (!imagen) throw new Error(`"${mejor.p.title}" no trae imagen`)

  /* La segunda foto: el aparato instalado y funcionando.
     El fabricante siempre pone primero el recorte sobre blanco —bueno para
     identificar la pieza, inútil para decidir— y después las de ambiente. Esas
     son las que le sirven al cliente, que no está comprando un objeto sino
     imaginándose su casa.
     Se prefiere la apaisada: un recorte de producto casi siempre es cuadrado,
     y una foto de cuarto casi nunca. */
  const ambiente =
    fotos.slice(1).find((f) => f.width && f.height && f.width / f.height > 1.15) ?? fotos[1] ?? null

  return {
    url: imagen,
    ambiente: ambiente?.src ?? null,
    credito: `${shop} · ${mejor.p.title}`,
    fuente: shop,
  }
}

/* ── fuente: Wikimedia Commons ─────────────────────────────────── */

async function desdeCommons({ commons }) {
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
    '&generator=search&gsrnamespace=6&gsrlimit=8' +
    `&gsrsearch=${encodeURIComponent(commons)}` +
    '&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900'

  await dormir(RITMO_COMMONS)
  const r = await traer(api, { headers: { 'user-agent': UA_WIKI } })
  if (!r.ok) throw new Error(`Commons respondió ${r.status}`)
  const paginas = Object.values((await r.json()).query?.pages ?? {})

  // Commons mezcla fotos con diagramas y logotipos; nos quedamos con archivo
  // de foto y descartamos lo que claramente no es el producto.
  const util = paginas
    .filter((p) => /\.(jpe?g|png)$/i.test(p.title))
    .filter((p) => !/logo|icon|diagram|chart|map|screenshot/i.test(p.title))
    .map((p) => ({ p, s: puntaje(p.title.replace(/^File:/, ''), commons) }))
    .sort((a, b) => b.s - a.s)[0]

  if (!util || util.s < 0.5) throw new Error(`sin resultado útil en Commons para "${commons}"`)

  const ii = util.p.imageinfo?.[0]
  if (!ii?.thumburl) throw new Error('Commons no dio miniatura')

  const meta = ii.extmetadata ?? {}
  const limpio = (v) => (v?.value ?? '').replace(/<[^>]*>/g, '').trim()
  const autor = limpio(meta.Artist) || 'Wikimedia Commons'
  const licencia = limpio(meta.LicenseShortName) || 'ver Commons'

  return {
    url: ii.thumburl,
    credito: `${autor} · ${licencia} · Wikimedia Commons`,
    fuente: 'commons',
  }
}

/* ── descarga y normalización ──────────────────────────────────── */

async function guardar(id, url, sufijo = '') {
  // upload.wikimedia.org aplica el mismo límite que la API: se identifica igual
  const wiki = /wikimedia\.org|wikipedia\.org/.test(new URL(url).hostname)
  const r = await traer(url, wiki ? { headers: { 'user-agent': UA_WIKI } } : {})
  if (!r.ok) throw new Error(`la imagen respondió ${r.status}`)
  const bytes = Buffer.from(await r.arrayBuffer())
  if (bytes.length < 1500) throw new Error('archivo demasiado chico, no es una foto')

  await sharp(bytes)
    // la de ambiente se recorta apaisada y llena el cuadro: es una escena, no
    // una pieza, y dejarla con márgenes de papel la haría ver de catálogo
    .resize(sufijo ? 800 : LADO, sufijo ? 500 : LADO, {
      fit: sufijo ? 'cover' : 'contain',
      background: PAPEL,
    })
    .flatten({ background: PAPEL })
    .webp({ quality: 82 })
    .toFile(path.join(DESTINO, `${id}${sufijo}.webp`))
}

/* ── manifiesto ────────────────────────────────────────────────── */

async function escribirManifiesto(fotos) {
  const filas = Object.entries(fotos)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, c]) => `  '${id}': ${JSON.stringify(c)},`)
    .join('\n')

  await writeFile(
    MANIFIESTO,
    `/**
 * Qué productos tienen foto y de dónde salió.
 *
 * GENERADO por \`npm run photos\` — no editar a mano.
 *
 * El crédito no es adorno: parte del material viene de Wikimedia Commons con
 * licencia que pide atribución, y la ficha del producto la muestra.
 */

export const PHOTOS = {
${filas}
}

/** Ruta de la foto, o \`null\` si a este producto todavía le falta. */
export const photoOf = (id) => (PHOTOS[id] ? \`/catalogo/\${id}.webp\` : null)

/** El aparato instalado y funcionando. \`null\` si el fabricante no publicó una. */
export const usoOf = (id) => (PHOTOS[id]?.uso ? \`/catalogo/\${id}-uso.webp\` : null)

/** Crédito para pintar bajo la foto. */
export const creditOf = (id) => PHOTOS[id] ?? null
`,
    'utf8',
  )
}

/* ── main ──────────────────────────────────────────────────────── */

const args = process.argv.slice(2)
const todos = args.includes('--all')
const soloEstos = args.filter((a) => !a.startsWith('--'))

await mkdir(DESTINO, { recursive: true })

// se conserva el crédito de lo ya bajado para no perderlo al correr parcial
let previos = {}
try {
  // se importa en vez de parsearse: el manifiesto es un módulo, no JSON, y
  // la marca de tiempo evita que Node sirva una versión ya cacheada
  const mod = await import(`${pathToFileURL(MANIFIESTO).href}?t=${Date.now()}`)
  previos = mod.PHOTOS ?? {}
} catch {
  /* primera corrida: todavía no existe */
}

const objetivo = DEVICES.filter((d) => (soloEstos.length ? soloEstos.includes(d.id) : true))
const fotos = { ...previos }
const fallos = []
let bajadas = 0
let saltadas = 0

for (const d of objetivo) {
  const destino = path.join(DESTINO, `${d.id}.webp`)
  if (!todos && existsSync(destino) && previos[d.id]) {
    saltadas++
    continue
  }

  const fuente = FUENTES[d.id]
  if (!fuente) {
    fallos.push([d.id, 'sin fuente declarada'])
    continue
  }

  if (fuente.sinFoto) {
    fallos.push([d.id, `descartada a mano: ${fuente.sinFoto}`])
    continue
  }

  try {
    const hallazgo = fuente.shop
      ? await desdeTienda(fuente)
      : fuente.url
        ? {
            url: fuente.url,
            ambiente: fuente.ambiente ?? null,
            credito: fuente.credito ?? new URL(fuente.url).hostname,
            fuente: 'fabricante',
          }
        : await desdeCommons(fuente)

    await guardar(d.id, hallazgo.url)
    let conAmbiente = false
    if (hallazgo.ambiente && CON_AMBIENTE.has(d.id)) {
      try {
        await guardar(d.id, hallazgo.ambiente, '-uso')
        conAmbiente = true
      } catch {
        // que falle la de ambiente no puede tirar la del producto
      }
    }
    fotos[d.id] = { credito: hallazgo.credito, fuente: hallazgo.fuente, uso: conAmbiente }
    bajadas++
    console.log(`✓ ${d.id.padEnd(24)} ${hallazgo.credito.slice(0, 70)}`)
  } catch (e) {
    delete fotos[d.id]
    fallos.push([d.id, e.message])
    console.log(`· ${d.id.padEnd(24)} ${e.message}`)
  }
}

// lo que no tiene archivo no puede quedar en el manifiesto
for (const id of Object.keys(fotos)) {
  if (!existsSync(path.join(DESTINO, `${id}.webp`))) delete fotos[id]
  // y una foto de ambiente que se borró a mano —al curar la lista— tiene que
  // desaparecer también de aquí, o la interfaz pediría un archivo que no está
  else if (fotos[id].uso && !existsSync(path.join(DESTINO, `${id}-uso.webp`))) fotos[id].uso = false
}

await escribirManifiesto(fotos)

console.log(
  `\n${Object.keys(fotos).length} de ${DEVICES.length} productos con foto` +
    ` — ${bajadas} nuevas, ${saltadas} ya estaban, ${fallos.length} sin resolver`,
)
if (fallos.length) {
  console.log('\nSin foto (se pintan con el mosaico procedural):')
  for (const [id, motivo] of fallos) console.log(`  ${id.padEnd(24)} ${motivo}`)
}
