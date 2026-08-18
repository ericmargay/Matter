import { useMemo, useState } from 'react'

import {
  FAMILIAS,
  POR_ID,
  fotoDe,
  glifoDe,
  leerInventario,
  migrar,
  esMascota,
  preguntaDueno,
  sinEspacio,
  unidadVacia,
} from '../content/inventario'
import Glifo from './Glifo'

/**
 * El anexador de dispositivos.
 *
 * Vive fuera de `ui/admin` a propósito: el mismo componente lo usamos nosotros
 * en el levantamiento y lo usa el cliente desde su enlace.
 *
 * Tres decisiones que ya se probaron y se corrigieron:
 *
 * — **Cada aparato enseña todo lo suyo, sin abrir nada.** Hubo una versión con
 *   los renglones cerrados para que la lista fuera corta, y el resultado fue
 *   una pantalla donde no se veía nada: para saber qué le faltaba a un aparato
 *   había que abrirlo uno por uno. La lista larga no era el problema.
 *
 * — **El problema era que TODO iba en una sola columna.** Se resuelve
 *   partiéndolo en secciones con su encabezado y poniéndolas en rejilla donde
 *   la pantalla da. Se sigue viendo todo y ya no es un rollo vertical.
 *
 * — **Se puede agrupar por tipo o por espacio.** Por tipo para revisar qué hay
 *   de cada cosa; por espacio para caminar la casa. Las dos pintan lo mismo,
 *   solo cambia cómo se reparte.
 *
 * Y la regla de siempre: **no escribir**. El único campo libre es el nombre de
 * quién —o de cuál mascota—, porque los nombres no se pueden listar.
 */

const fecha = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return (
    d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) +
    ', ' +
    d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  )
}

const Chip = ({ activo, children, ...props }) => (
  <button
    {...props}
    className={`rounded-full border px-2.5 py-1 text-[11.5px] whitespace-nowrap transition-colors ${
      activo ? 'border-ember bg-ember text-ink' : 'border-line text-cream-2 hover:border-cream/40'
    }`}
  >
    {children}
  </button>
)

const Mini = ({ activo, children, ...props }) => (
  <button
    {...props}
    className={`rounded border px-1.5 py-0.5 text-[10.5px] transition-colors ${
      activo ? 'border-ember bg-ember/15 text-ember' : 'border-line text-cream-3 hover:border-cream/35'
    }`}
  >
    {children}
  </button>
)

/** La foto del aparato, o su dibujo si no tenemos una que sea de verdad. */
function Retrato({ id, size = 52 }) {
  const foto = fotoDe(id)
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-ink text-cream-3"
      style={{ width: size, height: size }}
    >
      {foto ? (
        <img src={foto} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
      ) : (
        <Glifo tipo={glifoDe(id)} size={Math.round(size * 0.5)} />
      )}
    </span>
  )
}

/* ── la ficha de un aparato ───────────────────────────────────── */

function Unidad({ u, indice, total, espacios, nombres, onCambiar, onQuitar, onBorrarNombre }) {
  const [yendose, setYendose] = useState(false)
  const d = POR_ID[u.id]
  if (!d) return null

  const set = (parche) => onCambiar({ ...parche, modificado: new Date().toISOString() })
  const noVa = sinEspacio(u.id)
  const pregunta = preguntaDueno(u.id)

  const irse = () => {
    setYendose(true)
    setTimeout(onQuitar, 240)
  }

  return (
    <div className={`rounded-xl border border-line bg-ink-2 px-2.5 py-2.5 ${yendose ? 'se-va' : ''}`}>
      <div className="flex items-start gap-2.5">
        <Retrato id={u.id} />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] leading-tight text-cream">
            {d.label}
            {total > 1 && <span className="text-cream-3"> · {indice} de {total}</span>}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px]">
            {d.border && <span className="text-thread">Router de borde Thread</span>}
            {d.zigbee && <span className="text-thread">Puente Zigbee</span>}
            {d.matter && <span className="text-cream-3">Habla Matter</span>}
            {d.ojo === 'marca-blanca' && <span className="text-rose-400">No habla Matter</span>}
            {d.ojo === 'repetidor' && <span className="text-rose-400">Parte la red en dos</span>}
          </div>
        </div>
        <button onClick={irse} aria-label={`Quitar ${d.label}`} className="borrar shrink-0 text-[15px]">
          <span>×</span>
        </button>
      </div>

      {d.modelos && (
        <div className="mt-2">
          <span className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Cuál es</span>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {d.modelos.map((m) => (
              <Mini key={m} activo={u.modelo === m} onClick={() => set({ modelo: u.modelo === m ? '' : m })}>
                {m}
              </Mini>
            ))}
          </div>
        </div>
      )}

      {espacios.length > 0 && (
        <div className="mt-2">
          <span className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Dónde está</span>
          {noVa ? (
            <p className="mt-0.5 text-[10px] leading-snug text-cream-3">{noVa}</p>
          ) : (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {espacios.map((e) => (
                <Mini key={e} activo={u.espacio === e} onClick={() => set({ espacio: u.espacio === e ? '' : e })}>
                  {e}
                </Mini>
              ))}
            </div>
          )}
        </div>
      )}

      {pregunta && (
        <div className="mt-2">
          <span className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">{pregunta}</span>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {nombres.map((n) => (
              <span key={n} className="inline-flex items-center">
                <Mini activo={u.quien === n} onClick={() => set({ quien: u.quien === n ? '' : n })}>
                  {n}
                </Mini>
                <button
                  onClick={() => onBorrarNombre(n)}
                  aria-label={`Borrar el nombre ${n}`}
                  className="-ml-0.5 px-1 text-[11px] text-cream-3 transition-colors hover:text-rose-400"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={u.quien ?? ''}
              onChange={(e) => set({ quien: e.target.value })}
              placeholder="nombre"
              className="w-24 rounded border border-line bg-ink px-1.5 py-0.5 text-[10.5px] text-cream placeholder:text-cream-3"
            />
          </div>
        </div>
      )}

      {(d.puede || d.noPuede) && (
        <div className="mt-2 space-y-0.5 text-[10px] leading-snug">
          {d.puede && <p className="text-thread-2">Sí puede · {d.puede}</p>}
          {d.noPuede && <p className="text-cream-3">No puede · {d.noPuede}</p>}
        </div>
      )}

      {u.nota && <p className="mt-1.5 text-[10.5px] text-cream-3">{u.nota}</p>}

      <p className="mt-1.5 flex flex-wrap gap-x-2 text-[9.5px]">
        {u.modificado ? (
          <>
            <span className="text-emerald-400">modificado {fecha(u.modificado)}</span>
            <span className="text-rose-400/80 line-through">antes {fecha(u.creado)}</span>
          </>
        ) : (
          <span className="text-cream-3">anexado {fecha(u.creado)}</span>
        )}
      </p>
    </div>
  )
}

/* ── el anexador ──────────────────────────────────────────────── */

export default function Inventario({ inv = [], onCambiar, espacios = [], modo = 'ops' }) {
  const unidades = useMemo(() => migrar(inv), [inv])
  const [agrupar, setAgrupar] = useState('tipo')
  const [paleta, setPaleta] = useState(FAMILIAS[0].id)

  const analisis = useMemo(() => (modo === 'ops' ? leerInventario(unidades) : []), [unidades, modo])

  /* Los nombres se ofrecen por separado: en un teléfono no tiene caso sugerir
     "Chipotle", y en el alimentador del perro no tiene caso sugerir "Gaby".
     Con una sola lista salían los cuatro en todos lados y había que leerlos
     para descartar. */
  const nombres = useMemo(() => {
    const de = (filtro) => [...new Set(unidades.filter(filtro).map((u) => u.quien).filter(Boolean))].slice(0, 6)
    return { persona: de((u) => !esMascota(u.id)), mascota: de((u) => esMascota(u.id)) }
  }, [unidades])

  const agregar = (id) => onCambiar([...unidades, unidadVacia(id)])
  const cambiar = (uid, parche) => onCambiar(unidades.map((u) => (u.uid === uid ? { ...u, ...parche } : u)))
  const quitar = (uid) => onCambiar(unidades.filter((u) => u.uid !== uid))

  const borrarNombre = (n) => {
    const cuantos = unidades.filter((u) => u.quien === n).length
    if (cuantos > 1 && !confirm(`"${n}" está en ${cuantos} aparatos. ¿Quitarlo de todos?`)) return
    onCambiar(unidades.map((u) => (u.quien === n ? { ...u, quien: '', modificado: new Date().toISOString() } : u)))
  }

  const ficha = (u) => {
    const delTipo = unidades.filter((x) => x.id === u.id)
    return (
      <Unidad
        key={u.uid}
        u={u}
        indice={delTipo.indexOf(u) + 1}
        total={delTipo.length}
        espacios={espacios}
        nombres={esMascota(u.id) ? nombres.mascota : nombres.persona}
        onCambiar={(parche) => cambiar(u.uid, parche)}
        onQuitar={() => quitar(u.uid)}
        onBorrarNombre={borrarNombre}
      />
    )
  }

  /* Las secciones. Por tipo salen las familias que tengan algo; por espacio,
     los cuartos del proyecto más las dos cajas que no son cuartos. */
  const secciones =
    agrupar === 'tipo'
      ? FAMILIAS.map((f) => ({
          id: f.id,
          titulo: f.label,
          unidades: unidades.filter((u) => POR_ID[u.id]?.familia === f.id),
        })).filter((s) => s.unidades.length)
      : [
          ...espacios.map((e) => ({ id: e, titulo: e, unidades: unidades.filter((u) => u.espacio === e) })),
          { id: '__contigo', titulo: 'Anda contigo', unidades: unidades.filter((u) => sinEspacio(u.id)) },
          {
            id: '__sueltos',
            titulo: 'Sin espacio todavía',
            unidades: unidades.filter((u) => !sinEspacio(u.id) && !u.espacio),
          },
        ].filter((s) => s.unidades.length)

  const familia = FAMILIAS.find((f) => f.id === paleta)

  return (
    <div>
      {/* ── agregar ── */}
      <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Agregar lo que haya</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {FAMILIAS.map((f) => (
          <Chip key={f.id} activo={paleta === f.id} onClick={() => setPaleta(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {familia && (
        <>
          <p className="mt-2 text-[11px] leading-relaxed text-cream-3">{familia.ayuda}</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {familia.items.map((d) => (
              <button
                key={d.id}
                onClick={() => agregar(d.id)}
                className="flex items-center gap-2 rounded-xl border border-line bg-ink-2 px-2 py-2 text-left transition-colors hover:border-ember"
              >
                <Retrato id={d.id} size={34} />
                <span className="min-w-0 flex-1 text-[11.5px] leading-tight text-cream-2">{d.label}</span>
                <span className="shrink-0 text-[13px] text-cream-3">+</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── lo anexado, en secciones ── */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">
          Lo que ya hay · {unidades.length}
        </p>
        <div className="ml-auto flex gap-1.5">
          <Chip activo={agrupar === 'tipo'} onClick={() => setAgrupar('tipo')}>
            Por tipo
          </Chip>
          <Chip activo={agrupar === 'espacio'} onClick={() => setAgrupar('espacio')}>
            Por espacio
          </Chip>
        </div>
      </div>

      {unidades.length === 0 ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-cream-3">
          Todavía nada. Toca arriba lo que ya haya en la casa — no importa si no sabes el modelo.
        </p>
      ) : (
        <div className="mt-3 space-y-5">
          {secciones.map((s) => (
            <section key={s.id}>
              <div className="flex items-baseline gap-2">
                <h3 className="text-[13px] text-cream">{s.titulo}</h3>
                <span className="text-[11px] text-cream-3">{s.unidades.length}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              {/* rejilla donde la pantalla da: en teléfono una columna, en
                  escritorio dos, para que no sea un rollo vertical */}
              <div className="mt-2 grid gap-1.5 lg:grid-cols-2">{s.unidades.map(ficha)}</div>
            </section>
          ))}
        </div>
      )}

      {analisis.length > 0 && (
        <div className="mt-5 space-y-1.5 border-t border-line pt-4">
          <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Qué significa · {analisis.length}</p>
          {analisis.map((x) => (
            <div
              key={x.titulo}
              className={`rounded-lg border px-2.5 py-2 ${
                x.nivel === 'falta'
                  ? 'border-rose-500/35 bg-rose-500/[0.06]'
                  : x.nivel === 'aprovecha'
                    ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
                    : 'border-ember/30 bg-ember/[0.05]'
              }`}
            >
              <p className="text-[11.5px] text-cream">{x.titulo}</p>
              <p className="mt-0.5 text-[10.5px] leading-snug text-cream-3">{x.porque}</p>
              <p className="mt-0.5 text-[10.5px] leading-snug text-cream-2">{x.accion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
