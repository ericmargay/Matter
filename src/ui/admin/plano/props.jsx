import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

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

export function LibreroLleno({ position, rotation, w = 1.1, niveles, alto: altoPedido }) {
  /* Se puede pedir por altura o por niveles. Por altura es como se piensa en
     obra —"de piso a techo", "a la altura del respaldo"— y los entrepaños
     salen de ahí, que es como se fabrica de verdad. */
  const n = niveles ?? Math.max(1, Math.round((altoPedido ?? 1.68) / 0.42))
  const alto = 0.42 * n
  return (
    <group position={position} rotation={rotation}>
      <B p={[-w / 2, alto / 2, 0]} s={[0.04, alto, 0.3]} m={M.wood} />
      <B p={[w / 2, alto / 2, 0]} s={[0.04, alto, 0.3]} m={M.wood} />
      {Array.from({ length: n + 1 }, (_, k) => (
        <B key={`e${k}`} p={[0, k * 0.42, 0]} s={[w, 0.035, 0.3]} m={M.wood} />
      ))}
      {Array.from({ length: n }, (_, k) => (
        <Libros key={k} ancho={w - 0.1} y={k * 0.42 + 0.02} semilla={k * 3 + 1} />
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
export function MuroCuadros({ position, rotation, w = 1.2, alto = 1.1, d = 0.05 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 1.2, alto / 1.1, d / 0.05]}>
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

/* Una maceta de 20 cm y una de 60 no son la misma pieza ni el mismo problema:
   la chica va en repisa y la grande ocupa un rincón entero. El tamaño entra
   por parámetro para que la huella del plano diga la verdad. */
export function MacetaChica({ position, rotation, w = 0.16, alto = 0.16 }) {
  const r = w * 0.5
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, alto / 2, 0]} s={[w, alto, w]} m={M.ceramic ?? M.wood} />
      <mesh position={[0, alto + r * 0.55, 0]} castShadow>
        <icosahedronGeometry args={[r * 0.85, 0]} />
        <meshStandardMaterial color="#4a7a55" roughness={0.9} />
      </mesh>
    </group>
  )
}

/* ── la mascota ────────────────────────────────────────────────────
   El detalle que hace que el cliente sonría cuando ve su plano. Cuesta seis
   primitivas y es lo que separa un plano técnico de la casa de alguien. */

export function GatoDormido({ position, rotation, w = 0.5, alto = 0.18, d = 0.3 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.5, alto / 0.18, d / 0.3]}>
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

export function PerroDormido({ position, rotation, w = 0.7, alto = 0.24, d = 0.4 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.7, alto / 0.24, d / 0.4]}>
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
export function CamaMascota({ position, rotation, w = 0.7, alto = 0.18, d = 0.7 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.7, alto / 0.18, d / 0.7]}>
      <C p={[0, 0.06, 0]} s={[0.62, 0.12, 0.62]} m={M.fabricLight ?? M.wood} />
      <C p={[0, 0.09, 0]} s={[0.44, 0.06, 0.44]} m={M.fabric ?? M.wood} />
    </group>
  )
}

/* ── sala y estar ──────────────────────────────────────────────── */

export function Sillon({ position, rotation, w = 0.95, alto = 0.85, d = 0.9 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.95, alto / 0.85, d / 0.9]}>
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

export function Chimenea({ position, rotation, w = 1.3, alto = 1.1, d = 0.4 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 1.3, alto / 1.1, d / 0.4]}>
      <B p={[0, 0.55, 0]} s={[1.5, 1.1, 0.35]} m={M.ceramic} />
      <B p={[0, 0.42, 0.04]} s={[0.9, 0.55, 0.3]} m={M.black} />
      <B p={[0, 1.14, 0]} s={[1.7, 0.09, 0.45]} m={M.wood} />
    </group>
  )
}

export function RelojPared({ position, rotation, w = 0.34, alto = 0.34, d = 0.05 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.34, alto / 0.34, d / 0.05]}>
      <C p={[0, 0, 0]} s={[0.34, 0.05, 0.34]} r={[Math.PI / 2, 0, 0]} m={M.woodDark} />
      <C p={[0, 0, 0.03]} s={[0.29, 0.02, 0.29]} r={[Math.PI / 2, 0, 0]} m={M.white} />
      <B p={[0, 0.06, 0.05]} s={[0.02, 0.11, 0.01]} m={M.black} />
      <B p={[0.05, 0, 0.05]} s={[0.09, 0.02, 0.01]} m={M.black} />
    </group>
  )
}

export function Revistero({ position, rotation, w = 0.4, alto = 0.4, d = 0.3 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.4, alto / 0.4, d / 0.3]}>
      <B p={[0, 0.14, 0]} s={[0.42, 0.28, 0.3]} m={M.wood} />
      {[0, 1, 2].map((i) => (
        <B key={i} p={[(i - 1) * 0.07, 0.32, 0]} s={[0.05, 0.24, 0.26]} r={[0.12, 0, 0]} m={M.fabricLight} />
      ))}
    </group>
  )
}

/* ── comedor y cocina ──────────────────────────────────────────── */

export function SillaComedor({ position, rotation, w = 0.46, alto = 0.9, d = 0.5 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.46, alto / 0.9, d / 0.5]}>
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

export function BancoBarra({ position, rotation, w = 0.36, alto = 0.65, d = 0.36 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.36, alto / 0.65, d / 0.36]}>
      <C p={[0, 0.66, 0]} s={[0.34, 0.07, 0.34]} m={M.fabric} />
      <C p={[0, 0.33, 0]} s={[0.05, 0.66, 0.05]} m={M.metal} />
      <C p={[0, 0.22, 0]} s={[0.28, 0.03, 0.28]} m={M.metal} />
      <C p={[0, 0.02, 0]} s={[0.36, 0.04, 0.36]} m={M.metal} />
    </group>
  )
}

export function Alacena({ position, rotation, w = 1.8, alto = 0.7, d = 0.35, hojas = 2 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0, 0]} s={[w, alto, d]} m={M.wood} />
      {Array.from({ length: hojas }, (_, i) => (
        <B
          key={i}
          p={[-w / 2 + (w / hojas) * (i + 0.5), 0, d / 2 + 0.01]}
          s={[w / hojas - 0.04, alto - 0.08, 0.02]}
          m={M.woodDark}
        />
      ))}
    </group>
  )
}

/** La campana, en diez. La de isla cuelga y se ve por los cuatro lados; la de
 *  pared se recarga; la de gaveta desaparece dentro del mueble. Cambia lo que
 *  hay que dejar previsto arriba: ducto, contacto y, si es de isla, refuerzo. */
export function Campana({ position, rotation, w = 0.84, tipo = 'piramide' }) {
  if (tipo === 'gaveta')
    // integrada bajo la alacena: no se ve, pero el ducto sigue existiendo
    return (
      <group position={position} rotation={rotation}>
        <B p={[0, 0, 0]} s={[w, 0.14, 0.4]} m={M.metal} />
      </group>
    )

  if (tipo === 'recta')
    return (
      <group position={position} rotation={rotation}>
        <B p={[0, 0, 0]} s={[w, 0.1, 0.48]} m={M.metal} />
        <B p={[0, 0.34, -0.1]} s={[w * 0.42, 0.58, 0.22]} m={M.metal} />
      </group>
    )

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[w * 0.19, w * 0.5, 0.34, tipo === 'isla' ? 20 : 4]} />
        <meshStandardMaterial color="#9aa0a6" roughness={0.3} metalness={0.7} />
      </mesh>
      <C p={[0, 0.42, 0]} s={[0.2, 0.5, 0.2]} m={M.metal} />
    </group>
  )
}

/**
 * La estufa, en diez.
 *
 * Aquí lo que se está decidiendo no es el mueble: es si la cocina es de gas o
 * eléctrica, que cambia la instalación entera. De gas hay que llevar la línea
 * y —lo que importa para nosotros— hay que poner el sensor de fuga cerca del
 * piso, porque el LP se acumula abajo. Eléctrica o de inducción no lleva
 * sensor pero pide 220 V y un circuito propio de 40 A.
 *
 * `quemadores` y `w` dan el resto: una de seis no cabe en el hueco de 76 que
 * dejó el albañil, y eso se descubre el día de la instalación si no está en
 * el plano.
 */
export function Estufa({ position, rotation, w = 0.76, quemadores = 4, empotrada = false, induccion = false }) {
  const d = 0.62
  const cols = quemadores >= 6 ? 3 : 2
  const filas = Math.ceil(quemadores / cols)

  return (
    <group position={position} rotation={rotation}>
      {/* empotrada: solo la parrilla, el mueble de abajo es carpintería */}
      {!empotrada && (
        <>
          <B p={[0, 0.44, 0]} s={[w, 0.88, d]} m={M.white} />
          <B p={[0, 0.46, d / 2 + 0.01]} s={[w * 0.79, 0.4, 0.02]} m={M.black} />
        </>
      )}
      <B p={[0, 0.9, 0]} s={[w + 0.02, 0.04, d + 0.02]} m={M.black} />

      {/* Inducción no tiene parrillas: son círculos marcados en el vidrio. Se
          ve distinto y es lo que dice de un vistazo que ahí no hay gas. */}
      {Array.from({ length: quemadores }, (_, i) => {
        const cx = ((i % cols) - (cols - 1) / 2) * (w / (cols + 0.6))
        const cz = (Math.floor(i / cols) - (filas - 1) / 2) * (d / (filas + 0.9))
        return induccion ? (
          <C key={i} p={[cx, 0.925, cz]} s={[w * 0.21, 0.004, w * 0.21]} m={M.metal} shadow={false} />
        ) : (
          <C key={i} p={[cx, 0.93, cz]} s={[w * 0.21, 0.02, w * 0.21]} m={M.metal} />
        )
      })}
    </group>
  )
}

export function Microondas({ position, rotation, w = 0.52, alto = 0.3, d = 0.38 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, alto / 2, 0]} s={[w, alto, d]} m={M.white} />
      <B p={[-w * 0.12, alto / 2 + 0.01, d / 2 + 0.01]} s={[w * 0.62, alto * 0.73, 0.02]} m={M.black} />
    </group>
  )
}

export function Lavavajillas({ position, rotation, w = 0.6, integrado = false }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.42, 0]} s={[w, 0.84, 0.6]} m={integrado ? M.wood : M.white} />
      {!integrado && <B p={[0, 0.78, 0.31]} s={[w * 0.83, 0.05, 0.02]} m={M.metal} />}
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

export function EspejoPie({ position, rotation, w = 0.55, alto = 1.65, d = 0.3 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.55, alto / 1.65, d / 0.3]}>
      <B p={[0, 0.85, 0]} s={[0.55, 1.6, 0.05]} m={M.woodDark} />
      <B p={[0, 0.85, 0.03]} s={[0.46, 1.5, 0.01]} m={M.glass} />
      <B p={[0, 0.03, 0.12]} s={[0.4, 0.05, 0.28]} m={M.woodDark} />
    </group>
  )
}

export function BancaPie({ position, rotation, w = 1.2, alto = 0.45, d = 0.4 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 1.2, alto / 0.45, d / 0.4]}>
      <B p={[0, 0.42, 0]} s={[1.2, 0.16, 0.4]} m={M.fabricLight} />
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <C key={`${x}${z}`} p={[x * 0.52, 0.17, z * 0.15]} s={[0.05, 0.34, 0.05]} m={M.woodDark} />
        )),
      )}
    </group>
  )
}

export function Cuna({ position, rotation, w = 1.3, alto = 0.95, d = 0.7 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 1.3, alto / 0.95, d / 0.7]}>
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

export function Tina({ position, rotation, w = 1.7, d = 0.78, exenta = false }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.28, 0]} s={[w, 0.56, d]} m={M.white} />
      <B p={[0, 0.44, 0]} s={[w - 0.15, 0.3, d - 0.14]} m={M.ceramic} />
      {/* exenta: separada del muro, con patas. Pide toma y desagüe en el PISO,
          no en la pared, y eso hay que decidirlo antes de colar. */}
      {exenta &&
        [-1, 1].map((x) =>
          [-1, 1].map((z) => (
            <C key={`${x}${z}`} p={[(x * (w - 0.3)) / 2, 0.05, (z * (d - 0.24)) / 2]} s={[0.06, 0.1, 0.06]} m={M.metalWarm} />
          )),
        )}
      <C p={[-w / 2 + 0.1, 0.68, 0]} s={[0.05, 0.24, 0.05]} m={M.metalWarm} />
    </group>
  )
}

export function Lavadora({ position, rotation, w = 0.6, alto = 0.85, d = 0.6 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.6, alto / 0.85, d / 0.6]}>
      <B p={[0, 0.43, 0]} s={[0.64, 0.86, 0.64]} m={M.white} />
      <C p={[0, 0.48, 0.32]} s={[0.34, 0.03, 0.34]} r={[Math.PI / 2, 0, 0]} m={M.metal} />
      <C p={[0, 0.48, 0.34]} s={[0.26, 0.02, 0.26]} r={[Math.PI / 2, 0, 0]} m={M.glass} />
      <B p={[0, 0.82, 0.32]} s={[0.5, 0.09, 0.02]} m={M.black} />
    </group>
  )
}

export function Secadora({ position, rotation, w = 0.6, alto = 0.85, d = 0.6 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.6, alto / 0.85, d / 0.6]}>
      <B p={[0, 0.43, 0]} s={[0.64, 0.86, 0.64]} m={M.ceramic} />
      <C p={[0, 0.45, 0.32]} s={[0.38, 0.03, 0.38]} r={[Math.PI / 2, 0, 0]} m={M.metal} />
      <B p={[0, 0.82, 0.32]} s={[0.5, 0.09, 0.02]} m={M.black} />
    </group>
  )
}

/** Boiler de paso. Va en muro y es de lo primero que se pregunta si es de gas. */
export function Boiler({ position, rotation, w = 0.45, alto = 1.2, d = 0.45 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.45, alto / 1.2, d / 0.45]}>
      <B p={[0, 0, 0]} s={[0.42, 0.66, 0.25]} m={M.ceramic} />
      <C p={[-0.12, -0.42, 0]} s={[0.05, 0.2, 0.05]} m={M.metal} />
      <C p={[0.12, -0.42, 0]} s={[0.05, 0.2, 0.05]} m={M.metal} />
      <C p={[0, 0.42, 0]} s={[0.12, 0.2, 0.12]} m={M.metal} />
    </group>
  )
}

export function Lavadero({ position, rotation, w = 0.8, alto = 0.9, d = 0.6 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.8, alto / 0.9, d / 0.6]}>
      <B p={[0, 0.42, 0]} s={[0.9, 0.84, 0.6]} m={M.ceramic} />
      <B p={[0, 0.86, 0]} s={[0.94, 0.06, 0.64]} m={M.white} />
      <B p={[-0.2, 0.87, 0]} s={[0.42, 0.06, 0.44]} m={M.ceramic} />
      <C p={[0.34, 1.0, -0.2]} s={[0.04, 0.26, 0.04]} m={M.metalWarm} />
    </group>
  )
}

export function Tendedero({ position, rotation, w = 1.6, alto = 1.3, d = 0.6 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 1.6, alto / 1.3, d / 0.6]}>
      {[-1, 1].map((x) => (
        <C key={x} p={[x * 0.7, 0.55, 0]} s={[0.04, 1.1, 0.04]} m={M.metal} />
      ))}
      {[0, 1, 2].map((i) => (
        <B key={i} p={[0, 0.95 - i * 0.18, 0]} s={[1.4, 0.012, 0.012]} m={M.metal} shadow={false} />
      ))}
    </group>
  )
}

export function Tinaco({ position, rotation, w = 0.9, alto = 1.1, d = 0.9 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.9, alto / 1.1, d / 0.9]}>
      <C p={[0, 0.5, 0]} s={[0.9, 1.0, 0.9]} m={M.black} />
      <C p={[0, 1.03, 0]} s={[0.4, 0.08, 0.4]} m={M.ceramic} />
    </group>
  )
}

/* ── oficina ───────────────────────────────────────────────────── */

export function Archivero({ position, rotation, w = 0.45, alto = 0.72, d = 0.55 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.45, alto / 0.72, d / 0.55]}>
      <B p={[0, 0.34, 0]} s={[0.45, 0.68, 0.55]} m={M.metal} />
      {[0, 1].map((i) => (
        <B key={i} p={[0, 0.18 + i * 0.32, 0.28]} s={[0.36, 0.22, 0.02]} m={M.ceramic} />
      ))}
    </group>
  )
}

export function Pizarron({ position, rotation, w = 1.6, alto = 1.0, d = 0.05 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 1.6, alto / 1.0, d / 0.05]}>
      <B p={[0, 0, 0]} s={[1.8, 1.05, 0.05]} m={M.woodDark} />
      <B p={[0, 0, 0.03]} s={[1.7, 0.95, 0.01]} m={M.white} />
    </group>
  )
}

export function SillaVisita({ position, rotation, w = 0.5, alto = 0.82, d = 0.55 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.5, alto / 0.82, d / 0.55]}>
      <B p={[0, 0.44, 0]} s={[0.46, 0.07, 0.46]} m={M.fabric} />
      <B p={[0, 0.7, -0.2]} s={[0.44, 0.46, 0.07]} m={M.fabric} />
      {[-1, 1].map((x) => (
        <B key={x} p={[x * 0.21, 0.22, 0]} s={[0.03, 0.44, 0.42]} m={M.metal} />
      ))}
    </group>
  )
}

export function MacetaGrande({ position, rotation, w = 0.5, alto = 0.55, d = 0.5 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.5, alto / 0.55, d / 0.5]}>
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

export function CuadroGrande({ position, rotation, w = 1.3, alto = 0.9, estilo = 'paisaje' }) {
  return <CuadroArte position={position} rotation={rotation} w={w} h={alto} estilo={estilo} />
}

/** Tres piezas del mismo alto, que es como se cuelga un tríptico. */
export function TripticoArte({ position, rotation, w = 1.5, alto = 0.7, d = 0.05 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 1.5, alto / 0.7, d / 0.05]}>
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
export function CuadroPiso({ position, rotation, w = 0.86, alto = 1.1, d = 0.3 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 0.86, alto / 1.1, d / 0.3]}>
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

export function LamparaArco({ position, rotation, alcance = 1.1, altura = 1.35 }) {
  return (
    <group position={position} rotation={rotation} scale={[w / 1.36, alto / 0.96, d / 0.06]}>
      <C p={[0, 0.03, 0]} s={[0.4, 0.06, 0.4]} m={M.metal} />
      {Array.from({ length: 8 }, (_, i) => {
        const t = i / 7
        return (
          <C
            key={i}
            p={[t * alcance, 0.4 + Math.sin(t * 1.5) * altura, 0]}
            s={[0.035, 0.3, 0.035]}
            r={[0, 0, -t * 0.9]}
            m={M.metal}
            shadow={false}
          />
        )
      })}
      <mesh position={[alcance * 1.045, 0.4 + Math.sin(1.5) * altura + 0.36, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.19, 0.22, 18, 1, true]} />
        <meshStandardMaterial color="#d8c49a" roughness={0.9} side={2} />
      </mesh>
    </group>
  )
}

/**
 * El colgante, en diez.
 *
 * De todas las luminarias de una casa es la que más decisiones arrastra: la
 * altura del cable depende de qué hay debajo —sobre una mesa cuelga a 75 cm
 * del tablero, en un pasillo no puede bajar de 2.10— y la forma de la pantalla
 * decide si la luz cae en un cono cerrado sobre la mesa o si se reparte por
 * todo el cuarto. Por eso las diez cambian pantalla Y caída.
 */
export function LamparaColgante({ position, rotation, v = 'campana', caida = 1.24 }) {
  const cable = <C p={[0, caida / 2, 0]} s={[0.012, caida, 0.012]} m={M.metal} shadow={false} />
  const opaco = <meshStandardMaterial color="#2f2b28" roughness={0.5} metalness={0.4} side={2} />
  const claro = <meshStandardMaterial color="#e6ddcb" roughness={0.85} side={2} />

  const P = {
    // cono cerrado: manda la luz abajo, sobre la mesa
    campana: <cylinderGeometry args={[0.06, 0.24, 0.26, 20, 1, true]} />,
    // más ancho y más plano: cubre una mesa larga
    plato: <cylinderGeometry args={[0.05, 0.34, 0.16, 24, 1, true]} />,
    // cilindro recto: reparte arriba y abajo por igual
    tambor: <cylinderGeometry args={[0.17, 0.17, 0.24, 22, 1, true]} />,
    // invertido: casi toda la luz al techo, ambiente y nada de tarea
    invertido: <cylinderGeometry args={[0.26, 0.1, 0.2, 22, 1, true]} />,
    // tubo largo: para barra angosta o pasillo
    tubo: <cylinderGeometry args={[0.07, 0.07, 0.46, 18, 1, true]} />,
    // jaula: la luz sale por todos lados, deslumbra si va a la altura del ojo
    jaula: <cylinderGeometry args={[0.14, 0.14, 0.22, 8, 1, true]} />,
    // domo hondo, el clásico de barra
    domo: <sphereGeometry args={[0.2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />,
  }

  return (
    <group position={position} rotation={rotation}>
      {cable}
      <mesh castShadow>
        {P[v] ?? P.campana}
        {v === 'tambor' || v === 'invertido' || v === 'tubo' ? claro : opaco}
      </mesh>
    </group>
  )
}

/** El colgante esférico, en diez tamaños y caídas. La esfera reparte en todas
 *  direcciones: es la que mejor ambienta y la peor para leer debajo. */
export function LamparaEsfera({ position, rotation, r = 0.16, caida = 1.0, racimo = 1 }) {
  const bola = (x = 0, y = 0, rr = r) => (
    <mesh position={[x, y, 0]} castShadow>
      <sphereGeometry args={[rr, 20, 14]} />
      <meshStandardMaterial color="#e6ddcb" roughness={0.85} />
    </mesh>
  )

  if (racimo > 1)
    /* Racimo: tres esferas a distinta altura. Es una sola salida de techo pero
       tres cuerpos, y eso cambia la caja que hay que dejar arriba. */
    return (
      <group position={position} rotation={rotation}>
        {Array.from({ length: racimo }, (_, i) => {
          const x = (i - (racimo - 1) / 2) * r * 2.6
          const y = -i * r * 0.9
          return (
            <group key={i}>
              <C p={[x, y + caida / 2, 0]} s={[0.012, caida, 0.012]} m={M.metal} shadow={false} />
              {bola(x, y, r * (i === 1 ? 1.15 : 0.9))}
            </group>
          )
        })}
      </group>
    )

  return (
    <group position={position} rotation={rotation}>
      <C p={[0, caida / 2, 0]} s={[0.012, caida, 0.012]} m={M.metal} shadow={false} />
      {bola()}
    </group>
  )
}

export function LamparaTripode({ position, rotation, alto = 1.25, abre = 0.22, pantalla = 0.24 }) {
  return (
    <group position={position} rotation={rotation}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <C
            key={i}
            p={[Math.sin(a) * abre, alto * 0.48, Math.cos(a) * abre]}
            s={[0.035, alto, 0.035]}
            r={[Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3]}
            m={M.wood}
          />
        )
      })}
      <mesh position={[0, alto * 1.09, 0]} castShadow>
        <cylinderGeometry args={[pantalla * 0.67, pantalla, 0.28, 18, 1, true]} />
        <meshStandardMaterial color="#cfc4b1" roughness={0.9} side={2} />
      </mesh>
    </group>
  )
}

/** De escritorio, articulada. La que casi siempre acaba con el foco de color. */
export function LamparaEscritorio({ position, rotation, brazo = 1, pinza = false }) {
  return (
    <group position={position} rotation={rotation}>
      {/* base de disco o pinza al canto de la mesa: la pinza no ocupa
          superficie, que en un escritorio de 60 cm es la mitad del problema */}
      {pinza ? (
        <C p={[0, 0.04, -0.03]} s={[0.06, 0.12, 0.06]} m={M.metal} />
      ) : (
        <C p={[0, 0.015, 0]} s={[0.2, 0.03, 0.2]} m={M.metal} />
      )}
      <C p={[0, 0.2 * brazo, 0]} s={[0.025, 0.4 * brazo, 0.025]} r={[0, 0, 0.18]} m={M.metal} />
      <C p={[0.16 * brazo, 0.46 * brazo, 0]} s={[0.025, 0.36 * brazo, 0.025]} r={[0, 0, -0.9]} m={M.metal} />
      <mesh position={[0.31 * brazo, 0.55 * brazo, 0]} rotation={[0, 0, -0.7]} castShadow>
        <cylinderGeometry args={[0.05, 0.11, 0.13, 16, 1, true]} />
        <meshStandardMaterial color="#c4623f" roughness={0.6} side={2} />
      </mesh>
    </group>
  )
}

/**
 * Monitor curvo ultrapanorámico, del que va sobre el escritorio.
 *
 * La curva no es un adorno: es lo único que distingue un monitor curvo de
 * uno plano visto de tres cuartos, que es como se ve todo en este plano. Se
 * hace con un segmento de cilindro de radio 1.5 m —el 1500R de las fichas
 * técnicas— y el eje del cilindro puesto DELANTE de la pantalla, del lado de
 * quien mira, que es lo que la deja cóncava y no jorobada.
 *
 * Se dibuja desde su base, no desde su centro: así se coloca sobre la mesa
 * dándole la altura del escritorio y se apoya, en vez de atravesarla.
 */
/* Cinco monitores de verdad, con su medida. No es cosmética: un 49 pulgadas
   no cabe en el mismo escritorio que un 27, y el doble monitor pide dos veces
   el contacto. Lo que se dibuja aquí es lo que después hay que enchufar. */
const MONITORES = {
  ultra34: { ancho: 0.8, alto: 0.34, R: 1.5, n: 1 },
  plano27: { ancho: 0.6, alto: 0.34, R: 0, n: 1 },
  curvo32: { ancho: 0.7, alto: 0.4, R: 1.0, n: 1 },
  doble27: { ancho: 0.6, alto: 0.34, R: 0, n: 2 },
  ultra49: { ancho: 1.19, alto: 0.34, R: 1.0, n: 1 },
}

export function MonitorCurvo({ position, rotation, v = 'ultra34' }) {
  const M = MONITORES[v] ?? MONITORES.ultra34
  if (M.n === 2) {
    /* Dos monitores no son uno el doble de ancho: van abiertos en ángulo hacia
       quien se sienta, y así es como estorban o no en la mesa. */
    return (
      <group position={position} rotation={rotation}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * (M.ancho / 2 + 0.01), 0, s === -1 ? 0.05 : 0.05]} rotation={[0, -s * 0.28, 0]}>
            <UnMonitor ancho={M.ancho} alto={M.alto} R={M.R} conBase={s === -1} />
          </group>
        ))}
        <mesh position={[0, 0.012, 0.02]} castShadow>
          <cylinderGeometry args={[0.14, 0.15, 0.024, 24]} />
          <meshStandardMaterial color="#26262b" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>
    )
  }
  return (
    <group position={position} rotation={rotation}>
      <UnMonitor ancho={M.ancho} alto={M.alto} R={M.R} conBase />
    </group>
  )
}

function UnMonitor({ ancho = 0.8, alto = 0.34, R = 1.5, conBase = true }) {
  const arco = R > 0 ? ancho / R : 0
  const y = 0.16 + alto / 2 // sobre el cuello

  return (
    <group>
      {/* base y cuello */}
      {conBase && (
        <mesh position={[0, 0.012, 0.02]} castShadow>
          <cylinderGeometry args={[0.13, 0.14, 0.024, 24]} />
          <meshStandardMaterial color="#26262b" roughness={0.4} metalness={0.6} />
        </mesh>
      )}
      <mesh position={[0, 0.09, 0]} castShadow>
        <boxGeometry args={[0.06, 0.16, 0.035]} />
        <meshStandardMaterial color="#26262b" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Plano o curvo. El plano no es un curvo de radio enorme: se dibuja con
          una caja, que es más barata y además se ve recta de verdad. */}
      {R === 0 ? (
        <>
          <mesh position={[0, y, 0]} castShadow>
            <boxGeometry args={[ancho + 0.02, alto + 0.016, 0.022]} />
            <meshStandardMaterial color="#141417" roughness={0.55} />
          </mesh>
          <PantallaPlana ancho={ancho - 0.012} alto={alto - 0.012} y={y} />
        </>
      ) : (
        <>
          <mesh position={[0, y, R]} castShadow>
            <cylinderGeometry args={[R + 0.012, R + 0.012, alto + 0.016, 48, 1, true, Math.PI - arco / 2, arco]} />
            <meshStandardMaterial color="#141417" roughness={0.55} side={2} />
          </mesh>
          <PantallaCurva R={R} arco={arco} alto={alto - 0.012} y={y} />
        </>
      )}
    </group>
  )

}

/**
 * La pantalla del monitor, encendida y con algo pasando.
 *
 * Es una pantalla de LEDs: quieta y de un solo azul parece una placa de
 * acrílico, no una pantalla. Se parte en franjas verticales con su propio
 * material y se les corre una onda lenta de brillo y de tono — a la distancia
 * a la que se mira un plano isométrico eso es exactamente lo que se lee como
 * "hay algo puesto", sin tener que dibujar nada concreto.
 *
 * Lenta a propósito. Una pantalla que parpadea rápido se roba la atención de
 * todo el cuarto, y aquí el monitor es utilería: lo que se está enseñando es
 * la instalación, no la película.
 */
const FRANJAS = 14

/** La misma pantalla, pero recta. Comparte las franjas para que un monitor
 *  plano y uno curvo se vean igual de encendidos. */
function PantallaPlana({ ancho, alto, y }) {
  const materiales = useFranjas()
  return (
    <group position={[0, y, 0.012]}>
      {materiales.map((m, i) => (
        <mesh key={i} material={m} position={[-ancho / 2 + (ancho / FRANJAS) * (i + 0.5), 0, 0]}>
          <planeGeometry args={[ancho / FRANJAS + 0.001, alto]} />
        </mesh>
      ))}
    </group>
  )
}

function PantallaCurva({ R, arco, alto, y }) {
  const materiales = useFranjas()
  const paso = arco / FRANJAS
  const inicio = Math.PI - arco / 2

  return (
    <group position={[0, y, R]}>
      {materiales.map((m, i) => (
        <mesh key={i} material={m}>
          {/* un pelo de traslape entre franjas: sin él se ve la costura */}
          <cylinderGeometry args={[R, R, alto, 4, 1, true, inicio + i * paso - 0.002, paso + 0.004]} />
        </mesh>
      ))}
    </group>
  )
}

/** Las franjas encendidas, con su onda. Las comparten la pantalla curva y la
 *  plana: es la misma pantalla, cambia el soporte. */
function useFranjas() {
  const materiales = useMemo(
    () =>
      Array.from(
        { length: FRANJAS },
        () => new THREE.MeshStandardMaterial({ color: '#05070c', emissive: '#4a6fa8', roughness: 1, side: 2 }),
      ),
    [],
  )
  useEffect(() => () => materiales.forEach((m) => m.dispose()), [materiales])

  useFrame((st) => {
    const t = st.clock.elapsedTime
    materiales.forEach((m, i) => {
      const u = i / FRANJAS
      // dos ondas de periodo distinto: sin la segunda se ve el bucle
      const onda = 0.5 + 0.34 * Math.sin(t * 0.9 - u * 7.4) + 0.16 * Math.sin(t * 0.37 + u * 2.1)
      m.emissive.setHSL(0.57 + 0.11 * Math.sin(t * 0.21 + u * 3.4), 0.6, 0.42)
      m.emissiveIntensity = 0.3 + onda * 1.7
    })
  })

  return materiales
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
