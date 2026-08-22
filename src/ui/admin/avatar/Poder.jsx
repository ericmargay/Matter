import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { INVOCACION } from './estados'

/**
 * La invocación: el personaje llama una joya a la palma de su mano.
 *
 * Es la única secuencia escrita a mano de todo el sistema y vale la pena que
 * lo sea, porque una invocación es una FRASE con gramática y no un efecto:
 *
 *   anticipa → sube → abre → aparece → pulso → aura → asienta
 *
 * Lo que la hace sentirse poderosa no es la luz, es la anticipación. Todo
 * movimiento con fuerza empieza en la dirección contraria: el cuerpo se hunde
 * antes de que el brazo suba. Sin ese hundimiento el gesto se ve ligero por
 * más partículas que se le echen encima, y con él funciona incluso sin
 * ninguna.
 *
 * La segunda cosa que la hace funcionar es que NADA termina a la vez. La joya
 * aparece antes del pulso, el pulso antes del aura, el aura se apaga mientras
 * el cuerpo todavía se está asentando. Cuando todo acaba en el mismo cuadro se
 * siente a animación; escalonado se siente a consecuencia.
 */
export default function Poder({ partes, activo, onFin }) {
  const joya = useRef()
  const halo = useRef()
  const aura = useRef()
  const luz = useRef()
  const brillo = useRef()
  const polvo = useRef()
  const avisado = useRef(false)
  /* El reloj arranca cuando arranca la invocación, no en el origen de los
     tiempos. Midiendo desde el cero absoluto de la escena, la secuencia ya
     estaba "terminada" desde el primer cuadro y no se veía nada. */
  const t0 = useRef(null)
  const anclaje = useRef()

  const H = INVOCACION.hitos
  const J = INVOCACION.joya

  /* Las partículas nacen en una esfera alrededor de la palma y caen HACIA la
     joya, no salen de ella. Es la diferencia entre una explosión y una
     invocación: en una invocación la energía se junta. */
  const chispas = useMemo(() => {
    const n = INVOCACION.particulas
    const desde = new Float32Array(n * 3)
    const fase = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const b = Math.acos(2 * Math.random() - 1)
      const r = 0.22 + Math.random() * 0.3
      desde[i * 3] = Math.sin(b) * Math.cos(a) * r
      desde[i * 3 + 1] = Math.cos(b) * r * 0.7
      desde[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r
      fase[i] = Math.random()
    }
    return { n, desde, fase }
  }, [])

  /* El degradado del halo se genera aquí y no se carga: son 64 pixeles y
     traerlos de un archivo sería una petición de red por un puñado de bytes. */
  const degradado = useMemo(() => {
    const n = 64
    const c = document.createElement('canvas')
    c.width = c.height = n
    const g = c.getContext('2d')
    const rad = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2)
    rad.addColorStop(0, 'rgba(255,255,255,1)')
    rad.addColorStop(0.35, 'rgba(255,255,255,0.45)')
    rad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = rad
    g.fillRect(0, 0, n, n)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  const geoPolvo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(chispas.n * 3), 3))
    return g
  }, [chispas])

  const base = useRef(new Map())
  const guardar = (o) => {
    if (!o) return null
    if (!base.current.has(o)) base.current.set(o, o.quaternion.clone())
    return base.current.get(o)
  }
  const poner = (o, x, y, z) => {
    const r = guardar(o)
    if (!r) return
    EULER.set(x, y, z)
    QUAT.setFromEuler(EULER)
    o.quaternion.copy(r).multiply(QUAT)
  }

  useFrame((st) => {
    const grupo = anclaje.current
    if (!grupo) return

    const mano0 = partes?.manoDer ?? partes?.manoIzq
    if (mano0 && grupo.parent) {
      mano0.getWorldPosition(POS)
      grupo.parent.worldToLocal(POS)
      grupo.position.copy(POS)
    }

    if (!activo) {
      grupo.visible = false
      avisado.current = false
      t0.current = null
      return
    }
    if (t0.current === null) t0.current = st.clock.elapsedTime
    grupo.visible = true

    const t = st.clock.elapsedTime - t0.current
    if (t > INVOCACION.dura) {
      if (!avisado.current) {
        avisado.current = true
        onFin?.()
      }
      grupo.visible = false
      return
    }

    const tramo = (a, b) => THREE.MathUtils.clamp((t - a) / (b - a), 0, 1)
    const suave = (x) => x * x * (3 - 2 * x)
    const golpe = (x) => 1 - Math.pow(1 - x, 4)

    /* ── el cuerpo ──
       Se mueve aunque el archivo no traiga clip de invocación: así la secuencia
       existe desde el primer día y el clip, cuando llegue, solo la mejora. */
    const hundir = suave(tramo(H.anticipa, H.sube)) * (1 - suave(tramo(H.sube, H.abre)))
    const subir = suave(tramo(H.sube, H.aparece))
    const asentar = suave(tramo(H.pulso, H.asienta))

    if (partes?.cadera) poner(partes.cadera, hundir * 0.12, 0, 0)
    if (partes?.pecho) poner(partes.pecho, hundir * 0.14 - subir * 0.16, subir * 0.1, 0)
    if (partes?.cabeza) {
      /* La cara reacciona TARDE: primero mira abajo con el hundimiento, y
         levanta la vista a la joya cuando ya apareció. Mirarla desde antes
         arruina la sorpresa, que es lo único que hay que cuidar aquí. */
      const mira = suave(tramo(H.aparece, H.pulso))
      poner(partes.cabeza, hundir * 0.25 - mira * 0.3, 0, 0)
    }
    const mano = partes?.manoDer ?? partes?.manoIzq
    if (mano) poner(mano, -subir * 1.5 - asentar * 0.2, 0, subir * 0.3)

    /* ── la joya ── */
    const j = joya.current
    if (j) {
      const nace = golpe(tramo(H.aparece, H.pulso))
      const flota = Math.sin(t * 2.1) * J.flota + Math.sin(t * 1.31) * J.flota * 0.4
      j.scale.setScalar(nace * (1 + Math.sin(t * 9) * 0.03 * (1 - asentar)))
      j.position.y = 0.16 + flota * (0.3 + asentar * 0.7)
      j.rotation.y = t * Math.PI * 2 * J.giro
      j.rotation.x = Math.sin(t * 0.9) * 0.25
    }

    /* `p` (el avance del pulso) se calcula ANTES de que nadie lo use: el halo
       lo necesita y estaba leyéndolo desde arriba, lo que en JavaScript no es
       un valor viejo sino un error que tira la escena entera. */
    const p = tramo(H.pulso, H.pulso + 0.45)

    if (brillo.current) {
      const nace2 = golpe(tramo(H.aparece, H.pulso))
      brillo.current.material.opacity = nace2 * (0.5 + (1 - p) * 0.5) * (1 - suave(tramo(H.asienta, H.fin)) * 0.4)
      const s2 = 0.28 + nace2 * 0.14 + (p > 0 && p < 1 ? (1 - p) * 0.5 : 0)
      brillo.current.scale.set(s2, s2, 1)
      brillo.current.position.y = joya.current?.position.y ?? 0.16
    }

    /* ── el pulso ──
       Un anillo que se abre y se desvanece. Dura un cuarto de segundo: más
       tiempo y deja de ser un golpe para volverse un efecto. */
    if (halo.current) {
      const abre = golpe(p)
      halo.current.scale.setScalar(0.05 + abre * 1.1)
      halo.current.material.opacity = (1 - p) * 0.7
      halo.current.visible = p > 0 && p < 1
    }
    if (luz.current) {
      /* Contenida a propósito. Un pulso que lava la escena entera deja de ser
         un destello y se vuelve un fundido a blanco: se pierde justo lo que se
         quería enseñar, que es la joya y la cara del personaje mirándola. */
      const brote = golpe(tramo(H.aparece, H.pulso)) * 0.35 + (1 - p) * (p > 0 ? 0.9 : 0)
      luz.current.intensity = Math.max(0, brote) * 0.9
    }

    /* ── el aura ── */
    if (aura.current) {
      const a = suave(tramo(H.aura, H.aura + 0.6)) * (1 - suave(tramo(H.asienta, H.fin)))
      aura.current.material.opacity = a * 0.22
      aura.current.scale.setScalar(0.9 + a * 0.35 + Math.sin(t * 3.4) * 0.02)
      aura.current.visible = a > 0.01
    }

    /* ── las chispas ── */
    if (polvo.current) {
      const atrae = tramo(H.abre, H.pulso)
      const pos = geoPolvo.attributes.position.array
      for (let i = 0; i < chispas.n; i++) {
        const f = chispas.fase[i]
        // cada chispa llega en su momento: todas juntas se ven a manguera
        const k = THREE.MathUtils.clamp((atrae - f * 0.35) / 0.65, 0, 1)
        const caida = suave(k)
        const orbita = t * (1.2 + f) * (1 - caida * 0.7)
        const rx = chispas.desde[i * 3]
        const ry = chispas.desde[i * 3 + 1]
        const rz = chispas.desde[i * 3 + 2]
        const c = Math.cos(orbita)
        const s = Math.sin(orbita)
        pos[i * 3] = (rx * c - rz * s) * (1 - caida)
        pos[i * 3 + 1] = 0.16 + ry * (1 - caida)
        pos[i * 3 + 2] = (rx * s + rz * c) * (1 - caida)
      }
      geoPolvo.attributes.position.needsUpdate = true
      const vivo = tramo(H.abre, H.pulso) * (1 - suave(tramo(H.pulso + 0.2, H.asienta)))
      polvo.current.material.opacity = vivo
      polvo.current.visible = vivo > 0.01
    }
  })

  /* Sigue a la mano copiando su posición cada cuadro, NO colgándose de ella.
     Un `primitive` con un objeto que ya está en la escena lo REPARENTA: la
     mano se salía del cuerpo y se iba con la joya, que es tan absurdo como
     suena. */
  const contenido = (
    <group ref={anclaje} visible={false}>
      {/* El resplandor va detrás y siempre de cara: una joya de siete
          centímetros a cuatro metros son cuatro pixeles, y sin halo no se ve
          por más que brille. */}
      <sprite ref={brillo} position={[0, 0.16, 0]} scale={[0.34, 0.34, 1]}>
        <spriteMaterial
          map={degradado}
          color={J.brillo}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <mesh ref={joya} position={[0, 0.16, 0]}>
        <octahedronGeometry args={[J.tam, 0]} />
        <meshStandardMaterial
          color={J.color}
          emissive={J.brillo}
          emissiveIntensity={2.4}
          roughness={0.15}
          metalness={0.1}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* el anillo del pulso, de cara a la cámara */}
      <mesh ref={halo} position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.085, 40]} />
        <meshBasicMaterial color={J.brillo} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <points ref={polvo} geometry={geoPolvo}>
        <pointsMaterial
          size={0.016}
          color={J.brillo}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      <pointLight ref={luz} color={J.color} distance={2.4} decay={2} intensity={0} position={[0, 0.16, 0]} />
    </group>
  )

  return (
    <>
      {contenido}

      {/* El aura envuelve al personaje entero, así que cuelga de la raíz y no
          de la mano: pegada a la mano se movería con el brazo, y un aura que
          se bambolea deja de ser un aura. */}
      <mesh ref={aura} visible={false} position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.75, 24, 18]} />
        <meshBasicMaterial
          color={J.color}
          transparent
          opacity={0}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  )
}

const POS = new THREE.Vector3()
const EULER = new THREE.Euler()
const QUAT = new THREE.Quaternion()
