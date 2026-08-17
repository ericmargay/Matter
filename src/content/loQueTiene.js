import { DEVICE_BY_ID, DEVICES } from './catalog'

/**
 * Lo que el cliente ya tiene, y qué se puede hacer con eso.
 *
 * El levantamiento empieza mal si se hace como si la casa estuviera vacía.
 * Casi nadie parte de cero: hay un Echo que les regalaron, un Apple TV, tres
 * focos de otra marca. Eso cambia la propuesta entera — si ya hay un Echo de
 * cuarta generación, ya hay puente Zigbee y de pronto media lista de sensores
 * baratos se vuelve viable; si todos traen iPhone, la cerradura tiene que
 * hablar Apple Home o no la van a usar.
 *
 * Y cambia el precio, que es lo que el cliente nota: cada cosa que ya tiene es
 * una que no le cobramos.
 */

/* ── con qué llegan ────────────────────────────────────────────── */

export const MOVILES = [
  { id: 'iphone', label: 'iPhone / iPad', eco: 'apple' },
  { id: 'android', label: 'Android genérico', eco: 'google' },
  { id: 'samsung', label: 'Samsung Galaxy', eco: 'google' },
]

export const CEREBROS = [
  { id: 'appletv', label: 'Apple TV 4K', eco: 'apple', border: true, deviceId: 'appletv-4k' },
  { id: 'homepod', label: 'HomePod mini', eco: 'apple', border: true, deviceId: 'homepod-mini' },
  { id: 'echodot', label: 'Echo Dot', eco: 'alexa', border: false, deviceId: 'echo-dot' },
  { id: 'echoshow', label: 'Echo Show / 4ª gen', eco: 'alexa', border: true, zigbee: true, deviceId: 'echo-show8' },
  { id: 'nesthub', label: 'Nest Hub / Mini', eco: 'google', border: true, deviceId: 'nest-hub2' },
  { id: 'smartthings', label: 'Tele Samsung con SmartThings', eco: 'google', border: true, deviceId: 'samsung-qn90' },
  { id: 'huebridge', label: 'Puente Philips Hue', eco: 'todos', zigbee: true, deviceId: 'hue-bridge' },
  { id: 'ha', label: 'Home Assistant', eco: 'ha', deviceId: 'ha-green' },
]

/** Perfil vacío: es lo que trae un proyecto nuevo. */
export const PERFIL_VACIO = { moviles: [], cerebros: [], existente: {}, notas: '' }

/* ── qué se puede hacer con eso ────────────────────────────────── */

const S = (nivel, titulo, porque, accion) => ({ nivel, titulo, porque, accion })

/**
 * Sugerencias a partir del perfil.
 *
 * `nivel` ordena la lectura: `falta` es lo que impide que algo funcione,
 * `aprovecha` es dinero que el cliente ya gastó y no hay que volver a gastar,
 * `ojo` es lo que va a decepcionar si nadie lo dice antes.
 */
export function sugerencias(perfil = PERFIL_VACIO, roomsItems = {}) {
  const s = []
  const moviles = new Set(perfil.moviles ?? [])
  const cerebros = (perfil.cerebros ?? []).map((id) => CEREBROS.find((c) => c.id === id)).filter(Boolean)
  const ecos = new Set(cerebros.map((c) => c.eco))
  const hayBorder = cerebros.some((c) => c.border)
  const hayZigbee = cerebros.some((c) => c.zigbee)

  const cotizado = Object.keys(roomsItems)
  const hayThread = cotizado.some((id) => DEVICE_BY_ID[id]?.link === 'thread')

  /* ── lo que falta para que lo cotizado funcione ── */
  if (hayThread && !hayBorder) {
    s.push(
      S('falta', 'Falta el border router', 'Hay piezas Thread cotizadas y en la casa no hay nada que arme la malla.',
        moviles.has('iphone')
          ? 'Un Apple TV 4K con Ethernet o un HomePod mini. Con iPhone en casa es además el hub que ya iban a querer.'
          : 'Un Echo de 4ª generación, un Nest Hub o un Apple TV 4K con Ethernet.'),
    )
  }

  if (moviles.has('iphone') && !ecos.has('apple')) {
    s.push(
      S('falta', 'Todos traen iPhone y no hay hub de Apple',
        'Sin un Apple TV o HomePod en casa, Apple Home no controla nada cuando salen — solo funciona estando en el WiFi.',
        'HomePod mini: es el más barato que además es border router Thread.'),
    )
  }

  if (moviles.has('samsung') && !cerebros.some((c) => c.id === 'smartthings')) {
    s.push(
      S('aprovecha', 'Traen Samsung', 'SmartThings ya viene en su teléfono y habla Matter.',
        'Si además van a cambiar la tele, una Samsung reciente hace de hub sin costo extra.'),
    )
  }

  /* ── lo que ya pagaron y hay que usar ── */
  if (hayZigbee) {
    s.push(
      S('aprovecha', 'Ya hay puente Zigbee en la casa',
        'El Echo de 4ª gen y el puente Hue traen Zigbee.',
        'Los sensores Aqara y Third Reality entran directo. Es la diferencia entre un sensor de $300 y uno de $1,100.'),
    )
  }

  for (const c of cerebros) {
    const d = DEVICE_BY_ID[c.deviceId]
    if (d && cotizado.includes(c.deviceId)) {
      s.push(
        S('aprovecha', `Ya tienen ${c.label}`, 'Está cotizado y ya lo tienen en casa.',
          `Quitar ${d.name} de la cotización — son $${d.price[0].toLocaleString('es-MX')} que no hay que cobrar.`),
      )
    }
  }

  /* ── lo que va a decepcionar si no se dice ── */
  if (ecos.size > 1) {
    s.push(
      S('ojo', 'Hay más de un ecosistema en la casa',
        `Conviven ${[...ecos].join(' y ')}.`,
        'Matter deja que los tres controlen lo mismo, pero las automatizaciones se programan en UNO. Hay que decidir cuál manda antes de instalar.'),
    )
  }

  if (moviles.has('android') && ecos.has('apple') && !ecos.has('google')) {
    s.push(
      S('ojo', 'Hay Android y el hub es de Apple',
        'Quien traiga Android no va a poder controlar la casa desde fuera.',
        'O se suma un Nest Hub, o esas personas usan la app del fabricante. Conviene aclararlo antes.'),
    )
  }

  if (cerebros.length === 0) {
    s.push(
      S('falta', 'No hay ningún cerebro todavía',
        'Sin hub no hay automatizaciones ni control desde fuera de la casa.',
        'Es la primera compra: define el ecosistema y todo lo demás se elige en consecuencia.'),
    )
  }

  return s
}

/** Cuánto vale lo que el cliente ya tiene, para descontarlo de la propuesta. */
export function valorExistente(perfil = PERFIL_VACIO) {
  return Object.entries(perfil.existente ?? {}).reduce((a, [id, q]) => {
    const d = DEVICE_BY_ID[id]
    return a + (d ? Math.round((d.price[0] + d.price[1]) / 2) * q : 0)
  }, 0)
}

/** Lo que se puede marcar como "ya lo tiene": todo el catálogo, buscable. */
export const CANDIDATOS = DEVICES
