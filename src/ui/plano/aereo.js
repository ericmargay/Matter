import { planoVacio } from '../../sync/eventos'

/**
 * La geometría del plano aéreo: dónde cae cada espacio y cada aparato.
 *
 * El plano aéreo NO guarda una geometría propia. Cada espacio ya tiene su
 * plano —el del editor 3D— con su ancho, su largo y su posición en el
 * conjunto (`plano.pos`, el centro del cuarto, en metros, con el norte hacia
 * −z). Aquí se lee eso y se escribe eso: mover un cuarto en el plano aéreo lo
 * mueve en el conjunto 3D, y cambiarle el ancho se lo cambia en su editor.
 *
 * Lo único nuevo es `plano.mapa`: dónde va cada pieza del levantamiento dentro
 * del cuarto, `{ deviceId: [[dx, dz], ...] }`, una posición por pieza y
 * relativa al centro. El levantamiento dice CUÁNTOS hay de cada cosa; el mapa
 * dice DÓNDE. Si el levantamiento dice más de los que el mapa ubica, los que
 * faltan se acomodan solos, y en cuanto alguien los mueve quedan anotados.
 */

/* El orden en que se acomodan solos: las luces juntas, luego lo que se toca,
   luego lo que se enchufa. Es el orden en que se recorre un cuarto. */
export const ORDEN_CAT = [
  'iluminacion',
  'control',
  'energia',
  'cortinas',
  'clima',
  'sensores',
  'agua',
  'acceso',
  'camaras',
  'av',
  'pantallas',
  'hubs',
  'red',
  'cableado',
  'mascotas',
  'electro',
]

/* Un color por categoría, para leer el cuarto de un vistazo. Son los de la
   casa —ámbar la luz, violeta lo que se toca, verde la energía— y se ven
   igual sobre el plano oscuro que en la lista. */
export const COLOR_CAT = {
  iluminacion: '#f2b54a',
  control: '#a593ff',
  energia: '#4cc98b',
  cortinas: '#8fa3c4',
  clima: '#ff9f43',
  sensores: '#ff8a65',
  agua: '#5aaaff',
  acceso: '#ff6f63',
  camaras: '#ff6f63',
  av: '#f78fd1',
  pantallas: '#f78fd1',
  hubs: '#c2ccdd',
  red: '#c2ccdd',
  cableado: '#c2ccdd',
  mascotas: '#c9a27a',
  electro: '#c2ccdd',
}

export const NOMBRE_CAT = {
  iluminacion: 'Luz',
  control: 'Apagadores y escenas',
  energia: 'Energía',
  cortinas: 'Cortinas',
  clima: 'Clima',
  sensores: 'Sensores',
  agua: 'Agua',
  acceso: 'Acceso',
  camaras: 'Cámaras',
  av: 'Audio y video',
  pantallas: 'Pantallas',
  hubs: 'Centrales',
  red: 'Red',
}

export const ICONO_CAT = { pantallas: 'tv', hubs: 'hub', cableado: 'power' }

export const PASO = 0.05 // la rejilla de acomodo, en metros
export const MIN_LADO = 0.8 // ningún espacio más chico que esto

export const r2 = (n) => Math.round(n * 100) / 100
export const aPaso = (n) => r2(Math.round(n / PASO) * PASO)

export const bordes = (g) => ({ l: g.x - g.ancho / 2, r: g.x + g.ancho / 2, t: g.z - g.largo / 2, b: g.z + g.largo / 2 })

/**
 * El ancho, el largo y el centro de cada espacio.
 *
 * Los que nunca se acomodaron —sin plano, sin `pos`, o con la misma `pos` que
 * otro, que es como nacen todos: en [0, 0]— se ponen solos en una retícula a
 * la derecha de lo ya acomodado. La retícula va por el lugar del espacio en
 * el proyecto y no por cuántos faltan: así, acomodar uno no hace brincar a
 * los demás.
 *
 * @returns { [id]: { x, z, ancho, largo, auto } }
 */
export function geometrias(espacios) {
  const geo = {}
  const vistas = new Set()
  const sueltos = []
  espacios.forEach((e, i) => {
    const base = planoVacio(e.m2 || 12)
    const ancho = Math.max(MIN_LADO, Number(e.plano?.ancho) || base.ancho)
    const largo = Math.max(MIN_LADO, Number(e.plano?.largo) || base.largo)
    const pos = e.plano?.pos
    const valida = Array.isArray(pos) && pos.length === 2 && pos.every((n) => Number.isFinite(n))
    const llave = valida ? `${r2(pos[0])},${r2(pos[1])}` : null
    if (valida && !vistas.has(llave)) {
      vistas.add(llave)
      geo[e.id] = { x: pos[0], z: pos[1], ancho, largo, auto: false }
    } else {
      sueltos.push({ e, i, ancho, largo })
    }
  })
  if (sueltos.length) {
    const fijos = Object.values(geo)
    const derecha = fijos.length ? Math.max(...fijos.map((g) => g.x + g.ancho / 2)) + 1.5 : 0
    const arriba = fijos.length ? Math.min(...fijos.map((g) => g.z - g.largo / 2)) : 0
    const celda = Math.max(...sueltos.map((s) => Math.max(s.ancho, s.largo))) + 0.6
    const cols = fijos.length ? 1 : Math.max(1, Math.ceil(Math.sqrt(sueltos.length)))
    sueltos.forEach((s, k) => {
      const col = fijos.length ? 0 : k % cols
      const fila = fijos.length ? k : Math.floor(k / cols)
      geo[s.e.id] = {
        x: r2(derecha + col * celda + celda / 2),
        z: r2(arriba + fila * celda + celda / 2),
        ancho: s.ancho,
        largo: s.largo,
        auto: true,
      }
    })
  }
  return geo
}

/**
 * Cada pieza del levantamiento de un espacio, con su lugar en él.
 *
 * Una pieza es `deviceId` + su número dentro del cuarto (`i`): cuatro focos
 * son cuatro piezas que se pueden acomodar por separado. Las que el mapa no
 * ubica se reparten en la parte de abajo del cuarto —arriba va el nombre—.
 *
 * @param catDe  deviceId → categoría, para acomodar por familias
 */
export function piezas(espacio, g, catDe) {
  const ids = Object.entries(espacio.items ?? {})
    .filter(([, q]) => q > 0)
    .map(([id]) => id)
    .sort((a, b) => {
      const ca = ORDEN_CAT.indexOf(catDe(a))
      const cb = ORDEN_CAT.indexOf(catDe(b))
      return (ca < 0 ? 99 : ca) - (cb < 0 ? 99 : cb) || a.localeCompare(b)
    })
  const lista = []
  for (const id of ids) {
    const q = espacio.items[id]
    for (let i = 0; i < q; i++) lista.push({ deviceId: id, i })
  }
  const n = lista.length
  if (!n) return []
  const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt((n * g.ancho) / g.largo))))
  const filas = Math.ceil(n / cols)
  const desde = -g.largo / 2 + g.largo * 0.36
  const alto = g.largo / 2 - desde
  const mapa = espacio.plano?.mapa ?? {}
  return lista.map((p, k) => {
    const guardada = mapa[p.deviceId]?.[p.i]
    const ok = Array.isArray(guardada) && guardada.length === 2 && guardada.every((v) => Number.isFinite(v))
    return {
      ...p,
      key: `${espacio.id}|${p.deviceId}|${p.i}`,
      cuartoId: espacio.id,
      dx: ok ? guardada[0] : r2(-g.ancho / 2 + ((k % cols) + 0.5) * (g.ancho / cols)),
      dz: ok ? guardada[1] : r2(desde + (Math.floor(k / cols) + 0.5) * (alto / filas)),
      auto: !ok,
    }
  })
}

/** El mapa completo de un espacio a partir de sus piezas: lo que se guarda. */
export function mapaDe(lista) {
  const m = {}
  for (const p of lista) (m[p.deviceId] ??= [])[p.i] = [r2(p.dx), r2(p.dz)]
  return m
}

/** Los espacios que se enciman, y por cuánto. */
export function encimados(ids, geo) {
  const malos = {}
  for (let a = 0; a < ids.length; a++) {
    for (let b = a + 1; b < ids.length; b++) {
      const A = bordes(geo[ids[a]])
      const B = bordes(geo[ids[b]])
      const sx = Math.min(A.r, B.r) - Math.max(A.l, B.l)
      const sz = Math.min(A.b, B.b) - Math.max(A.t, B.t)
      if (sx > 0.02 && sz > 0.02) {
        const cuanto = Math.min(sx, sz)
        ;(malos[ids[a]] ??= []).push({ con: ids[b], cuanto })
        ;(malos[ids[b]] ??= []).push({ con: ids[a], cuanto })
      }
    }
  }
  return malos
}
