/**
 * De qué está hecho un animalito.
 *
 * Estas piezas son NUESTRAS: no son archivos descargados sino primitivas
 * —esferas, cápsulas, cajas con canto suavizado— armadas en código, igual que
 * los muebles de la casa. Eso resuelve de golpe las dos cosas que estorbaban:
 * la licencia deja de ser un problema, y las piezas dejan de pesar veintisiete
 * megas para pesar cero.
 *
 * Y hay una ventaja que no se ve hasta que se usa: al ser paramétricas, una
 * especie nueva son diez números, no un día de modelado. El zorro y el gato
 * comparten todo menos el hocico, la oreja y la cola.
 *
 * La proporción manda sobre el detalle. Un animalito de este estilo se
 * reconoce por la cabeza enorme, el cuerpo de pera y las patitas cortas; el
 * modelado fino no llega a leerse a la distancia a la que se mira un plano, y
 * lo que sí llega es la silueta.
 */

/* La cabeza ocupa casi la mitad de la altura. Es la decisión de estilo, y es
   lo que separa "animal" de "animalito": con cabeza realista se ve a peluche
   de feria, con cabeza enorme se ve al personaje que uno reconoce. */
export const PROPORCION = {
  cabeza: 0.44,
  cuerpo: 0.3,
  patas: 0.26,
}

/**
 * Las especies. Cada una es un puñado de números y tres formas: la oreja, el
 * hocico y la cola. Todo lo demás lo comparten.
 */
export const ESPECIES = [
  {
    id: 'gato',
    label: 'Gato',
    oreja: 'punta',
    hocico: 'chico',
    cola: 'larga',
    bigotes: true,
    pelaje: '#e8b06a',
    panza: '#fbe9d2',
  },
  {
    id: 'perro',
    label: 'Perro',
    oreja: 'caida',
    hocico: 'largo',
    cola: 'corta',
    pelaje: '#c98f5a',
    panza: '#f6e4cc',
  },
  {
    id: 'oso',
    label: 'Oso',
    oreja: 'redonda',
    hocico: 'ancho',
    cola: 'nada',
    corpulento: 1.12,
    pelaje: '#9a6b4a',
    panza: '#e6cdb0',
  },
  {
    id: 'conejo',
    label: 'Conejo',
    oreja: 'larga',
    hocico: 'chico',
    cola: 'pompon',
    bigotes: true,
    pelaje: '#f0ece6',
    panza: '#ffffff',
  },
  {
    id: 'zorro',
    label: 'Zorro',
    oreja: 'punta',
    hocico: 'largo',
    cola: 'esponjada',
    bigotes: true,
    pelaje: '#e07b3c',
    panza: '#fbe9d2',
  },
  {
    id: 'mapache',
    label: 'Mapache',
    oreja: 'redonda',
    hocico: 'chico',
    cola: 'anillada',
    antifaz: true,
    bigotes: true,
    pelaje: '#8f9aa6',
    panza: '#dfe4ea',
  },
  {
    id: 'ciervo',
    label: 'Ciervo',
    oreja: 'hoja',
    hocico: 'largo',
    cola: 'pompon',
    astas: true,
    pelaje: '#c08a5e',
    panza: '#f2ddc4',
  },
  {
    id: 'rana',
    label: 'Rana',
    oreja: 'nada',
    hocico: 'ancho',
    cola: 'nada',
    ojosSaltones: true,
    pelaje: '#7fc46a',
    panza: '#e9f3cf',
  },
  {
    id: 'cerdo',
    label: 'Cerdo',
    oreja: 'hoja',
    hocico: 'trompa',
    cola: 'rizo',
    pelaje: '#f0a8b4',
    panza: '#fbdde3',
  },
  {
    id: 'pajaro',
    label: 'Pájaro',
    oreja: 'nada',
    hocico: 'pico',
    cola: 'plumas',
    copete: true,
    pelaje: '#6ab6e0',
    panza: '#e6f3fb',
  },
  {
    id: 'raton',
    label: 'Ratón',
    oreja: 'grande',
    hocico: 'chico',
    cola: 'hilo',
    bigotes: true,
    pelaje: '#b9b3ae',
    panza: '#efe9e4',
  },
  {
    id: 'koala',
    label: 'Koala',
    oreja: 'peluda',
    hocico: 'trompa',
    cola: 'nada',
    corpulento: 1.06,
    pelaje: '#9fa8ae',
    panza: '#e4e9ec',
  },
]

export const ESPECIE_BY_ID = Object.fromEntries(ESPECIES.map((e) => [e.id, e]))

/* ── lo que se le pone encima ─────────────────────────────────── */

export const ROPAS = [
  { id: 'nada', label: 'Sin ropa' },
  { id: 'playera', label: 'Playera' },
  { id: 'sudadera', label: 'Sudadera' },
  { id: 'vestido', label: 'Vestido' },
  { id: 'overol', label: 'Overol' },
  { id: 'chaleco', label: 'Chaleco' },
]

/* El patrón se dibuja con geometría, no con textura: a la distancia de un
   plano una textura se ve sucia y una banda de verdad se lee. */
export const PATRONES = [
  { id: 'liso', label: 'Liso' },
  { id: 'rayas', label: 'Rayas' },
  { id: 'franja', label: 'Franja' },
  { id: 'lunares', label: 'Lunares' },
]

export const SOMBREROS = [
  { id: 'nada', label: 'Sin nada' },
  { id: 'gorra', label: 'Gorra' },
  { id: 'bombin', label: 'Bombín' },
  { id: 'paja', label: 'De paja' },
  { id: 'gorro', label: 'Gorro de lana' },
  { id: 'diadema', label: 'Diadema' },
]

export const ACCESORIOS = [
  { id: 'nada', label: 'Nada' },
  { id: 'lentes', label: 'Lentes' },
  { id: 'bufanda', label: 'Bufanda' },
  { id: 'mochila', label: 'Mochila' },
  { id: 'collar', label: 'Collar' },
]

export const OJOS = [
  { id: 'puntos', label: 'Puntitos' },
  { id: 'grandes', label: 'Grandes' },
  { id: 'contentos', label: 'Contentos' },
  { id: 'dormidos', label: 'Dormidos' },
  { id: 'pícaros', label: 'Pícaros' },
]

/**
 * Las poses. Son de verdad —se calculan cuadro a cuadro— y por eso no pesan
 * nada: un animalito son ocho movimientos de grupos, no ocho archivos.
 */
export const POSES = [
  { id: 'reposo', label: 'Reposo' },
  { id: 'saludo', label: 'Saludando' },
  { id: 'camina', label: 'Caminando' },
  { id: 'contento', label: 'Contento' },
  { id: 'pensando', label: 'Pensando' },
  { id: 'dormido', label: 'Dormido' },
]

export const PALETAS = {
  pelaje: [
    '#e8b06a', '#c98f5a', '#9a6b4a', '#f0ece6', '#e07b3c', '#8f9aa6',
    '#c08a5e', '#7fc46a', '#f0a8b4', '#6ab6e0', '#b9b3ae', '#9fa8ae',
    '#3f3a37', '#f5e1a4', '#b98bd6', '#e05b5b',
  ],
  panza: ['#ffffff', '#fbe9d2', '#f6e4cc', '#e6cdb0', '#dfe4ea', '#e9f3cf', '#fbdde3', '#e6f3fb'],
  ropa: [
    '#ffffff', '#3a3f4b', '#4d9fff', '#2f6bd8', '#5eead4', '#2fbf71',
    '#ffd166', '#ff9f43', '#e0533f', '#c2185b', '#8b5cf6', '#f0a3c8',
    '#8d6e4a', '#4a5b3a', '#c9ccd4', '#111318',
  ],
}

/** Las categorías del configurador, en el orden en que se tocan. */
export const CATEGORIAS = [
  { id: 'especie', label: 'Especie', tipo: 'lista', opciones: ESPECIES },
  { id: 'pelaje', label: 'Pelaje', tipo: 'color', paleta: 'pelaje' },
  { id: 'panza', label: 'Panza', tipo: 'color', paleta: 'panza' },
  { id: 'ojos', label: 'Ojos', tipo: 'lista', opciones: OJOS },
  { id: 'ropa', label: 'Ropa', tipo: 'lista', opciones: ROPAS },
  { id: 'patron', label: 'Estampado', tipo: 'lista', opciones: PATRONES },
  { id: 'colorRopa', label: 'Color de ropa', tipo: 'color', paleta: 'ropa' },
  { id: 'sombrero', label: 'Sombrero', tipo: 'lista', opciones: SOMBREROS },
  { id: 'accesorio', label: 'Accesorio', tipo: 'lista', opciones: ACCESORIOS },
]
