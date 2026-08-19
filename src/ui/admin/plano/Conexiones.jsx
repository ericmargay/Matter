import { useMemo } from 'react'
import * as THREE from 'three'

import { DEVICE_BY_ID } from '../../../content/catalog'
import { useEstilo } from './estilo'

/**
 * Lo que pasa en la casa y no se ve.
 *
 * Existen siempre; se dibujan cuando se piden. Esa es la regla: un plano con
 * todas las líneas encima es ilegible, y un plano sin ellas no explica nada.
 * Con el interruptor, el instalador ve por dónde va el cable y el cliente ve
 * por qué su casa hace lo que hace — que es de las cosas que más venden la
 * instalación, porque lo invisible es justo lo que nadie sabe que compró.
 *
 * Dos capas distintas y a propósito con lenguajes distintos:
 *
 * — **Eléctrica**: línea continua que va por dentro del muro y baja al
 *   registro. Es física, tiene ruta y tiene costo.
 * — **Inalámbrica**: arco punteado del aparato al hub. No tiene ruta —la
 *   señal no dobla esquinas— así que dibujarla recta y flotando es lo
 *   honesto.
 */

const MAT_CABLE = new THREE.MeshBasicMaterial({ color: '#f0796a', toneMapped: false })

/** El tramo de cable entre dos puntos, como tubo y no como línea de un píxel. */
function Cable({ a, b }) {
  const { pos, rot, largo } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const d = vb.clone().sub(va)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())
    const e = new THREE.Euler().setFromQuaternion(q)
    return { pos: va.clone().add(vb).multiplyScalar(0.5).toArray(), rot: [e.x, e.y, e.z], largo: d.length() }
  }, [a, b])

  return (
    <mesh position={pos} rotation={rot} material={MAT_CABLE}>
      <cylinderGeometry args={[0.012, 0.012, largo, 6]} />
    </mesh>
  )
}

/** El arco de un enlace inalámbrico: punteado y sin tocar el piso. */
function Enlace({ a, b, color }) {
  const puntos = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const medio = va.clone().add(vb).multiplyScalar(0.5)
    // la panza del arco crece con la distancia: dos aparatos juntos casi no
    // se arquean y uno al otro extremo del cuarto sí
    medio.y += Math.max(0.35, va.distanceTo(vb) * 0.3)
    return new THREE.QuadraticBezierCurve3(va, medio, vb).getPoints(28)
  }, [a, b])

  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(puntos), [puntos])
  const mat = useMemo(
    () => new THREE.LineDashedMaterial({ color, dashSize: 0.09, gapSize: 0.07, transparent: true, opacity: 0.8, toneMapped: false }),
    [color],
  )

  return (
    <line geometry={geo} material={mat} onUpdate={(l) => l.computeLineDistances()} />
  )
}

export default function Conexiones({ plano, alto }) {
  const verE = useEstilo((e) => e.verElectricas)
  const verI = useEstilo((e) => e.verInalambricas)
  if (!verE && !verI) return null

  const items = plano.items ?? []
  const donde = (it) => [it.x, it.y ?? (it.clase === 'punto' ? 0.4 : 0.1), it.z]

  /* El hub de la casa: si hay uno levantado, todo lo inalámbrico apunta ahí.
     Si no, se dibuja hacia el centro del cuarto y se ve solo lo que no está
     resuelto — que también es información. */
  const hub = items.find((i) => DEVICE_BY_ID[i.deviceId]?.cat === 'hubs')
  const centro = hub ? donde(hub) : [0, alto * 0.55, 0]

  const inalambricos = items.filter((i) => {
    const d = DEVICE_BY_ID[i.deviceId]
    return d && i !== hub && ['thread', 'wifi', 'zigbee', 'matter', 'zwave'].includes(d.link)
  })

  const COLOR = { thread: '#5eead4', zigbee: '#fbbf24', wifi: '#93c5fd', matter: '#a78bfa', zwave: '#f9a8d4' }

  return (
    <group>
      {verE &&
        (plano.tramos ?? []).map((t) => {
          const a = items.find((i) => i.id === t.entre?.[0])
          const b = items.find((i) => i.id === t.entre?.[1])
          if (!a || !b) return null
          return <Cable key={t.id} a={donde(a)} b={donde(b)} />
        })}

      {verI &&
        inalambricos.map((i) => (
          <Enlace
            key={i.id}
            a={donde(i)}
            b={centro}
            color={COLOR[DEVICE_BY_ID[i.deviceId]?.link] ?? '#93c5fd'}
          />
        ))}
    </group>
  )
}
