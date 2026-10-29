// Con extensión a propósito: además del panel lo importa el servidor, que
// corre en Node sin Vite y no resuelve rutas sin `.js`.
import { DEVICES, DEVICE_BY_ID, refPrice } from './catalog.js'
import { compraDeVisto, precioVisto, PROVEEDOR_BY_ID } from './opsCatalog.js'
import { costoCompra } from './paquetes.js'
import { photoOf } from './photos.js'

/**
 * Dónde se compra un aparato, a cuánto y con qué foto — la regla de Compras
 * en un solo lugar, para el plano del panel y para el enlace del cliente.
 *
 * Gana la tarifa del negocio; si un proyecto viejo trae su propio ajuste de
 * antes de que existiera esa capa, se usa ése; si nadie tocó nada, el precio
 * de catálogo. La liga confirmada a mano va antes que la que se encontró
 * buscando, y la tienda se lee de la liga.
 *
 * Lee opsCatalog, así que solo lo importan el panel y el servidor: al
 * navegador del cliente le llega ya calculado, por su enlace, y solo lo de
 * su casa.
 *
 * @param ctx  { tarifas: estado.tarifas.productos, legado: proyecto.compras.productos, propios: { id: device } }
 */

// de una liga a la tienda, para no enseñar la URL entera
export function tiendaDeUrl(url) {
  try {
    const h = new URL(url).hostname
    if (h.includes('amazon.')) return 'Amazon México'
    if (h.includes('uelectronics')) return 'UNIT Electronics'
    if (h.includes('mercadolibre')) return 'MercadoLibre'
    return h.replace(/^www\./, '')
  } catch {
    return null
  }
}

const aparatoDe = (id, ctx) => DEVICE_BY_ID[id] ?? ctx?.propios?.[id] ?? null
const ajusteDe = (id, ctx) => ({ ...(ctx?.legado?.[id] ?? {}), ...(ctx?.tarifas?.[id] ?? {}) })

/** Nombre, categoría, marca y foto: lo que se enseña de un aparato. La foto
 *  del catálogo, y si el catálogo no tiene —los genéricos no la llevan,
 *  porque cambian de vendedor—, la de la ficha de la liga encontrada: es la
 *  del producto que de verdad se va a comprar. */
export function fichaDe(id, ctx) {
  const d = aparatoDe(id, ctx)
  if (!d) return null
  const t = ajusteDe(id, ctx)
  return { nombre: t.nombre || d.name, cat: d.cat, marca: d.brand ?? '', foto: t.foto || photoOf(id) || precioVisto(d)?.foto || null }
}

/** Precio por pieza, liga, tienda, la nota de la búsqueda y los paquetes.
 *
 *  Aquí no se espera a que alguien confirme el precio encontrado (eso es lo
 *  que pide Compras antes de tocar la cotización): si el plano enseña la liga
 *  de lo que se encontró, enseña también su precio y sus paquetes. Si no, la
 *  sirena salía en el estimado de catálogo —710— junto a una liga que la
 *  vende en 242. */
export function compraDe(id, ctx) {
  const d = aparatoDe(id, ctx)
  if (!d) return null
  const t = ajusteDe(id, ctx)
  const visto = precioVisto(d)
  const sugerida = t.precio == null ? compraDeVisto(visto) : null
  return {
    precio: t.precio ?? sugerida?.precio ?? (d.price ? refPrice(d) : null),
    url: t.url || visto?.url || null,
    tienda: t.url ? tiendaDeUrl(t.url) : visto ? (PROVEEDOR_BY_ID[visto.prov]?.nombre ?? null) : null,
    nota: t.url ? null : (visto?.nota ?? null),
    paquetes: t.paquetes?.length ? t.paquetes : (sugerida?.paquetes ?? null),
  }
}

/** Lo que sale de la bolsa por todo el equipo de unos espacios, comprando
 *  por paquete donde se vende así. */
export function desembolso(rooms, ctx) {
  const cuenta = {}
  for (const r of rooms ?? []) for (const [id, q] of Object.entries(r.items ?? {})) if (q > 0) cuenta[id] = (cuenta[id] ?? 0) + q
  let total = 0
  for (const [id, q] of Object.entries(cuenta)) total += costoCompra(q, compraDe(id, ctx)).costo
  return Math.round(total * 100) / 100
}

/** Todo lo que se puede escoger al agregar o cambiar un producto, con su precio. */
export function catalogoDeCompra(ctx) {
  const propios = Object.values(ctx?.propios ?? {}).filter((d) => !DEVICE_BY_ID[d.id])
  return [...DEVICES, ...propios].map((d) => {
    const c = compraDe(d.id, ctx)
    return { id: d.id, ...fichaDe(d.id, ctx), precio: c?.precio ?? null, tienda: c?.tienda ?? null, url: c?.url ?? null }
  })
}
