import * as THREE from 'three'

/**
 * Cómo se arman los paneles triangulares en el muro.
 *
 * La primera versión estaba mal y se veía: los triángulos salían separados y
 * en escalera porque los colocaba en una retícula inventada, con cilindros de
 * tres lados que ni siquiera compartían arista. Un panel Nanoleaf no es eso —
 * las piezas se unen borde con borde y forman una figura PLANA sobre el muro,
 * como un cuadro. Si no se tocan, no es la pieza.
 *
 * Así que la geometría se construye a mano con los vértices exactos de la
 * teselación triangular, que es la única forma de garantizar que los bordes
 * coincidan:
 *
 *   lado L, altura h = L·√3/2
 *   una fila `f` ocupa de y = −(f+1)·h  a  y = −f·h
 *   dentro de la fila alternan triángulos con la punta arriba y abajo, y cada
 *   uno avanza medio lado
 *
 * Con eso, `arriba` deja de ser decoración: dice de qué lado está la punta, y
 * de ahí salen los tres vértices sin ambigüedad.
 */

/** Lado del panel. El NL22 mide ~24 cm por lado. */
export const LADO = 0.24
export const GROSOR = 0.02

const cache = new Map()

/**
 * Un triángulo plano de verdad, con su grosor.
 *
 * Se hace con `ExtrudeGeometry` sobre una forma de tres puntos en vez de un
 * cilindro de tres lados: el cilindro da un prisma equilátero pero centrado en
 * su circunradio, y acomodarlo para que las aristas peguen es pelear con la
 * trigonometría en cada pieza. Con la forma explícita, los vértices son los
 * que uno escribió.
 */
export function trianguloPanel(lado = LADO, arriba = true, grosor = GROSOR) {
  const clave = `${lado}|${arriba}|${grosor}`
  if (cache.has(clave)) return cache.get(clave)

  const h = (Math.sqrt(3) / 2) * lado
  const s = new THREE.Shape()
  if (arriba) {
    // base abajo, punta arriba
    s.moveTo(-lado / 2, -h / 3)
    s.lineTo(lado / 2, -h / 3)
    s.lineTo(0, (h * 2) / 3)
  } else {
    // base arriba, punta abajo
    s.moveTo(-lado / 2, h / 3)
    s.lineTo(lado / 2, h / 3)
    s.lineTo(0, (-h * 2) / 3)
  }
  s.closePath()

  const g = new THREE.ExtrudeGeometry(s, { depth: grosor, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 })
  g.center()
  cache.set(clave, g)
  return g
}

/* ── las figuras ──────────────────────────────────────────────────
   Cada una se describe por las CELDAS que ocupa en la teselación: fila y
   posición dentro de la fila. La posición par es punta arriba y la impar punta
   abajo; así dos celdas contiguas siempre comparten arista. */

const C = (f, i) => ({ f, i })

export const DISPOSICIONES = [
  {
    id: 'triangulo',
    nombre: 'Triángulo mayor',
    porque: 'Las nueve piezas forman un triángulo grande, unidas borde con borde. Es la más limpia y la que mejor cae sobre una cabecera.',
    celdas: [C(0, 0), C(1, 0), C(1, 1), C(1, 2), C(2, 0), C(2, 1), C(2, 2), C(2, 3), C(2, 4)],
  },
  {
    id: 'rombo',
    nombre: 'Rombo',
    porque: 'Más ancho que alto. Funciona sobre un mueble largo o una cama matrimonial, donde el triángulo se ve chico.',
    celdas: [C(0, 0), C(0, 1), C(0, 2), C(1, 0), C(1, 1), C(1, 2), C(1, 3), C(1, 4), C(2, 2)],
  },
  {
    id: 'diagonal',
    nombre: 'Diagonal',
    porque: 'Una banda que sube. Para escalera, pasillo largo o el muro angosto junto a una puerta.',
    celdas: [C(0, 0), C(0, 1), C(1, 1), C(1, 2), C(2, 2), C(2, 3), C(3, 3), C(3, 4), C(4, 4)],
  },
  {
    id: 'flecha',
    nombre: 'Flecha',
    porque: 'Apunta a algo: la tele, la puerta, el escritorio. Es la que más se nota en foto.',
    celdas: [C(0, 0), C(1, 0), C(1, 1), C(1, 2), C(2, 0), C(2, 1), C(2, 3), C(2, 4), C(2, 2)],
  },
  {
    id: 'banda',
    nombre: 'Banda',
    porque: 'Una sola fila a lo ancho. Para un muro largo y bajo, encima de un mueble de tele o un respaldo.',
    celdas: [C(0, 0), C(0, 1), C(0, 2), C(0, 3), C(0, 4), C(0, 5), C(0, 6), C(0, 7), C(0, 8)],
  },
]

export const DISPOSICION_BY_ID = Object.fromEntries(DISPOSICIONES.map((d) => [d.id, d]))

/**
 * De celdas a posiciones en metros, ya centradas.
 *
 * @returns [{ x, y, arriba }] listo para colocar cada triángulo
 */
export function posicionesDe(disposicion, lado = LADO) {
  const h = (Math.sqrt(3) / 2) * lado
  const celdas = disposicion?.celdas ?? []
  if (!celdas.length) return []

  const crudas = celdas.map(({ f, i }) => {
    const arriba = i % 2 === 0
    /* El centro de una celda: cada paso dentro de la fila avanza medio lado, y
       la punta arriba o abajo desplaza el centro un sexto de la altura, que es
       la diferencia entre el baricentro de un triángulo y el del invertido. */
    const x = (i - (f + 0.5)) * (lado / 2) + lado / 2
    const y = -f * h + (arriba ? -h / 2 + h / 3 : -h / 2 + (h * 2) / 3) - h / 6
    return { x, y, arriba }
  })

  // se centra la figura completa para que el ancla quede en su medio
  const xs = crudas.map((p) => p.x)
  const ys = crudas.map((p) => p.y)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  return crudas.map((p) => ({ ...p, x: p.x - cx, y: p.y - cy }))
}

/** Cuánto mide la figura, para la huella y el encuadre. */
export function medidaDe(disposicion, lado = LADO) {
  const ps = posicionesDe(disposicion, lado)
  if (!ps.length) return { w: lado, h: lado }
  const xs = ps.map((p) => p.x)
  const ys = ps.map((p) => p.y)
  return {
    w: Math.max(...xs) - Math.min(...xs) + lado,
    h: Math.max(...ys) - Math.min(...ys) + (Math.sqrt(3) / 2) * lado,
  }
}
