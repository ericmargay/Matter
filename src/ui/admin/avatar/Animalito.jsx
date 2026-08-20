import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

import { capsula, cilindro, esfera } from '../plano/geo'
import { materialDe, useEstilo } from '../plano/estilo'
import { ESPECIE_BY_ID, PROPORCION } from './especies'

/**
 * Un animalito, armado de primitivas.
 *
 * Todo lo que se ve aquí son esferas, cápsulas y cilindros con el canto
 * suavizado del sistema de diseño — los mismos con los que están hechos los
 * muebles. Esa es la decisión de fondo: un personaje que pertenece a la casa
 * donde está parado, no una figura importada que se ve pegada encima.
 *
 * La proporción hace el estilo, no el detalle. Cabeza enorme, cuerpo de pera y
 * patitas cortas: con esas tres cosas se reconoce el personaje aunque esté a
 * veinte pixeles de alto, que es como se va a ver la mitad de las veces.
 *
 * Y se anima por cálculo, no por archivo. Un animalito son ocho movimientos de
 * grupos —la cabeza que asiente, la cola que se mueve, la panza que respira—
 * así que las poses no pesan nada y se pueden mezclar.
 */
export default function Animalito({ config, pose = 'reposo', estatura = 1.2, ...props }) {
  const e = useEstilo()
  const esp = ESPECIE_BY_ID[config?.especie] ?? ESPECIE_BY_ID.gato

  const cuerpo = useRef()
  const cabeza = useRef()
  const brazoIzq = useRef()
  const brazoDer = useRef()
  const piernaIzq = useRef()
  const piernaDer = useRef()
  const cola = useRef()
  const raiz = useRef()

  /* Medidas derivadas de la estatura. Todo cuelga de un solo número para que
     un animalito de 90 cm y uno de 1.70 sean el mismo diseño y no dos. */
  const m = useMemo(() => {
    const h = estatura
    const gordo = esp.corpulento ?? 1
    const rCabeza = h * PROPORCION.cabeza * 0.5
    const hCuerpo = h * PROPORCION.cuerpo
    const hPata = h * PROPORCION.patas
    return {
      h,
      rCabeza,
      hCuerpo,
      hPata,
      rCuerpo: hCuerpo * 0.62 * gordo,
      yCuerpo: hPata + hCuerpo * 0.5,
      yCabeza: hPata + hCuerpo + rCabeza * 0.78,
      rPata: h * 0.045,
      rBrazo: h * 0.04,
    }
  }, [estatura, esp])

  const mat = (color, rol = 'tela') =>
    materialDe(color, { rol, rugosidad: e.rugosidad, metalico: e.metalico, saturacion: e.saturacion })

  const pelaje = mat(config?.pelaje ?? esp.pelaje, 'tela')
  const panza = mat(config?.panza ?? esp.panza, 'tela')
  const ropa = mat(config?.colorRopa ?? '#4d9fff', 'tela')
  const oscuro = mat('#2a2620', 'plastico')

  /* ── el movimiento ──────────────────────────────────────────────
     Poco y lento. La referencia es un personaje que espera, no uno que actúa:
     si el movimiento se nota, ya es demasiado. */
  useFrame((st) => {
    const t = st.clock.elapsedTime
    const g = { cuerpo: cuerpo.current, cabeza: cabeza.current, raiz: raiz.current }
    if (!g.cuerpo || !g.cabeza) return

    // la respiración va siempre, en todas las poses: es lo que lo hace vivo
    const respira = 1 + Math.sin(t * 1.6) * 0.018
    g.cuerpo.scale.set(1, respira, 1)

    const bi = brazoIzq.current
    const bd = brazoDer.current
    const pi = piernaIzq.current
    const pd = piernaDer.current

    if (pose === 'camina') {
      const p = t * 6
      if (pi) pi.rotation.x = Math.sin(p) * 0.6
      if (pd) pd.rotation.x = -Math.sin(p) * 0.6
      if (bi) bi.rotation.x = -Math.sin(p) * 0.5
      if (bd) bd.rotation.x = Math.sin(p) * 0.5
      if (g.raiz) g.raiz.position.y = Math.abs(Math.sin(p)) * m.h * 0.012
      g.cabeza.rotation.z = Math.sin(p * 0.5) * 0.05
    } else if (pose === 'saludo') {
      if (bd) {
        bd.rotation.z = -2.2
        bd.rotation.x = Math.sin(t * 7) * 0.35
      }
      if (bi) bi.rotation.x = Math.sin(t * 1.2) * 0.06
      g.cabeza.rotation.z = Math.sin(t * 1.4) * 0.07
    } else if (pose === 'contento') {
      const brinco = Math.abs(Math.sin(t * 3.4))
      if (g.raiz) g.raiz.position.y = brinco * m.h * 0.06
      if (bi) bi.rotation.z = 0.9 + brinco * 0.5
      if (bd) bd.rotation.z = -0.9 - brinco * 0.5
      g.cabeza.rotation.x = -brinco * 0.12
    } else if (pose === 'pensando') {
      if (bd) {
        bd.rotation.z = -1.7
        bd.rotation.x = -0.9
      }
      g.cabeza.rotation.z = 0.16
      g.cabeza.rotation.y = Math.sin(t * 0.6) * 0.12
    } else if (pose === 'dormido') {
      /* Dormido respira más hondo y más lento, y la cabeza se vence. Sin lo
         primero se ve apagado en vez de dormido. */
      g.cuerpo.scale.set(1, 1 + Math.sin(t * 0.7) * 0.04, 1)
      g.cabeza.rotation.x = 0.35
      g.cabeza.rotation.z = 0.2
      if (bi) bi.rotation.x = 0.15
      if (bd) bd.rotation.x = 0.15
    } else {
      // reposo: asiente apenas y balancea los brazos
      g.cabeza.rotation.y = Math.sin(t * 0.5) * 0.16
      g.cabeza.rotation.x = Math.sin(t * 0.9) * 0.035
      if (bi) bi.rotation.x = Math.sin(t * 1.3) * 0.09
      if (bd) bd.rotation.x = -Math.sin(t * 1.3) * 0.09
      if (g.raiz) g.raiz.position.y = Math.sin(t * 1.6) * m.h * 0.004
    }

    // la cola va aparte: se mueve en todas las poses menos dormido
    if (cola.current) cola.current.rotation.y = pose === 'dormido' ? 0 : Math.sin(t * 2.6) * 0.4
  })

  const P = (props2) => <mesh castShadow receiveShadow {...props2} />

  return (
    <group ref={raiz} {...props}>
      {/* patas */}
      {[-1, 1].map((s) => (
        <group
          key={s}
          ref={s < 0 ? piernaIzq : piernaDer}
          position={[s * m.rCuerpo * 0.42, m.hPata, 0]}
        >
          <P geometry={capsula(m.rPata, m.hPata * 0.55, e.tono)} material={pelaje} position={[0, -m.hPata * 0.5, 0]} />
          <P geometry={esfera(m.rPata * 1.25, e.tono, 14)} material={pelaje} position={[0, -m.hPata + m.rPata * 0.6, m.rPata * 0.5]} />
        </group>
      ))}

      {/* cuerpo de pera y su panza */}
      <group ref={cuerpo} position={[0, m.yCuerpo, 0]}>
        <P
          geometry={esfera(m.rCuerpo, e.tono, 22)}
          material={pelaje}
          scale={[1, (m.hCuerpo * 0.62) / m.rCuerpo, 0.92]}
        />
        <P
          geometry={esfera(m.rCuerpo * 0.78, e.tono, 20)}
          material={panza}
          position={[0, -m.hCuerpo * 0.04, m.rCuerpo * 0.52]}
          scale={[0.8, (m.hCuerpo * 0.48) / m.rCuerpo, 0.55]}
        />
        <Ropa config={config} m={m} e={e} ropa={ropa} />

        {/* brazos */}
        {[-1, 1].map((s) => (
          <group key={s} ref={s < 0 ? brazoIzq : brazoDer} position={[s * m.rCuerpo * 0.92, m.hCuerpo * 0.16, 0]}>
            <P
              geometry={capsula(m.rBrazo, m.hCuerpo * 0.5, e.tono)}
              material={pelaje}
              position={[0, -m.hCuerpo * 0.3, 0]}
            />
            <P
              geometry={esfera(m.rBrazo * 1.3, e.tono, 12)}
              material={pelaje}
              position={[0, -m.hCuerpo * 0.56, 0]}
            />
          </group>
        ))}
      </group>

      {/* cabeza */}
      <group ref={cabeza} position={[0, m.yCabeza, 0]}>
        <P geometry={esfera(m.rCabeza, e.tono, 26)} material={pelaje} scale={[1, 0.94, 0.96]} />
        <Cara esp={esp} config={config} m={m} e={e} pelaje={pelaje} panza={panza} oscuro={oscuro} />
        <Orejas esp={esp} m={m} e={e} pelaje={pelaje} panza={panza} />
        <Sombrero config={config} m={m} e={e} ropa={ropa} oscuro={oscuro} />
      </group>

      <Cola ref={cola} esp={esp} m={m} e={e} pelaje={pelaje} panza={panza} />
      <Accesorio config={config} m={m} e={e} ropa={ropa} oscuro={oscuro} />
    </group>
  )
}

/* ── la cara ──────────────────────────────────────────────────── */

function Cara({ esp, config, m, e, pelaje, panza, oscuro }) {
  const r = m.rCabeza
  /* Todo lo que va en la cara se sale un poco de la cabeza. Colocado a 0.74
     del radio quedaba enterrado en la esfera y el animalito salía ciego: en una
     cabeza redonda, dentro es dentro. */
  const ojos = config?.ojos ?? 'puntos'
  const dormido = ojos === 'dormidos'
  const rOjo = r * (ojos === 'grandes' ? 0.19 : 0.13)

  /* El hocico cambia por especie y es lo que más distingue a un animal de
     otro: el mismo cuerpo con trompa es un cerdo y con pico es un pájaro. */
  const hocico = {
    chico: { r: r * 0.3, z: 0.92, y: -0.18, escala: [1, 0.78, 0.8] },
    largo: { r: r * 0.34, z: 1.0, y: -0.2, escala: [0.86, 0.72, 1.15] },
    ancho: { r: r * 0.38, z: 0.88, y: -0.2, escala: [1.15, 0.8, 0.8] },
    trompa: { r: r * 0.24, z: 1.02, y: -0.16, escala: [1.2, 1, 0.7] },
    pico: { r: r * 0.26, z: 1.0, y: -0.12, escala: [1, 0.7, 1.5] },
  }[esp.hocico] ?? { r: r * 0.3, z: 0.92, y: -0.18, escala: [1, 0.78, 0.8] }

  return (
    <group>
      {/* ojos */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * r * 0.33, r * 0.14, r * 0.94]}>
          {esp.ojosSaltones && (
            <mesh geometry={esfera(rOjo * 1.9, e.tono, 14)} material={pelaje} position={[0, r * 0.16, -r * 0.1]} />
          )}
          {dormido ? (
            <mesh
              geometry={esfera(rOjo * 1.15, e.tono, 12)}
              material={oscuro}
              scale={[1, 0.16, 0.4]}
              position={[0, esp.ojosSaltones ? r * 0.2 : 0, 0]}
            />
          ) : (
            <>
              <mesh
                geometry={esfera(rOjo, e.tono, 14)}
                material={oscuro}
                position={[0, esp.ojosSaltones ? r * 0.2 : 0, 0]}
                scale={ojos === 'contentos' ? [1.1, 0.55, 0.85] : [1, 1, 0.85]}
              />
              {/* el brillo: dos pixeles que cambian por completo la expresión */}
              {ojos !== 'contentos' && (
                <mesh position={[rOjo * 0.32, (esp.ojosSaltones ? r * 0.2 : 0) + rOjo * 0.34, rOjo * 0.5]}>
                  <sphereGeometry args={[rOjo * 0.3, 8, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              )}
            </>
          )}
        </group>
      ))}

      {/* antifaz del mapache */}
      {esp.antifaz && (
        <mesh
          geometry={esfera(r * 0.52, e.tono, 16)}
          material={oscuro}
          position={[0, r * 0.12, r * 0.72]}
          scale={[1.55, 0.34, 0.35]}
        />
      )}

      {/* hocico, nariz y boca */}
      <group position={[0, r * hocico.y, r * hocico.z]}>
        <mesh geometry={esfera(hocico.r, e.tono, 18)} material={esp.hocico === 'pico' ? pelaje : panza} scale={hocico.escala} />
        <mesh
          geometry={esfera(hocico.r * (esp.hocico === 'trompa' ? 0.5 : 0.34), e.tono, 12)}
          material={oscuro}
          position={[0, hocico.r * 0.25, hocico.r * 0.8]}
          scale={[1.2, 0.85, 0.7]}
        />
        {esp.hocico === 'trompa' &&
          [-1, 1].map((s) => (
            <mesh key={s} position={[s * hocico.r * 0.28, hocico.r * 0.25, hocico.r * 0.95]}>
              <sphereGeometry args={[hocico.r * 0.14, 8, 6]} />
              <meshBasicMaterial color="#00000022" transparent opacity={0.35} />
            </mesh>
          ))}
      </group>

      {/* bigotes */}
      {esp.bigotes &&
        [-1, 1].map((s) =>
          [0, 1].map((i) => (
            <mesh
              key={`${s}${i}`}
              geometry={cilindro(r * 0.012, r * 0.012, r * 0.42, e.tono, 6)}
              material={oscuro}
              position={[s * r * 0.45, r * (-0.2 + i * 0.09), r * 0.78]}
              rotation={[0, 0, (s * Math.PI) / 2 + s * (i ? 0.25 : -0.1)]}
            />
          )),
        )}

      {/* cachetes: el rubor es la mitad de la ternura del estilo */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * r * 0.6, -r * 0.06, r * 0.74]} scale={[1, 0.6, 0.5]}>
          <sphereGeometry args={[r * 0.16, 12, 10]} />
          <meshBasicMaterial color="#f08a9c" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* astas del ciervo */}
      {esp.astas &&
        [-1, 1].map((s) => (
          <group key={s} position={[s * r * 0.4, r * 0.86, -r * 0.1]} rotation={[0, 0, s * 0.35]}>
            <mesh geometry={capsula(r * 0.05, r * 0.42, e.tono)} material={panza} />
            <mesh
              geometry={capsula(r * 0.04, r * 0.24, e.tono)}
              material={panza}
              position={[s * r * 0.16, r * 0.26, 0]}
              rotation={[0, 0, s * 0.9]}
            />
          </group>
        ))}

      {/* copete del pájaro */}
      {esp.copete &&
        [-1, 0, 1].map((s) => (
          <mesh
            key={s}
            geometry={capsula(r * 0.05, r * 0.3, e.tono)}
            material={pelaje}
            position={[s * r * 0.14, r * 0.98, -r * 0.08]}
            rotation={[0, 0, s * 0.4]}
          />
        ))}
    </group>
  )
}

/* ── orejas ───────────────────────────────────────────────────── */

function Orejas({ esp, m, e, pelaje, panza }) {
  const r = m.rCabeza
  if (esp.oreja === 'nada') return null

  const forma = {
    punta: { geo: () => cilindro(0.001, r * 0.3, r * 0.5, e.tono, 3), y: 0.86, x: 0.5, rot: 0.25, dentro: 0.55 },
    redonda: { geo: () => esfera(r * 0.26, e.tono, 14), y: 0.82, x: 0.62, rot: 0, dentro: 0.6 },
    larga: { geo: () => capsula(r * 0.13, r * 0.8, e.tono), y: 1.0, x: 0.3, rot: 0.16, dentro: 0.62 },
    caida: { geo: () => capsula(r * 0.16, r * 0.42, e.tono), y: 0.5, x: 0.78, rot: 1.25, dentro: 0.6 },
    hoja: { geo: () => cilindro(0.001, r * 0.24, r * 0.42, e.tono, 3), y: 0.8, x: 0.56, rot: 0.5, dentro: 0.6 },
    grande: { geo: () => esfera(r * 0.36, e.tono, 16), y: 0.8, x: 0.68, rot: 0, dentro: 0.62 },
    peluda: { geo: () => esfera(r * 0.34, e.tono, 14), y: 0.72, x: 0.78, rot: 0, dentro: 0.55 },
  }[esp.oreja]

  if (!forma) return null

  return [-1, 1].map((s) => (
    <group key={s} position={[s * r * forma.x, r * forma.y, 0]} rotation={[0, 0, -s * forma.rot]}>
      <mesh geometry={forma.geo()} material={pelaje} castShadow />
      {/* el interior en el tono de la panza: sin esto la oreja es un bulto */}
      <mesh
        geometry={forma.geo()}
        material={panza}
        scale={forma.dentro}
        position={[0, esp.oreja === 'larga' ? 0 : r * 0.02, r * 0.1]}
      />
    </group>
  ))
}

/* ── cola ─────────────────────────────────────────────────────── */

function Cola({ ref: refCola, esp, m, e, pelaje, panza }) {
  if (esp.cola === 'nada') return null
  const r = m.rCuerpo
  const y = m.yCuerpo - m.hCuerpo * 0.12
  const z = -r * 0.85

  const cuerpo = {
    larga: <mesh geometry={capsula(r * 0.12, r * 1.15, e.tono)} material={pelaje} rotation={[0.9, 0, 0]} position={[0, r * 0.4, -r * 0.4]} />,
    corta: <mesh geometry={capsula(r * 0.15, r * 0.3, e.tono)} material={pelaje} rotation={[1.1, 0, 0]} />,
    pompon: <mesh geometry={esfera(r * 0.3, e.tono, 14)} material={panza} />,
    esponjada: (
      <mesh
        geometry={esfera(r * 0.42, e.tono, 16)}
        material={pelaje}
        scale={[0.7, 0.7, 1.5]}
        position={[0, r * 0.15, -r * 0.35]}
      />
    ),
    anillada: (
      <group rotation={[0.9, 0, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            geometry={esfera(r * 0.17, e.tono, 12)}
            material={i % 2 ? panza : pelaje}
            position={[0, r * 0.22 * i, 0]}
          />
        ))}
      </group>
    ),
    rizo: <mesh geometry={cilindro(r * 0.06, r * 0.06, r * 0.3, e.tono, 8)} material={pelaje} rotation={[0, 0, 1.2]} />,
    hilo: <mesh geometry={capsula(r * 0.05, r * 0.9, e.tono)} material={panza} rotation={[1.0, 0, 0]} position={[0, r * 0.3, -r * 0.3]} />,
    plumas: (
      <group>
        {[-1, 0, 1].map((s) => (
          <mesh
            key={s}
            geometry={capsula(r * 0.08, r * 0.5, e.tono)}
            material={pelaje}
            position={[s * r * 0.14, r * 0.1, 0]}
            rotation={[1.2, 0, s * 0.3]}
          />
        ))}
      </group>
    ),
  }[esp.cola]

  return (
    <group ref={refCola} position={[0, y, z]}>
      {cuerpo}
    </group>
  )
}

/* ── ropa ─────────────────────────────────────────────────────── */

function Ropa({ config, m, e, ropa }) {
  const tipo = config?.ropa ?? 'playera'
  if (tipo === 'nada') return null
  const r = m.rCuerpo
  const patron = config?.patron ?? 'liso'
  const claro = materialDe('#ffffff', { rol: 'tela', rugosidad: e.rugosidad, saturacion: e.saturacion })

  const alto = { playera: 0.7, sudadera: 0.86, vestido: 1.0, overol: 0.8, chaleco: 0.6 }[tipo] ?? 0.7
  const ancho = tipo === 'vestido' ? 1.16 : 1.06

  return (
    <group>
      <mesh
        geometry={esfera(r, e.tono, 22)}
        material={ropa}
        scale={[ancho, ((m.hCuerpo * 0.62) / r) * alto, ancho * 0.98]}
        position={[0, -m.hCuerpo * (tipo === 'vestido' ? 0.1 : 0.04), 0]}
        castShadow
      />
      {/* el estampado es geometría, no textura: a esta distancia una textura se
          ve sucia y una banda de verdad se lee */}
      {patron === 'rayas' &&
        [-1, 0, 1].map((i) => (
          <mesh
            key={i}
            geometry={esfera(r, e.tono, 20)}
            material={claro}
            scale={[ancho * 1.005, 0.06, ancho * 0.985]}
            position={[0, m.hCuerpo * (i * 0.13 - 0.04), 0]}
          />
        ))}
      {patron === 'franja' && (
        <mesh
          geometry={esfera(r, e.tono, 20)}
          material={claro}
          scale={[ancho * 1.005, 0.14, ancho * 0.985]}
          position={[0, -m.hCuerpo * 0.04, 0]}
        />
      )}
      {patron === 'lunares' &&
        [0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.sin(a) * r * 0.72, m.hCuerpo * (i % 2 ? 0.06 : -0.08), Math.cos(a) * r * 0.72]}>
              <sphereGeometry args={[r * 0.11, 10, 8]} />
              <primitive object={claro} attach="material" />
            </mesh>
          )
        })}
    </group>
  )
}

/* ── sombrero y accesorio ─────────────────────────────────────── */

function Sombrero({ config, m, e, ropa, oscuro }) {
  const tipo = config?.sombrero ?? 'nada'
  if (tipo === 'nada') return null
  const r = m.rCabeza

  if (tipo === 'gorra')
    return (
      <group position={[0, r * 0.74, 0]}>
        <mesh geometry={esfera(r * 0.94, e.tono, 18)} material={ropa} scale={[1, 0.5, 1]} castShadow />
        <mesh geometry={cilindro(r * 0.9, r * 0.9, r * 0.06, e.tono, 20)} material={ropa} position={[0, -r * 0.02, r * 0.62]} scale={[0.9, 1, 1.1]} />
      </group>
    )
  if (tipo === 'bombin')
    return (
      <group position={[0, r * 0.82, 0]}>
        <mesh geometry={cilindro(r * 0.6, r * 0.66, r * 0.5, e.tono, 20)} material={oscuro} castShadow />
        <mesh geometry={cilindro(r * 1.05, r * 1.05, r * 0.05, e.tono, 22)} material={oscuro} position={[0, -r * 0.24, 0]} />
      </group>
    )
  if (tipo === 'paja')
    return (
      <group position={[0, r * 0.8, 0]}>
        <mesh geometry={cilindro(r * 0.62, r * 0.7, r * 0.34, e.tono, 20)} material={ropa} castShadow />
        <mesh geometry={cilindro(r * 1.35, r * 1.35, r * 0.04, e.tono, 24)} material={ropa} position={[0, -r * 0.16, 0]} />
      </group>
    )
  if (tipo === 'gorro')
    return (
      <group position={[0, r * 0.7, 0]}>
        <mesh geometry={esfera(r * 0.96, e.tono, 18)} material={ropa} scale={[1, 0.62, 1]} castShadow />
        <mesh geometry={cilindro(r * 0.98, r * 0.98, r * 0.16, e.tono, 20)} material={ropa} position={[0, -r * 0.12, 0]} />
        <mesh geometry={esfera(r * 0.2, e.tono, 12)} material={ropa} position={[0, r * 0.6, 0]} />
      </group>
    )
  // diadema
  return (
    <group position={[0, r * 0.86, 0]}>
      <mesh geometry={cilindro(r * 0.9, r * 0.9, r * 0.06, e.tono, 20)} material={ropa} scale={[1, 1, 0.9]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={esfera(r * 0.18, e.tono, 12)} material={ropa} position={[s * r * 0.5, r * 0.12, 0]} scale={[1, 0.8, 0.6]} />
      ))}
    </group>
  )
}

function Accesorio({ config, m, e, ropa, oscuro }) {
  const tipo = config?.accesorio ?? 'nada'
  if (tipo === 'nada') return null
  const r = m.rCabeza

  if (tipo === 'lentes')
    return (
      <group position={[0, m.yCabeza + r * 0.12, r * 0.86]}>
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={cilindro(r * 0.22, r * 0.22, r * 0.03, e.tono, 18)} material={oscuro} position={[s * r * 0.36, 0, 0]} rotation={[Math.PI / 2, 0, 0]} />
        ))}
        <mesh geometry={cilindro(r * 0.03, r * 0.03, r * 0.3, e.tono, 8)} material={oscuro} rotation={[0, 0, Math.PI / 2]} />
      </group>
    )
  if (tipo === 'bufanda')
    return (
      <group position={[0, m.yCuerpo + m.hCuerpo * 0.42, 0]}>
        <mesh geometry={cilindro(m.rCuerpo * 0.6, m.rCuerpo * 0.6, m.hCuerpo * 0.14, e.tono, 18)} material={ropa} castShadow />
        <mesh geometry={capsula(m.rCuerpo * 0.1, m.hCuerpo * 0.4, e.tono)} material={ropa} position={[m.rCuerpo * 0.28, -m.hCuerpo * 0.26, m.rCuerpo * 0.4]} />
      </group>
    )
  if (tipo === 'mochila')
    return (
      <group position={[0, m.yCuerpo, -m.rCuerpo * 0.9]}>
        <mesh geometry={esfera(m.rCuerpo * 0.55, e.tono, 16)} material={ropa} scale={[0.9, 1, 0.6]} castShadow />
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={capsula(m.rCuerpo * 0.06, m.hCuerpo * 0.5, e.tono)} material={ropa} position={[s * m.rCuerpo * 0.4, 0, m.rCuerpo * 0.7]} rotation={[0.2, 0, 0]} />
        ))}
      </group>
    )
  // collar
  return (
    <group position={[0, m.yCuerpo + m.hCuerpo * 0.38, 0]}>
      <mesh geometry={cilindro(m.rCuerpo * 0.56, m.rCuerpo * 0.56, m.hCuerpo * 0.07, e.tono, 18)} material={ropa} />
      <mesh geometry={esfera(m.rCuerpo * 0.12, e.tono, 12)} material={ropa} position={[0, -m.hCuerpo * 0.07, m.rCuerpo * 0.55]} />
    </group>
  )
}
