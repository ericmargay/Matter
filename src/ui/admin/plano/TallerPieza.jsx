import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, TransformControls } from '@react-three/drei'

import { DEVICE_BY_ID } from '../../../content/catalog'
import { MUEBLES } from './catalogo'
import { ANIMACIONES, animacionesDe } from './animacion'
import { RUTAS, SALIDAS, cableVacio } from './cables'
import Animar from './animacion.jsx'
import { Cuerpo } from './Escena'
import { fondoDe, paletaDe, useEstilo } from './estilo'
import { parametrosDe, valoresDe } from './parametros'
import PiezaPropia from './PiezaPropia'
import AvatarPieza from '../avatar/AvatarPieza'
import { animalitoAlAzar, animalitoBase } from '../avatar/aleatorio'
import { CATEGORIAS as CATS_AVATAR, PALETAS as PAL_AVATAR, POSES as POSES_AVATAR } from '../avatar/especies'
import { FORMAS, ROLES, TONOS, hornear, medidaDePieza, parteVacia } from './piezas'
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

export default function TallerPieza({ item, onGuardar, onCerrar, puntos = [], red, pose, visible = true, onPintado, rect }) {
  const def = item.clase === 'mueble' ? MUEBLES[item.tipo] : null
  const dev = item.clase === 'equipo' ? DEVICE_BY_ID[item.deviceId] : null
  const e = useEstilo()
  const pal = paletaDe(e.paleta)

  const esquema = useMemo(() => (def ? parametrosDe(item.tipo) : []), [def, item.tipo])
  const [ajustes, setAjustes] = useState(item.ajustes ?? {})
  const [cable, setCable] = useState(item.cable ?? null)
  const [nombre, setNombre] = useState(item.nombre ?? '')
  const [animacion, setAnimacion] = useState(item.animacion ?? 'ninguna')
  /* Las partes: o la pieza ya es propia, o se hornea desde el catálogo cuando
     alguien pide moverlas. Antes de hornear no hay nada que editar. */
  const [pieza, setPieza] = useState(item.pieza ?? null)
  /* Un avatar no se edita como un mueble: no tiene medidas ni partes que
     mover, tiene piezas que se cambian y colores que se eligen. */
  const esAvatar = item.tipo === 'avatar'
  const [avatar, setAvatar] = useState(item.avatar ?? animalitoBase())
  const [catAvatar, setCatAvatar] = useState(CATS_AVATAR[0].id)
  const [parteSel, setParteSel] = useState(null)
  const [modoParte, setModoParte] = useState('mover')
  const escena = useRef()
  /* Los grupos de cada parte, para que el gizmo agarre la parte de verdad. */
  const nodos = useRef(new Map())
  /* El nodo de la parte elegida, en estado y no solo en la referencia: las
     referencias se llenan DESPUÉS de pintar, así que leyéndolas en el render
     el gizmo no aparecía hasta el siguiente cambio. */
  const [nodoSel, setNodoSel] = useState(null)
  const [seccion, setSeccion] = useState(item.tipo === 'avatar' ? 'avatar' : 'medidas')
  /* El lienzo NACE en el mismo rectángulo que el del cuarto y de ahí se abre a
     su sitio. Es lo que hace imposible el brinco: en el instante del cruce las
     dos escenas ocupan los mismos píxeles con la misma cámara, así que son la
     misma imagen. Compensar el desfase a mano era pelearse con dos layouts que
     cambian; esto no tiene nada que compensar. */
  const [abierto, setAbierto] = useState(!rect)

  useEffect(() => {
    setNodoSel(parteSel ? (nodos.current.get(parteSel) ?? null) : null)
  }, [parteSel, pieza])

  const valores = useMemo(
    () => (def ? { ...valoresDe({ ...item, ajustes: {} }), ...ajustes } : {}),
    [def, item, ajustes],
  )

  const titulo = def?.label ?? dev?.name ?? 'Pieza'

  /* El encuadre sale de la pieza, no de un número fijo. Con una distancia
     fija, una cama llenaba el cuadro y un apagador era un punto: la cámara
     tiene que abrir tanto como mida lo que se está viendo. */
  const tam = esAvatar
    ? 1.8
    : Math.max(
    valores.w ?? def?.w ?? 0.3,
    valores.d ?? def?.d ?? 0.3,
    valores.alto ?? valores.h ?? def?.alto ?? 0.3,
    0.25,
  )
  /* Una persona se encuadra de cuerpo entero y mirando al pecho, no al
     ombligo: encuadrada como un mueble salía cortada de los pies. */
  const lejos = esAvatar ? tam * 2.5 : tam * 1.9 + 0.5
  const mira = esAvatar ? 0.85 : Math.min(tam * 0.45, 1.1)
  const tocar = (clave, v) => setAjustes((a) => ({ ...a, [clave]: v }))

  const aplicar = () => {
    onGuardar(
      {
        ajustes,
        cable,
        animacion,
        pieza,
        /* La huella se recalcula al guardar: una pieza propia cuyas partes
           crecieron tiene que ocupar en el plano lo que de verdad ocupa, o la
           selección y las cotas mienten. */
        huella: pieza ? medidaDePieza(pieza) : undefined,
        nombre: nombre.trim() || undefined,
        ...(esAvatar ? { avatar } : {}),
      },
      `Ajustó ${titulo.toLowerCase()} en el taller`,
    )
    onCerrar()
  }

  const SECCIONES = esAvatar
    ? [
        ['avatar', 'Animalito'],
        ['pose', 'Pose'],
      ]
    : [
        ...(pieza ? [] : [['medidas', 'Medidas']]),
        ['partes', 'Partes'],
        ['cable', 'Cable'],
        ['movimiento', 'Movimiento'],
        ...(dev ? [['conexion', 'Conexión']] : []),
      ]

  /* Hornear: se lee lo que YA está dibujado y cada malla se vuelve una parte.
     Se traduce la geometría montada y no el código del componente, así que
     funciona igual con cualquier mueble, incluidos los que se escriban
     mañana. Es de un solo sentido y se avisa: a partir de aquí la pieza deja
     de seguir a su versión del catálogo y pasa a ser suya. */
  const hornearPieza = () => {
    const raiz = escena.current
    const p = hornear(raiz, titulo)
    setPieza(p)
    setParteSel(p.partes[0]?.id ?? null)
    setSeccion('partes')
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-ink transition-opacity duration-200 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <header className="relative z-10 flex items-center gap-3 border-b border-line bg-ink px-4 py-2.5">
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
        <div
          className="relative min-w-0 flex-1"
          /* Se anima con los cuatro bordes y se QUEDA fija: pasar a maqueta de
             flujo al terminar metía un último salto de unos pixeles —el hueco
             calculado nunca cae exactamente donde lo pone el flex— y ese
             saltito al final se veía más que todo lo demás. */
          style={
            rect
              ? {
                  position: 'fixed',
                  flex: 'none',
                  /* Debajo de todo: el lienzo va fijo para poder animarlo, y
                     fijo con z por encima tapaba el panel de controles. */
                  zIndex: 0,
                  transition:
                    'left 420ms cubic-bezier(.22,1,.36,1), top 420ms cubic-bezier(.22,1,.36,1), right 420ms cubic-bezier(.22,1,.36,1), bottom 420ms cubic-bezier(.22,1,.36,1)',
                  ...(abierto
                    ? { left: 0, top: CABEZA, right: PANEL, bottom: 0 }
                    : {
                        left: rect.left,
                        top: rect.top,
                        right: Math.max(0, window.innerWidth - rect.left - rect.width),
                        bottom: Math.max(0, window.innerHeight - rect.top - rect.height),
                      }),
                }
              : undefined
          }
        >
          <Canvas
            shadows
            dpr={[1, 1.75]}
            /* Arranca EXACTAMENTE donde quedó la cámara del cuarto —misma
               distancia, misma dirección, mismo campo— para que la pieza no se
               mueva ni un pixel al cruzar. Luego se acomoda sola a la pose de
               trabajo, que es un movimiento y no un salto. */
            camera={{ position: pose?.pos ?? [lejos * 0.72, lejos * 0.55, lejos * 0.9], fov: 42 }}
            gl={{ antialias: true }}
          >
            {/* El mismo fondo que el cuarto: con otro color, la disolvencia se
                nota como un cambio de pantalla en vez de como el cuarto
                desvaneciéndose. */}
            <color attach="background" args={[fondoDe(e.paleta)]} />
            <Rig ancho={tam * 3} largo={tam * 3} alto={tam * 2.6} />
            <Mesa color={pal.piso} r={tam * 2.2 + 0.6} />
            <Suspense fallback={null}>
              <group ref={escena}>
                {/* Con el giro que tiene en el cuarto. Enderezarla aquí sería
                    más "canónico" y haría que la pieza girara justo al cruzar,
                    que es lo contrario de lo que se busca: se puede girar con
                    el ratón, y así se ve de dónde viene.
                    Un animalito es la excepción: se voltea a ver a la cámara.
                    Se viene a editarle la cara, y entrar viéndole la nuca es
                    empezar mal —el giro se lo puede dar uno después—. */}
                <group
                  rotation={[
                    0,
                    esAvatar
                      ? Math.atan2(pose?.pos?.[0] ?? 1, pose?.pos?.[2] ?? 1)
                      : (item.rot ?? 0),
                    0,
                  ]}
                >
                <Animar tipo={animacion} semilla={item.id?.length ?? 0}>
                  {esAvatar ? (
                    <AvatarPieza avatar={avatar} pose={avatar.pose ?? 'reposo'} />
                  ) : pieza ? (
                    <PiezaPropia
                      pieza={pieza}
                      seleccion={parteSel}
                      onTomarParte={setParteSel}
                      onNodo={(id, o) => {
                        if (o) nodos.current.set(id, o)
                        else nodos.current.delete(id)
                        if (id === parteSel) setNodoSel(o ?? null)
                      }}
                    />
                  ) : def?.Comp ? (
                    def.Nuevo ? (
                      <def.Comp {...valores} />
                    ) : (
                      <def.Comp position={[0, 0, 0]} rotation={[0, 0, 0]} {...valores} />
                    )
                  ) : dev ? (
                    <Cuerpo device={dev} params={item.params} encendido color={COLOR_LUZ} />
                  ) : null}
                </Animar>
                </group>
              </group>

              {/* El gizmo de la parte. Es el mismo gesto que en el plano —tomar
                  y arrastrar— pero una escala más abajo: ahí se mueve el mueble
                  dentro del cuarto, aquí una parte dentro del mueble. */}
              {pieza && parteSel && (
                <GizmoParte
                  parte={pieza.partes.find((x) => x.id === parteSel)}
                  nodo={nodoSel}
                  modo={modoParte}
                  onCambiar={(patch) =>
                    setPieza((z) => ({
                      ...z,
                      partes: z.partes.map((x) => (x.id === parteSel ? { ...x, ...patch } : x)),
                    }))
                  }
                />
              )}
            </Suspense>
            {/* Avisa cuando ya hay algo pintado. Sin esto el taller aparecía un
                cuadro antes de que su lienzo tuviera imagen, y ese cuadro
                —negro— era el parpadeo que rompía la continuidad. */}
            <PrimerCuadro
              onListo={() => {
                onPintado?.()
                /* Y un respiro antes de abrir: si el lienzo se expande en el
                   mismo cuadro en que aparece, el cruce y la apertura se
                   encinan y se ve un tirón. */
                setTimeout(() => setAbierto(true), 90)
              }}
            />
            <OrbitControls
              makeDefault
              target={[0, pose?.mira ?? mira, 0]}
              minDistance={tam * 0.5}
              maxDistance={tam * 8 + 3}
            />
            {/* Nada de reacomodar al llegar: la cámara viene ya en su sitio
                desde el cuarto. Un segundo movimiento al entrar es justo lo
                que delataba el cambio de escena. */}
          </Canvas>

          {pieza && parteSel ? (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-0.5 rounded-xl border border-line bg-ink/92 p-1 backdrop-blur">
              {[
                ['mover', 'Mover'],
                ['girar', 'Girar'],
                ['escalar', 'Estirar'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setModoParte(id)}
                  className={`rounded-lg px-2.5 py-1 text-[11.5px] transition-colors ${
                    modoParte === id ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-line bg-ink/85 px-3 py-1 text-[11px] text-cream-3 backdrop-blur">
              Arrastra para girar · rueda para acercar
            </p>
          )}
        </div>

        {/* los controles */}
        <aside className="relative z-10 w-[330px] shrink-0 overflow-y-auto border-l border-line bg-ink">
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

          {seccion === 'avatar' && (
            <PanelAvatar
              avatar={avatar}
              onAvatar={setAvatar}
              cat={catAvatar}
              onCat={setCatAvatar}
            />
          )}

          {seccion === 'pose' && <PanelPose avatar={avatar} onAvatar={setAvatar} />}

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

          {seccion === 'partes' && (
            <PanelPartes
              pieza={pieza}
              sel={parteSel}
              onSel={setParteSel}
              onPieza={setPieza}
              onHornear={hornearPieza}
              titulo={titulo}
            />
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

/* El hueco del taller: encabezado arriba y panel a la derecha. */
const CABEZA = 57
const PANEL = 330

const COLOR_LUZ = { r: 1, g: 0.92, b: 0.82, getHSL: () => ({ h: 0.1, s: 0.3, l: 0.9 }) }

/** Avisa en cuanto la escena tiene su primera imagen. */
function PrimerCuadro({ onListo }) {
  const n = useRef(0)
  useFrame(() => {
    n.current += 1
    // dos cuadros: el primero puede salir antes de que compilen los shaders
    if (n.current === 2) onListo?.()
  })
  return null
}


/**
 * El gizmo de UNA parte.
 *
 * Va sobre un nodo intermediario y no sobre la malla: la malla se rehace en
 * cuanto cambia una medida —la geometría se recalcula— y el control se quedaba
 * agarrado a un objeto que ya no existe. Con el intermediario, el control
 * siempre tiene a quién sujetar.
 *
 * Estirar mueve la MEDIDA, no la escala. Una parte con escala 1.4 miente sobre
 * cuánto mide, y estas piezas se van a fabricar: lo que dice el panel tiene
 * que ser lo que va al carpintero.
 */
function GizmoParte({ parte, nodo, modo, onCambiar }) {
  if (!parte || !nodo) return null

  /* El control se engancha a la MALLA de la parte, no a un objeto auxiliar.
     Con el auxiliar, arrastrar movía algo invisible y la pieza solo saltaba a
     su nuevo sitio al soltar: se veía el resultado, nunca el movimiento.
     Enganchado a la parte, la mueve three.js mientras dura el arrastre y solo
     al soltar se escribe el número. */
  const soltar = () => {
    const r3 = (n) => Number(n.toFixed(4))
    if (modo === 'escalar') {
      /* Estirar cambia la MEDIDA, no deja una escala puesta. Una parte con
         escala 1.4 miente sobre cuánto mide, y esto se manda a hacer. */
      const med = parte.med.map((m, i) => Math.max(0.005, r3(m * [nodo.scale.x, nodo.scale.y, nodo.scale.z][i])))
      nodo.scale.set(1, 1, 1)
      onCambiar({ med })
    } else if (modo === 'girar') {
      onCambiar({ rot: [r3(nodo.rotation.x), r3(nodo.rotation.y), r3(nodo.rotation.z)] })
    } else {
      onCambiar({ pos: [r3(nodo.position.x), r3(nodo.position.y), r3(nodo.position.z)] })
    }
  }

  return (
    <TransformControls
      object={nodo}
      mode={modo === 'girar' ? 'rotate' : modo === 'escalar' ? 'scale' : 'translate'}
      size={0.7}
      translationSnap={0.005}
      rotationSnap={Math.PI / 36}
      onMouseUp={soltar}
    />
  )
}

/**
 * La lista de partes.
 *
 * Antes de hornear no hay lista: la pieza es un componente y sus partes están
 * en el código. Hornear la traduce a datos —se lee lo que ya está dibujado, no
 * el código— y a partir de ahí se mueve, se estira, se duplica y se borra
 * parte por parte.
 *
 * Es de un solo sentido y hay que decirlo: horneada, la pieza deja de seguir a
 * su versión del catálogo. Deja de ser "una cama del sistema" y pasa a ser
 * esta cama.
 */
function PanelPartes({ pieza, sel, onSel, onPieza, onHornear, titulo }) {
  if (!pieza)
    return (
      <div className="px-3 py-3">
        <p className="text-[10.5px] leading-snug text-cream-3">
          Las partes de {titulo.toLowerCase()} viven en el código del sistema. Para moverlas una por una hay que
          pasar la pieza a partes: se lee lo que ya está dibujado y cada volumen se vuelve una parte que se puede
          mover, estirar, duplicar o borrar.
        </p>
        <button
          onClick={onHornear}
          className="mt-3 w-full rounded-lg border border-ember px-2 py-1.5 text-[12px] text-ember transition-colors hover:bg-ember hover:text-ink"
        >
          Pasar a partes editables →
        </button>
        <p className="mt-1.5 text-[10px] leading-snug text-cream-3">
          Es de un solo sentido: a partir de ahí esta pieza deja de seguir a su versión del catálogo. Las demás
          del mismo modelo no cambian.
        </p>
      </div>
    )

  const set = (fn) => onPieza((z) => fn(z))
  const parte = pieza.partes.find((p) => p.id === sel)

  return (
    <div className="px-3 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Partes · {pieza.partes.length}</p>
        <button
          onClick={() =>
            set((z) => {
              const nueva = parteVacia('caja')
              onSel(nueva.id)
              return { ...z, partes: [...z.partes, nueva] }
            })
          }
          className="text-[10.5px] text-thread-2 hover:text-ember"
        >
          + agregar
        </button>
      </div>

      <div className="mt-1.5 max-h-[190px] space-y-0.5 overflow-y-auto">
        {pieza.partes.map((p, i) => (
          <button
            key={p.id}
            onClick={() => onSel(p.id)}
            className={`flex w-full items-baseline justify-between gap-2 rounded px-1.5 py-1 text-left transition-colors ${
              p.id === sel ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
            }`}
          >
            <span className="text-[11.5px]">
              {i + 1}. {FORMAS[p.forma]?.label ?? p.forma}
            </span>
            <span className={`shrink-0 text-[10px] ${p.id === sel ? 'text-ink/70' : 'text-cream-3'}`}>
              {p.med.map((m) => Math.round(m * 100)).join('×')} cm
            </span>
          </button>
        ))}
      </div>

      {parte && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Esta parte</p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  set((z) => {
                    const copia = { ...parte, id: Math.random().toString(36).slice(2, 9), pos: [...parte.pos] }
                    copia.pos[0] += 0.08
                    onSel(copia.id)
                    return { ...z, partes: [...z.partes, copia] }
                  })
                }
                className="text-[10.5px] text-cream-3 hover:text-cream"
              >
                duplicar
              </button>
              <button
                onClick={() =>
                  set((z) => {
                    const partes = z.partes.filter((x) => x.id !== parte.id)
                    onSel(partes[0]?.id ?? null)
                    return { ...z, partes }
                  })
                }
                className="text-[10.5px] text-cream-3 hover:text-ember"
              >
                borrar
              </button>
            </div>
          </div>

          <label className="mt-2 block">
            <span className="block text-[10px] text-cream-3">Forma</span>
            <select
              value={parte.forma}
              onChange={(ev) =>
                set((z) => ({
                  ...z,
                  partes: z.partes.map((x) => (x.id === parte.id ? { ...x, forma: ev.target.value } : x)),
                }))
              }
              className="mt-0.5 w-full rounded-lg border border-line bg-ink px-2 py-1 text-[12px] text-cream"
            >
              {Object.entries(FORMAS).map(([id, f]) => (
                <option key={id} value={id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {FORMAS[parte.forma].med.map((label, i) =>
              label ? (
                <label key={i} className="block">
                  <span className="block text-[10px] text-cream-3">{label}</span>
                  <input
                    type="number"
                    step={0.005}
                    min={0.005}
                    value={parte.med[i]}
                    onChange={(ev) =>
                      set((z) => ({
                        ...z,
                        partes: z.partes.map((x) =>
                          x.id === parte.id
                            ? { ...x, med: x.med.map((m, k) => (k === i ? Number(ev.target.value) : m)) }
                            : x,
                        ),
                      }))
                    }
                    className="mt-0.5 w-full rounded border border-line bg-ink px-1 py-1 text-right text-[11px] text-cream"
                  />
                </label>
              ) : (
                <span key={i} />
              ),
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <label className="block">
              <span className="block text-[10px] text-cream-3">Tono</span>
              <select
                value={parte.color ? '' : parte.tono}
                onChange={(ev) =>
                  set((z) => ({
                    ...z,
                    partes: z.partes.map((x) =>
                      x.id === parte.id ? { ...x, tono: ev.target.value, color: undefined } : x,
                    ),
                  }))
                }
                className="mt-0.5 w-full rounded-lg border border-line bg-ink px-2 py-1 text-[11.5px] text-cream"
              >
                {parte.color && <option value="">el que traía</option>}
                {TONOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] text-cream-3">Acabado</span>
              <select
                value={parte.rol}
                onChange={(ev) =>
                  set((z) => ({
                    ...z,
                    partes: z.partes.map((x) => (x.id === parte.id ? { ...x, rol: ev.target.value } : x)),
                  }))
                }
                className="mt-0.5 w-full rounded-lg border border-line bg-ink px-2 py-1 text-[11.5px] text-cream"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-2 text-[10px] leading-snug text-cream-3">
            Estirar con el gizmo cambia la MEDIDA, no una escala. Una parte con escala 1.4 miente sobre cuánto
            mide, y estas piezas se mandan a hacer: lo que dice aquí es lo que va al carpintero.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * El configurador del animalito.
 *
 * Es la parte que más se va a usar del taller y está armada al revés que un
 * formulario: primero el azar, después el ajuste. Nadie llega con un personaje
 * en la cabeza; se generan cuatro, uno cae bien, y ése se corrige. Empezar en
 * blanco con nueve menús es la manera de que nadie lo use nunca.
 *
 * Las paletas van separadas por tipo a propósito. Un pelaje fucsia y una panza
 * del color de la playera son dos maneras de arruinar un personaje, y la forma
 * de evitarlas no es un aviso: es no ofrecer el color.
 */
function PanelAvatar({ avatar, onAvatar, cat, onCat }) {
  const c = CATS_AVATAR.find((x) => x.id === cat) ?? CATS_AVATAR[0]
  const valor = avatar?.[c.id]
  const set = (v) => onAvatar({ ...avatar, [c.id]: v })

  return (
    <div className="px-3 py-3">
      <button
        onClick={() => onAvatar({ ...animalitoAlAzar(), pose: avatar?.pose ?? 'reposo' })}
        className="w-full rounded-lg border border-ember px-2 py-1.5 text-[12px] text-ember transition-colors hover:bg-ember hover:text-ink"
      >
        Generar uno al azar
      </button>
      <p className="mt-1.5 text-[10.5px] leading-snug text-cream-3">
        Sale uno presentable casi siempre, no uno cualquiera: el pelaje casi siempre es el de su especie —un oso
        turquesa es un chiste que se gasta a la segunda— y cada extra tiene su propia probabilidad.
      </p>

      <div className="mt-3 flex flex-wrap gap-1">
        {CATS_AVATAR.map((x) => (
          <button
            key={x.id}
            onClick={() => onCat(x.id)}
            className={`rounded-full px-2 py-1 text-[11px] transition-colors ${
              x.id === cat ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {c.tipo === 'lista' && (
        <div className="mt-2.5 grid grid-cols-2 gap-1">
          {c.opciones.map((o) => (
            <button
              key={o.id}
              onClick={() => set(o.id)}
              className={`rounded-lg border px-2 py-1.5 text-[11.5px] transition-colors ${
                valor === o.id ? 'border-ember bg-ember/12 text-cream' : 'border-line text-cream-3 hover:bg-cream/6'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {c.tipo === 'color' && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {PAL_AVATAR[c.paleta].map((v) => (
            <button
              key={v}
              onClick={() => set(v)}
              aria-label={v}
              className={`h-6 w-6 rounded-full border transition-transform ${
                valor === v ? 'scale-110 border-cream' : 'border-line hover:scale-110'
              }`}
              style={{ background: v }}
            />
          ))}
        </div>
      )}

      {/* La estatura es de verdad, en metros: un animalito puesto en el cuarto
          es la referencia de escala de todo lo demás, y para eso tiene que
          medir lo que dice que mide. */}
      <label className="mt-3 block">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] tracking-[0.1em] text-cream-3 uppercase">Estatura</span>
          <span className="text-[11.5px] text-cream">{(avatar?.estatura ?? 1.2).toFixed(2)} m</span>
        </div>
        <input
          type="range"
          min={0.6}
          max={1.9}
          step={0.01}
          value={avatar?.estatura ?? 1.2}
          onChange={(ev) => onAvatar({ ...avatar, estatura: Number(ev.target.value) })}
          className="mt-1 h-1 w-full accent-[#4d9fff]"
        />
        <p className="mt-1 text-[10px] leading-snug text-cream-3">
          A 1.20 se lee como personaje; a 1.70 sirve de referencia de escala para juzgar alturas de barra, tele y
          repisas.
        </p>
      </label>
    </div>
  )
}

/**
 * La pose.
 *
 * Se calculan cuadro a cuadro, no salen de archivos: por eso no pesan nada y
 * por eso la respiración va en todas —un personaje que no respira se lee como
 * maniquí incluso quieto—.
 */
function PanelPose({ avatar, onAvatar }) {
  return (
    <div className="px-3 py-3">
      <p className="text-[10.5px] leading-snug text-cream-3">
        Reposo para configurar; las demás para cuando ya está puesto en el cuarto. Uno quieto en una esquina se
        lee como maniquí; uno saludando desde la barra se lee como alguien que vive ahí.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {POSES_AVATAR.map((a) => (
          <button
            key={a.id}
            onClick={() => onAvatar({ ...avatar, pose: a.id })}
            className={`rounded-lg px-2 py-1.5 text-[11.5px] transition-colors ${
              (avatar?.pose ?? 'reposo') === a.id ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

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
