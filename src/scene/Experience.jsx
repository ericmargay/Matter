import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA, N8AO } from '@react-three/postprocessing'
import * as THREE from 'three'

import House from './House'
import MeshNetwork from './MeshNetwork'
import Hotspots from './Hotspots'
import { HomeRuntime } from './home'
import { sampleCamera, CHAPTER_COUNT } from './chapters'
import { scrollState, useStore } from '../store/store'
import { ecosystems } from '../content/site'

/* ── cámara ─────────────────────────────────────────────────── */
const UP = new THREE.Vector3(0, 1, 0)

function CameraRig() {
  const want = useRef(new THREE.Vector3())
  const wantTarget = useRef(new THREE.Vector3())
  const at = useRef(new THREE.Vector3(16, 9.5, 18))
  const lookAt = useRef(new THREE.Vector3(0, 1.6, 0))
  const fwd = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  useFrame(({ camera, pointer, size }, dt) => {
    const s = sampleCamera(scrollState.progress, want.current, wantTarget.current)

    // el resto de la escena lee estos valores
    scrollState.cut = s.cut
    scrollState.up = s.up
    scrollState.lift = s.lift
    scrollState.net = s.net

    const portrait = size.height > size.width
    const dist = want.current.distanceTo(wantTarget.current)

    /* Parallax de mouse, también escalado: en un plano abierto 0.7 m es un
       gesto sutil; dentro de un baño de 4 m te saca por la pared. */
    const sway = THREE.MathUtils.clamp(dist / 18, 0.06, 1)
    want.current.x += pointer.x * 0.7 * sway
    want.current.y += pointer.y * 0.4 * sway

    /* El desplazamiento de encuadre se mide en metros, así que a 25 m de la
       casa mover 2 m no se nota y a 3 m de un mueble te mete dentro del
       muro. Se escala con la distancia: los capítulos inmersivos apenas se
       corren, los de maqueta se corren completo. */
    const escala = THREE.MathUtils.clamp(dist / 14, 0.12, 1)

    // en los cuartos la banda derecha la ocupa el centro de control, así
    // que el encuadre se centra entre los dos paneles en vez de empujar
    const f = scrollState.progress * (CHAPTER_COUNT - 1)
    const conPanel =
      THREE.MathUtils.smoothstep(f, 4.4, 5.0) * (1 - THREE.MathUtils.smoothstep(f, 11.0, 11.7))

    // con la tarjeta compacta basta un empujón chico; el de 2.1 m era
    // para el panel grande de antes y ahora descuadra los planos cerrados
    const pan = size.width >= 1024 ? THREE.MathUtils.lerp(-1.2, -0.7, conPanel) * escala : 0
    if (pan) {
      fwd.current.copy(wantTarget.current).sub(want.current).normalize()
      right.current.crossVectors(fwd.current, UP).normalize()
      want.current.addScaledVector(right.current, pan)
      wantTarget.current.addScaledVector(right.current, pan)
    }

    /* En vertical el panel de texto se come la parte baja. Bajamos cámara y
       objetivo a la par (traslación pura) para que la escena suba en cuadro,
       otra vez proporcional a la distancia. */
    if (portrait) {
      const bias = 2.0 * escala
      want.current.y -= bias
      wantTarget.current.y -= bias
    }

    // amortiguado independiente del framerate
    const k = 1 - Math.pow(0.0015, Math.min(dt, 0.05))
    at.current.lerp(want.current, k)
    lookAt.current.lerp(wantTarget.current, k)

    camera.position.copy(at.current)
    camera.lookAt(lookAt.current)

    /* El fov de three es vertical. En retrato eso recorta la casa a lo ancho,
       así que lo abrimos hasta conservar el mismo campo horizontal. */
    let fov = s.fov
    if (camera.aspect < 1) {
      const half = THREE.MathUtils.degToRad(fov) / 2
      fov = Math.min(70, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(half) / camera.aspect)))
    }

    if (Math.abs(camera.fov - fov) > 0.02) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, k)
      camera.updateProjectionMatrix()
    }
  })

  return null
}

/**
 * Compila los shaders antes del primer frame, pero sin congelar la página.
 *
 * `<Preload all />` de drei llama a gl.compile(), que es SÍNCRONO: con ~60
 * programas y una docena de luces eso son segundos de hilo principal
 * bloqueado — la página se ve cargada pero no responde a nada.
 *
 * compileAsync() usa KHR_parallel_shader_compile cuando el driver lo tiene,
 * así que la compilación ocurre en paralelo y solo esperamos el resultado.
 */
function Precompile() {
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    let vivo = true
    const listo = gl.compileAsync
      ? gl.compileAsync(scene, camera)
      : Promise.resolve().then(() => gl.compile(scene, camera))
    listo.then(() => vivo && useStore.getState().setReady(true))
    return () => {
      vivo = false
    }
  }, [gl, scene, camera])

  return null
}

/* ── luz ────────────────────────────────────────────────────── */
function Lighting({ shadows }) {
  const moon = useRef()
  const ambient = useRef()
  const warm = useRef()
  const accent = useRef()

  const ecosystem = useStore((s) => s.ecosystem)
  const tone = useMemo(
    () => new THREE.Color(ecosystems.find((e) => e.id === ecosystem)?.tone ?? '#ffffff'),
    [ecosystem],
  )

  useFrame((_, dt) => {
    // al entrar al capítulo de red la casa se apaga para que la malla mande
    const dim = 1 - scrollState.net * 0.72
    moon.current.intensity = 0.75 * dim
    ambient.current.intensity = 0.3 * (1 - scrollState.net * 0.4)

    /* Con la casa cerrada la luna pega por detrás y la fachada que ve la
       cámara queda a oscuras, así que el relleno cálido sube. Ya abierta,
       las luminarias de adentro hacen el trabajo y este relleno estorba. */
    warm.current.intensity = (0.95 - scrollState.cut * 0.5) * dim

    // el acento se tiñe del ecosistema seleccionado
    accent.current.color.lerp(tone, Math.min(1, dt * 3))
    accent.current.intensity = 0.5 + scrollState.net * 0.6
  })

  return (
    <>
      <ambientLight ref={ambient} intensity={0.3} color="#3a3550" />
      <hemisphereLight args={['#243350', '#0d0a07', 0.45]} />

      {/* luna: fría, alta y desde atrás. Es la que da los volúmenes. */}
      <directionalLight
        ref={moon}
        position={[-14, 16, -10]}
        intensity={0.75}
        color="#93a9d8"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-16, 16, 16, -16, 1, 55]} />
      </directionalLight>

      {/* relleno cálido desde el frente: simula la luz que sale de la casa */}
      <directionalLight ref={warm} position={[-5, 5, 16]} intensity={0.45} color="#ff9a4d" />

      {/* acento del ecosistema */}
      <directionalLight ref={accent} position={[6, 12, -12]} intensity={0.5} color="#ffffff" />
    </>
  )
}

/**
 * Mapa de entorno hecho a mano con lightformers.
 * Evita bajar un HDRI de un CDN (que además rompería si el sitio corre
 * detrás de una CSP estricta) y da reflejos decentes en metales y vidrio.
 */
function Studio() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer intensity={2.2} color="#ffb066" position={[0, 5, 9]} scale={[14, 8, 1]} />
      <Lightformer intensity={0.9} color="#5f7fd0" position={[-10, 7, -8]} scale={[12, 8, 1]} />
      <Lightformer intensity={0.5} color="#2a2438" position={[9, 4, -6]} scale={[10, 8, 1]} />
      <Lightformer intensity={1.1} color="#ffffff" form="ring" position={[0, 12, 0]} scale={6} rotation-x={Math.PI / 2} />
    </Environment>
  )
}

function Effects() {
  return (
    // el pase de normales lo pide la oclusión ambiental; cuesta un render
    // extra, pero es lo que mete sombra en las esquinas y bajo los muebles,
    // que es la diferencia entre "render" y "foto"
    <EffectComposer multisampling={0} enableNormalPass>
      <N8AO aoRadius={0.65} intensity={2.6} distanceFalloff={1.2} quality="medium" halfRes color="#0a0908" />
      <Bloom
        intensity={1.05}
        luminanceThreshold={0.45}
        luminanceSmoothing={0.35}
        mipmapBlur
        radius={0.72}
      />
      <Vignette offset={0.28} darkness={0.72} eskil={false} />
      <SMAA />
    </EffectComposer>
  )
}

export default function Experience({ active = true }) {
  const quality = useStore((s) => s.quality)
  const high = quality === 'high'

  return (
    <Canvas
      // cuando el recorrido sale de pantalla dejamos de gastar GPU
      frameloop={active ? 'always' : 'never'}
      dpr={high ? [1, 1.9] : [1, 1.25]}
      shadows={high ? 'soft' : false}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [-1.6, 2.7, 17.5], fov: 46, near: 0.08, far: 140 }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05
      }}
    >
      <color attach="background" args={['#0a0908']} />
      <fog attach="fog" args={['#0a0908', 26, 68]} />

      <HomeRuntime />

      <Suspense fallback={null}>
        <Lighting shadows={high} />
        {high && <Studio />}
        <House />
        <MeshNetwork />
        <Hotspots />
        <Precompile />
      </Suspense>

      <CameraRig />
      {high && <Effects />}
      <AdaptiveDpr pixelated={false} />
    </Canvas>
  )
}
