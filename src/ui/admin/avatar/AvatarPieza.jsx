import { useMemo } from 'react'

import Personaje from './Personaje'
import { animalitoBase } from './aleatorio'

/**
 * El animalito como una pieza más del cuarto.
 *
 * Ponerlo en el plano no es un adorno. Un personaje a escala es la referencia
 * que hace que todo lo demás se lea —una barra a 90 cm o una repisa a 1.80 son
 * números hasta que hay alguien parado al lado— y además es lo que el cliente
 * reconoce primero cuando ve su casa en la pantalla: antes de mirar dónde
 * quedaron los contactos, mira quién vive ahí.
 *
 * No carga nada de disco: es geometría calculada, así que aparece en el mismo
 * cuadro en que se coloca.
 */
export default function AvatarPieza({ avatar, pose, ...props }) {
  const config = useMemo(() => avatar ?? animalitoBase(), [avatar])
  return (
    <Personaje
      config={config}
      estado={pose ?? config.pose ?? 'quieto'}
      {...props}
    />
  )
}
