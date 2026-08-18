import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/**
 * La geometría del sistema.
 *
 * Dos ideas, y las dos importan más de lo que parecen.
 *
 * **El bisel es una fracción, no una medida.** Se pide 5 % y la función lo
 * traduce a metros contra la dimensión MENOR de la pieza. Así un sofá de 2.6 m
 * y un control remoto de 4 cm se ven del mismo lenguaje. Con un bisel en
 * metros, el mismo número redondea apenas el sofá y convierte el control en
 * una pastilla.
 *
 * **La variación tonal va en los vértices, no en una textura.** La cara de
 * arriba recibe algo más de luz y la de abajo algo menos, horneado en el color
 * por vértice. Es lo que hace que una caja deje de verse como una caja pintada
 * de un color plano — que es exactamente el defecto que separa una maqueta
 * diseñada de un prototipo. Y cuesta cero: sin archivos, sin memoria de
 * textura, y recolorear es cambiar un hex.
 *
 * Todo se cachea por firma. Una casa entera con cuarenta sillas comparte
 * cuarenta veces la misma geometría.
 */

const cache = new Map()

/** Redondea a 3 decimales para que dos piezas casi iguales compartan caché. */
const q = (n) => Math.round(n * 1000) / 1000

/**
 * Hornea la variación tonal en el color por vértice.
 *
 * Se usa la normal, no la altura: una cara que mira al techo se aclara y una
 * que mira al piso se oscurece, sin importar dónde esté la pieza. Las caras
 * laterales quedan en el color base, que es donde vive la identidad del
 * objeto.
 */
function tintar(geometria, tono) {
  const pos = geometria.attributes.position
  const nor = geometria.attributes.normal
  const col = new Float32Array(pos.count * 3)

  for (let i = 0; i < pos.count; i++) {
    // -1 mirando al piso, +1 mirando al techo
    const arriba = nor.getY(i)
    const f = 1 + arriba * tono
    col[i * 3] = f
    col[i * 3 + 1] = f
    col[i * 3 + 2] = f
  }

  geometria.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return geometria
}

/**
 * Caja con los cantos suavizados.
 *
 * @param w,h,d    medidas en metros
 * @param bisel    fracción de la dimensión menor (0.02–0.08 es el rango sano)
 * @param tono     cuánto separa la cara de arriba de la de abajo
 */
export function caja(w, h, d, bisel = 0.055, tono = 0.16) {
  const menor = Math.min(w, h, d)
  // el bisel nunca puede pasar de la mitad de la dimensión menor o la
  // geometría se colapsa sobre sí misma
  const r = Math.min(menor * bisel, menor * 0.49)
  const clave = `c${q(w)}|${q(h)}|${q(d)}|${q(r)}|${q(tono)}`

  if (!cache.has(clave)) {
    // segmentos según qué tan grande es el bisel: uno chico no necesita más
    const seg = r < 0.02 ? 2 : r < 0.06 ? 3 : 4
    cache.set(clave, tintar(new RoundedBoxGeometry(w, h, d, seg, r), tono))
  }
  return cache.get(clave)
}

/** Cilindro con los suficientes lados para que la silueta salga limpia. */
export function cilindro(rArriba, rAbajo, alto, tono = 0.16, lados = 24) {
  const clave = `y${q(rArriba)}|${q(rAbajo)}|${q(alto)}|${lados}|${q(tono)}`
  if (!cache.has(clave)) {
    cache.set(clave, tintar(new THREE.CylinderGeometry(rArriba, rAbajo, alto, lados, 1), tono))
  }
  return cache.get(clave)
}

/** Cápsula: patas, tallos, brazos de lámpara. */
export function capsula(radio, largo, tono = 0.16) {
  const clave = `k${q(radio)}|${q(largo)}|${q(tono)}`
  if (!cache.has(clave)) cache.set(clave, tintar(new THREE.CapsuleGeometry(radio, largo, 4, 16), tono))
  return cache.get(clave)
}

export function esfera(radio, tono = 0.16, seg = 20) {
  const clave = `e${q(radio)}|${seg}|${q(tono)}`
  if (!cache.has(clave)) cache.set(clave, tintar(new THREE.SphereGeometry(radio, seg, Math.round(seg * 0.7)), tono))
  return cache.get(clave)
}

/**
 * Placa redondeada tumbada: tapetes, cuadros, pantallas.
 * Es una caja muy delgada, pero con el bisel calculado contra el LADO y no
 * contra el grosor — si no, un tapete de 2 cm de alto no se redondearía nada.
 */
export function placa(w, d, grosor = 0.02, bisel = 0.055, tono = 0.16) {
  const r = Math.min(Math.min(w, d) * bisel, grosor * 0.49)
  const clave = `p${q(w)}|${q(d)}|${q(grosor)}|${q(r)}|${q(tono)}`
  if (!cache.has(clave)) cache.set(clave, tintar(new RoundedBoxGeometry(w, grosor, d, 2, r), tono))
  return cache.get(clave)
}

export const limpiarGeometrias = () => cache.clear()
