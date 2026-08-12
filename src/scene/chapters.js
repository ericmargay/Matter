import * as THREE from 'three'

/**
 * Coreografía de cámara.
 *
 * Un keyframe por capítulo, en el mismo orden que content/tour.js.
 *   pos    — posición de la cámara
 *   target — a dónde mira
 *   cut    — 0 casa cerrada · 1 casa abierta (dollhouse)
 *   up     — 0 planta alta oculta · 1 visible
 *   lift   — 0 pisos apilados · 1 axonometría explotada
 *   net    — 0 casa sólida · 1 casa apagada con la malla Thread encima
 *   fov    — se interpola también; da sensación de lente
 *
 * El recorrido ENTRA a la casa en vez de sobrevolarla. Los primeros
 * capítulos van a altura de ojo (1.6–2.6 m) con lente ancho, y la casa
 * permanece CERRADA (`cut: 0`): con el techo puesto y los muros opacos,
 * un cuarto se siente cuarto. La vista de maqueta se guarda para un solo
 * momento —el levantamiento— donde sí aporta.
 *
 * La casa mide 16 × 10 en planta (x: -8..8, z: -5..5); PB en y=0 y PA en y=3.1.
 * Fachada en z=5: portón centrado en x=-5.6, puerta principal en x=-1.0.
 */
export const KEYFRAMES = [
  /* 0 · desde la calle — el encuadre abre apuntando al portón y a la
       puerta, que es de lo que trata el primer capítulo */
  { pos: [-2.0, 2.8, 15.5], target: [-4.6, 2.1, 5.2], cut: 0, up: 1, lift: 0, net: 0, fov: 48 },

  // 1 · la llegada — a un lado de la rampa, el coche cruza de frente
  { pos: [-0.4, 2.0, 12.5], target: [-5.2, 1.5, 6.0], cut: 0, up: 1, lift: 0, net: 0, fov: 54 },

  // 2 · dentro del garage, junto al portón
  { pos: [-3.45, 1.95, 4.65], target: [-6.2, 1.15, 1.9], cut: 0, up: 1, lift: 0, net: 0, fov: 58 },

  // 3 · recibidor, mirando la consola donde vive el tag NFC
  { pos: [-0.5, 1.65, 4.3], target: [-2.75, 1.3, 2.0], cut: 0, up: 1, lift: 0, net: 0, fov: 58 },

  // 4 · el levantamiento — el único momento de maqueta, y por eso pega
  { pos: [21, 19, 24], target: [0, 2.6, 0], cut: 1, up: 1, lift: 1, net: 0, fov: 28 },

  // ── planta baja: la losa de arriba se quita para poder ver ──
  // 5 · sala
  { pos: [7.2, 7.8, 17.0], target: [4.6, 0.6, 2.6], cut: 1, up: 0, lift: 0, net: 0, fov: 30 },
  // 6 · cocina
  { pos: [15.5, 8.0, 6.5], target: [4.6, 0.6, -2.2], cut: 1, up: 0, lift: 0, net: 0, fov: 30 },
  // 7 · medio baño
  { pos: [2.0, 6.2, -12.5], target: [-1.0, 0.7, -3.4], cut: 1, up: 0, lift: 0, net: 0, fov: 32 },

  // ── planta alta ─────────────────────────────────────────────
  // 8 · recámara
  { pos: [15.5, 10.8, 6.0], target: [4.6, 3.7, -2.4], cut: 1, up: 1, lift: 0, net: 0, fov: 30 },
  // 9 · baño principal
  { pos: [1.5, 9.6, -12.0], target: [-1.0, 3.8, -3.1], cut: 1, up: 1, lift: 0, net: 0, fov: 32 },
  // 10 · estudio
  { pos: [-15.0, 9.8, -2.5], target: [-5.6, 3.7, -2.7], cut: 1, up: 1, lift: 0, net: 0, fov: 30 },
  // 11 · balcón
  { pos: [11.2, 8.4, 13.2], target: [5.2, 3.5, 2.4], cut: 1, up: 1, lift: 0, net: 0, fov: 30 },

  // 12 · red — cenital, la casa se apaga y la malla se enciende
  { pos: [1.0, 27, 22], target: [0, 1.8, 0], cut: 1, up: 1, lift: 0, net: 1, fov: 30 },
]

export const CHAPTER_COUNT = KEYFRAMES.length

/** El capítulo del levantamiento: el único con vista de maqueta. */
export const CORTE = 4

/** Capítulos con centro de control (los de cuarto). */
export const ROOM_CHAPTERS = [3, 5, 6, 7, 8, 9, 10, 11]

/** Suaviza el tramo entre capítulos: sin esto el movimiento se siente robótico. */
const smooth = (t) => t * t * (3 - 2 * t)

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()

/**
 * Muestrea la coreografía en un punto del recorrido.
 * Escribe en los vectores que recibe para no crear basura cada frame.
 */
export function sampleCamera(progress, outPos, outTarget) {
  const f = THREE.MathUtils.clamp(progress, 0, 1) * (CHAPTER_COUNT - 1)
  const i = Math.min(Math.floor(f), CHAPTER_COUNT - 2)
  const t = smooth(f - i)

  const a = KEYFRAMES[i]
  const b = KEYFRAMES[i + 1]

  outPos.copy(_a.fromArray(a.pos)).lerp(_b.fromArray(b.pos), t)
  outTarget.copy(_a.fromArray(a.target)).lerp(_b.fromArray(b.target), t)

  return {
    cut: THREE.MathUtils.lerp(a.cut, b.cut, t),
    up: THREE.MathUtils.lerp(a.up, b.up, t),
    lift: THREE.MathUtils.lerp(a.lift, b.lift, t),
    net: THREE.MathUtils.lerp(a.net, b.net, t),
    fov: THREE.MathUtils.lerp(a.fov, b.fov, t),
    index: i,
    t,
  }
}

/** Índice de capítulo "activo" para la UI: redondea al más cercano. */
export function activeChapter(progress) {
  const f = THREE.MathUtils.clamp(progress, 0, 1) * (CHAPTER_COUNT - 1)
  return Math.round(f)
}

/**
 * Avance dentro del capítulo de llegada, 0..1.
 * Lo usa el coche para acercarse conforme haces scroll en vez de arrancar
 * con una animación que corre sola sin que nadie la pida.
 */
export function arrivalProgress(progress) {
  const f = THREE.MathUtils.clamp(progress, 0, 1) * (CHAPTER_COUNT - 1)
  return THREE.MathUtils.clamp((f - 0.3) / 1.3, 0, 1)
}
