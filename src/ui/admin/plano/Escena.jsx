import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, OrbitControls, Text, TransformControls } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

import { DEVICE_BY_ID } from '../../../content/catalog'

import { ID_MUROS, MUEBLES } from './catalogo'
import { GROSOR_MURO, piezaSeVe } from './muros'
import Conexiones from './Conexiones'
import { DISPOSICION_BY_ID, DISPOSICIONES, LADO, posicionesDe, trianguloPanel } from './paneles'
import Cuarto3D from './Cuarto3D'
import Rig from './Rig'
import { fondoDe, useEstilo, paletaDe } from './estilo'
import { exposicionDe, kelvinAColor } from './luz'

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
function useMedidaPieza(id) {
  const { scene } = useThree()
  const [caja, setCaja] = useState(null)

  /* Se vuelve a medir en cada cuadro mientras está seleccionada: escalar o
     cambiar el montaje cambia el tamaño, y una cota que no sigue a la pieza es
     peor que ninguna. Es una pieza, no veinte. */
  useFrame(() => {
    if (!id) {
      if (caja) setCaja(null)
      return
    }
    const m = medirObjeto(scene.getObjectByName(id))
    if (!m) return
    if (!caja || Math.abs(m.w - caja.w) > 0.002 || Math.abs(m.h - caja.h) > 0.002 || Math.abs(m.d - caja.d) > 0.002)
      setCaja(m)
  })

  return caja
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
function Seleccion({ item, modo, onParchar, onFin }) {
  const caja = useMedidaPieza(item.id)
  const mayor = caja ? Math.max(caja.w, caja.h, caja.d) : 1

  return (
    <>
      <CotasPieza item={item} caja={caja} />
      {modo && (
        <Gizmo
          item={item}
          modo={modo}
          onParchar={onParchar}
          onFin={onFin}
          tamano={Math.min(0.9, Math.max(0.38, 0.34 + mayor * 0.45))}
        />
      )}
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
  const caja = useMedidaPieza(item?.id)
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
  if (!def) return null
  const { Comp } = def
  /* La versión elegida se mezcla encima de las props de base. Es un objeto
     plano a propósito: así una variante puede cambiar solo la silueta (`v`) o
     también la medida (`w`, `largo`) sin que el renderizador sepa de cuál se
     trata. */
  const variante = def.variantes?.find((x) => x.id === item.variante)
  /* Base, encima la versión elegida y encima lo ajustado a mano en el taller.
     El mismo orden que usa el taller para enseñarla: si aquí y allá no fuera
     igual, el taller mostraría una pieza y el plano dibujaría otra. */
  const props = { ...def.props, ...(variante?.props ?? {}), ...(item.ajustes ?? {}) }
  const w = props.w ?? def.w
  const d = props.d ?? def.d

  return (
    <group
      name={item.id}
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
        onTomar(item.id)
      }}
    >
      {/* Las piezas del sistema nuevo se dibujan sin `position`/`rotation`:
          ya vienen colocadas por el grupo de arriba. Las viejas siguen
          pidiéndolos hasta que les toque migrar. */}
      {def.Nuevo ? (
        <Comp {...props} />
      ) : (
        <Comp position={[0, 0, 0]} rotation={[0, 0, 0]} {...props} />
      )}
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
    luz.current.power = p.lm * factor * escala
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
  const dirigido = esFoco && p.haz < 140

  return (
    <group
      name={item.id}
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
        onTomar(item.id)
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
          <pointLight ref={luz} distance={0} decay={2} castShadow={false} />
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
function Punto({ item, seleccionado, onTomar, activo, onAccionar, controla, colocando, onEncima, aLaVista = true }) {
  const desde = useRef(null)
  const esApagador = item.tipo === 'apagador'

  return (
    <group
      name={item.id}
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
        desde.current = [e.clientX, e.clientY]
        onTomar(item.id)
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
        {...(esY ? { raycast: () => null } : {})}
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
          if (e.ray.intersectPlane(PLANO_COTA, PUNTO)) {
            arrastrando.current = { desde: esX ? PUNTO.x : PUNTO.z, medida: largoCota }
          }
          e.target.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!arrastrando.current) return
          e.stopPropagation()
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

function Gizmo({ item, modo, onParchar, onFin, tamano = 1 }) {
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
      onParchar(item.id, {
        x: Number(o.position.x.toFixed(3)),
        y: Number(Math.max(0, o.position.y).toFixed(3)),
        z: Number(o.position.z.toFixed(3)),
      })
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

function Suelo({ ancho, largo, onMover, onSoltar, onColocar, arrastrando, colocando, onTocar, onFuera }) {
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

/* ── escena ───────────────────────────────────────────────────── */

export default function Escena({
  plano,
  seleccion,
  onSeleccionar,
  onMover,
  onColocar,
  colocando,
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
}) {
  const { ancho, largo, alto } = plano
  const [arrastrando, setArrastrando] = useState(null)
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
    if (orbita.current) orbita.current.enabled = !midiendo
  }, [midiendo])

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
    onMover(arrastrando, lx, lz)
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
      onPointerMissed={() => !midiendo && onSeleccionar(null)}
      onPointerUp={soltar}
    >
      {/* el fondo toma el muro de la paleta: es lo que hace que el cuarto se
          vea como un diorama y no como una maqueta flotando en el vacío */}
      <color attach="background" args={[fondo]} />
      <SeguirCamara onMover={(x, z) => setCam([x, z])} />

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
      />
      <Conexiones plano={plano} alto={alto} />

      <Suelo
        ancho={ancho}
        largo={largo}
        onMover={mover}
        onSoltar={soltar}
        onColocar={onColocar}
        arrastrando={arrastrando}
        colocando={colocando && !midiendo}
        onTocar={midiendo ? undefined : () => onSeleccionar(ID_MUROS)}
        onFuera={midiendo ? undefined : () => onSeleccionar(null)}
      />

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
        <>
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
        </>
      )}

      {/* el aro de giro solo en lo seleccionado: cuatro aros a la vez serían
          ruido y además se pelearían con el arrastre */}
      {/* el contorno de lo que está bajo el puntero, y el de lo seleccionado */}
      <Realce item={(encima && encima !== seleccion && plano.items.find((i) => i.id === encima)) || null} />
      {/* El hover se suelta en cuanto su pieza deja de existir: si no, se
          queda apuntando a un fantasma hasta que el puntero se mueva. */}
      <SoltarFantasma id={encima} items={plano.items} onSoltar={() => setEncima(null)} />
      {seleccionado && (
        <Seleccion
          item={seleccionado}
          modo={!midiendo && modoGizmo ? modoGizmo : null}
          onParchar={onParchar}
          onFin={onFinGizmo}
        />
      )}

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
