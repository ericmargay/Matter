import * as THREE from 'three'

/**
 * El cable de alimentación, dibujado como cae de verdad.
 *
 * Un plano que enseña aparatos sin cable miente por omisión, y la mentira se
 * cobra el día de la instalación: la lámpara de piso que quedó preciosa a tres
 * metros del único contacto, la tele colgada sin canaleta con el cable
 * colgando a la vista, el enchufe inteligente que iba detrás del mueble y no
 * alcanza. El cable es la mitad de las conversaciones incómodas de una obra.
 *
 * Por eso se modela con lo que de verdad importa: cuánto mide, por dónde sale
 * del aparato y por dónde va hasta el contacto. Si no alcanza, se ve que no
 * alcanza.
 *
 * La curva es una catenaria de tres puntos, no una línea recta: un cable
 * cuelga, y cuando sobra se hace una lazada en el piso. Dibujarlo recto lo
 * volvería un diagrama de conexiones y perdería justo el dato —que sobra o que
 * falta— por el que está aquí.
 */

export const RUTAS = {
  piso: {
    label: 'Por el piso',
    porque: 'Como queda si no se hace nada. Se ve, se pisa y se enreda; en un plano hay que verlo antes de decidir.',
  },
  muro: {
    label: 'Sobre el muro, con canaleta',
    porque: 'Sube pegado a la pared en canaleta. Sin obra, se nota poco y se puede cambiar después.',
  },
  oculto: {
    label: 'Dentro del muro',
    porque: 'Ranurado y resanado. Es lo que se ve mejor y lo único que pide obra: se decide antes de pintar.',
  },
}

export const SALIDAS = {
  atras: { label: 'Por atrás', p: [0, 0.5, -1] },
  abajo: { label: 'Por abajo', p: [0, 0, 0] },
  lado: { label: 'Por un costado', p: [1, 0.5, 0] },
  arriba: { label: 'Por arriba', p: [0, 1, 0] },
}

export const cableVacio = () => ({ largo: 1.8, salida: 'atras', ruta: 'piso', enchufe: null })

/**
 * ¿Este aparato lleva cable a un contacto?
 *
 * De pila no lleva; cableado tampoco —ése va empotrado y no se ve—; y lo que
 * se enchufa, sí. Es la diferencia entre un plano que enseña la instalación y
 * uno que enseña muebles bonitos: los cables son la mitad de los problemas de
 * una obra y no se pueden dejar fuera solo porque afean.
 */
export function llevaCable(device) {
  if (!device) return false
  if (device.power !== 'corriente' && device.power !== 'enchufe') return false
  /* Un FOCO no lleva cable a un contacto: se enrosca en un portalámparas y el
     cable, si hay, es el de la lámpara que lo sostiene. Dibujárselo llenaba el
     cuarto de cables bajando del plafón hasta el zoclo, que es exactamente lo
     que no pasa en ninguna casa. Los paneles y las tiras sí: ésos traen su
     eliminador y hay que enchufarlo en algún lado. */
  if (device.cat === 'iluminacion' && (device.luz?.forma ?? 'punto') === 'punto') return false
  return true
}

/**
 * El cable con el que sale de fábrica, según qué es.
 *
 * No son inventados: 1.5 m es lo que trae casi todo lo de mesa, las lámparas
 * de piso traen 1.8 y las teles y los electrodomésticos grandes 1.2 —que es
 * justo por lo que nunca alcanzan—. Se puede cambiar en el taller de la pieza.
 */
export function cablePorDefecto(device) {
  const largo = /pantalla|refri|lavadora|secadora|electro/.test(`${device?.cat ?? ''}`)
    ? 1.2
    : device?.cat === 'iluminacion'
      ? 1.8
      : 1.5
  return { largo, salida: 'atras', ruta: 'piso', enchufe: null }
}

/** Dónde sale el cable del aparato, en coordenadas del mundo. */
export function puntoSalida(item, caja, salida = 'atras') {
  const s = SALIDAS[salida] ?? SALIDAS.atras
  const cx = caja ? (caja.min.x + caja.max.x) / 2 : 0
  const cy = caja ? (caja.min.y + caja.max.y) / 2 : 0.1
  const cz = caja ? (caja.min.z + caja.max.z) / 2 : 0
  const hx = caja ? (caja.max.x - caja.min.x) / 2 : 0.1
  const hy = caja ? (caja.max.y - caja.min.y) / 2 : 0.1
  const hz = caja ? (caja.max.z - caja.min.z) / 2 : 0.1

  const local = new THREE.Vector3(cx + s.p[0] * hx, caja ? (s.p[1] === 0 ? caja.min.y : cy + s.p[1] * hy) : 0.1, cz + s.p[2] * hz)
  local.applyAxisAngle(new THREE.Vector3(0, 1, 0), item.rot ?? 0)
  return new THREE.Vector3(item.x + local.x, (item.y ?? 0) + local.y, item.z + local.z)
}
