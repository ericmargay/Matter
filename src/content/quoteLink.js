/**
 * La cotización dentro del enlace.
 *
 * Este módulo NO importa nada a propósito. La página pública de la
 * cotización solo depende de él y de las constantes fiscales, así que el
 * catálogo —con costos, márgenes de instalación y canales de proveedor— se
 * queda fuera del bundle que llega al navegador del cliente.
 *
 * Efecto de lado que resulta ser lo correcto: el enlace lleva las partidas
 * YA RESUELTAS, con su precio congelado. Si mañana subimos una tarifa, la
 * cotización que ya se mandó sigue diciendo lo que se cotizó.
 */

const b64url = {
  encode(str) {
    const bytes = new TextEncoder().encode(str)
    let bin = ''
    bytes.forEach((b) => (bin += String.fromCharCode(b)))
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  },
  decode(s) {
    const pad = s.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4))
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
  },
}

/**
 * Arma el paquete que viaja en la URL.
 *
 * @param survey  levantamiento del panel
 * @param q       resultado de quote() — ya calculado por quien llama
 * @param net     resultado de networkCheck()
 * @param claves  { equipo: id → claveSAT, unidadPieza, unidadServicio }
 */
export function buildQuotePayload(survey, q, net, claves) {
  const linea = (l, clave, unidad, detalle) => ({
    k: clave,
    x: unidad,
    q: l.qty,
    c: l.concepto,
    s: detalle ?? '',
    p: l.unit,
    i: l.importe,
  })

  return {
    f: survey.folio,
    d: new Date().toISOString().slice(0, 10),
    v: Number(survey.extras?.vigencia) || 15,
    c: survey.cliente,
    o: survey.obra,
    r: survey.rooms
      .map((r) => ({
        n: r.nombre,
        m: r.m2,
        t: r.tipo,
        u: Object.values(r.items ?? {}).reduce((a, b) => a + b, 0),
      }))
      .filter((r) => r.u > 0),
    L: [
      ...q.equipo.map((l) => linea(l, claves.equipo[l.id] ?? claves.servicio, claves.unidadPieza, l.catLabel)),
      ...q.servicios.map((l) => linea(l, claves.servicio, claves.unidadServicio, l.detalle)),
    ],
    T: {
      bruto: q.bruto,
      desc: q.descuento,
      acredita: q.acredita,
      sub: q.subtotal,
      iva: q.iva,
      tot: q.total,
    },
    // topología ya resuelta a texto: el cliente no necesita el catálogo
    N: Object.entries(net.byLink)
      .map(([k, n]) => `${n} ${k}`)
      .join(' · '),
    a: net.aps,
    g: 12, // meses de garantía en mano de obra
  }
}

export function encodeQuote(payload) {
  return b64url.encode(JSON.stringify(payload))
}

export function decodeQuote(token) {
  try {
    const p = JSON.parse(b64url.decode(token))
    return {
      folio: p.f,
      fecha: p.d,
      vigencia: p.v,
      cliente: p.c ?? {},
      obra: p.o ?? {},
      rooms: p.r ?? [],
      lineas: p.L ?? [],
      totales: p.T ?? {},
      topologia: p.N ?? '',
      aps: p.a ?? 0,
      garantia: p.g ?? 12,
    }
  } catch {
    return null
  }
}
