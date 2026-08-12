import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M, G } from './materials'
import { B } from './props'
import { Stairs, Railing, GarageDoor } from './fixtures'
import { SlatWall } from './props'
import { Car } from './actors'
import { scrollState } from '../store/store'
import { HOUSE, LEVEL_Y, ROOMS, STAIR_VOID } from './layout'
import Rooms from './Rooms'
import Hubs from './Hubs'

/* ── muros con huecos ──────────────────────────────────────────
   No se puede hacer un boolean barato en three, así que un muro con
   ventanas se arma con los pedazos que quedan alrededor de cada hueco:
   machones a los lados, antepecho abajo y dintel arriba.            */
function buildWall(len, h, openings = []) {
  const parts = []
  const sorted = [...openings].sort((a, b) => a.at - b.at)
  let cursor = -len / 2

  for (const o of sorted) {
    const left = o.at - o.w / 2
    if (left > cursor + 0.001) parts.push({ x: (cursor + left) / 2, y: h / 2, w: left - cursor, h })
    if (o.y0 > 0.001) parts.push({ x: o.at, y: o.y0 / 2, w: o.w, h: o.y0 })
    if (o.y1 < h - 0.001) parts.push({ x: o.at, y: (o.y1 + h) / 2, w: o.w, h: h - o.y1 })
    cursor = o.at + o.w / 2
  }
  if (cursor < len / 2 - 0.001) parts.push({ x: (cursor + len / 2) / 2, y: h / 2, w: len / 2 - cursor, h })
  return parts
}

/**
 * Un tramo de muro perimetral entre dos puntos del plano.
 *
 * Se desvanece solo cuando la cámara queda de su lado de afuera: es el
 * "corte inteligente" que deja ver el interior sin perder los muros del
 * fondo, que son los que hacen que un cuarto se lea como cuarto.
 *
 * `upper` marca los de planta alta, que además desaparecen cuando el
 * recorrido está mirando la planta baja.
 */
function WallRun({ a, b, y, h, normal, openings = [], upper = false }) {
  const group = useRef()

  const { len, center, angle } = useMemo(() => {
    const dx = b[0] - a[0]
    const dz = b[1] - a[1]
    return {
      len: Math.hypot(dx, dz),
      center: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
      // el muro se dibuja a lo largo de su x local; lo rotamos al eje real
      angle: -Math.atan2(dz, dx),
    }
  }, [a, b])

  // la posición de cada hueco viene en coordenadas de mundo sobre el eje
  // largo del muro; aquí se pasa a offset local desde el centro
  const axis = useMemo(() => (Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]) ? 0 : 1), [a, b])
  const local = useMemo(
    () => openings.map((o) => ({ ...o, at: (o.at - center[axis]) * (axis === 0 ? 1 : -1) })),
    [openings, center, axis],
  )

  const parts = useMemo(() => buildWall(len, h, local), [len, h, local])
  const n = useMemo(() => new THREE.Vector3(normal[0], 0, normal[1]), [normal])

  const mats = useMemo(() => {
    const wall = M.wallOut.clone()
    const frame = M.woodDark.clone()
    const glass = M.glass.clone()
    const glow = M.windowGlow.clone()
    // el derrame es el mismo muro pero un punto más claro: así se lee el
    // espesor sin tener que meter oclusión extra
    const reveal = M.wallIn.clone()
    ;[wall, frame, glass, glow, reveal].forEach((m) => (m.transparent = true))
    return { wall, frame, glass, glow, reveal }
  }, [])

  const dir = useRef(new THREE.Vector3())

  useFrame(({ camera }) => {
    dir.current.copy(camera.position).normalize()
    const blocking = THREE.MathUtils.smoothstep(dir.current.dot(n), 0.05, 0.45)

    let target = 1 - blocking * scrollState.cut
    if (upper) target *= scrollState.up

    const o = THREE.MathUtils.lerp(mats.wall.opacity, target, 0.12)
    mats.wall.opacity = o
    mats.frame.opacity = o
    // cristal casi transparente: el interior encendido es lo que se debe ver
    mats.glass.opacity = o * 0.14
    mats.reveal.opacity = o
    mats.glow.opacity = o * (1 - scrollState.cut * 0.8)
    group.current.visible = o > 0.015
  })

  return (
    <group ref={group} position={[center[0], y, center[1]]} rotation={[0, angle, 0]}>
      {parts.map((p, i) => (
        <mesh
          key={i}
          geometry={G.box}
          material={mats.wall}
          position={[p.x, p.y, 0]}
          scale={[p.w, p.h, HOUSE.t]}
          castShadow
          receiveShadow
        />
      ))}

      {local.map((o, i) => {
        const oh = o.y1 - o.y0
        const cy = (o.y0 + o.y1) / 2
        if (o.hole) return null

        if (o.door) {
          return (
            <group key={`o${i}`} position={[o.at, cy, 0]}>
              <mesh geometry={G.box} material={mats.frame} scale={[o.w, oh, HOUSE.t * 0.9]} />
              <mesh geometry={G.box} material={mats.glow} scale={[o.w * 0.12, oh * 0.55, HOUSE.t + 0.03]} position={[o.w * 0.3, 0, 0]} />
              <mesh geometry={G.box} material={mats.frame} scale={[o.w + 0.12, 0.1, HOUSE.t + 0.06]} position={[0, oh / 2, 0]} />
            </group>
          )
        }

        /* Una ventana que solo es un vidrio plano se lee como un bloque.
           Lo que la vuelve ventana son tres cosas: el derrame (el muro tiene
           espesor y se ve), el parteluz que la parte en hojas, y que el
           cristal deje ver de verdad lo que hay adentro. */
        const jamb = HOUSE.t + 0.05
        return (
          <group key={`o${i}`} position={[o.at, cy, 0]}>
            {/* cristal, hundido hacia el interior */}
            <mesh geometry={G.box} material={mats.glass} scale={[o.w - 0.02, oh - 0.02, 0.02]} position={[0, 0, -0.03]} />

            {/* derrame: las cuatro caras del hueco */}
            <mesh geometry={G.box} material={mats.reveal} scale={[o.w + 0.02, 0.06, jamb]} position={[0, oh / 2 - 0.02, 0]} />
            <mesh geometry={G.box} material={mats.reveal} scale={[o.w + 0.02, 0.06, jamb]} position={[0, -oh / 2 + 0.02, 0]} />
            {[-1, 1].map((sd) => (
              <mesh
                key={sd}
                geometry={G.box}
                material={mats.reveal}
                scale={[0.06, oh, jamb]}
                position={[(sd * o.w) / 2 - sd * 0.02, 0, 0]}
              />
            ))}

            {/* marco exterior */}
            <mesh geometry={G.box} material={mats.frame} scale={[o.w + 0.14, 0.09, 0.09]} position={[0, oh / 2 + 0.03, jamb / 2]} />
            <mesh geometry={G.box} material={mats.frame} scale={[o.w + 0.14, 0.12, 0.16]} position={[0, -oh / 2 - 0.03, jamb / 2]} />
            {[-1, 1].map((sd) => (
              <mesh
                key={`j${sd}`}
                geometry={G.box}
                material={mats.frame}
                scale={[0.07, oh + 0.06, 0.09]}
                position={[(sd * (o.w + 0.07)) / 2, 0, jamb / 2]}
              />
            ))}

            {/* parteluz: divide en hojas, que es lo que hace que se lea ventana */}
            <mesh geometry={G.box} material={mats.frame} scale={[0.035, oh, 0.06]} position={[0, 0, -0.02]} />
            <mesh geometry={G.box} material={mats.frame} scale={[o.w, 0.03, 0.06]} position={[0, oh * 0.16, -0.02]} />
          </group>
        )
      })}
    </group>
  )
}

/* ── definición de muros ───────────────────────────────────────── */
const W0 = HOUSE.wall // 2.9 en planta baja
const W1 = 2.7 // planta alta, un poco más baja

const GROUND_WALLS = [
  {
    a: [-8, 5],
    b: [8, 5],
    normal: [0, 1],
    openings: [
      { at: -5.6, w: 3.4, y0: 0, y1: 2.4, hole: true }, // el portón va aparte
      { at: -1.0, w: 1.1, y0: 0, y1: 2.2, door: true },
      { at: 4.6, w: 2.8, y0: 0.9, y1: 2.45 },
    ],
  },
  {
    a: [-8, -5],
    b: [8, -5],
    normal: [0, -1],
    openings: [
      { at: 4.6, w: 2.4, y0: 0.9, y1: 2.45 },
      { at: -1.0, w: 0.9, y0: 1.5, y1: 2.35 },
      { at: -5.6, w: 1.2, y0: 0.9, y1: 2.45 },
    ],
  },
  { a: [-8, -5], b: [-8, 5], normal: [-1, 0], openings: [{ at: -2.0, w: 1.6, y0: 0.9, y1: 2.45 }] },
  {
    a: [8, -5],
    b: [8, 5],
    normal: [1, 0],
    openings: [
      { at: -2.5, w: 2.0, y0: 0.9, y1: 2.45 },
      { at: 2.8, w: 1.8, y0: 0.9, y1: 2.45 },
    ],
  },
]

const UPPER_WALLS = [
  // solo el tramo del pasillo: a los lados están el balcón y la terraza
  { a: [-3.2, 5], b: [1.2, 5], normal: [0, 1], openings: [{ at: -1.0, w: 1.4, y0: 0.9, y1: 2.3 }] },
  {
    a: [-8, -5],
    b: [8, -5],
    normal: [0, -1],
    openings: [
      { at: 4.6, w: 2.2, y0: 0.9, y1: 2.3, blinds: true },
      { at: -1.0, w: 0.8, y0: 1.5, y1: 2.2 },
      { at: -5.6, w: 1.8, y0: 0.9, y1: 2.3 },
    ],
  },
  { a: [-8, -5], b: [-8, -0.4], normal: [-1, 0], openings: [{ at: -2.7, w: 1.6, y0: 0.9, y1: 2.3 }] },
  { a: [8, -5], b: [8, 0.2], normal: [1, 0], openings: [{ at: -2.4, w: 1.8, y0: 0.9, y1: 2.3 }] },
]

/* ── losas y pisos ─────────────────────────────────────────────── */

function FloorPlates({ floor, y }) {
  return (
    <group>
      {Object.entries(ROOMS)
        .filter(([, r]) => r.floor === floor)
        .map(([id, r]) => (
          <mesh
            key={id}
            geometry={G.box}
            material={r.mat()}
            position={[(r.x[0] + r.x[1]) / 2, y + 0.01, (r.z[0] + r.z[1]) / 2]}
            scale={[r.x[1] - r.x[0], 0.02, r.z[1] - r.z[0]]}
            receiveShadow
          />
        ))}
    </group>
  )
}

/** Losa de entrepiso, partida para dejar el hueco de la escalera. */
function Slab({ y }) {
  const v = STAIR_VOID
  const pieces = [
    // franja al fondo del hueco
    { x: [-8, 8], z: [-5, v.z[0]] },
    // franja al frente
    { x: [-8, 8], z: [v.z[1], 5] },
    // a los lados del hueco
    { x: [-8, v.x[0]], z: v.z },
    { x: [v.x[1], 8], z: v.z },
  ]
  return (
    <group>
      {pieces.map((p, i) => (
        <mesh
          key={i}
          geometry={G.box}
          material={M.slab}
          position={[(p.x[0] + p.x[1]) / 2, y - HOUSE.slab / 2, (p.z[0] + p.z[1]) / 2]}
          scale={[p.x[1] - p.x[0], HOUSE.slab, p.z[1] - p.z[0]]}
          receiveShadow
        />
      ))}
    </group>
  )
}

/** Muros interiores: nunca se desvanecen. Son el fondo de cada cuarto. */
function Partitions({ y, h, runs }) {
  return (
    <group>
      {runs.map((r, i) => {
        const len = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1])
        return (
          <mesh
            key={i}
            geometry={G.box}
            material={r.mat ?? M.wallIn}
            position={[(r.a[0] + r.b[0]) / 2, y + h / 2, (r.a[1] + r.b[1]) / 2]}
            rotation={[0, -Math.atan2(r.b[1] - r.a[1], r.b[0] - r.a[0]), 0]}
            scale={[len, h, 0.12]}
            castShadow
            receiveShadow
          />
        )
      })}
    </group>
  )
}

const GROUND_PARTS = [
  // garage | recibidor
  { a: [-3.2, 0.6], b: [-3.2, 5] },
  // recibidor | sala (con vano de paso al centro)
  { a: [1.2, 2.6], b: [1.2, 5] },
  { a: [1.2, 0.6], b: [1.2, 1.5] },
  // sala | cocina
  { a: [1.2, 0.6], b: [5.2, 0.6] },
  { a: [6.4, 0.6], b: [8, 0.6] },
  // baño
  { a: [-3.2, -1.8], b: [-0.2, -1.8] },
  { a: [1.2, -5], b: [1.2, -1.8] },
  // cubo de escalera
  { a: [-3.2, -5], b: [-3.2, -0.6] },
]

const UPPER_PARTS = [
  // recámara | balcón (el hueco es la corrediza)
  { a: [1.2, 0.2], b: [3.4, 0.2] },
  { a: [5.8, 0.2], b: [8, 0.2] },
  // pasillo | balcón
  { a: [1.2, 0.2], b: [1.2, 5] },
  // pasillo | terraza
  { a: [-3.2, -0.4], b: [-3.2, 5] },
  // baño principal
  { a: [-3.2, -1.2], b: [-0.4, -1.2] },
  { a: [1.2, -5], b: [1.2, -1.2] },
  // estudio | pasillo
  { a: [-3.2, -5], b: [-3.2, -0.4] },
  { a: [-8, -0.4], b: [-3.2, -0.4] },
]

/* ── planta alta ───────────────────────────────────────────────── */

/**
 * Todo el nivel superior vive en un grupo que se levanta y se desvanece.
 * Levantado = axonometría explotada del capítulo del corte; desvanecido =
 * quitado de en medio para poder ver la planta baja.
 */
function UpperFloor() {
  const group = useRef()
  const y = LEVEL_Y[1]

  useFrame(() => {
    if (!group.current) return
    group.current.position.y = scrollState.lift * 5.2
    group.current.visible = scrollState.up > 0.02
  })

  return (
    <group ref={group}>
      <Slab y={y} />
      <FloorPlates floor={1} y={y} />
      <Partitions y={y} h={1.9} runs={UPPER_PARTS} />

      {UPPER_WALLS.map((w, i) => (
        <WallRun key={i} {...w} y={y} h={W1} upper />
      ))}

      {/* barandales del balcón y la terraza */}
      <Railing position={[4.6, y, 4.94]} length={6.8} />
      <Railing position={[7.94, y, 2.6]} rotation={[0, Math.PI / 2, 0]} length={4.8} />
      <Railing position={[-5.6, y, 4.94]} length={4.8} />
      <Railing position={[-7.94, y, 2.3]} rotation={[0, Math.PI / 2, 0]} length={5.4} />
      {/* protección del hueco de escalera */}
      <Railing position={[(STAIR_VOID.x[0] + STAIR_VOID.x[1]) / 2, y, STAIR_VOID.z[0]]} length={2.0} />

      {/* Pérgola sobre el balcón: sombra, ritmo y una razón para que el
          balcón no sea una losa pelona. */}
      <group position={[4.6, y + 2.45, 2.6]}>
        <B p={[0, 0, -2.3]} s={[6.6, 0.16, 0.16]} m={M.woodDark} />
        <B p={[0, 0, 2.3]} s={[6.6, 0.16, 0.16]} m={M.woodDark} />
        {Array.from({ length: 11 }, (_, i) => (
          <B key={i} p={[-3.0 + i * 0.6, 0.02, 0]} s={[0.09, 0.13, 4.7]} m={M.woodDark} shadow={false} />
        ))}
        {[-3.2, 3.2].map((x) => (
          <B key={x} p={[x, -1.2, 2.3]} s={[0.14, 2.4, 0.14]} m={M.woodDark} />
        ))}
      </group>

      <Roof y={y + W1} />
      <Rooms floor={1} />
      <Hubs floor={1} />
    </group>
  )
}

/** Losa de azotea: solo sobre lo techado, y se va al abrir la casa. */
function Roof({ y }) {
  const ref = useRef()
  const mat = useMemo(() => {
    const m = M.roof.clone()
    m.transparent = true
    return m
  }, [])

  useFrame(() => {
    const c = scrollState.cut
    ref.current.position.y = y + 0.16 + c * 6
    mat.opacity = 1 - THREE.MathUtils.smoothstep(c, 0.05, 0.5)
    ref.current.visible = mat.opacity > 0.02
  })

  // el balcón y la terraza son descubiertos: la azotea los rodea
  const slabs = [
    { x: [-3.2, 1.2], z: [-5, 5] },
    { x: [1.2, 8.2], z: [-5.1, 0.2] },
    { x: [-8.2, -3.2], z: [-5.1, -0.4] },
  ]

  /* El alero es lo que quita el aire de caja de zapatos: una losa que vuela
     0.45 m con una banda de sombra debajo. Sin él la fachada termina en un
     canto plano y la casa se lee como un bloque. */
  return (
    <group ref={ref}>
      {slabs.map((s, i) => (
        <group key={i}>
          <mesh
            geometry={G.box}
            material={mat}
            position={[(s.x[0] + s.x[1]) / 2, 0, (s.z[0] + s.z[1]) / 2]}
            scale={[s.x[1] - s.x[0] + 0.9, 0.16, s.z[1] - s.z[0] + 0.9]}
            castShadow
          />
          {/* fascia: la línea oscura bajo el vuelo */}
          <mesh
            geometry={G.box}
            material={mat}
            position={[(s.x[0] + s.x[1]) / 2, -0.14, (s.z[0] + s.z[1]) / 2]}
            scale={[s.x[1] - s.x[0] + 0.5, 0.13, s.z[1] - s.z[0] + 0.5]}
          />
        </group>
      ))}
    </group>
  )
}

/* ── exterior ──────────────────────────────────────────────────── */

function Exterior() {
  const ref = useRef()

  useFrame(() => {
    // los árboles y la reja se retiran al abrir la casa para no estorbar
    const k = 1 - THREE.MathUtils.smoothstep(scrollState.cut, 0.3, 0.9) * 0.85
    ref.current.scale.setScalar(k)
    ref.current.visible = k > 0.2
  })

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.19, 0]}
        geometry={G.plane}
        material={M.terrain}
        scale={[140, 140, 1]}
        receiveShadow
      />

      {/* rampa de acceso al garage: es por donde entra el coche */}
      <mesh
        geometry={G.box}
        material={M.concrete}
        position={[-5.6, -0.14, 12]}
        scale={[4.2, 0.1, 16]}
        receiveShadow
      />

      <group ref={ref}>
        {/* andador a la puerta principal */}
        {Array.from({ length: 5 }, (_, i) => (
          <B key={i} p={[-1.0, -0.13, 5.9 + i * 0.9]} s={[1.2, 0.06, 0.62]} m={M.ceramic} shadow={false} />
        ))}

        {/* arbotantes de fachada */}
        {/* dos arbotantes, una sola luz real: la segunda no aportaba nada
            que el emisivo y el bloom no den ya */}
        {[-3.9, 0.9].map((x, i) => (
          <group key={x} position={[x, 0, HOUSE.z + 0.16]}>
            <B p={[0, 2.1, 0]} s={[0.1, 0.34, 0.09]} m={M.metal} shadow={false} />
            <mesh position={[0, 2.1, 0.06]} scale={[0.07, 0.26, 0.02]} geometry={G.box} material={M.bulb} />
            {i === 0 && (
              /* colocado en el arbotante mismo, entre el portón y la puerta:
                 baña las dos cosas que se ven en el primer capítulo */
              <pointLight position={[-0.6, 2.0, 0.9]} intensity={9} distance={11} decay={1.7} color="#ffab63" />
            )}
          </group>
        ))}

        {[
          [-12.5, 7.5, 1.6],
          [11.5, 6.5, 1.25],
          [10.8, -7.5, 1.45],
          [-12.0, -5.5, 1.1],
        ].map(([x, z, s], i) => (
          <group key={i} position={[x, 0, z]} scale={s}>
            <mesh position={[0, 0.9, 0]} scale={[0.24, 1.8, 0.24]} geometry={G.cyl} material={M.woodDark} castShadow />
            <mesh position={[0, 2.4, 0]} scale={[1.9, 2.1, 1.9]} geometry={G.ico} material={M.foliage} castShadow />
            <mesh position={[0.55, 1.8, 0.35]} scale={[1.1, 1.2, 1.1]} geometry={G.ico} material={M.foliage} castShadow />
          </group>
        ))}

        {/* reja al frente, con el hueco de la entrada de coches */}
        <group position={[0, 0, 16]}>
          {Array.from({ length: 30 }, (_, i) => {
            const x = -15 + i
            if (x > -8 && x < -3.2) return null // por aquí entra el coche
            return <B key={i} p={[x, 0.55, 0]} s={[0.06, 1.1, 0.06]} m={M.metal} shadow={false} />
          })}
        </group>

        {[-2.6, 0.6, 3.4, 6.2].map((x, i) => (
          <mesh
            key={i}
            position={[x, 0.25, HOUSE.z + 1.2]}
            scale={[0.8, 0.5, 0.65]}
            geometry={G.ico}
            material={M.foliage}
            castShadow
          />
        ))}
      </group>
    </>
  )
}

export default function House() {
  return (
    <group>
      <Exterior />
      <Car />

      {/* planta baja */}
      <B p={[0, -0.1, 0]} s={[16.4, 0.2, 10.4]} m={M.slab} />
      <FloorPlates floor={0} y={0} />
      <Partitions y={0} h={2.0} runs={GROUND_PARTS} />
      {GROUND_WALLS.map((w, i) => (
        <WallRun key={i} {...w} y={0} h={W0} />
      ))}

      <GarageDoor position={[-5.6, 0, HOUSE.z]} w={3.4} h={2.4} />

      {/* Marquesina sobre la entrada: un volumen que sale del plano de
          fachada y le da profundidad al frente. */}
      <group position={[-1.0, 0, HOUSE.z + 0.9]}>
        <B p={[0, 2.5, 0]} s={[4.0, 0.18, 1.9]} m={M.roof} />
        <B p={[0, 2.36, 0]} s={[3.6, 0.12, 1.5]} m={M.roof} shadow={false} />
        {[-1.7, 1.7].map((x) => (
          <B key={x} p={[x, 1.2, 0.8]} s={[0.12, 2.4, 0.12]} m={M.metal} />
        ))}
      </group>

      {/* Celosía de madera sobre la fachada del garage: rompe el paño ciego
          más grande de la casa, que es justo el que se ve desde la calle. */}
      <SlatWall position={[-5.6, 2.45, HOUSE.z + 0.1]} w={4.4} h={0.4} count={44} />
      <Stairs position={[-5.9, 0, -3.6]} steps={16} rise={0.194} run={0.26} w={1.3} />

      <Rooms floor={0} />
      <Hubs floor={0} />

      <UpperFloor />
    </group>
  )
}
