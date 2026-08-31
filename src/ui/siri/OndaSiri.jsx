import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import { COLORES, FRAGMENT, VERTEX } from './onda'

/**
 * La barra de Siri: un lienzo diminuto con un solo cuadrilátero.
 *
 * Va en su propio Canvas y no en el del plano porque es interfaz, no escena:
 * tiene que poder aparecer encima de cualquier cosa, seguir el tamaño de su
 * caja en el HTML y no cargar con el postproceso ni las luces del cuarto.
 *
 * Un plano y un shader: no hay geometría que actualizar ni objetos que crear
 * por cuadro, así que cuesta lo mismo encendida que apagada.
 */
export default function OndaSiri({ abierto = 1, energia = 0.6, brillo = 1, className = '' }) {
  return (
    <div className={className}>
      <Canvas
        orthographic
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 1], zoom: 1 }}
        style={{ background: 'transparent' }}
      >
        <Plano abierto={abierto} energia={energia} brillo={brillo} />
      </Canvas>
    </div>
  )
}

function Plano({ abierto, energia, brillo }) {
  const malla = useRef()
  const mat = useRef()
  const { size } = useThree()

  const uniforms = useMemo(
    () => ({
      u_tiempo: { value: 0 },
      u_res: { value: new THREE.Vector2(1, 1) },
      u_abierto: { value: 0 },
      u_energia: { value: 0.5 },
      u_brillo: { value: 1 },
      u_radio: { value: 40 },
      u_c1: { value: new THREE.Color(COLORES.c1) },
      u_c2: { value: new THREE.Color(COLORES.c2) },
      u_c3: { value: new THREE.Color(COLORES.c3) },
      u_c4: { value: new THREE.Color(COLORES.c4) },
    }),
    [],
  )

  useFrame((st, dt) => {
    /* Los uniformes se leen del material, no del objeto que le pasamos: R3F
       lo copia al montar —cada `{ value }` es un envoltorio nuevo— así que
       escribirle al nuestro no movería nada. Los vectores y colores sí se
       comparten por referencia, y esa mezcla es justo la que hace que el bicho
       se vea a medio funcionar en vez de a roto. */
    const u = mat.current?.uniforms
    if (!u) return
    u.u_tiempo.value = st.clock.elapsedTime
    u.u_res.value.set(size.width, size.height)
    u.u_radio.value = Math.min(size.height * 0.5, 60)

    /* Todo entra con retraso, nunca de golpe. Una barra que aparece a su
       tamaño final en un cuadro se ve a ventana emergente; llegando con
       amortiguación se ve a algo que se abrió. */
    const k = 1 - Math.pow(0.002, Math.min(dt, 1 / 30))
    u.u_abierto.value += (abierto - u.u_abierto.value) * k
    u.u_energia.value += (energia - u.u_energia.value) * k * 0.7
    u.u_brillo.value += (brillo - u.u_brillo.value) * k

    if (malla.current) malla.current.scale.set(size.width, size.height, 1)
  })

  return (
    <mesh ref={malla}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}
