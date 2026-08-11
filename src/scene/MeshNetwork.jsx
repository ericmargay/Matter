import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DEVICES, buildEdges, ROUTER_KINDS } from './devices'
import { scrollState } from '../store/store'

const PULSE_COUNT = 14

/**
 * La malla Thread sobre la casa.
 *
 * Todas las aristas viven en un solo lineSegments: una llamada de dibujo
 * y una sola opacidad que animar. Los paquetes que viajan por los enlaces
 * son un InstancedMesh, así que también son una llamada.
 */
export default function MeshNetwork() {
  const group = useRef()
  const pulses = useRef()

  const { edges, routers, leaves, geo, mats } = useMemo(() => {
    const nodes = DEVICES
    const edges = buildEdges(nodes)

    const positions = new Float32Array(edges.length * 6)
    edges.forEach(([a, b], i) => {
      positions.set(a.pos, i * 6)
      positions.set(b.pos, i * 6 + 3)
    })
    const lines = new THREE.BufferGeometry()
    lines.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    return {
      edges,
      routers: nodes.filter((n) => ROUTER_KINDS.has(n.kind)),
      leaves: nodes.filter((n) => !ROUTER_KINDS.has(n.kind)),
      geo: {
        lines,
        router: new THREE.SphereGeometry(0.075, 12, 10),
        leaf: new THREE.SphereGeometry(0.05, 10, 8),
        pulse: new THREE.SphereGeometry(1, 8, 6),
      },
      mats: {
        line: new THREE.LineBasicMaterial({
          color: '#7fa6ff',
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
        router: new THREE.MeshStandardMaterial({
          color: '#000000',
          emissive: '#9dbaff',
          emissiveIntensity: 2.4,
          roughness: 1,
          transparent: true,
          opacity: 0,
        }),
        leaf: new THREE.MeshStandardMaterial({
          color: '#000000',
          emissive: '#ffc48a',
          emissiveIntensity: 1.6,
          roughness: 1,
          transparent: true,
          opacity: 0,
        }),
        pulse: new THREE.MeshBasicMaterial({
          color: '#dce8ff',
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
        }),
      },
    }
  }, [])

  // a qué enlace pertenece cada paquete y con qué desfase arranca
  const tracks = useMemo(
    () =>
      Array.from({ length: PULSE_COUNT }, (_, i) => ({
        edge: edges[(i * 7) % edges.length],
        offset: (i * 0.137) % 1,
        speed: 0.22 + ((i * 0.31) % 1) * 0.3,
      })),
    [edges],
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const va = useMemo(() => new THREE.Vector3(), [])
  const vb = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    const net = scrollState.net
    const visible = net > 0.01
    group.current.visible = visible
    if (!visible) return

    const t = clock.elapsedTime

    mats.line.opacity = net * 0.5
    mats.router.opacity = net
    mats.leaf.opacity = net
    mats.pulse.opacity = net * 0.95

    // los nodos laten desfasados: se siente tráfico, no un diagrama
    mats.router.emissiveIntensity = 2.4 + Math.sin(t * 1.7) * 0.5
    mats.leaf.emissiveIntensity = 1.6 + Math.sin(t * 2.3 + 1) * 0.4

    for (let i = 0; i < tracks.length; i++) {
      const { edge, offset, speed } = tracks[i]
      const k = (offset + t * speed) % 1
      va.fromArray(edge[0].pos)
      vb.fromArray(edge[1].pos)
      dummy.position.lerpVectors(va, vb, k)
      // se encoge en las puntas: da la ilusión de que el paquete entra al nodo
      dummy.scale.setScalar(Math.sin(k * Math.PI) * 0.075 * net)
      dummy.updateMatrix()
      pulses.current.setMatrixAt(i, dummy.matrix)
    }
    pulses.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={geo.lines} material={mats.line} />

      {/* enrutadores: enchufados a corriente, más brillantes */}
      {routers.map((n) => (
        <mesh key={n.id} position={n.pos} geometry={geo.router} material={mats.router} />
      ))}

      {/* de pila: más tenues, porque no enrutan nada */}
      {leaves.map((n) => (
        <mesh key={n.id} position={n.pos} geometry={geo.leaf} material={mats.leaf} />
      ))}

      <instancedMesh
        ref={pulses}
        args={[geo.pulse, mats.pulse, PULSE_COUNT]}
        frustumCulled={false}
      />
    </group>
  )
}
