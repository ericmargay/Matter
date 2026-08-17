import { DEVICE_BY_ID } from '../../../content/catalog'
import { uid } from '../../../sync/eventos'
import { MUEBLES } from './catalogo'
import { ALTURA_POR_FORMA, parametrosIniciales } from './luz'

/**
 * Acomodar solo.
 *
 * Un plano en blanco es una tarea; un plano ya puesto es una corrección. La
 * diferencia importa porque el levantamiento se hace de pie en casa del
 * cliente: mover cuatro cosas que ya están es viable, colocar treinta desde
 * cero no.
 *
 * Lo que sale de aquí NO pretende ser el plano final. Pretende estar
 * suficientemente bien como para que se vea el error de un vistazo — que
 * faltan luces en la cocina, que el sensor quedó donde no sirve — que es
 * justo lo que uno quiere discutir con el cliente.
 *
 * Convenciones del cuarto (todas en coordenadas locales, centro en 0,0):
 *
 *          z = -largo/2   ← muro NORTE: cabecera, barra, tele, ventana
 *   x = -ancho/2                                          x = +ancho/2
 *          z = +largo/2   ← muro SUR: la puerta, y por tanto el apagador
 */

const MURO = 0.12 // qué tan pegado al muro se admite algo

/* ── mobiliario por tipo de cuarto ────────────────────────────────
   Cada receta recibe las medidas y devuelve posiciones. Se escriben en
   función del cuarto y no con números fijos porque una recámara de 3 × 3 y
   una de 5 × 6 no se amueblan igual, y el levantamiento trae de todo. */

const RECETAS = {
  recamara: (a, l) => [
    { tipo: 'cama', x: 0, z: -l / 2 + 1.3, rot: 0 },
    { tipo: 'buro', x: -1.25, z: -l / 2 + 0.5, rot: 0 },
    { tipo: 'buro', x: 1.25, z: -l / 2 + 0.5, rot: 0 },
    ...(a > 3.4 ? [{ tipo: 'closet', x: -a / 2 + 0.4, z: 0.6, rot: Math.PI / 2 }] : []),
    ...(l > 4.2 ? [{ tipo: 'tapete', x: 0, z: l / 2 - 1.4, rot: 0 }] : []),
  ],

  bano: (a, l) => [
    { tipo: 'wc', x: -a / 2 + 0.5, z: -l / 2 + 0.6, rot: 0 },
    { tipo: 'lavabo', x: a / 2 - 0.5, z: -l / 2 + 0.4, rot: 0 },
    { tipo: 'espejo', x: a / 2 - 0.5, z: -l / 2 + MURO, rot: 0 },
    { tipo: 'regadera', x: a / 2 - 0.7, z: l / 2 - 0.7, rot: 0 },
    { tipo: 'toallero', x: -a / 2 + MURO, z: 0, rot: Math.PI / 2 },
  ],

  cocina: (a, l) => [
    { tipo: 'barra', x: 0, z: -l / 2 + 0.4, rot: 0 },
    ...(a > 4 && l > 4 ? [{ tipo: 'isla', x: 0, z: 0.3, rot: 0 }] : []),
    { tipo: 'refri', x: a / 2 - 0.5, z: -l / 2 + 0.5, rot: 0 },
  ],

  sala: (a, l) => [
    { tipo: 'mueble_tv', x: 0, z: -l / 2 + 0.35, rot: 0 },
    { tipo: 'tv', x: 0, z: -l / 2 + 0.25, rot: 0 },
    { tipo: 'tapete', x: 0, z: 0.2, rot: 0 },
    { tipo: 'mesaCentro', x: 0, z: 0.2, rot: 0 },
    { tipo: 'sofa', x: 0, z: l / 2 - 1.1, rot: Math.PI },
    ...(a > 5 ? [{ tipo: 'planta', x: a / 2 - 0.6, z: l / 2 - 0.6, rot: 0 }] : []),
  ],

  comedor: (a, l) => [
    { tipo: 'tapete', x: 0, z: 0, rot: 0 },
    { tipo: 'mesaComedor', x: 0, z: 0, rot: a < l ? Math.PI / 2 : 0 },
    ...(a > 4 ? [{ tipo: 'librero', x: -a / 2 + 0.3, z: 0, rot: Math.PI / 2 }] : []),
  ],

  estudio: (a, l) => [
    { tipo: 'escritorio', x: 0, z: -l / 2 + 0.5, rot: 0 },
    { tipo: 'monitor', x: 0, z: -l / 2 + 0.45, rot: 0 },
    { tipo: 'silla', x: 0, z: -l / 2 + 1.3, rot: 0 },
    ...(a > 3.6 ? [{ tipo: 'librero', x: a / 2 - 0.3, z: 0.4, rot: -Math.PI / 2 }] : []),
  ],

  servicio: (a, l) => [{ tipo: 'rack', x: -a / 2 + 0.5, z: -l / 2 + 0.5, rot: 0 }],

  exterior: (a, l) => [
    { tipo: 'planta', x: -a / 2 + 0.7, z: -l / 2 + 0.7, rot: 0 },
    { tipo: 'planta', x: a / 2 - 0.7, z: l / 2 - 0.7, rot: 0 },
  ],
}

/* ── dónde va cada dispositivo ────────────────────────────────────
   La regla la manda la categoría, no la marca: un sensor de presencia va al
   techo sea de la marca que sea. */

const zonaDe = (device) => {
  const c = device.cat
  const l = device.luz

  if (c === 'iluminacion') {
    if (l?.forma === 'lineal') return 'tiraMuro'
    if (device.power === 'cableado' || l?.haz < 140) return 'techo'
    return 'techo'
  }
  if (c === 'sensores') {
    if (/leak|fuga/i.test(device.id)) return 'piso'
    if (/p2|contacto|door/i.test(device.id)) return 'muroAlto'
    if (/fp2|fp300|motion|presence/i.test(device.id)) return 'esquinaTecho'
    return 'muroMedio'
  }
  if (c === 'agua') return 'piso'
  if (c === 'camaras') return 'esquinaTecho'
  if (c === 'acceso') return 'puerta'
  if (c === 'clima') return 'muroAlto'
  if (c === 'cortinas') return 'ventana'
  if (c === 'energia') return 'muroBajo'
  if (c === 'av') return 'flanco'
  if (c === 'hubs' || c === 'red') return 'rincon'
  if (c === 'mascotas' || c === 'electro') return 'pisoRincon'
  return 'muroMedio'
}

/**
 * Reparte n puntos en el techo de forma pareja.
 *
 * Una retícula centrada, no una fila: es como se reparte la luz de verdad y
 * evita el error clásico de dejar todos los focos en una franja y media
 * habitación a oscuras.
 */
function reticulaTecho(n, ancho, largo, y) {
  if (n === 1) return [[0, y, 0]]
  const cols = Math.ceil(Math.sqrt((n * ancho) / largo)) || 1
  const filas = Math.ceil(n / cols)
  const pasoX = ancho / (cols + 1)
  const pasoZ = largo / (filas + 1)
  const puntos = []
  for (let i = 0; i < n; i++) {
    const c = i % cols
    const f = Math.floor(i / cols)
    puntos.push([-ancho / 2 + pasoX * (c + 1), y, -largo / 2 + pasoZ * (f + 1)])
  }
  return puntos
}

/** Puntos repartidos a lo largo de un muro, sin amontonarse en las esquinas. */
function sobreMuro(n, largoMuro, i) {
  const paso = largoMuro / (n + 1)
  return -largoMuro / 2 + paso * (i + 1)
}

/**
 * El plano completo de un cuarto: muebles, dispositivos, puntos eléctricos,
 * el cableado del apagador y la regla que lo hace servir para algo.
 */
export function disponerCuarto({ plano, tipo, equipo }) {
  const { ancho: a, largo: l, alto: h } = plano
  const items = []

  /* ── mobiliario ── */
  const receta = RECETAS[tipo]
  if (receta) {
    for (const m of receta(a, l)) {
      if (!MUEBLES[m.tipo]) continue
      items.push({ id: uid('i'), clase: 'mueble', ...m })
    }
  }

  /* ── dispositivos, agrupados por dónde van ── */
  const porZona = {}
  for (const [deviceId, qty] of Object.entries(equipo ?? {})) {
    const d = DEVICE_BY_ID[deviceId]
    if (!d || qty <= 0) continue
    const z = zonaDe(d)
    ;(porZona[z] ??= []).push({ d, qty })
  }

  const nuevoEquipo = (d, x, y, z, rot = 0) => ({
    id: uid('i'),
    clase: 'equipo',
    deviceId: d.id,
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    z: Number(z.toFixed(2)),
    rot,
    params: parametrosIniciales(d),
  })

  // techo: todas las luminarias del cuarto entran a la misma retícula, para
  // que se repartan entre ellas y no una encima de otra
  const alTecho = (porZona.techo ?? []).flatMap(({ d, qty }) => Array.from({ length: qty }, () => d))
  reticulaTecho(alTecho.length, a - 0.8, l - 0.8, h - 0.15).forEach((p, i) => {
    items.push(nuevoEquipo(alTecho[i], p[0], p[1], p[2]))
  })

  // tiras: a lo largo del muro norte, repartidas
  const tiras = (porZona.tiraMuro ?? []).flatMap(({ d, qty }) => Array.from({ length: qty }, () => d))
  tiras.forEach((d, i) => {
    const y = tipo === 'cocina' ? 1.45 : ALTURA_POR_FORMA.lineal
    items.push(nuevoEquipo(d, sobreMuro(tiras.length, a - 0.6, i), y, -l / 2 + 0.2))
  })

  const colocarEnMuro = (lista, y, muro = 'norte') =>
    lista
      .flatMap(({ d, qty }) => Array.from({ length: qty }, () => d))
      .forEach((d, i, arr) => {
        if (muro === 'norte') items.push(nuevoEquipo(d, sobreMuro(arr.length, a - 0.6, i), y, -l / 2 + MURO))
        else if (muro === 'sur') items.push(nuevoEquipo(d, sobreMuro(arr.length, a - 0.6, i), y, l / 2 - MURO))
        else items.push(nuevoEquipo(d, -a / 2 + MURO, y, sobreMuro(arr.length, l - 0.6, i)))
      })

  colocarEnMuro(porZona.muroAlto ?? [], 2.0)
  colocarEnMuro(porZona.muroMedio ?? [], 1.5, 'oeste')
  colocarEnMuro(porZona.muroBajo ?? [], 0.35, 'oeste')
  colocarEnMuro(porZona.ventana ?? [], h - 0.25)
  colocarEnMuro(porZona.puerta ?? [], 1.6, 'sur')

  // esquinas del techo: cámaras y presencia, repartidas entre las cuatro
  const esquinas = [
    [-a / 2 + 0.4, -l / 2 + 0.4],
    [a / 2 - 0.4, -l / 2 + 0.4],
    [a / 2 - 0.4, l / 2 - 0.4],
    [-a / 2 + 0.4, l / 2 - 0.4],
  ]
  ;(porZona.esquinaTecho ?? [])
    .flatMap(({ d, qty }) => Array.from({ length: qty }, () => d))
    .forEach((d, i) => {
      const [x, z] = esquinas[i % 4]
      items.push(nuevoEquipo(d, x, h - 0.35, z))
    })

  // el piso: fugas bajo el mueble húmedo, que es donde sirven
  ;(porZona.piso ?? [])
    .flatMap(({ d, qty }) => Array.from({ length: qty }, () => d))
    .forEach((d, i, arr) => {
      items.push(nuevoEquipo(d, sobreMuro(arr.length, a - 1, i), 0.04, -l / 2 + 0.6))
    })
  ;(porZona.pisoRincon ?? [])
    .flatMap(({ d, qty }) => Array.from({ length: qty }, () => d))
    .forEach((d, i) => {
      const [x, z] = esquinas[(i + 2) % 4]
      items.push(nuevoEquipo(d, x, 0.25, z))
    })
  ;(porZona.rincon ?? [])
    .flatMap(({ d, qty }) => Array.from({ length: qty }, () => d))
    .forEach((d, i) => {
      items.push(nuevoEquipo(d, -a / 2 + 0.35, 0.3 + i * 0.25, -l / 2 + 0.35))
    })

  // bocinas flanqueando la pared de la tele
  ;(porZona.flanco ?? [])
    .flatMap(({ d, qty }) => Array.from({ length: qty }, () => d))
    .forEach((d, i) => {
      items.push(nuevoEquipo(d, (i % 2 === 0 ? -1 : 1) * (a / 2 - 0.5), 0.9, -l / 2 + 0.5))
    })

  /* ── instalación eléctrica ──
     Un apagador junto a la puerta (muro sur, del lado derecho al entrar) y
     contactos repartidos. Es lo que hay en cualquier cuarto y ahorra el paso
     más tedioso de la captura. */
  const apagador = {
    id: uid('i'),
    clase: 'punto',
    tipo: 'apagador',
    /* Se asume que YA hay un apagador mecánico —en una casa que existe
       siempre lo hay— y que el módulo inteligente va detrás de él. Es la
       instalación que no cambia nada visible: el cliente conserva el apagador
       que combina con su casa y por dentro ya es inteligente.
       La alternativa (módulo en la luminaria) se elige en el inspector cuando
       la caja del apagador no tiene fondo o no hay neutro ahí. */
    mecanico: true,
    modulo: 'atras',
    x: Number((a / 2 - 0.45).toFixed(2)),
    y: 1.2,
    z: Number((l / 2 - MURO).toFixed(2)),
    rot: 0,
  }
  items.push(apagador)

  const nEnchufes = Math.max(2, Math.min(6, Math.round((a * l) / 8)))
  for (let i = 0; i < nEnchufes; i++) {
    const enMuroNorte = i % 2 === 0
    items.push({
      id: uid('i'),
      clase: 'punto',
      tipo: 'enchufe',
      x: Number(sobreMuro(Math.ceil(nEnchufes / 2), a - 0.8, Math.floor(i / 2)).toFixed(2)),
      y: 0.4,
      z: Number(((enMuroNorte ? -1 : 1) * (l / 2 - MURO)).toFixed(2)),
      rot: 0,
    })
  }

  /* ── cableado y regla ──
     El apagador controla las luminarias de techo del cuarto. Es lo que se
     espera de un apagador, y tenerlo puesto convierte la simulación en algo
     que se puede enseñar en la primera visita. */
  // el apagador manda sobre las luminarias de techo Y sobre las cortinas: en
  // la casa real ese apagador de la sala baja la persiana también
  const luces = items.filter((i) => i.clase === 'equipo' && i.params && (i.y ?? 0) > 1.8)
  const cortinas = items.filter((i) => i.clase === 'equipo' && DEVICE_BY_ID[i.deviceId]?.cat === 'cortinas')
  const tramos = []
  const reglas = []

  if (luces.length > 0) {
    /* El circuito se ENCADENA, no sale en abanico desde el apagador.
       Es como se cablea de verdad —la línea entra a una luminaria y sale a la
       siguiente— y además arregla lo que se veía: con dieciocho empotrados,
       dieciocho diagonales al mismo punto era una telaraña ilegible.

       El orden es por vecino más cercano, que es el recorrido que haría
       cualquiera con el rollo de cable en la mano. */
    const arriba = [apagador.x, h - 0.15, apagador.z]
    tramos.push({ id: uid('t'), de: [apagador.x, apagador.y, apagador.z], a: arriba, entre: [apagador.id] })

    const pendientes = [...luces]
    let desde = arriba
    let previo = apagador.id
    while (pendientes.length) {
      let mejor = 0
      let dmin = Infinity
      pendientes.forEach((c, i) => {
        const d = (c.x - desde[0]) ** 2 + (c.z - desde[2]) ** 2
        if (d < dmin) {
          dmin = d
          mejor = i
        }
      })
      const luz = pendientes.splice(mejor, 1)[0]
      tramos.push({ id: uid('t'), de: desde, a: [luz.x, luz.y, luz.z], entre: [previo, luz.id] })
      desde = [luz.x, luz.y, luz.z]
      previo = luz.id
    }

    reglas.push({ id: uid('g'), disparo: apagador.id, destinos: [...luces, ...cortinas].map((x) => x.id) })
  }

  return { items, tramos, reglas }
}

/* ── la planta ────────────────────────────────────────────────── */

/**
 * Acomoda los cuartos de cada piso en filas compactas.
 *
 * No adivina la casa: nadie puede, y fingir que sí sería peor que no hacer
 * nada. Lo que hace es dejar una planta ordenada y centrada, de la que se
 * arrastra lo que haga falta. Cada piso se acomoda igual y queda alineado con
 * el de abajo, que es como se leen dos plantas juntas.
 */
export function disponerPlanta(cuartos, anchoObjetivo = 14) {
  const porPiso = {}
  for (const c of cuartos) (porPiso[c.plano.piso ?? 0] ??= []).push(c)

  const posiciones = new Map()

  for (const piso of Object.keys(porPiso)) {
    const lista = porPiso[piso]
    const filas = []
    let fila = []
    let anchoFila = 0

    for (const c of lista) {
      const w = c.plano.ancho + 0.6
      if (anchoFila + w > anchoObjetivo && fila.length > 0) {
        filas.push({ fila, anchoFila })
        fila = []
        anchoFila = 0
      }
      fila.push(c)
      anchoFila += w
    }
    if (fila.length) filas.push({ fila, anchoFila })

    // se centra el conjunto en el origen para que la cámara lo encuadre solo
    const altoTotal = filas.reduce((a, f) => a + Math.max(...f.fila.map((c) => c.plano.largo)) + 0.6, 0)
    let z = -altoTotal / 2

    for (const { fila: f, anchoFila: w } of filas) {
      const altoFila = Math.max(...f.map((c) => c.plano.largo))
      let x = -w / 2
      for (const c of f) {
        posiciones.set(c.room.id, [
          Number((x + c.plano.ancho / 2).toFixed(2)),
          Number((z + altoFila / 2).toFixed(2)),
        ])
        x += c.plano.ancho + 0.6
      }
      z += altoFila + 0.6
    }
  }

  return posiciones
}

/* ── que no se encimen ────────────────────────────────────────── */

/**
 * Separa los espacios que quedaron montados uno sobre otro.
 *
 * Hace falta porque las medidas se cambian DESPUÉS de acomodar la planta: uno
 * entra a la sala, jala la cota de 4 a 6 metros, y ese metro y medio nuevo se
 * mete dentro de la cocina de al lado sin avisar. En el plano general se ve
 * como si los dos cuartos compartieran suelo, que es justo lo que un plano no
 * debe permitirse decir.
 *
 * El método es el de siempre para esto: mientras haya un par encimado, se
 * empujan por el eje donde menos hay que moverlos. Empujar por el eje de menor
 * traslape conserva la forma que ya tenía la planta —lo acomodado a mano no se
 * deshace— en vez de recalcularla desde cero.
 *
 * @param cuartos  [{ room, plano }] de un mismo piso hacia arriba
 * @param holgura  pasillo mínimo entre espacios, en metros
 * @returns Map roomId → [x, z] solo para los que hubo que mover
 */
export function separar(cuartos, holgura = 0.6) {
  const caja = (c) => {
    const [x, z] = c.plano.pos ?? [0, 0]
    return { id: c.room.id, x, z, w: c.plano.ancho + holgura, h: c.plano.largo + holgura, piso: c.plano.piso ?? 0 }
  }

  const cajas = cuartos.map(caja)
  const movido = new Set()

  // 40 pasadas alcanzan de sobra para una planta de casa; el tope solo evita
  // que un caso raro deje el ciclo corriendo
  for (let pasada = 0; pasada < 40; pasada++) {
    let hubo = false

    for (let i = 0; i < cajas.length; i++) {
      for (let j = i + 1; j < cajas.length; j++) {
        const a = cajas[i]
        const b = cajas[j]
        if (a.piso !== b.piso) continue

        const dx = (a.w + b.w) / 2 - Math.abs(a.x - b.x)
        const dz = (a.h + b.h) / 2 - Math.abs(a.z - b.z)
        if (dx <= 0 || dz <= 0) continue // no se tocan

        hubo = true
        // dos cuartos exactamente encimados no tienen dirección: se desempata
        const signoX = a.x === b.x ? (i < j ? -1 : 1) : Math.sign(a.x - b.x)
        const signoZ = a.z === b.z ? (i < j ? -1 : 1) : Math.sign(a.z - b.z)

        if (dx < dz) {
          a.x += (signoX * dx) / 2
          b.x -= (signoX * dx) / 2
        } else {
          a.z += (signoZ * dz) / 2
          b.z -= (signoZ * dz) / 2
        }
        movido.add(a.id)
        movido.add(b.id)
      }
    }

    if (!hubo) break
  }

  const out = new Map()
  for (const c of cajas) {
    if (movido.has(c.id)) out.set(c.id, [Number(c.x.toFixed(2)), Number(c.z.toFixed(2))])
  }
  return out
}
