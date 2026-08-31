/**
 * Comprar por paquete, no por pieza.
 *
 * Muchos productos —empezando por los focos— no se venden sueltos: Amazon
 * los trae en paquetes de 6, de 4, de 2, cada uno a un precio distinto (y el
 * precio por pieza tampoco es el mismo entre paquetes). Si la instalación
 * necesita 11 focos, casi nunca hay una combinación que dé EXACTO 11 — hay
 * que decidir qué paquetes comprar, y algo va a sobrar.
 *
 * `planCompra` resuelve eso: de todas las combinaciones de paquetes que
 * cubran lo que hace falta, busca la más barata. No la que sobra menos —la
 * que cuesta menos—, que no siempre es la misma combinación.
 */

/**
 * @param necesarias  piezas que hacen falta
 * @param paquetes    [{ tam, precio }] — tamaños de paquete disponibles y su precio
 * @returns { unidades, sobran, costoTotal, combo: [{tam, precio, veces}] } o null
 */
export function planCompra(necesarias, paquetes = []) {
  const opciones = (paquetes ?? []).filter((p) => p.tam > 0 && p.precio >= 0)
  if (!necesarias || necesarias <= 0 || opciones.length === 0) return null

  // Comprar de más nunca conviene más allá de un paquete extra del tamaño
  // más grande: pasado ese techo ya hay una combinación con menos sobrante
  // y el mismo o menor costo.
  const tope = necesarias + Math.max(...opciones.map((o) => o.tam)) - 1

  const costo = new Array(tope + 1).fill(Infinity)
  const desde = new Array(tope + 1).fill(null)
  costo[0] = 0

  for (let u = 1; u <= tope; u++) {
    for (const o of opciones) {
      const prev = u - o.tam
      if (prev < 0 || costo[prev] === Infinity) continue
      const c = costo[prev] + o.precio
      if (c < costo[u]) {
        costo[u] = c
        desde[u] = o
      }
    }
  }

  let mejor = -1
  for (let u = necesarias; u <= tope; u++) {
    if (costo[u] < Infinity && (mejor === -1 || costo[u] < costo[mejor])) mejor = u
  }
  if (mejor === -1) return null // ningún paquete cabe ni una vez

  const combo = new Map()
  let u = mejor
  while (u > 0) {
    const o = desde[u]
    if (!o) break
    const actual = combo.get(o.tam) ?? { tam: o.tam, precio: o.precio, veces: 0 }
    actual.veces += 1
    combo.set(o.tam, actual)
    u -= o.tam
  }

  return {
    unidades: mejor,
    sobran: mejor - necesarias,
    costoTotal: costo[mejor],
    combo: [...combo.values()].sort((a, b) => b.tam - a.tam),
  }
}
