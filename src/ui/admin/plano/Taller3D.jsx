import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

import Cuarto3D from './Cuarto3D'
import Rig from './Rig'
import StyleLab from './StyleLab'
import { useEstilo, paletaDe } from './estilo'
import * as MB from './muebles'

/**
 * El taller de estilo: la Sala de Carpio como banco de pruebas.
 *
 * Se trabaja un solo espacio a propósito. Calibrar el lenguaje visual con seis
 * cuartos abiertos es imposible —cada cambio se juzga contra un promedio— y
 * además obliga a rehacer seis veces lo que todavía no está decidido. Cuando
 * esta sala convenza, sus números son los del sistema y los demás espacios se
 * modelan contra ellos.
 */

/**
 * El acomodo de la sala.
 *
 * Las posiciones se calculan contra las medidas reales del cuarto, no en
 * metros fijos: la primera versión tenía coordenadas absolutas y en una sala
 * de seis metros todo quedaba amontonado en el centro, flotando. Con
 * fracciones, el mismo acomodo funciona en una sala de 4 m y en una de 7.
 *
 * `pared` empuja la pieza contra el muro dejando el hueco que de verdad se
 * deja al acomodar —nadie pega un sofá al aplanado— y `alto` es para lo que
 * cuelga.
 */
function acomodo(ancho, largo) {
  const mx = ancho / 2
  const mz = largo / 2
  const pared = 0.12

  /* La cámara mira desde +X +Z, así que los muros que se quedan a la vista
     son el de atrás (-Z) y el de la izquierda (-X). Todo lo que se cuelga va
     ahí: una tele montada en un muro que se esconde queda flotando, que fue
     exactamente lo que pasó en la primera versión. */
  return [
    // el frente de tele contra el muro del fondo
    { id: 'muebleTv', Comp: MB.MuebleTv, props: { w: Math.min(2.0, ancho * 0.36) }, p: [-0.35, 0, -mz + 0.28 + pared], r: 0 },
    { id: 'pantalla', Comp: MB.Pantalla, props: { w: Math.min(1.55, ancho * 0.28) }, p: [-0.35, 1.42, -mz + 0.06], r: 0 },

    // la sala mirando hacia la tele
    { id: 'tapete', Comp: MB.Tapete, props: { w: ancho * 0.46, d: largo * 0.44 }, p: [-0.35, 0, 0.15], r: 0 },
    { id: 'mesaCentro', Comp: MB.MesaCentro, props: { w: 1.05, d: 0.6 }, p: [-0.35, 0, -0.05], r: 0 },
    { id: 'sofa', Comp: MB.Sofa, props: { w: Math.min(2.4, ancho * 0.42), d: 0.95 }, p: [-0.35, 0, mz - 0.85], r: Math.PI },

    // el muro de la izquierda: librero, arte y el rincón de lectura
    { id: 'librero', Comp: MB.Librero, props: { w: 1.1, alto: 1.65 }, p: [-mx + 0.2 + pared, 0, -mz + 1.3], r: Math.PI / 2 },
    { id: 'cuadro1', Comp: MB.Cuadro, props: { w: 0.62, h: 0.8, tono: 'acento' }, p: [-mx + 0.03, 1.6, 0.35], r: Math.PI / 2 },
    { id: 'cuadro2', Comp: MB.Cuadro, props: { w: 0.44, h: 0.54, tono: 'apoyo' }, p: [-mx + 0.03, 1.68, 1.15], r: Math.PI / 2 },
    { id: 'mesaLateral', Comp: MB.MesaLateral, props: {}, p: [-mx + 0.45, 0, mz - 1.5], r: 0 },
    { id: 'bocina', Comp: MB.Bocina, props: {}, p: [-mx + 0.45, 0.55, mz - 1.5], r: 0.5 },
    { id: 'lampara', Comp: MB.LamparaPie, props: { alto: 1.62 }, p: [-mx + 0.45, 0, mz - 0.7], r: 0 },

    // el rincón del fondo derecho, que es lo que se ve al entrar
    { id: 'planta', Comp: MB.Planta, props: { alto: 1.35 }, p: [mx - 0.7, 0, -mz + 0.6], r: 0 },
    { id: 'puf', Comp: MB.Puf, props: {}, p: [mx - 1.15, 0, 0.4], r: 0 },
  ]
}

/** Sigue a la cámara para que el cascarón esconda los muros correctos. */
function Camara({ onMover }) {
  const { camera } = useThree()
  const ultimo = useRef([1, 1])
  useFrame(() => {
    const x = Math.sign(camera.position.x)
    const z = Math.sign(camera.position.z)
    if (x !== ultimo.current[0] || z !== ultimo.current[1]) {
      ultimo.current = [x, z]
      onMover(x, z)
    }
  })
  return null
}

function Pieza({ item, seleccion, onTomar }) {
  const { Comp } = item
  const sel = seleccion === item.id
  return (
    <group
      position={item.p}
      rotation={[0, item.r, 0]}
      onPointerDown={(ev) => {
        ev.stopPropagation()
        onTomar(item.id)
      }}
    >
      <Comp {...item.props} />
      {/* la selección se marca con un halo en el piso, no con un contorno
          negro permanente: el brief pide que la separación la den la luz y la
          oclusión, y el outline solo aparezca al escoger */}
      {sel && (
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.5, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

export default function Taller3D({ cuarto, onCerrar }) {
  const e = useEstilo()
  const pal = paletaDe(e.paleta)
  const [cam, setCam] = useState([1, 1])
  const [seleccion, setSeleccion] = useState(null)
  const [lab, setLab] = useState(true)

  const ancho = cuarto?.ancho ?? 6.1
  const largo = cuarto?.largo ?? 4.6
  const alto = cuarto?.alto ?? 2.6
  const encuadre = useMemo(() => Math.hypot(ancho, largo) * 0.98, [ancho, largo])
  const piezas = useMemo(() => acomodo(ancho, largo), [ancho, largo])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <div>
          <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Taller de estilo 3D</p>
          <h2 className="display text-[19px] text-cream">{cuarto?.nombre ?? 'Sala'}</h2>
        </div>
        <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-cream-3">
          {ancho.toFixed(2)} × {largo.toFixed(2)} m · {piezas.length} piezas
        </span>
        {!lab && (
          <button
            onClick={() => setLab(true)}
            className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-cream-2 hover:border-ember"
          >
            Style Lab
          </button>
        )}
        <button
          onClick={onCerrar}
          className="ml-auto rounded-lg bg-ember px-4 py-1.5 text-[13px] font-medium text-ink hover:bg-ember-2"
        >
          Listo
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <Suspense fallback={<div className="grid h-full place-items-center text-[13px] text-cream-3">Cargando…</div>}>
            <Canvas
              shadows="soft"
              dpr={[1, 2]}
              gl={{ antialias: false, powerPreference: 'high-performance' }}
              camera={{ position: [encuadre * 0.85, encuadre * 0.8, encuadre * 0.85], fov: 34 }}
              onPointerMissed={() => setSeleccion(null)}
            >
              <color attach="background" args={[pal.muro]} />
              <Camara onMover={(x, z) => setCam([x, z])} />
              <Rig ancho={ancho} largo={largo} alto={alto} />
              <Cuarto3D ancho={ancho} largo={largo} alto={alto} camaraX={cam[0]} camaraZ={cam[1]} />

              {piezas.map((item) => (
                <Pieza key={item.id} item={item} seleccion={seleccion} onTomar={setSeleccion} />
              ))}

              <EffectComposer multisampling={0} enableNormalPass>
                {/* la oclusión es la que da la profundidad de maqueta; va
                    sutil para que las esquinas no se ensucien */}
                <N8AO
                  aoRadius={0.42}
                  intensity={e.ao * 1.6}
                  distanceFalloff={0.8}
                  quality="medium"
                  halfRes
                  color="#2a1f28"
                />
                <Bloom intensity={0.18} luminanceThreshold={0.92} luminanceSmoothing={0.3} mipmapBlur radius={0.6} />
                <Vignette offset={0.32} darkness={0.22} eskil={false} />
                <ToneMapping mode={ToneMappingMode.AGX} />
                <SMAA />
              </EffectComposer>

              <OrbitControls
                makeDefault
                enablePan
                maxPolarAngle={Math.PI / 2.15}
                minDistance={2}
                maxDistance={encuadre * 2.6}
                target={[0, alto * 0.32, 0]}
              />
            </Canvas>
          </Suspense>

          {seleccion && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-line bg-ink/92 px-3 py-1.5 text-[11.5px] text-cream-2 backdrop-blur">
              {seleccion}
            </div>
          )}
        </div>

        {lab && <StyleLab onCerrar={() => setLab(false)} />}
      </div>
    </div>
  )
}
