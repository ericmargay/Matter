/**
 * Qué está pegado a qué muro, y cuándo hay que esconderlo.
 *
 * Los dos muros que quedan entre la cámara y el cuarto se esconden solos —es
 * lo que permite ver adentro— pero lo que cuelga de ellos no se escondía con
 * ellos. El resultado, al girar la habitación, eran sensores, cuadros y
 * cortinas flotando en el aire delante de la escena: lo peor que le puede
 * pasar a un plano que se le enseña a un cliente, porque parece un error de
 * la herramienta y no una decisión.
 *
 * La regla es la del muro: si el muro no se ve, lo suyo tampoco.
 */

export const GROSOR_MURO = 0.16

/* Normal de cada muro hacia AFUERA del cuarto. Un muro se ve cuando su normal
   le da la espalda a la cámara. */
export const MUROS = [
  { id: 'norte', n: [0, -1] },
  { id: 'sur', n: [0, 1] },
  { id: 'oeste', n: [-1, 0] },
  { id: 'este', n: [1, 0] },
]

const NORMAL = Object.fromEntries(MUROS.map((m) => [m.id, m.n]))

export const muroSeVe = (n, camaraX, camaraZ) => n[0] * camaraX + n[1] * camaraZ <= 0

/** Tipos de mobiliario que van colgados o embebidos en el muro.
 *
 * No entra aquí lo que a veces cuelga y a veces no —una tele con base, una
 * campana de isla, una chimenea de esquina que sube por el centro de la
 * casa—: meterlas obligaría a TODAS sus variantes a comportarse como si
 * colgaran, y las que no cuelgan quedarían mal. Esas siguen el camino
 * genérico: se pegan solas si se sueltan cerca de un muro, igual que
 * cualquier otro mueble.
 */
export const MUEBLES_DE_MURO = new Set([
  'ventana',
  'ventanalCorredizo',
  'persiana',
  'cuadro',
  'cuadroSolo',
  'cuadroArte',
  'cuadroGrande',
  'triptico',
  'muroCuadros',
  'relojPared',
  'espejo',
  'toallero',
  'alacena',
  'pizarron',
  'puerta',
])

/* Del nombre del ancla ('x-','x+','z-','z+') al nombre del muro de aquí
   ('oeste','este','norte','sur'). Son el mismo muro, dos vocabularios: éste
   nació antes que el sistema de vínculos y no valía la pena reescribirlo
   entero para unificar el nombre. */
const MURO_DE_ANCLA = { 'x-': 'oeste', 'x+': 'este', 'z-': 'norte', 'z+': 'sur' }

/**
 * A qué muro pertenece una pieza, o null si se sostiene sola.
 *
 * Si la pieza ya sabe a qué está pegada —tiene `ancla`— eso manda siempre:
 * amarrada a un muro, ese es su muro; amarrada a un mueble, al piso o al
 * plafón, NUNCA se esconde por cercanía a un muro, así el mueble le quede
 * pegado por casualidad. Sin esto, el Apple TV que vive sobre un buró
 * arrimado al fondo se escondía cada vez que ese muro tocaba desaparecer
 * para poder ver adentro del cuarto —el mismo Apple TV, sin haberse movido,
 * aparecía y desaparecía nada más por cómo giraba la cámara.
 *
 * Pero "amarrado a un muro" no es lo mismo que "pegado AL muro": una cama o
 * un buró se ancla a un muro para saber su lugar cuando el cuarto cambia de
 * medida, y no por eso son parte del muro. Sólo lo que de verdad cuelga o va
 * embebido —lo del catálogo de `MUEBLES_DE_MURO`, o cualquier pieza que no
 * sea mueble de piso— desaparece con él; una cama, un buró, un escritorio o
 * un clóset se quedan siempre a la vista, tengan o no ancla de muro.
 *
 * Sólo cuando no hay ancla —planos viejos, o piezas que la casa dibuja sin
 * pasar por aquí— se adivina por cercanía, y ahí sigue valiendo la regla
 * vieja: sólo lo que cuelga (colgado del muro por catálogo, o alto sobre el
 * piso) puede pertenecer a un muro.
 */
export function muroDe(item, ancho, largo, margen = 0.45) {
  if (item.ancla) {
    if (item.ancla.a !== 'muro') return null
    if (item.clase === 'mueble' && !MUEBLES_DE_MURO.has(item.tipo)) return null
    return MURO_DE_ANCLA[item.ancla.muro]
  }

  const colgada =
    item.clase === 'mueble' ? MUEBLES_DE_MURO.has(item.tipo) : (item.y ?? 0) >= 0.25 && (item.y ?? 0) < 900

  if (!colgada) return null

  /* El más cercano, no el primero que cumpla: una pieza en una esquina está a
     tiro de dos muros y tiene que quedarse con el suyo. */
  const d = {
    norte: item.z + largo / 2,
    sur: largo / 2 - item.z,
    oeste: item.x + ancho / 2,
    este: ancho / 2 - item.x,
  }
  const cerca = Object.entries(d).sort((a, b) => a[1] - b[1])[0]
  return cerca[1] <= margen ? cerca[0] : null
}

/** ¿Se tiene que dibujar esta pieza desde donde está la cámara? */
export function piezaSeVe(item, ancho, largo, camaraX, camaraZ) {
  const muro = muroDe(item, ancho, largo)
  return !muro || muroSeVe(NORMAL[muro], camaraX, camaraZ)
}
