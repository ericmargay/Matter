import { Suspense, useMemo } from 'react'

import Avatar from './Avatar'
import { avatarBase } from './aleatorio'

/**
 * El avatar como una pieza más del cuarto.
 *
 * Ponerlo en el plano no es un adorno: una persona a escala es la referencia
 * que hace que todo lo demás se lea. Una barra a 90 cm, una tele a 1.20 del
 * piso o una repisa a 1.80 son números hasta que hay alguien parado al lado.
 *
 * Trae su propia frontera de carga. Las piezas del avatar se descargan a la
 * primera y eso SUSPENDE; sin la frontera aquí, esa espera la atendería el
 * Suspense del lienzo y el cuarto entero parpadearía al colocar uno.
 */
export default function AvatarPieza({ avatar, pose, ...props }) {
  const config = useMemo(() => avatar ?? avatarBase(), [avatar])
  return (
    <Suspense fallback={null}>
      <Avatar config={config} pose={pose ?? config.pose ?? 'Idle'} {...props} />
    </Suspense>
  )
}
