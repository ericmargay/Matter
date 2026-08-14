import * as P from '../../../scene/props'
import * as F from '../../../scene/fixtures'

/**
 * Qué se puede poner en un cuarto, según qué cuarto sea.
 *
 * El mobiliario no se modela aquí: se reusa el del recorrido de la casa, que
 * ya existe y ya está resuelto. Esos componentes llevan dentro un enganche a
 * la iluminación del tour (`useDimmed`), pero se apaga solo cuando el cuarto
 * no es uno de los del recorrido — que es siempre el caso aquí. Quedan como
 * geometría inerte, que es justo lo que se necesita: en el plano la luz no la
 * hace el mueble, la hacen los dispositivos levantados.
 *
 * `w` y `d` son la huella en metros. No son exactos al milímetro; sirven para
 * dibujar la selección y para avisar cuando algo no cabe.
 */

const A = (label, Comp, w, d, alto = 0.8, props = {}) => ({ label, Comp, w, d, alto, props })

export const MUEBLES = {
  /* ── sala y estar ── */
  sofa: A('Sofá', P.Sofa, 2.6, 0.95, 0.8),
  mesaCentro: A('Mesa de centro', P.CoffeeTable, 1.1, 0.6, 0.4),
  mueble_tv: A('Mueble de TV', P.MediaUnit, 2.0, 0.45, 0.5),
  tv: A('Pantalla', P.Tv, 1.7, 0.1, 1.1),
  tapete: A('Tapete', P.Rug, 3, 2, 0.02),
  librero: A('Librero', P.Shelf, 1.6, 0.35, 1.8),
  planta: A('Planta', P.Plant, 0.5, 0.5, 1.0),
  bocina: A('Bocina', P.Speaker, 0.25, 0.25, 0.4),

  /* ── recámara ── */
  cama: A('Cama', P.Bed, 1.9, 2.1, 0.6),
  buro: A('Buró', P.Nightstand, 0.45, 0.4, 0.55),
  closet: A('Clóset', P.Wardrobe, 1.8, 0.6, 2.2),

  /* ── comedor ──
     La isla de cocina hace de mesa: mismas proporciones y misma altura, y
     ahorra modelar una pieza que se vería igual. */
  mesaComedor: A('Mesa de comedor', P.Island, 1.9, 0.95, 0.78),

  /* ── cocina ── */
  barra: A('Barra de cocina', P.KitchenRun, 3.4, 0.65, 0.9),
  isla: A('Isla', P.Island, 1.9, 0.9, 0.9),
  refri: A('Refrigerador', P.Fridge, 0.75, 0.7, 1.8),

  /* ── baño ── */
  wc: A('WC', F.Toilet, 0.4, 0.7, 0.75),
  lavabo: A('Lavabo', F.Vanity, 1.0, 0.5, 0.85),
  regadera: A('Regadera', F.Shower, 1.1, 1.0, 2.1),
  espejo: A('Espejo', F.Mirror, 0.9, 0.05, 0.8),
  toallero: A('Toallero', F.TowelRail, 0.6, 0.1, 0.1),

  /* ── estudio ── */
  escritorio: A('Escritorio', P.Desk, 1.8, 0.7, 0.75),
  monitor: A('Monitor', P.Monitor, 1.05, 0.2, 0.5),
  silla: A('Silla', P.OfficeChair, 0.6, 0.6, 1.0),
  rack: A('Rack', P.Rack, 0.6, 0.6, 1.2),

  /* ── envolvente ── */
  ventana: A('Ventana', P.WindowUnit, 1.4, 0.1, 1.5),
  persiana: A('Persiana', P.Blinds, 1.4, 0.1, 1.5),
  puerta: A('Puerta corrediza', F.SlidingDoor, 2.2, 0.15, 2.3),
  cuadro: A('Cuadro', P.Artwork, 0.6, 0.05, 0.8),
}

/**
 * Qué ofrece cada tipo de cuarto.
 *
 * La lista no es "todo lo que existe" a propósito: quien levanta una recámara
 * no quiere ir descartando WCs. Siempre se puede abrir el catálogo completo.
 */
export const POR_TIPO = {
  sala: ['sofa', 'mesaCentro', 'mueble_tv', 'tv', 'tapete', 'librero', 'planta', 'bocina', 'mesaComedor', 'ventana', 'persiana', 'cuadro'],
  recamara: ['cama', 'buro', 'closet', 'tapete', 'tv', 'planta', 'ventana', 'persiana', 'cuadro'],
  cocina: ['barra', 'isla', 'refri', 'ventana', 'planta'],
  bano: ['wc', 'lavabo', 'regadera', 'espejo', 'toallero', 'ventana'],
  estudio: ['escritorio', 'monitor', 'silla', 'librero', 'rack', 'planta', 'ventana', 'persiana', 'cuadro'],
  comedor: ['mesaComedor', 'tapete', 'librero', 'planta', 'ventana', 'cuadro', 'bocina'],
  servicio: ['rack', 'librero', 'ventana'],
  exterior: ['planta', 'tapete', 'bocina'],
  generico: Object.keys(MUEBLES),
}

export const TIPOS = [
  { id: 'sala', label: 'Sala / estar' },
  { id: 'recamara', label: 'Recámara' },
  { id: 'cocina', label: 'Cocina' },
  { id: 'bano', label: 'Baño' },
  { id: 'comedor', label: 'Comedor' },
  { id: 'estudio', label: 'Estudio / oficina' },
  { id: 'servicio', label: 'Servicio / rack' },
  { id: 'exterior', label: 'Exterior' },
  { id: 'generico', label: 'Otro' },
]

/**
 * Adivina el tipo por el nombre del cuarto.
 *
 * Se acierta la mayoría de las veces porque los cuartos se llaman como se
 * llaman; cuando falla, el técnico lo corrige con un selector y su elección
 * queda guardada. Preguntar siempre habría sido un paso de más en el 90 % de
 * los casos.
 */
export function tipoPorNombre(nombre = '') {
  const n = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (/bano|banio|wc|toilet|medio bano/.test(n)) return 'bano'
  if (/recamara|dormitorio|habitacion|cuarto \d|alcoba/.test(n)) return 'recamara'
  if (/cocina|cocineta/.test(n)) return 'cocina'
  if (/comedor/.test(n)) return 'comedor'
  if (/estudio|oficina|despacho|home ?office|juntas|set|area abierta|open/.test(n)) return 'estudio'
  if (/rack|site|servicio|lavado|bodega|maquinas/.test(n)) return 'servicio'
  if (/jardin|terraza|balcon|patio|alberca|cochera|fachada|exterior/.test(n)) return 'exterior'
  // "abierta" salió de aquí: en un proyecto de oficinas, "Área abierta" es
  // plan abierto de trabajo y pide 300–500 lux, no los 100–200 de una sala
  if (/sala|estancia|family|recepcion|loft/.test(n)) return 'sala'
  return 'generico'
}

/** Muebles sugeridos para arrancar un cuarto que está en blanco. */
export const ARRANQUE = {
  recamara: [
    { tipo: 'cama', x: 0, z: -0.3, rot: 0 },
    { tipo: 'buro', x: -1.2, z: -1.1, rot: 0 },
    { tipo: 'closet', x: 0, z: 1.4, rot: Math.PI },
  ],
  bano: [
    { tipo: 'wc', x: -0.9, z: -0.7, rot: 0 },
    { tipo: 'lavabo', x: 0.6, z: -0.9, rot: 0 },
    { tipo: 'regadera', x: 0.6, z: 1.0, rot: 0 },
  ],
  sala: [
    { tipo: 'sofa', x: 0, z: 1.0, rot: Math.PI },
    { tipo: 'mesaCentro', x: 0, z: 0, rot: 0 },
    { tipo: 'mueble_tv', x: 0, z: -1.4, rot: 0 },
  ],
  cocina: [{ tipo: 'barra', x: 0, z: -1.2, rot: 0 }],
  estudio: [
    { tipo: 'escritorio', x: 0, z: -1.0, rot: 0 },
    { tipo: 'silla', x: 0, z: -0.2, rot: 0 },
  ],
}
