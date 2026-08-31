import { Suspense, lazy, useMemo, useState } from 'react'

import { useSurvey } from '../../../store/survey'
import { planoVacio } from '../../../sync/eventos'
import { diagnosticoLux, luxDelCuarto } from './luz'
import { tipoPorNombre } from './catalogo'
import { disponerPlanta, separar } from './disponer'

const EscenaConjunto = lazy(() => import('./EscenaConjunto'))

/**
 * La casa armada.
 *
 * Cada cuarto se levanta por separado —que es como se recorre una casa, un
 * cuarto a la vez— y aquí se acomodan unos junto a otros hasta que la planta
 * se parece a la de verdad. Los pisos se apilan solos por el número de nivel
 * que trae cada cuarto.
 *
 * No sustituye un plano arquitectónico y no lo pretende: sirve para ver que
 * la instalación tiene sentido en conjunto —que el rack queda cerca de donde
 * hace falta, que un piso no quedó a oscuras— antes de ir a la obra.
 */

export default function Conjunto({ rooms, onCerrar, onAbrirCuarto }) {
  const setPlano = useSurvey((s) => s.setPlano)
  const [seleccion, setSeleccion] = useState(null)
  const [pisoVisible, setPisoVisible] = useState('todos')

  /** Solo entran los cuartos que ya tienen plano: los demás no tienen qué mostrar. */
  const conPlano = useMemo(
    () =>
      rooms
        .filter((r) => r.plano?.items)
        .map((r) => ({ room: r, plano: { ...planoVacio(r.m2), ...r.plano } })),
    [rooms],
  )

  const pisos = useMemo(() => [...new Set(conPlano.map((c) => c.plano.piso ?? 0))].sort((a, b) => a - b), [conPlano])

  const visibles = pisoVisible === 'todos' ? conPlano : conPlano.filter((c) => (c.plano.piso ?? 0) === pisoVisible)

  /**
   * Mover un cuarto aquí ES moverlo en su plano: la posición vive dentro del
   * cuarto, así que no hay nada que "propagar" — lo que se arrastra en la
   * planta es el mismo dato que abre el editor del cuarto, y sus muebles y
   * dispositivos viajan con él porque están en coordenadas locales.
   *
   * Se ajusta a una rejilla de 10 cm: dos cuartos arrastrados a ojo quedan
   * casi alineados y ese "casi" se ve mal en cuanto hay cuatro.
   */
  const mover = (roomId, x, z) => {
    const c = conPlano.find((x2) => x2.room.id === roomId)
    if (!c) return
    const rejilla = (v) => Number((Math.round(v * 10) / 10).toFixed(2))
    let px = rejilla(x)
    let pz = rejilla(z)

    /* Dos cuartos no pueden ocupar el mismo lugar: una planta con espacios
       encimados no es un plano, es un error que además se ve pésimo enfrente
       del cliente. Si el destino choca, se empuja por el eje donde menos hay
       que moverlo — que es lo que uno haría con la mano. */
    const solapa = (ax, az, o) =>
      Math.abs(ax - (o.plano.pos?.[0] ?? 0)) < (c.plano.ancho + o.plano.ancho) / 2 - 0.05 &&
      Math.abs(az - (o.plano.pos?.[1] ?? 0)) < (c.plano.largo + o.plano.largo) / 2 - 0.05

    const vecinos = conPlano.filter(
      (o) => o.room.id !== roomId && (o.plano.piso ?? 0) === (c.plano.piso ?? 0),
    )

    for (let i = 0; i < 8; i++) {
      const choque = vecinos.find((o) => solapa(px, pz, o))
      if (!choque) break
      const ox = choque.plano.pos?.[0] ?? 0
      const oz = choque.plano.pos?.[1] ?? 0
      const dx = (c.plano.ancho + choque.plano.ancho) / 2 + 0.4 - Math.abs(px - ox)
      const dz = (c.plano.largo + choque.plano.largo) / 2 + 0.4 - Math.abs(pz - oz)
      if (dx < dz) px = rejilla(px + Math.sign(px - ox || 1) * dx)
      else pz = rejilla(pz + Math.sign(pz - oz || 1) * dz)
    }

    setPlano(roomId, { ...c.plano, pos: [px, pz] }, `Acomodó ${c.room.nombre} en la planta`)
  }

  /**
   * Acomodo automático: los cuartos de cada piso se reparten en una retícula.
   *
   * No adivina la casa —eso no se puede— pero saca de la pila inicial, donde
   * todos nacen en el origen y quedan uno encima de otro. De ahí se arrastra.
   */
  /* Los espacios encimados, si los hay. Cambiar una medida en el editor del
     cuarto no toca la planta, así que un espacio que creció se mete dentro del
     vecino sin avisar. No se corrige solo —mover la planta de alguien sin que
     lo pida es peor— pero sí se avisa y se ofrece el arreglo de un toque. */
  const encimados = useMemo(() => separar(conPlano), [conPlano])

  const separarTodo = () => {
    for (const c of conPlano) {
      const pos = encimados.get(c.room.id)
      if (pos) setPlano(c.room.id, { ...c.plano, pos }, `Separó ${c.room.nombre} de sus vecinos`)
    }
  }

  const acomodar = () => {
    const posiciones = disponerPlanta(conPlano)
    for (const c of conPlano) {
      const pos = posiciones.get(c.room.id)
      if (pos) setPlano(c.room.id, { ...c.plano, pos }, 'Acomodó la planta')
    }
  }

  const resumen = useMemo(
    () =>
      conPlano.map(({ room, plano }) => {
        const lm = plano.items
          .filter((i) => i.clase === 'equipo' && i.params)
          .reduce((a, i) => a + i.params.lm * ((i.params.brillo ?? 100) / 100), 0)
        const area = plano.ancho * plano.largo
        const lux = luxDelCuarto(lm, area)
        return {
          room,
          plano,
          lux,
          area,
          diag: diagnosticoLux(lux, plano.tipoCuarto ?? tipoPorNombre(room.nombre)),
        }
      }),
    [conPlano],
  )

  const areaTotal = resumen.reduce((a, r) => a + r.area, 0)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <div>
          <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Planta del proyecto</p>
          <h2 className="display text-[19px] text-cream">
            {conPlano.length} habitaciones · {areaTotal.toFixed(0)} m²
          </h2>
        </div>

        <div className="flex gap-1">
          {['todos', ...pisos].map((f) => (
            <button
              key={f}
              onClick={() => setPisoVisible(f)}
              aria-pressed={pisoVisible === f}
              className={`rounded-lg border px-2.5 py-1 text-[11.5px] transition-colors ${
                pisoVisible === f ? 'border-ember bg-ember text-ink' : 'border-line text-cream-3 hover:border-cream/35'
              }`}
            >
              {f === 'todos' ? 'Todos los pisos' : `Piso ${f}`}
            </button>
          ))}
        </div>

        <button
          onClick={acomodar}
          className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-cream-2 transition-colors hover:border-cream/35"
        >
          Acomodar en retícula
        </button>

        {encimados.size > 0 && (
          <button
            onClick={separarTodo}
            className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-2.5 py-1 text-[11.5px] text-rose-300 transition-colors hover:bg-rose-500/20"
          >
            {encimados.size} {encimados.size === 1 ? 'espacio encimado' : 'espacios encimados'} · separar
          </button>
        )}

        <button
          onClick={onCerrar}
          className="ml-auto rounded-lg bg-ember px-4 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-ember-2"
        >
          Listo
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          {conPlano.length === 0 ? (
            <div className="grid h-full place-items-center px-8 text-center">
              <div className="max-w-[38ch]">
                <p className="display text-[19px] text-cream">Todavía no hay planos.</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-cream-3">
                  Abre el plano 3D de una habitación y coloca algo. En cuanto haya dos, aquí se acomodan para ver la
                  planta completa.
                </p>
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="grid h-full place-items-center text-[13px] text-cream-3">Cargando planta…</div>}>
              <EscenaConjunto
                cuartos={visibles}
                seleccion={seleccion}
                onSeleccionar={setSeleccion}
                onMover={mover}
              />
            </Suspense>
          )}

          <p className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-line bg-ink/92 px-2.5 py-1.5 text-[11px] text-cream-3 backdrop-blur">
            Arrastra un cuarto para acomodarlo. Los pisos se apilan por el nivel de cada uno.
          </p>
        </div>

        <aside className="w-[17rem] shrink-0 overflow-y-auto border-l border-line">
          {resumen.map(({ room, plano, lux, area, diag }) => (
            <button
              key={room.id}
              onClick={() => setSeleccion(room.id)}
              onDoubleClick={() => onAbrirCuarto(room.id)}
              className={`block w-full border-b border-line px-3 py-2.5 text-left transition-colors ${
                seleccion === room.id ? 'bg-ember/8' : 'hover:bg-ink-2'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] text-cream">{room.nombre}</span>
                <span className="text-[10px] text-cream-3">Piso {plano.piso ?? 0}</span>
              </div>
              <div className="mt-0.5 text-[10.5px] text-cream-3">
                {area.toFixed(1)} m² · {plano.items.length} piezas
              </div>
              <div
                className={`mt-0.5 text-[10.5px] ${
                  diag.nivel === 'ok' ? 'text-emerald-300' : diag.nivel === 'bajo' ? 'text-red-300' : 'text-ember-2'
                }`}
              >
                {lux} lux · {diag.nivel === 'ok' ? 'bien' : diag.nivel}
              </div>
            </button>
          ))}
          <p className="px-3 py-2 text-[10.5px] leading-relaxed text-cream-3">
            Doble clic en un cuarto para abrir su plano.
          </p>
        </aside>
      </div>
    </div>
  )
}
