import { useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'

import { MUEBLES } from './catalogo'
import { ALTURA_PISO, kelvinAColor } from './luz'

/**
 * Todos los cuartos, en su sitio.
 *
 * Aquí se dibuja MENOS que en el plano de un cuarto, a propósito: sin muebles
 * detallados ni sombras, solo la caja del cuarto, la huella de lo que hay
 * dentro y dónde quedan las luces. Con quince cuartos abiertos a la vez, el
 * detalle no aporta y sí tira los cuadros por segundo.
 */

const matPiso = new THREE.MeshStandardMaterial({ color: '#4a423b', roughness: 0.95 })
const matPisoSel = new THREE.MeshStandardMaterial({ color: '#6b4a2c', roughness: 0.9 })

function CuartoPlano({ room, plano, seleccionado, onTomar }) {
  const [x, z] = plano.pos ?? [0, 0]
  const y = (plano.piso ?? 0) * ALTURA_PISO

  return (
    <group position={[x, y, z]} rotation={[0, plano.giro ?? 0, 0]}>
      {/* piso: es también lo que se toma para arrastrar el cuarto */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        material={seleccionado ? matPisoSel : matPiso}
        onPointerDown={(e) => {
          e.stopPropagation()
          onTomar(room.id)
        }}
      >
        <planeGeometry args={[plano.ancho, plano.largo]} />
      </mesh>

      {/* contorno de muros: una caja de alambre pesa nada y basta para leer
          la planta desde arriba */}
      <lineSegments position={[0, plano.alto / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(plano.ancho, plano.alto, plano.largo)]} />
        <lineBasicMaterial color={seleccionado ? '#ff9a4d' : '#5a5048'} />
      </lineSegments>

      <Text
        position={[0, 0.05, -plano.largo / 2 + 0.35]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.32}
        color={seleccionado ? '#ff9a4d' : '#9c9388'}
        anchorX="center"
      >
        {room.nombre}
      </Text>

      {plano.items.map((it) => {
        if (it.clase === 'mueble') {
          const def = MUEBLES[it.tipo]
          if (!def) return null
          return (
            <mesh key={it.id} position={[it.x, 0.02, it.z]} rotation={[-Math.PI / 2, 0, it.rot ?? 0]}>
              <planeGeometry args={[def.w, def.d]} />
              <meshBasicMaterial color="#6d6259" transparent opacity={0.55} />
            </mesh>
          )
        }

        if (it.clase === 'equipo' && it.params) {
          const color = kelvinAColor(it.params.k)
          return (
            <group key={it.id} position={[it.x, it.y ?? 2.2, it.z]}>
              <mesh>
                <sphereGeometry args={[0.09, 8, 6]} />
                <meshBasicMaterial color={color} />
              </mesh>
              {/* una luz por pieza, barata y sin sombras: en el conjunto
                  interesa dónde hay luz, no cómo cae */}
              <pointLight color={color} intensity={0.5} distance={4} decay={1.6} />
            </group>
          )
        }

        return (
          <mesh key={it.id} position={[it.x, it.y ?? 0.4, it.z]}>
            <boxGeometry args={[0.1, 0.14, 0.05]} />
            <meshBasicMaterial color={it.tipo === 'apagador' ? '#ffc48a' : '#7fa6ff'} />
          </mesh>
        )
      })}

      {plano.tramos?.map((t) => {
        const largo = Math.hypot(t.a[0] - t.de[0], t.a[1] - t.de[1], t.a[2] - t.de[2])
        if (largo < 0.01) return null
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(t.a[0] - t.de[0], t.a[1] - t.de[1], t.a[2] - t.de[2]).normalize(),
        )
        return (
          <mesh
            key={t.id}
            position={[(t.de[0] + t.a[0]) / 2, (t.de[1] + t.a[1]) / 2, (t.de[2] + t.a[2]) / 2]}
            quaternion={q}
          >
            <cylinderGeometry args={[0.015, 0.015, largo, 5]} />
            <meshBasicMaterial color="#ff6b6b" depthTest={false} transparent opacity={0.7} />
          </mesh>
        )
      })}
    </group>
  )
}

export default function EscenaConjunto({ cuartos, seleccion, onSeleccionar, onMover }) {
  const [arrastrando, setArrastrando] = useState(null)
  const orbita = useRef()

  /* Encuadre: la planta se arma donde caiga —el acomodo automático empieza en
     el origen y crece hacia un lado— así que la cámara apunta al centro real
     de lo que hay, no al origen. Si no, se abre mirando a un rincón vacío. */
  const caja = cuartos.reduce(
    (b2, c) => {
      const [x, z] = c.plano.pos ?? [0, 0]
      return {
        x0: Math.min(b2.x0, x - c.plano.ancho / 2),
        x1: Math.max(b2.x1, x + c.plano.ancho / 2),
        z0: Math.min(b2.z0, z - c.plano.largo / 2),
        z1: Math.max(b2.z1, z + c.plano.largo / 2),
      }
    },
    { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity },
  )

  const centro = Number.isFinite(caja.x0) ? [(caja.x0 + caja.x1) / 2, 0, (caja.z0 + caja.z1) / 2] : [0, 0, 0]
  const extension = Math.max(10, caja.x1 - caja.x0, caja.z1 - caja.z0)

  const tomar = (id) => {
    onSeleccionar(id)
    setArrastrando(id)
    if (orbita.current) orbita.current.enabled = false
  }

  const soltar = () => {
    setArrastrando(null)
    if (orbita.current) orbita.current.enabled = true
  }

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [centro[0] + extension, extension * 1.05, centro[2] + extension], fov: 40 }}
      onPointerMissed={() => onSeleccionar(null)}
      onPointerUp={soltar}
    >
      <color attach="background" args={['#0a0908']} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[10, 18, 8]} intensity={1.6} />

      {/* plano de arrastre: infinito para poder sacar un cuarto lejos */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centro[0], -0.02, centro[2]]}
        visible={false}
        onPointerMove={(e) => {
          if (!arrastrando) return
          e.stopPropagation()
          onMover(arrastrando, e.point.x, e.point.z)
        }}
        onPointerUp={soltar}
      >
        <planeGeometry args={[extension * 8, extension * 8]} />
      </mesh>

      <gridHelper args={[extension * 4, Math.round(extension * 2), '#2a2521', '#1d1a17']} position={[centro[0], -0.03, centro[2]]} />

      {cuartos.map(({ room, plano }) => (
        <CuartoPlano
          key={room.id}
          room={room}
          plano={plano}
          seleccionado={room.id === seleccion}
          onTomar={tomar}
        />
      ))}

      <OrbitControls
        ref={orbita}
        makeDefault
        target={centro}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={4}
        maxDistance={extension * 6}
      />
    </Canvas>
  )
}
