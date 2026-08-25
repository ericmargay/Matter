import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'


/**
 * El cable, dibujado. Las medidas y las rutas viven en `cables.js`; aquí solo
 * está cómo se ve y cómo se mueve.
 */

const COLOR = { piso: '#3b3f4a', muro: '#4a505e', oculto: '#6f5a86' }

/**
 * @param desde  punto de salida del aparato, en mundo
 * @param hasta  el contacto, en mundo
 * @param largo  metros de cable disponibles
 */
function trazo(desde, hasta, largo, ruta, guia) {
  const recta = desde.distanceTo(hasta)
  // lo que sobra se cuelga o se enrosca; si falta, el cable va tenso
  const sobra = Math.max(0, largo - recta)
  const pts = []

  if (ruta === 'muro') {
    /* Por canaleta: baja o sube pegado al muro y corre horizontal. Dos
       quiebres rectos, que es exactamente como se ve una canaleta. */
    const codo = new THREE.Vector3(desde.x, hasta.y + 0.02, desde.z)
    pts.push(desde, desde.clone().lerp(codo, 0.5), codo, codo.clone().lerp(hasta, 0.5), hasta)
  } else if (ruta === 'oculto') {
    // por dentro: la ruta más corta, en escuadra
    const codo = new THREE.Vector3(desde.x, hasta.y, desde.z)
    pts.push(desde, codo, hasta)
  } else {
    // por el piso: cae, se arrastra y hace una lazada con lo que sobra
    const pie = new THREE.Vector3(desde.x, 0.012, desde.z)
    /* Si alguien lo arrastró a un rincón, ése es el punto por el que pasa.
       Un cable no va del aparato al contacto en línea recta cruzando el
       cuarto: va por la orilla, y por dónde exactamente es una decisión de
       quien instala, no un cálculo. Por eso se arrastra a mano. */
    const medio = guia
      ? new THREE.Vector3(guia.x, 0.012, guia.z)
      : (() => {
          const m = pie.clone().lerp(hasta, 0.5)
          m.y = 0.012
          // la lazada se abre hacia un lado, proporcional a lo que sobra
          const lado = new THREE.Vector3().subVectors(hasta, pie).normalize()
          m.addScaledVector(new THREE.Vector3(-lado.z, 0, lado.x), Math.min(sobra * 0.45, 0.6))
          return m
        })()
    /* Y sube al contacto pegado al muro, no en diagonal desde media
       habitación. Un cable no despega del piso: se arrastra hasta debajo del
       enchufe y ahí sube. Sin este punto, todos salían volando hacia el
       contacto y el piso se veía vacío, que es justo lo contrario de lo que
       hay que enseñar. */
    const alPie = new THREE.Vector3(hasta.x, 0.012, hasta.z)
    pts.push(
      desde,
      desde.clone().lerp(pie, 0.5).setY(desde.y * 0.45),
      pie,
      medio,
      alPie,
      alPie.clone().lerp(hasta, 0.6),
      hasta,
    )
  }
  return pts
}

/**
 * La clavija: dónde queda enchufado cada aparato.
 *
 * Se dibuja saliendo del contacto, ocho centímetros hacia su propio cable, que
 * es como se ve una clavija puesta. Sirve para lo mismo que el cable: que el
 * contacto que va a usar cada aparato sea algo que se VE en el plano y no un
 * dato escondido en un menú.
 *
 * Va ORIENTADA: las patas apuntan al contacto y el cuerpo queda perpendicular
 * al muro. Antes se dibujaba siempre en la misma dirección y se veía a pieza
 * flotando junto al contacto en vez de enchufada en él — que es exactamente el
 * detalle por el que uno deja de creerle a un plano.
 *
 * @param quat  cuaternión que lleva el eje de las patas (+Y local) a apuntar
 *              al contacto. Se calcula donde se sabe dónde está el contacto.
 */
export function Clavija({ pos, quat, enMano, onTomar }) {
  const [encima, setEncima] = useState(false)
  const brillo = enMano ? 0.9 : encima ? 0.4 : 0

  return (
    <group position={pos} quaternion={quat}>
      {/* Zona de agarre generosa: atinarle a una clavija de cinco centímetros
          en perspectiva es una prueba de puntería que no le interesa a nadie. */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          setEncima(true)
        }}
        onPointerOut={() => setEncima(false)}
        onPointerDown={(e) => {
          e.stopPropagation()
          onTomar?.()
        }}
      >
        <sphereGeometry args={[0.13, 12, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group scale={enMano || encima ? 1.3 : 1}>
        {/* el cuerpo, con la cara ancha viendo al muro */}
        <mesh castShadow>
          <boxGeometry args={[0.046, 0.05, 0.03]} />
          <meshStandardMaterial
            color={enMano ? '#4d9fff' : '#2a2e38'}
            roughness={0.5}
            emissive="#4d9fff"
            emissiveIntensity={brillo}
          />
        </mesh>
        {/* el cuello por donde sale el cable, del lado contrario a las patas */}
        <mesh position={[0, -0.032, 0]}>
          <cylinderGeometry args={[0.008, 0.011, 0.026, 8]} />
          <meshStandardMaterial color="#23262e" roughness={0.8} />
        </mesh>
        {/* las patas, apuntando al contacto */}
        {[-1, 1].map((sg) => (
          <mesh key={sg} position={[sg * 0.011, 0.038, 0]}>
            <boxGeometry args={[0.006, 0.03, 0.006]} />
            <meshStandardMaterial color="#c9b48a" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* El piso, para saber a dónde se está arrastrando. Se usa el rayo que ya trae
   el evento de R3F en vez de proyectar a mano: proyectar a mano es de donde
   salen los arrastres que se van a otro lado del cuarto. */
const PLANO_PISO = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.012)
const DONDE = new THREE.Vector3()

/**
 * @param guia      punto del piso por el que pasa el cable, si alguien lo movió
 * @param onGuiar   se llama mientras se arrastra, con el punto del piso
 * @param onSoltar  se llama al soltar, para dejarlo en la historia
 */
export function Cable({
  desde,
  hasta,
  largo = 1.8,
  ruta = 'piso',
  alcanza = true,
  interactivo = true,
  guia = null,
  onGuiar,
  onSoltar,
}) {
  const malla = useRef()
  const agarre = useRef()
  const [encima, setEncima] = useState(false)
  const arrastrando = useRef(false)
  const fase = useRef(0)

  const base = useMemo(
    () => trazo(desde.clone(), hasta.clone(), largo, ruta, guia),
    [desde, hasta, largo, ruta, guia],
  )
  /* La curva se suaviza y luego se le pone piso.
     Un Catmull-Rom que pasa por puntos a distinta altura se pasa de la raya
     entre uno y otro, y donde se pasaba era hacia abajo: el cable se metía
     bajo el piso y aparecía cortado en dos pedazos. Se muestrea, se levanta lo
     que quedó hundido y se vuelve a suavizar con menos tensión, que además es
     como se ve un cable de verdad —arrastrado, no tirante—. */
  const curva = useMemo(() => {
    const suave = new THREE.CatmullRomCurve3(base.map((p) => p.clone()))
    if (ruta !== 'piso') return suave
    const ps = suave.getPoints(48)
    for (const q of ps) if (q.y < 0.012) q.y = 0.012
    return new THREE.CatmullRomCurve3(ps, false, 'catmullrom', 0.3)
  }, [base, ruta])

  /* El meneo se calcula contra los puntos de ESTA curva, no contra los del
     trazo: después de suavizar y levantar del piso ya no son los mismos ni son
     los mismos cuántos. */
  const reposo = useMemo(() => curva.points.map((p) => p.clone()), [curva])

  /* La geometría la posee ESTE componente, no React.
     Con `geometry={...}` como prop o como hijo de JSX, React la vuelve a poner
     en cada render encima de la que acaba de calcular el cuadro anterior —y
     como esa ya se desechó, el cable desaparecía: se veía el primer cuadro y
     nada más. Un tubo no se puede deformar en su sitio, así que se rehace, y
     por eso hay que ser dueño de él. */
  useEffect(() => {
    const m = malla.current
    if (!m) return
    m.geometry?.dispose()
    m.geometry = new THREE.TubeGeometry(curva, 40, 0.009, 7, false)
    return () => m.geometry?.dispose()
  }, [curva])

  /* Y una funda invisible y gorda encima, que es la que recibe el ratón.
     Atinarle a un cable de nueve milímetros en perspectiva es una prueba de
     puntería: con la funda basta con pasar cerca. Es la misma idea que ya
     tenía la clavija. */
  useEffect(() => {
    const g = agarre.current
    if (!g) return
    g.geometry?.dispose()
    g.geometry = new THREE.TubeGeometry(curva, 24, 0.055, 5, false)
    return () => g.geometry?.dispose()
  }, [curva])

  /* Se mece al pasar por encima, como si lo hubieran rozado. No es adorno: es
     lo que lo hace leer como objeto físico y no como una línea de diagrama, y
     de paso avisa que se puede tocar. Solo se mueven los puntos de en medio —
     los dos extremos están enchufados y ésos no se mueven nunca. */
  useFrame((_, dt) => {
    const m = malla.current
    if (!m) return
    fase.current += dt * (encima ? 3.4 : 0.8)
    /* Mientras se arrastra no se mece: el cable tiene que ir exactamente
       debajo del dedo o se siente que se resiste. */
    const amp = arrastrando.current ? 0 : (encima ? 0.03 : 0.005) * (ruta === 'piso' ? 1 : 0.4)
    const ps = curva.points
    for (let i = 1; i < ps.length - 1; i++) {
      const b = reposo[i]
      if (!b) break
      const t = fase.current + i * 0.9
      ps[i].set(
        b.x + Math.sin(t) * amp,
        Math.max(0.012, b.y + Math.sin(t * 1.7) * amp * 0.6),
        b.z + Math.cos(t * 1.1) * amp,
      )
    }
    const nueva = new THREE.TubeGeometry(curva, 40, encima ? 0.012 : 0.009, 7, false)
    m.geometry?.dispose()
    m.geometry = nueva
  })

  return (
    <group>
      <mesh ref={malla} castShadow>
        <meshStandardMaterial
          color={alcanza ? COLOR[ruta] : '#e0533f'}
          roughness={0.75}
          emissive={encima ? '#4d9fff' : '#000000'}
          emissiveIntensity={encima ? 0.55 : 0}
        />
      </mesh>

      <mesh
        ref={agarre}
        visible={false}
        raycast={interactivo ? undefined : () => null}
        onPointerOver={
          interactivo
            ? (e) => {
                e.stopPropagation()
                setEncima(true)
              }
            : undefined
        }
        onPointerOut={interactivo ? () => setEncima(false) : undefined}
        onPointerDown={
          interactivo && onGuiar && ruta === 'piso'
            ? (e) => {
                e.stopPropagation()
                arrastrando.current = true
                e.target.setPointerCapture(e.pointerId)
              }
            : undefined
        }
        onPointerMove={
          interactivo && onGuiar
            ? (e) => {
                if (!arrastrando.current) return
                e.stopPropagation()
                if (!e.ray.intersectPlane(PLANO_PISO, DONDE)) return
                onGuiar(DONDE.x, DONDE.z)
              }
            : undefined
        }
        onPointerUp={
          interactivo && onGuiar
            ? (e) => {
                if (!arrastrando.current) return
                arrastrando.current = false
                e.target.releasePointerCapture(e.pointerId)
                onSoltar?.()
              }
            : undefined
        }
      />
    </group>
  )
}
