import { Suspense, useMemo, useRef, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three/examples/jsm/Addons.js'

import Animalito from './Animalito'
import Poder from './Poder'
import { animalitoBase } from './aleatorio'
import { usePersonaje } from './usePersonaje'

/**
 * Un personaje: la malla, el motor que lo mantiene vivo y su invocación.
 *
 * La malla es intercambiable a propósito. Si el `config` trae un `modelo`, se
 * carga ese GLB con su esqueleto, su skinning, sus blendshapes y sus clips; si
 * no, se dibuja el animalito de casa. Todo lo demás —respiración, mirada,
 * parpadeo, cambio de peso, secondary motion de orejas, cola, pelo y tela, la
 * máquina de estados con mezclas, y la invocación— funciona igual en los dos
 * casos, porque se engancha por NOMBRE de hueso y no por índice.
 *
 * Esa es la apuesta de todo este archivo: lo caro de un personaje no es la
 * malla, es lo que hay que escribir para que no parezca un maniquí. Eso está
 * hecho y sobrevive a cambiar de malla las veces que haga falta.
 */
export default function Personaje({ config, estado = 'quieto', invocando = false, onFinPoder, ...props }) {
  const cfg = useMemo(() => config ?? animalitoBase(), [config])
  return (
    <Suspense fallback={null}>
      {cfg.modelo ? (
        <ConModelo cfg={cfg} estado={estado} invocando={invocando} onFinPoder={onFinPoder} {...props} />
      ) : (
        <ConAnimalito cfg={cfg} estado={estado} invocando={invocando} onFinPoder={onFinPoder} {...props} />
      )}
    </Suspense>
  )
}

/** Un personaje modelado de verdad, con su rig y sus animaciones. */
function ConModelo({ cfg, estado, invocando, onFinPoder, ...props }) {
  const { scene, animations } = useGLTF(cfg.modelo)
  /* Clonado con SkeletonUtils y no con `clone()`: el normal no rehace el
     esqueleto, así que dos personajes del mismo archivo comparten huesos y el
     segundo deja tieso al primero. */
  const propio = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const raiz = useRef()
  const { partes } = usePersonaje(propio, {
    estado: invocando ? 'poder' : estado,
    clips: animations,
    semilla: cfg.semilla ?? 0,
  })

  return (
    <group ref={raiz} {...props}>
      <primitive object={propio} />
      <Poder partes={partes} activo={invocando} onFin={onFinPoder} />
    </group>
  )
}

/** El de casa: primitivas, pero con el mismo motor encima. */
function ConAnimalito({ cfg, estado, invocando, onFinPoder, ...props }) {
  const raiz = useRef()
  const [listo, setListo] = useState(null)
  const { partes } = usePersonaje(listo, {
    estado: invocando ? 'poder' : estado,
    semilla: cfg.semilla ?? 0,
  })

  return (
    <group
      ref={(o) => {
        raiz.current = o
        if (o && !listo) setListo(o)
      }}
      {...props}
    >
      <Animalito config={cfg} pose={estado} estatura={cfg.estatura ?? 1.2} conMotor />
      <Poder partes={partes} activo={invocando} onFin={onFinPoder} />
    </group>
  )
}
