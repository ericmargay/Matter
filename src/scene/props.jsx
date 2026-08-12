import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { M, G } from './materials'
import { dim, useDimmed } from './home'
import { getPainting, createScreenTexture } from './textures'

/**
 * Mobiliario procedural.
 *
 * Todo se construye con cajas y cilindros — nada de assets externos.
 * Cuando tengamos los modelos de Blender, cada uno de estos componentes
 * se reemplaza por su <primitive object={gltf.scene} /> sin tocar House.jsx,
 * porque el contrato (posición en el piso, mirando a +Z) es el mismo.
 *
 * Convención: el origen de cada pieza está en el CENTRO DE SU BASE.
 */

/**
 * Repite una geometría con InstancedMesh.
 *
 * Un barandal de 7 m son ~50 balaustres; cinco barandales, 250 mallas y 250
 * llamadas de dibujo. Como instancias son una sola. Lo mismo con los
 * peldaños de la escalera y los listones del muro de madera.
 */
export function Repeat({ items, material, geometry = G.box, shadow = true }) {
  const ref = useRef()

  useLayoutEffect(() => {
    const d = new THREE.Object3D()
    items.forEach((it, i) => {
      d.position.set(...it.p)
      d.scale.set(...it.s)
      d.rotation.set(...(it.r ?? [0, 0, 0]))
      d.updateMatrix()
      ref.current.setMatrixAt(i, d.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [items])

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={shadow}
      receiveShadow={shadow}
    />
  )
}

/** Caja: el ladrillo de toda la escena. */
export function B({ p = [0, 0, 0], s = [1, 1, 1], m = M.wood, r, shadow = true }) {
  return (
    <mesh
      position={p}
      scale={s}
      rotation={r}
      geometry={G.box}
      material={m}
      castShadow={shadow}
      receiveShadow={shadow}
    />
  )
}

/** Cilindro (patas, macetas, postes). */
export function C({ p = [0, 0, 0], s = [1, 1, 1], m = M.metal, r, shadow = true }) {
  return (
    <mesh
      position={p}
      scale={s}
      rotation={r}
      geometry={G.cyl}
      material={m}
      castShadow={shadow}
      receiveShadow={shadow}
    />
  )
}

/* ───────────────────────── sala ───────────────────────── */

export function Sofa({ position, rotation, w = 2.6 }) {
  return (
    <group position={position} rotation={rotation}>
      {/* cuerpo */}
      <RoundedBox
        args={[w, 0.42, 0.95]}
        radius={0.08}
        smoothness={2}
        position={[0, 0.34, 0]}
        material={M.fabric}
        castShadow
        receiveShadow
      />
      {/* respaldo */}
      <RoundedBox
        args={[w, 0.62, 0.22]}
        radius={0.08}
        smoothness={2}
        position={[0, 0.62, -0.4]}
        material={M.fabric}
        castShadow
      />
      {/* brazos */}
      {[-1, 1].map((s) => (
        <RoundedBox
          key={s}
          args={[0.2, 0.34, 0.95]}
          radius={0.06}
          smoothness={2}
          position={[(s * (w - 0.2)) / 2, 0.6, 0]}
          material={M.fabric}
          castShadow
        />
      ))}
      {/* cojines */}
      {[-1, 1].map((s) => (
        <RoundedBox
          key={s}
          args={[w / 2 - 0.2, 0.14, 0.8]}
          radius={0.06}
          smoothness={2}
          position={[(s * w) / 4.4, 0.62, 0.03]}
          material={M.fabricLight}
          castShadow
        />
      ))}
      {/* patas */}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <C
            key={`${x}${z}`}
            p={[(x * (w - 0.5)) / 2, 0.065, z * 0.34]}
            s={[0.05, 0.13, 0.05]}
            m={M.metalWarm}
            shadow={false}
          />
        )),
      )}
    </group>
  )
}

export function CoffeeTable({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.36, 0]} s={[1.1, 0.05, 0.6]} m={M.wood} />
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <C key={`${x}${z}`} p={[x * 0.47, 0.18, z * 0.24]} s={[0.04, 0.36, 0.04]} m={M.metal} shadow={false} />
        )),
      )}
      {/* libro y bowl: la escena se siente vivida con dos objetos sueltos */}
      <B p={[-0.25, 0.41, 0.05]} s={[0.24, 0.04, 0.17]} m={M.ceramic} shadow={false} />
      <mesh position={[0.28, 0.42, -0.03]} scale={[0.18, 0.1, 0.18]} geometry={G.sphere} material={M.metalWarm} />
    </group>
  )
}

export function MediaUnit({ position, rotation, w = 2 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.22, 0]} s={[w, 0.44, 0.4]} m={M.woodDark} />
      <B p={[0, 0.23, 0.205]} s={[w - 0.1, 0.02, 0.01]} m={M.metalWarm} shadow={false} />
    </group>
  )
}

/** La pantalla se enciende con la escena "Cine" — y reproduce algo. */
export function Tv({ position, rotation, w = 1.7, room = 'sala' }) {
  const glow = useRef()
  const feed = useMemo(() => createScreenTexture(), [])
  const screen = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#000000',
        emissive: '#ffffff',
        emissiveMap: feed.texture,
        map: feed.texture,
        emissiveIntensity: 0,
        roughness: 1,
      }),
    [feed],
  )

  useFrame(({ clock }) => {
    const on = dim[room].tv
    // la textura solo se redibuja si la tele está encendida
    if (on > 0.02) feed.update(clock.elapsedTime)
    screen.emissiveIntensity = 0.02 + on * 1.9
    if (glow.current) glow.current.intensity = on * 3.4
  })

  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0, 0]} s={[w, w * 0.58, 0.05]} m={M.black} />
      <mesh position={[0, 0, 0.031]} scale={[w - 0.06, w * 0.58 - 0.06, 0.01]} geometry={G.box} material={screen} />
      {/* el rebote de la tele sobre el muro es medio cuarto de la escena de cine */}
      <pointLight ref={glow} position={[0, 0, 0.7]} intensity={0} distance={3.6} decay={2} color="#7fa0dc" />
    </group>
  )
}

export function FloorLamp({ position, room = 'sala' }) {
  const light = useRef()
  const shade = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0a0908',
        emissive: '#ffb877',
        emissiveIntensity: 1.5,
        side: THREE.DoubleSide,
        roughness: 1,
      }),
    [],
  )

  useDimmed(room, { light, mats: [shade], intensity: 6, emissive: 2.4, minEmissive: 0.02 })

  return (
    <group position={position}>
      <C p={[0, 0.02, 0]} s={[0.3, 0.04, 0.3]} m={M.metal} shadow={false} />
      <C p={[0, 0.7, 0]} s={[0.03, 1.4, 0.03]} m={M.metal} shadow={false} />
      <mesh position={[0, 1.55, 0]} scale={[0.42, 0.36, 0.42]} material={shade} castShadow>
        <cylinderGeometry args={[0.42, 0.5, 1, 20, 1, true]} />
      </mesh>
      <pointLight ref={light} position={[0, 1.4, 0]} intensity={0} distance={5.5} decay={2} />
    </group>
  )
}

export function Rug({ position, w = 3, d = 2, m = M.fabricLight }) {
  return <B p={[position[0], position[1] + 0.008, position[2]]} s={[w, 0.016, d]} m={m} />
}

export function Plant({ position, h = 1 }) {
  return (
    <group position={position}>
      <C p={[0, h * 0.16, 0]} s={[0.28, h * 0.32, 0.28]} m={M.ceramic} />
      <mesh position={[0, h * 0.72, 0]} scale={[h * 0.5, h * 0.62, h * 0.5]} geometry={G.ico} material={M.foliage} castShadow />
      <mesh
        position={[h * 0.18, h * 0.52, -h * 0.1]}
        scale={[h * 0.3, h * 0.34, h * 0.3]}
        geometry={G.ico}
        material={M.foliage}
        castShadow
      />
    </group>
  )
}

export function Speaker({ position }) {
  return (
    <group position={position}>
      <mesh scale={[0.16, 0.22, 0.16]} position={[0, 0.11, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.44, 1, 20]} />
        <meshStandardMaterial color="#26221f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.225, 0]} scale={[0.13, 0.01, 0.13]} geometry={G.cyl} material={M.bulbSoft} />
    </group>
  )
}

/* ──────────────────────── recámara ─────────────────────── */

export function Bed({ position, rotation, w = 1.9 }) {
  return (
    <group position={position} rotation={rotation}>
      {/* base */}
      <B p={[0, 0.16, 0]} s={[w, 0.32, 2.1]} m={M.woodDark} />
      {/* colchón */}
      <RoundedBox
        args={[w - 0.08, 0.26, 2.02]}
        radius={0.06}
        smoothness={2}
        position={[0, 0.45, 0]}
        material={M.white}
        castShadow
        receiveShadow
      />
      {/* cobija a los pies */}
      <RoundedBox
        args={[w - 0.04, 0.1, 0.9]}
        radius={0.04}
        smoothness={2}
        position={[0, 0.6, 0.5]}
        material={M.fabric}
        castShadow
      />
      {/* almohadas */}
      {[-1, 1].map((s) => (
        <RoundedBox
          key={s}
          args={[w / 2 - 0.16, 0.14, 0.36]}
          radius={0.06}
          smoothness={2}
          position={[(s * w) / 4.6, 0.63, -0.76]}
          material={M.fabricLight}
          castShadow
        />
      ))}
      {/* cabecera */}
      <B p={[0, 0.66, -1.11]} s={[w + 0.16, 1.0, 0.1]} m={M.fabric} />
    </group>
  )
}

export function Nightstand({ position, lamp = true, room = 'recamara', children }) {
  const light = useRef()
  const bulb = useMemo(() => M.bulb.clone(), [])

  useDimmed(room, { light, mats: [bulb], intensity: 3.4, emissive: 3, minEmissive: 0.02 })

  return (
    <group position={position}>
      <B p={[0, 0.24, 0]} s={[0.44, 0.48, 0.38]} m={M.wood} />
      <B p={[0, 0.3, 0.195]} s={[0.2, 0.02, 0.01]} m={M.metalWarm} shadow={false} />
      {lamp && (
        <>
          <C p={[0, 0.56, 0]} s={[0.03, 0.16, 0.03]} m={M.metalWarm} shadow={false} />
          <mesh position={[0, 0.7, 0]} scale={[0.2, 0.18, 0.2]} geometry={G.cyl} material={bulb} />
          <pointLight ref={light} position={[0, 0.7, 0]} intensity={0} distance={2.8} decay={2} />
        </>
      )}
      {children}
    </group>
  )
}

export function Wardrobe({ position, rotation, w = 1.8 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 1.1, 0]} s={[w, 2.2, 0.58]} m={M.woodDark} />
      <B p={[0, 1.1, 0.295]} s={[0.012, 1.9, 0.012]} m={M.metalWarm} shadow={false} />
      {[-1, 1].map((s) => (
        <B key={s} p={[s * (w / 4), 1.05, 0.3]} s={[0.02, 0.28, 0.02]} m={M.metalWarm} shadow={false} />
      ))}
    </group>
  )
}

/* ───────────────────────── cocina ──────────────────────── */

/** Barra baja + gabinete alto + tira LED. La tira es el punto de venta. */
export function KitchenRun({ position, rotation, w = 3.4, room = 'cocina' }) {
  const strip = useMemo(() => M.strip.clone(), [])

  useDimmed(room, { mats: [strip], emissive: 3.2, minEmissive: 0.02 })

  return (
    <group position={position} rotation={rotation}>
      {/* gabinete bajo */}
      <B p={[0, 0.44, 0]} s={[w, 0.88, 0.62]} m={M.woodDark} />
      {/* cubierta */}
      <B p={[0, 0.9, 0]} s={[w + 0.04, 0.05, 0.66]} m={M.ceramic} />
      {/* tarja */}
      <B p={[-w * 0.22, 0.9, 0]} s={[0.55, 0.06, 0.4]} m={M.metal} shadow={false} />
      {/* parrilla */}
      <B p={[w * 0.22, 0.935, 0]} s={[0.6, 0.02, 0.42]} m={M.black} shadow={false} />
      {/* gabinete alto */}
      <B p={[0, 1.85, -0.14]} s={[w, 0.7, 0.34]} m={M.woodDark} />
      {/* ── tira LED bajo gabinete ── */}
      <mesh position={[0, 1.48, 0]} scale={[w - 0.2, 0.025, 0.05]} geometry={G.box} material={strip} />
      {/* dos luces baratas leen mejor que un rectAreaLight (que además
          exige inicializar RectAreaLightUniformsLib a mano) */}
      {/* la tira solo emite: el colgante de la isla es el que alumbra.
          Cada pointLight extra encarece el shader de TODOS los materiales. */}
      {/* jaladeras */}
      {[-1, 0, 1].map((i) => (
        <B key={i} p={[i * (w / 3.4), 0.68, 0.32]} s={[w / 5, 0.02, 0.02]} m={M.metalWarm} shadow={false} />
      ))}
    </group>
  )
}

export function Island({ position, rotation, w = 1.9 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.44, 0]} s={[w, 0.88, 0.9]} m={M.wood} />
      <B p={[0, 0.91, 0]} s={[w + 0.14, 0.06, 1.04]} m={M.ceramic} />
      {/* banquitos */}
      {[-0.5, 0.5].map((x) => (
        <group key={x} position={[x * (w / 1.6), 0, 0.78]}>
          <mesh position={[0, 0.62, 0]} scale={[0.32, 0.06, 0.32]} geometry={G.cyl} material={M.woodDark} castShadow />
          <C p={[0, 0.31, 0]} s={[0.05, 0.62, 0.05]} m={M.metal} shadow={false} />
          <C p={[0, 0.02, 0]} s={[0.3, 0.03, 0.3]} m={M.metal} shadow={false} />
        </group>
      ))}
    </group>
  )
}

export function Fridge({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.95, 0]} s={[0.78, 1.9, 0.7]} m={M.metal} />
      <B p={[0, 1.28, 0.355]} s={[0.74, 0.01, 0.01]} m={M.black} shadow={false} />
      <B p={[0.3, 1.5, 0.36]} s={[0.02, 0.5, 0.02]} m={M.metalWarm} shadow={false} />
      <B p={[0.3, 0.85, 0.36]} s={[0.02, 0.5, 0.02]} m={M.metalWarm} shadow={false} />
    </group>
  )
}

export function PendantLamp({ position, h = 1.2, count = 3, spread = 0.55, room = 'cocina' }) {
  const light = useRef()
  const shade = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a1512',
        emissive: '#ffb066',
        emissiveIntensity: 1.3,
        side: THREE.DoubleSide,
        roughness: 1,
      }),
    [],
  )
  const bulb = useMemo(() => M.bulb.clone(), [])

  useDimmed(room, { light, mats: [shade, bulb], intensity: 4, emissive: 2.8, minEmissive: 0.02 })

  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => {
        const x = (i - (count - 1) / 2) * spread
        return (
          <group key={i} position={[x, 0, 0]}>
            <C p={[0, -h / 2, 0]} s={[0.012, h, 0.012]} m={M.metal} shadow={false} />
            <mesh position={[0, -h - 0.08, 0]} scale={[0.22, 0.18, 0.22]} material={shade} castShadow>
              <coneGeometry args={[0.5, 1, 18, 1, true]} />
            </mesh>
            <mesh position={[0, -h - 0.15, 0]} scale={[0.1, 0.02, 0.1]} geometry={G.cyl} material={bulb} />
          </group>
        )
      })}
      <pointLight ref={light} position={[0, -h - 0.2, 0]} intensity={0} distance={4.4} decay={2} />
    </group>
  )
}

/* ───────────────────────── estudio ─────────────────────── */

export function Desk({ position, rotation, w = 1.8 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.74, 0]} s={[w, 0.05, 0.72]} m={M.wood} />
      {[-1, 1].map((x) => (
        <B key={x} p={[(x * (w - 0.14)) / 2, 0.37, 0]} s={[0.05, 0.74, 0.62]} m={M.metal} shadow={false} />
      ))}
    </group>
  )
}

export function Monitor({ position, rotation, w = 1.05 }) {
  return (
    <group position={position} rotation={rotation}>
      <C p={[0, 0.01, 0]} s={[0.26, 0.02, 0.18]} m={M.metal} shadow={false} />
      <C p={[0, 0.14, 0]} s={[0.04, 0.28, 0.04]} m={M.metal} shadow={false} />
      <B p={[0, 0.46, 0]} s={[w, 0.42, 0.03]} m={M.black} />
      <B p={[0, 0.46, 0.019]} s={[w - 0.04, 0.38, 0.005]} m={M.screen} shadow={false} />
    </group>
  )
}

export function OfficeChair({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.5, 0.1, 0.48]} radius={0.04} smoothness={2} position={[0, 0.46, 0]} material={M.fabric} castShadow />
      <RoundedBox
        args={[0.46, 0.56, 0.09]}
        radius={0.04}
        smoothness={2}
        position={[0, 0.76, -0.22]}
        rotation={[-0.12, 0, 0]}
        material={M.fabric}
        castShadow
      />
      <C p={[0, 0.24, 0]} s={[0.06, 0.44, 0.06]} m={M.metal} shadow={false} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <B
            key={i}
            p={[Math.cos(a) * 0.16, 0.04, Math.sin(a) * 0.16]}
            s={[0.28, 0.03, 0.05]}
            r={[0, -a, 0]}
            m={M.metal}
            shadow={false}
          />
        )
      })}
    </group>
  )
}

/** El rack: la pieza que casi nadie muestra y que explica por qué cobramos. */
export function Rack({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0.5, 0]} s={[0.56, 1.0, 0.5]} m={M.black} />
      {[0.24, 0.44, 0.64, 0.84].map((y, i) => (
        <group key={y}>
          <B p={[0, y, 0.255]} s={[0.5, 0.14, 0.02]} m={M.metal} shadow={false} />
          {/* LEDs de equipo: azules porque es red, no casa */}
          {[0, 1, 2, 3].map((j) => (
            <mesh
              key={j}
              position={[-0.18 + j * 0.06, y + (i % 2 ? 0.02 : -0.02), 0.268]}
              scale={[0.018, 0.018, 0.006]}
              geometry={G.box}
              material={j === 3 && i === 1 ? M.bulbSoft : M.screen}
            />
          ))}
        </group>
      ))}
    </group>
  )
}

export function Shelf({ position, rotation, w = 1.6, levels = 3 }) {
  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: levels }, (_, i) => (
        <B key={i} p={[0, 0.6 + i * 0.55, 0]} s={[w, 0.04, 0.3]} m={M.wood} />
      ))}
      {[-1, 1].map((x) => (
        <B key={x} p={[(x * w) / 2, 0.6 + ((levels - 1) * 0.55) / 2, 0]} s={[0.04, levels * 0.55, 0.3]} m={M.woodDark} />
      ))}
      {/* objetos sueltos en los entrepaños */}
      {Array.from({ length: levels * 2 }, (_, i) => {
        const lvl = Math.floor(i / 2)
        const x = (i % 2 ? 0.28 : -0.3) * (w / 1.6)
        return (
          <B
            key={`o${i}`}
            p={[x, 0.72 + lvl * 0.55, 0]}
            s={[0.18 + (i % 3) * 0.05, 0.2, 0.16]}
            m={i % 3 === 0 ? M.ceramic : i % 3 === 1 ? M.woodDark : M.metalWarm}
            shadow={false}
          />
        )
      })}
    </group>
  )
}

/* ─────────────────── envolvente y aberturas ────────────── */

export function WindowUnit({ position, rotation, w = 1.4, h = 1.5 }) {
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0, 0]} s={[w, h, 0.06]} m={M.glass} shadow={false} />
      <B p={[0, h / 2, 0]} s={[w + 0.1, 0.07, 0.12]} m={M.woodDark} shadow={false} />
      <B p={[0, -h / 2, 0]} s={[w + 0.1, 0.07, 0.12]} m={M.woodDark} shadow={false} />
      {[-1, 1].map((s) => (
        <B key={s} p={[(s * w) / 2, 0, 0]} s={[0.07, h, 0.12]} m={M.woodDark} shadow={false} />
      ))}
    </group>
  )
}

/**
 * Persiana motorizada. Si recibe `room`, la posición la manda el centro de
 * control y baja con la inercia de un motor real, no de golpe.
 */
export function Blinds({ position, rotation, w = 1.4, h = 1.5, open = 0.35, room }) {
  const slats = 9
  const group = useRef()

  useFrame(() => {
    if (!room || !group.current) return
    const o = dim[room].blinds
    const drop = h * (1 - o)
    group.current.children.forEach((slat, i) => {
      slat.position.y = h / 2 - (drop * (i + 0.5)) / slats
      slat.scale.y = Math.max(0.001, (drop / slats) * 0.8)
    })
  })

  const drop = h * (1 - open)

  return (
    <group position={position} rotation={rotation}>
      <B p={[0, h / 2 + 0.06, 0]} s={[w + 0.08, 0.1, 0.14]} m={M.metal} shadow={false} />
      <group ref={group}>
        {Array.from({ length: slats }, (_, i) => (
          <mesh
            key={i}
            geometry={G.box}
            material={M.fabricLight}
            position={[0, h / 2 - (drop * (i + 0.5)) / slats, 0]}
            scale={[w, (drop / slats) * 0.8, 0.02]}
          />
        ))}
      </group>
    </group>
  )
}

/** Muro de listones: el detalle que hace que un render se vea "de revista". */
export function SlatWall({ position, rotation, w = 3, h = 2.6, count = 26 }) {
  const listones = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        p: [-w / 2 + (w * (i + 0.5)) / count, h / 2, 0.03],
        s: [(w / count) * 0.45, h, 0.06],
      })),
    [w, h, count],
  )

  return (
    <group position={position} rotation={rotation}>
      <B p={[0, h / 2, -0.03]} s={[w, h, 0.05]} m={M.woodDark} shadow={false} />
      <Repeat items={listones} material={M.wallAccent} shadow={false} />
    </group>
  )
}

/** Cuadro enmarcado. `art` elige una de las composiciones generadas. */
export function Artwork({ position, rotation, w = 0.6, h = 0.8, art = 0 }) {
  const canvasMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: getPainting(art), roughness: 0.85 }),
    [art],
  )
  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0, 0]} s={[w, h, 0.035]} m={M.woodDark} shadow={false} />
      {/* passe-partout: sin el margen blanco el cuadro se ve como una calcomanía */}
      <B p={[0, 0, 0.02]} s={[w - 0.05, h - 0.05, 0.005]} m={M.white} shadow={false} />
      <mesh position={[0, 0, 0.024]} scale={[w - 0.16, h - 0.16, 1]} geometry={G.plane} material={canvasMat} />
    </group>
  )
}

/* ────────────────── luminarias con carácter ─────────────── */

/**
 * Paneles hexagonales tipo Nanoleaf.
 * Cada panel corre su propio color: es la pieza que convierte un muro en
 * el punto focal del cuarto, y en Thread además repite la malla.
 */
export function Nanoleaf({ position, rotation, room = 'sala', size = 0.19 }) {
  // panal: coordenadas axiales de nueve hexágonos
  const cells = useMemo(
    () => [
      [0, 0], [1, 0], [1, -1], [0, 1], [-1, 1],
      [2, -1], [2, 0], [-1, 0], [1, 1],
    ],
    [],
  )

  /* Tres materiales, no nueve: con el degradado corriendo, el ojo no
     distingue nueve tonos de tres en un panal de 60 cm — y son seis
     programas de shader menos que compilar. */
  const mats = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.MeshStandardMaterial({
            color: '#08070a',
            emissive: '#ff9a4d',
            emissiveIntensity: 1.2,
            roughness: 1,
          }),
      ),
    [],
  )

  const geo = useMemo(() => new THREE.CylinderGeometry(size, size, 0.035, 6), [size])

  useFrame(({ clock }) => {
    const d = dim[room]
    const t = clock.elapsedTime
    mats.forEach((m, i) => {
      // el degradado corre por el panal en vez de parpadear todo junto
      m.emissive.setHSL((t * 0.045 + i * 0.16) % 1, 0.62, 0.55)
      m.emissiveIntensity = 0.06 + d.level * 3.4
    })
  })

  const dx = size * 1.5
  const dy = size * Math.sqrt(3)

  return (
    <group position={position} rotation={rotation}>
      {cells.map(([q, r], i) => (
        <mesh
          key={i}
          geometry={geo}
          material={mats[i % 3]}
          position={[q * dx, (r + q / 2) * dy, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}
    </group>
  )
}

/** Lámpara de arco: la silueta que rompe la cuadrícula de un cuarto. */
export function ArcLamp({ position, rotation, room = 'sala' }) {
  const light = useRef()
  const shade = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#141210',
        emissive: '#ffb877',
        emissiveIntensity: 1.4,
        side: THREE.DoubleSide,
        roughness: 1,
      }),
    [],
  )

  useDimmed(room, { light, mats: [shade], intensity: 5.5, emissive: 2.2, minEmissive: 0.02 })

  return (
    <group position={position} rotation={rotation}>
      {/* base de mármol: pesa visualmente y justifica el voladizo */}
      <mesh position={[0, 0.05, 0]} scale={[0.42, 0.1, 0.42]} geometry={G.cyl} material={M.ceramic} castShadow />
      <mesh position={[0, 1.2, 0.62]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[1.25, 0.018, 8, 40, Math.PI * 0.58]} />
        <meshStandardMaterial color="#b98b56" roughness={0.3} metalness={0.85} />
      </mesh>
      <mesh position={[0, 1.86, 1.32]} scale={[0.3, 0.24, 0.3]} material={shade} castShadow>
        <sphereGeometry args={[1, 18, 12, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58]} />
      </mesh>
      <pointLight ref={light} position={[0, 1.7, 1.32]} intensity={0} distance={5} decay={2} />
    </group>
  )
}

/** Lámpara de mesa con pantalla de tela. */
export function TableLamp({ position, room = 'sala', scale = 1 }) {
  const shade = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d8cdb8',
        emissive: '#ffc48a',
        emissiveIntensity: 1,
        side: THREE.DoubleSide,
        roughness: 0.95,
      }),
    [],
  )

  useDimmed(room, { mats: [shade], emissive: 2.4, minEmissive: 0.02 })

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.02, 0]} scale={[0.16, 0.04, 0.16]} geometry={G.cyl} material={M.metalWarm} />
      <mesh position={[0, 0.14, 0]} scale={[0.05, 0.24, 0.05]} geometry={G.cyl} material={M.metalWarm} />
      <mesh position={[0, 0.32, 0]} scale={[0.19, 0.17, 0.19]} material={shade} castShadow>
        <cylinderGeometry args={[0.75, 1, 1, 20, 1, true]} />
      </mesh>
    </group>
  )
}

/** Arbotante de muro: luz indirecta hacia arriba y hacia abajo. */
export function Sconce({ position, rotation, room = 'sala' }) {
  const glow = useMemo(() => M.strip.clone(), [])

  useDimmed(room, { mats: [glow], emissive: 3, minEmissive: 0.02 })

  return (
    <group position={position} rotation={rotation}>
      <B p={[0, 0, 0]} s={[0.09, 0.3, 0.07]} m={M.metal} shadow={false} />
      <mesh position={[0, 0.16, 0.01]} scale={[0.07, 0.012, 0.05]} geometry={G.box} material={glow} />
      <mesh position={[0, -0.16, 0.01]} scale={[0.07, 0.012, 0.05]} geometry={G.box} material={glow} />
    </group>
  )
}
