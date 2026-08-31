/**
 * Qué sabe hacer un personaje, y cómo pasa de una cosa a otra.
 *
 * (Se llama `estados` y no `personaje` porque en un disco que no distingue
 *  mayúsculas, `personaje.js` y `Personaje.jsx` son el MISMO archivo: el
 *  empaquetador resolvía el componente a esta tabla y el build moría diciendo
 *  que faltaba una exportación que sí estaba escrita.)
 *
 * Esto NO es una lista de animaciones: es una máquina de estados con tiempos
 * de mezcla. La diferencia importa. Cortar de "quieto" a "correr" en un cuadro
 * es lo que hace que un personaje se vea a videojuego de hace veinte años;
 * mezclarlo en un cuarto de segundo es lo que lo hace parecer que decidió
 * correr. Y los tiempos no son iguales: despertar es lento porque despertar es
 * lento, y sorprenderse es casi instantáneo porque sorprenderse lo es.
 *
 * Cada estado declara también su VIDA propia —cuánto respira, cuánto se mueve
 * la mirada, cada cuánto parpadea— porque un personaje dormido no parpadea y
 * uno corriendo no mira alrededor con calma.
 */

export const ESTADOS = {
  quieto: {
    label: 'Quieto',
    clip: 'Idle',
    entra: 0.35,
    vida: { respira: 1, mirada: 1, parpadeo: 4, peso: 1, oreja: 1 },
  },
  camina: {
    label: 'Caminando',
    clip: 'Walk',
    entra: 0.25,
    vida: { respira: 1.3, mirada: 0.5, parpadeo: 5, peso: 0.3, oreja: 1.4 },
  },
  corre: {
    label: 'Corriendo',
    clip: 'Run',
    entra: 0.2,
    vida: { respira: 2.2, mirada: 0.2, parpadeo: 6, peso: 0.1, oreja: 2 },
  },
  sienta: {
    label: 'Sentado',
    clip: 'Sit',
    entra: 0.5,
    vida: { respira: 0.8, mirada: 1.2, parpadeo: 3.5, peso: 0.4, oreja: 0.8 },
  },
  duerme: {
    label: 'Dormido',
    clip: 'Sleep',
    entra: 0.9,
    /* Dormido respira MÁS —hondo y lento— y no parpadea. Bajarle todo por
       igual lo deja apagado en vez de dormido, que es el error de siempre. */
    vida: { respira: 0.55, hondo: 2.4, mirada: 0, parpadeo: 0, peso: 0, oreja: 0.2 },
  },
  despierta: {
    label: 'Despertando',
    clip: 'WakeUp',
    entra: 0.8,
    unaVez: true,
    sigue: 'quieto',
    vida: { respira: 0.8, mirada: 0.6, parpadeo: 1.2, peso: 0.5, oreja: 1.6 },
  },
  rie: {
    label: 'Riendo',
    clip: 'Laugh',
    entra: 0.18,
    unaVez: true,
    sigue: 'quieto',
    vida: { respira: 2.6, mirada: 0.4, parpadeo: 2, peso: 1.4, oreja: 1.8 },
  },
  sorpresa: {
    label: 'Sorpresa',
    clip: 'Surprised',
    entra: 0.08,
    unaVez: true,
    sigue: 'quieto',
    vida: { respira: 1.8, mirada: 1.8, parpadeo: 0.6, peso: 1.2, oreja: 2.4 },
  },
  saluda: {
    label: 'Saludando',
    clip: 'Wave',
    entra: 0.22,
    unaVez: true,
    sigue: 'quieto',
    vida: { respira: 1.2, mirada: 1.4, parpadeo: 3, peso: 1.1, oreja: 1.3 },
  },
  baila: {
    label: 'Bailando',
    clip: 'Dance',
    entra: 0.3,
    vida: { respira: 2, mirada: 0.8, parpadeo: 3, peso: 1.6, oreja: 2.2 },
  },
  poder: {
    label: 'Invocando',
    clip: 'Cast',
    entra: 0.3,
    unaVez: true,
    sigue: 'quieto',
    vida: { respira: 1.4, mirada: 0.3, parpadeo: 1.4, peso: 0.6, oreja: 1.6 },
  },
}

export const ORDEN_ESTADOS = [
  'quieto', 'camina', 'corre', 'sienta', 'duerme', 'despierta',
  'saluda', 'rie', 'sorpresa', 'baila', 'poder',
]

/**
 * La invocación, cuadro a cuadro.
 *
 * Es la única secuencia escrita a mano y vale la pena que lo sea: una
 * invocación es una frase con gramática —anticipa, sube, abre, aparece, pulsa,
 * asienta— y si los tiempos no están puestos a propósito se siente a efecto en
 * vez de a poder. Los números son segundos desde el inicio.
 *
 * La anticipación va primero y va HACIA ABAJO. Todo movimiento poderoso
 * empieza en la dirección contraria: el cuerpo se hunde antes de que el brazo
 * suba, y sin ese hundimiento el gesto se ve ligero por más luz que se le
 * ponga encima.
 */
export const INVOCACION = {
  dura: 4.6,
  hitos: {
    anticipa: 0.0,   // el cuerpo se hunde, el brazo baja, la mirada cae
    sube: 0.55,      // el brazo empieza a levantarse, el torso se abre
    abre: 1.25,      // la mano se abre, los dedos se separan
    aparece: 1.5,    // la joya se materializa girando sobre la palma
    pulso: 2.0,      // el estallido de luz — el momento
    aura: 2.15,      // el aura envuelve al personaje
    asienta: 3.1,    // todo se calma, la joya queda flotando y oscilando
    fin: 4.6,
  },
  joya: {
    caras: 'octaedro',
    tam: 0.095,
    giro: 1.4,          // vueltas por segundo
    flota: 0.012,       // amplitud del cabeceo
    color: '#8fd8ff',
    brillo: '#dff4ff',
  },
  particulas: 46,
}

/** Nombres de hueso que se reconocen solos, vengan del rig que vengan. */
export const PATRONES = {
  cabeza: /head|cabeza|skull/i,
  cuello: /neck|cuello/i,
  pecho: /spine2|chest|upperchest|pecho|torso/i,
  cadera: /hips|pelvis|cadera|root/i,
  manoDer: /righthand$|mano.?der|hand_r$|hand\.r$/i,
  manoIzq: /lefthand$|mano.?izq|hand_l$|hand\.l$/i,
  oreja: /ear|oreja/i,
  cola: /tail|cola/i,
  pelo: /hair|pelo|braid|trenza|ponytail/i,
  tela: /cloth|skirt|falda|coat|capa|cape|scarf|bufanda|sash|faja/i,
  parpado: /blink|eyeclose|parpad/i,
  boca: /mouth|smile|jaw|boca|sonr/i,
  ceja: /brow|ceja/i,
}
