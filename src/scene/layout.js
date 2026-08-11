import { M } from './materials'

/**
 * La casa: 16 × 10 m en planta, dos niveles.
 *
 * PLANTA BAJA  (y = 0)                    PLANTA ALTA  (y = 3.1)
 *  z=-5 ┌────────┬────────┬──────────┐     ┌────────┬────────┬──────────┐
 *       │        │  BAÑO  │          │     │ESTUDIO │ BAÑO   │          │
 *       │ESCALERA│        │  COCINA  │     │        │PRINCIPAL│ RECÁMARA │
 *  z=0  │        ├────────┤          │     ├────────┼────────┤          │
 *       ├────────┤  PASO  ├──────────┤     │ TERRAZA│ PASILLO├──────────┤
 *       │ GARAGE │RECIBIDOR│   SALA   │     │(sobre  │        │  BALCÓN  │
 *  z=+5 └────────┴────────┴──────────┘     └─garage)┴────────┴──────────┘
 *      x=-8    x=-3.2   x=1.2      x=8
 *
 * Los ejes de partición son los mismos en los dos pisos (x = -3.2 y x = 1.2),
 * que es como se construye de verdad: los muros de carga se alinean.
 */
export const HOUSE = {
  x: 8,
  z: 5,
  t: 0.18, // espesor de muro
  wall: 2.9, // altura libre por nivel
  slab: 0.2, // espesor de losa entrepiso
  level: 3.1, // y del piso terminado de la planta alta
}

/** Altura del piso terminado de cada nivel. */
export const LEVEL_Y = [0, HOUSE.level]

export const ROOMS = {
  // ── planta baja ───────────────────────────────────────────
  garage: { floor: 0, x: [-8, -3.2], z: [0.6, 5], mat: () => M.concrete },
  recibidor: { floor: 0, x: [-3.2, 1.2], z: [0.6, 5], mat: () => M.tile },
  sala: { floor: 0, x: [1.2, 8], z: [0.6, 5], mat: () => M.woodFloor },
  cocina: { floor: 0, x: [1.2, 8], z: [-5, 0.6], mat: () => M.tile },
  bano: { floor: 0, x: [-3.2, 1.2], z: [-5, -1.8], mat: () => M.tile },
  pasoPB: { floor: 0, x: [-3.2, 1.2], z: [-1.8, 0.6], mat: () => M.woodFloor },
  escalera: { floor: 0, x: [-8, -3.2], z: [-5, 0.6], mat: () => M.woodFloor },

  // ── planta alta ───────────────────────────────────────────
  recamara: { floor: 1, x: [1.2, 8], z: [-5, 0.2], mat: () => M.woodFloorDark },
  balcon: { floor: 1, x: [1.2, 8], z: [0.2, 5], mat: () => M.deck, open: true },
  banoP: { floor: 1, x: [-3.2, 1.2], z: [-5, -1.2], mat: () => M.tile },
  pasoPA: { floor: 1, x: [-3.2, 1.2], z: [-1.2, 5], mat: () => M.woodFloor },
  estudio: { floor: 1, x: [-8, -3.2], z: [-5, -0.4], mat: () => M.woodFloor },
  terraza: { floor: 1, x: [-8, -3.2], z: [-0.4, 5], mat: () => M.deck, open: true },
}

/**
 * Hueco de escalera: la losa de la planta alta no puede taparlo.
 * Coincide con el tramo alto de la escalera de House.jsx — si mueves una,
 * mueve la otra o la escalera desemboca en el techo.
 */
export const STAIR_VOID = { x: [-6.8, -5.0], z: [-1.2, 0.7] }

/** Centro de un cuarto, a la altura de su nivel. */
export function roomCenter(id, y = 0) {
  const r = ROOMS[id]
  return [(r.x[0] + r.x[1]) / 2, LEVEL_Y[r.floor] + y, (r.z[0] + r.z[1]) / 2]
}

/** Cuartos que el recorrido visita, en orden de capítulo. */
export const TOUR = [
  'garage',
  'recibidor',
  'sala',
  'cocina',
  'bano',
  'recamara',
  'banoP',
  'estudio',
  'balcon',
]
