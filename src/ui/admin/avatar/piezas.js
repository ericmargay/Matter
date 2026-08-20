/**
 * De qué está hecho un avatar.
 *
 * Las piezas son las del configurador de Wawa Sensei: cada archivo es una
 * malla ya pesada al mismo esqueleto, así que se pueden mezclar libremente y
 * todas se mueven con las mismas animaciones. Nosotros no las modelamos —eso
 * es un trabajo aparte y muy largo— pero sí decidimos cómo se agrupan, qué se
 * puede quitar y con qué paleta se tiñe cada cosa, que es lo que convierte una
 * carpeta de archivos en algo que se puede usar.
 *
 * OJO con la procedencia: estas piezas vienen de un repositorio de tutorial
 * sin archivo de licencia. Sirven para trabajar y para enseñar el sistema; NO
 * son terreno firme para un entregable comercial ni para fabricar en 3D hasta
 * que su autor lo aclare por escrito. Todo lo de aquí abajo es nuestro y no
 * depende de ellas: cambiar la carpeta cambia el catálogo.
 *
 * La convención de materiales viene de las propias mallas y es la que permite
 * teñirlas sin tocar el archivo:
 *
 *   Color_*  se pinta con el color que se elija para esa categoría
 *   Skin_*   se reemplaza por el material de piel, compartido por todo el
 *            cuerpo — por eso el tono de la cabeza manda sobre manos y cuello
 */

export const RUTA = '/avatar/piezas/'
export const ESQUELETO = '/avatar/Armature.glb'
export const POSES = '/avatar/Poses.glb'

/* Las ocho animaciones que traen las mallas. Idle es la de reposo: es la que
   se usa mientras se configura, porque una pose de acción estorba para juzgar
   si el peinado queda bien. */
export const ANIMACIONES = ['Idle', 'Chill', 'Cool', 'Busy', 'Dram', 'King', 'Ninja', 'Punch']

/* Paletas por tipo de pieza. Separadas a propósito: una piel verde limón y un
   pelo del color de la playera son dos formas distintas de arruinar un avatar,
   y la manera de evitarlas es no ofrecer el color. */
export const PALETAS = {
  piel: ['#f5c6a5', '#eab38c', '#d69f76', '#b9805a', '#8d5a3b', '#65402a', '#f7d7c4', '#c98f6e'],
  pelo: ['#2b2118', '#4a3427', '#7a5236', '#b5793f', '#d8a55f', '#e8d8a0', '#9b9b9b', '#e9e9e9', '#7c3aed', '#e0533f'],
  ropa: [
    '#ffffff', '#c9ccd4', '#3a3f4b', '#111318',
    '#4d9fff', '#2f6bd8', '#5eead4', '#2fbf71',
    '#ffd166', '#ff9f43', '#e0533f', '#c2185b',
    '#8b5cf6', '#f0a3c8', '#8d6e4a', '#4a5b3a',
  ],
}

export const CATEGORIAS = [
  {
    id: "Head",
    label: "Cabeza",
    quitable: false,
    color: true,
    paleta: "piel",
    piezas: [
      "Head.001.glb",
      "Head.002.glb",
      "Head.003.glb",
      "Head.004.glb"
    ],
  },
  {
    id: "Face",
    label: "Cara",
    quitable: true,
    color: true,
    paleta: "piel",
    piezas: [
      "Face.001.glb",
      "Face.002.glb",
      "Face.003.glb",
      "Face.004.glb",
      "Face.005.glb",
      "Face.006.glb",
      "Face.007.glb",
      "FaceMask.glb"
    ],
  },
  {
    id: "Eyes",
    label: "Ojos",
    quitable: false,
    color: false,
    paleta: null,
    piezas: [
      "Eyes.001.glb",
      "Eyes.002.glb",
      "Eyes.003.glb",
      "Eyes.004.glb",
      "Eyes.005.glb",
      "Eyes.006.glb",
      "Eyes.007.glb",
      "Eyes.008.glb",
      "Eyes.009.glb",
      "Eyes.010.glb",
      "Eyes.011.glb",
      "Eyes.012.glb"
    ],
  },
  {
    id: "EyeBrow",
    label: "Cejas",
    quitable: true,
    color: true,
    paleta: "pelo",
    piezas: [
      "EyeBrow.001.glb",
      "EyeBrow.002.glb",
      "EyeBrow.003.glb",
      "EyeBrow.004.glb",
      "EyeBrow.005.glb",
      "EyeBrow.006.glb",
      "EyeBrow.007.glb",
      "EyeBrow.008.glb",
      "EyeBrow.009.glb",
      "EyeBrow.010.glb"
    ],
  },
  {
    id: "Nose",
    label: "Nariz",
    quitable: false,
    color: false,
    paleta: null,
    piezas: [
      "Nose.001.glb",
      "Nose.002.glb",
      "Nose.003.glb",
      "Nose.004.glb"
    ],
  },
  {
    id: "FacialHair",
    label: "Barba",
    quitable: true,
    color: true,
    paleta: "pelo",
    piezas: [
      "FacialHair.001.glb",
      "FacialHair.002.glb",
      "FacialHair.003.glb",
      "FacialHair.004.glb",
      "FacialHair.005.glb",
      "FacialHair.006.glb",
      "FacialHair.007.glb"
    ],
  },
  {
    id: "Hair",
    label: "Pelo",
    quitable: true,
    color: true,
    paleta: "pelo",
    piezas: [
      "Hair.001.glb",
      "Hair.002.glb",
      "Hair.003.glb",
      "Hair.004.glb",
      "Hair.005.glb",
      "Hair.006.glb",
      "Hair.007.glb",
      "Hair.008.glb",
      "Hair.009.glb",
      "Hair.010.glb",
      "Hair.011.glb"
    ],
  },
  {
    id: "Glasses",
    label: "Lentes",
    quitable: true,
    color: true,
    paleta: "ropa",
    piezas: [
      "Glasses.001.glb",
      "Glasses.002.glb",
      "Glasses.003.glb",
      "Glasses.004.glb"
    ],
  },
  {
    id: "Hat",
    label: "Sombrero",
    quitable: true,
    color: true,
    paleta: "ropa",
    piezas: [
      "Hat.001.glb",
      "Hat.002.glb",
      "Hat.003.glb",
      "Hat.004.glb",
      "Hat.005.glb",
      "Hat.006.glb",
      "Hat.007.glb",
      "PumpkinHead.glb"
    ],
  },
  {
    id: "Earring",
    label: "Aretes",
    quitable: true,
    color: false,
    paleta: null,
    piezas: [
      "Earring.001.glb",
      "Earring.002.glb",
      "Earring.003.glb",
      "Earring.004.glb",
      "Earring.005.glb",
      "Earring.006.glb"
    ],
  },
  {
    id: "Bow",
    label: "Moño",
    quitable: true,
    color: true,
    paleta: "ropa",
    piezas: [
      "Bow.001.glb",
      "Bow.002.glb"
    ],
  },
  {
    id: "Top",
    label: "Playera",
    quitable: true,
    color: true,
    paleta: "ropa",
    piezas: [
      "Top.001.glb",
      "Top.002.glb",
      "Top.003.glb"
    ],
  },
  {
    id: "Bottom",
    label: "Pantalón",
    quitable: true,
    color: true,
    paleta: "ropa",
    piezas: [
      "Bottom.001.glb",
      "Bottom.002.glb",
      "Bottom.003.glb"
    ],
  },
  {
    id: "Outfit",
    label: "Traje",
    quitable: true,
    color: true,
    paleta: "ropa",
    tapa: ["Top","Bottom"],
    piezas: [
      "Outfit.001.glb",
      "Outfit.002.glb",
      "Outfit.003.glb",
      "Outfit.004.glb",
      "WawaDress.glb"
    ],
  },
  {
    id: "Shoes",
    label: "Zapatos",
    quitable: true,
    color: true,
    paleta: "ropa",
    piezas: [
      "Shoes.001.glb",
      "Shoes.002.glb",
      "Shoes.003.glb"
    ],
  }
]

export const CATEGORIA_BY_ID = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]))

/** Cómo se ve el nombre de una pieza en pantalla: "Hair.003.glb" → "Pelo 3". */
export function nombreDePieza(catId, archivo) {
  const c = CATEGORIA_BY_ID[catId]
  const n = archivo.match(/\.(\d+)\.glb$/)?.[1]
  if (!n) return archivo.replace('.glb', '').replace(/([a-z])([A-Z])/g, '$1 $2')
  return `${c?.label ?? catId} ${Number(n)}`
}
