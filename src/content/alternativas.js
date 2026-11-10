/**
 * Alternativas con receta: lo que cambia en una casa cuando se toma otra
 * decisión de fondo —otro cerebro, otro protocolo— y que se repite de un
 * cliente a otro. Una alternativa es una copia del proyecto con estos
 * cambios aplicados a sus espacios; el plano enseña las dos juntas y lo que
 * cuesta cada una, y de ahí se decide.
 *
 * Cada receta dice, por cuarto, qué se cambia por qué (`cambia`), qué se
 * agrega y en qué espacio (`agrega`, por nombre de espacio, o en el primero
 * si no hay uno con ese nombre), y qué se quita (`quita`). Solo cambia lo
 * que el proyecto tiene: lo que no está, no se inventa.
 */

const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/* El espacio que se llama como alguno de los nombres —en el orden en que se
   dan—. Lo que tiene que ir sí o sí (el hub) cae en el primer espacio si no
   hay uno así; un sensor de baño en una casa sin baño levantado, no va. */
function espacioDe(rooms, nombres, siempre) {
  for (const n of [nombres].flat()) {
    const r = rooms.find((x) => sinAcentos(x.nombre).includes(sinAcentos(n)))
    if (r) return r
  }
  return siempre ? rooms[0] : null
}

/** Aplica una receta a los espacios de un proyecto y devuelve los nuevos. */
export function aplicarReceta(rooms, { cambia = {}, agrega = [], quita = [] }) {
  const nuevos = rooms.map((r) => {
    const items = {}
    for (const [id, q] of Object.entries(r.items ?? {})) {
      if (q <= 0 || quita.includes(id)) continue
      const nuevo = cambia[id] ?? id
      items[nuevo] = (items[nuevo] ?? 0) + q
    }
    // el mapa sigue al aparato: la pieza que cambia de modelo se queda en su lugar
    const mapa = {}
    for (const [id, lista] of Object.entries(r.plano?.mapa ?? {})) {
      if (quita.includes(id)) continue
      const nuevo = cambia[id] ?? id
      mapa[nuevo] = [...(mapa[nuevo] ?? []), ...lista]
    }
    return { ...r, items, plano: r.plano ? { ...r.plano, mapa } : r.plano }
  })
  for (const { id, qty = 1, espacio, siempre = false } of agrega) {
    const donde = espacioDe(nuevos, espacio, siempre)
    if (!donde) continue
    donde.items = { ...donde.items, [id]: (donde.items[id] ?? 0) + qty }
  }
  return nuevos
}

export const ALTERNATIVAS = [
  {
    id: 'echo-hub-zigbee',
    nombre: 'con Echo Dot Max',
    /* El Echo que trae hub Zigbee, y lo que ese hub abre de verdad: sensores
       de pila que disparan rutinas. No cambia lo que ya estaba —focos,
       enchufes y apagadores Matter siguen siendo lo más barato en México, y
       la fuga, el gas, la sirena y la válvula Zigbee no los soporta el hub
       de Alexa—. */
    ajustar: (rooms) =>
      aplicarReceta(rooms, {
        // la fuga Zigbee no entra al hub de Alexa: la que avisa es la Matter
        cambia: { 'sonoff-snzb-05p': 'shelly-flood-gen4' },
        agrega: [
          { id: 'echo-dot-max', espacio: ['sala', 'estancia', 'estar'], siempre: true },
          // la luz que se prende sola al entrar, donde nadie se queda quieto
          { id: 'thirdreality-motion', espacio: ['baño principal', 'baño'] },
          { id: 'thirdreality-motion', espacio: ['zotehuela', 'lavado', 'servicio'] },
          { id: 'thirdreality-motion', espacio: ['recibidor', 'entrada', 'vestíbulo'] },
          // "la puerta quedó abierta" y la escena de llegada
          { id: 'thirdreality-contact', espacio: ['recibidor', 'entrada', 'vestíbulo'] },
        ],
      }),
  },
]
