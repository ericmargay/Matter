import { useEffect, useMemo, useRef, useState } from 'react'
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

/**
 * La clavija: dónde queda enchufado cada aparato.
 *
 * Se dibuja saliendo del contacto, ocho centímetros hacia su propio cable, que
 * es como se ve una clavija puesta. Sirve para lo mismo que el cable: que el
 * contacto que va a usar cada aparato sea algo que se VE en el plano y no un
 * dato escondido en un menú.
 *
 * Por ahora no se arrastra. El contacto se elige en el taller de la pieza, en
 * la pestaña de cable.
 */
export function Clavija({ pos }) {
  return (
    <group position={pos}>
      <mesh castShadow>
        <boxGeometry args={[0.05, 0.06, 0.034]} />
        <meshStandardMaterial color="#2a2e38" roughness={0.5} />
      </mesh>
      {[-1, 1].map((sg) => (
        <mesh key={sg} position={[sg * 0.012, 0.042, 0]}>
          <boxGeometry args={[0.006, 0.032, 0.006]} />
          <meshStandardMaterial color="#c9b48a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

export function Cable({ desde, hasta, largo = 1.8, ruta = 'piso', alcanza = true, interactivo = true }) {
  const malla = useRef()
  const [encima, setEncima] = useState(false)
  const fase = useRef(0)

  const base = useMemo(() => trazo(desde.clone(), hasta.clone(), largo, ruta), [desde, hasta, largo, ruta])
  const curva = useMemo(() => new THREE.CatmullRomCurve3(base.map((p) => p.clone())), [base])

  /* La geometría la posee ESTE componente, no React.
     Con `geometry={...}` como prop o como hijo de JSX, React la vuelve a poner
     en cada render encima de la que acaba de calcular el cuadro anterior —y
     como esa ya se desechó, el cable desaparecía: se veía el primer cuadro y
     nada más. Un tubo no se puede deformar en su sitio, así que se rehace, y
     por eso hay que ser dueño de él. */
  useEffect(() => {
    const m = malla.current
    if (!m) return
    m.geometry?.dispose()
    m.geometry = new THREE.TubeGeometry(curva, 28, 0.007, 7, false)
    return () => m.geometry?.dispose()
  }, [curva])

  /* Se mece al pasar por encima, como si lo hubieran rozado. No es adorno: es
     lo que lo hace leer como objeto físico y no como una línea de diagrama, y
     de paso avisa que se puede tocar. Solo se mueven los puntos de en medio —
     los dos extremos están enchufados y ésos no se mueven nunca. */
  useFrame((_, dt) => {
    const m = malla.current
    if (!m) return
    fase.current += dt * (encima ? 3.4 : 0.8)
    const amp = (encima ? 0.03 : 0.005) * (ruta === 'piso' ? 1 : 0.4)
    const ps = curva.points
    for (let i = 1; i < ps.length - 1; i++) {
      const b = base[i]
      const t = fase.current + i * 0.9
      ps[i].set(b.x + Math.sin(t) * amp, b.y + Math.sin(t * 1.7) * amp * 0.6, b.z + Math.cos(t * 1.1) * amp)
    }
    const nueva = new THREE.TubeGeometry(curva, 28, encima ? 0.009 : 0.007, 7, false)
    m.geometry?.dispose()
    m.geometry = nueva
  })

  return (
    <mesh
      ref={malla}
      castShadow
      onPointerOver={
        interactivo
          ? (e) => {
              e.stopPropagation()
              setEncima(true)
            }
          : undefined
      }
      onPointerOut={interactivo ? () => setEncima(false) : undefined}
    >
      <meshStandardMaterial
        color={alcanza ? COLOR[ruta] : '#e0533f'}
        roughness={0.75}
        emissive={encima ? '#4d9fff' : '#000000'}
        emissiveIntensity={encima ? 0.55 : 0}
      />
    </mesh>
  )
}
