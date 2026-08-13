import { useMemo, useState } from 'react'
import { DEVICE_BY_ID } from '../../content/catalog'
import { SECCIONES, resumen, seccionDe } from '../../sync/eventos'
import { useSurvey } from '../../store/survey'

/**
 * Quién cambió qué, y cuándo.
 *
 * No es una bitácora que haya que acordarse de escribir: es la misma lista de
 * eventos con la que se arma el proyecto, leída al revés. Si algo se ve en la
 * pantalla es porque pasó por aquí, así que no puede faltar un renglón.
 *
 * El texto de cada cambio se redacta al momento de leerlo y no se guarda: un
 * evento de marzo se sigue describiendo bien aunque hoy cambiemos cómo se
 * escribe, y no hay que migrar nada.
 */

const nombreDe = (id) => DEVICE_BY_ID[id]?.name ?? id

const MINUTO = 60_000
const HORA = 60 * MINUTO
const DIA = 24 * HORA

function cuando(iso) {
  const d = new Date(iso)
  const delta = Date.now() - d.getTime()
  if (delta < MINUTO) return 'hace un momento'
  if (delta < HORA) return `hace ${Math.floor(delta / MINUTO)} min`
  if (delta < DIA) return `hace ${Math.floor(delta / HORA)} h`
  if (delta < 7 * DIA) return `hace ${Math.floor(delta / DIA)} d`
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const exacto = (iso) =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/** Inicial en un disco del color del socio: se distingue de reojo. */
export function Avatar({ usuario, size = 20 }) {
  const socios = useSurvey((s) => s.socios)
  const s = socios[usuario] ?? { corto: usuario ?? '—', color: '#9c9388' }
  return (
    <span
      title={s.nombre ?? usuario}
      style={{ width: size, height: size, borderColor: s.color, color: s.color }}
      className="inline-flex flex-none items-center justify-center rounded-full border text-[9px] font-medium uppercase"
    >
      {(s.corto ?? '?').slice(0, 1)}
    </span>
  )
}

/** Una línea del historial. */
function Renglon({ ev }) {
  const socios = useSurvey((s) => s.socios)
  const s = socios[ev.autor] ?? { corto: ev.autor, nombre: ev.autor }
  return (
    <li className="flex gap-2 py-1.5">
      <Avatar usuario={ev.autor} />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] leading-snug text-cream-2">
          <span className="text-cream">{s.corto}</span> {resumen(ev, nombreDe).replace(/^\w/, (c) => c.toLowerCase())}
        </p>
        <p className="text-[10.5px] text-cream-3" title={exacto(ev.ts)}>
          {cuando(ev.ts)}
          {ev.pendiente && <span className="ml-1.5 text-ember">· sin guardar</span>}
        </p>
      </div>
    </li>
  )
}

/**
 * Historial de una sección concreta, para colgarlo del encabezado de cada
 * tarjeta del levantamiento. Colapsado por default: el dato que importa casi
 * siempre es "quién tocó esto y cuándo", no la lista completa.
 */
export function HistorialSeccion({ proyectoId, seccion }) {
  const eventos = useSurvey((s) => s.eventos)
  const [abierto, setAbierto] = useState(false)

  const propios = useMemo(
    () =>
      eventos.filter((e) => e.proyectoId === proyectoId && seccionDe(e.tipo) === seccion).slice().reverse(),
    [eventos, proyectoId, seccion],
  )

  if (propios.length === 0) return null
  const ultimo = propios[0]

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-[10.5px] text-cream-3 transition-colors hover:text-cream-2"
        title="Ver historial de esta sección"
      >
        <Avatar usuario={ultimo.autor} size={16} />
        {cuando(ultimo.ts)}
        <span className="text-cream-3/60">· {propios.length}</span>
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setAbierto(false)} aria-hidden="true" />
          <div className="absolute top-full right-0 z-30 mt-1 max-h-[22rem] w-[22rem] overflow-y-auto rounded-xl border border-line bg-ink-2 p-3 shadow-2xl shadow-ink">
            <p className="mb-1.5 text-[10px] tracking-[0.12em] text-cream-3 uppercase">
              {SECCIONES[seccion]} · {propios.length} cambios
            </p>
            <ul className="divide-y divide-line/60">
              {propios.slice(0, 60).map((e) => (
                <Renglon key={e.id} ev={e} />
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

/** Historial completo del proyecto, con filtro por sección. */
export default function Historial({ proyectoId }) {
  const eventos = useSurvey((s) => s.eventos)
  const [seccion, setSeccion] = useState('')
  const [quien, setQuien] = useState('')

  const todos = useMemo(
    () => eventos.filter((e) => e.proyectoId === proyectoId).slice().reverse(),
    [eventos, proyectoId],
  )

  const porSeccion = useMemo(() => {
    const c = {}
    for (const e of todos) {
      const s = seccionDe(e.tipo)
      c[s] = (c[s] ?? 0) + 1
    }
    return c
  }, [todos])

  const autores = useMemo(() => [...new Set(todos.map((e) => e.autor))], [todos])

  const filtrados = useMemo(
    () =>
      todos.filter(
        (e) => (!seccion || seccionDe(e.tipo) === seccion) && (!quien || e.autor === quien),
      ),
    [todos, seccion, quien],
  )

  const chip = (activo) =>
    `rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
      activo ? 'border-ember bg-ember text-ink' : 'border-line text-cream-3 hover:border-cream/30'
    }`

  return (
    <section className="rounded-xl border border-line bg-ink-2">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 className="text-[11px] tracking-[0.14em] text-cream-2 uppercase">
          Historial · {todos.length} cambios
        </h2>
      </header>

      <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2.5">
        <button onClick={() => setSeccion('')} className={chip(!seccion)}>
          Todo
        </button>
        {Object.entries(SECCIONES)
          .filter(([id]) => porSeccion[id])
          .map(([id, label]) => (
            <button key={id} onClick={() => setSeccion(seccion === id ? '' : id)} className={chip(seccion === id)}>
              {label} <span className="opacity-60">{porSeccion[id]}</span>
            </button>
          ))}

        {autores.length > 1 && (
          <span className="ml-auto flex gap-1.5">
            {autores.map((a) => (
              <button key={a} onClick={() => setQuien(quien === a ? '' : a)} className={chip(quien === a)}>
                <Avatar usuario={a} size={14} /> <SocioNombre usuario={a} />
              </button>
            ))}
          </span>
        )}
      </div>

      <ul className="max-h-[28rem] divide-y divide-line/60 overflow-y-auto px-4 py-2">
        {filtrados.map((e) => (
          <Renglon key={e.id} ev={e} />
        ))}
        {filtrados.length === 0 && (
          <li className="py-8 text-center text-[12px] text-cream-3">Nada con ese filtro.</li>
        )}
      </ul>
    </section>
  )
}

function SocioNombre({ usuario }) {
  const socios = useSurvey((s) => s.socios)
  return <>{socios[usuario]?.corto ?? usuario}</>
}
