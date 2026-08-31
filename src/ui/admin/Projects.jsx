import { useMemo, useState } from 'react'
import { quote } from '../../content/pricing'
import { ESTADOS, fechasPorProyecto, useSurvey } from '../../store/survey'
import { ARRANQUE_PROPIEDAD, ESPACIO_BY_ID, PROPIEDADES } from '../../content/espacios'
import { nuevoCuarto, planoVacio } from '../../sync/eventos'
import { disponerCuarto } from './plano/disponer'
import { Avatar } from './Historial'

/**
 * Proyectos.
 *
 * La regla que faltaba: un levantamiento pertenece a un proyecto. Antes había
 * un solo levantamiento suelto, así que levantar la casa de otro cliente
 * significaba pisar el anterior —o vaciarlo y perderlo—. Aquí se abre uno,
 * se trabaja dentro, y se puede volver a él la semana siguiente.
 *
 * Para dar de alta lo mínimo indispensable son dos campos: quién y dónde. El
 * resto —RFC, régimen, metros, niveles— se captura en el levantamiento, que es
 * cuando de verdad se sabe.
 */

const money = (n) => `$${Math.round(n).toLocaleString('es-MX')}`

const fecha = (iso) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

const ESTADO_TONO = {
  levantamiento: 'border-ember/40 text-ember-2 bg-ember/8',
  cotizado: 'border-thread/40 text-thread-2 bg-thread/10',
  instalacion: 'border-cream/25 text-cream-2 bg-cream/8',
  cerrado: 'border-line text-cream-3',
}

const inputCls =
  'w-full rounded-lg border border-line bg-ink px-2.5 py-2 text-[13px] text-cream outline-none placeholder:text-cream-3/60 focus:border-ember/60'

/* ── alta ─────────────────────────────────────────────────────── */

function Alta({ onListo }) {
  const crear = useSurvey((s) => s.crearProyecto)
  const setPlano = useSurvey((s) => s.setPlano)
  const [nombre, setNombre] = useState('')
  const [cliente, setCliente] = useState('')
  const [direccion, setDireccion] = useState('')
  const [tel, setTel] = useState('')
  const [propiedad, setPropiedad] = useState('casa')

  const puede = nombre.trim() && direccion.trim()

  /**
   * El proyecto nace con los espacios que esa propiedad casi siempre tiene, y
   * cada uno ya trae su equipo típico.
   *
   * Empezar en blanco obliga a teclear lo obvio —toda casa tiene cocina— y a
   * buscar en el catálogo seis productos que siempre son los mismos. Se quita
   * lo que no aplica, que es mucho más rápido que agregar lo que sí.
   */
  const guardar = (e) => {
    e.preventDefault()
    if (!puede) return

    const tipoProp = PROPIEDADES.find((x) => x.id === propiedad)
    const rooms = (ARRANQUE_PROPIEDAD[propiedad] ?? []).map((id) => {
      const esp = ESPACIO_BY_ID[id]
      return { ...nuevoCuarto(esp.nombre, esp.m2), items: { ...esp.equipo } }
    })

    crear({
      nombre,
      cliente: { nombre: cliente, direccion, tel },
      obra: { propiedad, tipo: tipoProp?.label ?? 'Casa' },
      rooms,
    })

    /* Y su plano 3D, también de arranque.
       Va después de crear el proyecto porque `setPlano` escribe sobre el que
       está abierto, y `crear` es quien lo abre. Sin esto los espacios nacían
       con equipo pero con el plano en blanco, que es justo la mitad del
       trabajo que veníamos a quitar. */
    for (const [i, id] of (ARRANQUE_PROPIEDAD[propiedad] ?? []).entries()) {
      const esp = ESPACIO_BY_ID[id]
      const base = { ...planoVacio(esp.m2), tipoCuarto: esp.tipo }
      const { items, tramos, reglas } = disponerCuarto({ plano: base, tipo: esp.tipo, equipo: esp.equipo })
      setPlano(rooms[i].id, { ...base, items, tramos, reglas }, `Creó el espacio ${esp.nombre}`)
    }

    onListo()
  }

  return (
    <form onSubmit={guardar} className="rounded-xl border border-ember/30 bg-ink-2 p-4">
      <h2 className="text-[11px] tracking-[0.14em] text-cream-2 uppercase">Proyecto nuevo</h2>
      <p className="mt-1 text-[11.5px] text-cream-3">
        Con esto basta para empezar. Los datos fiscales se piden en el levantamiento.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-[0.12em] text-cream-3 uppercase">
            Nombre del proyecto *
          </span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Casa Fernández — Del Valle"
            className={inputCls}
            autoFocus
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-[0.12em] text-cream-3 uppercase">Contacto</span>
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="María Fernández"
            className={inputCls}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[10px] tracking-[0.12em] text-cream-3 uppercase">
            Dirección de la obra *
          </span>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Calle, número, colonia, alcaldía"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] tracking-[0.12em] text-cream-3 uppercase">
            Tipo de propiedad
          </span>
          <select value={propiedad} onChange={(e) => setPropiedad(e.target.value)} className={inputCls}>
            {PROPIEDADES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[10.5px] text-cream-3">
            Decide qué espacios se te van a sugerir. Arranca con{' '}
            {(ARRANQUE_PROPIEDAD[propiedad] ?? []).length} espacios ya puestos.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] tracking-[0.12em] text-cream-3 uppercase">WhatsApp</span>
          <input
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            placeholder="55 1234 5678"
            className={inputCls}
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={!puede}
          className="rounded-lg bg-ember px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-ember-2 disabled:opacity-40"
        >
          Crear y abrir levantamiento
        </button>
        <button
          type="button"
          onClick={onListo}
          className="rounded-lg border border-line px-4 py-2 text-[13px] text-cream-3 transition-colors hover:text-cream"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

/* ── renglón ──────────────────────────────────────────────────── */

function Fila({ proyecto, abierto, fechas }) {
  const abrir = useSurvey((s) => s.abrirProyecto)
  const archivar = useSurvey((s) => s.archivarProyecto)
  const eliminar = useSurvey((s) => s.eliminarProyecto)
  const duplicar = useSurvey((s) => s.duplicarProyecto)
  const setEstado = useSurvey((s) => s.setEstado)
  const tarifas = useSurvey((s) => s.tarifas)

  const q = useMemo(
    () =>
      quote({
        obra: proyecto.obra,
        rooms: proyecto.rooms,
        extras: proyecto.extras,
        compras: proyecto.compras,
        materiales: proyecto.materiales,
        tarifas,
      }),
    [proyecto, tarifas],
  )

  const entrar = () => {
    abrir(proyecto.id)
    window.location.hash = '#/admin/levantamiento'
  }

  return (
    <div
      className={`rounded-xl border transition-colors ${
        abierto ? 'border-ember/60 bg-ember/5' : 'border-line bg-ink-2 hover:border-cream/25'
      }`}
    >
      <div className="flex flex-wrap items-start gap-3 px-4 py-3">
        <button onClick={entrar} className="min-w-[12rem] flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-cream">{proyecto.nombre}</span>
            {abierto && (
              <span className="rounded-full border border-ember px-1.5 py-0.5 text-[9px] tracking-[0.1em] text-ember uppercase">
                Abierto
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[11.5px] text-cream-3">
            {proyecto.cliente.nombre || 'Sin contacto'}
            {proyecto.cliente.direccion ? ` · ${proyecto.cliente.direccion}` : ''}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-cream-3/80">
            <span>
              {proyecto.folio} · {proyecto.rooms.length} cuartos · {q.piezas} piezas
            </span>
            {fechas && (
              <span className="flex items-center gap-1">
                · último cambio {fecha(fechas.tocado)} por
                <Avatar usuario={fechas.tocadoPor} size={14} />
              </span>
            )}
          </div>
        </button>

        <div className="flex flex-col items-end gap-1.5">
          <span className="display text-[17px] text-ember">{money(q.total)}</span>
          <select
            value={proyecto.estado}
            onChange={(e) => setEstado(proyecto.id, e.target.value)}
            className={`rounded-full border px-2 py-0.5 text-[10.5px] outline-none ${ESTADO_TONO[proyecto.estado]}`}
          >
            {ESTADOS.map((e) => (
              <option key={e.id} value={e.id} className="bg-ink text-cream">
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-line px-4 py-2 text-[11px]">
        <button onClick={entrar} className="text-ember hover:underline">
          Abrir levantamiento
        </button>
        <button onClick={() => duplicar(proyecto.id)} className="text-cream-3 hover:text-cream">
          Duplicar
        </button>
        <button
          onClick={() => archivar(proyecto.id, !proyecto.archivado)}
          className="text-cream-3 hover:text-cream"
        >
          {proyecto.archivado ? 'Desarchivar' : 'Archivar'}
        </button>
        <button
          onClick={() =>
            confirm(`¿Eliminar "${proyecto.nombre}"? Se pierde el levantamiento completo.`) &&
            eliminar(proyecto.id)
          }
          className="ml-auto text-cream-3 hover:text-ember"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

/* ── panel ────────────────────────────────────────────────────── */

export default function Projects() {
  const proyectos = useSurvey((s) => s.proyectos)
  const eventos = useSurvey((s) => s.eventos)
  const activoId = useSurvey((s) => s.activoId)
  const [alta, setAlta] = useState(false)
  const [verArchivados, setVerArchivados] = useState(false)

  const fechas = useMemo(() => fechasPorProyecto(eventos), [eventos])

  // el filtro va en useMemo y no en el selector: un selector que devuelve un
  // arreglo nuevo en cada render hace que React se queje del snapshot
  const visibles = useMemo(
    () =>
      proyectos
        .filter((p) => !!p.archivado === verArchivados)
        .sort((a, b) => (fechas.get(b.id)?.tocado ?? '').localeCompare(fechas.get(a.id)?.tocado ?? '')),
    [proyectos, verArchivados, fechas],
  )

  const archivados = useMemo(() => proyectos.filter((p) => p.archivado).length, [proyectos])

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="display text-[24px] text-cream">Proyectos</h1>
          <p className="mt-0.5 text-[12px] text-cream-3">
            Cada casa es un proyecto. El levantamiento y la cotización viven dentro de él.
          </p>
        </div>
        {!alta && (
          <button
            onClick={() => setAlta(true)}
            className="ml-auto rounded-lg bg-ember px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-ember-2"
          >
            + Proyecto nuevo
          </button>
        )}
      </div>

      {alta && (
        <div className="mt-4">
          <Alta onListo={() => setAlta(false)} />
        </div>
      )}

      {archivados > 0 && (
        <div className="mt-4 flex gap-1.5">
          {[
            [false, `Activos ${proyectos.length - archivados}`],
            [true, `Archivados ${archivados}`],
          ].map(([v, label]) => (
            <button
              key={String(v)}
              onClick={() => setVerArchivados(v)}
              aria-pressed={verArchivados === v}
              className={`rounded-full border px-3 py-1 text-[11.5px] transition-colors ${
                verArchivados === v
                  ? 'border-ember bg-ember text-ink'
                  : 'border-line text-cream-3 hover:border-cream/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {visibles.map((p) => (
          <Fila key={p.id} proyecto={p} abierto={p.id === activoId} fechas={fechas.get(p.id)} />
        ))}
      </div>

      {visibles.length === 0 && !alta && (
        <div className="mt-6 rounded-xl border border-dashed border-line px-6 py-14 text-center">
          <p className="display text-[19px] text-cream">
            {verArchivados ? 'Nada archivado.' : 'Todavía no hay proyectos.'}
          </p>
          <p className="mx-auto mt-2 max-w-[46ch] text-[12.5px] leading-relaxed text-cream-3">
            {verArchivados
              ? 'Los proyectos que archives aparecen aquí sin estorbar en la lista de trabajo.'
              : 'El levantamiento se hace dentro de un proyecto: así queda con nombre, dirección y folio, y se puede retomar después.'}
          </p>
          {!verArchivados && (
            <button
              onClick={() => setAlta(true)}
              className="mt-5 rounded-lg bg-ember px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-ember-2"
            >
              Crear el primero
            </button>
          )}
        </div>
      )}
    </div>
  )
}
