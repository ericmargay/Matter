import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

import { DEVICE_BY_ID } from '../../../content/catalog'
import { MUEBLES } from './catalogo'
import { ANIMACIONES, animacionesDe } from './animacion'
import { RUTAS, SALIDAS, cableVacio } from './cables'
import Animar from './animacion.jsx'
import { Cuerpo } from './Escena'
import { paletaDe, useEstilo } from './estilo'
import { parametrosDe, valoresDe } from './parametros'
import Rig from './Rig'

/**
 * El taller: una pieza sola, sin cuarto, para poder tocarla.
 *
 * Hasta ahora, corregir una proporción, cambiar por dónde sale un cable o
 * ajustar cuántos entrepaños lleva un librero pasaba por pedírmelo y esperar.
 * Eso no escala y, sobre todo, no es como se diseña: se mueve, se mira y se
 * vuelve a mover. Aquí eso pasa en segundos y sin que nadie toque código.
 *
 * El cuarto desaparece a propósito. Con la habitación puesta, la pieza se pelea
 * por la atención con veinte cosas más y con su propia sombra; sola sobre un
 * fondo neutro se ve lo que de verdad se está cambiando. Es la misma razón por
 * la que un carpintero saca la puerta del marco para cepillarla.
 *
 * Lo que se ajusta aquí queda en la PIEZA, no en el catálogo: dos camas del
 * mismo modelo pueden acabar distintas, que es lo que pasa en una casa real.
 */

export default function TallerPieza({ item, onGuardar, onCerrar, puntos = [], red }) {
  const def = item.clase === 'mueble' ? MUEBLES[item.tipo] : null
  const dev = item.clase === 'equipo' ? DEVICE_BY_ID[item.deviceId] : null
  const e = useEstilo()
  const pal = paletaDe(e.paleta)

  const esquema = useMemo(() => (def ? parametrosDe(item.tipo) : []), [def, item.tipo])
  const [ajustes, setAjustes] = useState(item.ajustes ?? {})
  const [cable, setCable] = useState(item.cable ?? null)
  const [nombre, setNombre] = useState(item.nombre ?? '')
  const [animacion, setAnimacion] = useState(item.animacion ?? 'ninguna')
  const [seccion, setSeccion] = useState('medidas')

  const valores = useMemo(
    () => (def ? { ...valoresDe({ ...item, ajustes: {} }), ...ajustes } : {}),
    [def, item, ajustes],
  )

  const titulo = def?.label ?? dev?.name ?? 'Pieza'

  /* El encuadre sale de la pieza, no de un número fijo. Con una distancia
     fija, una cama llenaba el cuadro y un apagador era un punto: la cámara
     tiene que abrir tanto como mida lo que se está viendo. */
  const tam = Math.max(
    valores.w ?? def?.w ?? 0.3,
    valores.d ?? def?.d ?? 0.3,
    valores.alto ?? valores.h ?? def?.alto ?? 0.3,
    0.25,
  )
  const lejos = tam * 1.9 + 0.5
  const mira = Math.min(tam * 0.45, 1.1)
  const tocar = (clave, v) => setAjustes((a) => ({ ...a, [clave]: v }))

  const aplicar = () => {
    onGuardar(
      { ajustes, cable, animacion, nombre: nombre.trim() || undefined },
      `Ajustó ${titulo.toLowerCase()} en el taller`,
    )
    onCerrar()
  }

  const SECCIONES = [
    ['medidas', 'Medidas'],
    ['cable', 'Cable'],
    ['movimiento', 'Movimiento'],
    ...(dev ? [['conexion', 'Conexión']] : []),
  ]

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink">
      <header className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Taller de pieza</p>
          <h2 className="display truncate text-[19px] text-cream">{titulo}</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              setAjustes({})
              setCable(null)
            }}
            className="rounded-lg border border-line px-3 py-1.5 text-[12px] text-cream-3 hover:bg-cream/8"
          >
            Volver al original
          </button>
          <button onClick={onCerrar} className="rounded-lg border border-line px-3 py-1.5 text-[12px] text-cream-2 hover:bg-cream/8">
            Cancelar
          </button>
          <button onClick={aplicar} className="rounded-lg bg-ember px-3.5 py-1.5 text-[12px] text-ink">
            Aplicar al plano
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* la pieza sola, en su mesa de trabajo */}
        <div className="relative min-w-0 flex-1">
          <Canvas
            shadows
            dpr={[1, 1.75]}
            camera={{ position: [lejos * 0.72, lejos * 0.55, lejos * 0.9], fov: 40 }}
            gl={{ antialias: true }}
          >
            <color attach="background" args={[pal.muroFrio]} />
            <Rig ancho={tam * 3} largo={tam * 3} alto={tam * 2.6} />
            <Mesa color={pal.piso} r={tam * 2.2 + 0.6} />
            <Suspense fallback={null}>
              <Animar tipo={animacion} semilla={item.id?.length ?? 0}>
                {def ? (
                  def.Nuevo ? (
                    <def.Comp {...valores} />
                  ) : (
                    <def.Comp position={[0, 0, 0]} rotation={[0, 0, 0]} {...valores} />
                  )
                ) : (
                  <Cuerpo device={dev} params={item.params} encendido color={COLOR_LUZ} />
                )}
              </Animar>
            </Suspense>
            <OrbitControls makeDefault target={[0, mira, 0]} minDistance={tam * 0.5} maxDistance={tam * 8 + 3} />
          </Canvas>

          <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-line bg-ink/85 px-3 py-1 text-[11px] text-cream-3 backdrop-blur">
            Arrastra para girar · rueda para acercar
          </p>
        </div>

        {/* los controles */}
        <aside className="w-[330px] shrink-0 overflow-y-auto border-l border-line">
          <div className="flex gap-0.5 border-b border-line p-1">
            {SECCIONES.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSeccion(id)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-[11.5px] transition-colors ${
                  seccion === id ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {seccion === 'medidas' && (
            <div className="px-3 py-3">
              <p className="text-[10.5px] leading-snug text-cream-3">
                Lo que esta pieza sabe cambiar sale de sus propias versiones. Lo que ajustes aquí queda en{' '}
                <span className="text-cream-2">esta</span> pieza, no en el catálogo: dos camas del mismo modelo
                pueden acabar distintas, como en una casa de verdad.
              </p>

              {esquema.length === 0 && (
                <p className="mt-3 text-[12px] text-cream-3">Esta pieza no tiene parámetros ajustables todavía.</p>
              )}

              <div className="mt-3 space-y-3">
                {esquema.map((p) => (
                  <Control key={p.clave} p={p} valor={valores[p.clave]} onCambiar={(v) => tocar(p.clave, v)} />
                ))}
              </div>
            </div>
          )}

          {seccion === 'cable' && (
            <PanelCable cable={cable} onCambiar={setCable} puntos={puntos} />
          )}

          {seccion === 'movimiento' && (
            <PanelMovimiento
              tipo={item.tipo ?? ''}
              cat={dev?.cat ?? ''}
              valor={animacion}
              onCambiar={setAnimacion}
            />
          )}

          {seccion === 'conexion' && (
            <PanelConexion dev={dev} nombre={nombre} onNombre={setNombre} red={red} />
          )}
        </aside>
      </div>
    </div>
  )
}

const COLOR_LUZ = { r: 1, g: 0.92, b: 0.82, getHSL: () => ({ h: 0.1, s: 0.3, l: 0.9 }) }

/** La mesa de trabajo: un disco y nada más. Un cuarto aquí sería ruido. */
function Mesa({ color, r = 2.6 }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[r, 48]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

function Control({ p, valor, onCambiar }) {
  if (p.tipo === 'si')
    return (
      <label className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-cream-2">{p.label}</span>
        <input
          type="checkbox"
          checked={!!valor}
          onChange={(ev) => onCambiar(ev.target.checked)}
          className="h-4 w-4 accent-[#4d9fff]"
        />
      </label>
    )

  if (p.tipo === 'opcion')
    return (
      <label className="block">
        <span className="block text-[10px] tracking-[0.1em] text-cream-3 uppercase">{p.label}</span>
        <select
          value={valor ?? p.opciones[0]}
          onChange={(ev) => onCambiar(ev.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-1.5 text-[12px] text-cream"
        >
          {p.opciones.map((o) => (
            <option key={String(o)} value={o}>
              {String(o)}
            </option>
          ))}
        </select>
      </label>
    )

  const v = Number(valor ?? p.min)
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] tracking-[0.1em] text-cream-3 uppercase">{p.label}</span>
        <span className="text-[11.5px] text-cream">
          {p.paso < 1 ? v.toFixed(2) : v} {p.unidad}
        </span>
      </div>
      {/* Deslizador Y número. El deslizador es para buscar —que es lo que se
          hace el 90 % del tiempo— y el número para rematar en la medida exacta
          que trae la ficha del fabricante. */}
      <div className="mt-1 flex items-center gap-2">
        <input
          type="range"
          min={p.min}
          max={p.max}
          step={p.paso}
          value={v}
          onChange={(ev) => onCambiar(Number(ev.target.value))}
          className="h-1 flex-1 accent-[#4d9fff]"
        />
        <input
          type="number"
          min={p.min}
          max={p.max}
          step={p.paso}
          value={v}
          onChange={(ev) => onCambiar(Number(ev.target.value))}
          className="w-[72px] rounded border border-line bg-ink px-1.5 py-1 text-right text-[11.5px] text-cream"
        />
      </div>
    </label>
  )
}

function PanelCable({ cable, onCambiar, puntos }) {
  const c = cable ?? cableVacio()
  const set = (k, v) => onCambiar({ ...c, [k]: v })

  return (
    <div className="px-3 py-3">
      <p className="text-[10.5px] leading-snug text-cream-3">
        Un plano sin cables miente por omisión, y la mentira se cobra el día de la instalación: la lámpara que
        quedó preciosa a tres metros del único contacto. Aquí se decide cuánto mide, por dónde sale y por dónde
        va.
      </p>

      {!cable ? (
        <button
          onClick={() => onCambiar(cableVacio())}
          className="mt-3 w-full rounded-lg border border-thread/50 px-2 py-1.5 text-[12px] text-thread-2 hover:bg-thread/10"
        >
          Esta pieza lleva cable →
        </button>
      ) : (
        <>
          <div className="mt-3 space-y-3">
            <label className="block">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] tracking-[0.1em] text-cream-3 uppercase">Largo del cable</span>
                <span className="text-[11.5px] text-cream">{c.largo.toFixed(2)} m</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={6}
                step={0.05}
                value={c.largo}
                onChange={(ev) => set('largo', Number(ev.target.value))}
                className="mt-1 h-1 w-full accent-[#4d9fff]"
              />
              <p className="mt-1 text-[10px] text-cream-3">
                El que trae de fábrica. Casi siempre 1.5 o 1.8 m, y casi nunca alcanza.
              </p>
            </label>

            <div>
              <p className="text-[10px] tracking-[0.1em] text-cream-3 uppercase">Por dónde sale</p>
              <div className="mt-1 grid grid-cols-2 gap-1">
                {Object.entries(SALIDAS).map(([id, s]) => (
                  <button
                    key={id}
                    onClick={() => set('salida', id)}
                    className={`rounded-lg px-2 py-1 text-[11.5px] transition-colors ${
                      c.salida === id ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] tracking-[0.1em] text-cream-3 uppercase">Cómo va hasta el contacto</p>
              <div className="mt-1 space-y-1">
                {Object.entries(RUTAS).map(([id, r]) => (
                  <button
                    key={id}
                    onClick={() => set('ruta', id)}
                    className={`block w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
                      c.ruta === id ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
                    }`}
                  >
                    <span className="block text-[11.5px]">{r.label}</span>
                    <span className={`block text-[10px] leading-snug ${c.ruta === id ? 'text-ink/70' : 'text-cream-3'}`}>
                      {r.porque}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="block text-[10px] tracking-[0.1em] text-cream-3 uppercase">A qué contacto</span>
              <select
                value={c.enchufe ?? ''}
                onChange={(ev) => set('enchufe', ev.target.value || null)}
                className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-1.5 text-[12px] text-cream"
              >
                <option value="">El más cercano</option>
                {puntos.map((p, i) => (
                  <option key={p.id} value={p.id}>
                    Contacto {i + 1}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-cream-3">
                Si no alcanza, el cable se dibuja en rojo. Es más barato descubrirlo aquí.
              </p>
            </label>
          </div>

          <button
            onClick={() => onCambiar(null)}
            className="mt-3 text-[10.5px] text-cream-3 underline decoration-dotted underline-offset-2 hover:text-ember"
          >
            esta pieza no lleva cable
          </button>
        </>
      )}
    </div>
  )
}

/**
 * Qué se mueve en esta pieza.
 *
 * Solo se ofrece lo que tiene sentido para ella: proponerle "gira" a una cama
 * no es una opción, es un error que alguien va a escoger por curiosidad. Y se
 * ve al instante en la pieza de al lado, que es la única forma de decidir si
 * un movimiento queda bien — descrito con palabras, todo suena bien.
 */
function PanelMovimiento({ tipo, cat, valor, onCambiar }) {
  const opciones = animacionesDe(tipo, cat)
  return (
    <div className="px-3 py-3">
      <p className="text-[10.5px] leading-snug text-cream-3">
        Un plano quieto se lee como una lámina. Basta con que algo respire para que el cuarto pase de dibujo a
        lugar — y aquí importa más que en otros lados, porque lo que se está vendiendo es una casa que responde.
      </p>
      <div className="mt-3 space-y-1">
        {opciones.map((id) => {
          const a = ANIMACIONES[id]
          const on = valor === id
          return (
            <button
              key={id}
              onClick={() => onCambiar(id)}
              className={`block w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
                on ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
              }`}
            >
              <span className="block text-[11.5px]">{a.label}</span>
              <span className={`block text-[10px] leading-snug ${on ? 'text-ink/70' : 'text-cream-3'}`}>
                {a.porque}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-cream-3">
        Todo es muy poco a propósito. La referencia es lo que se ve por la ventana de una casa de verdad, no un
        salvapantallas: si el movimiento se nota, ya es demasiado.
      </p>
    </div>
  )
}

function PanelConexion({ dev, nombre, onNombre, red }) {
  return (
    <div className="px-3 py-3">
      <p className="text-[10.5px] leading-snug text-cream-3">
        Cómo va a quedar dado de alta. El nombre es el que va a decir en voz alta el cliente, así que se decide
        aquí y no el día de la instalación con prisa.
      </p>

      <label className="mt-3 block">
        <span className="block text-[10px] tracking-[0.1em] text-cream-3 uppercase">Cómo se le va a llamar</span>
        <input
          value={nombre}
          onChange={(ev) => onNombre(ev.target.value)}
          placeholder={dev?.name ?? ''}
          className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-1.5 text-[12px] text-cream placeholder:text-cream-3/60"
        />
        <p className="mt-1 text-[10px] leading-snug text-cream-3">
          “Lámpara de lectura” funciona; “Foco 3” no. Es lo que se dice en voz alta.
        </p>
      </label>

      <div className="mt-3 rounded-lg border border-line px-2.5 py-2">
        <p className="text-[10px] tracking-[0.1em] text-cream-3 uppercase">Red del proyecto</p>
        {red?.ssid ? (
          <>
            <p className="mt-1 text-[12px] text-cream">{red.ssid}</p>
            <p className="text-[10.5px] text-cream-3">
              {red.banda === '2.4' ? 'Banda de 2.4 GHz' : red.banda === '5' ? 'Banda de 5 GHz' : 'Banda mixta'}
              {red.clave ? ' · con contraseña guardada' : ' · sin contraseña guardada'}
            </p>
          </>
        ) : (
          <p className="mt-1 text-[11px] leading-snug text-cream-3">
            No hay red dada de alta en este proyecto. Se captura en el levantamiento, junto a los datos del
            módem.
          </p>
        )}
        <p className="mt-1.5 text-[10px] leading-snug text-cream-3">
          Casi todo lo Matter sobre WiFi solo se empareja en 2.4 GHz. Si el módem tiene una sola red combinada,
          hay que separarla ANTES de llegar a instalar, o no empareja ninguno.
        </p>
      </div>
    </div>
  )
}
