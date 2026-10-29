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
  for (const { id, qty = 1, espacio } of agrega) {
    const donde = nuevos.find((r) => espacio && sinAcentos(r.nombre).includes(sinAcentos(espacio))) ?? nuevos[0]
    if (!donde) continue
    donde.items = { ...donde.items, [id]: (donde.items[id] ?? 0) + qty }
  }
  return nuevos
}

export const ALTERNATIVAS = []
