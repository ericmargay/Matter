import { ACCESORIOS, ESPECIES, OJOS, PALETAS, PATRONES, ROPAS, SOMBREROS } from './especies'

/**
 * Un animalito al azar, pero no cualquiera.
 *
 * Al azar puro salen monstruos: sombrero siempre, estampado de lunares con
 * rayas, un pelaje morado con panza fucsia. Lo que se quiere de un aleatorio no
 * es variedad máxima sino que CASI SIEMPRE salga uno presentable, porque para
 * eso se usa: se generan cuatro, uno cae bien, y ése se corrige.
 */

const alAzar = (a) => a[Math.floor(Math.random() * a.length)]
const aVeces = (p) => Math.random() < p

export function animalitoAlAzar() {
  const esp = alAzar(ESPECIES)

  /* El pelaje sale del de la especie casi siempre. Un gato naranja y un oso
     café se reconocen; un oso turquesa es un chiste que se gasta a la
     segunda. Una de cada cinco veces se permite el color libre, que es lo que
     hace que el catálogo no se sienta cerrado. */
  const pelaje = aVeces(0.8) ? esp.pelaje : alAzar(PALETAS.pelaje)
  const panza = aVeces(0.85) ? esp.panza : alAzar(PALETAS.panza)

  return {
    especie: esp.id,
    pelaje,
    panza,
    ojos: alAzar(OJOS.filter((o) => o.id !== 'dormidos')).id,
    ropa: aVeces(0.85) ? alAzar(ROPAS.filter((r) => r.id !== 'nada')).id : 'nada',
    patron: aVeces(0.45) ? alAzar(PATRONES.filter((p) => p.id !== 'liso')).id : 'liso',
    colorRopa: alAzar(PALETAS.ropa),
    sombrero: aVeces(0.35) ? alAzar(SOMBREROS.filter((s) => s.id !== 'nada')).id : 'nada',
    accesorio: aVeces(0.3) ? alAzar(ACCESORIOS.filter((a) => a.id !== 'nada')).id : 'nada',
    estatura: 1.15 + Math.random() * 0.15,
    pose: 'reposo',
  }
}

/** El de arranque: un gato, para empezar a tocarlo. */
export function animalitoBase() {
  const esp = ESPECIES[0]
  return {
    especie: esp.id,
    pelaje: esp.pelaje,
    panza: esp.panza,
    ojos: 'puntos',
    ropa: 'playera',
    patron: 'liso',
    colorRopa: '#4d9fff',
    sombrero: 'nada',
    accesorio: 'nada',
    estatura: 1.2,
    pose: 'reposo',
  }
}
