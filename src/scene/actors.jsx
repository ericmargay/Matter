import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { M, G } from './materials'
import { dim } from './home'
import { scrollState, useStore } from '../store/store'
import { arrivalProgress } from './chapters'

/**
 * Lo que se mueve solo en la escena: el coche que llega, el perro del balcón
 * y su alimentador.
 *
 * Todos leen su estado de fuera (scroll o store) y se animan en el render
 * loop. Ninguno guarda estado en React: un actor que re-renderiza el árbol
 * cada frame es la forma más fácil de tirar el framerate.
 */

/* ──────────────────────────── coche ───────────────────────────── */

/**
 * El coche entra manejando conforme haces scroll en el capítulo de llegada,
 * pero se frena antes del portón: solo pasa cuando el portón está abierto.
 * Esa pausa es la que hace que valga la pena pedirle al asistente que abra.
 */
export function Car({ lane = -5.6 }) {
  const group = useRef()
  const wheels = useRef([])
  const beamL = useRef()
  const beamR = useRef()
  const garageOpen = useStore((s) => s.garageOpen)

  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2c3646', roughness: 0.32, metalness: 0.65 }), [])
  const glass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0b1119', roughness: 0.08, metalness: 0.4 }),
    [],
  )
  const lamp = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#000', emissive: '#fff0d8', emissiveIntensity: 3, roughness: 1 }),
    [],
  )
  const tail = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ff3b30', emissiveIntensity: 2, roughness: 1 }),
    [],
  )

  const z = useRef(24)

  useFrame((_, delta) => {
    const t = arrivalProgress(scrollState.progress)

    // el scroll lo trae de la calle hasta la banqueta…
    const approach = THREE.MathUtils.lerp(24, 9.2, t)
    // …y de ahí adentro solo si el portón ya subió
    const target = garageOpen ? Math.min(approach, 2.4) : approach

    const prev = z.current
    z.current = THREE.MathUtils.damp(z.current, target, garageOpen ? 1.6 : 3.2, delta)

    if (!group.current) return
    group.current.position.z = z.current
    group.current.visible = t > 0.001

    // las llantas giran con la distancia recorrida, no con el reloj
    const rolled = (prev - z.current) / 0.33
    for (const w of wheels.current) if (w) w.rotation.x += rolled

    const on = t > 0.02 && z.current > 2.6 ? 1 : 0
    lamp.emissiveIntensity = 0.2 + on * 3.4
    if (beamL.current) beamL.current.intensity = on * 9
    if (beamR.current) beamR.current.intensity = on * 9
  })

  const wheel = (x, zz, i) => (
    <group key={i} position={[x, 0.33, zz]}>
      <mesh ref={(el) => (wheels.current[i] = el)} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.33, 0.33, 0.22, 18]} />
        <meshStandardMaterial color="#131315" roughness={0.85} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[x > 0 ? 0.06 : -0.06, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.13, 14]} />
        <meshStandardMaterial color="#8d949c" roughness={0.3} metalness={0.85} />
      </mesh>
    </group>
  )

  return (
    <group ref={group} position={[lane, 0, 24]}>
      {/* carrocería */}
      <RoundedBox args={[1.86, 0.62, 4.3]} radius={0.22} smoothness={3} position={[0, 0.66, 0]} material={body} castShadow />
      {/* cabina */}
      <RoundedBox args={[1.66, 0.6, 2.1]} radius={0.24} smoothness={3} position={[0, 1.16, -0.16]} material={body} castShadow />
      {/* cristales */}
      <mesh position={[0, 1.18, 0.9]} rotation={[0.42, 0, 0]} scale={[1.5, 0.62, 0.03]} geometry={G.box} material={glass} />
      <mesh position={[0, 1.18, -1.24]} rotation={[-0.38, 0, 0]} scale={[1.5, 0.56, 0.03]} geometry={G.box} material={glass} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.84, 1.18, -0.16]} scale={[0.03, 0.48, 1.7]} geometry={G.box} material={glass} />
      ))}

      {/* faros y calaveras */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.66, 0.72, 2.14]} scale={[0.38, 0.13, 0.05]} geometry={G.box} material={lamp} />
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.68, 0.78, -2.14]} scale={[0.34, 0.1, 0.05]} geometry={G.box} material={tail} />
      ))}

      {/* los conos de luz sobre el piso son lo que vende la llegada nocturna */}
      <spotLight
        ref={beamL}
        position={[-0.66, 0.72, 2.2]}
        target-position={[-0.9, 0, 9]}
        angle={0.42}
        penumbra={0.7}
        intensity={0}
        distance={16}
        decay={1.4}
        color="#fff0d8"
      />
      <spotLight
        ref={beamR}
        position={[0.66, 0.72, 2.2]}
        target-position={[0.9, 0, 9]}
        angle={0.42}
        penumbra={0.7}
        intensity={0}
        distance={16}
        decay={1.4}
        color="#fff0d8"
      />

      {[
        [-0.86, 1.42, 0],
        [0.86, 1.42, 1],
        [-0.86, -1.42, 2],
        [0.86, -1.42, 3],
      ].map(([x, zz, i]) => wheel(x, zz, i))}
    </group>
  )
}

/* ──────────────────────────── perro ───────────────────────────── */

/**
 * Nube, la perrita del balcón.
 *
 * Cuando el alimentador sirve, camina al plato, come unos segundos y se
 * regresa a su lugar. Es geometría simple con una máquina de estados corta;
 * lo que la hace leer como perro es el ritmo, no el detalle.
 */
export function Dog({ position, home = [0, 0], bowl = [1.2, 0] }) {
  const group = useRef()
  const head = useRef()
  const tail = useRef()
  const legs = useRef([])
  const fedAt = useStore((s) => s.fedAt)

  const fur = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b9a68f', roughness: 0.95 }), [])

  const pos = useRef(new THREE.Vector2(home[0], home[1]))
  const target = useRef(new THREE.Vector2(home[0], home[1]))

  useFrame(({ clock }, delta) => {
    const now = performance.now()
    const since = fedAt ? (now - fedAt) / 1000 : Infinity

    // va al plato los primeros ocho segundos después de servir
    const wantsBowl = since < 8
    target.current.set(wantsBowl ? bowl[0] : home[0], wantsBowl ? bowl[1] : home[1])

    const d = target.current.clone().sub(pos.current)
    const dist = d.length()
    const walking = dist > 0.06

    if (walking) {
      pos.current.addScaledVector(d.normalize(), Math.min(dist, delta * 0.9))
    }

    if (!group.current) return
    group.current.position.x = position[0] + pos.current.x
    group.current.position.z = position[2] + pos.current.y
    if (walking) {
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        Math.atan2(d.x, d.y),
        6,
        delta,
      )
    }

    const t = clock.elapsedTime

    // cola: contenta al comer, tranquila el resto del tiempo
    if (tail.current) tail.current.rotation.y = Math.sin(t * (wantsBowl ? 15 : 3.2)) * (wantsBowl ? 0.7 : 0.22)

    // cabeza: agachada en el plato, si no husmea despacio
    const eating = !walking && wantsBowl
    if (head.current) {
      head.current.rotation.x = THREE.MathUtils.damp(
        head.current.rotation.x,
        eating ? 0.85 + Math.sin(t * 9) * 0.08 : Math.sin(t * 1.1) * 0.06,
        5,
        delta,
      )
    }

    // patas: solo se mueven al caminar
    legs.current.forEach((leg, i) => {
      if (!leg) return
      leg.rotation.x = walking ? Math.sin(t * 9 + i * Math.PI * 0.5) * 0.5 : 0
    })
  })

  const leg = (x, z, i) => (
    <mesh
      key={i}
      ref={(el) => (legs.current[i] = el)}
      position={[x, 0.22, z]}
      material={fur}
      geometry={G.box}
      scale={[0.09, 0.24, 0.09]}
      castShadow
    />
  )

  return (
    <group ref={group} position={position}>
      {/* cuerpo */}
      <RoundedBox args={[0.28, 0.3, 0.62]} radius={0.13} smoothness={3} position={[0, 0.42, 0]} material={fur} castShadow />

      {/* cabeza */}
      <group ref={head} position={[0, 0.58, 0.32]}>
        <RoundedBox args={[0.26, 0.26, 0.28]} radius={0.11} smoothness={3} position={[0, 0, 0]} material={fur} castShadow />
        {/* hocico */}
        <RoundedBox args={[0.14, 0.12, 0.16]} radius={0.05} smoothness={2} position={[0, -0.05, 0.19]} material={fur} />
        <mesh position={[0, -0.03, 0.28]} scale={[0.05, 0.04, 0.03]} geometry={G.sphere}>
          <meshStandardMaterial color="#241d18" roughness={0.5} />
        </mesh>
        {/* orejas caídas */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.14, 0.03, -0.02]} rotation={[0, 0, s * 0.3]} scale={[0.06, 0.2, 0.11]} geometry={G.box}>
            <meshStandardMaterial color="#93826d" roughness={0.95} />
          </mesh>
        ))}
        {/* ojos */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.07, 0.04, 0.14]} scale={[0.035, 0.035, 0.02]} geometry={G.sphere}>
            <meshStandardMaterial color="#100d0a" roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* cola */}
      <group ref={tail} position={[0, 0.52, -0.3]}>
        <mesh position={[0, 0.06, -0.1]} rotation={[-0.7, 0, 0]} scale={[0.06, 0.24, 0.06]} geometry={G.box} material={fur} />
      </group>

      {[
        [-0.11, 0.22, 0],
        [0.11, 0.22, 1],
        [-0.11, -0.22, 2],
        [0.11, -0.22, 3],
      ].map(([x, z, i]) => leg(x, z, i))}
    </group>
  )
}

/* ────────────────────────── alimentador ───────────────────────── */

const PELLETS = 10

/** Tolva + plato. Al servir caen croquetas y el plato se llena. */
export function Feeder({ position, rotation, room = 'balcon' }) {
  const pellets = useRef()
  const statusMat = useMemo(() => M.bulbSoft.clone(), [])
  const foodRef = useRef()
  const fedAt = useStore((s) => s.fedAt)

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(
    () => Array.from({ length: PELLETS }, (_, i) => ({ x: (i % 5) * 0.02 - 0.04, z: ((i * 7) % 5) * 0.02 - 0.04, d: i * 0.045 })),
    [],
  )

  useFrame(() => {
    const since = fedAt ? (performance.now() - fedAt) / 1000 : Infinity
    const serving = since < 1.4

    statusMat.emissiveIntensity = 0.4 + (serving ? 2.6 : dim[room].level * 1.2)

    // el plato se va llenando y se queda servido un rato
    if (foodRef.current) {
      const fill = THREE.MathUtils.clamp((since - 0.3) / 1.2, 0, 1) * (since < 14 ? 1 : 0)
      foodRef.current.scale.set(0.19, Math.max(0.001, 0.035 * fill), 0.19)
      foodRef.current.visible = fill > 0.02
    }

    if (!pellets.current) return
    for (let i = 0; i < PELLETS; i++) {
      const s = seeds[i]
      const local = THREE.MathUtils.clamp(since - s.d, 0, 1)
      const falling = serving && local > 0 && local < 0.55
      if (falling) {
        // caída con gravedad, de la boquilla al plato
        const k = local / 0.55
        dummy.position.set(s.x, 0.46 - 0.42 * k * k, 0.16 + s.z)
        dummy.scale.setScalar(0.018)
      } else {
        dummy.scale.setScalar(0)
      }
      dummy.updateMatrix()
      pellets.current.setMatrixAt(i, dummy.matrix)
    }
    pellets.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group position={position} rotation={rotation}>
      {/* tolva */}
      <mesh position={[0, 0.42, 0]} scale={[0.24, 0.5, 0.24]} geometry={G.cyl} castShadow>
        <meshStandardMaterial color="#e4dfd6" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.69, 0]} scale={[0.26, 0.04, 0.26]} geometry={G.cyl}>
        <meshStandardMaterial color="#2a2724" roughness={0.6} />
      </mesh>
      {/* boquilla */}
      <mesh position={[0, 0.19, 0.1]} rotation={[0.5, 0, 0]} scale={[0.12, 0.14, 0.12]} geometry={G.cyl}>
        <meshStandardMaterial color="#cfc9bf" roughness={0.6} />
      </mesh>
      {/* LED de estado */}
      <mesh position={[0.13, 0.55, 0.19]} scale={[0.02, 0.02, 0.01]} geometry={G.box} material={statusMat} />

      {/* plato */}
      <mesh position={[0, 0.03, 0.3]} scale={[0.26, 0.06, 0.26]} geometry={G.cyl} castShadow>
        <meshStandardMaterial color="#3d4a5a" roughness={0.4} />
      </mesh>
      <mesh ref={foodRef} position={[0, 0.06, 0.3]} scale={[0.19, 0.001, 0.19]} geometry={G.cyl}>
        <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
      </mesh>

      <instancedMesh ref={pellets} args={[G.sphere, undefined, PELLETS]} frustumCulled={false}>
        <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
      </instancedMesh>
    </group>
  )
}
