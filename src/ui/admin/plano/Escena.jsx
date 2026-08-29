import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, OrbitControls, Text, TransformControls } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

import { DEVICE_BY_ID } from '../../../content/catalog'

import { ID_MUROS, MUEBLES } from './catalogo'
import { GROSOR_MURO, piezaSeVe } from './muros'
import { altoDe, MUROS as MUROS_ANCLA } from './anclas'
import Animar from './animacion.jsx'
import PiezaPropia from './PiezaPropia'
import { Cable, Clavija, puntaCable } from './cables.jsx'
import { cableDeMueble, cablePorDefecto, llevaCable } from './cables'
import { puntoSalida } from './cables'
import Conexiones from './Conexiones'
import { DISPOSICION_BY_ID, DISPOSICIONES, LADO, posicionesDe, trianguloPanel } from './paneles'
import Cuarto3D from './Cuarto3D'
import Rig from './Rig'
import { fondoDe, useEstilo, paletaDe } from './estilo'
import { exposicionDe, kelvinAColor, parametrosIniciales } from './luz'

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

/* Un material por color: se cachean para no crear uno nuevo en cada cuadro.
   BackSide es el truco de casa de muñecas — la cara hacia la cámara no se
   dibuja y el cuarto se ve por dentro sin esconder muros a mano. */
/* El cascarón y la puesta de luz viven en el sistema de diseño (`Cuarto3D`
   y `Rig`): el editor los usa tal cual para que lo que se acomoda aquí se vea
   exactamente como se va a ver en la propuesta. Tener dos versiones del mismo
   cuarto —una para trabajar y otra para enseñar— era garantía de que se
   separaran. */

/** Avisa a qué cuadrante mira la cámara, para esconder los muros correctos. */
/**
 * Vuela la cámara hacia una pieza, sin girar alrededor de ella.
 *
 * Se acerca por el eje por el que ya se está mirando, no por uno "bonito"
 * calculado aparte: girar y acercar a la vez desorienta —se pierde de vista
 * qué se estaba mirando— mientras que acercarse en línea recta se lee como
 * inclinarse sobre la mesa.
 *
 * Cuando llega, avisa. Es la señal para cruzar al taller: si el taller
 * apareciera antes, la pieza saltaría de tamaño y de sitio, que es justo lo
 * que hace que una transición se sienta a corte y no a movimiento.
 */
function VolarA({ enfoque, onListo }) {
  const { camera, controls } = useThree()
  const meta = useRef(null)
  const aviso = useRef(false)

  useEffect(() => {
    if (!enfoque) {
      meta.current = null
      aviso.current = false
      return
    }
    /* Volver: la pose exacta de antes de entrar. Se guarda al salir hacia la
       pieza y se restituye al cerrar, porque nadie que entra a corregir una
       cama quiere volver a un encuadre distinto del que dejó. */
    if (enfoque.volver) {
      meta.current = {
        pos: new THREE.Vector3(...enfoque.volver.pos),
        mira: new THREE.Vector3(...enfoque.volver.mira),
        dir: null,
      }
      aviso.current = false
      return
    }
    const centro = new THREE.Vector3(enfoque.x, enfoque.y, enfoque.z)
    const dir = new THREE.Vector3().subVectors(camera.position, controls?.target ?? ORIGEN).normalize()
    const mira = centro.clone().setY(enfoque.y + enfoque.mira)


    meta.current = {
      pos: centro.clone().addScaledVector(dir, enfoque.dist).add(new THREE.Vector3().subVectors(mira, centro.clone().setY(enfoque.y + enfoque.mira))),
      mira,
      dir,
      desde: {
        pos: camera.position.toArray(),
        mira: (controls?.target ?? ORIGEN).toArray(),
      },
    }
    aviso.current = false
  }, [enfoque, camera, controls])

  useFrame((_, dt) => {
    const m = meta.current
    if (!m) return
    /* Suavizado exponencial, no lineal: arranca rápido y frena al llegar, que
       es como se mueve una cámara que alguien empuja con la mano. */
    const k = 1 - Math.pow(0.0016, dt)
    camera.position.lerp(m.pos, k)
    if (controls) {
      controls.target.lerp(m.mira, k)
      controls.update()
    }
    if (!aviso.current && camera.position.distanceTo(m.pos) < m.pos.length() * 0.02 + 0.05) {
      aviso.current = true
      onListo?.(m)
      /* Y SUELTA la cámara. Sin esto el vuelo seguía tirando de ella para
         siempre: se podía girar y acercar, pero la cámara volvía sola a la
         misma pose un instante después, así que se sentía como si el ratón no
         hiciera nada. Volar es un gesto con final. */
      meta.current = null
    }
  })

  return null
}

const ORIGEN = new THREE.Vector3()

/**
 * Disuelve el cuarto alrededor de una pieza, con niebla.
 *
 * Es el truco que hace que entrar al taller no se note. La niebla afecta a
 * TODOS los materiales del sistema sin tocar ninguno: se cierra hasta justo
 * detrás de la pieza y el cuarto entero —muros, piso, los otros muebles— se
 * funde con el fondo, mientras lo que está delante, que es la pieza a la que
 * ya se voló, se queda intacto.
 *
 * Cualquier otra forma de desvanecer pedía clonar materiales compartidos o
 * apagar mallas de golpe. Esto es una línea por cuadro y funciona con lo que
 * haya en el cuarto, incluso con lo que se dibuje mañana.
 *
 * Y de paso deja la escena EXACTAMENTE como se ve en el taller —una pieza
 * sobre fondo plano— así que cuando se cruza no hay nada que cambiar.
 */
function Disolver({ activo, centro, dist, color, onListo }) {
  const { scene } = useThree()
  const t = useRef(0)
  const aviso = useRef(false)
  const previa = useRef(undefined)

  useEffect(() => {
    if (previa.current === undefined) previa.current = scene.fog
    if (!activo) {
      t.current = 0
      aviso.current = false
      scene.fog = previa.current ?? null
    }
    return () => {
      scene.fog = previa.current ?? null
    }
  }, [activo, scene])

  useFrame((_, dt) => {
    if (!activo || !centro) return
    t.current = Math.min(1, t.current + dt / 0.75)
    const k = 1 - Math.pow(1 - t.current, 3) // frena al llegar

    /* De "sin niebla" a "niebla que empieza justo detrás de la pieza". El
       radio de la pieza se respeta siempre: si el frente entrara en la
       niebla, se desvanecería justo lo que se quiere conservar. */
    const cerca = THREE.MathUtils.lerp(dist * 6, dist * 0.72, k)
    const lejos = THREE.MathUtils.lerp(dist * 12, dist * 1.25, k)
    if (!scene.fog) scene.fog = new THREE.Fog(color, cerca, lejos)
    scene.fog.color.set(color)
    scene.fog.near = cerca
    scene.fog.far = lejos

    if (!aviso.current && t.current >= 1) {
      aviso.current = true
      onListo?.()
    }
  })

  return null
}

/** La mesa del taller, apareciendo bajo la pieza mientras el cuarto se va. */
function MesaTaller({ activo, centro, r, color }) {
  const m = useRef()
  const t = useRef(0)

  useFrame((_, dt) => {
    const o = m.current
    if (!o) return
    t.current = THREE.MathUtils.clamp(t.current + (activo ? dt / 0.6 : -dt / 0.3), 0, 1)
    o.visible = t.current > 0.01
    o.scale.setScalar(0.6 + t.current * 0.4)
    o.material.opacity = t.current
  })

  if (!centro) return null
  return (
    <mesh ref={m} position={[centro.x, 0.004, centro.z]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <circleGeometry args={[r, 48]} />
      <meshStandardMaterial color={color} roughness={0.9} transparent opacity={0} />
    </mesh>
  )
}

function SeguirCamara({ onMover }) {
  const { camera } = useThree()
  const ultimo = useRef([1, 1])
  useFrame(() => {
    const x = Math.sign(camera.position.x) || 1
    const z = Math.sign(camera.position.z) || 1
    if (x !== ultimo.current[0] || z !== ultimo.current[1]) {
      ultimo.current = [x, z]
      onMover(x, z)
    }
  })
  return null
}

/* ── contorno ─────────────────────────────────────────────────── */

/**
 * La caja que dice qué pieza tienes debajo del puntero.
 *
 * Primero lo intenté con el efecto `Outline` del postproceso —el glow de
 * contorno— y no dibuja nada: se pelea con el paso de normales que necesita la
 * oclusión ambiental. Da igual, porque mirando otra vez la referencia, lo que
 * marca la pieza ahí tampoco es un glow: es una caja de aristas. Y para un
 * plano es mejor, porque además de decir *cuál* es, dice *cuánto ocupa* — que
 * en un levantamiento es la mitad de la pregunta.
 *
 * `depthTest` apagado a propósito: la caja de un sensor metido tras un mueble
 * tiene que verse igual, si no lo que está tapado nunca se puede tomar.
 */

/* ── las tres medidas de la pieza seleccionada ─────────────────── */

const CAJA = new THREE.Box3()
const CAJA_TMP = new THREE.Box3()
const MAT_INV = new THREE.Matrix4()

/**
 * Mide una pieza de verdad, no por su ficha.
 *
 * La huella que hay en el catálogo (`w`, `d`, `alto`) sirve para avisar si algo
 * cabe, pero no es lo que se DIBUJA: un Apple TV tiene ficha de 34 cm y en la
 * escena mide nueve. Poner esos números en una cota sería mentir con dos
 * decimales, así que se recorre la geometría ya montada y se mide lo que
 * efectivamente está puesto.
 *
 * Se mide en el marco de la propia pieza —invirtiendo su matriz— y no en el
 * del mundo: la caja envolvente de un mueble girado 30° en coordenadas del
 * mundo es más grande que el mueble, y diría 1.80 donde dice 1.40.
 */
function medirObjeto(obj) {
  if (!obj) return null
  obj.updateWorldMatrix(true, true)
  MAT_INV.copy(obj.matrixWorld).invert()
  CAJA.makeEmpty()

  obj.traverse((o) => {
    /* Se mide la PIEZA, no lo que le colgamos encima para trabajar: la
       varilla que la ata al plafón, el aro del piso, las cotas mismas. Sin
       esta criba, un Apple TV medía 2.48 m de alto —la varilla— y 52 cm de
       ancho, que es el diámetro del aro. */
    if (!o.isMesh || !o.geometry || o.userData.cota || o.userData.ayuda || o.visible === false) return
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox()
    CAJA_TMP.copy(o.geometry.boundingBox).applyMatrix4(MAT_INV.clone().multiply(o.matrixWorld))
    CAJA.union(CAJA_TMP)
  })

  if (CAJA.isEmpty()) return null
  return {
    w: CAJA.max.x - CAJA.min.x,
    h: CAJA.max.y - CAJA.min.y,
    d: CAJA.max.z - CAJA.min.z,
    min: CAJA.min.clone(),
    max: CAJA.max.clone(),
  }
}

/** Centímetros abajo de un metro, metros arriba. Es como se dicta en obra. */
const enMedida = (m) => (m < 1 ? `${Math.round(m * 100)} cm` : `${m.toFixed(2)} m`)

/**
 * Una cota chica: línea con topes y el número encima.
 *
 * Va sobre el eje X local; girando el grupo se usa para las tres direcciones.
 * El número se pega a la cámara con `Billboard` porque si no, en cuanto se
 * orbita medio giro, las tres cifras quedan al revés.
 */
const HSL_LUZ = { h: 0, s: 0, l: 0 }
const PUNTO_TXT = new THREE.Vector3()
const LOCAL_CAM = new THREE.Vector3()
const PX_TEXTO = 11 // altura del número en pantalla, en píxeles

/**
 * Un número de cota: de pie, del mismo tamaño en pantalla y por encima de todo.
 *
 * Las tres cosas son la misma decisión. En un plano de obra la cifra no se
 * acuesta, no cambia de tamaño al acercarse y no la tapa nada — si la tapa el
 * muro que está midiendo, no mide.
 */
function Rotulo({ texto, opacidad = 1, arriba = 0.9, px = PX_TEXTO }) {
  const g = useRef()

  useFrame(({ camera, size }) => {
    const o = g.current
    if (!o) return
    o.getWorldPosition(PUNTO_TXT)
    const d = camera.position.distanceTo(PUNTO_TXT)
    const altoMundo = 2 * Math.tan(((camera.fov ?? 42) * Math.PI) / 360) * d
    o.scale.setScalar((altoMundo * px) / size.height)
  })

  return (
    <Billboard ref={g}>
      <Text
        position={[0, arriba, 0]}
        fontSize={1}
        anchorX="center"
        anchorY="middle"
        renderOrder={7}
        /* Contorno blanco, no negro. Sobre paleta pastel el negro metía un
           borde sucio alrededor de cada cifra; el blanco la separa del muro
           sin ensuciarla y de paso la vuelve legible también sobre madera
           oscura. */
        outlineWidth={0.07}
        outlineColor="#6b7285"
      >
        {texto}
        {/* Blanco con un halo gris tenue. El color se queda en la LÍNEA de la
            cota, que es lo que distingue una medida activa de una anotación;
            el número solo tiene que leerse. Y el halo no es adorno: sobre un
            piso de mármol o porcelánico —que son casi blancos— una cifra
            blanca sin halo desaparece. */}
        <meshBasicMaterial
          attach="material"
          color="#ffffff"
          opacity={opacidad}
          transparent
          depthTest={false}
          toneMapped={false}
        />
      </Text>
    </Billboard>
  )
}

function Regla({ largo, texto, grueso, color = '#4d9fff' }) {
  if (largo < 0.02) return null
  const mat = <meshBasicMaterial color={color} depthTest={false} toneMapped={false} />

  return (
    <group userData={{ cota: true }}>
      <mesh renderOrder={5} userData={{ cota: true }}>
        <boxGeometry args={[largo, grueso, grueso]} />
        {mat}
      </mesh>
      {[1, -1].map((sg) => (
        <mesh key={sg} position={[(sg * largo) / 2, 0, 0]} renderOrder={5} userData={{ cota: true }}>
          <sphereGeometry args={[grueso * 1.8, 10, 8]} />
          {mat}
        </mesh>
      ))}
      <Rotulo texto={texto} arriba={0.9} />
    </group>
  )
}

/**
 * Las tres medidas de lo que está seleccionado: ancho, fondo y alto.
 *
 * Solo con algo seleccionado. Puestas siempre serían una maraña de números
 * sobre veinte piezas, y el plano se lee peor con más datos que con menos: lo
 * que hace falta es la medida de la pieza que se está acomodando, justo
 * mientras se acomoda.
 */
function useMedidaPieza(id, item) {
  const { scene } = useThree()
  const [caja, setCaja] = useState(null)

  /* Piezas que se miden por ficha y no recorriendo la geometría. */
  const fija = useMemo(() => {
    const def = item?.clase === 'mueble' ? MUEBLES[item.tipo] : null
    if (!def?.medidaFija) return null
    const e = item.esc ?? 1
    const w = def.w * e
    const d = def.d * e
    const h = def.alto * e
    return {
      w,
      h,
      d,
      min: new THREE.Vector3(-w / 2, 0, -d / 2),
      max: new THREE.Vector3(w / 2, h, d / 2),
    }
  }, [item])

  /* Se vuelve a medir en cada cuadro mientras está seleccionada: escalar o
     cambiar el montaje cambia el tamaño, y una cota que no sigue a la pieza es
     peor que ninguna. Es una pieza, no veinte. */
  useFrame(() => {
    if (!id || fija) {
      if (caja) setCaja(null)
      return
    }
    const m = medirObjeto(scene.getObjectByName(id))
    if (!m) return
    if (!caja || Math.abs(m.w - caja.w) > 0.002 || Math.abs(m.h - caja.h) > 0.002 || Math.abs(m.d - caja.d) > 0.002)
      setCaja(m)
  })

  return fija ?? caja
}

/**
 * Todo lo que aparece por estar seleccionado: la caja justa, las tres medidas
 * y el gizmo.
 *
 * Va junto porque comparte una sola cosa: cuánto mide la pieza de verdad. El
 * mismo número que se le enseña al cliente es el que decide qué tan grandes
 * salen las flechas del gizmo. Y tiene que vivir DENTRO del canvas: medir es
 * recorrer la escena montada, y fuera no hay escena que recorrer.
 */
function Seleccion({ item, items, plano, modo, onParchar, onFin }) {
  const caja = useMedidaPieza(item.id, item)
  const mayor = caja ? Math.max(caja.w, caja.h, caja.d) : 1

  return (
    <>
      <CotasPieza item={item} caja={caja} />
      {modo && (
        <Gizmo
          item={item}
          items={items}
          plano={plano}
          modo={modo}
          onParchar={onParchar}
          onFin={onFin}
          tamano={Math.min(0.9, Math.max(0.38, 0.34 + mayor * 0.45))}
        />
      )}
    </>
  )
}

/**
 * Los cables de alimentación del cuarto.
 *
 * Solo los de las piezas a las que se les dio cable en el taller: dibujar el
 * cable de cada cosa enchufada de una casa sería una maraña que no dice nada.
 * Los que están puestos son los que alguien decidió que importan —la lámpara
 * que no alcanza, la tele que hay que ranurar— y ésos sí hay que ver.
 *
 * El contacto se elige a mano o se toma el más cercano, que es lo que va a
 * pasar en la obra si nadie decide otra cosa.
 */
/**
 * Los cables de alimentación del cuarto.
 *
 * Los lleva TODO lo que se enchufa, no solo lo que alguien configuró: un plano
 * donde la mitad de los aparatos no tiene cable enseña una casa que no existe.
 * El cable de fábrica sale del tipo de aparato —1.5 m lo de mesa, 1.8 las
 * lámparas de piso, 1.2 las teles y los electrodomésticos, que es justo por lo
 * que nunca alcanzan— y se corrige en el taller de la pieza.
 *
 * Conectar es de dos clics: se toma la clavija y se pica el contacto. Dos
 * clics y no un arrastre a propósito — arrastrar un objeto de cinco
 * centímetros en perspectiva es puntería, y esto se usa con un trackpad en la
 * sala de alguien.
 */
/**
 * Cuál de las piezas apiladas bajo el puntero se selecciona.
 *
 * Un clic sobre el monitor también atraviesa el panel que tiene detrás, pero
 * gana el que está más cerca de la cámara y el de atrás se vuelve
 * inseleccionable: había que orbitar hasta encontrar un ángulo donde asomara.
 *
 * Así que picar dos veces en el mismo lugar va PASANDO por lo que hay debajo,
 * como en cualquier editor 3D. Si el puntero se movió, se empieza otra vez por
 * el de enfrente, que es lo que uno espera al picar en otro lado.
 */
const apilado = { x: -99, y: -99, ids: '', i: 0 }

function elegirBajoPuntero(e, propio) {
  const ids = []
  for (const golpe of e.intersections ?? []) {
    let o = golpe.object
    let ayuda = false
    while (o && !o.userData?.pieza) {
      if (o.userData?.ayuda) ayuda = true
      o = o.parent
    }
    const id = o?.userData?.pieza
    if (!ayuda && id && !ids.includes(id)) ids.push(id)
  }
  if (ids.length <= 1) return propio

  const firma = ids.join('|')
  const mismoSitio = Math.hypot(e.clientX - apilado.x, e.clientY - apilado.y) < 8
  apilado.i = mismoSitio && apilado.ids === firma ? (apilado.i + 1) % ids.length : 0
  apilado.x = e.clientX
  apilado.y = e.clientY
  apilado.ids = firma
  return ids[apilado.i]
}

const ARRIBA = new THREE.Vector3(0, 1, 0)

/** Un número estable entre 0 y 1 a partir del id. Mismo cable, mismo azar. */
function semillaDe(id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000
  return (h % 1000) / 1000
}

/**
 * Hacia dónde mira un contacto: hacia adentro del cuarto.
 *
 * Los contactos van pegados a un muro, así que el eje en el que están más
 * lejos del centro es el muro donde están. No se guarda su giro en el plano y
 * tampoco hace falta: la geometría lo dice sola.
 */
const MIRA_MURO = {
  'x-': new THREE.Vector3(1, 0, 0),
  'x+': new THREE.Vector3(-1, 0, 0),
  'z-': new THREE.Vector3(0, 0, 1),
  'z+': new THREE.Vector3(0, 0, -1),
}

function haciaAdentro(p) {
  /* Si el contacto sabe en qué muro vive, ése manda. Adivinar por la geometría
     falla justo en los cuartos alargados: un contacto en el muro del fondo pero
     muy hacia un costado tiene más |x| que |z|, así que se le calculaba el muro
     equivocado y salía mirando de lado — con su clavija y su cable apuntando a
     ninguna parte. */
  const m = p.ancla?.a === 'muro' ? MIRA_MURO[p.ancla.muro] : null
  if (m) return m.clone()
  return Math.abs(p.x) >= Math.abs(p.z)
    ? new THREE.Vector3(-Math.sign(p.x) || 1, 0, 0)
    : new THREE.Vector3(0, 0, -Math.sign(p.z) || 1)
}

/* Las tres entradas del adaptador plegable: una en cada canto lateral y una
   abajo. NINGUNA de frente — ésa es la gracia de esta pieza. Un adaptador
   normal mete la clavija hacia el cuarto y ahí se atora contra el mueble que
   se le arrimó; éste se pliega para que las tres salgan hacia los lados y
   hacia abajo, pegadas al muro, y el sofá quede contra la pared sin que nada
   le estorbe.

   `normal` es hacia dónde mira la boca, en el espacio LOCAL del adaptador
   (x = a lo ancho, y = arriba, z = hacia el cuarto). Con eso se calculan solas
   la posición en el canto y la rotación de la ranura — no hay que repetir la
   cuenta tres veces con signos distintos. */
const BOCAS = [
  { id: 'izq', normal: new THREE.Vector3(-1, 0, 0) },
  { id: 'der', normal: new THREE.Vector3(1, 0, 0) },
  { id: 'abajo', normal: new THREE.Vector3(0, -1, 0) },
]

/**
 * El adaptador plano de tres vías que va en cada contacto de la casa.
 *
 * Es de las piezas más útiles y de las que nadie se acuerda de cotizar: un
 * contacto da dos tomas y siempre hacen falta tres, y sobre todo, la clavija
 * de este adaptador se pliega. Eso es lo que permite que un mueble o un sofá
 * queden pegados al muro sin doblar cables ni separarlo diez centímetros.
 *
 * Se dibuja en TODOS los contactos y no sólo donde hay algo enchufado: es como
 * entregamos la instalación, y verlo en el plano es lo que hace que se cotice.
 */
/* Medio cuerpo del adaptador, para no repetir la cifra en cada boca. */
const AD_HW = 0.033
const AD_HH = 0.0215
const AD_HD = 0.007

/**
 * La ranura de una boca, ya orientada hacia su `normal`.
 *
 * Se dibuja mirando a +z y se rota para que esa cara termine viendo hacia
 * `normal`: así izq, der y abajo comparten el mismo dibujo y sólo cambia hacia
 * dónde se les da vuelta.
 */
function Boca({ boca }) {
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), boca.normal),
    [boca.normal],
  )
  // el centro de la boca queda en el canto que le toca, apenas hundido
  const centro = boca.normal.clone().multiply(new THREE.Vector3(AD_HW, AD_HH, AD_HD)).addScaledVector(boca.normal, -0.001)

  return (
    <group position={centro.toArray()} quaternion={quat.toArray()}>
      {[-0.0035, 0.0035].map((d) => (
        <mesh key={d} position={[d, 0, 0]}>
          <boxGeometry args={[0.0018, 0.008, 0.0016]} />
          <meshStandardMaterial color="#2a2e38" />
        </mesh>
      ))}
    </group>
  )
}

/**
 * El adaptador plano de tres vías que va en cada contacto de la casa.
 *
 * Es de las piezas más útiles y de las que nadie se acuerda de cotizar: un
 * contacto da dos tomas y siempre hacen falta tres, y sobre todo, la clavija
 * de este adaptador se pliega. Eso es lo que permite que un mueble o un sofá
 * queden pegados al muro sin doblar cables ni separarlo diez centímetros.
 *
 * Se dibuja en TODOS los contactos y no sólo donde hay algo enchufado: es como
 * entregamos la instalación, y verlo en el plano es lo que hace que se cotice.
 */
function Adaptador({ punto }) {
  const dentro = haciaAdentro(punto)
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dentro)
  const pos = new THREE.Vector3(punto.x, punto.y ?? 0.4, punto.z).addScaledVector(dentro, 0.023)

  return (
    <group position={pos.toArray()} quaternion={quat.toArray()}>
      {/* el cuerpo: 6.6 × 4.3 × 1.4 cm, como el de verdad */}
      <mesh castShadow>
        <boxGeometry args={[AD_HW * 2, AD_HH * 2, AD_HD * 2]} />
        <meshStandardMaterial color="#e8e6e1" roughness={0.55} />
      </mesh>
      {/* Sus propias patas, metidas en el contacto. Sin ellas el adaptador se
          veía pegado a la pared por arte de magia; son plegables y por eso van
          rectas hacia atrás cuando está puesto. */}
      {[-1, 1].map((sg) => (
        <mesh key={`p${sg}`} position={[sg * 0.008, 0, -AD_HD]}>
          <boxGeometry args={[0.005, 0.012, 0.0014]} />
          <meshStandardMaterial color="#c9b48a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* las tres bocas: izquierda, derecha y abajo. Ninguna de frente. */}
      {BOCAS.map((b) => (
        <Boca key={b.id} boca={b} />
      ))}
    </group>
  )
}

/* Un nanoleaf no tiene un centro por donde salga el cable: es un mosaico de
   triángulos y el cable de verdad sale por atrás de uno de ellos, el de más
   abajo, como en cualquier instalación real. Buscar ese triángulo y salir por
   su orilla inferior evita el cable flotando encima del panel y naciendo del
   centro del arreglo, que es donde no hay ningún triángulo. */
function salidaPanel(item) {
  const disposicion = DISPOSICION_BY_ID[item.params?.disposicion] ?? DISPOSICIONES[0]
  const piezas = posicionesDe(disposicion, LADO)
  const abajo = piezas.reduce((a, b) => (b.y < a.y ? b : a), piezas[0])
  const h = (Math.sqrt(3) / 2) * LADO

  const local = new THREE.Vector3(abajo.x, abajo.y - h / 2, -0.015)
  local.applyAxisAngle(new THREE.Vector3(0, 1, 0), item.rot ?? 0)
  return new THREE.Vector3(item.x + local.x, (item.y ?? 0) + local.y, item.z + local.z)
}

/* Lo que está PARADO sobre un mueble —un monitor, un Apple TV, la regleta—
   no deja caer su cable donde está: un cable no atraviesa la cubierta del
   escritorio. Primero corre por ENCIMA de la mesa hasta la orilla contra el
   muro, y de ahí para abajo, que es exactamente cómo se acomoda de verdad y
   además lo deja escondido detrás del mueble en vez de colgando a la vista
   por el frente. */
function bordeDeAnfitrion(item, items) {
  if (item.ancla?.a !== 'mueble') return null
  const host = items.find((i) => i.id === item.ancla.id)
  if (!host || host.clase !== 'mueble') return null
  const def = MUEBLES[host.tipo]
  if (!def) return null
  const variante = def.variantes?.find((v) => v.id === host.variante)
  const d = variante?.props?.d ?? def.d ?? 0.4
  const rot = host.rot ?? 0
  const lx = item.ancla.lx ?? 0
  const lz = -d / 2 + 0.03
  const x = host.x + lx * Math.cos(rot) + lz * Math.sin(rot)
  const z = host.z - lx * Math.sin(rot) + lz * Math.cos(rot)
  return new THREE.Vector3(x, item.y ?? 0, z)
}

function Cables({ items, cuarto, enMano, onTomarClavija, onGuiarCable, onAgarrarCable, onSoltarCable }) {
  const enchufes = useMemo(
    () => items.filter((i) => i.clase === 'punto' && (i.tipo === 'enchufe' || i.tipo === 'salida')),
    [items],
  )
  /* Todo lo que se enchufa lleva cable, sea nuestro o no.
     La mitad de los cables de una casa no salen de un aparato que vendimos:
     salen de la lámpara, de la tele y del refri, y van a un contacto normal o
     a un multicontacto de los de toda la vida. Dibujar sólo los de lo
     instalado enseñaba una casa que no existe, y escondía justo el desorden
     que el cliente nos paga por resolver. */
  const conCable = useMemo(
    () =>
      items
        .map((i) => {
          if (i.cable) return { it: i, cable: i.cable }
          if (i.clase === 'equipo') {
            const d = DEVICE_BY_ID[i.deviceId]
            return llevaCable(d) ? { it: i, cable: cablePorDefecto(d) } : null
          }
          return MUEBLES[i.tipo]?.enchufa ? { it: i, cable: cableDeMueble(i.tipo) } : null
        })
        .filter(Boolean),
    [items],
  )

  /* A qué contacto va cada cable y en qué boca del adaptador queda.
     Sin repartirlos, tres clavijas del mismo contacto se dibujaban una encima
     de otra y parecía una sola. */
  const destinos = useMemo(() => {
    const usados = new Map()
    return conCable.map(({ it, cable }) => {
      const destino =
        enchufes.find((e) => e.id === cable.enchufe) ??
        (enchufes.length
          ? enchufes.reduce((a, b) =>
              Math.hypot(b.x - it.x, b.z - it.z) < Math.hypot(a.x - it.x, a.z - it.z) ? b : a,
            )
          : null)
      if (!destino) return { it, cable, destino: null, boca: 0 }
      const n = usados.get(destino.id) ?? 0
      usados.set(destino.id, n + 1)
      return { it, cable, destino, boca: n % BOCAS.length }
    })
  }, [conCable, enchufes])

  if (enchufes.length === 0) return null

  return (
    <>
      {enchufes
        .filter((e) => e.tipo === 'enchufe')
        .map((e) => (
          <Adaptador key={`ad-${e.id}`} punto={e} />
        ))}

      {destinos.map(({ it, cable, destino, boca }) => {
        if (!destino) return null
        const dentro = haciaAdentro(destino)
        // el ancho del adaptador corre perpendicular al muro, sobre el piso
        const ancho = new THREE.Vector3(-dentro.z, 0, dentro.x)
        const b = BOCAS[boca]

        /* Dónde cae la boca en el mundo: se arma con las mismas tres
           direcciones que usa el propio adaptador —ancho, arriba, dentro—
           multiplicadas por cuánto se corre en cada una, que es lo que dice
           `normal`. Es la misma cuenta que hace <Boca>, sólo que aquí hace
           falta el resultado en coordenadas del mundo y no del adaptador. */
        const centroAdaptador = new THREE.Vector3(destino.x, destino.y ?? 0.4, destino.z).addScaledVector(
          dentro,
          0.023,
        )
        const bocaMundo = centroAdaptador
          .clone()
          .addScaledVector(ancho, b.normal.x * AD_HW)
          .addScaledVector(ARRIBA, b.normal.y * AD_HH)
          .addScaledVector(dentro, b.normal.z * AD_HD)
        const normalMundo = ancho
          .clone()
          .multiplyScalar(b.normal.x)
          .addScaledVector(ARRIBA, b.normal.y)
          .addScaledVector(dentro, b.normal.z)

        /* La clavija se acerca desde AFUERA de la boca, con las patas mirando
           hacia adentro. 22 mm es cuánto mide del centro a la punta de la
           pata, así que ahí es donde la pata toca la ranura. */
        const clavija = bocaMundo.clone().addScaledVector(normalMundo, 0.022)
        const quat = new THREE.Quaternion().setFromUnitVectors(ARRIBA, normalMundo.clone().negate())
        /* El cable no termina en el CENTRO de la clavija: termina donde
           cuelga la punta de su cuello, que —a diferencia del cuerpo— siempre
           apunta hacia abajo sin importar de qué lado entró a la boca. Sin
           esto, la curva llegaba al centro de una pieza que podía estar
           mirando de canto, y el primer tramo del cable salía apuntando al
           muro en vez de para abajo. */
        const puntaClavija = puntaCable(clavija.toArray(), quat.toArray())

        const esPanel = it.clase === 'equipo' && DEVICE_BY_ID[it.deviceId]?.luz?.forma === 'panel'
        const desde = esPanel ? salidaPanel(it) : puntoSalida(it, null, cable.salida)
        const borde = esPanel ? null : bordeDeAnfitrion(it, items)
        /* Si el cable no da, se dibuja en rojo. Es la conversación que hay que
           tener en el plano y no con el aparato ya montado en el muro. */
        const alcanza = cable.largo >= desde.distanceTo(puntaClavija) * 1.05

        return (
          <group key={it.id}>
            <Cable
              desde={desde}
              hasta={puntaClavija}
              borde={borde}
              largo={cable.largo}
              ruta={cable.ruta}
              alcanza={alcanza}
              guia={cable.guia ?? null}
              semilla={semillaDe(it.id)}
              cuarto={cuarto}
              onGuiar={onGuiarCable ? (x, z) => onGuiarCable(it.id, x, z) : undefined}
              onAgarrar={onAgarrarCable}
              onSoltar={onSoltarCable}
            />
            <Clavija
              pos={[clavija.x, clavija.y, clavija.z]}
              quat={quat.toArray()}
              enMano={enMano === it.id}
              onTomar={() => onTomarClavija?.(enMano === it.id ? null : it.id)}
            />
          </group>
        )
      })}
    </>
  )
}

/** Suelta un id que ya no corresponde a ninguna pieza: se borra lo que está
 *  bajo el puntero y el hover se queda apuntando a un fantasma. */
function SoltarFantasma({ id, items, onSoltar }) {
  const vivo = !id || items.some((i) => i.id === id)
  useEffect(() => {
    if (!vivo) onSoltar()
  }, [vivo, onSoltar])
  return null
}

/** La caja del tamaño que la pieza ocupa de verdad, no el de su ficha. */
function CajaJusta({ caja, color, opacidad = 0.95 }) {
  const { w, h, d, min, max } = caja
  return (
    <lineSegments
      position={[(min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2]}
      renderOrder={4}
      userData={{ cota: true }}
    >
      <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
      <lineBasicMaterial color={color} transparent opacity={opacidad} depthTest={false} toneMapped={false} />
    </lineSegments>
  )
}

/**
 * El resalte de lo que está bajo el puntero.
 *
 * Se mide igual que la selección para que las dos cajas digan lo mismo: una
 * caja de hover más grande que la de selección sobre la misma pieza se lee
 * como un error, y encima invita a picarle donde no hay nada.
 */
function Realce({ item }) {
  const caja = useMedidaPieza(item?.id, item)
  if (!item || !caja) return null
  return (
    <group
      position={[item.x, item.y ?? (item.clase === 'punto' ? 0.4 : 0), item.z]}
      rotation={[0, item.rot ?? 0, 0]}
      scale={item.esc ?? 1}
    >
      <CajaJusta caja={caja} color="#5eead4" opacidad={0.6} />
    </group>
  )
}

function CotasPieza({ item, caja }) {
  const raiz = useRef()
  const anchoRef = useRef()
  const fondoRef = useRef()
  const altoRef = useRef()

  /* Las tres cotas se separan de la caja lo que haga falta EN PANTALLA, no en
     metros. Con una separación en metros, en un Apple TV de nueve centímetros
     las tres líneas caían una encima de otra y los tres números se encimaban
     en un borrón ilegible. Ahora se apartan al menos treinta píxeles, midan lo
     que midan y se vea desde donde se vea. */
  useFrame(({ camera, size }) => {
    const g = raiz.current
    if (!g || !caja) return
    g.getWorldPosition(PUNTO_TXT)
    const dist = camera.position.distanceTo(PUNTO_TXT)
    const porPixel = (2 * Math.tan(((camera.fov ?? 42) * Math.PI) / 360) * dist) / size.height
    const esc = item.esc ?? 1
    const mayor = Math.max(caja.w, caja.h, caja.d)
    const sep = Math.max(mayor * 0.09, (porPixel * 30) / esc)
    const { min, max } = caja

    /* De qué lado está la cámara, en el marco de la PIEZA. La pieza gira con
       su `rot`, así que "la derecha" no es la misma dirección del mundo para
       una cama que para el escritorio que está girado un cuarto de vuelta: hay
       que preguntárselo a la pieza, no al mundo. */
    LOCAL_CAM.copy(camera.position)
    g.worldToLocal(LOCAL_CAM)
    const sx = LOCAL_CAM.x >= 0 ? 1 : -1
    const sz = LOCAL_CAM.z >= 0 ? 1 : -1
    const ladoX = sx > 0 ? max.x + sep : min.x - sep
    const ladoZ = sz > 0 ? max.z + sep : min.z - sep
    const lejosZ = sz > 0 ? min.z : max.z

    /* Mismo reparto que en el cuarto: el ancho al frente, el fondo al costado
       derecho y la ALTURA al costado, en el extremo lejano. Puesta en la
       arista de enfrente, la altura caía justo encima del gizmo —flechas y
       cifra peleándose el mismo pixel— que es donde uno está trabajando.
       A la altura de la base y nunca por debajo: bajo el piso la cota queda
       tapada por el propio piso y el número desaparece. */
    anchoRef.current?.position.set((min.x + max.x) / 2, min.y, ladoZ)
    fondoRef.current?.position.set(ladoX, min.y, (min.z + max.z) / 2)
    altoRef.current?.position.set(ladoX, (min.y + max.y) / 2, lejosZ)
  })

  if (!caja) return null
  const { w, h, d } = caja
  const grueso = Math.max(0.003, Math.max(w, h, d) * 0.006)

  return (
    <group
      ref={raiz}
      position={[item.x, item.y ?? (item.clase === 'punto' ? 0.4 : 0), item.z]}
      rotation={[0, item.rot ?? 0, 0]}
      scale={item.esc ?? 1}
    >
      <CajaJusta caja={caja} color="#4d9fff" />

      {/* ancho, al frente y abajo */}
      <group ref={anchoRef}>
        <Regla largo={w} texto={enMedida(w)} grueso={grueso} />
      </group>
      {/* fondo, al costado y abajo */}
      <group ref={fondoRef} rotation={[0, Math.PI / 2, 0]}>
        <Regla largo={d} texto={enMedida(d)} grueso={grueso} />
      </group>
      {/* alto, en la arista de enfrente */}
      <group ref={altoRef} rotation={[0, 0, Math.PI / 2]}>
        <Regla largo={h} texto={enMedida(h)} grueso={grueso} />
      </group>
    </group>
  )
}


/* ── sombras ──────────────────────────────────────────────────── */

/**
 * Marca todo lo que cuelga de un grupo para que proyecte sombra.
 *
 * Los muebles son componentes ajenos —los mismos del recorrido— y no reciben
 * `castShadow` por prop. Recorrer el subárbol una vez al montar sale más
 * barato que tocar cada primitiva de cada mueble, y así un mueble nuevo
 * proyecta sombra sin que nadie se acuerde de ponérselo.
 */
function useSombras(ref) {
  useLayoutEffect(() => {
    ref.current?.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
  })
}

/* ── un mueble ────────────────────────────────────────────────── */

function Mueble({ item, seleccionado, onTomar, colocando, onEncima, aLaVista = true }) {
  const g = useRef()
  useSombras(g)

  const def = MUEBLES[item.tipo]
  /* Una pieza propia no tiene componente: son sus partes. Puede venir sola
     —dada de alta desde cero— o de haber horneado una del catálogo, y en los
     dos casos manda ella sobre el tipo. */
  const propia = item.pieza
  if (!def && !propia) return null
  const Comp = def?.Comp
  /* La versión elegida se mezcla encima de las props de base. Es un objeto
     plano a propósito: así una variante puede cambiar solo la silueta (`v`) o
     también la medida (`w`, `largo`) sin que el renderizador sepa de cuál se
     trata. */
  const variante = def?.variantes?.find((x) => x.id === item.variante)
  /* Base, encima la versión elegida y encima lo ajustado a mano en el taller.
     El mismo orden que usa el taller para enseñarla: si aquí y allá no fuera
     igual, el taller mostraría una pieza y el plano dibujaría otra. */
  const props = { ...def?.props, ...(variante?.props ?? {}), ...(item.ajustes ?? {}) }
  if (item.tipo === 'avatar') props.avatar = item.avatar
  const w = props.w ?? item.huella?.w ?? def?.w ?? 0.4
  const d = props.d ?? item.huella?.d ?? def?.d ?? 0.4

  return (
    <group
      name={item.id}
      userData={{ pieza: item.id }}
      ref={g}
      /* Lo que cuelga de un muro se va con su muro. Mirando desde el sur, la
         ventana del sur queda entre la cámara y el cuarto: dibujarla ahí es un
         cuadro flotando delante de la escena. */
      visible={aLaVista}
      position={[item.x, item.y ?? 0, item.z]}
      rotation={[0, item.rot ?? 0, 0]}
      scale={item.esc ?? 1}
      onPointerOver={(e) => {
        e.stopPropagation()
        onEncima(item.id)
      }}
      onPointerOut={() => onEncima(null)}
      onPointerDown={(e) => {
        /* Colocando, el clic tiene que llegar al piso: si un mueble lo
           intercepta, seleccionarlo en vez de soltar la pieza se siente roto
           —uno ya decidió qué poner y dónde. */
        if (colocando) return
        e.stopPropagation()
        onTomar(elegirBajoPuntero(e, item.id))
      }}
    >
      {/* Las piezas del sistema nuevo se dibujan sin `position`/`rotation`:
          ya vienen colocadas por el grupo de arriba. Las viejas siguen
          pidiéndolos hasta que les toque migrar. */}
      {/* Lo que se mueve, se mueve aquí adentro: envolver la pieza y no el
          grupo de arriba deja intactas su posición y su rotación en el plano.
          Meciendo el grupo de arriba, mover una planta la sacaba de sitio. */}
      <Animar tipo={item.animacion ?? 'ninguna'} semilla={item.id?.length ?? 0}>
        {propia ? (
          <PiezaPropia pieza={propia} />
        ) : def.Nuevo ? (
          <Comp {...props} />
        ) : (
          <Comp position={[0, 0, 0]} rotation={[0, 0, 0]} {...props} />
        )}
      </Animar>
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

/**
 * El volumen del dispositivo según qué es.
 *
 * No son modelos: son primitivas con la proporción correcta. Lo caro de un
 * modelo real no se paga con nada aquí —el aparato mide diez centímetros en un
 * cuarto de cuatro metros— pero la SILUETA sí se distingue, y es lo que
 * permite leer el plano sin leyenda.
 */
/**
 * Paneles triangulares, con su secuencia.
 *
 * Nadie compra estos paneles para dejarlos en blanco fijo. Lo que se compra es
 * la secuencia: una onda que recorre la figura y va cambiando de tono pieza
 * por pieza. Pintarlos todos del mismo color y quietos era enseñar el
 * empaque, no el producto — y en la junta con el cliente es justo eso lo que
 * hay que poder enseñar sin prometer nada de palabra.
 *
 * El tono de cada pieza sale del color del aparato, no de una paleta inventada
 * aparte: se abre un abanico alrededor de ese matiz y se corre con el tiempo.
 * Así la temperatura que se eligió en el inspector se sigue leyendo, y la
 * ambientación de "cálido para ver una película" no se vuelve un arcoíris.
 *
 * El material es uno por pieza —tienen que ser colores distintos— pero son
 * nueve; se crean una vez y se sueltan al desmontar.
 */
const ABANICO = 0.42 // qué tanto se abren los tonos alrededor del color base
const VUELTA = 0.045 // vueltas por segundo del corrimiento de tono
const ONDA = 1.5 // qué tan rápido recorre el brillo la figura

function Paneles({ disposicion, prendido, color, brillo }) {
  const piezas = useMemo(
    () => posicionesDe(DISPOSICION_BY_ID[disposicion] ?? DISPOSICIONES[0]),
    [disposicion],
  )

  const materiales = useMemo(
    () =>
      piezas.map(
        () => new THREE.MeshStandardMaterial({ color: '#f2ece3', emissive: '#000000', roughness: 0.5 }),
      ),
    [piezas],
  )
  useEffect(() => () => materiales.forEach((m) => m.dispose()), [materiales])

  const hsl = useRef({ h: 0, s: 0, l: 0 })
  const base = useMemo(() => new THREE.Color(), [])

  useFrame((st) => {
    base.set(color || '#ffffff').getHSL(hsl.current)
    const t = st.clock.elapsedTime
    const n = Math.max(1, materiales.length)

    materiales.forEach((m, i) => {
      if (!prendido || brillo <= 0) {
        m.color.set('#f2ece3')
        m.emissiveIntensity = 0
        return
      }
      /* La onda recorre la figura en el orden en que están puestas las piezas,
         que es fila por fila: se ve subir por el muro y no parpadear al azar. */
      const fase = (i / n) * Math.PI * 2
      const pulso = 0.55 + 0.45 * Math.sin(t * ONDA - fase)
      const tono = (hsl.current.h + (i / n - 0.5) * ABANICO + t * VUELTA + 1) % 1
      /* El difuso también se tiñe, y oscuro. Con el difuso blanco de siempre,
         la luz del cuarto rebotaba sobre él y se comía el emisivo: las nueve
         piezas volvían a verse blancas por más color que se les pusiera. Un
         panel encendido es su propia luz, no una superficie iluminada.
         Y el emisivo, a media luz: con el AGX y el bloom, subir la intensidad
         desatura en vez de brillar más. */
      m.color.setHSL(tono, 0.55, 0.1)
      m.emissive.setHSL(tono, 0.85, 0.42)
      m.emissiveIntensity = 1.7 * pulso * (brillo / 100)
    })
  })

  return (
    <group>
      {piezas.map((t, i) => (
        <mesh
          key={i}
          geometry={trianguloPanel(LADO, t.arriba)}
          material={materiales[i]}
          position={[t.x, t.y, 0]}
          castShadow
        />
      ))}
    </group>
  )
}

export function Cuerpo({ device, params, encendido, color, apertura }) {
  const cat = device?.cat
  const forma = params?.forma
  const prendido = params && encendido

  const mat = (
    <meshStandardMaterial
      color={params ? '#f2ece3' : '#25304a'}
      emissive={prendido ? color : '#000000'}
      emissiveIntensity={prendido ? 2.2 : 0}
      roughness={0.5}
    />
  )

  // ── iluminación: cada tipo tiene su silueta ──
  if (forma === 'lineal') {
    return (
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.035, 0.035]} />
        {mat}
      </mesh>
    )
  }
  if (forma === 'panel')
    return <Paneles disposicion={params?.disposicion} prendido={prendido} color={color} brillo={params?.brillo ?? 100} />
  if (params) {
    /* Un foco no es una esfera flotando: es un foco EN algo, y ese algo cambia
       lo que se ve. En el plafón se ve la roseta y el bulbo colgando; dentro
       de una lámpara solo se ve el resplandor a través de la pantalla; en el
       muro se ve la arbotante. Dibujar la misma esfera en los cuatro casos era
       lo que hacía que el plano se viera a diagrama y no a cuarto.

       `montaje` se levanta al colocar y se puede corregir en el inspector. */
    const montaje = params.montaje ?? (device?.power === 'cableado' || params.haz < 100 ? 'techo' : 'libre')

    if (montaje === 'techo')
      return (
        <group>
          {/* roseta pegada al plafón */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.018, 16]} />
            <meshStandardMaterial color="#e9e3d8" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.05, 8]} />
            <meshStandardMaterial color="#5a5048" roughness={0.7} />
          </mesh>
          {/* el bulbo: pera, no esfera */}
          <mesh castShadow scale={[1, 1.18, 1]}>
            <sphereGeometry args={[0.048, 16, 12]} />
            {mat}
          </mesh>
        </group>
      )

    if (montaje === 'empotrado')
      return (
        <mesh castShadow>
          <cylinderGeometry args={[0.075, 0.062, 0.028, 18]} />
          {mat}
        </mesh>
      )

    if (montaje === 'lampara')
      /* Dentro de una pantalla solo se ve el resplandor. El bulbo va chico y
         sin sombra: la sombra la proyecta la lámpara, que es el mueble. */
      return (
        <mesh scale={[1, 1.15, 1]}>
          <sphereGeometry args={[0.038, 14, 10]} />
          {mat}
        </mesh>
      )

    if (montaje === 'muro')
      return (
        <group>
          <mesh position={[0, 0, -0.04]}>
            <boxGeometry args={[0.09, 0.13, 0.03]} />
            <meshStandardMaterial color="#e9e3d8" roughness={0.8} />
          </mesh>
          <mesh castShadow scale={[1, 1.15, 1]}>
            <sphereGeometry args={[0.045, 14, 10]} />
            {mat}
          </mesh>
        </group>
      )

    // suelto: el bulbo con su casquillo, para el que aún no tiene lugar
    return (
      <group>
        <mesh position={[0, 0.055, 0]}>
          <cylinderGeometry args={[0.022, 0.026, 0.035, 12]} />
          <meshStandardMaterial color="#9c9388" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh castShadow scale={[1, 1.18, 1]}>
          <sphereGeometry args={[0.05, 16, 12]} />
          {mat}
        </mesh>
      </group>
    )
  }

  // ── lo que no ilumina ──
  const gris = <meshStandardMaterial color="#8a7f72" roughness={0.6} />

  if (cat === 'camaras')
    return (
      <group rotation={[Math.PI / 2.6, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.13, 12]} />
          {gris}
        </mesh>
        <mesh position={[0, -0.07, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.02, 12]} />
          <meshStandardMaterial color="#12100e" roughness={0.2} />
        </mesh>
      </group>
    )

  if (cat === 'sensores' || cat === 'agua')
    return (
      <mesh castShadow>
        <boxGeometry args={[0.07, 0.07, 0.022]} />
        {gris}
      </mesh>
    )

  if (cat === 'acceso')
    return (
      <mesh castShadow>
        <boxGeometry args={[0.07, 0.16, 0.045]} />
        {gris}
      </mesh>
    )

  if (cat === 'clima')
    return (
      <mesh castShadow>
        <boxGeometry args={[0.11, 0.11, 0.035]} />
        {gris}
      </mesh>
    )

  /* Nodo de malla: una torre, no un disco. Un Deco, un Orbi o un nodo de eero
     son cajas verticales de unos 17 cm, y así es como se reconocen encima de
     un mueble. Los de rack sí son planos y se quedan con el disco.
     Apoyado en la base y no centrado en el origen: puesto encima de un buró,
     centrado se hunde medio aparato dentro del mueble. */
  if (cat === 'red')
    return /rack|switch|patch/i.test(device?.id ?? '') ? (
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.025, 20]} />
        {gris}
      </mesh>
    ) : (
      <group position={[0, 0.085, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.105, 0.17, 0.105]} />
          <meshStandardMaterial color="#f0eee9" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.087, 0]}>
          <boxGeometry args={[0.075, 0.004, 0.075]} />
          <meshStandardMaterial color="#dcd8d0" roughness={0.6} />
        </mesh>
        {/* el led de estado, que es lo que se busca cuando algo no conecta */}
        <mesh position={[0, -0.055, 0.053]}>
          <sphereGeometry args={[0.006, 8, 6]} />
          <meshStandardMaterial color="#7ee0b8" emissive="#4ade80" emissiveIntensity={0.8} />
        </mesh>
      </group>
    )

  /* Bocina de asistente: cilindro con la cara de pantalla al frente. Va
     apoyada en su base por lo mismo que el nodo de malla. */
  if (cat === 'av')
    return (
      <group position={[0, 0.055, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.055, 0.062, 0.11, 20]} />
          {gris}
        </mesh>
        <mesh position={[0, 0.012, 0.05]} rotation={[-0.35, 0, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.004, 20]} />
          <meshStandardMaterial color="#14161c" roughness={0.25} emissive="#1d4ed8" emissiveIntensity={0.25} />
        </mesh>
      </group>
    )

  if (cat === 'hubs' || device?.id === 'appletv-a2169' || device?.id === 'appletv-4k')
    /* Cajita plana con la huella cuadrada del Apple TV: 9.3 cm de lado y 3.5
       de alto. Un cubo genérico no se reconoce y además se ve enorme al lado
       de un mueble. */
    return (
      <group position={[0, 0.017, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.094, 0.033, 0.094]} />
          <meshStandardMaterial color="#1b1b1f" roughness={0.42} />
        </mesh>
        <mesh position={[0, 0.018, 0]}>
          <boxGeometry args={[0.07, 0.002, 0.07]} />
          <meshStandardMaterial color="#2c2c31" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.005, 0.048]}>
          <sphereGeometry args={[0.005, 8, 6]} />
          <meshStandardMaterial color="#f2ece3" emissive="#ffffff" emissiveIntensity={0.6} />
        </mesh>
      </group>
    )

  if (cat === 'pantallas')
    return (
      <mesh castShadow>
        <boxGeometry args={[1.45, 0.83, 0.04]} />
        <meshStandardMaterial color="#12100e" roughness={0.3} />
      </mesh>
    )

  if (cat === 'cortinas') {
    /* `apertura` va de 0 a 1 de forma continua: la tela se recoge hacia
       arriba como una enrollable de verdad, y tarda los doce segundos que
       tarda. Antes eran dos posiciones y un salto — que es justo la mentira
       que hace que el cliente espere en su casa algo que no va a pasar. */
    const caida = 1.25 - (apertura ?? 0) * 1.13
    return (
      <group>
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.05, 0.05]} />
          {gris}
        </mesh>
        <mesh position={[0, -caida / 2 - 0.03, 0]}>
          <boxGeometry args={[0.9, caida, 0.015]} />
          <meshStandardMaterial color="#8a7f72" roughness={0.9} transparent opacity={0.85} />
        </mesh>
      </group>
    )
  }

  if (cat === 'energia')
    return (
      <mesh castShadow>
        <boxGeometry args={[0.06, 0.09, 0.035]} />
        {gris}
      </mesh>
    )

  return (
    <mesh castShadow>
      <boxGeometry args={[0.08, 0.08, 0.03]} />
      {gris}
    </mesh>
  )
}

function Equipo({ item, estado, seleccionado, onTomar, modo, alto, conSombra, colocando, escala = 1, onEncima, aLaVista = true }) {
  const p = item.params
  const dev = DEVICE_BY_ID[item.deviceId]
  const luz = useRef()

  const nivel = estado?.nivel ?? 1
  const encendido = nivel > 0.02
  const kelvin = estado?.k ?? p?.k ?? 2700
  /* Si la pieza está puesta en un color, manda el color. El blanco por
     temperatura es el estado de reposo de un foco RGB, no su única opción. */
  const rgb = estado?.rgb ?? p?.rgb ?? null
  const color = useMemo(() => (rgb ? new THREE.Color(rgb) : kelvinAColor(kelvin)), [rgb, kelvin])

  // la potencia se resuelve cada frame: así el deslizador de brillo y el
  // simulador de reglas se ven al instante, sin reconstruir la escena
  useFrame(() => {
    if (!luz.current || !p) return
    // el nivel del simulador multiplica al brillo de la pieza: atenuar al
    // 40 % un foco que ya estaba al 70 % da 28 %, que es lo que daría de verdad
    const factor = ((p.brillo ?? 100) / 100) * nivel
    // `escala` es el diafragma de la cámara (ver exposicionDe). No cambia la
    // proporción entre piezas —una de 1600 lm sigue dando el doble que una de
    // 800— solo el nivel al que se revela el conjunto.
    /* Un panel reparte sus lúmenes en medio metro cuadrado; un punto los
       concentra en un punto. Meterle los 900 lm completos a una luz puntual a
       doce centímetros del muro dejaba una mancha blanca en el centro de la
       pieza —el "foco en medio de los triángulos"— por pura caída cuadrática.
       Se reparte: la mitad de potencia, más lejos de la pieza, y el resto de
       la lectura la pone el material encendido, que es el que de verdad se ve. */
    const reparto = p.forma === 'punto' ? 1 : 0.45
    luz.current.power = p.lm * factor * escala * reparto
    /* Los paneles tiran su propio color al muro, no blanco. La luz salía del
       color "de fábrica" del aparato —un blanco cálido— mientras las nueve
       piezas corrían su secuencia de verdes y azules: el halo sobre la pared
       no tenía nada que ver con lo que se estaba viendo encendido, y eso se
       nota antes que cualquier otra cosa. Se usa el mismo tono medio de la
       secuencia, con la misma deriva. */
    if (p.forma === 'panel') {
      color.getHSL(HSL_LUZ)
      luz.current.color.setHSL((HSL_LUZ.h + performance.now() / 1000 * VUELTA + 1) % 1, 0.62, 0.55)
    } else {
      luz.current.color.copy(color)
    }
    luz.current.visible = factor > 0.01
  })

  const esFoco = !!p
  const forma = p?.forma ?? 'punto'
  /* Solo un foco de haz cerrado se dibuja como reflector. Un PANEL o una TIRA
     no tiran un cono: iluminan la pared que tienen enfrente. Dibujarlos con
     spot les colgaba una campana de luz hacia abajo —el "foco fantasma" que se
     veía encima de los Nanoleaf— porque el destino por omisión de un spot es
     el suelo de su propio grupo. */
  const dirigido = esFoco && p.haz < 140 && forma === 'punto'
  /* Y la fuente se despega del muro lo que mide la pieza, para que la luz
     salga DE la pieza hacia el cuarto y no desde dentro de la pared. */
  const salida = forma === 'punto' ? [0, 0, 0] : [0, 0, 0.45]

  return (
    <group
      name={item.id}
      userData={{ pieza: item.id }}
      position={[item.x, item.y ?? 0, item.z]}
      rotation={[0, item.rot ?? 0, 0]}
      scale={item.esc ?? 1}
      onPointerOver={(e) => {
        e.stopPropagation()
        onEncima(item.id)
      }}
      onPointerOut={() => onEncima(null)}
      onPointerDown={(e) => {
        /* Colocando, el clic tiene que llegar al piso: si un mueble lo
           intercepta, seleccionarlo en vez de soltar la pieza se siente roto
           —uno ya decidió qué poner y dónde. */
        if (colocando) return
        e.stopPropagation()
        onTomar(elegirBajoPuntero(e, item.id))
      }}
    >
      {/* La forma del aparato, no una esfera para todo.
          Un empotrado es un disco a ras de plafón, una tira es una barra
          pegada al muro, una cámara es un cilindro que apunta. Importa porque
          el plano se le enseña al cliente: reconocer de un vistazo qué es cada
          cosa vale más que la geometría exacta de la carcasa. */}
      {/* Solo el CUERPO se esconde con el muro, nunca la luz. Apagarla al girar
          la cámara oscurecería el cuarto al orbitar, que es justo lo que no
          debe pasar: la instalación no cambia porque uno se mueva. */}
      <group visible={aLaVista}>
        <Cuerpo device={dev} params={p} encendido={encendido} color={color} apertura={estado?.apertura} />
      </group>

      {/* módulo inteligente metido en el registro de la luminaria: la otra
          forma de hacerlo cuando la caja del apagador no da o no hay neutro */}
      {item.conModulo && (
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[0.05, 0.05, 0.04]} />
          <meshStandardMaterial color="#2f6d4a" emissive="#2f6d4a" emissiveIntensity={0.35} />
        </mesh>
      )}

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
          <pointLight ref={luz} position={salida} distance={0} decay={2} castShadow={false} />
        ))}

      {/* Varilla hasta el plafón: dice a qué altura está una pieza que flota.
         Solo cuando está seleccionada. Dibujada siempre, colgaba de un cable
         negro TODO —el Apple TV sobre el buró, el sensor del muro, el foco de
         la lámpara— y el cuarto volvía a leerse a diagrama. Ayuda cuando se
         está acomodando esa pieza, estorba el resto del tiempo. */}
      {seleccionado && alto - (item.y ?? 0) > 0.06 && (
        <mesh position={[0, (alto - (item.y ?? 0)) / 2, 0]} userData={{ ayuda: true }}>
          <cylinderGeometry args={[0.006, 0.006, alto - (item.y ?? 0), 6]} />
          <meshBasicMaterial color="#3a332d" />
        </mesh>
      )}

      <mesh
        position={[0, -(item.y ?? 0) + 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={seleccionado}
        userData={{ ayuda: true }}
      >
        <ringGeometry args={[0.18, 0.26, 24]} />
        <meshBasicMaterial color="#ff9a4d" transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ── enchufes y apagadores ────────────────────────────────────── */

const COLOR_PUNTO = { enchufe: '#5eead4', apagador: '#a3c9ff', salida: '#8fd694' }

/**
 * Un punto eléctrico. El apagador, además, se puede tocar.
 *
 * Tocar y arrastrar salen del mismo gesto, así que se distinguen por la
 * distancia: si el puntero no se movió, fue un toque y acciona; si se movió,
 * fue un arrastre y solo mueve. Es lo que hace que el plano se sienta como la
 * casa — le picas al apagador y la luz responde.
 */
function Punto({ item, seleccionado, onTomar, activo, onAccionar, controla, colocando, onEncima, aLaVista = true, enchufando, onConectar }) {
  const desde = useRef(null)
  const esApagador = item.tipo === 'apagador'

  return (
    <group
      name={item.id}
      userData={{ pieza: item.id }}
      visible={aLaVista}
      position={[item.x, item.y ?? 0.4, item.z]}
      onPointerOver={(e) => {
        e.stopPropagation()
        onEncima(item.id)
      }}
      onPointerOut={() => onEncima(null)}
      onPointerDown={(e) => {
        if (colocando) return
        e.stopPropagation()
        /* Con una clavija en la mano, picar un contacto ES conectarla. Que el
           mismo clic seleccione el contacto además sería un estorbo: uno está
           enchufando, no inspeccionando. */
        if (enchufando && (item.tipo === 'enchufe' || item.tipo === 'salida')) {
          onConectar?.(item.id)
          return
        }
        desde.current = [e.clientX, e.clientY]
        onTomar(elegirBajoPuntero(e, item.id))
      }}
      onPointerUp={(e) => {
        if (!esApagador || !controla || !desde.current) return
        const movido = Math.hypot(e.clientX - desde.current[0], e.clientY - desde.current[1])
        desde.current = null
        if (movido < 5) {
          e.stopPropagation()
          onAccionar?.(item.id)
        }
      }}
    >
      {/* Con una clavija en la mano, los contactos se marcan: es lo que dice
          dónde se puede soltar sin tener que adivinarlo. */}
      {enchufando && (item.tipo === 'enchufe' || item.tipo === 'salida') && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.03]}>
          <ringGeometry args={[0.09, 0.13, 20]} />
          <meshBasicMaterial color="#4d9fff" transparent opacity={0.9} depthTest={false} />
        </mesh>
      )}

      {/* la placa mecánica que ya estaba en el muro */}
      <mesh>
        <boxGeometry args={[0.09, 0.13, 0.03]} />
        <meshStandardMaterial
          color={COLOR_PUNTO[item.tipo] ?? '#8896ac'}
          emissive={activo ? COLOR_PUNTO[item.tipo] : '#000'}
          emissiveIntensity={activo ? 1.4 : 0}
        />
      </mesh>

      {/* el módulo inteligente escondido DETRÁS de la placa: es como se hace
          en una instalación que ya existe — se conserva el apagador que
          combina con la casa y por dentro ya es inteligente */}
      {esApagador && item.modulo === 'atras' && (
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[0.055, 0.055, 0.045]} />
          <meshStandardMaterial color="#2f6d4a" emissive="#2f6d4a" emissiveIntensity={0.35} />
        </mesh>
      )}

      {esApagador && controla && (
        <mesh position={[0, 0.1, 0.02]}>
          <ringGeometry args={[0.035, 0.05, 16]} />
          <meshBasicMaterial color={activo ? '#8fd694' : '#2b3448'} transparent opacity={0.9} />
        </mesh>
      )}
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

/* ── manijas de medida ────────────────────────────────────────────
   Se arrastra el muro y el cuarto cambia. Los campos numéricos siguen ahí
   para cuando se tiene el flexómetro en la mano, pero de pie frente al
   cliente es más rápido jalar una pared hasta que se parezca. */

/**
 * La cota: la línea con flechas y el número en medio, como en cualquier plano.
 *
 * Se jala la LÍNEA, no una manija escondida. Es la diferencia entre tener que
 * descubrir dónde agarrar y ver la medida y entender que eso se estira. Va por
 * fuera del muro para no pelearse con los muebles.
 *
 * La franja de agarre es mucho más gruesa que la línea dibujada —30 cm contra
 * 2— porque con el dedo en un iPad nadie le atina a una línea de dos
 * centímetros.
 */
/* Plano fijo a la altura de la cota. Se mide contra ESTO y no contra la caja
   de agarre: la caja crece conforme se jala, así que el rayo pegaba cada vez
   en un punto distinto de una geometría en movimiento y la medida temblaba. */
const PLANO_COTA = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.02)
const PUNTO = new THREE.Vector3()
const HUECO = 0.95 // el claro que se le deja a la cifra en medio de la línea

function Cota({ eje, ancho, largo, alto, onMedir, midiendo, onEntrar, apoyo = '#3b3244', camaraX = 1, camaraZ = 1 }) {
  const arrastrando = useRef(null)

  const esX = eje === 'x'
  const esY = eje === 'y'
  const activa = midiendo === eje
  const otraActiva = midiendo && !activa

  const largoCota = esX ? ancho : esY ? alto : largo

  /* La cota se pone del lado por donde entra la cámara, no en un lado fijo.
     Con el lado fijo, media vuelta de órbita la mandaba detrás de un muro y la
     medida —que es el dato que más se mira de un plano— quedaba tapada por el
     propio cuarto. Ahora sigue a quien la lee. */
  const sz = camaraZ >= 0 ? 1 : -1
  const sx = camaraX >= 0 ? 1 : -1
  const fueraZ = sz * (largo / 2 + 0.55)
  const fueraX = sx * (ancho / 2 + 0.55)

  /* La altura va PEGADA al muro de la derecha, no en la esquina de enfrente.
     En la esquina más cercana quedaba encimada sobre las otras dos cotas y
     sobre el cuarto entero: tres medidas saliendo del mismo punto, justo el
     que está más cerca de la cámara. Contra el muro de la derecha se lee
     sola, y además dice a las claras de qué muro es la altura. */
  const pos = esX
    ? [0, 0.02, fueraZ]
    : esY
      ? [fueraX, alto / 2, -sz * (largo / 2 - 0.15)]
      : [fueraX, 0.02, 0]
  const rot = esX ? [0, 0, 0] : esY ? [0, 0, Math.PI / 2] : [0, Math.PI / 2, 0]
  /* Sobre paleta pastel un gris claro desaparece. La cota se pinta con el
     tono de apoyo del cuarto, que siempre es el más oscuro de la paleta. */
  const color = activa ? '#2563eb' : apoyo
  const opacidad = otraActiva ? 0.2 : 1

  const mat = (extra = {}) => (
    <meshBasicMaterial
      color={color}
      transparent
      opacity={opacidad}
      depthTest={false}
      toneMapped={false}
      {...extra}
    />
  )

  /* Un punto, no una flecha. La flecha pesaba más que la medida: dos conos de
     catorce centímetros en cada cota tapaban el borde del cuarto y competían
     con los muebles. Un remate apenas más gordo que la línea dice lo mismo
     —hasta aquí llega— y desaparece cuando no se le está mirando.
     Apoya EN el borde: se centra justo en el extremo de la medida. */
  const remate = (signo) => (
    <mesh position={[(signo * largoCota) / 2, 0, 0]} renderOrder={3}>
      <sphereGeometry args={[activa ? 0.05 : 0.038, 10, 8]} />
      {mat()}
    </mesh>
  )

  return (
    <group position={pos} rotation={rot}>
      {/* La línea se parte en dos y deja hueco en medio para el número.
          Antes la cifra caía encima del trazo y se leía a medias — el dato
          que más se mira del plano, tapado por su propia flecha. */}
      {[-1, 1].map((sg) => {
        const util = Math.max(0.01, largoCota)
        const tramo = Math.max(0.01, (util - HUECO) / 2)
        return (
          <mesh key={sg} position={[(sg * (tramo + HUECO)) / 2, 0, 0]} renderOrder={2}>
            <boxGeometry args={[tramo, activa ? 0.035 : 0.02, 0.02]} />
            {mat()}
          </mesh>
        )
      })}
      {remate(1)}
      {remate(-1)}

      {/* los topes contra el muro: marcan dónde cae de verdad la medida */}
      {[1, -1].map((sg) => (
        <mesh key={sg} position={[(sg * largoCota) / 2, 0, -0.28]} renderOrder={2}>
          <boxGeometry args={[0.02, 0.02, 0.56]} />
          {mat({ opacity: opacidad * 0.5 })}
        </mesh>
      ))}

      {/* el tirador solo aparece en modo medida: fuera de él la cota es una
          anotación, y una anotación que parece botón invita a jalarla sin
          querer mientras se acomoda un mueble */}
      {activa &&
        [1, -1].map((sg) => (
          <mesh key={sg} position={[(sg * largoCota) / 2, 0, 0]} renderOrder={4}>
            <sphereGeometry args={[0.11, 14, 10]} />
            <meshBasicMaterial color="#ff9a4d" transparent opacity={0.55} depthTest={false} />
          </mesh>
        ))}

      {/* El número, de pie y pegado a la cámara, como el de las piezas. Antes
          iba acostado sobre el piso: desde media órbita se leía al revés, y
          desde la otra media quedaba en escorzo. Y sin prueba de profundidad,
          porque una medida tapada por un muro no mide nada. */}
      <Rotulo texto={`${largoCota.toFixed(2)} m`} opacidad={opacidad} arriba={esY ? 0 : 0.9} />

      {/* Franja invisible de agarre: gruesa a propósito, para el dedo.
          La altura no se jala: se cambia en el inspector. Arrastrarla pediría
          un plano de referencia vertical y, sobre todo, subirle el techo a un
          cuarto no es un gesto de tanteo — es un dato que se midió. */}
      <mesh
        visible={false}
        onPointerDown={(e) => {
          if (otraActiva) return
          e.stopPropagation()
          /* Tocarla ENTRA al modo medida y de una vez empieza a jalar, para
             que el gesto de una sola pasada también funcione. El modo se
             queda puesto al soltar: ajustar dos metros a ojo casi nunca sale
             al primer tirón. */
          if (!activa) onEntrar(eje)
          /* Se guarda de dónde arrancó el dedo y cuánto medía el cuarto en ese
             momento. Así lo que manda es el DESPLAZAMIENTO, no la posición
             absoluta del rayo: agarrar la cota por cualquier punto de su largo
             deja de dar un brinco inicial. */
          /* En altura lo que manda es cuánto sube el puntero en pantalla: no
             hay un plano del mundo contra el que medir una vertical sin que la
             cámara la deforme. */
          arrastrando.current = esY
            ? { pantalla: e.clientY, medida: largoCota }
            : e.ray.intersectPlane(PLANO_COTA, PUNTO)
              ? { desde: esX ? PUNTO.x : PUNTO.z, medida: largoCota }
              : null
          e.target.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!arrastrando.current) return
          e.stopPropagation()
          if (esY) {
            // hacia arriba en la pantalla es más alto
            const sube = (arrastrando.current.pantalla - e.clientY) / 160
            onMedir('y', Math.max(2, Math.round((arrastrando.current.medida + sube) * 100) / 100))
            return
          }
          if (!e.ray.intersectPlane(PLANO_COTA, PUNTO)) return
          const ahora = esX ? PUNTO.x : PUNTO.z
          /* El muro de enfrente no se mueve: el cuarto crece al doble de lo
             que se jaló de este lado. El signo sale de en qué mitad se agarró
             para que jalar hacia afuera siempre agrande. */
          const lado = arrastrando.current.desde >= 0 ? 1 : -1
          const delta = (ahora - arrastrando.current.desde) * lado * 2
          const cruda = arrastrando.current.medida + delta
          // a centímetros: sin esto la medida baila en la tercera decimal
          onMedir(eje, Math.max(1.2, Math.round(cruda * 100) / 100))
        }}
        onPointerUp={(e) => {
          arrastrando.current = null
          e.target.releasePointerCapture(e.pointerId)
        }}
      >
        <boxGeometry args={[largoCota + 0.4, 0.4, 0.4]} />
      </mesh>
    </group>
  )
}

/**
 * El gizmo de la pieza seleccionada.
 *
 * Antes había un aro para girar y el arrastre sobre el piso para mover, los
 * dos vivos al mismo tiempo. En la práctica eso significaba que acomodar algo
 * lo giraba de pasada y no había forma de hacer una sola cosa a la vez.
 *
 * Ahora hay un modo a la vez —mover, girar o escalar— como en cualquier editor
 * 3D, con la tecla al lado (G, R, S). Cuesta un clic más y a cambio cada gesto
 * hace exactamente lo que dice.
 *
 * El truco de implementación: `TransformControls` necesita un objeto de la
 * escena, y las piezas se dibujan dentro de un `map`. En vez de sacar una ref
 * por pieza, se pone un nodo vacío en la transformación de la seleccionada, se
 * le cuelga el gizmo, y de ahí se copian los valores de vuelta al modelo.
 */
const MODOS_GIZMO = { mover: 'translate', girar: 'rotate', escalar: 'scale' }

/* Los ángulos a los que un mueble de verdad se acomoda. En un cuarto casi
   todo va paralelo a un muro o a 45° en una esquina; lo demás es el pulso.
   El imán deja libre el ángulo intermedio y solo jala cuando ya andabas
   cerca de uno de estos. */
const IMANES = [0, 45, 90, 135, 180, 225, 270, 315].map((g) => (g * Math.PI) / 180)
const TOLERANCIA = (7 * Math.PI) / 180

function magnetizar(rad) {
  const norm = ((rad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  for (const a of IMANES) {
    if (Math.abs(norm - a) < TOLERANCIA) return a
  }
  // fuera del imán se redondea al grado: sin esto la rotación queda con seis
  // decimales y el campo del inspector se vuelve ilegible
  return Math.round((norm * 180) / Math.PI) * (Math.PI / 180)
}

/**
 * Recorta a dónde puede ir el gizmo cuando la pieza está vinculada.
 *
 * Un Echo Dot que vive sobre un buró no se suelta a media sala nada más
 * porque alguien lo arrastró de más: se queda sobre el buró. Un cuadro
 * pegado a un muro no atraviesa la pared. El gizmo deja mover libre en los
 * tres ejes —es lo que se necesita para lo que no está vinculado a nada—
 * pero lo que SÍ tiene un `ancla` se recorta de vuelta a esa superficie
 * antes de guardarse, así que nunca se ve flotando donde no va.
 */
function restringirASuperficie(item, items, plano, x, y, z) {
  const a = item.ancla
  if (!a) return { x, y, z }

  if (a.a === 'mueble') {
    const host = items.find((i) => i.id === a.id)
    if (!host) return { x, y, z }
    const def = MUEBLES[host.tipo]
    const variante = def?.variantes?.find((v) => v.id === host.variante)
    const w = variante?.props?.w ?? def?.w ?? 0.4
    const d = variante?.props?.d ?? def?.d ?? 0.4
    const rot = host.rot ?? 0
    // al marco local del mueble, para recortar dentro de SU huella y no de una caja alineada al mundo
    const dx = x - host.x
    const dz = z - host.z
    const lx = Math.max(-w / 2, Math.min(w / 2, dx * Math.cos(rot) - dz * Math.sin(rot)))
    const lz = Math.max(-d / 2, Math.min(d / 2, dx * Math.sin(rot) + dz * Math.cos(rot)))
    return {
      x: host.x + lx * Math.cos(rot) + lz * Math.sin(rot),
      y: altoDe(host) + (a.sobre ?? 0),
      z: host.z - lx * Math.sin(rot) + lz * Math.cos(rot),
    }
  }

  if (a.a === 'muro') {
    const m = MUROS_ANCLA[a.muro]
    if (!m) return { x, y, z }
    const hx = (plano.ancho ?? 4) / 2
    const hz = (plano.largo ?? 4) / 2
    const fijo = (m.eje === 'x' ? hx : hz) * m.signo - m.signo * (a.sep ?? 0)
    const cy = Math.max(0.05, Math.min((plano.alto ?? 2.6) - 0.05, y))
    return m.eje === 'x'
      ? { x: fijo, y: cy, z: Math.max(-hz + 0.1, Math.min(hz - 0.1, z)) }
      : { x: Math.max(-hx + 0.1, Math.min(hx - 0.1, x)), y: cy, z: fijo }
  }

  if (a.a === 'techo') {
    const hx = (plano.ancho ?? 4) / 2
    const hz = (plano.largo ?? 4) / 2
    return {
      x: Math.max(-hx + 0.1, Math.min(hx - 0.1, x)),
      y: a.y ?? (plano.alto ?? 2.6) - 0.01,
      z: Math.max(-hz + 0.1, Math.min(hz - 0.1, z)),
    }
  }

  return { x, y, z }
}

function Gizmo({ item, items, plano, modo, onParchar, onFin, tamano = 1 }) {
  const proxy = useRef()
  const [listo, setListo] = useState(false)

  // el nodo tiene que existir antes de que TransformControls intente tomarlo
  useLayoutEffect(() => {
    if (!proxy.current) return
    proxy.current.position.set(item.x, item.y ?? 0, item.z)
    proxy.current.rotation.set(0, item.rot ?? 0, 0)
    const e = item.esc ?? 1
    proxy.current.scale.set(e, e, e)
    setListo(true)
  }, [item.id, item.x, item.y, item.z, item.rot, item.esc])

  const aplicar = () => {
    const o = proxy.current
    if (!o) return
    if (modo === 'mover') {
      /* Vinculada, no se suelta de la superficie a la que está pegada: se
         recorta de vuelta AQUÍ, sobre el proxy mismo, para que el gizmo se
         sienta pegado en el momento —no que flote y hasta soltar el mouse
         se corrija de un salto. */
      const libre = { x: o.position.x, y: Math.max(0, o.position.y), z: o.position.z }
      const { x, y, z } = restringirASuperficie(item, items, plano, libre.x, libre.y, libre.z)
      if (x !== o.position.x || y !== o.position.y || z !== o.position.z) o.position.set(x, y, z)
      onParchar(item.id, { x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), z: Number(z.toFixed(3)) })
    } else if (modo === 'girar') {
      onParchar(item.id, { rot: Number(magnetizar(o.rotation.y).toFixed(4)) })
    } else {
      // escala uniforme: un mueble estirado en un solo eje se ve roto, y el
      // catálogo no tiene proporciones que valga la pena deformar
      const e = Math.max(0.2, Math.min(4, (o.scale.x + o.scale.y + o.scale.z) / 3))
      onParchar(item.id, { esc: Number(e.toFixed(3)) })
    }
  }

  return (
    <>
      <object3D ref={proxy} />
      {listo && proxy.current && (
        <TransformControls
          object={proxy.current}
          mode={MODOS_GIZMO[modo] ?? 'translate'}
          /* A la medida de lo que se agarra. Con el tamaño fijo, las flechas
             tapaban por completo un Apple TV de nueve centímetros: no se veía
             ni la pieza ni sus cotas, solo el gizmo. */
          size={tamano}
          space="world"
          /* girar solo en Y: inclinar un mueble no es algo que se haga en un
             levantamiento, y los otros dos anillos solo estorban al agarrar */
          /* Mover deja los TRES ejes. La versión anterior escondía la Y en
             modo mover —quedó de cuando todo vivía en el piso— y con eso no
             había forma de subir un foco al plafón ni bajar un sensor con el
             gizmo. Girar sigue restringido a Y: inclinar un mueble no es algo
             que se haga en un levantamiento. */
          showX={modo !== 'girar'}
          showY
          showZ={modo !== 'girar'}
          translationSnap={0.05}
          /* 5° de paso en el control; el imán de arriba remata los ángulos
             útiles. Con el paso de 2.5° que había antes, el gizmo se sentía
             continuo y nunca caía en un ángulo redondo. */
          rotationSnap={Math.PI / 36}
          onObjectChange={aplicar}
          onMouseUp={onFin}
        />
      )}
    </>
  )
}

/* ── el sol y el cielo ────────────────────────────────────────── */

/**
 * Lo que entra por una ventana.
 *
 * La ventana no es un hueco de verdad —el muro es una sola caja— así que la
 * luz no se recorta con su marco. Lo que se hace es poner un foco cálido y
 * ancho justo por fuera del vidrio, apuntando al centro del cuarto: entra el
 * lavado de luz desde ese muro y los muebles proyectan su sombra hacia
 * adentro, que es lo que el ojo lee como "por ahí entra el sol".
 */
function LuzVentana({ item, ancho, largo, alto, dia }) {
  const luz = useRef()
  const blanco = useRef()

  useFrame(() => {
    if (luz.current && blanco.current) luz.current.target = blanco.current
  })

  if (!dia) return null

  // hacia dónde mira la ventana: su rotación dice a qué muro está pegada
  const r = item.rot ?? 0
  const nx = Math.sin(r)
  const nz = Math.cos(r)
  const fuera = Math.max(ancho, largo) * 0.55

  return (
    <group>
      <object3D ref={blanco} position={[item.x - nx * 2, alto * 0.25, item.z - nz * 2]} />
      <spotLight
        ref={luz}
        position={[item.x + nx * fuera, alto * 0.85, item.z + nz * fuera]}
        angle={0.75}
        penumbra={1}
        distance={0}
        decay={0}
        intensity={2.4}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0015}
        shadow-normalBias={0.02}
      />
    </group>
  )
}

/* ── plano invisible para arrastrar y colocar ─────────────────── */

function Suelo({
  ancho,
  largo,
  onMover,
  onSoltar,
  onColocar,
  onApuntar,
  arrastrando,
  colocando,
  permitePiso,
  onTocar,
  onFuera,
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      visible={false}
      onPointerMove={(e) => {
        if (arrastrando) {
          e.stopPropagation()
          onMover(e.point.x, e.point.z)
          return
        }
        if (colocando && permitePiso) {
          e.stopPropagation()
          onApuntar?.({ x: e.point.x, y: 0, z: e.point.z, superficie: 'piso' })
        }
      }}
      onPointerUp={onSoltar}
      onPointerDown={(e) => {
        if (colocando) {
          if (!permitePiso) return
          e.stopPropagation()
          onColocar({ x: e.point.x, y: 0, z: e.point.z, superficie: 'piso' })
          return
        }
        /* Este plano se extiende tres veces el cuarto porque hace de mesa de
           arrastre. Eso también quiere decir que se traga los clics de
           "afuera", y por eso soltar la selección picando el fondo no
           funcionaba: nunca había un clic perdido. Se decide aquí, por dónde
           cayó el punto. */
        e.stopPropagation()
        /* El margen es el grosor del muro: el piso que se VE sobresale eso
           del cuarto útil, y picarle a la orilla del piso tiene que contar
           como picarle al espacio, no como salirse de él. */
        const dentro =
          Math.abs(e.point.x) <= ancho / 2 + GROSOR_MURO && Math.abs(e.point.z) <= largo / 2 + GROSOR_MURO
        if (dentro) onTocar?.()
        else onFuera?.()
      }}
    >
      <planeGeometry args={[ancho * 3, largo * 3]} />
    </mesh>
  )
}

/**
 * El postproceso: lo que separa "render" de "foto".
 *
 * Tres cosas y cada una hace un trabajo distinto:
 *
 * — **N8AO** mete sombra donde dos superficies se encuentran: esquinas, bajo
 *   los muebles, detrás del librero. Sin ella todo flota y el cuarto se ve
 *   plano por más luces que tenga. Es la que más aporta.
 * — **Bloom** hace que lo que emite luz se desborde sobre lo que tiene al
 *   lado. Es exactamente el halo suave de una lámpara sobre el muro; sin él
 *   un foco encendido es un círculo brillante y nada más.
 * — **Vignette** oscurece las orillas, que es lo que hace que el ojo se vaya
 *   al centro del cuarto en vez de al borde del lienzo.
 *
 * De día el bloom baja casi a cero: con luz pareja no hay nada que desbordar y
 * solo lavaría la imagen.
 *
 * El orden importa. El tone mapping va al FINAL, después del bloom, porque el
 * composer apaga el del renderer —por eso `gl.toneMappingExposure` aquí no hace
 * nada, y la exposición se resuelve escalando la potencia de las luces.
 */
function Postproceso({ modo }) {
  return (
    <EffectComposer multisampling={0} enableNormalPass>
      <N8AO
        aoRadius={0.5}
        intensity={modo === 'noche' ? 2.6 : 2.0}
        distanceFalloff={1}
        quality="medium"
        halfRes
        color="#070a10"
      />
      {/* El umbral se calibró contra la exposición: con 0.35 florecía todo lo
          que pasara de medio tono —o sea, los muros iluminados— y el cuarto
          entero salía en blanco. En 0.72 solo desborda la fuente misma: el
          foco, la tira, la pantalla. Que es el halo que se quería. */}
      <Bloom
        intensity={modo === 'noche' ? 0.9 : 0.3}
        luminanceThreshold={modo === 'noche' ? 0.72 : 0.95}
        luminanceSmoothing={0.35}
        mipmapBlur
        radius={0.82}
      />
      <Vignette offset={0.3} darkness={modo === 'noche' ? 0.62 : 0.34} eskil={false} />
      {/* AGX y no ACES: aquí hay focos a treinta centímetros de un muro
          blanco, y ACES manda esos valores a blanco puro —justo el plano
          quemado que queríamos quitar—. AGX desatura el pico poco a poco, así
          que la mancha de la lámpara conserva el ámbar en el centro. */}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <SMAA />
    </EffectComposer>
  )
}

/* Del nombre del muro que usa Cuarto3D (norte/sur/este/oeste, contra qué
   malla se picó) al giro que deja la pieza viendo hacia adentro del cuarto.
   Es la misma tabla que `GIRO_MURO` de anclas.js, sólo que ahí vive con el
   otro vocabulario (x-/x+/z-/z+) y aquí hace falta con éste. */
const GIRO_MURO_NOMBRE = { norte: 0, sur: Math.PI, oeste: Math.PI / 2, este: -Math.PI / 2 }

/**
 * Lo que se está arrastrando, mientras no se ha soltado.
 *
 * Usa el mismo cuerpo que la pieza ya puesta —el mueble entero, el aparato
 * entero, con su forma y su tamaño de verdad— para que lo que sigue al
 * mouse sea la pieza y no un cubo que la representa. No participa del
 * raycaster —`raycast={() => null}`— porque flota justo encima de lo que sí
 * tiene que recibir el clic: el piso, el muro o el plafón que hay debajo.
 */
function Fantasma({ colocando, puntero, superficies }) {
  if (!colocando || !puntero) return null
  const valido = superficies.includes(puntero.superficie)
  const rot = puntero.superficie === 'muro' ? (GIRO_MURO_NOMBRE[puntero.muro] ?? 0) : 0

  let cuerpo = null
  if (colocando.clase === 'mueble') {
    const def = MUEBLES[colocando.tipo]
    if (def?.Comp) {
      const variante = def.variantes?.find((v) => v.id === colocando.variante)
      const props = { ...def.props, ...(variante?.props ?? {}) }
      const Comp = def.Comp
      cuerpo = def.Nuevo ? <Comp {...props} /> : <Comp position={[0, 0, 0]} rotation={[0, 0, 0]} {...props} />
    }
  } else if (colocando.clase === 'equipo') {
    const dev = DEVICE_BY_ID[colocando.deviceId]
    cuerpo = <Cuerpo device={dev} params={parametrosIniciales(dev)} encendido={false} color={new THREE.Color('#7b8296')} />
  } else {
    cuerpo = (
      <mesh>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshStandardMaterial color={COLOR_PUNTO[colocando.tipo] ?? '#8896ac'} />
      </mesh>
    )
  }

  return (
    <group position={[puntero.x, puntero.y, puntero.z]} rotation={[0, rot, 0]} raycast={() => null}>
      {cuerpo}
      {/* El halo dice si aquí se puede soltar o no, antes de intentarlo: es
          más rápido leer un color que picarle y que rebote. */}
      <mesh
        position={puntero.superficie === 'piso' ? [0, 0.006, 0] : [0, 0, 0.006]}
        rotation={puntero.superficie === 'piso' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
      >
        <ringGeometry args={[0.2, 0.25, 28]} />
        <meshBasicMaterial
          color={valido ? '#7fdc8f' : '#ff5d5d'}
          transparent
          opacity={0.75}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
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
  superficies = [],
  puntero,
  onApuntar,
  sim,
  modo = 'noche',
  onAccionar,
  onMedida,
  conRegla,
  midiendo,
  onMidiendo,
  modoGizmo,
  onParchar,
  onFinGizmo,
  enfoque,
  onEnfocado,
  disolver,
  onDisuelto,
  enMano,
  onTomarClavija,
  onGuiarCable,
  onSoltarCable,
  onEnchufar,
}) {
  const { ancho, largo, alto } = plano
  /* Las medidas se pasan como un objeto estable: los cables las usan para
     trazar la canaleta y rehacer su geometría en cada render sería tirar el
     cuarto entero por un cambio de selección. */
  const medidas = useMemo(() => ({ ancho, largo }), [ancho, largo])
  const [arrastrando, setArrastrando] = useState(null)
  /* Mientras se acomoda un cable la cámara no se mueve: es el mismo estorbo
     que ya tenía la cota del muro y se resuelve igual. */
  const [acomodando, setAcomodando] = useState(false)
  const [encima, setEncima] = useState(null)
  const [cam, setCam] = useState([1, 1])
  const camX = cam[0]
  const camZ = cam[1]
  const paletaId = useEstilo((e) => e.paleta)
  const pal = paletaDe(paletaId)
  const fondo = fondoDe(paletaId)
  const verCables = useEstilo((e) => e.verElectricas)
  const orbita = useRef()

  /* En modo medida la cámara se queda quieta. Era el estorbo principal:
     `stopPropagation` de r3f no llega hasta OrbitControls —escucha el DOM del
     canvas, no el raycaster— así que jalar la cota giraba la escena al mismo
     tiempo y no había forma de atinarle a la medida. */
  useEffect(() => {
    if (orbita.current) orbita.current.enabled = !midiendo && !acomodando
  }, [midiendo, acomodando])

  /* Como en Spline: el primer clic SELECCIONA y nada más. Solo lo que ya está
     seleccionado se puede arrastrar. Antes cualquier roce movía la pieza que
     estuviera debajo, y en un cuarto lleno eso significa mover cosas sin
     enterarse — el daño se descubre cuando ya se guardó. */
  const tomar = (id) => {
    if (midiendo) return
    if (seleccion !== id) {
      onSeleccionar(id)
      return
    }
    setArrastrando(id)
    if (orbita.current) orbita.current.enabled = false
  }

  const soltar = () => {
    setArrastrando(null)
    // en modo medida la órbita sigue apagada: este pointerup es el de haber
    // soltado la cota, y volver a encenderla aquí era lo que hacía que la
    // cámara girara en cuanto se intentaba el segundo tirón
    if (orbita.current) orbita.current.enabled = !midiendo
  }

  const mover = (x, z) => {
    if (!arrastrando) return
    // no se deja salir del cuarto: un mueble fuera del muro no es un plano,
    // es un descuido que después nadie encuentra
    const lx = Math.max(-ancho / 2 + 0.15, Math.min(ancho / 2 - 0.15, x))
    const lz = Math.max(-largo / 2 + 0.15, Math.min(largo / 2 - 0.15, z))
    /* Este arrastre es el rápido —doble clic y jalar, sin pasar por el modo
       Mover del gizmo— y viaja sobre el piso porque ahí es donde vive el
       plano que lo capta. Pero si la pieza está vinculada, el piso no es su
       superficie: se recorta igual que en el gizmo, o un Echo Dot arrastrado
       así se bajaría del buró al suelo sin que nadie lo haya pedido. */
    const item = plano.items.find((i) => i.id === arrastrando)
    const { x: fx, y: fy, z: fz } = item
      ? restringirASuperficie(item, plano.items, plano, lx, item.y ?? 0, lz)
      : { x: lx, y: undefined, z: lz }
    onMover(arrastrando, fx, fy, fz)
  }

  const seleccionado = plano.items.find((i) => i.id === seleccion)
  const exposicion = useMemo(() => exposicionDe(plano, modo), [plano, modo])

  /* Las ventanas colocadas son las que dejan entrar el sol. Si el cuarto no
     tiene ninguna, de día se ilumina solo con el cielo — que es exactamente lo
     que pasa en un cuarto interior, así que se ve como debe verse. */
  const ventanas = useMemo(
    () => plano.items.filter((i) => i.clase === 'mueble' && (i.tipo === 'ventana' || i.tipo === 'persiana')),
    [plano.items],
  )
  const encuadre = Math.hypot(ancho + 2.2, largo + 2.2)

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
      shadows="soft"
      dpr={[1, 1.75]}
      /* Sin tone mapping aquí a propósito: el EffectComposer lo apaga en el
         renderer y lo aplica al final de la cadena, como efecto. */
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      /* Se encuadra el cuarto MÁS las cotas, que viven fuera del muro. Con
         el encuadre justo al cuarto, en un espacio chico la medida quedaba
         cortada — que es justo lo que uno va a mirar. */
      camera={{ position: [encuadre * 0.8, encuadre * 0.85, encuadre * 0.8], fov: 42 }}
      /* Picar fuera del cuarto cierra lo que esté abierto: primero el modo
         medida, y si no hay ninguno, deselecciona. Tener que ir hasta el botón
         "Listo" para poder seguir trabajando era un callejón: uno ya terminó
         de medir en el momento en que mira a otro lado. */
      onPointerMissed={() => (midiendo ? onMidiendo(null) : onSeleccionar(null))}
      onPointerUp={soltar}
    >
      {/* el fondo toma el muro de la paleta: es lo que hace que el cuarto se
          vea como un diorama y no como una maqueta flotando en el vacío */}
      <color attach="background" args={[fondo]} />
      <SeguirCamara onMover={(x, z) => setCam([x, z])} />
      <VolarA enfoque={enfoque} onListo={onEnfocado} />
      <Disolver
        activo={!!disolver}
        centro={disolver?.centro}
        dist={disolver?.dist ?? 3}
        color={fondo}
        onListo={onDisuelto}
      />
      <MesaTaller
        activo={!!disolver}
        centro={disolver?.centro}
        r={(disolver?.tam ?? 1) * 2.2 + 0.6}
        color={pal.piso}
      />

      <Rig ancho={ancho} largo={largo} alto={alto} />

      {ventanas.map((v) => (
        <LuzVentana key={v.id} item={v} ancho={ancho} largo={largo} alto={alto} dia={modo === 'dia'} />
      ))}

      <Cuarto3D
        ancho={ancho}
        largo={largo}
        alto={alto}
        camaraX={camX}
        camaraZ={camZ}
        onTocar={midiendo || colocando ? undefined : () => onSeleccionar(ID_MUROS)}
        piso={plano.piso}
        muro={plano.muroAcabado}
        colocando={colocando && !midiendo}
        permiteMuro={superficies.includes('muro')}
        onApuntarMuro={onApuntar}
        onColocarMuro={onColocar}
      />
      <Conexiones plano={plano} alto={alto} />

      <Suelo
        ancho={ancho}
        largo={largo}
        onMover={mover}
        onSoltar={soltar}
        onColocar={onColocar}
        onApuntar={onApuntar}
        arrastrando={arrastrando}
        colocando={colocando && !midiendo}
        permitePiso={superficies.includes('piso')}
        onTocar={midiendo ? undefined : () => onSeleccionar(ID_MUROS)}
        /* Picar fuera del cuarto cierra lo que esté abierto: primero el modo
           medida y si no, la selección. Antes, midiendo, este manejador se
           desconectaba entero y no había forma de salir más que el botón
           "Listo" — y uno ya terminó de medir en el momento en que mira a otro
           lado. El clic perdido del lienzo no sirve aquí: este plano mide tres
           veces el cuarto porque hace de mesa de arrastre, así que se traga
           todos los clics de afuera. */
        onFuera={() => (midiendo ? onMidiendo(null) : onSeleccionar(null))}
      />

      {/* El plafón, para lo que se cuelga de él —empotrados, salidas de
          techo—. Sólo existe como blanco de clics mientras se está colocando
          algo que de verdad va ahí: el resto del tiempo no hay ninguna razón
          para que algo invisible le robe el clic a lo que sí se ve. */}
      {colocando && !midiendo && superficies.includes('techo') && (
        <mesh
          position={[0, alto - 0.01, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          visible={false}
          onPointerMove={(e) => {
            e.stopPropagation()
            onApuntar?.({ x: e.point.x, y: alto - 0.01, z: e.point.z, superficie: 'techo' })
          }}
          onPointerDown={(e) => {
            e.stopPropagation()
            onColocar?.({ x: e.point.x, y: alto - 0.01, z: e.point.z, superficie: 'techo' })
          }}
        >
          <planeGeometry args={[ancho, largo]} />
        </mesh>
      )}

      <Fantasma colocando={colocando} puntero={puntero} superficies={superficies} />

      {plano.items.map((it) => {
        const sel = it.id === seleccion
        if (it.clase === 'mueble')
          return (
            <Mueble
              key={it.id}
              item={it}
              seleccionado={sel}
              onTomar={tomar}
              colocando={colocando}
              onEncima={setEncima}
              aLaVista={piezaSeVe(it, ancho, largo, camX, camZ)}
            />
          )
        if (it.clase === 'equipo')
          return (
            <Equipo
              key={it.id}
              item={it}
              seleccionado={sel}
              onTomar={tomar}
              estado={sim?.[it.id]}
              modo={modo}
              alto={alto}
              conSombra={conSombra.has(it.id)}
              colocando={colocando}
              escala={exposicion}
              onEncima={setEncima}
              aLaVista={piezaSeVe(it, ancho, largo, camX, camZ)}
            />
          )
        return (
          <Punto
            key={it.id}
            item={it}
            seleccionado={sel}
            onTomar={tomar}
            activo={(sim?.[it.id]?.nivel ?? 1) > 0.02}
            onAccionar={onAccionar}
            controla={conRegla?.has(it.id)}
            colocando={colocando}
            enchufando={!!enMano}
            onConectar={(id) => onEnchufar?.(enMano, id)}
            onEncima={setEncima}
            aLaVista={piezaSeVe(it, ancho, largo, camX, camZ)}
          />
        )
      })}

      {/* El cable es información de instalación, no decoración: con todos
          dibujados el plano se llena de líneas rojas y se deja de leer. Se
          enseña el del punto que se tenga seleccionado, o todos a la vez desde
          el Style Lab cuando se le está explicando la instalación al cliente. */}
      {plano.tramos
        .filter((t) => verCables || t.entre?.includes(seleccion))
        .map((t) => (
          <Tramo key={t.id} tramo={t} />
        ))}

      {/* Las medidas del cuarto salen al TOCAR el espacio —el piso o un muro—,
          igual que las de un mueble salen al tocarlo. Puestas siempre, cada
          plano abría con dos cotas grandes que nadie había pedido y que se
          cruzaban con todo lo que uno quería mirar. Durante el modo medida se
          quedan aunque se deseleccione, que es cuando de verdad se usan.
          Y las manijas, no mientras se coloca algo: estorban justo en el borde
          donde uno quiere soltar la pieza. */}
      {onMedida && !colocando && (seleccion === ID_MUROS || midiendo) && (
        <Suspense fallback={null}>
          {['x', 'z', 'y'].map((ej) => (
            <Cota
              key={ej}
              eje={ej}
              ancho={ancho}
              largo={largo}
              alto={alto}
              onMedir={onMedida}
              midiendo={midiendo}
              onEntrar={onMidiendo}
              apoyo={pal.apoyo}
              camaraX={camX}
              camaraZ={camZ}
            />
          ))}
        </Suspense>
      )}

      {/* el aro de giro solo en lo seleccionado: cuatro aros a la vez serían
          ruido y además se pelearían con el arrastre */}
      {/* el contorno de lo que está bajo el puntero, y el de lo seleccionado */}
      <Realce item={(encima && encima !== seleccion && plano.items.find((i) => i.id === encima)) || null} />

      {/* Los cables de alimentación, de cada aparato a su contacto. */}
      <Cables
        items={plano.items}
        cuarto={medidas}
        enMano={enMano}
        onTomarClavija={onTomarClavija}
        onGuiarCable={onGuiarCable}
        onAgarrarCable={() => setAcomodando(true)}
        onSoltarCable={() => {
          setAcomodando(false)
          onSoltarCable?.()
        }}
      />
      {/* El hover se suelta en cuanto su pieza deja de existir: si no, se
          queda apuntando a un fantasma hasta que el puntero se mueva. */}
      <SoltarFantasma id={encima} items={plano.items} onSoltar={() => setEncima(null)} />
      {/* Los rótulos de las cotas cargan una fuente la primera vez, y cargar
          SUSPENDE. Sin esta frontera propia, esa espera la atendía el Suspense
          de arriba —el que envuelve el lienzo entero— y al seleccionar la
          primera pieza la pantalla se ponía negra con un "Cargando plano…" de
          unos milisegundos. Con la frontera aquí, lo único que espera es el
          número, y nadie lo nota. */}
      <Suspense fallback={null}>
      {seleccionado && (
        <Seleccion
          item={seleccionado}
          items={plano.items}
          plano={plano}
          modo={!midiendo && modoGizmo ? modoGizmo : null}
          onParchar={onParchar}
          onFin={onFinGizmo}
        />
      )}
      </Suspense>

      <Postproceso modo={modo} />

      <OrbitControls
        ref={orbita}
        makeDefault
        enablePan
        maxPolarAngle={Math.PI / 2.05}
        minDistance={1.5}
        maxDistance={encuadre * 3}
        target={[0, alto * 0.35, 0]}
      />
    </Canvas>
  )
}
