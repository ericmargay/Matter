import * as THREE from 'three'

/**
 * Coreografía de cámara.
 *
 * Un keyframe por capítulo, en el mismo orden que content/site.js.
 *   pos    — posición de la cámara
 *   target — a dónde mira
 *   cut    — 0 casa cerrada · 1 casa abierta (dollhouse)
 *   up     — 0 planta alta oculta · 1 visible
 *   lift   — 0 pisos apilados · 1 axonometría explotada
 *   net    — 0 casa sólida · 1 casa apagada con la malla Thread encima
 *   fov    — se interpola también; da sensación de lente
 *
 * `up` es lo que resuelve el problema de los dos niveles: para mirar un
 * cuarto de planta baja la losa de arriba estorba, así que desaparece. Al
 * subir de capítulo vuelve. En el corte los dos pisos se separan en el aire,
 * que es el momento donde se entiende que la casa tiene dos plantas.
 *
 * La casa mide 16 × 10 en planta (x: -8..8, z: -5..5); PB en y=0 y PA en y=3.1.
 */
export const KEYFRAMES = [
  // 0 · exterior — la casa completa desde la calle, de noche
  { pos: [24, 13, 30], target: [0, 2.4, 0], cut: 0, up: 1, lift: 0, net: 0, fov: 30 },

  // 1 · llegada — a nivel de calle, frente al garage
  { pos: [-6.4, 2.8, 20], target: [-5.6, 1.8, 5.2], cut: 0, up: 1, lift: 0, net: 0, fov: 42 },

  // 2 · corte — el techo se va y los dos pisos se separan
  { pos: [21, 19, 24], target: [0, 2.6, 0], cut: 1, up: 1, lift: 1, net: 0, fov: 28 },

  // ── planta baja: la losa de arriba se quita para poder ver ──
  // 3 · recibidor (frente-centro)
  { pos: [4.5, 7.0, 16.5], target: [-1.0, 0.6, 3.0], cut: 1, up: 0, lift: 0, net: 0, fov: 30 },
  // 4 · sala (frente-derecha)
  { pos: [11.5, 7.6, 15.5], target: [4.4, 0.6, 2.8], cut: 1, up: 0, lift: 0, net: 0, fov: 30 },
  // 5 · cocina (fondo-derecha)
  { pos: [15.5, 8.0, 6.5], target: [4.6, 0.6, -2.2], cut: 1, up: 0, lift: 0, net: 0, fov: 30 },
  // 6 · medio baño (fondo-centro)
  { pos: [2.0, 6.2, -12.5], target: [-1.0, 0.7, -3.4], cut: 1, up: 0, lift: 0, net: 0, fov: 32 },

  // ── planta alta ─────────────────────────────────────────────
  // 7 · recámara (fondo-derecha)
  { pos: [15.5, 10.8, 6.0], target: [4.6, 3.7, -2.4], cut: 1, up: 1, lift: 0, net: 0, fov: 30 },
  // 8 · baño principal (fondo-centro)
  { pos: [1.5, 9.6, -12.0], target: [-1.0, 3.8, -3.1], cut: 1, up: 1, lift: 0, net: 0, fov: 32 },
  // 9 · estudio (fondo-izquierda)
  { pos: [-14.5, 10.2, -5.0], target: [-5.6, 3.7, -2.7], cut: 1, up: 1, lift: 0, net: 0, fov: 30 },
  // 10 · balcón (frente-derecha, arriba)
  { pos: [11.2, 8.4, 13.2], target: [5.2, 3.5, 2.4], cut: 1, up: 1, lift: 0, net: 0, fov: 30 },

  // 11 · red — cenital, la casa se apaga y la malla se enciende
  { pos: [1.0, 27, 22], target: [0, 1.8, 0], cut: 1, up: 1, lift: 0, net: 1, fov: 30 },
]

export const CHAPTER_COUNT = KEYFRAMES.length

/** Capítulos donde la cámara mira la planta alta. */
export const UPPER_CHAPTERS = new Set([7, 8, 9, 10])

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
  return THREE.MathUtils.clamp((f - 0.35) / 1.25, 0, 1)
}
