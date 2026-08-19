import { DEVICE_BY_ID } from './catalog'

/**
 * Cuánto cuesta instalar, por espacio.
 *
 * El modelo anterior cobraba mano de obra POR PIEZA y eso infla la cotización
 * hasta volverla irreal: un departamento de cuarenta y ocho piezas salía con
 * más instalación que equipo. No es como se trabaja. El instalador no cobra
 * por foco: llega a un cuarto, saca la escalera, corta el circuito, y en esa
 * misma visita resuelve lo que haya. El sexto foco de una recámara no cuesta
 * lo mismo que el primero — cuesta casi nada.
 *
 * Así que se cobra por espacio, con tres componentes:
 *
 * 1. **Base del espacio**, según qué tan estorboso es trabajarlo. Un baño con
 *    plafón bajo y azulejo cuesta más que una recámara vacía aunque lleve
 *    menos piezas.
 * 2. **Escalón por volumen**, no lineal. Entre una y tres piezas es la misma
 *    visita; de ahí sube por tramos.
 * 3. **Recargos concretos**, solo por lo que de verdad agrega trabajo: abrir
 *    caja sin neutro, ajustar un motor de cortina, subir una cámara, tocar
 *    agua o gas.
 *
 * Y un piso: un proyecto no puede costar menos que un día de trabajo, aunque
 * sean cuatro cuartos con dos focos cada uno.
 */

/* ── base por tipo de espacio ─────────────────────────────────── */

const BASE = {
  bano: { precio: 900, porque: 'Plafón bajo, azulejo y humedad: todo se atornilla con cuidado.' },
  cocina: { precio: 1100, porque: 'Gabinetes, campana y circuitos separados. Es el espacio que más estorba.' },
  servicio: { precio: 800, porque: 'Zotehuela: instalación a la vista y tomas de lavadora.' },
  recamara: { precio: 700, porque: 'Espacio despejado y trabajo parejo.' },
  sala: { precio: 800, porque: 'Muros largos y mucho mueble que mover.' },
  comedor: { precio: 700, porque: 'Colgantes al centro y poco más.' },
  estudio: { precio: 750, porque: 'Escritorio, red y varias tomas.' },
  cochera: { precio: 950, porque: 'Portón, exterior y cableado a la intemperie.' },
  exterior: { precio: 1000, porque: 'Intemperie: sellado y protección de cada punto.' },
  interior: { precio: 700, porque: 'Espacio general.' },
}

/* ── escalón por cantidad ─────────────────────────────────────── */

const TRAMOS = [
  { hasta: 3, extra: 0, porque: 'Entra en la misma visita' },
  { hasta: 7, extra: 450, porque: 'Media jornada' },
  { hasta: 12, extra: 950, porque: 'Jornada completa' },
  { hasta: 20, extra: 1600, porque: 'Jornada larga o dos visitas' },
  { hasta: Infinity, extra: 2400, porque: 'Dos jornadas' },
]

/* ── recargos por lo que de verdad cuesta ─────────────────────── */

const RECARGOS = [
  {
    id: 'sinNeutro',
    label: 'Módulos en caja sin neutro',
    precio: 350,
    porque: 'Hay que abrir, verificar y a veces irse a la luminaria.',
    aplica: (d) => d.cat === 'control' && d.power === 'cableado',
  },
  {
    id: 'motor',
    label: 'Motor de cortina o persiana',
    precio: 700,
    porque: 'Ajuste mecánico y aprendizaje de recorrido, pieza por pieza.',
    aplica: (d) => d.cat === 'cortinas',
  },
  {
    id: 'altura',
    label: 'Cámaras y acceso',
    precio: 550,
    porque: 'Trabajo en altura o en marco de puerta, con cableado propio.',
    aplica: (d) => d.cat === 'camaras' || d.cat === 'acceso',
  },
  {
    id: 'obra',
    label: 'Agua o gas',
    precio: 1200,
    porque: 'Pide oficio distinto y prueba de hermeticidad.',
    aplica: (d) => d.cat === 'agua' || d.id?.startsWith('gas-') || d.id === 'valvula-gas',
  },
  {
    id: 'red',
    label: 'Puntos de red',
    precio: 600,
    porque: 'Cable, ponchado y certificación por punto.',
    aplica: (d) => d.cat === 'red',
  },
]

/** El mínimo de un proyecto: nadie sale de casa por menos. */
export const MINIMO_PROYECTO = 2200

/**
 * Instalación de UN espacio.
 * @returns { total, base, tramo, recargos: [{label, precio, veces, porque}], piezas }
 */
/**
 * Acomodo de cables: la partida que casi nadie cotiza y todo mundo reclama.
 *
 * Sin ella, cada aparato queda con su cable de fábrica cayendo por donde caiga
 * y el cuarto termina con seis cables cruzando el zoclo. Con ella, se traza
 * una ruta: se agrupan los que van al mismo lado, se llevan pegados al rodapié
 * o por dentro del muro y se rematan.
 *
 * Se cobra por punto y no a ojo, porque el trabajo es por punto: cada aparato
 * es abrir, medir, sujetar y rematar. Y el precio cambia según hasta dónde se
 * quiera esconder, que es exactamente la decisión que se toma en el taller de
 * cada pieza.
 */
export const ACOMODOS = {
  ninguno: {
    id: 'ninguno',
    label: 'Sin acomodo',
    precio: 0,
    porque: 'Cada cable cae por donde caiga. Es lo que pasa si nadie lo pide.',
  },
  canaleta: {
    id: 'canaleta',
    label: 'Canaleta al color del muro',
    precio: 180,
    porque: 'Ruta ordenada por rodapié y esquinas, pegada y pintada del color de la pared. Sin obra y reversible.',
  },
  ranurado: {
    id: 'ranurado',
    label: 'Ranurado en muro',
    precio: 420,
    porque: 'Se abre el muro, se mete manguera, se resana y se pinta. No se ve nada. Se decide ANTES de pintar o no se hace.',
  },
  piso: {
    id: 'piso',
    label: 'Por piso técnico o zoclo hueco',
    precio: 260,
    porque: 'Cuando el muro no se puede tocar —renta, tabla-roca de un lado— y hay zoclo que sí.',
  },
}

/**
 * @param puntos  cuántos aparatos llevan cable a acomodar
 * @param modo    cuál de los cuatro acomodos
 */
export function acomodoDeCables(puntos = 0, modo = 'ninguno') {
  const a = ACOMODOS[modo] ?? ACOMODOS.ninguno
  if (!puntos || a.precio === 0) return { ...a, puntos, importe: 0 }
  /* Mínimo de tres puntos aunque haya uno solo: montar, medir y remendar un
     tramo cuesta casi lo mismo por uno que por tres, y cobrar por uno deja el
     trabajo en pérdida. */
  return { ...a, puntos, importe: a.precio * Math.max(puntos, 3) }
}

export function instalacionDeEspacio(room) {
  const items = Object.entries(room.items ?? {}).filter(([, n]) => n > 0)
  const piezas = items.reduce((a, [, n]) => a + n, 0)
  if (piezas === 0) return { total: 0, base: 0, tramo: null, recargos: [], piezas: 0 }

  const tipo = room.tipo && BASE[room.tipo] ? room.tipo : inferirTipo(room.nombre)
  const base = BASE[tipo] ?? BASE.interior
  const tramo = TRAMOS.find((t) => piezas <= t.hasta)

  const recargos = []
  for (const r of RECARGOS) {
    let veces = 0
    for (const [id, n] of items) {
      const d = DEVICE_BY_ID[id]
      if (d && r.aplica(d)) veces += n
    }
    if (veces > 0) recargos.push({ ...r, veces, importe: r.precio * veces })
  }

  const total = base.precio + tramo.extra + recargos.reduce((a, r) => a + r.importe, 0)
  return { total, base: base.precio, basePorque: base.porque, tramo, recargos, piezas, tipo }
}

/** Del nombre del cuarto al tipo, cuando el levantamiento no lo trae. */
function inferirTipo(nombre = '') {
  const n = nombre.toLowerCase()
  if (/baño|bano|wc/.test(n)) return 'bano'
  if (/cocina/.test(n)) return 'cocina'
  if (/zotehuela|azotehuela|servicio|lavado/.test(n)) return 'servicio'
  if (/recámara|recamara|habitación|habitacion|dormitorio|cuarto/.test(n)) return 'recamara'
  if (/sala|estar|estancia/.test(n)) return 'sala'
  if (/comedor/.test(n)) return 'comedor'
  if (/estudio|oficina|home office/.test(n)) return 'estudio'
  if (/cochera|garage|garaje|estacionamiento/.test(n)) return 'cochera'
  if (/jardín|jardin|terraza|patio|roof/.test(n)) return 'exterior'
  return 'interior'
}

/** Instalación de todo el proyecto, espacio por espacio. */
export function instalacionDelProyecto(rooms = []) {
  const porEspacio = rooms
    .map((r) => ({ room: r, ...instalacionDeEspacio(r) }))
    .filter((x) => x.piezas > 0)

  const suma = porEspacio.reduce((a, x) => a + x.total, 0)
  const total = Math.max(suma, porEspacio.length ? MINIMO_PROYECTO : 0)

  return { porEspacio, suma, total, aplicoMinimo: total > suma }
}
