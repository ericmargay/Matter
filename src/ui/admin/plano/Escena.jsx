import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Text, TransformControls } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

import { DEVICE_BY_ID } from '../../../content/catalog'

import { MUEBLES } from './catalogo'
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
const murosCache = new Map()
const matMuroDe = (color) => {
  if (!murosCache.has(color)) {
    murosCache.set(
      color,
      // roughness 1 y metalness 0: mate puro. El brillo especular es lo
      // primero que delata el render "de programa" y lo que aleja el plano
      // del dibujo isométrico que queremos.
      new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, side: THREE.BackSide }),
    )
  }
  return murosCache.get(color)
}

const matPiso = new THREE.MeshStandardMaterial({ color: '#a86a35', roughness: 1, metalness: 0 })

/* ── cascarón ─────────────────────────────────────────────────── */

/**
 * El cuarto como caja de juguete.
 *
 * El canto redondeado es casi todo el cambio de estilo. Un cuarto de aristas
 * vivas se lee como levantamiento técnico; el mismo cuarto con las esquinas
 * suavizadas se lee como maqueta, y la maqueta es la que el cliente entiende
 * sin que nadie se la explique.
 *
 * El redondeo de abajo se esconde bajo el piso —la caja arranca 20 cm más
 * abajo y es 20 cm más alta— porque si no, la curva deja una rendija de luz
 * justo en el zócalo.
 */
const HUNDIDO = 0.2

function Cuarto({ ancho, largo, alto, color = '#3d3a37', grosor = 0.12 }) {
  const t = grosor
  const radio = Math.min(0.22, alto / 6)
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={matPiso}>
        <planeGeometry args={[ancho, largo]} />
      </mesh>

      {/* una sola caja abierta: más barato que cuatro muros y siempre cierra */}
      <RoundedBox
        args={[ancho + t, alto + HUNDIDO, largo + t]}
        radius={radio}
        smoothness={4}
        steps={1}
        position={[0, (alto - HUNDIDO) / 2, 0]}
        material={matMuroDe(color)}
        receiveShadow
      />

      {/* La retícula se escala a la planta en vez de ser cuadrada: antes usaba
          el lado mayor y se desbordaba por el lado corto, y las líneas
          sobrantes se leían como si el piso siguiera más allá del muro. */}
      <gridHelper
        args={[1, Math.round(Math.max(ancho, largo) * 2), '#7a5334', '#8a5f3c']}
        scale={[ancho, 1, largo]}
        position={[0, 0.002, 0]}
      />
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

function Mueble({ item, seleccionado, onTomar, colocando }) {
  const g = useRef()
  useSombras(g)
  const def = MUEBLES[item.tipo]
  if (!def) return null
  const { Comp, w, d } = def

  return (
    <group
      ref={g}
      position={[item.x, item.y ?? 0, item.z]}
      rotation={[0, item.rot ?? 0, 0]}
      scale={item.esc ?? 1}
      onPointerDown={(e) => {
        /* Colocando, el clic tiene que llegar al piso: si un mueble lo
           intercepta, seleccionarlo en vez de soltar la pieza se siente roto
           —uno ya decidió qué poner y dónde. */
        if (colocando) return
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

/**
 * El volumen del dispositivo según qué es.
 *
 * No son modelos: son primitivas con la proporción correcta. Lo caro de un
 * modelo real no se paga con nada aquí —el aparato mide diez centímetros en un
 * cuarto de cuatro metros— pero la SILUETA sí se distingue, y es lo que
 * permite leer el plano sin leyenda.
 */
function Cuerpo({ device, params, encendido, color }) {
  const cat = device?.cat
  const forma = params?.forma
  const prendido = params && encendido

  const mat = (
    <meshStandardMaterial
      color={params ? '#f2ece3' : '#2a2521'}
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
  if (forma === 'panel') {
    return (
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 6]} />
        {mat}
      </mesh>
    )
  }
  if (params) {
    // empotrado: disco a ras. Colgante o foco: media esfera hacia abajo
    const empotrado = device?.power === 'cableado' || params.haz < 100
    return empotrado ? (
      <mesh castShadow>
        <cylinderGeometry args={[0.09, 0.075, 0.03, 16]} />
        {mat}
      </mesh>
    ) : (
      <mesh castShadow>
        <sphereGeometry args={[0.06, 14, 10]} />
        {mat}
      </mesh>
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

  if (cat === 'clima' || cat === 'hubs')
    return (
      <mesh castShadow>
        <boxGeometry args={[0.11, 0.11, 0.035]} />
        {gris}
      </mesh>
    )

  if (cat === 'red')
    return (
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.025, 20]} />
        {gris}
      </mesh>
    )

  if (cat === 'av')
    return (
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.17, 14]} />
        {gris}
      </mesh>
    )

  if (cat === 'pantallas')
    return (
      <mesh castShadow>
        <boxGeometry args={[1.45, 0.83, 0.04]} />
        <meshStandardMaterial color="#12100e" roughness={0.3} />
      </mesh>
    )

  if (cat === 'cortinas') {
    // `encendido` significa "abierta". La tela se recoge hacia arriba, que es
    // como se mueve una persiana enrollable de verdad.
    const caida = encendido ? 0.12 : 1.25
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

function Equipo({ item, encendido, seleccionado, onTomar, modo, alto, conSombra, colocando, escala = 1 }) {
  const p = item.params
  const dev = DEVICE_BY_ID[item.deviceId]
  const luz = useRef()

  const color = useMemo(() => kelvinAColor(p?.k ?? 2700), [p?.k])

  // la potencia se resuelve cada frame: así el deslizador de brillo y el
  // simulador de reglas se ven al instante, sin reconstruir la escena
  useFrame(() => {
    if (!luz.current || !p) return
    const factor = encendido ? (p.brillo ?? 100) / 100 : 0
    // `escala` es el diafragma de la cámara (ver exposicionDe). No cambia la
    // proporción entre piezas —una de 1600 lm sigue dando el doble que una de
    // 800— solo el nivel al que se revela el conjunto.
    luz.current.power = p.lm * factor * escala
    luz.current.color.copy(color)
    luz.current.visible = factor > 0.01
  })

  const esFoco = !!p
  const dirigido = esFoco && p.haz < 140

  return (
    <group
      position={[item.x, item.y ?? 0, item.z]}
      rotation={[0, item.rot ?? 0, 0]}
      scale={item.esc ?? 1}
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
      <Cuerpo device={dev} params={p} encendido={encendido} color={color} />

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

/**
 * Un punto eléctrico. El apagador, además, se puede tocar.
 *
 * Tocar y arrastrar salen del mismo gesto, así que se distinguen por la
 * distancia: si el puntero no se movió, fue un toque y acciona; si se movió,
 * fue un arrastre y solo mueve. Es lo que hace que el plano se sienta como la
 * casa — le picas al apagador y la luz responde.
 */
function Punto({ item, seleccionado, onTomar, activo, onAccionar, controla, colocando }) {
  const desde = useRef(null)
  const esApagador = item.tipo === 'apagador'

  return (
    <group
      position={[item.x, item.y ?? 0.4, item.z]}
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
          color={COLOR_PUNTO[item.tipo] ?? '#9c9388'}
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
          <meshBasicMaterial color={activo ? '#8fd694' : '#5a5048'} transparent opacity={0.9} />
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
const FLECHA = 0.2 // largo del cono de la punta

function Cota({ eje, ancho, largo, onMedir, midiendo, onEntrar }) {
  const arrastrando = useRef(false)

  const esX = eje === 'x'
  const activa = midiendo === eje
  const otraActiva = midiendo && !activa

  const largoCota = esX ? ancho : largo
  const fuera = (esX ? largo : ancho) / 2 + 0.55
  const pos = esX ? [0, 0.02, fuera] : [-fuera, 0.02, 0]
  const rot = esX ? [0, 0, 0] : [0, Math.PI / 2, 0]
  const color = activa ? '#ff9a4d' : '#9c9388'
  const opacidad = otraActiva ? 0.2 : 1

  const mat = (extra = {}) => (
    <meshBasicMaterial color={color} transparent opacity={opacidad} depthTest={false} {...extra} />
  )

  /* La punta apoya EN el borde, no lo rebasa. El cono se dibuja desde su
     centro, así que hay que recularlo medio cono: si se centra en el borde,
     la mitad de la flecha queda fuera de la medida que dice representar —que
     es justo lo que se veía. */
  const flecha = (signo) => (
    <mesh
      position={[(signo * (largoCota - FLECHA)) / 2, 0, 0]}
      rotation={[0, 0, signo > 0 ? -Math.PI / 2 : Math.PI / 2]}
      renderOrder={2}
    >
      <coneGeometry args={[activa ? 0.09 : 0.07, FLECHA, 8]} />
      {mat()}
    </mesh>
  )

  return (
    <group position={pos} rotation={rot}>
      {/* la línea, sin meterse dentro de los conos */}
      <mesh renderOrder={2}>
        <boxGeometry args={[Math.max(0.01, largoCota - FLECHA * 2), activa ? 0.035 : 0.02, 0.02]} />
        {mat()}
      </mesh>
      {flecha(1)}
      {flecha(-1)}

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
          <mesh key={sg} position={[(sg * (largoCota - FLECHA)) / 2, 0, 0]} renderOrder={3}>
            <sphereGeometry args={[0.13, 14, 10]} />
            <meshBasicMaterial color="#ff9a4d" transparent opacity={0.55} depthTest={false} />
          </mesh>
        ))}

      <Text
        position={[0, 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={activa ? 0.3 : 0.26}
        color={color}
        fillOpacity={opacidad}
        anchorX="center"
        renderOrder={3}
      >
        {largoCota.toFixed(2)} m
      </Text>

      {/* franja invisible de agarre: gruesa a propósito, para el dedo */}
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
          arrastrando.current = true
          e.target.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!arrastrando.current) return
          e.stopPropagation()
          /* Se mide desde el centro del cuarto: el muro de enfrente no se
             mueve, así que la medida es el doble de lo que se jaló. */
          const v = esX ? e.point.x : e.point.z
          onMedir(eje, Math.max(1.2, Math.abs(v) * 2))
        }}
        onPointerUp={(e) => {
          arrastrando.current = false
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

function Gizmo({ item, modo, onParchar, onFin }) {
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
      onParchar(item.id, { rot: Number(o.rotation.y.toFixed(4)) })
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
          size={0.9}
          space="world"
          /* girar solo en Y: inclinar un mueble no es algo que se haga en un
             levantamiento, y los otros dos anillos solo estorban al agarrar */
          showX={modo !== 'girar'}
          showY={modo !== 'mover'}
          showZ={modo !== 'girar'}
          translationSnap={0.05}
          rotationSnap={Math.PI / 72}
          onObjectChange={aplicar}
          onMouseUp={onFin}
        />
      )}
    </>
  )
}

/* ── el sol y el cielo ────────────────────────────────────────── */

/**
 * La luz que NO viene de las piezas.
 *
 * Hasta aquí el plano se iluminaba solo con los lúmenes del catálogo, y eso
 * tenía un defecto de fondo: de día un cuarto real no se ve por sus focos, se
 * ve por la ventana. Por eso "día" salía plano y "noche" salía a cueva.
 *
 * Este sol es ficticio a propósito. El número de lux del recuadro sigue
 * saliendo del cálculo fotométrico de siempre —esa es la parte que se le
 * cotiza al cliente— pero lo que se ve en pantalla ya es una puesta de luz
 * dirigida: sol cálido de un lado, cielo frío de relleno. Es la diferencia
 * entre un render correcto y un render que se entiende.
 */
function Rig({ modo, ancho, largo, alto }) {
  const dia = modo === 'dia'
  const lejos = Math.max(ancho, largo)

  return (
    <>
      {/* El cielo tiñe de azul lo que el sol no toca. Es lo que hace que una
          sombra se vea fría en vez de gris sucia. */}
      <hemisphereLight
        args={dia ? ['#cfe0f5', '#9a6b42', 1.5] : ['#2a3550', '#120f0c', 0.2]}
        position={[0, alto, 0]}
      />
      {/* El relleno de noche va corto a propósito. Subirlo aplana el cuarto y
          las lámparas dejan de mandar — y si de noche no manda la lámpara, el
          modo noche no está respondiendo nada. */}
      <ambientLight intensity={dia ? 0.55 : 0.12} />

      {dia && (
        /* El sol entra por la izquierda, NO por donde mira la cámara. Puesto
           del lado del observador las sombras caen detrás de cada mueble y no
           se ve una sola: el plano parecía no tener sombras cuando en realidad
           las tenía todas escondidas. */
        <directionalLight
          position={[-lejos * 0.95, alto * 2.4, lejos * 1.05]}
          intensity={3.1}
          color="#ffd7a3"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0012}
          shadow-normalBias={0.02}
          shadow-camera-left={-lejos}
          shadow-camera-right={lejos}
          shadow-camera-top={lejos}
          shadow-camera-bottom={-lejos}
          shadow-camera-near={0.1}
          shadow-camera-far={lejos * 6}
        />
      )}
    </>
  )
}

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
        color="#0a0908"
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
  encendidos,
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
  const orbita = useRef()

  /* En modo medida la cámara se queda quieta. Era el estorbo principal:
     `stopPropagation` de r3f no llega hasta OrbitControls —escucha el DOM del
     canvas, no el raycaster— así que jalar la cota giraba la escena al mismo
     tiempo y no había forma de atinarle a la medida. */
  useEffect(() => {
    if (orbita.current) orbita.current.enabled = !midiendo
  }, [midiendo])

  const tomar = (id) => {
    if (midiendo) return
    onSeleccionar(id)
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
      <color attach="background" args={['#0a0908']} />

      <Rig modo={modo} ancho={ancho} largo={largo} alto={alto} />
      {/* Sombras suaves de verdad. Cuestan un poco de GPU y son de lo que más
          aporta al look de maqueta: el canto duro de una sombra dura es lo que
          hace que un render se vea barato. */}

      {ventanas.map((v) => (
        <LuzVentana key={v.id} item={v} ancho={ancho} largo={largo} alto={alto} dia={modo === 'dia'} />
      ))}

      <Cuarto ancho={ancho} largo={largo} alto={alto} color={plano.muroColor} grosor={plano.muroGrosor} />

      <Suelo
        ancho={ancho}
        largo={largo}
        onMover={mover}
        onSoltar={soltar}
        onColocar={onColocar}
        arrastrando={arrastrando}
        colocando={colocando && !midiendo}
      />

      {plano.items.map((it) => {
        const sel = it.id === seleccion
        if (it.clase === 'mueble')
          return <Mueble key={it.id} item={it} seleccionado={sel} onTomar={tomar} colocando={colocando} />
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
              colocando={colocando}
              escala={exposicion}
            />
          )
        return (
          <Punto
            key={it.id}
            item={it}
            seleccionado={sel}
            onTomar={tomar}
            activo={encendidos?.has(it.id)}
            onAccionar={onAccionar}
            controla={conRegla?.has(it.id)}
            colocando={colocando}
          />
        )
      })}

      {plano.tramos.map((t) => (
        <Tramo key={t.id} tramo={t} />
      ))}

      {/* las manijas solo cuando no se está colocando algo: si no, estorban
          justo en el borde donde uno quiere soltar la pieza */}
      {onMedida && !colocando && (
        <>
          <Cota eje="x" ancho={ancho} largo={largo} onMedir={onMedida} midiendo={midiendo} onEntrar={onMidiendo} />
          <Cota eje="z" ancho={ancho} largo={largo} onMedir={onMedida} midiendo={midiendo} onEntrar={onMidiendo} />
        </>
      )}

      {/* el aro de giro solo en lo seleccionado: cuatro aros a la vez serían
          ruido y además se pelearían con el arrastre */}
      {seleccionado && !midiendo && modoGizmo && (
        <Gizmo item={seleccionado} modo={modoGizmo} onParchar={onParchar} onFin={onFinGizmo} />
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
