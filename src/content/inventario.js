/**
 * Lo que el cliente ya tiene en casa.
 *
 * Este catálogo es distinto al de venta y por eso vive aparte. El de venta
 * responde "qué le podemos poner"; este responde "con qué llega", y para eso
 * necesita cosas que nosotros no vendemos: el iPhone de cada quien, el Apple
 * Watch, la tele que ya está, los focos de marca blanca que compraron en
 * Steren. Nada de eso está —ni debe estar— en el catálogo de productos.
 *
 * Importa porque cambia la propuesta entera:
 *
 * — Si todos traen iPhone, la casa se arma en Apple Home aunque hayan comprado
 *   dos Echo. Si no, la mitad de la familia se queda sin control.
 * — Si ya hay un Echo de 4ª generación, ya hay malla Zigbee y de golpe los
 *   sensores baratos se vuelven viables: es la diferencia entre un sensor de
 *   $300 y uno de $1,100.
 * — Si los focos que ya tienen son WiFi de marca blanca, no hablan Matter y no
 *   van a aparecer en la app de la casa por más que se quiera. Eso hay que
 *   decirlo ANTES de la instalación, no después.
 *
 * Y cambia el precio, que es lo que el cliente nota: cada cosa que ya tiene es
 * una que no le cobramos.
 */

/* ── qué se puede anexar ──────────────────────────────────────────
   Cada entrada trae lo que hace falta para razonar sobre ella:

   `eco`     a qué ecosistema empuja
   `border`  si puede hacer de router de borde Thread
   `zigbee`  si trae radio Zigbee y sirve de puente
   `matter`  si el aparato habla Matter de fábrica
   `control` si sirve para controlar la casa (teléfono, tablet, reloj)   */

const D = (id, label, extra = {}) => ({ id, label, ...extra })

export const FAMILIAS = [
  {
    id: 'moviles',
    label: 'Teléfonos inteligentes',
    ayuda: 'Con cuál va a controlar la casa cada quien. Es lo que decide el ecosistema.',
    items: [
      D('iphone', 'iPhone', {
        eco: 'apple',
        control: true,
        modelos: [
          'iPhone 17 Pro', 'iPhone 17', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 15 Pro', 'iPhone 15',
          'iPhone 14 Pro', 'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11', 'iPhone SE',
          'Más viejo', 'No sé cuál',
        ],
      }),
      D('galaxy', 'Samsung Galaxy', {
        eco: 'google',
        control: true,
        modelos: ['Galaxy S25', 'Galaxy S24', 'Galaxy S23', 'Galaxy S22', 'Galaxy A56', 'Galaxy A55', 'Galaxy A35', 'Galaxy Z Flip', 'Galaxy Z Fold', 'Otro Galaxy', 'No sé cuál'],
      }),
      D('pixel', 'Google Pixel', { eco: 'google', control: true, modelos: ['Pixel 10', 'Pixel 9', 'Pixel 8', 'Pixel 7', 'Otro', 'No sé cuál'] }),
      D('xiaomi', 'Xiaomi / Redmi', { eco: 'google', control: true, modelos: ['Redmi Note', 'Xiaomi 14', 'Xiaomi 13', 'POCO', 'Otro', 'No sé cuál'] }),
      D('motorola', 'Motorola', { eco: 'google', control: true, modelos: ['Moto G', 'Edge', 'Otro', 'No sé cuál'] }),
      D('otroAndroid', 'Otro Android', { eco: 'google', control: true }),
    ],
  },
  {
    id: 'tabletas',
    label: 'Tabletas y smart watches',
    ayuda: 'Una tableta fija en la pared es el mejor tablero de la casa. El reloj es el control más rápido.',
    items: [
      D('ipad', 'iPad', {
        eco: 'apple',
        control: true,
        modelos: ['iPad Pro', 'iPad Air', 'iPad (normal)', 'iPad mini', 'No sé cuál'],
      }),
      D('tabAndroid', 'Tableta Android', { eco: 'google', control: true, modelos: ['Samsung Galaxy Tab', 'Lenovo', 'Otra', 'No sé cuál'] }),
      D('appleWatch', 'Apple Watch', {
        eco: 'apple',
        control: true,
        modelos: ['Series 10', 'Series 9', 'Ultra', 'SE', 'Más viejo', 'No sé cuál'],
      }),
      D('galaxyWatch', 'Galaxy Watch', { eco: 'google', control: true }),
    ],
  },
  {
    id: 'asistentes',
    label: 'Bocinas y asistentes',
    ayuda: 'Son el cerebro de la casa: sin uno no hay automatizaciones ni control desde fuera.',
    items: [
      D('echoDot', 'Amazon Echo Dot', { eco: 'alexa', matter: true, modelos: ['5ª gen', '4ª gen', '3ª gen', 'No sé cuál'] }),
      D('echo', 'Amazon Echo (grande)', { eco: 'alexa', border: true, zigbee: true, matter: true, modelos: ['4ª gen o más nuevo', '3ª gen o más viejo', 'No sé cuál'] }),
      D('echoShow', 'Amazon Echo Show', { eco: 'alexa', border: true, zigbee: true, matter: true, modelos: ['Show 8', 'Show 10', 'Show 5', 'Show 15', 'No sé cuál'] }),
      D('homepodMini', 'HomePod mini', { eco: 'apple', border: true, matter: true }),
      D('homepod', 'HomePod (grande)', { eco: 'apple', border: true, matter: true }),
      D('nestMini', 'Google Nest Mini', { eco: 'google', matter: true }),
      D('nestHub', 'Google Nest Hub', { eco: 'google', border: true, matter: true }),
      D('sonos', 'Bocina Sonos', { eco: 'todos' }),
      D('bocinaBt', 'Bocina Bluetooth', {}),
    ],
  },
  {
    id: 'tele',
    label: 'Tele y streaming',
    ayuda: 'Varias teles y aparatos de streaming ya hacen de hub sin costo extra.',
    items: [
      D('appleTv', 'Apple TV 4K', { eco: 'apple', border: true, matter: true, modelos: ['Con Ethernet', 'Solo WiFi', 'No sé cuál'] }),
      D('fireTv', 'Amazon Fire TV Stick', {
        eco: 'alexa',
        modelos: ['4K Max', '4K', 'Lite', 'No sé cuál'],
        /* Sí controla la tele, y vale precisar cómo porque la diferencia
           importa a la hora de prometer. El Stick manda por HDMI-CEC: prende
           y apaga la tele y le sube el volumen, y con un Echo cerca eso se
           pide por voz —"Alexa, prende la tele"—. Lo que NO hace es de hub:
           no trae Thread, ni Zigbee, ni emisor infrarrojo, así que no puede
           con el minisplit, la barra vieja ni el decodificador de cable. Para
           eso hace falta un Fire TV Cube. */
        puede: 'Prende, apaga y sube volumen de la tele por HDMI-CEC. Con un Echo cerca, por voz.',
        noPuede: 'No hace de hub: sin Thread, sin Zigbee y sin infrarrojo. Para el minisplit o el cable hace falta un Fire TV Cube.',
      }),
      D('chromecast', 'Chromecast / Google TV', { eco: 'google', matter: true }),
      D('rokuTv', 'Roku', { eco: 'otro' }),
      D('teleSamsung', 'Tele Samsung', { eco: 'google', border: true, matter: true, modelos: ['2024 o más nueva', '2022–2023', 'Más vieja', 'No sé cuál'] }),
      D('teleLg', 'Tele LG', { eco: 'otro', modelos: ['2024 o más nueva', '2022–2023', 'Más vieja', 'No sé cuál'] }),
      D('teleOtra', 'Otra tele', {}),
    ],
  },
  {
    id: 'luces',
    label: 'Focos y luces',
    ayuda: 'Lo primero que casi todos compran. La marca decide si va a servir o no.',
    items: [
      D('hue', 'Focos Philips Hue', { eco: 'todos', zigbee: true, matter: true }),
      D('huePuente', 'Puente Philips Hue', { eco: 'todos', zigbee: true, matter: true }),
      D('focoSteren', 'Focos Steren', { eco: 'otro', wifi: true, ojo: 'marca-blanca' }),
      D('focoTuya', 'Focos genéricos WiFi (Tuya, Smart Life)', { eco: 'otro', wifi: true, ojo: 'marca-blanca' }),
      D('focoNanoleaf', 'Nanoleaf', { eco: 'todos', matter: true }),
      D('tiraLed', 'Tira de LED', {}),
    ],
  },
  {
    id: 'casa',
    label: 'Otros aparatos de la casa',
    ayuda: 'Todo lo que ya se controla con el celular cuenta.',
    items: [
      D('enchufeSmart', 'Enchufes inteligentes', { eco: 'otro', wifi: true }),
      D('camara', 'Cámaras', { modelos: ['Ring', 'Nest', 'Eufy', 'Tapo / TP-Link', 'Genérica', 'No sé cuál'] }),
      D('cerradura', 'Cerradura inteligente', {}),
      D('timbre', 'Timbre con cámara', {}),
      D('robot', 'Robot aspiradora', {}),
      D('minisplit', 'Minisplit con WiFi', {}),
      D('lavadoraSmart', 'Lavadora con WiFi', {}),
      D('sensor', 'Sensores (movimiento, puerta)', {}),
    ],
  },
  {
    id: 'red',
    label: 'Internet y red',
    ayuda: 'La red es donde se cae todo lo demás. El módem que te dio la compañía casi nunca alcanza.',
    items: [
      /* ── el módem del proveedor ────────────────────────────────
         Se lista por COMPAÑÍA y no como "módem genérico" porque la compañía
         el cliente siempre la sabe y el modelo casi nunca. Y saber cuál es
         cambia la instalación de verdad:

         — Casi todos estos equipos anuncian 2.4 y 5 GHz con un solo nombre de
           red. La mayoría de los focos, enchufes y sensores baratos solo
           hablan 2.4 GHz, y al emparejar se enganchan a la de 5 y fallan. Es
           la causa número uno de "no me conecta" en una instalación nueva.
         — Ninguno deja abrir puertos ni segmentar con comodidad, así que
           cuando hay cámaras o NVR el módem se pasa a puente y la red la
           lleva un equipo nuestro.
         — El de fibra trae la ONT integrada: no se puede quitar, solo poner
           en puente. Eso hay que verificarlo ANTES de prometer VLAN.

         La lista de modelos es de agosto de 2026 y es un primer tiro: la
         iremos corrigiendo con lo que veamos en obra. Por eso "No sé cuál" va
         de primero en todas — es la respuesta honesta más frecuente. */
      D('modemTelmex', 'Módem de Telmex / Infinitum', {
        modelos: [
          'No sé cuál',
          'Huawei HG8245H',
          'Huawei EG8145V5',
          'ZTE ZXHN F670L',
          'ZTE ZXHN F660',
          'Arcadyan (WiFi 6, el nuevo)',
          'Fiberhome AN5506',
          'Askey RTF3505VW',
          'Es de cobre, no fibra',
        ],
        ojo: 'modem-isp',
      }),
      D('modemTotalplay', 'Módem de Totalplay', {
        modelos: [
          'No sé cuál',
          'Huawei HG8145V5',
          'Huawei HG8145X6 (WiFi 6)',
          'Huawei HG8245H',
          'Askey RTF8115VW (la torre blanca)',
          'Nokia',
          'Arcadyan',
        ],
        ojo: 'modem-isp',
      }),
      D('modemIzzi', 'Módem de izzi', {
        modelos: [
          'No sé cuál',
          'ARRIS TG3442',
          'ARRIS TG2482',
          'ARRIS TG1652',
          'ARRIS TG862',
          'Technicolor CGA4233',
          'Technicolor TC8305C',
          'Hitron CHITA 3.1',
          'Hitron CGNV5',
          'Sagemcom Fast3890',
          'Kaón CG3000',
          'ZTE F689 (fibra)',
        ],
        ojo: 'modem-isp',
      }),
      D('modemMegacable', 'Módem de Megacable', {
        modelos: ['No sé cuál', 'Hitron', 'Technicolor', 'ZTE', 'Es fibra', 'Es cable coaxial'],
        ojo: 'modem-isp',
      }),
      D('modemAxtel', 'Módem de Axtel', { modelos: ['No sé cuál', 'Huawei', 'ZTE', 'Otro'], ojo: 'modem-isp' }),
      D('modemOtro', 'Módem de otra compañía', {
        modelos: ['No sé cuál', 'Starlink', 'Internet por antena', 'Otro'],
        ojo: 'modem-isp',
      }),

      D('meshWifi', 'WiFi en malla (Deco, Eero, Orbi…)', {}),
      D('repetidor', 'Repetidor de WiFi', { ojo: 'repetidor' }),
      D('switchRed', 'Switch de red / cableado', {}),
      D('nobreak', 'No-break / UPS', {}),
    ],
  },
]

/** Todo plano, para buscar por id sin recorrer familias. */
export const POR_ID = Object.fromEntries(FAMILIAS.flatMap((f) => f.items.map((i) => [i.id, { ...i, familia: f.id }])))

/* ── el inventario de un proyecto ─────────────────────────────── */

/**
 * Una unidad por aparato, no una línea con cantidad.
 *
 * Empezó siendo `{ id, cant }` y estaba mal: dos Echo Dot en la misma casa
 * casi nunca son de la misma generación, y la generación es justo lo que
 * decide si ese aparato trae Zigbee o no. Con una cuenta agrupada esa
 * diferencia no cabe. Con una unidad por aparato, cada uno lleva su modelo,
 * su dueño y el espacio donde está.
 *
 * `creado` y `modificado` van en la unidad porque este inventario lo llenan
 * dos manos —nosotros en el levantamiento, el cliente desde su enlace— y
 * saber cuándo cambió qué es la mitad de la conversación.
 */
let n = 0
export const unidadVacia = (id) => ({
  uid: `u${Date.now().toString(36)}${(n++).toString(36)}`,
  id,
  modelo: '',
  quien: '',
  espacio: '',
  nota: '',
  creado: new Date().toISOString(),
  modificado: null,
})

export function totalPiezas(inv = []) {
  return inv.length
}

/**
 * Las listas viejas traían `cant`. Se abren en una unidad por aparato para no
 * perder lo ya capturado ni pedirle a nadie que lo vuelva a anexar.
 */
export function migrar(inv = []) {
  if (!inv.some((l) => l.cant != null)) return inv
  const out = []
  for (const l of inv) {
    const cuantos = Math.max(1, l.cant ?? 1)
    for (let i = 0; i < cuantos; i++) {
      out.push({
        ...unidadVacia(l.id),
        modelo: l.modelo ?? '',
        nota: l.nota ?? '',
        creado: l.creado ?? new Date().toISOString(),
      })
    }
  }
  return out
}

/** Aparatos personales: son los que tiene sentido asignarle a alguien. */
export const esPersonal = (id) => ['moviles', 'tabletas'].includes(POR_ID[id]?.familia)

/**
 * Lo que anda en la bolsa no vive en un cuarto.
 *
 * El selector de espacio NO se esconde para estos: se desactiva y se dice por
 * qué. Esconderlo deja la duda de si se olvidó preguntar; desactivarlo con su
 * razón cierra el tema — y es un dato menos que el cliente siente que dejó a
 * medias.
 */
export const sinEspacio = (id) => {
  const d = POR_ID[id]
  if (!d) return null
  if (d.familia === 'moviles') return 'Un teléfono anda contigo: no se levanta por espacio.'
  if (['appleWatch', 'galaxyWatch'].includes(id)) return 'El reloj trae puesto el control: tampoco vive en un cuarto.'
  return null
}

/** Resumen por familia, para el encabezado de la sección. */
export function porFamilia(inv = []) {
  const m = {}
  for (const l of inv) {
    const d = POR_ID[l.id]
    if (d) m[d.familia] = (m[d.familia] ?? 0) + 1
  }
  return m
}

/* ── qué significa lo que ya tienen ───────────────────────────── */

const S = (nivel, titulo, porque, accion) => ({ nivel, titulo, porque, accion })

/**
 * Lee el inventario y saca las consecuencias.
 *
 * `falta` es lo que impide que algo funcione, `aprovecha` es dinero que ya
 * gastaron y no hay que volver a gastar, `ojo` es lo que va a decepcionar si
 * nadie lo dice antes de instalar. El orden no es estético: en una junta se
 * leen los tres primeros y con eso se decide.
 */
export function leerInventario(inv = []) {
  const s = []
  const hay = (id) => inv.some((l) => l.id === id)
  const cuantos = (id) => inv.filter((l) => l.id === id).length
  const conProp = (prop) => inv.filter((l) => POR_ID[l.id]?.[prop])

  const ecos = new Set(inv.map((l) => POR_ID[l.id]?.eco).filter((e) => e && e !== 'todos' && e !== 'otro'))
  const ecosControl = new Set(
    inv.filter((l) => POR_ID[l.id]?.control).map((l) => POR_ID[l.id]?.eco).filter(Boolean),
  )
  const hayBorder = conProp('border').length > 0
  const hayZigbee = conProp('zigbee').length > 0
  const marcaBlanca = inv.filter((l) => POR_ID[l.id]?.ojo === 'marca-blanca')

  /* ── lo que falta ── */
  if (!hayBorder) {
    s.push(
      S(
        'falta',
        'No hay router de borde Thread',
        'Nada de lo que hay arma la malla Thread, que es por donde hablan los sensores y focos modernos.',
        ecosControl.has('apple')
          ? 'Un HomePod mini o un Apple TV 4K con Ethernet. Con iPhone en casa es además el hub que de todos modos iban a querer.'
          : 'Un Echo de 4ª generación, un Nest Hub o un Apple TV 4K.',
      ),
    )
  }

  if (ecosControl.has('apple') && !ecos.has('apple')) {
    s.push(
      S(
        'falta',
        'Los teléfonos son Apple y no hay ningún hub de Apple',
        `Hay ${cuantos('iphone')} iPhone en la casa y ningún HomePod ni Apple TV. Sin uno de esos, Apple Home no controla nada cuando salen de casa — solo funciona estando en el WiFi.`,
        'HomePod mini: es el más barato que además hace de router de borde Thread.',
      ),
    )
  }

  /* ── lo que ya pagaron ── */
  if (hayZigbee) {
    s.push(
      S(
        'aprovecha',
        'Ya hay puente Zigbee en la casa',
        'El Echo grande, el Echo Show y el puente Hue traen radio Zigbee.',
        'Los sensores Aqara y Third Reality entran directo. Es la diferencia entre un sensor de $300 y uno de $1,100.',
      ),
    )
  }

  if (hay('appleTv') || hay('teleSamsung')) {
    s.push(
      S(
        'aprovecha',
        'La tele ya puede hacer de hub',
        'Un Apple TV 4K con Ethernet o una Samsung reciente con SmartThings ya son cerebro de la casa.',
        'No hay que comprar hub aparte. Es un ahorro directo en la propuesta.',
      ),
    )
  }

  if (hay('ipad')) {
    s.push(
      S(
        'aprovecha',
        'Hay un iPad que puede quedarse de tablero',
        'Montado en la pared del pasillo o la cocina, con la app de la casa abierta.',
        'Sale un soporte con carga y ya hay tablero — sin comprar pantalla.',
      ),
    )
  }

  if (hay('appleWatch')) {
    s.push(
      S(
        'aprovecha',
        'El Apple Watch es el control más rápido que van a tener',
        'Apagar toda la casa desde la muñeca, sin sacar el teléfono.',
        'Vale programar ahí las tres escenas que más se usan.',
      ),
    )
  }

  /* ── lo que va a decepcionar ── */
  if (marcaBlanca.length > 0) {
    const nombres = [...new Set(marcaBlanca.map((l) => POR_ID[l.id].label))].join(' y ')
    s.push(
      S(
        'ojo',
        'Hay focos que no hablan Matter',
        `${nombres}. Son WiFi de marca blanca: viven en su propia app y no aparecen junto al resto de la casa.`,
        'O se quedan como están —controlados aparte, sin entrar a las automatizaciones— o se cambian. Conviene decidirlo antes de instalar, no después.',
      ),
    )
  }

  if (ecos.size > 1) {
    const nombre = { apple: 'Apple', alexa: 'Alexa', google: 'Google' }
    s.push(
      S(
        'ojo',
        'Hay más de un ecosistema en la casa',
        `Conviven ${[...ecos].map((e) => nombre[e] ?? e).join(' y ')}.`,
        'Matter deja que los dos controlen lo mismo, pero las automatizaciones se programan en UNO. Hay que decidir cuál manda antes de instalar.',
      ),
    )
  }

  if (ecosControl.has('apple') && ecos.has('alexa') && !ecos.has('apple')) {
    s.push(
      S(
        'ojo',
        'Los teléfonos son de Apple y los aparatos son de Alexa',
        'Es el caso más común y el que más fricción da: se controla desde el iPhone, pero las automatizaciones viven en la app de Alexa.',
        'Se puede dejar así, o meter un HomePod mini y pasar todo a Apple Home. La segunda cuesta más al inicio y se usa mucho más.',
      ),
    )
  }

  const modemIsp = inv.filter((l) => POR_ID[l.id]?.ojo === 'modem-isp')
  if (modemIsp.length > 0) {
    const cual = modemIsp[0]
    const d = POR_ID[cual.id]
    s.push(
      S(
        'ojo',
        `La red la lleva ${d.label.replace('Módem de ', 'el módem de ')}`,
        cual.modelo && cual.modelo !== 'No sé cuál'
          ? `Es un ${cual.modelo}. Como casi todos, anuncia 2.4 y 5 GHz con un solo nombre de red.`
          : 'Falta saber el modelo. Casi todos anuncian 2.4 y 5 GHz con un solo nombre de red.',
        'La mayoría de focos y sensores solo hablan 2.4 GHz y al emparejar se enganchan a la de 5. Se separan las bandas en la puesta en marcha, o se pasa el módem a puente y la red la lleva equipo nuestro. Es la causa número uno de “no me conecta”.',
      ),
    )
  }

  if (hay('repetidor')) {
    s.push(
      S(
        'ojo',
        'Hay un repetidor de WiFi',
        'Los repetidores parten la red en dos y muchos aparatos se pierden al cambiar de una a otra.',
        'Conviene cambiarlo por malla antes de instalar. Es la causa número uno de "se me desconecta solo".',
      ),
    )
  }

  if (inv.length === 0) {
    s.push(
      S('falta', 'Todavía no hay nada anexado', 'Sin saber con qué llegan, la propuesta se hace a ciegas.',
        'Se puede llenar en el levantamiento o mandarle el enlace al cliente para que lo llene él.'),
    )
  }

  return s
}
