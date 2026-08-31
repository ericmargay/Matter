import { DEVICE_BY_ID } from '../../../content/catalog'

import { MUEBLES } from './catalogo'

/**
 * Qué dispositivo vive DENTRO o ENCIMA de un mueble.
 *
 * Un foco inteligente casi nunca se instala solo: se mete en la lámpara que ya
 * está en el cuarto. En el plano son dos piezas —la lámpara y el foco— y eso
 * es correcto para cotizar, pero es falso para el cliente: él ve una lámpara,
 * y cuando la señala y pregunta "¿ésta se puede apagar desde el teléfono?", la
 * respuesta tiene que estar ahí, en la lámpara, no en un punto invisible
 * flotando adentro.
 *
 * Lo mismo pasa con el buró que carga el Echo, el escritorio con el nodo de
 * malla encima o el mueble de la tele con el Apple TV. La relación no se
 * declara a mano: se deduce de dónde quedaron las cosas, que es como se
 * levantó de verdad y además aguanta que alguien mueva una pieza después.
 */

/* Cuánto se estira la huella del mueble para considerar que algo está "en" él.
   Un foco dentro de una pantalla cae casi en el eje; un Apple TV apoyado en el
   buró puede estar recorrido unos centímetros. */
const HOLGURA = 0.12

/** Alto máximo sobre la base del mueble para que cuente como "encima". */
const ARRIBA = 0.5

export function dispositivosDe(mueble, items = []) {
  if (!mueble || mueble.clase !== 'mueble') return []
  const def = MUEBLES[mueble.tipo]
  if (!def) return []

  const variante = def.variantes?.find((x) => x.id === mueble.variante)
  const esc = mueble.esc ?? 1
  const w = ((variante?.props?.w ?? def.w) + HOLGURA * 2) * esc
  const d = ((variante?.props?.d ?? def.d) + HOLGURA * 2) * esc
  const alto = ((variante?.props?.alto ?? def.alto) || 0.6) * esc
  const base = mueble.y ?? 0

  /* La huella del mueble está girada: se lleva el punto al marco del mueble
     antes de compararlo, no al revés. Sin esto, un escritorio girado un cuarto
     de vuelta no reconocía nada de lo que tiene encima. */
  const rot = -(mueble.rot ?? 0)
  const cos = Math.cos(rot)
  const sen = Math.sin(rot)

  return items.filter((i) => {
    if (i.clase !== 'equipo' || !DEVICE_BY_ID[i.deviceId]) return false
    const dx = i.x - mueble.x
    const dz = i.z - mueble.z
    const lx = dx * cos - dz * sen
    const lz = dx * sen + dz * cos
    if (Math.abs(lx) > w / 2 || Math.abs(lz) > d / 2) return false
    const y = i.y ?? 0
    // dentro de su volumen o apoyado encima, no a dos metros por arriba
    return y >= base - 0.05 && y <= base + alto + ARRIBA
  })
}

/**
 * Cómo se dice la relación, que no siempre es la misma.
 *
 * "Lleva dentro" un foco y "tiene encima" un Apple TV son dos cosas
 * distintas, y la diferencia importa: al foco se le cambia el foco, al Apple
 * TV se le cambia de lugar.
 */
export function comoAloja(mueble, device) {
  const def = MUEBLES[mueble.tipo]
  if (def?.portafoco && device.cat === 'iluminacion') return 'lleva dentro'
  if (device.cat === 'cortinas') return 'mueve'
  return 'tiene encima'
}
