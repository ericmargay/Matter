import { M } from '../../../scene/materials'
import { B, C } from '../../../scene/props'

/**
 * Lo que hace que un cuarto se vea habitado.
 *
 * El mobiliario del recorrido resuelve lo grande —cama, sofá, barra— pero un
 * plano que solo tiene eso se ve a maqueta de inmobiliaria. Lo que lo vuelve
 * la casa de alguien son las cosas chicas: los libros de canto en el librero,
 * la maceta del rincón, el cuadro que no está derecho, el gato dormido.
 *
 * Todo es primitiva —caja y cilindro— igual que el resto de la escena. La
 * gracia no está en el detalle sino en la silueta y en el color: a la
 * distancia a la que se mira un plano isométrico, eso es lo único que llega.
 */

/* ── mesas ─────────────────────────────────────────────────────── */

export function MesaRedonda({ position, rotation, d = 1.1, h = 0.75 }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, h, 0]} s={[d, 0.05, d]} m={M.wood} />
      <C p={[0, h / 2, 0]} s={[0.09, h, 0.09]} m={M.metal} />
      <C p={[0, 0.02, 0]} s={[d * 0.45, 0.04, d * 0.45]} m={M.metal} />
    </group>
  )
}

export function MesaLateral({ position, rotation, w = 0.5, h = 0.55 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, h, 0]} s={[w, 0.04, w]} m={M.wood} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <C key={i} p={[(sx * w) / 2.6, h / 2, (sz * w) / 2.6]} s={[0.04, h, 0.04]} m={M.woodDark ?? M.wood} />
      ))}
    </group>
  )
}

export function MesaTrabajo({ position, rotation, w = 1.4, d = 0.6, h = 0.74 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, h, 0]} s={[w, 0.05, d]} m={M.wood} />
      <B p={[-w / 2 + 0.05, h / 2, 0]} s={[0.06, h, d * 0.9]} m={M.metal} />
      <B p={[w / 2 - 0.05, h / 2, 0]} s={[0.06, h, d * 0.9]} m={M.metal} />
    </group>
  )
}

/* ── librero con libros de verdad ──────────────────────────────── */

const LOMOS = ['#8c4a3a', '#3f5d70', '#7a6a3e', '#5c4a6b', '#3f6b52', '#a3714a']

/**
 * Los libros son cajas de anchos y alturas distintos, con un hueco de vez en
 * cuando. Un librero con todos los lomos iguales se ve a textura repetida; la
 * irregularidad es lo que lo hace leer como librero.
 */
function Libros({ ancho, y, semilla = 0 }) {
  const libros = []
  let x = -ancho / 2 + 0.04
  let i = 0
  while (x < ancho / 2 - 0.06) {
    const w = 0.028 + ((semilla + i * 7) % 5) * 0.008
    const h = 0.2 + ((semilla + i * 11) % 6) * 0.022
    // un hueco cada tantos: nadie tiene el librero lleno hasta el tope
    if ((semilla + i * 13) % 9 !== 0) {
      libros.push(
        <mesh key={i} position={[x + w / 2, y + h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, 0.16]} />
          <meshStandardMaterial color={LOMOS[(semilla + i) % LOMOS.length]} roughness={0.85} />
        </mesh>,
      )
    }
    x += w + 0.006
    i++
  }
  return <>{libros}</>
}

export function LibreroLleno({ position, rotation, w = 1.1, niveles = 4 }) {
  const alto = 0.42 * niveles
  return (
    <group position={position} rotation={rotation}>
      <B p={[-w / 2, alto / 2, 0]} s={[0.04, alto, 0.3]} m={M.wood} />
      <B p={[w / 2, alto / 2, 0]} s={[0.04, alto, 0.3]} m={M.wood} />
      {Array.from({ length: niveles + 1 }, (_, n) => (
        <B key={n} p={[0, n * 0.42, 0]} s={[w, 0.035, 0.3]} m={M.wood} />
      ))}
      {Array.from({ length: niveles }, (_, n) => (
        <Libros key={n} ancho={w - 0.1} y={n * 0.42 + 0.02} semilla={n * 3 + 1} />
      ))}
    </group>
  )
}

/* ── cuadros ───────────────────────────────────────────────────── */

const LIENZOS = ['#6d7f8c', '#8c7a63', '#5f6b57', '#7d5f63', '#4f5a6b']

export function Cuadro({ position, rotation, w = 0.55, h = 0.75, tono = 0 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0, 0]} s={[w, h, 0.03]} m={M.wood} />
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[w - 0.07, h - 0.07]} />
        <meshStandardMaterial color={LIENZOS[tono % LIENZOS.length]} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Tres cuadros de tamaños distintos, como se cuelgan de verdad. */
export function MuroCuadros({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <Cuadro position={[-0.45, 0.1, 0]} w={0.5} h={0.66} tono={0} />
      <Cuadro position={[0.1, 0.22, 0]} w={0.38} h={0.48} tono={2} />
      <Cuadro position={[0.12, -0.28, 0]} w={0.38} h={0.3} tono={3} />
    </group>
  )
}

/* ── plantas ───────────────────────────────────────────────────── */

export function PlantaAlta({ position, rotation, h = 1.35 }) {
  const hojas = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2
    const inc = 0.55 + (i % 3) * 0.18
    return (
      <mesh
        key={i}
        position={[Math.sin(a) * 0.14, h * 0.62 + (i % 4) * 0.12, Math.cos(a) * 0.14]}
        rotation={[inc, a, 0]}
        castShadow
      >
        <boxGeometry args={[0.1, 0.5, 0.02]} />
        <meshStandardMaterial color="#3f6b4a" roughness={0.85} />
      </mesh>
    )
  })
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.2, 0]} s={[0.3, 0.4, 0.3]} m={M.ceramic ?? M.plaster ?? M.wood} />
      {hojas}
    </group>
  )
}

export function MacetaChica({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.08, 0]} s={[0.16, 0.16, 0.16]} m={M.ceramic ?? M.wood} />
      <mesh position={[0, 0.24, 0]} castShadow>
        <icosahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial color="#4a7a55" roughness={0.9} />
      </mesh>
    </group>
  )
}

/* ── la mascota ────────────────────────────────────────────────────
   El detalle que hace que el cliente sonría cuando ve su plano. Cuesta seis
   primitivas y es lo que separa un plano técnico de la casa de alguien. */

export function GatoDormido({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {/* el cuerpo hecho bola */}
      <mesh position={[0, 0.11, 0]} scale={[1, 0.72, 1.25]} castShadow>
        <sphereGeometry args={[0.16, 14, 10]} />
        <meshStandardMaterial color="#6b5a4a" roughness={0.95} />
      </mesh>
      {/* la cabeza metida contra el cuerpo */}
      <mesh position={[0, 0.13, 0.16]} castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color="#7a6857" roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.055, 0.21, 0.17]} rotation={[0, 0, s * 0.3]}>
          <coneGeometry args={[0.035, 0.07, 4]} />
          <meshStandardMaterial color="#5c4c3e" roughness={0.95} />
        </mesh>
      ))}
      {/* la cola alrededor */}
      <mesh position={[0.13, 0.08, -0.1]} rotation={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.035, 0.26, 4, 8]} />
        <meshStandardMaterial color="#6b5a4a" roughness={0.95} />
      </mesh>
    </group>
  )
}

export function PerroDormido({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.14, 0]} scale={[1, 0.8, 1.5]} castShadow>
        <sphereGeometry args={[0.22, 14, 10]} />
        <meshStandardMaterial color="#8a7256" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.13, 0.28]} castShadow>
        <sphereGeometry args={[0.14, 12, 10]} />
        <meshStandardMaterial color="#96805f" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.09, 0.4]} castShadow>
        <boxGeometry args={[0.11, 0.08, 0.12]} />
        <meshStandardMaterial color="#7a6449" roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, 0.16, 0.27]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.06, 0.14, 0.03]} />
          <meshStandardMaterial color="#6b5840" roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

/** La cama del animal, para que no duerma en el piso pelón. */
export function CamaMascota({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.06, 0]} s={[0.62, 0.12, 0.62]} m={M.fabricLight ?? M.wood} />
      <C p={[0, 0.09, 0]} s={[0.44, 0.06, 0.44]} m={M.fabric ?? M.wood} />
    </group>
  )
}
