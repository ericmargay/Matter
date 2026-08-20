import { CATEGORIAS, PALETAS } from './piezas'

/**
 * Un avatar al azar, pero no cualquiera.
 *
 * Al azar puro salen monstruos: barba en la mitad de los avatares, sombrero
 * siempre, dos accesorios en la cara peleándose el mismo hueco. Lo que se
 * quiere de un aleatorio no es variedad máxima sino que CASI SIEMPRE salga uno
 * presentable, porque para eso se usa: para empezar de algo en vez de la hoja
 * en blanco, y para que en una junta se puedan generar cinco y elegir.
 *
 * Por eso cada categoría opcional lleva su propia probabilidad, sacada de lo
 * que se ve en la calle y no de una moneda al aire.
 */

const PROBABLE = {
  Face: 0.25,
  EyeBrow: 0.95,
  FacialHair: 0.3,
  Hair: 0.9,
  Glasses: 0.25,
  Hat: 0.3,
  Earring: 0.3,
  Bow: 0.12,
  Outfit: 0.25,
  Top: 0.95,
  Bottom: 0.95,
  Shoes: 0.9,
}

const alAzar = (a) => a[Math.floor(Math.random() * a.length)]

export function avatarAlAzar() {
  const piezas = {}
  const colores = {}

  /* El pelo, las cejas y la barba comparten tono. Es lo primero que delata a
     un avatar armado por una máquina: cejas negras con pelo rubio. */
  const tonoPelo = alAzar(PALETAS.pelo)
  const piel = alAzar(PALETAS.piel)

  for (const c of CATEGORIAS) {
    if (c.piezas.length === 0) continue
    const sale = !c.quitable || Math.random() < (PROBABLE[c.id] ?? 0.5)
    piezas[c.id] = sale ? alAzar(c.piezas) : null
    if (!c.color) continue
    colores[c.id] =
      c.paleta === 'pelo' ? tonoPelo : c.paleta === 'piel' ? piel : alAzar(PALETAS.ropa)
  }

  /* Con traje no hace falta lo de abajo, y con lo de abajo no hace falta el
     traje: elegir los dos deja al azar cuál se ve, que es lo mismo que no
     haber elegido. */
  if (piezas.Outfit) {
    piezas.Top = null
    piezas.Bottom = null
  }

  return { piezas, colores, piel, pose: 'Idle' }
}

/** El de arranque: neutro, para empezar a tocarlo. */
export function avatarBase() {
  const piezas = {}
  const colores = {}
  for (const c of CATEGORIAS) {
    piezas[c.id] = c.quitable ? null : (c.piezas[0] ?? null)
    if (c.color) colores[c.id] = c.paleta === 'piel' ? PALETAS.piel[0] : PALETAS[c.paleta ?? 'ropa'][0]
  }
  piezas.Hair = CATEGORIAS.find((c) => c.id === 'Hair')?.piezas[0] ?? null
  piezas.EyeBrow = CATEGORIAS.find((c) => c.id === 'EyeBrow')?.piezas[0] ?? null
  piezas.Top = CATEGORIAS.find((c) => c.id === 'Top')?.piezas[0] ?? null
  piezas.Bottom = CATEGORIAS.find((c) => c.id === 'Bottom')?.piezas[0] ?? null
  piezas.Shoes = CATEGORIAS.find((c) => c.id === 'Shoes')?.piezas[0] ?? null
  return { piezas, colores, piel: PALETAS.piel[0], pose: 'Idle' }
}
