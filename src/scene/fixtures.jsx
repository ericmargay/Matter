import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { M, G } from './materials'
import { dim } from './home'
import { B, C, Repeat } from './props'
import { useStore } from '../store/store'

/**
 * Piezas fijas de la casa: baños, escalera, barandales, portón.
 * A diferencia del mobiliario, casi todas están pegadas a la arquitectura
 * y varias reaccionan al centro de control.
 */

/* ─────────────────────────── baño ─────────────────────────── */

export function Toilet({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* tanque */}
      <RoundedBox args={[0.36, 0.42, 0.18]} radius={0.04} smoothness={2} position={[0, 0.55, -0.19]} castShadow>
        <meshStandardMaterial color="#e6e2da" roughness={0.35} />
      </RoundedBox>
      {/* taza */}
      <RoundedBox args={[0.36, 0.36, 0.52]} radius={0.13} smoothness={3} position={[0, 0.2, 0.05]} castShadow>
        <meshStandardMaterial color="#e6e2da" roughness={0.35} />
      </RoundedBox>
      {/* asiento */}
      <mesh position={[0, 0.395, 0.06]} scale={[0.34, 0.03, 0.46]} geometry={G.cyl}>
        <meshStandardMaterial color="#f2eee8" roughness={0.3} />
      </mesh>
    </group>
  )
}

export function Vanity({ position, rotation, w = 1.0 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.4, 0]} s={[w, 0.8, 0.48]} m={M.woodDark} />
      <B p={[0, 0.82, 0]} s={[w + 0.04, 0.05, 0.52]} m={M.ceramic} />
      {/* lavabo sobrepuesto */}
      <mesh position={[0, 0.9, 0]} scale={[0.36, 0.11, 0.3]} castShadow>
        <sphereGeometry args={[0.5, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f2eee8" roughness={0.25} />
      </mesh>
      {/* grifo */}
      <C p={[0, 0.98, -0.16]} s={[0.028, 0.22, 0.028]} m={M.metalWarm} shadow={false} />
      <B p={[0, 1.08, -0.09]} s={[0.028, 0.028, 0.16]} m={M.metalWarm} shadow={false} />
      {/* jaladeras */}
      <B p={[0, 0.6, 0.245]} s={[w * 0.5, 0.018, 0.018]} m={M.metalWarm} shadow={false} />
    </group>
  )
}

/** Espejo retroiluminado: el halo lo manda el dimmer del cuarto. */
export function Mirror({ position, rotation, w = 0.9, h = 0.8, room }) {
  const halo = useMemo(() => M.strip.clone(), [])

  useFrame(() => {
    const d = dim[room]
    halo.emissive.copy(d.color)
    halo.emissiveIntensity = 0.05 + d.level * 3.2
  })

  return (
    <group position={position} rotation={rotation}>
      {/* el halo va detrás y un poco más grande: así se ve el rebote */}
      <mesh position={[0, 0, -0.02]} scale={[w + 0.1, h + 0.1, 0.01]} geometry={G.box} material={halo} />
      <mesh position={[0, 0, 0]} scale={[w, h, 0.02]} geometry={G.box}>
        <meshStandardMaterial color="#1a2027" roughness={0.05} metalness={0.9} />
      </mesh>
    </group>
  )
}

export function Shower({ position, rotation, w = 1.1, d = 1.0 }) {
  return (
    <group position={position} rotation={rotation}>
      {/* plato */}
      <B p={[0, 0.04, 0]} s={[w, 0.08, d]} m={M.ceramic} />
      {/* mampara de vidrio */}
      <mesh position={[w / 2, 1.05, 0]} scale={[0.03, 2, d]} geometry={G.box}>
        <meshStandardMaterial color="#a8c4d4" roughness={0.02} metalness={0.1} transparent opacity={0.22} />
      </mesh>
      <mesh position={[0, 1.05, -d / 2]} scale={[w, 2, 0.03]} geometry={G.box}>
        <meshStandardMaterial color="#a8c4d4" roughness={0.02} metalness={0.1} transparent opacity={0.18} />
      </mesh>
      {/* regadera */}
      <C p={[-w * 0.25, 2.05, -d * 0.3]} s={[0.025, 0.3, 0.025]} m={M.metalWarm} shadow={false} />
      <mesh position={[-w * 0.25, 1.92, -d * 0.3]} scale={[0.19, 0.03, 0.19]} geometry={G.cyl} material={M.metalWarm} />
    </group>
  )
}

/** Extractor: gira cuando el centro de control lo enciende. */
export function Extractor({ position, rotation, room }) {
  const blades = useRef()

  useFrame((_, delta) => {
    if (blades.current) blades.current.rotation.y += delta * dim[room].fan * 14
  })

  return (
    <group position={position} rotation={rotation}>
      <mesh scale={[0.26, 0.26, 0.05]} geometry={G.cyl} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#c9c4bb" roughness={0.6} />
      </mesh>
      <group ref={blades} rotation={[Math.PI / 2, 0, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, (i / 4) * Math.PI * 2, 0.35]} position={[0, 0.015, 0]}>
            <boxGeometry args={[0.17, 0.006, 0.06]} />
            <meshStandardMaterial color="#2a2724" roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function TowelRail({ position, rotation, w = 0.6 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0, 0]} s={[w, 0.02, 0.02]} m={M.metalWarm} shadow={false} />
      {[-1, 1].map((s) => (
        <B key={s} p={[(s * w) / 2.6, -0.16, 0.02]} s={[w * 0.32, 0.34, 0.03]} m={M.fabricLight} shadow={false} />
      ))}
    </group>
  )
}

/* ────────────────────── escalera y barandal ────────────────── */

/** Escalera recta. Sube en +z desde el origen. */
export function Stairs({ position, rotation, steps = 16, rise = 0.194, run = 0.26, w = 1.2 }) {
  const partes = useMemo(() => {
    const huellas = []
    const peraltes = []
    const tiras = []
    for (let i = 0; i < steps; i++) {
      huellas.push({ p: [0, (i + 1) * rise - 0.02, i * run + run / 2], s: [w, 0.04, run] })
      peraltes.push({ p: [0, (i + 0.5) * rise, i * run], s: [w, rise, 0.03] })
      // tira LED bajo huellas alternas: se ve caro y cuesta poco
      if (i % 2 === 0) tiras.push({ p: [0, i * rise + 0.03, i * run + 0.01], s: [w * 0.8, 0.012, 0.012] })
    }
    return { huellas, peraltes, tiras }
  }, [steps, rise, run, w])

  return (
    <group position={position} rotation={rotation}>
      <Repeat items={partes.huellas} material={M.wood} />
      <Repeat items={partes.peraltes} material={M.woodDark} shadow={false} />
      <Repeat items={partes.tiras} material={M.strip} shadow={false} />
    </group>
  )
}

/** Barandal de balcón o cubo de escalera: postes + pasamanos. */
export function Railing({ position, rotation, length = 4, height = 1.02, gap = 0.14 }) {
  // un barandal de 7 m son ~50 balaustres; instanciados son una sola malla
  const balaustres = useMemo(() => {
    const n = Math.max(2, Math.round(length / gap))
    return Array.from({ length: n }, (_, i) => ({
      p: [-length / 2 + (length * (i + 0.5)) / n, height / 2, 0],
      s: [0.018, height, 0.018],
    }))
  }, [length, height, gap])

  return (
    <group position={position} rotation={rotation}>
      <Repeat items={balaustres} material={M.metal} shadow={false} />
      <mesh
        geometry={G.box}
        material={M.metalWarm}
        position={[0, height, 0]}
        scale={[length, 0.045, 0.06]}
        castShadow
      />
      <mesh geometry={G.box} material={M.metal} position={[0, 0.02, 0]} scale={[length, 0.04, 0.04]} />
    </group>
  )
}

/* ───────────────────────── aberturas ───────────────────────── */

/**
 * Portón seccional. Sube por paneles cuando el asistente lo abre.
 * El movimiento tarda ~3 s a propósito: un portón real no es instantáneo, y
 * ese tiempo es justo el que hace creíble la demo de voz.
 */
export function GarageDoor({ position, rotation, w = 3.4, h = 2.4 }) {
  const open = useStore((s) => s.garageOpen)
  const group = useRef()
  const t = useRef(0)
  const panels = 5

  useFrame((_, delta) => {
    const target = open ? 1 : 0
    t.current = THREE.MathUtils.damp(t.current, target, 1.1, delta)
    if (!group.current) return

    group.current.children.forEach((panel, i) => {
      // los de abajo se esconden primero, como un portón de verdad
      const local = THREE.MathUtils.clamp(t.current * panels - (panels - 1 - i), 0, 1)
      const ph = h / panels
      panel.position.y = ph * (i + 0.5) + local * (h - ph * (i + 0.5))
      panel.scale.y = Math.max(0.001, ph * (1 - local * 0.92))
    })
  })

  return (
    <group position={position} rotation={rotation}>
      {/* marco */}
      <B p={[0, h + 0.07, 0]} s={[w + 0.24, 0.14, 0.24]} m={M.woodDark} shadow={false} />
      {[-1, 1].map((s) => (
        <B key={s} p={[(s * (w + 0.12)) / 2, h / 2, 0]} s={[0.12, h, 0.24]} m={M.woodDark} shadow={false} />
      ))}

      <group ref={group}>
        {Array.from({ length: panels }, (_, i) => (
          <mesh key={i} geometry={G.box} material={M.metal} scale={[w, h / panels - 0.01, 0.07]} castShadow />
        ))}
      </group>
    </group>
  )
}

/** Corrediza de cristal entre recámara y balcón. */
export function SlidingDoor({ position, rotation, w = 2.2, h = 2.3, open = 0.45 }) {
  const leaf = w / 2
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, h + 0.05, 0]} s={[w + 0.1, 0.1, 0.14]} m={M.woodDark} shadow={false} />
      <B p={[0, 0.03, 0]} s={[w + 0.1, 0.06, 0.14]} m={M.woodDark} shadow={false} />
      {/* hoja fija */}
      <mesh position={[-leaf / 2, h / 2, 0.03]} scale={[leaf, h, 0.03]} geometry={G.box}>
        <meshStandardMaterial color="#0d1520" roughness={0.05} metalness={0.2} transparent opacity={0.32} />
      </mesh>
      {/* hoja que corre */}
      <mesh position={[leaf / 2 - leaf * open, h / 2, -0.03]} scale={[leaf, h, 0.03]} geometry={G.box}>
        <meshStandardMaterial color="#0d1520" roughness={0.05} metalness={0.2} transparent opacity={0.32} />
      </mesh>
      <B p={[leaf / 2 - leaf * open - leaf / 2 + 0.04, h / 2, -0.03]} s={[0.05, h, 0.06]} m={M.metalWarm} shadow={false} />
    </group>
  )
}
