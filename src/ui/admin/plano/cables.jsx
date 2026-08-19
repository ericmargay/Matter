import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'


/**
 * El cable, dibujado. Las medidas y las rutas viven en `cables.js`; aquí solo
 * está cómo se ve y cómo se mueve.
 */

const COLOR = { piso: '#3b3f4a', muro: '#4a505e', oculto: '#6f5a86' }

/**
 * @param desde  punto de salida del aparato, en mundo
 * @param hasta  el contacto, en mundo
 * @param largo  metros de cable disponibles
 */
function trazo(desde, hasta, largo, ruta) {
  const recta = desde.distanceTo(hasta)
  // lo que sobra se cuelga o se enrosca; si falta, el cable va tenso
  const sobra = Math.max(0, largo - recta)
  const pts = []

  if (ruta === 'muro') {
    /* Por canaleta: baja o sube pegado al muro y corre horizontal. Dos
       quiebres rectos, que es exactamente como se ve una canaleta. */
    const codo = new THREE.Vector3(desde.x, hasta.y + 0.02, desde.z)
    pts.push(desde, desde.clone().lerp(codo, 0.5), codo, codo.clone().lerp(hasta, 0.5), hasta)
  } else if (ruta === 'oculto') {
    // por dentro: la ruta más corta, en escuadra
    const codo = new THREE.Vector3(desde.x, hasta.y, desde.z)
    pts.push(desde, codo, hasta)
  } else {
    // por el piso: cae, se arrastra y hace una lazada con lo que sobra
    const pie = new THREE.Vector3(desde.x, 0.012, desde.z)
    const medio = pie.clone().lerp(hasta, 0.5)
    medio.y = 0.012
    // la lazada se abre hacia un lado, proporcional a lo que sobra
    const lado = new THREE.Vector3().subVectors(hasta, pie).normalize()
    medio.addScaledVector(new THREE.Vector3(-lado.z, 0, lado.x), Math.min(sobra * 0.45, 0.6))
    pts.push(desde, desde.clone().lerp(pie, 0.5).setY(desde.y * 0.45), pie, medio, hasta)
  }
  return pts
}

export function Cable({ desde, hasta, largo = 1.8, ruta = 'piso', alcanza = true, interactivo = true }) {
  const malla = useRef()
  const [encima, setEncima] = useState(false)
  const fase = useRef(0)

  const base = useMemo(() => trazo(desde.clone(), hasta.clone(), largo, ruta), [desde, hasta, largo, ruta])

  const curva = useMemo(() => new THREE.CatmullRomCurve3(base.map((p) => p.clone())), [base])

  /* Movimiento al pasar por encima: el cable se mece un poco, como si lo
     hubieran rozado. No es adorno — es lo que hace que se lea como un objeto
     físico y no como una línea de diagrama, y de paso avisa que se puede
     tocar. Solo los puntos de en medio se mueven: los extremos están
     enchufados y ésos no se mueven nunca. */
  useFrame((_, dt) => {
    if (!malla.current) return
    fase.current += dt * (encima ? 3.2 : 0.7)
    const amp = (encima ? 0.035 : 0.006) * (ruta === 'piso' ? 1 : 0.4)
    const ps = curva.points
    for (let i = 1; i < ps.length - 1; i++) {
      const b = base[i]
      const t = fase.current + i * 0.9
      ps[i].set(b.x + Math.sin(t) * amp, b.y + Math.sin(t * 1.7) * amp * 0.6, b.z + Math.cos(t * 1.1) * amp)
    }
    malla.current.geometry.dispose()
    malla.current.geometry = new THREE.TubeGeometry(curva, 26, encima ? 0.008 : 0.006, 6, false)
  })

  return (
    <mesh
      ref={malla}
      onPointerOver={interactivo ? () => setEncima(true) : undefined}
      onPointerOut={interactivo ? () => setEncima(false) : undefined}
    >
      <tubeGeometry args={[curva, 26, 0.006, 6, false]} />
      <meshStandardMaterial
        color={alcanza ? COLOR[ruta] : '#e0533f'}
        roughness={0.75}
        emissive={encima ? '#4d9fff' : '#000000'}
        emissiveIntensity={encima ? 0.5 : 0}
      />
    </mesh>
  )
}

