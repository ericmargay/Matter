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

/** Tipos de mobiliario que van colgados o embebidos en el muro. */
export const MUEBLES_DE_MURO = new Set([
  'ventana',
  'persiana',
  'cuadroSolo',
  'cuadroArte',
  'cuadroGrande',
  'triptico',
  'muroCuadros',
  'relojPared',
  'espejo',
  'toallero',
  'pizarron',
  'puerta',
])

/**
 * A qué muro pertenece una pieza, o null si se sostiene sola.
 *
 * Lo que está apoyado en el piso no cuelga de nada: un buró contra la pared
 * sigue de pie cuando el muro desaparece, y esconderlo sería peor. Por eso
 * solo cuentan las piezas colgadas —las que están a cierta altura— y los
 * muebles que por definición van en el muro aunque su ancla esté a ras.
 */
export function muroDe(item, ancho, largo, margen = 0.45) {
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
