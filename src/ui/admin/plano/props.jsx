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

/* ── sala y estar ──────────────────────────────────────────────── */

export function Sillon({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.2, 0]} s={[0.95, 0.4, 0.9]} m={M.fabric} />
      <B p={[0, 0.46, 0]} s={[0.82, 0.16, 0.78]} m={M.fabricLight} />
      <B p={[0, 0.55, -0.4]} s={[0.95, 0.7, 0.14]} m={M.fabric} />
      {[-1, 1].map((s) => (
        <B key={s} p={[s * 0.45, 0.42, 0]} s={[0.12, 0.44, 0.9]} m={M.fabric} />
      ))}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => <C key={`${x}${z}`} p={[x * 0.36, 0.05, z * 0.34]} s={[0.06, 0.1, 0.06]} m={M.woodDark} />),
      )}
    </group>
  )
}

export function Puf({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.19, 0]} s={[0.62, 0.38, 0.62]} m={M.fabric} />
      <C p={[0, 0.38, 0]} s={[0.5, 0.06, 0.5]} m={M.fabricLight} />
    </group>
  )
}

/** Lámpara de pie. El cuerpo nada más — la luz la pone el dispositivo. */
export function LamparaPie({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.02, 0]} s={[0.32, 0.04, 0.32]} m={M.metal} />
      <C p={[0, 0.75, 0]} s={[0.035, 1.5, 0.035]} m={M.metal} />
      <mesh position={[0, 1.62, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.26, 0.3, 18, 1, true]} />
        <meshStandardMaterial color="#d8c49a" roughness={0.9} side={2} />
      </mesh>
    </group>
  )
}

export function Chimenea({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.55, 0]} s={[1.5, 1.1, 0.35]} m={M.ceramic} />
      <B p={[0, 0.42, 0.04]} s={[0.9, 0.55, 0.3]} m={M.black} />
      <B p={[0, 1.14, 0]} s={[1.7, 0.09, 0.45]} m={M.wood} />
    </group>
  )
}

export function RelojPared({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0, 0]} s={[0.34, 0.05, 0.34]} r={[Math.PI / 2, 0, 0]} m={M.woodDark} />
      <C p={[0, 0, 0.03]} s={[0.29, 0.02, 0.29]} r={[Math.PI / 2, 0, 0]} m={M.white} />
      <B p={[0, 0.06, 0.05]} s={[0.02, 0.11, 0.01]} m={M.black} />
      <B p={[0.05, 0, 0.05]} s={[0.09, 0.02, 0.01]} m={M.black} />
    </group>
  )
}

export function Revistero({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.14, 0]} s={[0.42, 0.28, 0.3]} m={M.wood} />
      {[0, 1, 2].map((i) => (
        <B key={i} p={[(i - 1) * 0.07, 0.32, 0]} s={[0.05, 0.24, 0.26]} r={[0.12, 0, 0]} m={M.fabricLight} />
      ))}
    </group>
  )
}

/* ── comedor y cocina ──────────────────────────────────────────── */

export function SillaComedor({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.45, 0]} s={[0.44, 0.05, 0.44]} m={M.wood} />
      <B p={[0, 0.72, -0.19]} s={[0.42, 0.5, 0.05]} m={M.wood} />
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <C key={`${x}${z}`} p={[x * 0.18, 0.22, z * 0.18]} s={[0.04, 0.45, 0.04]} m={M.woodDark} />
        )),
      )}
    </group>
  )
}

export function BancoBarra({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.66, 0]} s={[0.34, 0.07, 0.34]} m={M.fabric} />
      <C p={[0, 0.33, 0]} s={[0.05, 0.66, 0.05]} m={M.metal} />
      <C p={[0, 0.22, 0]} s={[0.28, 0.03, 0.28]} m={M.metal} />
      <C p={[0, 0.02, 0]} s={[0.36, 0.04, 0.36]} m={M.metal} />
    </group>
  )
}

export function Alacena({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0, 0]} s={[1.8, 0.7, 0.35]} m={M.wood} />
      {[-1, 1].map((s) => (
        <B key={s} p={[s * 0.45, 0, 0.18]} s={[0.86, 0.62, 0.02]} m={M.woodDark} />
      ))}
    </group>
  )
}

export function Campana({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.16, 0.42, 0.34, 4]} />
        <meshStandardMaterial color="#9aa0a6" roughness={0.3} metalness={0.7} />
      </mesh>
      <C p={[0, 0.42, 0]} s={[0.2, 0.5, 0.2]} m={M.metal} />
    </group>
  )
}

export function Estufa({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.44, 0]} s={[0.76, 0.88, 0.62]} m={M.white} />
      <B p={[0, 0.9, 0]} s={[0.78, 0.04, 0.64]} m={M.black} />
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <C key={`${x}${z}`} p={[x * 0.18, 0.93, z * 0.15]} s={[0.16, 0.02, 0.16]} m={M.metal} />
        )),
      )}
      <B p={[0, 0.46, 0.32]} s={[0.6, 0.4, 0.02]} m={M.black} />
    </group>
  )
}

export function Microondas({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.15, 0]} s={[0.52, 0.3, 0.38]} m={M.white} />
      <B p={[-0.06, 0.16, 0.2]} s={[0.32, 0.22, 0.02]} m={M.black} />
    </group>
  )
}

export function Lavavajillas({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.42, 0]} s={[0.6, 0.84, 0.6]} m={M.white} />
      <B p={[0, 0.78, 0.31]} s={[0.5, 0.05, 0.02]} m={M.metal} />
    </group>
  )
}

/* ── recámara ──────────────────────────────────────────────────── */

export function Comoda({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.4, 0]} s={[1.1, 0.8, 0.45]} m={M.wood} />
      {[0, 1, 2].map((i) => (
        <B key={i} p={[0, 0.16 + i * 0.24, 0.23]} s={[0.96, 0.18, 0.02]} m={M.woodDark} />
      ))}
    </group>
  )
}

export function EspejoPie({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.85, 0]} s={[0.55, 1.6, 0.05]} m={M.woodDark} />
      <B p={[0, 0.85, 0.03]} s={[0.46, 1.5, 0.01]} m={M.glass} />
      <B p={[0, 0.03, 0.12]} s={[0.4, 0.05, 0.28]} m={M.woodDark} />
    </group>
  )
}

export function BancaPie({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.42, 0]} s={[1.2, 0.16, 0.4]} m={M.fabricLight} />
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <C key={`${x}${z}`} p={[x * 0.52, 0.17, z * 0.15]} s={[0.05, 0.34, 0.05]} m={M.woodDark} />
        )),
      )}
    </group>
  )
}

export function Cuna({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.35, 0]} s={[1.25, 0.14, 0.68]} m={M.fabricLight} />
      {[-1, 1].map((z) => (
        <B key={z} p={[0, 0.5, z * 0.33]} s={[1.25, 0.5, 0.04]} m={M.wood} />
      ))}
      {[-1, 1].map((x) => (
        <B key={x} p={[x * 0.62, 0.5, 0]} s={[0.04, 0.5, 0.68]} m={M.wood} />
      ))}
    </group>
  )
}

/* ── baño y zotehuela ──────────────────────────────────────────────
   La zotehuela no la trae ningún catálogo de fuera y es donde vive la mitad
   de la instalación de una casa de la Ciudad de México: la lavadora, el
   boiler, el lavadero y el tendedero. Sin estas piezas ese espacio se
   levantaba vacío. */

export function Tina({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.28, 0]} s={[1.7, 0.56, 0.78]} m={M.white} />
      <B p={[0, 0.44, 0]} s={[1.55, 0.3, 0.64]} m={M.ceramic} />
      <C p={[-0.75, 0.68, 0]} s={[0.05, 0.24, 0.05]} m={M.metalWarm} />
    </group>
  )
}

export function Lavadora({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.43, 0]} s={[0.64, 0.86, 0.64]} m={M.white} />
      <C p={[0, 0.48, 0.32]} s={[0.34, 0.03, 0.34]} r={[Math.PI / 2, 0, 0]} m={M.metal} />
      <C p={[0, 0.48, 0.34]} s={[0.26, 0.02, 0.26]} r={[Math.PI / 2, 0, 0]} m={M.glass} />
      <B p={[0, 0.82, 0.32]} s={[0.5, 0.09, 0.02]} m={M.black} />
    </group>
  )
}

export function Secadora({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.43, 0]} s={[0.64, 0.86, 0.64]} m={M.ceramic} />
      <C p={[0, 0.45, 0.32]} s={[0.38, 0.03, 0.38]} r={[Math.PI / 2, 0, 0]} m={M.metal} />
      <B p={[0, 0.82, 0.32]} s={[0.5, 0.09, 0.02]} m={M.black} />
    </group>
  )
}

/** Boiler de paso. Va en muro y es de lo primero que se pregunta si es de gas. */
export function Boiler({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0, 0]} s={[0.42, 0.66, 0.25]} m={M.ceramic} />
      <C p={[-0.12, -0.42, 0]} s={[0.05, 0.2, 0.05]} m={M.metal} />
      <C p={[0.12, -0.42, 0]} s={[0.05, 0.2, 0.05]} m={M.metal} />
      <C p={[0, 0.42, 0]} s={[0.12, 0.2, 0.12]} m={M.metal} />
    </group>
  )
}

export function Lavadero({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.42, 0]} s={[0.9, 0.84, 0.6]} m={M.ceramic} />
      <B p={[0, 0.86, 0]} s={[0.94, 0.06, 0.64]} m={M.white} />
      <B p={[-0.2, 0.87, 0]} s={[0.42, 0.06, 0.44]} m={M.ceramic} />
      <C p={[0.34, 1.0, -0.2]} s={[0.04, 0.26, 0.04]} m={M.metalWarm} />
    </group>
  )
}

export function Tendedero({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {[-1, 1].map((x) => (
        <C key={x} p={[x * 0.7, 0.55, 0]} s={[0.04, 1.1, 0.04]} m={M.metal} />
      ))}
      {[0, 1, 2].map((i) => (
        <B key={i} p={[0, 0.95 - i * 0.18, 0]} s={[1.4, 0.012, 0.012]} m={M.metal} shadow={false} />
      ))}
    </group>
  )
}

export function Tinaco({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.5, 0]} s={[0.9, 1.0, 0.9]} m={M.black} />
      <C p={[0, 1.03, 0]} s={[0.4, 0.08, 0.4]} m={M.ceramic} />
    </group>
  )
}

/* ── oficina ───────────────────────────────────────────────────── */

export function Archivero({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.34, 0]} s={[0.45, 0.68, 0.55]} m={M.metal} />
      {[0, 1].map((i) => (
        <B key={i} p={[0, 0.18 + i * 0.32, 0.28]} s={[0.36, 0.22, 0.02]} m={M.ceramic} />
      ))}
    </group>
  )
}

export function Pizarron({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0, 0]} s={[1.8, 1.05, 0.05]} m={M.woodDark} />
      <B p={[0, 0, 0.03]} s={[1.7, 0.95, 0.01]} m={M.white} />
    </group>
  )
}

export function SillaVisita({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.44, 0]} s={[0.46, 0.07, 0.46]} m={M.fabric} />
      <B p={[0, 0.7, -0.2]} s={[0.44, 0.46, 0.07]} m={M.fabric} />
      {[-1, 1].map((x) => (
        <B key={x} p={[x * 0.21, 0.22, 0]} s={[0.03, 0.44, 0.42]} m={M.metal} />
      ))}
    </group>
  )
}

export function MacetaGrande({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.3, 0]} s={[0.5, 0.6, 0.5]} m={M.ceramic} />
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.sin(a) * 0.16, 0.95, Math.cos(a) * 0.16]} rotation={[0.4, a, 0]} castShadow>
            <boxGeometry args={[0.16, 0.7, 0.03]} />
            <meshStandardMaterial color="#3f6b4a" roughness={0.85} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ── arte ──────────────────────────────────────────────────────────
   Un muro sin nada encima se lee como obra negra. Cinco piezas con formatos
   distintos alcanzan para que ningún cuarto se vea igual al de junto. */

const ARTE = {
  abstracto: ['#c4623f', '#2f4a6b', '#d9b25c'],
  paisaje: ['#5b7f6b', '#a8c0cc', '#d4b483'],
  retrato: ['#7a4a3f', '#2d2a33', '#c9a78a'],
  grafico: ['#1f1d24', '#e6e0d4', '#c4623f'],
}

/** Cuadro con composición: bandas de color, no un rectángulo liso. */
export function CuadroArte({ position, rotation, w = 0.6, h = 0.8, estilo = 'abstracto' }) {
  const c = ARTE[estilo] ?? ARTE.abstracto
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0, 0]} s={[w + 0.06, h + 0.06, 0.04]} m={M.woodDark} />
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={c[1]} roughness={0.92} />
      </mesh>
      <mesh position={[0, -h * 0.22, 0.03]}>
        <planeGeometry args={[w * 0.9, h * 0.34]} />
        <meshStandardMaterial color={c[0]} roughness={0.92} />
      </mesh>
      <mesh position={[w * 0.22, h * 0.24, 0.03]}>
        <planeGeometry args={[w * 0.34, h * 0.26]} />
        <meshStandardMaterial color={c[2]} roughness={0.92} />
      </mesh>
    </group>
  )
}

export function CuadroGrande({ position, rotation }) {
  return <CuadroArte position={position} rotation={rotation} w={1.3} h={0.9} estilo="paisaje" />
}

/** Tres piezas del mismo alto, que es como se cuelga un tríptico. */
export function TripticoArte({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {[-1, 0, 1].map((i) => (
        <CuadroArte
          key={i}
          position={[i * 0.5, 0, 0]}
          w={0.4}
          h={0.62}
          estilo={['retrato', 'abstracto', 'grafico'][i + 1]}
        />
      ))}
    </group>
  )
}

/** Recargado en el piso contra el muro, como en los estudios. */
export function CuadroPiso({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <group position={[0, 0.55, 0]} rotation={[-0.14, 0, 0]}>
        <CuadroArte position={[0, 0, 0]} w={0.8} h={1.05} estilo="grafico" />
      </group>
    </group>
  )
}

/* ── lámparas ──────────────────────────────────────────────────────
   Todas son PORTAFOCOS: no traen luz propia, traen un casquillo E26 donde
   entra un foco inteligente. Es la venta más fácil de todo el catálogo —el
   cliente no cambia el mueble ni pica pared, cambia el foco— y por eso vale
   la pena que estén modeladas: para poder señalarlas en el plano y decir
   "aquí van tres focos y ya tienes la sala automatizada". */

export function LamparaArco({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.03, 0]} s={[0.4, 0.06, 0.4]} m={M.metal} />
      {Array.from({ length: 8 }, (_, i) => {
        const t = i / 7
        return (
          <C
            key={i}
            p={[t * 1.1, 0.4 + Math.sin(t * 1.5) * 1.35, 0]}
            s={[0.035, 0.3, 0.035]}
            r={[0, 0, -t * 0.9]}
            m={M.metal}
            shadow={false}
          />
        )
      })}
      <mesh position={[1.15, 1.72, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.19, 0.22, 18, 1, true]} />
        <meshStandardMaterial color="#d8c49a" roughness={0.9} side={2} />
      </mesh>
    </group>
  )
}

export function LamparaColgante({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.62, 0]} s={[0.012, 1.24, 0.012]} m={M.metal} shadow={false} />
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.24, 0.26, 20, 1, true]} />
        <meshStandardMaterial color="#2f2b28" roughness={0.5} metalness={0.4} side={2} />
      </mesh>
    </group>
  )
}

export function LamparaEsfera({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.5, 0]} s={[0.012, 1.0, 0.012]} m={M.metal} shadow={false} />
      <mesh castShadow>
        <sphereGeometry args={[0.16, 20, 14]} />
        <meshStandardMaterial color="#e6ddcb" roughness={0.85} />
      </mesh>
    </group>
  )
}

export function LamparaTripode({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <C
            key={i}
            p={[Math.sin(a) * 0.22, 0.6, Math.cos(a) * 0.22]}
            s={[0.035, 1.25, 0.035]}
            r={[Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3]}
            m={M.wood}
          />
        )
      })}
      <mesh position={[0, 1.36, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 0.28, 18, 1, true]} />
        <meshStandardMaterial color="#cfc4b1" roughness={0.9} side={2} />
      </mesh>
    </group>
  )
}

/** De escritorio, articulada. La que casi siempre acaba con el foco de color. */
export function LamparaEscritorio({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.015, 0]} s={[0.2, 0.03, 0.2]} m={M.metal} />
      <C p={[0, 0.2, 0]} s={[0.025, 0.4, 0.025]} r={[0, 0, 0.18]} m={M.metal} />
      <C p={[0.16, 0.46, 0]} s={[0.025, 0.36, 0.025]} r={[0, 0, -0.9]} m={M.metal} />
      <mesh position={[0.31, 0.55, 0]} rotation={[0, 0, -0.7]} castShadow>
        <cylinderGeometry args={[0.05, 0.11, 0.13, 16, 1, true]} />
        <meshStandardMaterial color="#c4623f" roughness={0.6} side={2} />
      </mesh>
    </group>
  )
}

/** De buró: la del comando "buenas noches". */
export function LamparaBuro({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.02, 0]} s={[0.16, 0.04, 0.16]} m={M.metalWarm} />
      <C p={[0, 0.14, 0]} s={[0.05, 0.24, 0.05]} m={M.metalWarm} />
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.15, 0.18, 16, 1, true]} />
        <meshStandardMaterial color="#e0d3b8" roughness={0.9} side={2} />
      </mesh>
    </group>
  )
}
