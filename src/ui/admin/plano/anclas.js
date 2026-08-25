import { MUEBLES } from './catalogo'
import { MUEBLES_DE_MURO } from './muros'

/**
 * A qué está pegada cada cosa.
 *
 * Un plano donde las piezas guardan solo su x y su z miente en cuanto algo se
 * mueve: se estira el cuarto medio metro y los contactos se quedan flotando en
 * medio de la sala, porque nadie les dijo que viven DENTRO de un muro. Lo
 * mismo con el Apple TV que estaba sobre el buró y queda en el aire cuando el
 * buró se corre.
 *
 * Así que las piezas dejan de guardar un lugar y pasan a guardar una relación:
 *
 *   { a: 'muro', muro: 'x-', t: 0.35, y: 0.4 }   pegado a un muro
 *   { a: 'mueble', id: 'i1234' }                 encima de un mueble
 *
 * El lugar se calcula cada vez a partir de la relación, así que estirar el
 * cuarto o correr el buró arrastra lo que va encima. Es la diferencia entre un
 * dibujo y un plano.
 *
 * ⚠️ La relación no se adivina cada rato: se fija cuando la pieza se coloca o
 * se suelta, y se puede quitar a mano. Recalcularla en cada render haría que
 * una pieza se "pegue" sola a lo que pase por debajo, que es de las cosas más
 * molestas que puede hacer un editor.
 */

/** Los cuatro muros, con el eje y el signo de cada uno. */
export const MUROS = {
  'x-': { eje: 'x', signo: -1, label: 'muro izquierdo' },
  'x+': { eje: 'x', signo: 1, label: 'muro derecho' },
  'z-': { eje: 'z', signo: -1, label: 'muro del fondo' },
  'z+': { eje: 'z', signo: 1, label: 'muro de enfrente' },
}

/** Media pieza, para saber dónde termina. */
const medio = (m) => ({ w: (m?.w ?? 0.4) / 2, d: (m?.d ?? 0.4) / 2, alto: m?.alto ?? 0.4 })

/**
 * ¿A qué muro está pegada esta pieza, si es que a alguno?
 *
 * Se mide contra los cuatro y gana el más cercano, siempre que esté a menos de
 * 25 cm: más lejos ya no es "está en el muro", es "está cerca del muro", y
 * pegarla sería decidir por quien la puso.
 */
export function muroDe(item, plano) {
  const hx = (plano.ancho ?? 4) / 2
  const hz = (plano.largo ?? 4) / 2
  /* La distancia se mide desde el CANTO de la pieza, no desde su centro. Un
     sofá de noventa de fondo pegado a la pared tiene el centro a cuarenta y
     cinco centímetros de ella; midiendo desde el centro, ningún mueble estaba
     nunca "en el muro" y ninguno se movía al estirar el cuarto. */
  const def = item.clase === 'mueble' ? MUEBLES[item.tipo] : null
  const canto = def ? Math.min(def.w ?? 0.4, def.d ?? 0.4) / 2 : 0
  const cand = [
    ['x-', Math.abs(item.x + hx), (item.z + hz) / (hz * 2)],
    ['x+', Math.abs(item.x - hx), (item.z + hz) / (hz * 2)],
    ['z-', Math.abs(item.z + hz), (item.x + hx) / (hx * 2)],
    ['z+', Math.abs(item.z - hz), (item.x + hx) / (hx * 2)],
  ]
  const [muro, dist, t] = cand.reduce((a, b) => (b[1] < a[1] ? b : a))
  /* Lo que va colgado del muro se pega siempre; un mueble de piso, sólo si de
     verdad está arrimado. Medio metro de holgura es lo que separa "está contra
     la pared" de "está cerca de la pared", que son dos cosas distintas. */
  const limite = MUEBLES_DE_MURO.has(item.tipo) || item.clase === 'punto' ? 0.3 : canto + 0.25
  if (dist > limite) return null
  return { a: 'muro', muro, t: Math.min(1, Math.max(0, t)), y: item.y ?? 0.4, sep: dist }
}

/**
 * Los cuatro muros, ordenados por cercanía a una pieza.
 *
 * Sirve para el mueble esquinado: está pegado a dos y hay que poder decir a
 * cuál se amarra. La lista sale ordenada para que el panel pueda enseñar
 * primero el que se eligió solo.
 */
export function murosCerca(item, plano) {
  const hx = (plano.ancho ?? 4) / 2
  const hz = (plano.largo ?? 4) / 2
  return [
    ['x-', Math.abs(item.x + hx)],
    ['x+', Math.abs(item.x - hx)],
    ['z-', Math.abs(item.z + hz)],
    ['z+', Math.abs(item.z - hz)],
  ]
    .sort((a, b) => a[1] - b[1])
    .map(([muro, dist]) => ({ muro, dist, label: MUROS[muro].label }))
}

/** El ancla de muro que le tocaría a una pieza si la amarramos a ESE muro. */
export function anclaEnMuro(item, plano, muro) {
  const hx = (plano.ancho ?? 4) / 2
  const hz = (plano.largo ?? 4) / 2
  const m = MUROS[muro]
  if (!m) return null
  const sep = Math.abs(m.eje === 'x' ? item.x - hx * m.signo : item.z - hz * m.signo)
  const t = m.eje === 'x' ? (item.z + hz) / (hz * 2) : (item.x + hx) / (hx * 2)
  return { a: 'muro', muro, t: Math.min(1, Math.max(0, t)), y: item.y ?? 0.4, sep }
}

/**
 * ¿Sobre qué mueble está apoyada esta pieza?
 *
 * Tiene que caer dentro de su huella y a una altura que se parezca a la de su
 * cubierta. Un Apple TV a un metro sobre el buró no está EN el buró, está
 * colgado del muro de atrás, y anclarlo al buró lo haría bajarse solo.
 */
export function muebleBajo(item, items) {
  const y = item.y ?? 0
  let mejor = null
  for (const otro of items) {
    if (otro.id === item.id || otro.clase !== 'mueble') continue
    const def = MUEBLES[otro.tipo]
    if (!def) continue
    const { w, d, alto } = medio(def)
    // la huella gira con el mueble
    const rot = -(otro.rot ?? 0)
    const dx = item.x - otro.x
    const dz = item.z - otro.z
    const lx = dx * Math.cos(rot) - dz * Math.sin(rot)
    const lz = dx * Math.sin(rot) + dz * Math.cos(rot)
    if (Math.abs(lx) > w + 0.06 || Math.abs(lz) > d + 0.06) continue
    const separacion = y - alto
    if (separacion < -0.08 || separacion > 0.35) continue
    if (!mejor || alto > mejor.alto) mejor = { id: otro.id, alto, lx, lz }
  }
  if (!mejor) return null
  /* Se apoya en la cubierta, no a dos centímetros de ella. Un aparato que
     flota sobre el buró es de las cosas que más delatan un render, y si de
     verdad va colgado más arriba, para eso está "despegar". */
  return { a: 'mueble', id: mejor.id, lx: mejor.lx, lz: mejor.lz, sobre: 0 }
}

/**
 * La relación que le toca a una pieza recién puesta o recién soltada.
 *
 * Primero el mueble y luego el muro: si algo está sobre el buró Y pegado a la
 * pared, lo que manda es el buró — es lo que se va a mover primero.
 */
/* Lo que cuelga del techo no se apoya en el piso por más que esté encima de
   él: una lámpara colgante a dos metros no está en el suelo. */
const DEL_TECHO = new Set(['lamparaColgante', 'lamparaEsfera'])

export function anclaAuto(item, plano, items) {
  if (item.clase === 'punto') return muroDe(item, plano)
  const encima = muebleBajo(item, items) ?? muroDe(item, plano)
  if (encima) return encima
  /* Y lo que va en el plafón se amarra al plafón, guardando en qué parte de él
     está —de cero a uno en cada eje— y no en qué metro. Así seis empotrados
     repartidos en la sala se vuelven a repartir cuando la sala crece, en vez
     de quedarse apretados en una esquina. */
  if ((item.y ?? 0) >= (plano.alto ?? 2.6) - 0.6) {
    return {
      a: 'techo',
      u: (item.x + (plano.ancho ?? 4) / 2) / (plano.ancho ?? 4),
      v: (item.z + (plano.largo ?? 4) / 2) / (plano.largo ?? 4),
      y: item.y ?? 2.4,
    }
  }
  /* Y si no está sobre nada ni contra nada, está en el piso — que también es
     una relación, no una casualidad. Sin esto quedaban muebles flotando a
     dos centímetros del suelo sin que nada los bajara. */
  if (item.clase === 'mueble' && !MUEBLES_DE_MURO.has(item.tipo) && !DEL_TECHO.has(item.tipo)) {
    return { a: 'piso' }
  }
  return null
}

/** Cómo se le dice al usuario a qué está pegada una pieza. */
export function comoSeLlama(ancla, items) {
  if (!ancla) return null
  if (ancla.a === 'piso') return 'el piso'
  if (ancla.a === 'techo') return 'el plafón'
  if (ancla.a === 'muro') return MUROS[ancla.muro]?.label ?? 'un muro'
  const m = items.find((i) => i.id === ancla.id)
  return MUEBLES[m?.tipo]?.label ?? 'un mueble'
}

/**
 * Recalcula dónde va cada pieza anclada.
 *
 * Se corre después de cualquier cambio de medidas o de acomodo. Los muebles se
 * resuelven antes que lo que llevan encima —y sólo un nivel: nadie apila una
 * repisa sobre una lámpara sobre un buró, y perseguir cadenas aquí sería
 * resolver un problema que no existe.
 */
export function resolverAnclas(plano) {
  const items = plano.items ?? []
  const hx = (plano.ancho ?? 4) / 2
  const hz = (plano.largo ?? 4) / 2
  const porId = new Map(items.map((i) => [i.id, i]))

  return items.map((it) => {
    const a = it.ancla
    if (!a) return it

    if (a.a === 'muro') {
      const m = MUROS[a.muro]
      if (!m) return it
      const sep = a.sep ?? 0
      // sobre el muro: la coordenada del eje la fija el muro, la otra el avance
      const fijo = (m.eje === 'x' ? hx : hz) * m.signo - m.signo * sep
      const corre = (m.eje === 'x' ? hz : hx) * (a.t * 2 - 1)
      const x = m.eje === 'x' ? fijo : corre
      const z = m.eje === 'x' ? corre : fijo
      if (Math.abs(x - it.x) < 0.0005 && Math.abs(z - it.z) < 0.0005) return it
      return { ...it, x, z, y: a.y ?? it.y }
    }

    if (a.a === 'techo') {
      const x = (a.u - 0.5) * (plano.ancho ?? 4)
      const z = (a.v - 0.5) * (plano.largo ?? 4)
      if (Math.abs(x - it.x) < 0.0005 && Math.abs(z - it.z) < 0.0005) return it
      return { ...it, x, z, y: a.y ?? it.y }
    }

    if (a.a === 'piso') {
      if ((it.y ?? 0) === 0) return it
      return { ...it, y: 0 }
    }

    const base = porId.get(a.id)
    if (!base) return it
    const rot = base.rot ?? 0
    const x = base.x + (a.lx ?? 0) * Math.cos(rot) + (a.lz ?? 0) * Math.sin(rot)
    const z = base.z - (a.lx ?? 0) * Math.sin(rot) + (a.lz ?? 0) * Math.cos(rot)
    const y = (MUEBLES[base.tipo]?.alto ?? 0.4) + (a.sobre ?? 0)
    if (Math.abs(x - it.x) < 0.0005 && Math.abs(z - it.z) < 0.0005 && Math.abs(y - (it.y ?? 0)) < 0.0005) {
      return it
    }
    return { ...it, x, z, y }
  })
}

/* A qué altura cuelga cada cosa de muro. Son las de la casa, no las de un
   catálogo: una ventana empieza a un metro, un cuadro se cuelga con su centro
   a la altura de los ojos, un reloj más arriba que la puerta. */
const ALTO_EN_MURO = {
  ventana: 1.5,
  ventanalCorredizo: 1.2,
  persiana: 2.0,
  puerta: 1.05,
  cuadro: 1.55,
  cuadroSolo: 1.55,
  cuadroArte: 1.55,
  cuadroGrande: 1.5,
  triptico: 1.55,
  muroCuadros: 1.5,
  relojPared: 2.05,
  espejo: 1.5,
  toallero: 1.1,
}

/** El giro que deja la pieza viendo hacia adentro del cuarto. */
const GIRO_MURO = { 'z-': 0, 'z+': Math.PI, 'x-': Math.PI / 2, 'x+': -Math.PI / 2 }

/**
 * Poner una pieza de muro donde le toca: EN el muro.
 *
 * Una ventana no se pone en el piso y luego se sube a mano. Se pica cerca de
 * un muro y se pega a ese muro, a su altura, mirando al cuarto y anclada de
 * una vez. Antes toda pieza nueva nacía en el suelo y en el centro, y las
 * ventanas quedaban tiradas en la alfombra.
 */
export function ponerEnMuro(item, plano) {
  if (!MUEBLES_DE_MURO.has(item.tipo)) return item
  const cerca = murosCerca(item, plano)[0]
  if (!cerca) return item
  const m = MUROS[cerca.muro]
  const hx = (plano.ancho ?? 4) / 2
  const hz = (plano.largo ?? 4) / 2
  const sep = 0.02
  const fijo = (m.eje === 'x' ? hx : hz) * m.signo - m.signo * sep
  const puesto = {
    ...item,
    x: m.eje === 'x' ? fijo : item.x,
    z: m.eje === 'x' ? item.z : fijo,
    y: ALTO_EN_MURO[item.tipo] ?? 1.5,
    rot: GIRO_MURO[cerca.muro] ?? 0,
  }
  return { ...puesto, ancla: anclaEnMuro(puesto, plano, cerca.muro) }
}
