import { useEstilo, materialDe, paletaDe } from './estilo'
import { caja, capsula, cilindro, esfera, placa } from './geo'

/**
 * El mobiliario de la sala, en el lenguaje del sistema.
 *
 * Ninguna pieza escoge su bisel, su rugosidad ni su color: los pide. Eso es lo
 * que hace que un sofá y una maceta se vean del mismo taller, y lo que permite
 * recalibrar el estilo entero moviendo un deslizador en vez de editando doce
 * archivos.
 *
 * La regla al modelar aquí es la del brief y conviene tenerla a la vista: la
 * silueta importa más que la superficie. Un sofá se reconoce por cojines
 * gordos, brazos anchos y esquinas redondas — no por costuras. Cada vez que
 * uno esté tentado a agregar un detalle, la pregunta es si ayuda a reconocer
 * la pieza desde tres metros. Casi siempre la respuesta es no.
 */

/** Todo lo que se dibuja pasa por aquí: una malla con geometría y material
 *  compartidos, y la decisión de si vale la pena que proyecte sombra. */
function P({ g, m, position, rotation, sombra = true, recibe = true }) {
  return (
    <mesh geometry={g} material={m} position={position} rotation={rotation} castShadow={sombra} receiveShadow={recibe} />
  )
}

/** Los ajustes vivos, para no repetir el mismo hook en cada mueble. */
function useTaller() {
  const e = useEstilo()
  const pal = paletaDe(e.paleta)
  const mat = (color, rol) =>
    materialDe(color, { rol, rugosidad: e.rugosidad, metalico: e.metalico, saturacion: e.saturacion })
  const cja = (w, h, d) => caja(w, h, d, e.bisel, e.tono)
  const plc = (w, d, g) => placa(w, d, g, e.bisel, e.tono)
  const cil = (ra, rb, h, lados) => cilindro(ra, rb, h, e.tono, lados)
  const cap = (r, l) => capsula(r, l, e.tono)
  const esf = (r, seg) => esfera(r, e.tono, seg)
  return { e, pal, mat, cja, plc, cil, cap, esf }
}

/* ── sofá ─────────────────────────────────────────────────────────
   Cojines gordos, brazos anchos, respaldo separado del asiento. Las tres
   piezas se ven como tres piezas: esa separación es lo que da la lectura de
   mueble armado en vez de bloque tallado. */
export function Sofa({ w = 2.4, d = 0.95, tono = 'dominante', v = 'recto' }) {
  const { pal, mat, cja, cap } = useTaller()
  const cuerpo = mat(pal[tono], 'tela')
  const cojin = mat(pal.secundario, 'tela')
  const pata = mat(pal.apoyo, 'madera')

  /* Lo que cambia entre un sofá y otro: qué tan alto es el respaldo, qué tan
     gordo el brazo y si tiene chaise. Los tres se ven a esta distancia y los
     tres cambian dónde cabe. */
  const h = v === 'bajo' ? 0.34 : 0.42
  const brazo = v === 'sinBrazos' ? 0.02 : v === 'brazoAncho' ? 0.4 : 0.24
  const hResp = v === 'respaldoAlto' ? 0.92 : v === 'bajo' ? 0.46 : 0.62
  const chaise = v === 'chaise'
  const asiento = w - brazo * 2
  const nCojines = asiento > 1.6 ? 3 : 2

  return (
    <group>
      {/* base */}
      <P g={cja(w, h, d)} m={cuerpo} position={[0, h / 2 + 0.1, 0]} />
      {/* respaldo, inclinado apenas para que no se vea a caja */}
      <P g={cja(w, hResp, 0.22)} m={cuerpo} position={[0, 0.31 + hResp / 2, -d / 2 + 0.11]} rotation={[-0.06, 0, 0]} />
      {/* chaise: el brazo largo que sale hacia un lado. Es lo que convierte un
          sofá de 2.40 en una pieza de 2.40 × 1.60, y eso decide si pasa por la
          puerta y si deja circular por la sala. */}
      {chaise && (
        <>
          <P g={cja(0.9, h, d * 0.85)} m={cuerpo} position={[w / 2 - 0.45, h / 2 + 0.1, d * 0.72]} />
          <P g={cja(0.9, 0.34, 0.18)} m={cuerpo} position={[w / 2 - 0.45, 0.36, d * 1.12]} />
        </>
      )}
      {/* brazos */}
      {brazo > 0.05 &&
        [-1, 1].map((s) => (
          <P key={s} g={cja(brazo, 0.52, d)} m={cuerpo} position={[(s * (w - brazo)) / 2, 0.36, 0]} />
        ))}
      {/* cojines: dos o tres según el ancho, siempre gordos.
          `Array.from` NO le pasa el arreglo al mapeador —solo valor e
          índice—, así que la cuenta se calcula antes. */}
      {Array.from({ length: nCojines }, (_, i) => {
        const n = nCojines
        const cw = (asiento - 0.06 * (n - 1)) / n
        const x = -asiento / 2 + cw / 2 + i * (cw + 0.06)
        return <P key={i} g={cja(cw, 0.16, d - 0.22)} m={cojin} position={[x, h + 0.18, 0.05]} />
      })}
      {/* patas cortas: levantan el mueble y dejan pasar la sombra de contacto */}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <P
            key={`${x}${z}`}
            g={cap(0.035, 0.06)}
            m={pata}
            position={[(x * (w - 0.3)) / 2, 0.06, (z * (d - 0.3)) / 2]}
            sombra={false}
          />
        )),
      )}
    </group>
  )
}

/* ── mesa de centro ── */
export function MesaCentro({ w = 1.1, d = 0.62, v = 'dosNiveles' }) {
  const { pal, mat, cja, cil, cap } = useTaller()
  const tabla = mat(pal.secundario, 'madera')
  const pata = mat(pal.apoyo, 'madera')
  const alto = v === 'baja' ? 0.3 : 0.38

  if (v === 'redonda' || v === 'tambor') {
    const r = Math.min(w, d) / 2
    return (
      <group>
        <P g={cil(r, r, 0.06, 32)} m={tabla} position={[0, alto, 0]} />
        {v === 'tambor' ? (
          /* Tambor: una sola pieza maciza. Pesa a la vista y por eso ancla la
             sala, pero también cierra el paso visual por debajo. */
          <P g={cil(r * 0.72, r * 0.8, alto - 0.03, 28)} m={pata} position={[0, (alto - 0.03) / 2, 0]} />
        ) : (
          <>
            <P g={cil(0.05, 0.05, alto - 0.06)} m={pata} position={[0, alto / 2, 0]} />
            <P g={cil(r * 0.6, r * 0.66, 0.04, 28)} m={pata} position={[0, 0.02, 0]} />
          </>
        )}
      </group>
    )
  }

  return (
    <group>
      {/* tablero de grosor exagerado: es lo que lo salva de verse a lámina */}
      <P g={cja(w, 0.07, d)} m={tabla} position={[0, alto, 0]} />
      {v === 'dosNiveles' && <P g={cja(w - 0.18, 0.05, d - 0.16)} m={tabla} position={[0, alto - 0.16, 0]} />}

      {/* patas: cuatro capsulas, dos costados macizos o un marco de metal */}
      {v === 'costados' ? (
        [-1, 1].map((x) => (
          <P key={x} g={cja(0.05, alto - 0.04, d - 0.1)} m={pata} position={[(x * (w - 0.14)) / 2, (alto - 0.04) / 2, 0]} />
        ))
      ) : v === 'marco' ? (
        [-1, 1].map((x) =>
          [-1, 1].map((z) => (
            <P
              key={`${x}${z}`}
              g={cja(0.028, alto - 0.05, 0.028)}
              m={mat(pal.acento, 'metal')}
              position={[(x * (w - 0.1)) / 2, (alto - 0.05) / 2, (z * (d - 0.1)) / 2]}
            />
          )),
        )
      ) : (
        [-1, 1].map((x) =>
          [-1, 1].map((z) => (
            <P
              key={`${x}${z}`}
              g={cap(0.028, alto - 0.1)}
              m={pata}
              position={[(x * (w - 0.16)) / 2, alto / 2 - 0.02, (z * (d - 0.14)) / 2]}
            />
          )),
        )
      )}
    </group>
  )
}

/* ── mueble de tele ── */
export function MuebleTv({ w = 1.9, d = 0.42, v = 'puertas' }) {
  const { pal, mat, cja, cap } = useTaller()
  const cuerpo = mat(pal.apoyo, 'madera')
  const frente = mat(pal.secundario, 'madera')
  const alto = v === 'bajo' ? 0.32 : 0.44
  const flotante = v === 'flotante'
  const y0 = flotante ? 0.32 : v === 'patas' ? 0.2 : 0.05

  return (
    <group>
      <P g={cja(w, alto, d)} m={cuerpo} position={[0, alto / 2 + y0, 0]} />
      {/* patas cónicas o flotante: el hueco de abajo es lo que se compra, y
          además es por donde pasa el cable a la tele. */}
      {v === 'patas' &&
        [-1, 1].map((x) =>
          [-1, 1].map((z) => (
            <P
              key={`p${x}${z}`}
              g={cap(0.02, 0.22)}
              m={cuerpo}
              position={[(x * (w - 0.2)) / 2, 0.11, (z * (d - 0.1)) / 2]}
              rotation={[z * 0.08, 0, -x * 0.08]}
              sombra={false}
            />
          )),
        )}
      {/* repisas abiertas en vez de puertas */}
      {v === 'abierto' && (
        <P g={cja(w - 0.06, 0.02, d - 0.04)} m={frente} position={[0, alto / 2 + y0, 0]} sombra={false} />
      )}
      {/* puertas hundidas: la diferencia de profundidad hace el mueble */}
      {v !== 'abierto' &&
        [-1, 1].map((sg) => (
          <P
            key={sg}
            g={cja(w / 2 - 0.06, alto - 0.12, 0.02)}
            m={frente}
            position={[(sg * w) / 4, alto / 2 + y0, d / 2 - 0.012]}
            sombra={false}
          />
        ))}
      {[-1, 1].map((s) => (
        <P
          key={`t${s}`}
          g={cja(0.16, 0.02, 0.02)}
          m={mat(pal.acento, 'metal')}
          position={[(s * w) / 4, alto / 2 + 0.05, d / 2 + 0.01]}
          sombra={false}
        />
      ))}
      <P g={cja(w + 0.04, 0.05, d + 0.03)} m={cuerpo} position={[0, 0.03, 0]} />
    </group>
  )
}

/* ── tapete ──────────────────────────────────────────────────────
   Placa con un borde de otro tono: sin ese borde un tapete se lee como una
   mancha en el piso, y con él se lee como una pieza puesta encima. */
/** El tapete, en cinco. Más que decoración: es lo que decide si el cuarto
 *  suena a sala o a bodega, y en un cuarto con bocinas eso se oye. */
export function Tapete({ w = 2.6, d = 1.8, v = 'cenefa' }) {
  const { pal, mat, plc, cil } = useTaller()
  const fondo = mat(pal.secundario, 'tela')
  const campo = mat(pal.neutro, 'tela')

  /* Taburete y canasta: los dos "burós" que no son muebles de cajones. En una
     recámara chica son lo que de verdad cabe, y encima de ellos no se apoya lo
     mismo —un taburete de 30 cm no aguanta una lámpara grande—. */
  if (v === 'taburete')
    return (
      <group>
        <P g={cil(0.19, 0.17, 0.035, 20)} m={frente} position={[0, alto - 0.02, 0]} />
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2
          return (
            <P
              key={i}
              g={cap(0.016, alto)}
              m={mat(pal.apoyo, 'madera')}
              position={[Math.cos(a) * 0.11, alto / 2, Math.sin(a) * 0.11]}
              rotation={[Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14]}
              sombra={false}
            />
          )
        })}
      </group>
    )

  if (v === 'canasta')
    return (
      <group>
        <P g={cil(w / 2, w / 2 - 0.05, alto - 0.12)} m={frente} position={[0, (alto - 0.12) / 2 + 0.1, 0]} />
        <P g={cil(w / 2 + 0.015, w / 2 + 0.015, 0.03, 24)} m={cuerpo} position={[0, alto - 0.02, 0]} />
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + 0.4
          return (
            <P
              key={i}
              g={cap(0.013, 0.14)}
              m={mat(pal.apoyo, 'metal')}
              position={[Math.cos(a) * (w / 2 - 0.05), 0.07, Math.sin(a) * (w / 2 - 0.05)]}
              sombra={false}
            />
          )
        })}
      </group>
    )

  if (v === 'redondo') {
    const r = Math.min(w, d) / 2
    return (
      <group>
        <P g={cil(r, r, 0.02, 40)} m={fondo} position={[0, 0.011, 0]} sombra={false} />
        <P g={cil(r - 0.14, r - 0.14, 0.022, 40)} m={campo} position={[0, 0.014, 0]} sombra={false} />
      </group>
    )
  }

  if (v === 'liso')
    return <P g={plc(w, d, 0.02)} m={campo} position={[0, 0.011, 0]} sombra={false} />

  if (v === 'corredor')
    return (
      <group>
        <P g={plc(w, d * 0.42, 0.02)} m={fondo} position={[0, 0.011, 0]} sombra={false} />
        <P g={plc(w - 0.16, d * 0.42 - 0.16, 0.022)} m={campo} position={[0, 0.014, 0]} sombra={false} />
      </group>
    )

  if (v === 'rayas')
    return (
      <group>
        <P g={plc(w, d, 0.02)} m={campo} position={[0, 0.011, 0]} sombra={false} />
        {[-2, -1, 0, 1, 2].map((i) => (
          <P
            key={i}
            g={plc(w * 0.9, d * 0.08, 0.022)}
            m={fondo}
            position={[0, 0.014, i * d * 0.17]}
            sombra={false}
          />
        ))}
      </group>
    )

  return (
    <group>
      <P g={plc(w, d, 0.02)} m={fondo} position={[0, 0.011, 0]} sombra={false} />
      <P g={plc(w - 0.22, d - 0.22, 0.022)} m={campo} position={[0, 0.014, 0]} sombra={false} />
    </group>
  )
}

/* ── planta ──────────────────────────────────────────────────────
   Pocas hojas y grandes. Una planta con cuarenta hojas chicas se ve a maleza;
   con siete hojas anchas se lee como planta de interior. */
export function Planta({ alto = 1.15, hojas = 7 }) {
  const { pal, mat, cja, cil, cap } = useTaller()
  const maceta = mat(pal.acento, 'ceramica')
  const tierra = mat(pal.apoyo, 'mate')
  const verde = ['#5f9e72', '#4d8a62', '#6fae7f']

  const hMaceta = alto * 0.3
  return (
    <group>
      <P g={cil(0.2, 0.15, hMaceta)} m={maceta} position={[0, hMaceta / 2, 0]} />
      <P g={cil(0.2, 0.2, 0.04)} m={maceta} position={[0, hMaceta - 0.01, 0]} />
      <P g={cil(0.17, 0.17, 0.02)} m={tierra} position={[0, hMaceta + 0.01, 0]} sombra={false} />

      {/* Hojas anchas y pocas, cada una con dos tramos que quiebran hacia
          afuera. Ese quiebre es lo que las hace leer como hoja: una placa
          recta se ve a esquirla, y una hoja de verdad cae. */}
      {Array.from({ length: hojas }, (_, i) => {
        const a = (i / hojas) * Math.PI * 2 + 0.4
        const inc = 0.28 + (i % 3) * 0.13
        const largo = alto * (0.46 + (i % 2) * 0.13)
        const ancho = 0.17 + (i % 3) * 0.035
        return (
          <group key={i} position={[Math.sin(a) * 0.06, hMaceta + 0.03, Math.cos(a) * 0.06]} rotation={[inc, a, 0]}>
            <P g={cap(0.013, largo * 0.42)} m={mat(verde[1], 'mate')} position={[0, largo * 0.22, 0]} sombra={false} />
            <group position={[0, largo * 0.46, 0]} rotation={[0.34, 0, 0]}>
              <P g={cja(ancho, largo * 0.42, 0.018)} m={mat(verde[i % 3], 'mate')} position={[0, largo * 0.2, 0]} />
              <group position={[0, largo * 0.4, 0]} rotation={[0.42, 0, 0]}>
                <P
                  g={cja(ancho * 0.72, largo * 0.3, 0.016)}
                  m={mat(verde[(i + 1) % 3], 'mate')}
                  position={[0, largo * 0.14, 0]}
                />
              </group>
            </group>
          </group>
        )
      })}
    </group>
  )
}

/* ── pantalla de pared ── */
export function Pantalla({ w = 1.5, v = 'muro' }) {
  const { pal, mat, cja, cil, cap } = useTaller()
  const h = w * 0.58
  const marco = v === 'marco' // tipo cuadro, con marco grueso de madera
  const g = marco ? 0.09 : 0.05

  return (
    <group>
      <P g={cja(w, h, g)} m={mat(marco ? pal.apoyo : pal.apoyo, marco ? 'madera' : 'plastico')} />
      <P
        g={cja(w - (marco ? 0.14 : 0.06), h - (marco ? 0.14 : 0.06), 0.01)}
        m={mat('#20242e', 'vidrio')}
        position={[0, 0, g / 2 + 0.005]}
        sombra={false}
      />

      {/* Base de piso: la tele que NO va colgada. Cambia por completo el
          mueble que hay que poner debajo y por dónde sale el cable. */}
      {v === 'base' && (
        <>
          <P g={cap(0.03, h * 0.34)} m={mat(pal.apoyo, 'metal')} position={[0, -h / 2 - h * 0.17, 0]} />
          <P g={cil(w * 0.2, w * 0.22, 0.03, 24)} m={mat(pal.apoyo, 'metal')} position={[0, -h / 2 - h * 0.34, 0.04]} />
        </>
      )}
      {v === 'patas' &&
        [-1, 1].map((sg) => (
          <P
            key={sg}
            g={cja(0.05, h * 0.3, 0.24)}
            m={mat(pal.apoyo, 'metal')}
            position={[(sg * w) / 2.6, -h / 2 - h * 0.15, 0.02]}
            rotation={[0, 0, sg * 0.16]}
          />
        ))}
      {/* Proyector: no hay pantalla, hay lienzo. Es una decisión distinta y
          arrastra otra instalación —contacto en el techo y HDMI hasta allá—. */}
      {v === 'lienzo' && (
        <P g={cja(w + 0.1, 0.06, 0.08)} m={mat(pal.apoyo, 'metal')} position={[0, h / 2 + 0.05, 0]} />
      )}
    </group>
  )
}

/* ── librero ─────────────────────────────────────────────────────
   Los libros son cajas de anchos distintos con huecos. La irregularidad es
   todo el truco: con lomos iguales se lee a textura repetida. */
export function Librero({ w = 1.05, alto = 1.6, niveles = 4 }) {
  const { pal, mat, cja } = useTaller()
  const madera = mat(pal.apoyo, 'madera')
  const lomos = [pal.acento, pal.secundario, pal.dominante, pal.neutro]
  const paso = alto / niveles

  return (
    <group>
      {[-1, 1].map((s) => (
        <P key={s} g={cja(0.05, alto, 0.3)} m={madera} position={[(s * w) / 2, alto / 2, 0]} />
      ))}
      {Array.from({ length: niveles + 1 }, (_, n) => (
        <P key={n} g={cja(w, 0.04, 0.3)} m={madera} position={[0, n * paso, 0]} />
      ))}
      {Array.from({ length: niveles }, (_, n) => {
        const libros = []
        let x = -w / 2 + 0.06
        let i = 0
        while (x < w / 2 - 0.1) {
          const lw = 0.035 + ((n * 5 + i * 7) % 4) * 0.012
          const lh = paso * (0.55 + ((n + i * 3) % 5) * 0.05)
          if ((n + i * 3) % 7 !== 0) {
            libros.push(
              <P
                key={`${n}-${i}`}
                g={cja(lw, lh, 0.17)}
                m={mat(lomos[(n + i) % lomos.length], 'mate')}
                position={[x + lw / 2, n * paso + lh / 2 + 0.02, 0]}
                sombra={false}
              />,
            )
          }
          x += lw + 0.008
          i++
        }
        return libros
      })}
    </group>
  )
}

/* ── lámpara de piso ── */
/** La lámpara de pie, en cinco pantallas. La pantalla decide a dónde va la
 *  luz —abajo, arriba o a todas partes— y por eso no es un cambio de adorno. */
export function LamparaPie({ alto = 1.6, v = 'cono' }) {
  const { pal, mat, cil, cap, esf } = useTaller()
  const metal = mat(pal.apoyo, 'metal')
  const tela = mat(pal.neutro, 'ceramica')

  if (v === 'arco')
    return (
      <group>
        <P g={cil(0.24, 0.26, 0.05)} m={metal} position={[0, 0.025, 0]} />
        <P g={cap(0.022, alto * 0.95)} m={metal} position={[0, alto / 2, 0]} rotation={[0, 0, 0.22]} />
        <P g={cap(0.022, 0.75)} m={metal} position={[-0.36, alto * 0.98, 0]} rotation={[0, 0, 1.35]} />
        <P g={cil(0.13, 0.15, 0.16, 20)} m={tela} position={[-0.7, alto * 0.9, 0]} />
      </group>
    )

  if (v === 'tripodeAlta')
    return (
      <group>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2
          return (
            <P
              key={i}
              g={cap(0.017, alto * 0.95)}
              m={metal}
              position={[Math.cos(a) * 0.2, alto * 0.46, Math.sin(a) * 0.2]}
              rotation={[Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22]}
              sombra={false}
            />
          )
        })}
        <P g={cil(0.15, 0.23, 0.26, 20)} m={tela} position={[0, alto - 0.02, 0]} />
      </group>
    )

  if (v === 'columna')
    /* Columna opalina de piso a pantalla: toda la pieza es la luz. Es la que
       menos sombra dura hace de las diez. */
    return (
      <group>
        <P g={cil(0.16, 0.18, 0.03)} m={metal} position={[0, 0.015, 0]} />
        <P g={cil(0.09, 0.09, alto - 0.06, 22)} m={tela} position={[0, alto / 2, 0]} />
      </group>
    )

  const pantalla =
    v === 'globo' ? (
      <P g={esf(0.17)} m={tela} position={[0, alto, 0]} />
    ) : v === 'tresLuces' ? (
      <group position={[0, alto - 0.12, 0]}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2
          return (
            <P key={i} g={cil(0.07, 0.1, 0.13, 16)} m={tela} position={[Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16]} />
          )
        })}
      </group>
    ) : v === 'plato' ? (
      /* Plato hacia arriba: rebota toda la luz en el techo. La más suave y la
         que menos deslumbra, y la que peor sirve para leer. */
      <P g={cil(0.26, 0.1, 0.12, 24)} m={tela} position={[0, alto + 0.02, 0]} />
    ) : v === 'tambor' ? (
      <P g={cil(0.2, 0.2, 0.26, 22)} m={tela} position={[0, alto - 0.06, 0]} />
    ) : v === 'papel' ? (
      /* Farol de papel: alto y angosto, casi cilíndrico, con la luz repartida
         de arriba abajo en vez de en un cono. */
      <P g={cil(0.15, 0.13, 0.5, 20)} m={tela} position={[0, alto - 0.18, 0]} />
    ) : v === 'invertido' ? (
      <P g={cil(0.21, 0.11, 0.24, 20)} m={tela} position={[0, alto - 0.05, 0]} />
    ) : (
      <P g={cil(0.13, 0.2, 0.24, 20)} m={tela} position={[0, alto - 0.05, 0]} />
    )

  return (
    <group>
      <P g={cil(0.17, 0.19, 0.03)} m={metal} position={[0, 0.015, 0]} />
      <P g={cap(0.018, alto - 0.3)} m={metal} position={[0, alto / 2, 0]} />
      {pantalla}
    </group>
  )
}

/* ── puf ── */
export function Puf({ d = 0.6 }) {
  const { pal, mat, cil } = useTaller()
  return (
    <group>
      <P g={cil(d / 2, d / 2 - 0.04, 0.34, 22)} m={mat(pal.acento, 'tela')} position={[0, 0.17, 0]} />
      <P g={cil(d / 2 - 0.06, d / 2 - 0.06, 0.04, 22)} m={mat(pal.neutro, 'tela')} position={[0, 0.35, 0]} sombra={false} />
    </group>
  )
}

/* ── bocina ── */
export function Bocina({ alto = 0.28 }) {
  const { pal, mat, cja, cil } = useTaller()
  return (
    <group>
      <P g={cja(0.14, alto, 0.14)} m={mat(pal.apoyo, 'tela')} position={[0, alto / 2, 0]} />
      <P g={cil(0.045, 0.045, 0.012, 18)} m={mat(pal.neutro, 'plastico')} position={[0, alto * 0.6, 0.071]} rotation={[Math.PI / 2, 0, 0]} sombra={false} />
    </group>
  )
}

/* ── cuadro ── */
export function Cuadro({ w = 0.55, h = 0.72, tono = 'acento' }) {
  const { pal, mat, cja } = useTaller()
  /* Con el lienzo en blanco los cuadros se leen a hoja pegada. Tres bandas de
     la misma paleta alcanzan para que se lean como obra sin salirse del
     lenguaje ni pedir una textura. */
  return (
    <group>
      <P g={cja(w, h, 0.035)} m={mat(pal[tono], 'madera')} />
      <P g={cja(w - 0.07, h - 0.07, 0.012)} m={mat(pal.neutro, 'mate')} position={[0, 0, 0.022]} sombra={false} />
      <P
        g={cja((w - 0.07) * 0.82, (h - 0.07) * 0.34, 0.006)}
        m={mat(pal.dominante, 'mate')}
        position={[0, -h * 0.16, 0.03]}
        sombra={false}
      />
      <P
        g={cja((w - 0.07) * 0.34, (h - 0.07) * 0.26, 0.006)}
        m={mat(pal[tono === 'acento' ? 'apoyo' : 'acento'], 'mate')}
        position={[w * 0.16, h * 0.2, 0.03]}
        sombra={false}
      />
    </group>
  )
}

/* ── mesa lateral ── */
export function MesaLateral({ d = 0.44, alto = 0.52 }) {
  const { pal, mat, cil, cap } = useTaller()
  return (
    <group>
      <P g={cil(d / 2, d / 2, 0.05, 22)} m={mat(pal.secundario, 'madera')} position={[0, alto, 0]} />
      <P g={cap(0.022, alto - 0.12)} m={mat(pal.apoyo, 'metal')} position={[0, alto / 2, 0]} />
      <P g={cil(d / 2 - 0.08, d / 2 - 0.06, 0.02, 20)} m={mat(pal.apoyo, 'metal')} position={[0, 0.01, 0]} />
    </group>
  )
}

/* ── recámara ────────────────────────────────────────────────────
   El cuarto donde la silueta importa más que en ningún otro: casi todo es
   volumen grande y plano, así que lo único que separa una cama de una caja es
   la proporción del colchón contra la base y el grosor de las almohadas. */

/**
 * La cama, en cinco.
 *
 * No es capricho: la cabecera es lo primero que se ve al entrar a una
 * recámara y es donde el cliente tiene opinión. Una plataforma baja y una
 * capitonada alta no cuestan lo mismo ni piden la misma luz —una lámpara de
 * buró que funcionaba con la primera queda tapada por la segunda— así que
 * poder cambiarla aquí decide cosas que no son decorativas.
 *
 * `v` cambia la SILUETA, no el color. Lo que se distingue en un plano
 * isométrico es el contorno, y el color ya lo pone la paleta del cuarto.
 */
export function Cama({ w = 1.6, largo = 2.0, v = 'plataforma' }) {
  const { pal, mat, cja, cap } = useTaller()
  const base = mat(pal.apoyo, 'madera')
  const colchon = mat(pal.neutro, 'tela')
  const ropa = mat(pal.dominante, 'tela')
  const almohada = mat(pal.secundario, 'tela')

  const individual = v === 'individual'
  const W = individual ? 1.0 : v === 'king' ? 1.9 : w
  const L = individual ? 1.9 : largo
  const baja = v === 'baja'
  const altoBase = baja ? 0.14 : 0.24
  const yColchon = baja ? 0.26 : 0.38
  const conDosel = v === 'dosel'

  /* Altura de cabecera por tipo. En "baja" no hay: es la cama sobre tarima,
     y su gracia es justamente que no tiene respaldo. */
  const hCab =
    { plataforma: 0.78, capitonada: 1.15, dosel: 0.62, individual: 0.6, baja: 0, barrotes: 0.95, conCajones: 0.78, king: 0.82, trineo: 0.7, conPiecera: 0.8 }[
      v
    ] ?? 0.78

  return (
    <group>
      {/* base, un poco más chica que el colchón: así el colchón vuela y se
          lee como colchón en vez de como tapa. En la baja es al revés —la
          tarima sobresale— que es lo que la distingue de lejos. */}
      <P
        g={cja(baja ? W + 0.24 : W - 0.06, altoBase, baja ? L + 0.24 : L - 0.06)}
        m={base}
        position={[0, altoBase / 2 + 0.02, 0]}
      />
      <P g={cja(W, 0.22, L)} m={colchon} position={[0, yColchon, 0]} />

      {/* la ropa de cama cubre de los pies hasta media cama */}
      <P g={cja(W + 0.03, 0.09, L * 0.62)} m={ropa} position={[0, yColchon + 0.11, L * 0.17]} />

      {/* cabecera de barrotes: marco de tubo con travesaños verticales. De
          lejos lo que se ve es que se transparenta el muro de atrás, y eso es
          exactamente lo que la distingue de una de tabla. */}
      {v === 'barrotes' && (
        <>
          {[-1, 1].map((sg) => (
            <P
              key={sg}
              g={cap(0.022, hCab)}
              m={mat(pal.acento, 'metal')}
              position={[(sg * (W + 0.06)) / 2, yColchon + hCab / 2 - 0.22, -L / 2 - 0.02]}
              sombra={false}
            />
          ))}
          <P
            g={cja(W + 0.1, 0.03, 0.03)}
            m={mat(pal.acento, 'metal')}
            position={[0, yColchon + hCab - 0.22, -L / 2 - 0.02]}
            sombra={false}
          />
          {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
            <P
              key={`b${i}`}
              g={cap(0.012, hCab - 0.06)}
              m={mat(pal.acento, 'metal')}
              position={[(i * W) / 7.4, yColchon + hCab / 2 - 0.24, -L / 2 - 0.02]}
              sombra={false}
            />
          ))}
        </>
      )}

      {/* trineo: cabecera y piecera inclinadas hacia afuera */}
      {v === 'trineo' &&
        [-1, 1].map((sg) => (
          <P
            key={sg}
            g={cja(W + 0.12, sg < 0 ? hCab : hCab * 0.6, 0.1)}
            m={base}
            position={[0, yColchon + (sg < 0 ? hCab : hCab * 0.6) / 2 - 0.22, (sg * (L + 0.08)) / 2]}
            rotation={[sg * 0.24, 0, 0]}
          />
        ))}

      {/* piecera: una tabla baja a los pies. Cambia por dónde se entra a la
          cama y, en un cuarto angosto, si se puede pasar. */}
      {v === 'conPiecera' && (
        <P g={cja(W + 0.1, 0.42, 0.09)} m={base} position={[0, yColchon + 0.05, L / 2 + 0.02]} />
      )}

      {/* base con cajones: el guardado que no se ve. Ojo con el contacto de
          abajo, que queda tapado. */}
      {v === 'conCajones' &&
        [-1, 1].map((sg) => (
          <P
            key={sg}
            g={cja(W / 2 - 0.1, 0.16, 0.02)}
            m={mat(pal.secundario, 'madera')}
            position={[(sg * W) / 4, 0.16, L / 2 - 0.02]}
            sombra={false}
          />
        ))}

      {/* cabecera */}
      {hCab > 0 && v !== 'capitonada' && v !== 'barrotes' && v !== 'trineo' && (
        <P g={cja(W + 0.1, hCab, 0.09)} m={base} position={[0, yColchon + hCab / 2 - 0.22, -L / 2 - 0.02]} />
      )}

      {/* capitonada: tres paneles con junta. Es lo que se ve de una cabecera
          acolchada a esta distancia — el botón no llega, el corte sí. */}
      {v === 'capitonada' && (
        <>
          <P g={cja(W + 0.14, hCab, 0.11)} m={base} position={[0, yColchon + hCab / 2 - 0.22, -L / 2 - 0.03]} />
          {[-1, 0, 1].map((i) => (
            <P
              key={i}
              g={cja(W / 3.4, hCab - 0.16, 0.03)}
              m={mat(pal.secundario, 'tela')}
              position={[(i * W) / 3.1, yColchon + hCab / 2 - 0.22, -L / 2 + 0.03]}
              sombra={false}
            />
          ))}
        </>
      )}

      {/* almohadas: dos, salvo en la individual */}
      {(individual ? [0] : [-1, 1]).map((sg) => (
        <P
          key={sg}
          g={cja(individual ? W * 0.7 : W * 0.42, 0.13, 0.3)}
          m={almohada}
          position={[(sg * W) / 4.4, yColchon + 0.17, -L / 2 + 0.24]}
          rotation={[-0.12, 0, 0]}
        />
      ))}

      {/* dosel: cuatro postes y los travesaños de arriba. Sin los travesaños
          parecen cuatro palos y no un dosel. */}
      {conDosel && (
        <>
          {[-1, 1].map((x) =>
            [-1, 1].map((z) => (
              <P
                key={`${x}${z}`}
                g={cap(0.03, 1.9)}
                m={base}
                position={[(x * W) / 2, 0.98, (z * L) / 2]}
                sombra={false}
              />
            )),
          )}
          {[-1, 1].map((z) => (
            <P key={`tz${z}`} g={cja(W, 0.045, 0.045)} m={base} position={[0, 1.93, (z * L) / 2]} sombra={false} />
          ))}
          {[-1, 1].map((x) => (
            <P key={`tx${x}`} g={cja(0.045, 0.045, L)} m={base} position={[(x * W) / 2, 1.93, 0]} sombra={false} />
          ))}
        </>
      )}
    </group>
  )
}

/** El buró, en cinco. El redondo y el flotante cambian por completo lo que
 *  cabe encima —y ahí es donde va el Echo o la lámpara de lectura. */
export function Buro({ w = 0.46, alto = 0.52, v = 'cajones' }) {
  const { pal, mat, cja, cil, cap } = useTaller()
  const cuerpo = mat(pal.apoyo, 'madera')
  const frente = mat(pal.secundario, 'madera')
  const tirador = mat(pal.acento, 'metal')

  if (v === 'redondo')
    return (
      <group>
        <P g={cil(w / 2, w / 2 - 0.03, alto - 0.06)} m={cuerpo} position={[0, (alto - 0.06) / 2 + 0.06, 0]} />
        <P g={cil(w / 2 + 0.02, w / 2 + 0.02, 0.025)} m={frente} position={[0, alto - 0.02, 0]} />
        <P g={cil(0.09, 0.11, 0.06)} m={mat(pal.apoyo, 'metal')} position={[0, 0.03, 0]} />
      </group>
    )

  /* Flotante: sin patas, colgado del muro. Se dibuja levantado porque es como
     se instala, y porque el hueco de abajo es justo lo que se compra. */
  const flotante = v === 'flotante'
  const patasAltas = v === 'patasAltas' || v === 'ancho'
  const y0 = flotante ? 0.3 : patasAltas ? 0.22 : 0.02
  const hCuerpo = alto - (flotante ? 0.16 : patasAltas ? 0.2 : 0.1)

  return (
    <group>
      <P g={cja(w, hCuerpo, 0.4)} m={cuerpo} position={[0, y0 + hCuerpo / 2, 0]} />

      {/* frentes: dos cajones, o uno y un hueco abierto */}
      {(v === 'repisa' ? [1] : [0, 1]).map((i) => (
        <P
          key={i}
          g={cja(w - 0.07, hCuerpo / 2 - 0.04, 0.02)}
          m={frente}
          position={[0, y0 + hCuerpo * (i === 0 ? 0.27 : 0.73), 0.201]}
          sombra={false}
        />
      ))}
      {(v === 'repisa' ? [1] : [0, 1]).map((i) => (
        <P
          key={`t${i}`}
          g={cja(0.12, 0.018, 0.018)}
          m={tirador}
          position={[0, y0 + hCuerpo * (i === 0 ? 0.27 : 0.73), 0.215]}
          sombra={false}
        />
      ))}
      {/* la repisa deja el hueco de abajo a la vista */}
      {v === 'repisa' && (
        <P
          g={cja(w - 0.05, 0.02, 0.36)}
          m={frente}
          position={[0, y0 + hCuerpo * 0.42, 0]}
          sombra={false}
        />
      )}

      {!flotante &&
        [-1, 1].map((x) =>
          [-1, 1].map((z) => (
            <P
              key={`p${x}${z}`}
              g={cap(patasAltas ? 0.018 : 0.022, patasAltas ? 0.22 : 0.08)}
              m={mat(pal.apoyo, patasAltas ? 'madera' : 'metal')}
              position={[(x * (w - 0.1)) / 2, patasAltas ? 0.12 : 0.05, (z * 0.3) / 2]}
              rotation={patasAltas ? [z * 0.08, 0, -x * 0.08] : undefined}
              sombra={false}
            />
          )),
        )}
    </group>
  )
}

/** El clóset, en cinco. El abierto y el de espejo cambian la luz del cuarto,
 *  no solo su cara: uno se traga la luz y el otro la devuelve. */
export function Closet({ w = 1.8, alto = 2.15, d = 0.6, v = 'dosPuertas' }) {
  const { pal, mat, cja } = useTaller()
  const cuerpo = mat(pal.apoyo, 'madera')
  const puerta = mat(pal.secundario, 'madera')
  const jalador = mat(pal.acento, 'metal')

  const hojas = v === 'tresPuertas' ? 3 : 2

  return (
    <group>
      <P g={cja(w, alto, d)} m={cuerpo} position={[0, alto / 2, 0]} />

      {/* abierto: entrepaños y un tubo, sin puertas. Es el vestidor de armar */}
      {v === 'abierto' ? (
        <>
          {[0.35, 0.72, 1.5].map((f) => (
            <P
              key={f}
              g={cja(w - 0.08, 0.025, d - 0.06)}
              m={puerta}
              position={[0, alto * (f / 2.15), 0.01]}
              sombra={false}
            />
          ))}
          <P
            g={cja(w - 0.16, 0.028, 0.028)}
            m={jalador}
            position={[0, alto * 0.62, 0.02]}
            sombra={false}
          />
        </>
      ) : (
        <>
          {Array.from({ length: hojas }, (_, i) => {
            const paso = w / hojas
            const x = -w / 2 + paso * (i + 0.5)
            /* Corredizas: las hojas se traslapan y una queda por delante de la
               otra. Es lo que se ve, y además es la razón de que solo se pueda
               abrir la mitad del clóset a la vez. */
            const z = v === 'corredizas' ? d / 2 - 0.012 + (i % 2) * 0.028 : d / 2 - 0.012
            return (
              <P
                key={i}
                g={cja(paso - (v === 'corredizas' ? 0.0 : 0.05), alto - 0.12, 0.025)}
                m={v === 'conEspejo' && i === hojas - 1 ? mat(pal.neutro, 'vidrio') : puerta}
                position={[x, alto / 2, z]}
                sombra={false}
              />
            )
          })}
          {v !== 'corredizas' &&
            Array.from({ length: hojas }, (_, i) => (
              <P
                key={`j${i}`}
                g={cja(0.02, 0.22, 0.02)}
                m={jalador}
                position={[-w / 2 + (w / hojas) * (i + 0.5) + 0.06, alto / 2, d / 2 + 0.012]}
                sombra={false}
              />
            ))}
        </>
      )}
    </group>
  )
}

/** La cómoda, en cinco. Cambia cuántos cajones y qué tan alta: la de seis es
 *  cajonera de recámara, la de tres se usa como mueble de tele. */
export function Comoda({ w = 1.1, alto = 0.82, d = 0.45, v = 'tres' }) {
  const { pal, mat, cja, cap } = useTaller()
  const cuerpo = mat(pal.apoyo, 'madera')
  const frente = mat(pal.secundario, 'madera')
  const tirador = mat(pal.acento, 'metal')

  const filas = { tres: 3, cuatro: 4, seis: 3, dosPuertas: 0, patasAltas: 3 }[v] ?? 3
  const columnas = v === 'seis' ? 2 : 1
  const patasAltas = v === 'patasAltas'
  const y0 = patasAltas ? 0.26 : 0.02
  const hCuerpo = alto - (patasAltas ? 0.28 : 0.1)

  return (
    <group>
      <P g={cja(w, hCuerpo, d)} m={cuerpo} position={[0, y0 + hCuerpo / 2, 0]} />

      {/* dos puertas en vez de cajones: es la misma caja con otra cara */}
      {v === 'dosPuertas'
        ? [-1, 1].map((sg) => (
            <P
              key={sg}
              g={cja(w / 2 - 0.05, hCuerpo - 0.08, 0.02)}
              m={frente}
              position={[(sg * w) / 4, y0 + hCuerpo / 2, d / 2 - 0.01]}
              sombra={false}
            />
          ))
        : Array.from({ length: filas * columnas }, (_, k) => {
            const f = Math.floor(k / columnas)
            const c = k % columnas
            const anchoF = (w - 0.09) / columnas - (columnas > 1 ? 0.03 : 0)
            const x = columnas === 1 ? 0 : -w / 2 + (w / columnas) * (c + 0.5)
            const hF = (hCuerpo - 0.1) / filas - 0.02
            const y = y0 + 0.08 + f * ((hCuerpo - 0.08) / filas) + hF / 2
            return (
              <group key={k}>
                <P g={cja(anchoF, hF, 0.02)} m={frente} position={[x, y, d / 2 - 0.011]} sombra={false} />
                <P g={cja(0.14, 0.018, 0.018)} m={tirador} position={[x, y, d / 2 + 0.004]} sombra={false} />
              </group>
            )
          })}

      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <P
            key={`${x}${z}`}
            g={cap(patasAltas ? 0.02 : 0.024, patasAltas ? 0.26 : 0.08)}
            m={mat(pal.apoyo, patasAltas ? 'madera' : 'metal')}
            position={[(x * (w - 0.14)) / 2, patasAltas ? 0.14 : 0.05, (z * (d - 0.12)) / 2]}
            rotation={patasAltas ? [z * 0.08, 0, -x * 0.08] : undefined}
            sombra={false}
          />
        )),
      )}
    </group>
  )
}

/** La del buró, que es la del comando "buenas noches". */
/** La de buró, en cinco. Es la lámpara que más se automatiza de la casa
 *  —"buenas noches" apaga esta— y la pantalla decide si lee o si ambienta. */
export function LamparaBuro({ alto = 0.42, v = 'cono' }) {
  const { pal, mat, cil, cap, esf } = useTaller()
  const metal = mat(pal.acento, 'metal')
  const tela = mat(pal.neutro, 'ceramica')

  if (v === 'articulada')
    return (
      <group>
        <P g={cil(0.1, 0.12, 0.025, 18)} m={metal} position={[0, 0.012, 0]} />
        <P g={cap(0.014, 0.34)} m={metal} position={[0, 0.2, 0]} rotation={[0, 0, 0.2]} />
        <P g={cap(0.014, 0.26)} m={metal} position={[0.14, 0.4, 0]} rotation={[0, 0, -1.0]} />
        <P g={cil(0.05, 0.09, 0.11, 16)} m={tela} position={[0.26, 0.42, 0]} rotation={[0, 0, -0.7]} />
      </group>
    )

  if (v === 'hongo')
    return (
      <group>
        <P g={cil(0.11, 0.13, 0.03, 20)} m={mat(pal.dominante, 'ceramica')} position={[0, 0.015, 0]} />
        <P g={cil(0.05, 0.07, alto * 0.5)} m={mat(pal.dominante, 'ceramica')} position={[0, alto * 0.3, 0]} />
        {/* la media esfera es lo que hace al hongo: cierra por arriba y toda
            la luz sale hacia abajo, sobre el libro */}
        <P g={esf(0.15, 18)} m={tela} position={[0, alto - 0.03, 0]} scale={[1, 0.62, 1]} />
      </group>
    )

  const pantalla =
    v === 'globo' ? (
      <P g={esf(0.12)} m={tela} position={[0, alto - 0.02, 0]} />
    ) : v === 'tubo' ? (
      <P g={cil(0.055, 0.055, 0.3, 18)} m={tela} position={[0, alto - 0.02, 0]} />
    ) : (
      <P g={cil(0.1, 0.14, 0.17, 20)} m={tela} position={[0, alto - 0.05, 0]} />
    )

  return (
    <group>
      <P g={cil(0.09, 0.11, 0.03, 18)} m={metal} position={[0, 0.015, 0]} />
      <P g={cil(0.022, 0.022, alto * 0.5)} m={metal} position={[0, alto * 0.28, 0]} />
      {pantalla}
    </group>
  )
}
