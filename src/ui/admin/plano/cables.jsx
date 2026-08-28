import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { useEstilo } from './estilo'


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
function trazo(desde, hasta, largo, ruta, guia, s = 0.5, cuarto = null, borde = null) {
  const recta = desde.distanceTo(hasta)
  // lo que sobra se cuelga o se enrosca; si falta, el cable va tenso
  const sobra = Math.max(0, largo - recta)
  const pts = []

  if (ruta === 'muro') {
    /* Por canaleta: no es una diagonal disimulada, es una ruta de verdad —baja
       perpendicular al muro, corre por el rodapié doblando en las esquinas y
       sube al contacto—. Es exactamente lo que se instala y lo que se cobra,
       así que dibujarlo de otra forma sería enseñar algo que no vamos a hacer. */
    return redondear(rutaPorMuro(desde, hasta, cuarto), 0.09)
  }

  if (ruta === 'oculto') {
    // por dentro: la ruta más corta, en escuadra
    const codo = new THREE.Vector3(desde.x, hasta.y, desde.z)
    pts.push(desde, codo, hasta)
    return pts
  }

  /* Lo que sale de encima de un mueble no cae donde está: primero corre por
     la cubierta hasta `borde` —la orilla contra el muro, ya calculada por
     quien llama— y desde ahí es como si el cable arrancara ahí. Sin esto,
     el cable de un monitor caía a través del escritorio en vez de detrás. */
  const salida = borde ?? desde

  // por el piso: cae, se arrastra y hace una lazada con lo que sobra
  const pie = new THREE.Vector3(salida.x, 0.012, salida.z)
  /* Si alguien lo arrastró a un rincón, ése es el punto por el que pasa.
     Un cable no va del aparato al contacto en línea recta cruzando el
     cuarto: va por la orilla, y por dónde exactamente es una decisión de
     quien instala, no un cálculo. Por eso se arrastra a mano.

     Pero la guía es del layout donde se arrastró, no del aparato: si la
     lámpara se movió al otro lado del cuarto —por un rediseño, o porque se
     encogió el muro al que estaba pegada— la guía se queda apuntando a donde
     ya no hay nada, y el cable tiene que dar la vuelta completa al cuarto
     para pasar por ahí. Un giro así de cerrado no es sólo feo: le rompe el
     marco de Frenet a TubeGeometry —el cálculo que orienta el tubo a lo largo
     de la curva— y el cable entero se vuelve invisible en vez de quedarse
     nada más torcido. Por eso se descarta la guía si el rodeo que exige es
     mucho más largo que el camino directo: a esa distancia ya no es "el
     rincón donde lo dejé", es un punto de otra época. */
  const rumbo = guia ? new THREE.Vector3(guia.x, 0.012, guia.z) : null
  const rodeo = rumbo ? pie.distanceTo(rumbo) + rumbo.distanceTo(hasta) : 0
  const guiaSirve = rumbo && rodeo < Math.max(recta, 0.5) * 2.5 + 1.5
  const medio = guiaSirve
    ? rumbo
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
     enchufe y ahí sube. */
  const alPie = new THREE.Vector3(hasta.x, 0.012, hasta.z)
  pts.push(
    desde,
    ...(borde ? [borde] : []),
    salida.clone().lerp(pie, 0.45 + s * 0.14).setY(salida.y * (0.34 + s * 0.24)),
    pie,
    medio,
    alPie,
    alPie.clone().lerp(hasta, 0.6),
    hasta,
  )
  return pts
}

/* ── la ruta por canaleta ─────────────────────────────────────────
   Tres tramos y ninguno en diagonal: se baja o se sube perpendicular al muro
   donde está el aparato, se corre por el rodapié dando la vuelta por las
   esquinas que haga falta, y se sube al contacto. La vuelta se da por el lado
   corto, que es lo que hace que la ruta sea la más barata en metros de
   canaleta — que es como se cotiza. */

const SEP = 0.03 // cuánto se despega la canaleta del muro
const ZOCLO = 0.075 // la altura a la que corre, sobre el rodapié

/** El punto del perímetro más cercano, con el muro y la posición en él. */
function alMuro(p, hx, hz) {
  const cand = [
    { lado: 'z-', d: Math.abs(p.z + hz), x: p.x, z: -hz + SEP },
    { lado: 'z+', d: Math.abs(p.z - hz), x: p.x, z: hz - SEP },
    { lado: 'x-', d: Math.abs(p.x + hx), x: -hx + SEP, z: p.z },
    { lado: 'x+', d: Math.abs(p.x - hx), x: hx - SEP, z: p.z },
  ]
  const g = cand.reduce((a, b) => (b.d < a.d ? b : a))
  return {
    lado: g.lado,
    x: Math.max(-hx + SEP, Math.min(hx - SEP, g.x)),
    z: Math.max(-hz + SEP, Math.min(hz - SEP, g.z)),
  }
}

const ESQUINAS = ['z-', 'x+', 'z+', 'x-'] // en orden, dando la vuelta al cuarto

/** La esquina entre dos muros contiguos. */
function esquina(a, b, hx, hz) {
  const ejeX = a === 'x-' || b === 'x-' ? -hx + SEP : hx - SEP
  const ejeZ = a === 'z-' || b === 'z-' ? -hz + SEP : hz - SEP
  return { x: ejeX, z: ejeZ }
}

function rutaPorMuro(desde, hasta, cuarto) {
  const hx = (cuarto?.ancho ?? 4) / 2
  const hz = (cuarto?.largo ?? 4) / 2
  const a = alMuro(desde, hx, hz)
  const b = alMuro(hasta, hx, hz)
  const pts = [desde.clone()]

  // 1. del aparato a su muro, en horizontal
  pts.push(new THREE.Vector3(a.x, desde.y, a.z))
  // 2. baja al rodapié
  pts.push(new THREE.Vector3(a.x, ZOCLO, a.z))

  // 3. la vuelta por las esquinas, si están en muros distintos
  if (a.lado !== b.lado) {
    const i = ESQUINAS.indexOf(a.lado)
    const j = ESQUINAS.indexOf(b.lado)
    const adelante = (j - i + 4) % 4
    const paso = adelante <= 2 ? 1 : -1
    for (let k = i; k !== j; k = (k + paso + 4) % 4) {
      const sig = (k + paso + 4) % 4
      const e = esquina(ESQUINAS[k], ESQUINAS[sig], hx, hz)
      pts.push(new THREE.Vector3(e.x, ZOCLO, e.z))
    }
  }

  // 4. hasta debajo del contacto, y sube
  pts.push(new THREE.Vector3(b.x, ZOCLO, b.z))
  pts.push(new THREE.Vector3(b.x, hasta.y, b.z))
  pts.push(hasta.clone())
  return pts
}

/**
 * Redondea las esquinas de una polilínea.
 *
 * Una canaleta no dobla en pico: lleva su codo, y el cable de adentro lo dobla
 * con radio. Cada vértice se cambia por dos puntos a `r` de distancia sobre
 * cada tramo, y el suavizado de la curva hace el resto. Sin esto la ruta se
 * veía a diagrama de metro.
 */
function redondear(pts, r = 0.09) {
  if (pts.length < 3) return pts
  const out = [pts[0].clone()]
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]
    const antes = pts[i - 1]
    const luego = pts[i + 1]
    const da = new THREE.Vector3().subVectors(antes, p)
    const dl = new THREE.Vector3().subVectors(luego, p)
    const ra = Math.min(r, da.length() * 0.45)
    const rl = Math.min(r, dl.length() * 0.45)
    if (ra < 0.005 || rl < 0.005) {
      out.push(p.clone())
      continue
    }
    out.push(p.clone().addScaledVector(da.normalize(), ra))
    out.push(p.clone().addScaledVector(dl.normalize(), rl))
  }
  out.push(pts[pts.length - 1].clone())
  return out
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
/**
 * Dónde nace el cable de una clavija puesta: el punto de atrás del cuerpo
 * —opuesto a las patas, que es de donde sale un cordón de verdad— llevado al
 * mundo con la MISMA rotación que el cuerpo. La punta del cuello, en cambio,
 * NO seguía esa rotación: cuelga siempre derecho hacia abajo, como cuelga
 * cualquier cordón por su propio peso sin importar de qué lado entró la
 * clavija. Exportada porque la escena necesita este mismo punto para saber
 * dónde termina de verdad el cable, no dónde está el centro de la clavija.
 */
export function puntaCable(pos, quat, factor = 1) {
  const p = new THREE.Vector3(...pos)
  const q = new THREE.Quaternion(...quat)
  const atras = new THREE.Vector3(0, -0.013 * factor, 0).applyQuaternion(q)
  return p.add(atras).addScaledVector(new THREE.Vector3(0, -1, 0), 0.012 * factor)
}

export function Clavija({ pos, quat, enMano, onTomar }) {
  const [encima, setEncima] = useState(false)
  const brillo = enMano ? 0.9 : encima ? 0.4 : 0
  const factor = enMano || encima ? 1.12 : 1

  /* El punto de atrás del cuerpo, en el mundo: ahí empieza el cuello, y de
     ahí cuelga. Se recalcula con la MISMA cuenta que `puntaCable` menos el
     último tramo, porque aquí sí hace falta el punto de arriba del cuello y
     no el de abajo. */
  const atras = useMemo(() => {
    const p = new THREE.Vector3(...pos)
    const q = new THREE.Quaternion(...quat)
    return p.add(new THREE.Vector3(0, -0.013 * factor, 0).applyQuaternion(q))
  }, [pos, quat, factor])

  return (
    <group>
      <group position={pos} quaternion={quat}>
        {/* Zona de agarre: nueve centímetros de radio, la cuarta parte de la
           que había. La de antes —trece— no se ve porque es transparente,
           pero SÍ es geometría real, y el paso de normales que usa la
           sombra de contacto (N8AO) no distingue transparencia: pintaba un
           disco de sombra ancho justo donde no había nada que lo explicara.
           Con el cuerpo ya reducido a 22 mm, nueve de radio sigue sobrando
           para picarle sin apuntar con lupa. */}
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
          <sphereGeometry args={[0.045, 12, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Al agarrarla crece un poco, pero mucho menos que antes: inflarla al
            treinta por ciento la volvía más grande que el adaptador donde va
            metida, y una clavija más grande que su multicontacto se ve a
            juguete. */}
        <group scale={factor}>
          {/* El cuerpo. Veintidós por veintiséis por diez milímetros. */}
          <mesh castShadow>
            <boxGeometry args={[0.022, 0.026, 0.01]} />
            <meshStandardMaterial
              color={enMano ? '#4d9fff' : '#2a2e38'}
              roughness={0.5}
              emissive="#4d9fff"
              emissiveIntensity={brillo}
            />
          </mesh>
          {/* Un cuello corto y simétrico, todavía pegado al cuerpo y girando
              con él: es la tensión donde el cordón sale de la carcasa. De ahí
              para abajo el cordón ya no gira con la clavija —cuelga solo,
              más abajo. */}
          <mesh position={[0, -0.015, 0]}>
            <cylinderGeometry args={[0.0035, 0.0045, 0.004, 8]} />
            <meshStandardMaterial color="#23262e" roughness={0.8} />
          </mesh>
          {/* Las patas, metidas en la boca. Del centro del cuerpo a la punta de
             la pata hay 22 mm — es la cifra que usa la escena para saber dónde
             enchufarla, así que si esto se mueve, aquélla se descuadra. */}
          {[-1, 1].map((sg) => (
            <mesh key={sg} position={[sg * 0.006, 0.0175, 0]}>
              <boxGeometry args={[0.004, 0.009, 0.0013]} />
              <meshStandardMaterial color="#c9b48a" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>

      {/* El resto del cuello: SIEMPRE cuelga hacia abajo, sin importar cómo
          quedó girado el cuerpo para entrar a su boca. Un cordón de verdad no
          sabe de qué lado lo enchufaron —la gravedad lo dobla igual—, así que
          plantarlo horizontal cuando la clavija entra de canto era el error:
          el cable arrancaba apuntando al muro en vez de para abajo. */}
      <mesh position={[atras.x, atras.y - 0.006 * factor, atras.z]}>
        <cylinderGeometry args={[0.003, 0.0035, 0.012 * factor, 8]} />
        <meshStandardMaterial color="#23262e" roughness={0.8} />
      </mesh>
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
  borde = null,
  largo = 1.8,
  ruta = 'piso',
  alcanza = true,
  interactivo = true,
  guia = null,
  semilla = 0.5,
  cuarto = null,
  onGuiar,
  onAgarrar,
  onSoltar,
}) {
  const radio = useEstilo((e) => e.grosorCable) / 2000
  const malla = useRef()
  const agarre = useRef()
  const [encima, setEncima] = useState(false)
  const arrastrando = useRef(false)

  const base = useMemo(
    () => trazo(desde.clone(), hasta.clone(), largo, ruta, guia, semilla, cuarto, borde),
    [desde, hasta, largo, ruta, guia, semilla, cuarto, borde],
  )
  /* La curva se suaviza y luego se le pone piso.
     Un Catmull-Rom que pasa por puntos a distinta altura se pasa de la raya
     entre uno y otro, y donde se pasaba era hacia abajo: el cable se metía
     bajo el piso y aparecía cortado en dos pedazos. Se muestrea, se levanta lo
     que quedó hundido y se vuelve a suavizar con menos tensión, que además es
     como se ve un cable de verdad —arrastrado, no tirante—. */
  const curva = useMemo(() => {
    const suave = new THREE.CatmullRomCurve3(base.map((p) => p.clone()))
    if (ruta === 'oculto') return suave
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
    m.geometry = new THREE.TubeGeometry(curva, 40, radio, 7, false)
    return () => m.geometry?.dispose()
  }, [curva, radio])

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
