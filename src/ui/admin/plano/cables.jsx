import { useEffect, useMemo, useRef, useState } from 'react'
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
/**
 * @param s  semilla del cable, de 0 a 1. Dos cables que salen del mismo
 *           contacto no caen igual: uno se abre más, otro cuelga distinto.
 *           Sin esto, tres cables juntos se veían como un solo cable calcado
 *           tres veces, que es de lo primero que delata a un render.
 */
function trazo(desde, hasta, largo, ruta, guia, s = 0.5) {
  const recta = desde.distanceTo(hasta)
  // lo que sobra se cuelga o se enrosca; si falta, el cable va tenso
  const sobra = Math.max(0, largo - recta)
  const pts = []

  if (ruta === 'muro') {
    /* Por canaleta: baja o sube pegado al muro y corre horizontal. Dos
       quiebres rectos, que es exactamente como se ve una canaleta. */
    const codo = new THREE.Vector3(desde.x, hasta.y + 0.02 + s * 0.05, desde.z)
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
          const m = pie.clone().lerp(hasta, 0.42 + s * 0.16)
          m.y = 0.012
          /* La lazada se abre hacia un lado, proporcional a lo que sobra, y
             cuánto y hacia dónde depende de la semilla. */
          const lado = new THREE.Vector3().subVectors(hasta, pie).normalize()
          const giro = (s < 0.5 ? -1 : 1) * (0.5 + s * 0.8)
          m.addScaledVector(new THREE.Vector3(-lado.z, 0, lado.x), Math.min(sobra * 0.5 * giro, 0.7))
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
      desde.clone().lerp(pie, 0.45 + s * 0.14).setY(desde.y * (0.34 + s * 0.24)),
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
          <boxGeometry args={[0.038, 0.042, 0.019]} />
          <meshStandardMaterial
            color={enMano ? '#4d9fff' : '#2a2e38'}
            roughness={0.5}
            emissive="#4d9fff"
            emissiveIntensity={brillo}
          />
        </mesh>
        {/* el cuello por donde sale el cable, del lado contrario a las patas */}
        <mesh position={[0, -0.028, 0]}>
          <cylinderGeometry args={[0.006, 0.009, 0.022, 8]} />
          <meshStandardMaterial color="#23262e" roughness={0.8} />
        </mesh>
        {/* las patas, apuntando al contacto */}
        {[-1, 1].map((sg) => (
          <mesh key={sg} position={[sg * 0.0095, 0.031, 0]}>
            {/* solera plana, no barrote: una clavija de aquí trae dos navajas
                de milímetro y medio de espesor */}
            <boxGeometry args={[0.0065, 0.017, 0.0016]} />
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
  semilla = 0.5,
  onGuiar,
  onAgarrar,
  onSoltar,
}) {
  const malla = useRef()
  const agarre = useRef()
  const [encima, setEncima] = useState(false)
  const arrastrando = useRef(false)

  const base = useMemo(
    () => trazo(desde.clone(), hasta.clone(), largo, ruta, guia, semilla),
    [desde, hasta, largo, ruta, guia, semilla],
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

  /* Ya NO se mece.
     Tenía un vaivén mínimo para que se leyera como objeto físico y no como
     línea de diagrama, pero un cable quieto en el piso está quieto: moverse
     solo es lo que lo delataba. Sin el vaivén tampoco hay que rehacer la
     geometría cada cuadro, así que además cuesta menos. Lo único que cambia al
     pasar el ratón es que se ilumina. */

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
                /* La cámara se queda quieta mientras se acomoda el cable. El
                   `stopPropagation` de r3f no llega hasta OrbitControls —que
                   escucha el DOM del canvas, no el raycaster—, así que hay que
                   apagarlo a mano, igual que con la cota del muro. */
                onAgarrar?.()
                /* Y el punto por el que se agarró es el punto que se mueve.
                   Antes se movía siempre el mismo punto de en medio, así que
                   agarrar cerca del enchufe daba un tirón desde el otro lado
                   del cuarto. */
                if (e.point) onGuiar(e.point.x, e.point.z)
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
