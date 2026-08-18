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
export function Sofa({ w = 2.4, d = 0.95, tono = 'dominante' }) {
  const { pal, mat, cja, cap } = useTaller()
  const cuerpo = mat(pal[tono], 'tela')
  const cojin = mat(pal.secundario, 'tela')
  const pata = mat(pal.apoyo, 'madera')

  const h = 0.42
  const brazo = 0.24
  const asiento = w - brazo * 2
  const nCojines = asiento > 1.6 ? 3 : 2

  return (
    <group>
      {/* base */}
      <P g={cja(w, h, d)} m={cuerpo} position={[0, h / 2 + 0.1, 0]} />
      {/* respaldo, inclinado apenas para que no se vea a caja */}
      <P g={cja(w, 0.62, 0.22)} m={cuerpo} position={[0, 0.62, -d / 2 + 0.11]} rotation={[-0.06, 0, 0]} />
      {/* brazos */}
      {[-1, 1].map((s) => (
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
export function MesaCentro({ w = 1.1, d = 0.62 }) {
  const { pal, mat, cja, cap } = useTaller()
  const tabla = mat(pal.secundario, 'madera')
  const pata = mat(pal.apoyo, 'madera')
  const alto = 0.38

  return (
    <group>
      {/* tablero de grosor exagerado: es lo que lo salva de verse a lámina */}
      <P g={cja(w, 0.07, d)} m={tabla} position={[0, alto, 0]} />
      <P g={cja(w - 0.18, 0.05, d - 0.16)} m={tabla} position={[0, alto - 0.16, 0]} />
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <P
            key={`${x}${z}`}
            g={cap(0.028, alto - 0.1)}
            m={pata}
            position={[(x * (w - 0.16)) / 2, alto / 2 - 0.02, (z * (d - 0.14)) / 2]}
          />
        )),
      )}
    </group>
  )
}

/* ── mueble de tele ── */
export function MuebleTv({ w = 1.9, d = 0.42 }) {
  const { pal, mat, cja } = useTaller()
  const cuerpo = mat(pal.apoyo, 'madera')
  const frente = mat(pal.secundario, 'madera')
  const alto = 0.44

  return (
    <group>
      <P g={cja(w, alto, d)} m={cuerpo} position={[0, alto / 2 + 0.05, 0]} />
      {/* puertas hundidas: la diferencia de profundidad hace el mueble */}
      {[-1, 1].map((s) => (
        <P
          key={s}
          g={cja(w / 2 - 0.06, alto - 0.12, 0.02)}
          m={frente}
          position={[(s * w) / 4, alto / 2 + 0.05, d / 2 - 0.012]}
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
export function Tapete({ w = 2.6, d = 1.8 }) {
  const { pal, mat, plc } = useTaller()
  return (
    <group>
      <P g={plc(w, d, 0.02)} m={mat(pal.secundario, 'tela')} position={[0, 0.011, 0]} sombra={false} />
      <P g={plc(w - 0.22, d - 0.22, 0.022)} m={mat(pal.neutro, 'tela')} position={[0, 0.014, 0]} sombra={false} />
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
export function Pantalla({ w = 1.5 }) {
  const { pal, mat, cja } = useTaller()
  const h = w * 0.58
  return (
    <group>
      <P g={cja(w, h, 0.05)} m={mat(pal.apoyo, 'plastico')} />
      <P g={cja(w - 0.06, h - 0.06, 0.01)} m={mat('#20242e', 'vidrio')} position={[0, 0, 0.028]} sombra={false} />
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
export function LamparaPie({ alto = 1.6 }) {
  const { pal, mat, cil, cap } = useTaller()
  return (
    <group>
      <P g={cil(0.17, 0.19, 0.03)} m={mat(pal.apoyo, 'metal')} position={[0, 0.015, 0]} />
      <P g={cap(0.018, alto - 0.3)} m={mat(pal.apoyo, 'metal')} position={[0, alto / 2, 0]} />
      <P g={cil(0.13, 0.2, 0.24, 20)} m={mat(pal.neutro, 'ceramica')} position={[0, alto - 0.05, 0]} />
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
