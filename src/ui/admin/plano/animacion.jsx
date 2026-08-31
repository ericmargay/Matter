import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/** El movimiento, aplicado. El catálogo de animaciones vive en `animacion.js`. */

/**
 * Aplica el movimiento al grupo que envuelve.
 *
 * Todo es muy poco a propósito. La referencia es lo que se ve por la ventana
 * de una casa de verdad, no un salvapantallas: si el movimiento se nota, ya es
 * demasiado.
 */
export default function Animar({ tipo = 'ninguna', semilla = 0, children }) {
  const g = useRef()
  const fase = useMemo(() => (semilla % 100) * 0.37, [semilla])

  useFrame((st) => {
    const o = g.current
    if (!o || tipo === 'ninguna') return
    const t = st.clock.elapsedTime + fase

    if (tipo === 'respirar') {
      const s = 1 + Math.sin(t * 1.1) * 0.012
      o.scale.set(1, s, 1)
    } else if (tipo === 'mecer') {
      o.rotation.z = Math.sin(t * 0.65) * 0.016
      o.rotation.x = Math.cos(t * 0.47) * 0.011
    } else if (tipo === 'girar') {
      o.rotation.y = t * 1.6
    } else if (tipo === 'vibrar') {
      o.position.x = Math.sin(t * 34) * 0.0025
      o.position.y = Math.sin(t * 41) * 0.0015
    } else if (tipo === 'latir') {
      const s = 1 + Math.sin(t * 1.8) * 0.008
      o.scale.setScalar(s)
    } else if (tipo === 'colgar') {
      /* Péndulo desde arriba: el pivote es el techo, no el centro de la pieza.
         Meciendo desde el centro, un colgante parece flotar en vez de colgar. */
      o.rotation.z = Math.sin(t * 0.8) * 0.02
      o.rotation.x = Math.cos(t * 0.61) * 0.014
    }
  })

  return <group ref={g}>{children}</group>
}
