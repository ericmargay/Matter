import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { G } from './materials'
import { useStore } from '../store/store'
import { ecosystems } from '../content/site'

/**
 * El hardware que hace de cerebro, físicamente puesto en la casa.
 *
 * Cambiar de ecosistema no es cambiar un color: con Apple aparece un Apple TV
 * bajo la tele y HomePods en cocina y recámara; con Alexa un Echo Show y un
 * Echo; con Home Assistant un servidor en el rack. Eso es lo que de verdad
 * se instala distinto, y verlo aparecer explica el punto sin un párrafo.
 */

/**
 * Dónde vive cada pieza. Coincide con el mobiliario de Rooms.jsx.
 * `floor` importa: las de planta alta tienen que dibujarse dentro del grupo
 * que se levanta y se oculta, o se quedan flotando cuando ese piso se va.
 */
const ANCHORS = {
  'mueble-tv': { floor: 0, position: [3.6, 0.45, 1.02], rotation: [0, 0, 0] },
  'barra-cocina': { floor: 0, position: [2.7, 0.96, -4.45], rotation: [0, 0, 0] },
  /* El panel va en la partición del recibidor, no en el muro de fachada:
     ese se desvanece en casi todos los ángulos y una tableta flotando en
     el aire arruina la ilusión. */
  'muro-entrada': { floor: 0, position: [-3.11, 1.45, 3.2], rotation: [0, Math.PI / 2, 0] },

  buro: { floor: 1, position: [3.15, 3.59, -4.12], rotation: [0, 0, 0] },
  repisa: { floor: 1, position: [-7.78, 4.27, -2.4], rotation: [0, Math.PI / 2, 0] },
}

/** Aparecen con un pequeño rebote al cambiar de ecosistema. */
function Pop({ children, delay = 0 }) {
  const ref = useRef()
  const t = useRef(-delay)

  useFrame((_, dt) => {
    t.current += dt
    const p = THREE.MathUtils.clamp(t.current / 0.45, 0, 1)
    // ease-out-back: sobrepasa un poco y regresa
    const e = p >= 1 ? 1 : 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2)
    ref.current.scale.setScalar(Math.max(0, e))
    ref.current.visible = p > 0
  })

  return <group ref={ref}>{children}</group>
}

/* ── formas ──────────────────────────────────────────────────────
   Ninguna lleva luz real: brillan por material emisivo y el bloom hace
   el resto. Cinco aparatos × una pointLight cada uno encarecía el shader
   de toda la escena para iluminar diez centímetros. */

/** Apple TV: caja negra bajita con un LED tímido al frente. */
function Box({ tone }) {
  return (
    <group>
      <RoundedBox args={[0.13, 0.035, 0.13]} radius={0.012} smoothness={2} position={[0, 0.018, 0]} castShadow>
        <meshStandardMaterial color="#141416" roughness={0.35} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.018, 0.066]} scale={[0.008, 0.008, 0.004]} geometry={G.box}>
        <meshStandardMaterial color="#000" emissive={tone} emissiveIntensity={2} roughness={1} />
      </mesh>
    </group>
  )
}

/** HomePod mini / Echo: esfera achatada de tela con aro de luz arriba. */
function Orb({ tone }) {
  return (
    <group>
      <mesh position={[0, 0.048, 0]} scale={[0.098, 0.082, 0.098]} geometry={G.sphere} castShadow>
        <meshStandardMaterial color="#2a2724" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.088, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.028, 0.045, 24]} />
        <meshStandardMaterial color="#000" emissive={tone} emissiveIntensity={1.8} roughness={1} side={2} />
      </mesh>
    </group>
  )
}

/** Nest Hub / Echo Show: pantalla inclinada sobre base de tela. */
function Screen({ tone }) {
  return (
    <group>
      <mesh position={[0, 0.035, -0.02]} scale={[0.17, 0.07, 0.09]} geometry={G.cyl} castShadow>
        <meshStandardMaterial color="#33302c" roughness={0.95} />
      </mesh>
      <group position={[0, 0.135, 0.012]} rotation={[-0.16, 0, 0]}>
        <RoundedBox args={[0.21, 0.145, 0.014]} radius={0.008} smoothness={2} castShadow>
          <meshStandardMaterial color="#0d0d0f" roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.009]} scale={[0.185, 0.12, 1]} geometry={G.plane}>
          <meshStandardMaterial color="#000" emissive={tone} emissiveIntensity={0.85} roughness={1} />
        </mesh>
      </group>
    </group>
  )
}

/** Nest Mini / Voice PE: disco bajo con aro de luz. */
function Puck({ tone }) {
  return (
    <group>
      <mesh position={[0, 0.022, 0]} scale={[0.1, 0.044, 0.1]} geometry={G.cyl} castShadow>
        <meshStandardMaterial color="#2f2c29" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.022, 0.04, 24]} />
        <meshStandardMaterial color="#000" emissive={tone} emissiveIntensity={1.6} roughness={1} side={2} />
      </mesh>
    </group>
  )
}

/** iPad / Echo Hub / tableta: pantalla montada en muro. */
function Panel({ tone }) {
  return (
    <group>
      <RoundedBox args={[0.28, 0.2, 0.016]} radius={0.012} smoothness={2} castShadow>
        <meshStandardMaterial color="#111113" roughness={0.3} metalness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0, 0.01]} scale={[0.25, 0.17, 1]} geometry={G.plane}>
        <meshStandardMaterial color="#000" emissive={tone} emissiveIntensity={0.9} roughness={1} />
      </mesh>
    </group>
  )
}

/** Puente Zigbee: cajita blanca con antena. */
function Bridge({ tone }) {
  return (
    <group>
      <RoundedBox args={[0.11, 0.03, 0.08]} radius={0.008} smoothness={2} position={[0, 0.015, 0]} castShadow>
        <meshStandardMaterial color="#d8d3c9" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0.045, 0.055, -0.02]} scale={[0.006, 0.075, 0.006]} geometry={G.cyl}>
        <meshStandardMaterial color="#1a1a1c" roughness={0.5} />
      </mesh>
      <mesh position={[-0.03, 0.031, 0.03]} scale={[0.008, 0.002, 0.008]} geometry={G.box}>
        <meshStandardMaterial color="#000" emissive={tone} emissiveIntensity={2.4} roughness={1} />
      </mesh>
    </group>
  )
}

/** Home Assistant Green: servidorcito con LEDs de actividad. */
function Server({ tone }) {
  return (
    <group>
      <RoundedBox args={[0.13, 0.06, 0.11]} radius={0.008} smoothness={2} position={[0, 0.03, 0]} castShadow>
        <meshStandardMaterial color="#17201a" roughness={0.55} metalness={0.2} />
      </RoundedBox>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.03 + i * 0.03, 0.03, 0.056]} scale={[0.007, 0.007, 0.003]} geometry={G.box}>
          <meshStandardMaterial
            color="#000"
            emissive={i === 1 ? tone : '#7fa6ff'}
            emissiveIntensity={2}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  )
}

const SHAPES = { box: Box, orb: Orb, screen: Screen, puck: Puck, panel: Panel, bridge: Bridge, server: Server }

export default function Hubs({ floor = 0 }) {
  const id = useStore((s) => s.ecosystem)
  const eco = useMemo(() => ecosystems.find((e) => e.id === id) ?? ecosystems[0], [id])

  // en la repisa caben dos piezas (servidor + dongle): las separamos
  const used = {}

  return (
    <group key={`${eco.id}-${floor}`}>
      {eco.kit.map((piece, i) => {
        const Shape = SHAPES[piece.shape]
        const anchor = ANCHORS[piece.at]
        if (!Shape || !anchor || anchor.floor !== floor) return null

        const n = (used[piece.at] = (used[piece.at] ?? 0) + 1)
        const offset = (n - 1) * 0.19

        return (
          <group
            key={`${piece.name}-${i}`}
            position={[anchor.position[0], anchor.position[1], anchor.position[2]]}
            rotation={anchor.rotation}
          >
            <group position={[offset, 0, 0]}>
              <Pop delay={i * 0.06}>
                <Shape tone={eco.tone} />
              </Pop>
            </group>
          </group>
        )
      })}
    </group>
  )
}
