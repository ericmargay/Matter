import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { M, G } from './materials'
import { dim } from './home'
import { scrollState } from '../store/store'
import Model from './Model'
import { LEVEL_Y } from './layout'
import {
  B,
  C,
  Sofa,
  CoffeeTable,
  MediaUnit,
  Tv,
  Rug,
  Plant,
  Speaker,
  Bed,
  Nightstand,
  Wardrobe,
  KitchenRun,
  Island,
  Fridge,
  PendantLamp,
  Desk,
  Monitor,
  OfficeChair,
  Rack,
  Shelf,
  Blinds,
  SlatWall,
  Artwork,
  Nanoleaf,
  ArcLamp,
  TableLamp,
  Sconce,
} from './props'
import { Toilet, Vanity, Mirror, Shower, Extractor, TowelRail, SlidingDoor } from './fixtures'
import { Dog, Feeder } from './actors'

const HALF_PI = Math.PI / 2
const Y1 = LEVEL_Y[1] // 3.1 — piso terminado de la planta alta

/**
 * Tira o barra emisiva ligada a un cuarto.
 * `invert` la enciende cuando el cuarto está oscuro — es como funciona una
 * guía de piso: solo sirve de noche.
 */
function Strip({ position, scale, room, invert = false, color = '#ffc48a', max = 2.6 }) {
  const mat = useMemo(() => {
    const m = M.strip.clone()
    m.emissive.set(color)
    return m
  }, [color])

  useFrame(() => {
    const d = dim[room]
    mat.emissiveIntensity = 0.02 + max * (invert ? 1 - d.level : d.level)
    if (!invert) mat.emissive.copy(d.color)
  })

  return <mesh position={position} scale={scale} geometry={G.box} material={mat} />
}

/** Plafón regulable: la luz general de un cuarto. */
function Ceiling({ position, room, intensity = 7, distance = 7 }) {
  const light = useRef()
  const disc = useMemo(() => M.bulb.clone(), [])

  useFrame(() => {
    const d = dim[room]
    if (light.current) {
      light.current.intensity = d.level * intensity
      light.current.color.copy(d.color)
      light.current.visible = d.level > 0.01
    }
    disc.emissive.copy(d.color)
    // sin techo del que colgar, el disco se lee como un óvalo flotando:
    // en el dollhouse se apaga y solo queda la luz que emite
    disc.emissiveIntensity = (0.04 + d.level * 2.6) * (1 - scrollState.cut * 0.92)
  })

  return (
    <group position={position}>
      <mesh scale={[0.34, 0.05, 0.34]} geometry={G.cyl} material={disc} />
      <pointLight ref={light} position={[0, -0.15, 0]} intensity={0} distance={distance} decay={2} />
    </group>
  )
}

/* ═══════════════════════ PLANTA BAJA ═══════════════════════ */

/** Garage — casi vacío a propósito: lo que importa es que quepa el coche. */
function Garage() {
  return (
    <group>
      <Ceiling position={[-5.6, 2.75, 2.4]} room="garage" intensity={9} distance={9} />

      {/* banco de trabajo y repisa contra el muro izquierdo */}
      <B p={[-7.5, 0.45, 4.0]} s={[0.7, 0.9, 1.8]} m={M.woodDark} />
      <B p={[-7.5, 0.92, 4.0]} s={[0.78, 0.05, 1.9]} m={M.wood} />
      <Shelf position={[-7.8, 0, 1.6]} rotation={[0, HALF_PI, 0]} w={2.0} levels={3} />

      {/* botes y llantas sueltas: un garage vacío se ve falso */}
      <mesh position={[-7.4, 0.28, 2.9]} scale={[0.34, 0.56, 0.34]} geometry={G.cyl} material={M.metal} castShadow />
      <mesh position={[-3.9, 0.16, 1.3]} rotation={[0, 0, HALF_PI]} scale={[0.62, 0.2, 0.62]} geometry={G.cyl}>
        <meshStandardMaterial color="#151517" roughness={0.9} />
      </mesh>

      {/* sensor de presencia en el techo */}
      <mesh position={[-5.6, 2.72, 4.2]} scale={[0.1, 0.05, 0.1]} geometry={G.cyl} material={M.bulbSoft} />
    </group>
  )
}

function Recibidor() {
  return (
    <group>
      <Ceiling position={[-1.0, 2.75, 2.6]} room="recibidor" intensity={7} distance={7} />
      <Rug position={[-1.0, 0, 3.4]} w={2.0} d={1.3} m={M.fabric} />

      {/* consola de entrada */}
      <group position={[-2.6, 0, 2.0]} rotation={[0, HALF_PI, 0]}>
        <B p={[0, 0.38, 0]} s={[1.3, 0.76, 0.34]} m={M.wood} />
        <B p={[0, 0.79, 0]} s={[1.36, 0.05, 0.38]} m={M.woodDark} />
        <Model name="vase" position={[0.4, 0.82, 0]} scale={0.9} fallback={null} />
        <Model name="plant" position={[-0.35, 0.82, 0]} scale={1.2} fallback={null} />
        {/* tag NFC "Llegué" */}
        <mesh position={[0, 1.35, -0.19]} scale={[0.11, 0.11, 0.01]} geometry={G.box} material={M.bulbSoft} />
      </group>

      {/* perchero */}
      <group position={[0.9, 0, 2.2]}>
        <B p={[0, 0.9, 0]} s={[0.06, 1.8, 0.06]} m={M.woodDark} />
        {[0.6, -0.6].map((a) => (
          <B key={a} p={[Math.sin(a) * 0.2, 1.62, Math.cos(a) * 0.2]} s={[0.16, 0.04, 0.16]} m={M.metalWarm} shadow={false} />
        ))}
      </group>

      <Sconce position={[-3.11, 1.85, 2.2]} rotation={[0, HALF_PI, 0]} room="recibidor" />
      <Artwork position={[-3.13, 1.7, 3.6]} rotation={[0, HALF_PI, 0]} w={0.7} h={0.92} art={2} />

      {/* botonera de escenas junto a la puerta */}
      <group position={[-0.1, 1.15, 4.9]}>
        <B p={[0, 0, 0]} s={[0.18, 0.26, 0.02]} m={M.white} shadow={false} />
        {[0.07, -0.01].map((y) => (
          <mesh key={y} position={[0, y, 0.013]} scale={[0.11, 0.014, 0.005]} geometry={G.box} material={M.bulbSoft} />
        ))}
      </group>

      {/* sensor de presencia sobre la puerta */}
      <mesh position={[-1.0, 2.35, 4.86]} scale={[0.1, 0.05, 0.06]} geometry={G.box} material={M.bulbSoft} />
    </group>
  )
}

function Sala() {
  return (
    <group>
      <SlatWall position={[4.6, 0, 0.7]} w={3.6} h={1.96} count={34} />
      <MediaUnit position={[4.6, 0, 1.0]} w={2.3} />
      <Tv position={[4.6, 1.2, 0.84]} w={1.7} room="sala" />
      <Speaker position={[5.9, 0.45, 1.0]} />

      <Rug position={[4.6, 0, 2.6]} w={3.8} d={2.3} m={M.fabricLight} />
      {/* Modelados en Blender: bisel y subdivisión donde three.js solo
          daba cajas. Si la carpeta no está, entra la versión procedural. */}
      <Model
        name="sofa"
        position={[4.6, 0, 3.8]}
        fallback={<Sofa position={[0, 0, 0]} rotation={[0, Math.PI, 0]} w={2.8} />}
      />
      <Model name="mesa-centro" position={[4.6, 0, 2.5]} fallback={<CoffeeTable position={[0, 0, 0]} />} />
      <Model name="butaca" position={[2.4, 0, 2.9]} rotation={[0, 1.1, 0]} fallback={null} />

      {/* el panal es el punto focal del cuarto y además repite Thread */}
      <Nanoleaf position={[7.85, 1.55, 2.9]} rotation={[0, -HALF_PI, 0]} room="sala" size={0.2} />

      <ArcLamp position={[2.2, 0, 3.6]} rotation={[0, -0.9, 0]} room="sala" />
      <Plant position={[7.3, 0, 4.3]} h={1.3} />
      <Sconce position={[1.27, 1.9, 1.6]} rotation={[0, HALF_PI, 0]} room="sala" />

      {/* la persiana va en el muro derecho, que es el que no se corta
          con el ángulo de cámara de este capítulo */}
      <Blinds position={[7.86, 1.67, -1.2]} rotation={[0, -HALF_PI, 0]} w={1.8} h={1.55} room="sala" />

      <Artwork position={[1.33, 1.8, 3.4]} rotation={[0, HALF_PI, 0]} w={0.72} h={0.94} art={0} />
    </group>
  )
}

function Cocina() {
  return (
    <group>
      <KitchenRun position={[4.4, 0, -4.6]} w={4.2} room="cocina" />
      <Island position={[4.6, 0, -2.0]} w={2.2} />
      <PendantLamp position={[4.6, 2.6, -2.0]} h={1.1} count={3} spread={0.68} room="cocina" />
      <Fridge position={[7.4, 0, -3.9]} rotation={[0, -HALF_PI, 0]} />

      {/* sensor de fuga bajo la tarja */}
      <mesh position={[3.48, 0.06, -4.5]} scale={[0.11, 0.05, 0.11]} geometry={G.cyl} material={M.bulbSoft} />

      <Plant position={[2.0, 0, -0.4]} h={0.95} />
      <Model name="plant" position={[5.4, 1.0, -2.1]} scale={1.3} fallback={null} />
      <mesh position={[3.9, 1.02, -2.0]} scale={[0.24, 0.15, 0.24]} geometry={G.cyl} material={M.ceramic} castShadow />

      {/* comedor de diario */}
      <group position={[6.9, 0, -1.2]}>
        <B p={[0, 0.74, 0]} s={[1.0, 0.05, 1.6]} m={M.wood} />
        {[-1, 1].map((x) =>
          [-1, 1].map((z) => (
            <C key={`${x}${z}`} p={[x * 0.42, 0.37, z * 0.68]} s={[0.05, 0.74, 0.05]} m={M.metal} shadow={false} />
          )),
        )}
      </group>

      {/* pantalla del asistente empotrada */}
      <group position={[7.88, 1.5, -2.6]} rotation={[0, -HALF_PI, 0]}>
        <B p={[0, 0, 0]} s={[0.42, 0.28, 0.03]} m={M.black} shadow={false} />
        <B p={[0, 0, 0.02]} s={[0.38, 0.24, 0.005]} m={M.screenWarm} shadow={false} />
      </group>
    </group>
  )
}

function Bano() {
  return (
    <group>
      <Ceiling position={[-1.0, 2.75, -3.3]} room="bano" intensity={5} distance={5} />

      {/* mueble y espejo van en la partición, que nunca se desvanece */}
      <Vanity position={[-2.2, 0, -1.98]} rotation={[0, Math.PI, 0]} w={1.1} />
      <Mirror position={[-2.2, 1.55, -1.9]} rotation={[0, Math.PI, 0]} w={0.9} h={0.85} room="bano" />
      <Toilet position={[0.4, 0, -4.4]} />
      <TowelRail position={[-0.5, 1.35, -1.9]} rotation={[0, Math.PI, 0]} w={0.55} />
      <Extractor position={[0.7, 2.1, -1.88]} rotation={[0, Math.PI, 0]} room="bano" />

      {/* luz de noche a ras de piso */}
      <Strip position={[-1.4, 0.06, -1.85]} scale={[1.6, 0.02, 0.04]} room="bano" invert color="#ff9a4d" max={1.2} />
      <Plant position={[0.7, 0, -2.5]} h={0.7} />
    </group>
  )
}

/* ═══════════════════════ PLANTA ALTA ═══════════════════════ */

function Recamara() {
  return (
    <group>
      <Bed position={[4.6, Y1, -3.1]} w={2.0} />
      <Nightstand position={[3.15, Y1, -4.15]} room="recamara" />
      <Nightstand position={[6.05, Y1, -4.15]} lamp={false}>
        <TableLamp position={[0, 0.49, 0]} room="recamara" scale={0.85} />
      </Nightstand>
      <Wardrobe position={[1.95, Y1, -2.4]} rotation={[0, HALF_PI, 0]} w={2.1} />
      <Rug position={[4.6, Y1, -1.3]} w={2.9} d={1.7} m={M.fabric} />

      <Blinds position={[4.6, Y1 + 1.6, -4.85]} w={2.2} h={1.4} room="recamara" />

      <Plant position={[7.4, Y1, -0.6]} h={1.05} />
      <Artwork position={[3.4, Y1 + 1.8, -4.88]} w={0.78} h={0.62} art={4} />

      {/* corrediza al balcón */}
      <SlidingDoor position={[4.6, Y1, 0.2]} w={2.4} h={2.3} open={0.5} />

      {/* guía de piso: se enciende cuando el cuarto está oscuro */}
      <Strip
        position={[4.6, Y1 + 0.03, -1.9]}
        scale={[1.9, 0.015, 0.05]}
        room="recamara"
        invert
        color="#ff9a4d"
        max={1.6}
      />
    </group>
  )
}

function BanoPrincipal() {
  return (
    <group>
      <Ceiling position={[-1.0, Y1 + 2.55, -3.0]} room="banoP" intensity={5} distance={5} />

      <Vanity position={[-2.1, Y1, -1.38]} rotation={[0, Math.PI, 0]} w={1.3} />
      <Mirror position={[-2.1, Y1 + 1.55, -1.3]} rotation={[0, Math.PI, 0]} w={1.1} h={0.9} room="banoP" />
      <Shower position={[0.3, Y1, -4.2]} w={1.5} d={1.4} />
      <Toilet position={[-2.6, Y1, -4.4]} rotation={[0, HALF_PI, 0]} />
      <TowelRail position={[-0.4, Y1 + 1.35, -1.3]} rotation={[0, Math.PI, 0]} w={0.6} />
      <Extractor position={[0.75, Y1 + 2.1, -1.28]} rotation={[0, Math.PI, 0]} room="banoP" />

      {/* piso radiante: una franja tibia que se nota al bajar el brillo */}
      <Strip position={[-1.0, Y1 + 0.03, -2.6]} scale={[2.4, 0.012, 1.4]} room="banoP" color="#ff7a3d" max={0.35} />
      <Model name="plant" position={[-2.6, Y1 + 0.86, -1.5]} scale={1.1} fallback={null} />
    </group>
  )
}

function Busy({ position }) {
  const mat = useMemo(() => M.bulbSoft.clone(), [])

  useFrame(() => {
    const on = dim.estudio.busy
    mat.emissive.setRGB(1, 0.3 - on * 0.25, 0.3 - on * 0.25)
    mat.emissiveIntensity = 0.15 + on * 3
  })

  return (
    <mesh position={position} scale={[0.09, 0.09, 0.03]} geometry={G.cyl} rotation={[0, 0, HALF_PI]} material={mat} />
  )
}

function Estudio() {
  return (
    <group>
      <Ceiling position={[-5.6, Y1 + 2.55, -2.6]} room="estudio" intensity={7} distance={7} />

      <Desk position={[-5.6, Y1, -4.5]} w={2.1} />
      <Monitor position={[-5.6, Y1 + 0.77, -4.62]} w={1.15} />
      <OfficeChair position={[-5.6, Y1, -3.8]} rotation={[0, Math.PI, 0]} />

      <B p={[-5.6, Y1 + 0.775, -4.15]} s={[0.44, 0.02, 0.15]} m={M.black} shadow={false} />
      <mesh position={[-4.85, Y1 + 0.81, -4.2]} scale={[0.12, 0.13, 0.12]} geometry={G.cyl} material={M.ceramic} />
      <Model name="plant" position={[-4.6, Y1 + 0.77, -4.6]} scale={1.1} fallback={null} />

      <Rack position={[-7.5, Y1, -4.4]} />
      <Shelf position={[-7.85, Y1, -2.4]} rotation={[0, HALF_PI, 0]} w={2.2} levels={3} />
      <Model name="vase-tall" position={[-7.8, Y1 + 1.19, -3.0]} scale={0.8} fallback={null} />

      {/* luz indicadora "en junta", del lado del pasillo */}
      <Busy position={[-3.1, Y1 + 1.6, -1.6]} />

      <Plant position={[-3.9, Y1, -4.5]} h={1.2} />
      <Strip position={[-5.6, Y1 + 0.9, -4.86]} scale={[1.5, 0.02, 0.03]} room="estudio" max={1.4} />
      <Nanoleaf position={[-7.86, Y1 + 1.6, -4.0]} rotation={[0, HALF_PI, 0]} room="estudio" size={0.13} />
    </group>
  )
}

/** Balcón: Nube, su alimentador, y muebles de exterior. */
function Balcon() {
  return (
    <group>
      <Feeder position={[2.7, Y1, 1.1]} rotation={[0, 0.5, 0]} />
      <Dog position={[4.3, Y1, 3.0]} home={[0, 0]} bowl={[-1.4, -1.9]} />

      {/* tumbonas */}
      {[2.6, 4.0].map((x) => (
        <group key={x} position={[x, Y1, 3.2]} rotation={[0, 0.25, 0]}>
          <B p={[0, 0.36, 0]} s={[0.62, 0.08, 1.5]} m={M.fabricLight} />
          <B p={[0, 0.62, -0.62]} s={[0.62, 0.08, 0.6]} r={[-0.7, 0, 0]} m={M.fabricLight} />
          {[-1, 1].map((s) => (
            <C key={s} p={[s * 0.26, 0.17, 0.5]} s={[0.05, 0.34, 0.05]} m={M.woodDark} shadow={false} />
          ))}
          {[-1, 1].map((s) => (
            <C key={`b${s}`} p={[s * 0.26, 0.17, -0.5]} s={[0.05, 0.34, 0.05]} m={M.woodDark} shadow={false} />
          ))}
        </group>
      ))}

      {/* mesita */}
      <group position={[3.3, Y1, 1.9]}>
        <mesh position={[0, 0.42, 0]} scale={[0.5, 0.04, 0.5]} geometry={G.cyl} material={M.woodDark} castShadow />
        <C p={[0, 0.21, 0]} s={[0.06, 0.42, 0.06]} m={M.metal} shadow={false} />
      </group>

      {/* macetas grandes con riego */}
      {[
        [7.4, 4.3, 1.5],
        [1.9, 4.4, 1.2],
      ].map(([x, z, s], i) => (
        <Plant key={i} position={[x, Y1, z]} h={s} />
      ))}

      {/* serie de foquitos sobre el barandal */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={i}
          position={[1.6 + i * 0.75, Y1 + 1.15 + Math.sin(i * 0.9) * 0.06, 4.9]}
          scale={[0.05, 0.07, 0.05]}
          geometry={G.sphere}
          material={M.bulbSoft}
        />
      ))}

      {/* el balcón es descubierto: la luz general va montada en el muro
          de la casa, no colgando de un techo que no existe */}
      <Ceiling position={[1.42, Y1 + 1.7, 2.4]} room="balcon" intensity={4} distance={6} />
    </group>
  )
}

export default function Rooms({ floor = 0 }) {
  if (floor === 1) {
    return (
      <group>
        <Recamara />
        <BanoPrincipal />
        <Estudio />
        <Balcon />
      </group>
    )
  }

  return (
    <group>
      <Garage />
      <Recibidor />
      <Sala />
      <Cocina />
      <Bano />
    </group>
  )
}
