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

/**
 * La altura a la que de verdad queda la cubierta de un mueble.
 *
 * No es `def.alto` a secas: la pieza puede traer su propia altura en `props`,
 * la variante puede cambiarla otra vez y el taller una tercera. El buró es el
 * caso que lo destapó — se declara de 54 cm y se dibuja de 52, así que todo lo
 * que se le ponía encima quedaba flotando dos centímetros. Dos centímetros se
 * ven, y es de las cosas que hacen que un plano deje de creerse.
 */
export function altoDe(item) {
  const def = MUEBLES[item?.tipo]
  if (!def) return 0.4
  const va = def.variantes?.find((v) => v.id === item.variante)
  const props = { ...def.props, ...(va?.props ?? {}), ...(item.ajustes ?? {}) }
  /* `cubierta` es dónde queda la TAPA, que no es lo mismo que la altura
     nominal: el buró se declara de 52 y su cuerpo se dibuja de 2 a 44 porque
     el modelo le resta patas y remate. Ocho centímetros, y todo lo que se le
     ponía encima quedaba flotando. Se declara pieza por pieza porque cada
     modelo la resuelve a su manera; donde no está, la altura nominal es una
     aproximación buena. */
  return props.cubierta ?? def.cubierta ?? props.alto ?? props.h ?? item.huella?.alto ?? def.alto ?? 0.4
}

/** Media pieza, para saber dónde termina. */
const medio = (m, it) => ({
  w: (m?.w ?? 0.4) / 2,
  d: (m?.d ?? 0.4) / 2,
  alto: it ? altoDe(it) : (m?.alto ?? 0.4),
})

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
  /* La distancia se mide desde el CANTO de la pieza, no desde su centro, y con
     la huella YA GIRADA. Un sofá de noventa de fondo pegado a la pared tiene el
     centro a cuarenta y cinco centímetros de ella; y una cama de dos metros
     girada noventa grados presenta su lado corto, no el largo. Midiendo desde
     el centro, o con la huella sin girar, ningún mueble estaba nunca "en el
     muro" y ninguno se movía al estirar el cuarto. */
  const def = item.clase === 'mueble' ? MUEBLES[item.tipo] : null
  const c = Math.abs(Math.cos(item.rot ?? 0))
  const sn = Math.abs(Math.sin(item.rot ?? 0))
  const cantoX = def ? ((def.w ?? 0.4) * c + (def.d ?? 0.4) * sn) / 2 : 0
  const cantoZ = def ? ((def.w ?? 0.4) * sn + (def.d ?? 0.4) * c) / 2 : 0
  const cand = [
    ['x-', Math.abs(item.x + hx), (item.z + hz) / (hz * 2)],
    ['x+', Math.abs(item.x - hx), (item.z + hz) / (hz * 2)],
    ['z-', Math.abs(item.z + hz), (item.x + hx) / (hx * 2)],
    ['z+', Math.abs(item.z - hz), (item.x + hx) / (hx * 2)],
  ]
  const [muro, dist] = cand.reduce((a, b) => (b[1] < a[1] ? b : a))
  const canto = MUROS[muro].eje === 'x' ? cantoX : cantoZ
  /* Lo que va colgado del muro se pega siempre; un mueble de piso, sólo si de
     verdad está arrimado. Medio metro de holgura es lo que separa "está contra
     la pared" de "está cerca de la pared", que son dos cosas distintas. */
  const limite = MUEBLES_DE_MURO.has(item.tipo) || item.clase === 'punto' ? 0.3 : canto + 0.5
  if (dist > limite) return null
  /* La altura sólo la fija el muro para lo que de verdad cuelga de él. Un buró
     arrimado a la pared sigue estando en el suelo, y guardarle una altura
     hacía que el ancla se la devolviera: los burós quedaban flotando a cuarenta
     centímetros, que es justo su propia altura mal usada. */
  const cuelga = MUEBLES_DE_MURO.has(item.tipo) || item.clase === 'punto' || item.clase === 'equipo'
  /* El avance por el muro se guarda en METROS desde la esquina, no en
     proporción. Con proporción, estirar el cuarto medio metro corría el clóset
     veinticinco centímetros hacia el centro, y un clóset no se mueve porque el
     cuarto crezca: sigue a sesenta de su esquina. La proporción sólo tiene
     sentido en el plafón, donde los empotrados sí se reparten. */
  return {
    a: 'muro',
    muro,
    ...avanceEnMuro(item, plano, muro),
    ...(cuelga ? { y: item.y ?? 0.4 } : {}),
    sep: dist,
  }
}

/**
 * Dónde va la pieza a lo largo de su muro, y contra qué se mide.
 *
 * Guardar la distancia desde una esquina fija parece obvio y está mal: al
 * ensanchar el cuarto, los burós —que están junto a la cama, en medio del
 * muro— se iban corriendo hacia la izquierda porque su esquina de referencia
 * se alejaba. Lo que uno espera es que sigan junto a la cama.
 *
 * Así que la referencia es LA MÁS CERCANA de las tres: la esquina izquierda,
 * la derecha, o el centro del muro. Gana la que esté más cerca porque es la
 * que uno usaría al replantear —"a sesenta de la esquina" o "centrado con la
 * cama"— y porque es la que menos se mueve cuando el cuarto cambia.
 *
 * Un clóset arrimado a la esquina se queda en la esquina. Un buró junto a una
 * cama centrada se queda junto a la cama. Una ventana en medio del muro se
 * queda en medio. Sin más reglas y sin tener que preguntarle a nadie.
 */
export function avanceEnMuro(item, plano, muro) {
  const hx = (plano.ancho ?? 4) / 2
  const hz = (plano.largo ?? 4) / 2
  const eje = MUROS[muro].eje
  const largo = eje === 'x' ? hz * 2 : hx * 2
  const pos = eje === 'x' ? item.z + hz : item.x + hx
  const r = (n) => Math.round(n * 1000) / 1000
  const opciones = [
    { desde: 'inicio', off: r(pos) },
    { desde: 'fin', off: r(largo - pos) },
    { desde: 'centro', off: r(pos - largo / 2) },
  ]
  return opciones.reduce((a, b) => (Math.abs(b.off) < Math.abs(a.off) ? b : a))
}

/** El punto del muro, en coordenadas del cuarto, que le toca a ese avance. */
export function puntoEnMuro(a, largo) {
  if (a.desde === 'inicio') return -largo / 2 + (a.off ?? 0)
  if (a.desde === 'fin') return largo / 2 - (a.off ?? 0)
  if (a.desde === 'centro') return a.off ?? 0
  // planos viejos: distancia desde la esquina, o proporción
  const avance = a.d != null ? a.d : (a.t ?? 0.5) * largo
  return avance - largo / 2
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
  return { a: 'muro', muro, ...avanceEnMuro(item, plano, muro), y: item.y ?? 0.4, sep }
}

/** ¿`muroA` y `muroB` se juntan en una esquina? Sólo si corren en ejes
 *  distintos —dos paredes del mismo eje son la misma pared o la de
 *  enfrente, nunca vecinas—. */
export function sonContiguos(muroA, muroB) {
  const a = MUROS[muroA]
  const b = MUROS[muroB]
  return !!a && !!b && a.eje !== b.eje
}

/**
 * El ancla de una pieza esquinada: pegada a `muroA` —que decide hacia dónde
 * mira— y arrimada además a `muroB`, el que se junta con él en la esquina.
 *
 * Sigue siendo un ancla de muro común, la misma que ya entiende todo lo
 * demás (resolverAnclas, el panel, el historial); lo único que cambia es
 * que en vez de dejar que `avanceEnMuro` elija sola el extremo más cercano,
 * aquí se FIJA al extremo de la esquina compartida, con la separación
 * exacta que pide `sepB` medida desde la ORILLA de la pieza —su canto real,
 * ya girado hacia `muroA`— y no desde su centro. Sin el canto, una pieza
 * ancha se metería literalmente adentro de `muroB` antes de que su centro
 * llegara a los `sepB` pedidos.
 */
export function anclaEnEsquina(item, plano, muroA, muroB, sepA = 0.02, sepB = 0.02) {
  const base = anclaEnMuro(item, plano, muroA)
  if (!base || !sonContiguos(muroA, muroB)) return base

  const mA = MUROS[muroA]
  const mB = MUROS[muroB]
  const rot = GIRO_MURO[muroA] ?? item.rot ?? 0
  const c = Math.abs(Math.cos(rot))
  const sn = Math.abs(Math.sin(rot))
  const def = item.clase === 'mueble' ? MUEBLES[item.tipo] : null
  const cantoX = def ? ((def.w ?? 0.4) * c + (def.d ?? 0.4) * sn) / 2 : 0
  const cantoZ = def ? ((def.w ?? 0.4) * sn + (def.d ?? 0.4) * c) / 2 : 0
  // el canto a lo largo de muroA: si muroA corre en x, el canto que importa
  // es el de z, y viceversa
  const canto = mA.eje === 'x' ? cantoZ : cantoX

  // el extremo de muroA que colinda con muroB: 'inicio' del lado negativo
  // del eje de muroB, 'fin' del lado positivo — es la misma cuenta que ya
  // hace avanceEnMuro, sólo que aquí se fija en vez de elegir sola
  const desde = mB.signo < 0 ? 'inicio' : 'fin'
  return { ...base, sep: sepA, desde, off: canto + sepB }
}

/**
 * ¿Sobre qué mueble está apoyada esta pieza?
 *
 * Tiene que caer dentro de su huella y a una altura que se parezca a la de su
 * cubierta. Un Apple TV a un metro sobre el buró no está EN el buró, está
 * colgado del muro de atrás, y anclarlo al buró lo haría bajarse solo.
 */
/* Lo que va POR DEBAJO de los muebles y nunca encima de ellos. Un tapete
   anclado a la mesa de centro se subía a la cubierta, que es lo contrario de
   un tapete. */
const NUNCA_ENCIMA = new Set(['tapete', 'cuadroPiso'])

export function muebleBajo(item, items) {
  if (NUNCA_ENCIMA.has(item.tipo)) return null
  const y = item.y ?? 0
  let mejor = null
  for (const otro of items) {
    if (otro.id === item.id || otro.clase !== 'mueble') continue
    const def = MUEBLES[otro.tipo]
    if (!def) continue
    const { w, d, alto } = medio(def, otro)
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
      const largoMuro = (m.eje === 'x' ? hz : hx) * 2
      const corre = Math.max(
        -largoMuro / 2,
        Math.min(largoMuro / 2, puntoEnMuro(a, largoMuro)),
      )
      const x = m.eje === 'x' ? fijo : corre
      const z = m.eje === 'x' ? corre : fijo
      if (Math.abs(x - it.x) < 0.0005 && Math.abs(z - it.z) < 0.0005) return it
      return { ...it, x, z, ...(a.y != null ? { y: a.y } : {}) }
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
    const y = altoDe(base) + (a.sobre ?? 0)
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
export const GIRO_MURO = { 'z-': 0, 'z+': Math.PI, 'x-': Math.PI / 2, 'x+': -Math.PI / 2 }

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

/**
 * Agranda el cuarto si algo ya no cabe.
 *
 * La regla es de obra, no de dibujo: si el cliente quiere un clóset de 1.80
 * contra ese muro, el muro mide por lo menos 1.80. Antes el mueble se salía
 * por la pared y quedaba medio flotando en el patio, que no le sirve a nadie.
 *
 * Sólo CRECE, nunca encoge: achicar el cuarto es una decisión de quien mide, y
 * un editor que te devuelve las medidas cada vez que mueves algo es
 * insoportable. Y sólo se llama al colocar o al soltar una pieza, no al
 * escribir una medida a mano — ahí manda quien escribe.
 */
export function agrandarSiNoCabe(plano) {
  let ancho = plano.ancho ?? 4
  let largo = plano.largo ?? 4
  const porId = new Map((plano.items ?? []).map((i) => [i.id, i]))
  /* El muro del que de verdad cuelga una pieza, aunque sea de segunda mano:
     lo mismo si está anclada AL muro que si está encima de un mueble que a
     su vez está anclado al muro —un monitor sobre un escritorio arrimado a
     la pared hereda el muro del escritorio—. Solo un nivel, como en
     resolverAnclas: nadie apila un mueble sobre otro sobre otro. */
  const muroDeVerdad = (it) => {
    if (it.ancla?.a === 'muro') return MUROS[it.ancla.muro]
    if (it.ancla?.a === 'mueble') {
      const host = porId.get(it.ancla.id)
      if (host?.ancla?.a === 'muro') return MUROS[host.ancla.muro]
    }
    return null
  }
  for (const it of plano.items ?? []) {
    if (it.clase !== 'mueble') continue
    const def = MUEBLES[it.tipo]
    if (!def || MUEBLES_DE_MURO.has(it.tipo)) continue
    const c = Math.abs(Math.cos(it.rot ?? 0))
    const s = Math.abs(Math.sin(it.rot ?? 0))
    const ew = ((def.w ?? 0.4) * c + (def.d ?? 0.4) * s) / 2
    const ed = ((def.w ?? 0.4) * s + (def.d ?? 0.4) * c) / 2
    /* Si la pieza está pegada a un muro —directo, o de segunda mano por estar
       encima de algo que sí lo está— su x o su z —el eje perpendicular a ESE
       muro— no es un lugar libre: sale de restarle su separación a la mitad
       del cuarto (fijo = hx·signo − signo·sep), así que crece solo cuando el
       cuarto ya creció. Medir "le falta espacio" en ese eje con su huella de
       canto a canto es contarla dos veces, y en cuanto el fondo de la pieza
       es mayor que su separación al muro, cada acomodo la vuelve a alejar
       del centro y el cuarto no deja de crecer solo —esto se vio de verdad
       con un monitor sobre un escritorio arrimado al muro, que iba estirando
       el cuarto en cada arrastre de una ventana en el otro extremo, sin que
       nadie tocara ni el escritorio ni el monitor.
       El eje A LO LARGO del muro sigue contando: es la regla real de obra —un
       clóset de 1.80 contra la pared pide una pared de por lo menos 1.80—, y
       ese eje sí es un lugar libre aunque la pieza esté pegada al muro. */
    const muro = muroDeVerdad(it)
    if (muro?.eje !== 'x') ancho = Math.max(ancho, (Math.abs(it.x) + ew) * 2 + 0.06)
    if (muro?.eje !== 'z') largo = Math.max(largo, (Math.abs(it.z) + ed) * 2 + 0.06)
  }
  const redondo = (n) => Math.round(n * 100) / 100
  return { ancho: redondo(ancho), largo: redondo(largo) }
}

/** La huella en el piso de un mueble, ya girada, para probar traslapes. */
function huellasDePiso(items) {
  return items
    .map((it) => {
      if (it.clase !== 'mueble') return null
      /* Lo que va ENCIMA de otro mueble —un monitor sobre el escritorio, un
         Apple TV sobre un buró— no tiene huella propia en el piso: la presta
         su anfitrión. Contarlo aparte lo hacía chocar contra el mismo mueble
         que lo carga. */
      if (it.ancla?.a === 'mueble') return null
      const def = MUEBLES[it.tipo]
      if (!def || MUEBLES_DE_MURO.has(it.tipo)) return null
      const c = Math.abs(Math.cos(it.rot ?? 0))
      const s = Math.abs(Math.sin(it.rot ?? 0))
      return {
        x: it.x,
        z: it.z,
        hw: ((def.w ?? 0.4) * c + (def.d ?? 0.4) * s) / 2,
        hd: ((def.w ?? 0.4) * s + (def.d ?? 0.4) * c) / 2,
      }
    })
    .filter(Boolean)
}

/** ¿Ya se encima algún par de muebles en el piso de este plano? */
function haySolape(plano) {
  const huellas = huellasDePiso(resolverAnclas(plano))
  for (let a = 0; a < huellas.length; a++) {
    for (let b = a + 1; b < huellas.length; b++) {
      const A = huellas[a]
      const B = huellas[b]
      const solapaX = A.hw + B.hw - Math.abs(B.x - A.x)
      const solapaZ = A.hd + B.hd - Math.abs(B.z - A.z)
      if (solapaX > 0.001 && solapaZ > 0.001) return true
    }
  }
  return false
}

/**
 * Detiene el ancho o el largo justo antes de que dos muebles se toquen.
 *
 * No se reacomoda nada: si al encoger el cuarto un buró y una cama van a
 * quedar uno encima del otro, la medida sencillamente no llega hasta ahí. Es
 * la misma lógica que un metro de obra —no cabe, no se estira— y evita el
 * otro problema de mover piezas solas: un mueble que el cliente ya vio en un
 * lugar preciso no se le va a correr sin que él lo pida.
 *
 * Sólo se prueba lo que ENCOGE: agrandar nunca puede crear un traslape que no
 * existiera ya, y sólo entre `plano.ancho`/`largo` (lo declarado) y lo
 * pedido en el patch, por bisección —diez vueltas bastan para hilar
 * milímetros— hasta el punto exacto de contacto.
 */
export function limitarPorSolape(plano, patch) {
  const resultado = { ...patch }
  for (const campo of ['ancho', 'largo']) {
    if (patch[campo] == null) continue
    const actual = plano[campo] ?? 4
    let lo = patch[campo]
    if (lo >= actual) continue
    let hi = actual
    const candidato = { ...plano, ...resultado, [campo]: lo }
    if (!haySolape(candidato)) continue
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2
      if (haySolape({ ...plano, ...resultado, [campo]: mid })) lo = mid
      else hi = mid
    }
    resultado[campo] = Math.round(hi * 1000) / 1000
  }
  return resultado
}
