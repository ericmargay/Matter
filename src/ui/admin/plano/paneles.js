/**
 * Cómo se acomodan los paneles triangulares en el muro.
 *
 * Los Nanoleaf no vienen en una forma: vienen en nueve piezas y la
 * composición se decide en el muro. Eso importa en el levantamiento porque no
 * es lo mismo un triángulo grande compacto sobre la cabecera que una tira
 * diagonal subiendo la escalera — cambia el muro que se necesita, cambia dónde
 * queda el cable y cambia lo que el cliente va a ver.
 *
 * Cada disposición se guarda como coordenadas en una retícula triangular, en
 * unidades de lado. Un panel apunta hacia arriba o hacia abajo, que es lo
 * único que hace falta para colocarlo: en una retícula triangular los dos
 * sentidos alternan solos.
 *
 * `T(fila, columna, arriba)` — fila cuenta hacia abajo desde la punta.
 */
const T = (f, c, arriba) => ({ f, c, arriba })

export const DISPOSICIONES = [
  {
    id: 'triangulo',
    nombre: 'Triángulo mayor',
    porque: 'Las nueve piezas forman un triángulo grande. Es la más limpia y la que mejor cae sobre una cabecera o un sillón.',
    ancho: 3,
    piezas: [
      T(0, 0, true),
      T(1, 0, true), T(1, 1, false), T(1, 2, true),
      T(2, 0, true), T(2, 1, false), T(2, 2, true), T(2, 3, false), T(2, 4, true),
    ],
  },
  {
    id: 'rombo',
    nombre: 'Rombo',
    porque: 'Más ancho que alto. Funciona sobre un mueble largo o una cama matrimonial, donde el triángulo se ve chico.',
    ancho: 3,
    piezas: [
      T(0, 1, true), T(0, 2, false), T(0, 3, true),
      T(1, 0, true), T(1, 1, false), T(1, 2, true), T(1, 3, false), T(1, 4, true),
      T(2, 2, false),
    ],
  },
  {
    id: 'diagonal',
    nombre: 'Diagonal',
    porque: 'Una tira que sube. Para escalera, pasillo largo o el muro angosto junto a una puerta.',
    ancho: 5,
    piezas: [
      T(0, 4, true),
      T(1, 3, true), T(1, 4, false),
      T(2, 2, true), T(2, 3, false),
      T(3, 1, true), T(3, 2, false),
      T(4, 0, true), T(4, 1, false),
    ],
  },
  {
    id: 'flecha',
    nombre: 'Flecha',
    porque: 'Apunta a algo: la tele, la puerta, el escritorio. Es la que más se nota en foto.',
    ancho: 4,
    piezas: [
      T(0, 2, true),
      T(1, 1, true), T(1, 2, false), T(1, 3, true),
      T(2, 0, true), T(2, 1, false),
      T(2, 3, false), T(2, 4, true),
      T(3, 0, false),
    ],
  },
  {
    id: 'ola',
    nombre: 'Ola',
    porque: 'Serpentea a lo ancho. Para un muro largo donde una figura compacta se pierde.',
    ancho: 6,
    piezas: [
      T(0, 1, true), T(0, 5, true),
      T(1, 0, true), T(1, 1, false), T(1, 2, true),
      T(1, 4, true), T(1, 5, false), T(1, 6, true),
      T(2, 3, true),
    ],
  },
]

export const DISPOSICION_BY_ID = Object.fromEntries(DISPOSICIONES.map((d) => [d.id, d]))

/** Lado del panel en metros — el NL22 mide ~24 cm por lado. */
export const LADO = 0.24

/**
 * De la retícula triangular a metros.
 * En una retícula así, cada columna avanza medio lado y cada fila baja la
 * altura del triángulo equilátero.
 */
export function posicionesDe(disposicion, lado = LADO) {
  const alto = (Math.sqrt(3) / 2) * lado
  return (disposicion?.piezas ?? []).map((p) => ({
    x: (p.c - (disposicion.ancho - 1)) * (lado / 2),
    y: -p.f * alto,
    arriba: p.arriba,
  }))
}
