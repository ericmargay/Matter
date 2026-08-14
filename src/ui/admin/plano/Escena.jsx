import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

import { MUEBLES } from './catalogo'
import { kelvinAColor } from './luz'

/**
 * El plano del cuarto, en 3D.
 *
 * Dos decisiones que valen la pena explicar:
 *
 * — **Los muros se dibujan por dentro** (`side: BackSide`). Al mirar desde
 *   afuera, la cara que estorba no se dibuja y se ve el cuarto por dentro sin
 *   tener que esconder muros a mano ni recortar nada. Es el truco de casa de
 *   muñecas, y cuesta una línea.
 *
 * — **La luz está en unidades reales.** `power` de three.js está en lúmenes,
 *   así que el dato del catálogo entra tal cual. Lo que se ve en pantalla es
 *   lo que van a dar esas piezas, no una interpretación.
 */

/* ── materiales del cascarón ──────────────────────────────────── */

const matMuro = new THREE.MeshStandardMaterial({
  color: '#6d6259',
  roughness: 0.95,
  side: THREE.BackSide, // ← el truco: la cara hacia la cámara no se dibuja
})

const matPiso = new THREE.MeshStandardMaterial({ color: '#5a5048', roughness: 0.9 })

/* ── cascarón ─────────────────────────────────────────────────── */

function Cuarto({ ancho, largo, alto }) {
  const t = 0.12
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={matPiso}>
        <planeGeometry args={[ancho, largo]} />
      </mesh>

      {/* una sola caja abierta: más barato que cuatro muros y siempre cierra */}
      <mesh position={[0, alto / 2, 0]} material={matMuro} receiveShadow>
        <boxGeometry args={[ancho + t, alto, largo + t]} />
      </mesh>

      <gridHelper args={[Math.max(ancho, largo), Math.round(Math.max(ancho, largo) * 2), '#3a332d', '#2a2521']} position={[0, 0.002, 0]} />
    </group>
  )
}

/* ── un mueble ────────────────────────────────────────────────── */

function Mueble({ item, seleccionado, onTomar }) {
  const def = MUEBLES[item.tipo]
  if (!def) return null
  const { Comp, w, d } = def

  return (
    <group
      position={[item.x, 0, item.z]}
      rotation={[0, item.rot ?? 0, 0]}
      onPointerDown={(e) => {
        e.stopPropagation()
        onTomar(item.id)
      }}
    >
      <Comp position={[0, 0, 0]} rotation={[0, 0, 0]} {...def.props} />
      {/* huella: es lo que se puede tomar con el puntero, y de paso la
          selección. Invisible pero presente para el raycaster. */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={seleccionado}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color="#ff9a4d" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.6, 0]} visible={false}>
        <boxGeometry args={[w, 1.2, d]} />
      </mesh>
    </group>
  )
}

/* ── un dispositivo levantado ─────────────────────────────────── */

function Equipo({ item, encendido, seleccionado, onTomar, modo, alto, conSombra }) {
  const p = item.params
  const luz = useRef()

  const color = useMemo(() => kelvinAColor(p?.k ?? 2700), [p?.k])

  // la potencia se resuelve cada frame: así el deslizador de brillo y el
  // simulador de reglas se ven al instante, sin reconstruir la escena
  useFrame(() => {
    if (!luz.current || !p) return
    const factor = encendido ? (p.brillo ?? 100) / 100 : 0
    luz.current.power = p.lm * factor
    luz.current.color.copy(color)
    luz.current.visible = factor > 0.01
  })

  const esFoco = !!p
  const dirigido = esFoco && p.haz < 140

  return (
    <group
      position={[item.x, item.y ?? 0, item.z]}
      onPointerDown={(e) => {
        e.stopPropagation()
        onTomar(item.id)
      }}
    >
      {/* el cuerpo del aparato: una marca chica, no un modelo. Lo que
          importa del dispositivo en el plano es dónde está y qué ilumina. */}
      <mesh castShadow>
        <sphereGeometry args={[esFoco ? 0.08 : 0.06, 12, 10]} />
        <meshStandardMaterial
          color={esFoco ? '#1a1613' : '#2a2521'}
          emissive={esFoco && encendido ? color : '#000000'}
          emissiveIntensity={esFoco && encendido ? 2.2 : 0}
        />
      </mesh>

      {esFoco &&
        (dirigido ? (
          <spotLight
            ref={luz}
            angle={THREE.MathUtils.degToRad(p.haz) / 2}
            penumbra={0.45}
            distance={0}
            decay={2}
            /* Solo las primeras proyectan sombra. Una oficina con 18
               empotrados pedía 18 mapas de sombra, y el shader deja de
               compilar: la escena entera salía en negro. La sombra aporta
               poco cuando hay muchas luces —se anulan entre sí— así que se
               reserva para las que sí cambian la lectura. */
            castShadow={modo === 'noche' && conSombra}
            shadow-mapSize={[512, 512]}
          />
        ) : (
          <pointLight ref={luz} distance={0} decay={2} castShadow={false} />
        ))}

      {/* varilla hasta el techo: sitúa la pieza en el aire de un vistazo.
          Va del aparato al plafón, no un metro fijo — con altura fija los
          empotrados parecían colgar de un cable larguísimo. */}
      {alto - (item.y ?? 0) > 0.06 && (
        <mesh position={[0, (alto - (item.y ?? 0)) / 2, 0]}>
          <cylinderGeometry args={[0.006, 0.006, alto - (item.y ?? 0), 6]} />
          <meshBasicMaterial color="#3a332d" />
        </mesh>
      )}

      <mesh position={[0, -(item.y ?? 0) + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={seleccionado}>
        <ringGeometry args={[0.18, 0.26, 24]} />
        <meshBasicMaterial color="#ff9a4d" transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ── enchufes y apagadores ────────────────────────────────────── */

const COLOR_PUNTO = { enchufe: '#7fa6ff', apagador: '#ffc48a', salida: '#8fd694' }

function Punto({ item, seleccionado, onTomar, activo }) {
  return (
    <group
      position={[item.x, item.y ?? 0.4, item.z]}
      onPointerDown={(e) => {
        e.stopPropagation()
        onTomar(item.id)
      }}
    >
      <mesh>
        <boxGeometry args={[0.09, 0.13, 0.03]} />
        <meshStandardMaterial
          color={COLOR_PUNTO[item.tipo] ?? '#9c9388'}
          emissive={activo ? COLOR_PUNTO[item.tipo] : '#000'}
          emissiveIntensity={activo ? 1.4 : 0}
        />
      </mesh>
      {seleccionado && (
        <mesh>
          <boxGeometry args={[0.16, 0.2, 0.06]} />
          <meshBasicMaterial color="#ff9a4d" wireframe />
        </mesh>
      )}
    </group>
  )
}

/* ── líneas eléctricas dentro del muro ────────────────────────── */

function Tramo({ tramo }) {
  const { de, a } = tramo
  const dx = a[0] - de[0]
  const dz = a[2] - de[2]
  const dy = a[1] - de[1]
  const largo = Math.hypot(dx, dy, dz)
  if (largo < 0.01) return null

  const medio = [(de[0] + a[0]) / 2, (de[1] + a[1]) / 2, (de[2] + a[2]) / 2]
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(dx, dy, dz).normalize(),
  )

  return (
    <mesh position={medio} quaternion={q}>
      <cylinderGeometry args={[0.012, 0.012, largo, 6]} />
      {/* se ve a través del muro a propósito: la instalación oculta es
          justo la que hay que poder mirar sin demoler nada */}
      <meshBasicMaterial color="#ff6b6b" depthTest={false} transparent opacity={0.85} />
    </mesh>
  )
}

/* ── plano invisible para arrastrar y colocar ─────────────────── */

function Suelo({ ancho, largo, onMover, onSoltar, onColocar, arrastrando, colocando }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      visible={false}
      onPointerMove={(e) => {
        if (!arrastrando) return
        e.stopPropagation()
        onMover(e.point.x, e.point.z)
      }}
      onPointerUp={onSoltar}
      onPointerDown={(e) => {
        if (colocando) {
          e.stopPropagation()
          onColocar(e.point.x, e.point.z)
        }
      }}
    >
      <planeGeometry args={[ancho * 3, largo * 3]} />
    </mesh>
  )
}

/* ── escena ───────────────────────────────────────────────────── */

export default function Escena({
  plano,
  seleccion,
  onSeleccionar,
  onMover,
  onColocar,
  colocando,
  encendidos,
  modo = 'noche',
}) {
  const { ancho, largo, alto } = plano
  const [arrastrando, setArrastrando] = useState(null)
  const orbita = useRef()

  const tomar = (id) => {
    onSeleccionar(id)
    setArrastrando(id)
    if (orbita.current) orbita.current.enabled = false
  }

  const soltar = () => {
    setArrastrando(null)
    if (orbita.current) orbita.current.enabled = true
  }

  const mover = (x, z) => {
    if (!arrastrando) return
    // no se deja salir del cuarto: un mueble fuera del muro no es un plano,
    // es un descuido que después nadie encuentra
    const lx = Math.max(-ancho / 2 + 0.15, Math.min(ancho / 2 - 0.15, x))
    const lz = Math.max(-largo / 2 + 0.15, Math.min(largo / 2 - 0.15, z))
    onMover(arrastrando, lx, lz)
  }

  const diagonal = Math.hypot(ancho, largo)

  /* Cuáles proyectan sombra: las primeras MAX_SOMBRAS luminarias dirigidas.
     Más allá de eso el costo sube y la imagen no mejora. */
  const MAX_SOMBRAS = 4
  const conSombra = useMemo(() => {
    const s = new Set()
    for (const it of plano.items) {
      if (s.size >= MAX_SOMBRAS) break
      if (it.clase === 'equipo' && it.params && it.params.haz < 140) s.add(it.id)
    }
    return s
  }, [plano.items])

  return (
    <Canvas
      shadows={modo === 'noche'}
      dpr={[1, 1.75]}
      camera={{ position: [diagonal * 0.75, diagonal * 0.8, diagonal * 0.75], fov: 42 }}
      onPointerMissed={() => onSeleccionar(null)}
      onPointerUp={soltar}
    >
      <color attach="background" args={['#0a0908']} />

      {/* de día entra luz pareja para revisar la traza; de noche manda lo
          que de verdad iluminan las piezas, que es la pregunta del plano */}
      {modo === 'dia' ? (
        <>
          <ambientLight intensity={2.2} />
          <directionalLight position={[6, 10, 4]} intensity={2.5} />
        </>
      ) : (
        <>
          <ambientLight intensity={0.06} />
          <hemisphereLight args={['#2a3550', '#120f0c', 0.12]} />
        </>
      )}

      <Cuarto ancho={ancho} largo={largo} alto={alto} />

      <Suelo
        ancho={ancho}
        largo={largo}
        onMover={mover}
        onSoltar={soltar}
        onColocar={onColocar}
        arrastrando={arrastrando}
        colocando={colocando}
      />

      {plano.items.map((it) => {
        const sel = it.id === seleccion
        if (it.clase === 'mueble') return <Mueble key={it.id} item={it} seleccionado={sel} onTomar={tomar} />
        if (it.clase === 'equipo')
          return (
            <Equipo
              key={it.id}
              item={it}
              seleccionado={sel}
              onTomar={tomar}
              encendido={encendidos?.has(it.id) ?? true}
              modo={modo}
              alto={alto}
              conSombra={conSombra.has(it.id)}
            />
          )
        return <Punto key={it.id} item={it} seleccionado={sel} onTomar={tomar} activo={encendidos?.has(it.id)} />
      })}

      {plano.tramos.map((t) => (
        <Tramo key={t.id} tramo={t} />
      ))}

      <OrbitControls
        ref={orbita}
        makeDefault
        enablePan
        maxPolarAngle={Math.PI / 2.05}
        minDistance={1.5}
        maxDistance={diagonal * 3}
        target={[0, alto * 0.35, 0]}
      />
    </Canvas>
  )
}
