import { useMemo, useState } from 'react'

import {
  FAMILIAS,
  POR_ID,
  fotoDe,
  glifoDe,
  leerInventario,
  migrar,
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
 * Dos decisiones de diseño que vale la pena defender:
 *
 * — **Se puede recorrer por espacio, y ese es el modo que importa.** La
 *   versión anterior solo agrupaba por tipo de aparato, y así no es como
 *   alguien llena esto: lo llena caminando su casa. Entra a la cocina, mira
 *   alrededor, anota. Preguntarle "¿cuántas bocinas tienes en total?" lo
 *   obliga a recorrer la casa de memoria, que es justo lo que se equivoca.
 *
 * — **Cada renglón viene cerrado.** Antes todo estaba abierto y doce aparatos
 *   eran una pantalla de tres metros donde nada se encontraba. Ahora se abre
 *   el que se va a tocar. Lo que se ve cerrado es lo que se necesita para
 *   reconocerlo: la foto, el nombre, el modelo y de quién es.
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

/* ── piezas chicas ────────────────────────────────────────────── */

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
function Retrato({ id, size = 44 }) {
  const foto = fotoDe(id)
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-ink text-cream-3"
      style={{ width: size, height: size }}
    >
      {foto ? (
        <img src={foto} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
      ) : (
        <Glifo tipo={glifoDe(id)} size={Math.round(size * 0.52)} />
      )}
    </span>
  )
}

/* ── una unidad ───────────────────────────────────────────────── */

function Unidad({ u, indice, total, espacios, nombres, onCambiar, onQuitar, onBorrarNombre }) {
  const [abierta, setAbierta] = useState(false)
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

  /* Lo que se lee sin abrir: modelo, dueño y dónde está. Es lo que hace falta
     para saber si este renglón es el que se venía a corregir. */
  const resumen = [u.modelo, u.quien, !noVa && u.espacio].filter(Boolean).join(' · ')

  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-ink-2 ${yendose ? 'se-va' : ''}`}>
      <div className="flex items-center gap-2.5 px-2.5 py-2">
        <Retrato id={u.id} />

        <button onClick={() => setAbierta((v) => !v)} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[12.5px] text-cream">
            {d.label}
            {total > 1 && <span className="text-cream-3"> · {indice} de {total}</span>}
          </span>
          <span className="block truncate text-[10.5px] text-cream-3">
            {resumen || 'toca para completar'}
          </span>
        </button>

        <button
          onClick={() => setAbierta((v) => !v)}
          aria-label={abierta ? 'Cerrar' : 'Abrir'}
          className="shrink-0 px-1 text-[13px] text-cream-3 transition-colors hover:text-cream"
        >
          {abierta ? '−' : '+'}
        </button>
        <button onClick={irse} aria-label={`Quitar ${d.label}`} className="borrar shrink-0 text-[15px]">
          <span>×</span>
        </button>
      </div>

      {abierta && (
        <div className="border-t border-line px-2.5 py-2">
          {d.modelos && (
            <div>
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

          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px]">
            {d.border && <span className="text-thread">Router de borde Thread</span>}
            {d.zigbee && <span className="text-thread">Puente Zigbee</span>}
            {d.matter && <span className="text-cream-3">Habla Matter</span>}
            {d.ojo === 'marca-blanca' && <span className="text-rose-400">No habla Matter</span>}
            {d.ojo === 'repetidor' && <span className="text-rose-400">Parte la red en dos</span>}
          </div>

          {u.nota && <p className="mt-1 text-[10.5px] text-cream-3">{u.nota}</p>}

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
      )}
    </div>
  )
}

/* ── el paletero ──────────────────────────────────────────────── */

function Paletero({ familia, onAgregar }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {familia.items.map((d) => (
        <button
          key={d.id}
          onClick={() => onAgregar(d.id)}
          className="flex items-center gap-2 rounded-xl border border-line bg-ink-2 px-2 py-2 text-left transition-colors hover:border-ember"
        >
          <Retrato id={d.id} size={34} />
          <span className="min-w-0 flex-1 text-[11.5px] leading-tight text-cream-2">{d.label}</span>
          <span className="shrink-0 text-[13px] text-cream-3">+</span>
        </button>
      ))}
    </div>
  )
}

/* ── el anexador ──────────────────────────────────────────────── */

export default function Inventario({ inv = [], onCambiar, espacios = [], modo = 'ops' }) {
  const unidades = useMemo(() => migrar(inv), [inv])
  const [vista, setVista] = useState('espacio')
  const [foco, setFoco] = useState(null) // espacio o familia abierta

  const analisis = useMemo(() => (modo === 'ops' ? leerInventario(unidades) : []), [unidades, modo])

  const nombres = useMemo(
    () => [...new Set(unidades.map((u) => u.quien).filter(Boolean))].slice(0, 6),
    [unidades],
  )

  const agregar = (id, espacio) => onCambiar([...unidades, { ...unidadVacia(id), espacio: espacio ?? '' }])
  const cambiar = (uid, parche) => onCambiar(unidades.map((u) => (u.uid === uid ? { ...u, ...parche } : u)))
  const quitar = (uid) => onCambiar(unidades.filter((u) => u.uid !== uid))

  const borrarNombre = (n) => {
    const cuantos = unidades.filter((u) => u.quien === n).length
    if (cuantos > 1 && !confirm(`"${n}" está en ${cuantos} aparatos. ¿Quitarlo de todos?`)) return
    onCambiar(unidades.map((u) => (u.quien === n ? { ...u, quien: '', modificado: new Date().toISOString() } : u)))
  }

  const pinta = (lista) =>
    lista.map((u) => {
      const delTipo = unidades.filter((x) => x.id === u.id)
      return (
        <Unidad
          key={u.uid}
          u={u}
          indice={delTipo.indexOf(u) + 1}
          total={delTipo.length}
          espacios={espacios}
          nombres={nombres}
          onCambiar={(parche) => cambiar(u.uid, parche)}
          onQuitar={() => quitar(u.uid)}
          onBorrarNombre={borrarNombre}
        />
      )
    })

  /* ── por espacio: se camina la casa ── */
  const conmigo = unidades.filter((u) => sinEspacio(u.id))
  const sueltos = unidades.filter((u) => !sinEspacio(u.id) && !u.espacio)
  const porEspacio = espacios.map((e) => ({ nombre: e, unidades: unidades.filter((u) => u.espacio === e) }))

  return (
    <div>
      {/* Dos maneras de mirarlo. "Por espacio" viene primero porque es como se
          llena de verdad: caminando la casa, no recordándola. */}
      <div className="flex gap-1.5">
        <Chip activo={vista === 'espacio'} onClick={() => { setVista('espacio'); setFoco(null) }}>
          Por espacio
        </Chip>
        <Chip activo={vista === 'tipo'} onClick={() => { setVista('tipo'); setFoco(null) }}>
          Por tipo
        </Chip>
        <span className="ml-auto self-center text-[11px] text-cream-3">
          {unidades.length} {unidades.length === 1 ? 'aparato' : 'aparatos'}
        </span>
      </div>

      {vista === 'tipo' ? (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5">
            {FAMILIAS.map((f) => {
              const n = unidades.filter((u) => POR_ID[u.id]?.familia === f.id).length
              return (
                <Chip key={f.id} activo={foco === f.id} onClick={() => setFoco(foco === f.id ? null : f.id)}>
                  {f.label}
                  {n > 0 && <span className={foco === f.id ? 'text-ink/60' : 'text-ember'}> · {n}</span>}
                </Chip>
              )
            })}
          </div>

          {FAMILIAS.filter((f) => foco === f.id).map((f) => (
            <div key={f.id}>
              <p className="mt-2.5 text-[11px] leading-relaxed text-cream-3">{f.ayuda}</p>
              <Paletero familia={f} onAgregar={(id) => agregar(id)} />
            </div>
          ))}

          <div className="mt-4 space-y-1.5">
            {pinta(foco ? unidades.filter((u) => POR_ID[u.id]?.familia === foco) : unidades)}
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          {espacios.length === 0 && (
            <p className="text-[11.5px] leading-relaxed text-cream-3">
              Todavía no hay espacios definidos en el proyecto. Usa “Por tipo” mientras tanto.
            </p>
          )}

          {porEspacio.map((e) => {
            const on = foco === e.nombre
            return (
              <div key={e.nombre} className="overflow-hidden rounded-xl border border-line">
                <button
                  onClick={() => setFoco(on ? null : e.nombre)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-cream/[0.04]"
                >
                  <span className="text-[13px] text-cream">{e.nombre}</span>
                  <span className="shrink-0 text-[11px] text-cream-3">
                    {e.unidades.length > 0 ? `${e.unidades.length} aquí` : 'nada todavía'} {on ? '−' : '+'}
                  </span>
                </button>

                {on && (
                  <div className="border-t border-line px-2.5 py-2.5">
                    <div className="space-y-1.5">{pinta(e.unidades)}</div>

                    <p className="mt-3 text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">
                      Agregar aquí
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {FAMILIAS.map((f) => (
                        <Mini key={f.id} activo={foco === `${e.nombre}|${f.id}`} onClick={() => setFoco(`${e.nombre}|${f.id}`)}>
                          {f.label}
                        </Mini>
                      ))}
                    </div>
                  </div>
                )}

                {/* el paletero de una familia, ya dentro de este espacio: lo
                    que se agregue nace ubicado y no hay que volver a decirlo */}
                {typeof foco === 'string' && foco.startsWith(`${e.nombre}|`) && (
                  <div className="border-t border-line px-2.5 py-2.5">
                    <button onClick={() => setFoco(e.nombre)} className="text-[11px] text-cream-3 hover:text-ember">
                      ← volver a {e.nombre}
                    </button>
                    <Paletero
                      familia={FAMILIAS.find((f) => f.id === foco.split('|')[1])}
                      onAgregar={(id) => {
                        agregar(id, sinEspacio(id) ? '' : e.nombre)
                        setFoco(e.nombre)
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {conmigo.length > 0 && (
            <div className="rounded-xl border border-line">
              <div className="px-3 py-2.5">
                <p className="text-[13px] text-cream">Anda contigo</p>
                <p className="text-[10.5px] text-cream-3">
                  Teléfonos y relojes: no viven en un cuarto, se levantan aparte.
                </p>
              </div>
              <div className="space-y-1.5 border-t border-line px-2.5 py-2.5">{pinta(conmigo)}</div>
            </div>
          )}

          {sueltos.length > 0 && (
            <div className="rounded-xl border border-ember/40">
              <div className="px-3 py-2.5">
                <p className="text-[13px] text-ember">Falta decir dónde están · {sueltos.length}</p>
                <p className="text-[10.5px] text-cream-3">
                  Ábrelos y toca el espacio. Sin eso no sabemos a qué cuarto van.
                </p>
              </div>
              <div className="space-y-1.5 border-t border-line px-2.5 py-2.5">{pinta(sueltos)}</div>
            </div>
          )}

          {unidades.length === 0 && espacios.length > 0 && (
            <p className="pt-2 text-[11.5px] leading-relaxed text-cream-3">
              Abre el primer espacio y anota lo que veas. No importa si no sabes los modelos.
            </p>
          )}
        </div>
      )}

      {analisis.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-line pt-3">
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
