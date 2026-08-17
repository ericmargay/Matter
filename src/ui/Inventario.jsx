import { useMemo, useState } from 'react'

import {
  FAMILIAS,
  POR_ID,
  esPersonal,
  leerInventario,
  migrar,
  unidadVacia,
} from '../content/inventario'

/**
 * El anexador de dispositivos.
 *
 * Vive fuera de `ui/admin` a propósito: el mismo componente lo usamos nosotros
 * en el levantamiento y lo usa el cliente desde su enlace. Si fueran dos, el
 * día que agreguemos una familia se nos olvidaría una de las dos.
 *
 * La regla de diseño es una sola: **no escribir**. Alguien contestando esto
 * desde el teléfono, parado en su sala, no va a teclear "Echo Dot 5ª
 * generación". Toca el aparato, toca el chip de la generación y sigue. El
 * único campo libre es de quién es el teléfono, porque los nombres no se
 * pueden listar — y aun ahí, el segundo teléfono ya sugiere los nombres que
 * se escribieron antes.
 *
 * Cada aparato es una unidad, no una cuenta. Dos Echo Dot en la misma casa
 * casi nunca son de la misma generación, y la generación es justo lo que
 * decide si ese aparato trae Zigbee.
 */

const fecha = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const Chip = ({ activo, children, ...props }) => (
  <button
    {...props}
    className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
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

/** Una unidad: este aparato en concreto, no "los Echo Dot". */
function Unidad({ u, indice, total, espacios, nombres, onCambiar, onQuitar }) {
  const [yendose, setYendose] = useState(false)
  const d = POR_ID[u.id]
  if (!d) return null

  /* Se pinta la salida y se borra al terminar. Sin esto, la lista da un
     brinco y uno se queda con la duda de qué renglón se fue. */
  const irse = () => {
    setYendose(true)
    setTimeout(onQuitar, 240)
  }

  const set = (parche) => onCambiar({ ...parche, modificado: new Date().toISOString() })

  return (
    <div className={`rounded-lg border border-line px-2.5 py-2 ${yendose ? 'se-va' : ''}`}>
      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1 text-[12.5px] text-cream">
          {d.label}
          {/* el número solo aparece cuando hay más de uno: con uno solo,
              "Echo Dot 1 de 1" es ruido */}
          {total > 1 && <span className="text-cream-3"> · {indice} de {total}</span>}
        </span>
        <button onClick={irse} aria-label={`Quitar ${d.label}`} className="borrar shrink-0 text-[15px]">
          <span>×</span>
        </button>
      </div>

      {d.modelos && (
        <div className="mt-1.5">
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
        <div className="mt-1.5">
          <span className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Dónde está</span>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {espacios.map((e) => (
              <Mini key={e} activo={u.espacio === e} onClick={() => set({ espacio: u.espacio === e ? '' : e })}>
                {e}
              </Mini>
            ))}
          </div>
        </div>
      )}

      {/* De quién es, solo en lo personal: preguntar de quién es el módem no
          tiene sentido, preguntar de quién es el iPhone es la mitad del dato */}
      {esPersonal(u.id) && (
        <div className="mt-1.5">
          <span className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">De quién es</span>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {nombres.map((n) => (
              <Mini key={n} activo={u.quien === n} onClick={() => set({ quien: u.quien === n ? '' : n })}>
                {n}
              </Mini>
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
        <div className="mt-1.5 space-y-0.5 text-[10px] leading-snug">
          {d.puede && <p className="text-thread-2">Sí puede · {d.puede}</p>}
          {d.noPuede && <p className="text-cream-3">No puede · {d.noPuede}</p>}
        </div>
      )}

      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px]">
        {d.border && <span className="text-thread">Router de borde Thread</span>}
        {d.zigbee && <span className="text-thread">Puente Zigbee</span>}
        {d.matter && <span className="text-cream-3">Habla Matter</span>}
        {d.ojo === 'marca-blanca' && <span className="text-rose-400">No habla Matter</span>}
        {d.ojo === 'repetidor' && <span className="text-rose-400">Parte la red en dos</span>}
      </div>

      {u.nota && <p className="mt-1 text-[10.5px] text-cream-3">{u.nota}</p>}

      {/* Anexado y modificado. El verde es lo último que se supo; el rosa es
          lo que decía antes. Este inventario lo llenan dos manos —nosotros en
          el levantamiento y el cliente desde su enlace— y sin las dos fechas
          no se sabe cuál de las dos versiones estás leyendo. */}
      <p className="mt-1 flex flex-wrap gap-x-2 text-[9.5px]">
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

/**
 * @param inv        lista de unidades
 * @param onCambiar  recibe la lista nueva completa
 * @param espacios   nombres de los espacios del proyecto, para ubicar cada cosa
 * @param modo       'ops' muestra el análisis; 'cliente' lo oculta —al cliente
 *                   no se le enseña el diagnóstico, se platica en la junta
 */
export default function Inventario({ inv = [], onCambiar, espacios = [], modo = 'ops' }) {
  const unidades = useMemo(() => migrar(inv), [inv])
  const [filtro, setFiltro] = useState('todos')

  const analisis = useMemo(() => (modo === 'ops' ? leerInventario(unidades) : []), [unidades, modo])

  /* Los nombres que ya se escribieron se ofrecen como chip: el primer teléfono
     se teclea, del segundo en adelante se toca. */
  const nombres = useMemo(
    () => [...new Set(unidades.map((u) => u.quien).filter(Boolean))].slice(0, 6),
    [unidades],
  )

  const visibles = filtro === 'todos' ? unidades : unidades.filter((u) => POR_ID[u.id]?.familia === filtro)

  const agregar = (id) => onCambiar([...unidades, unidadVacia(id)])
  const cambiar = (uid, parche) => onCambiar(unidades.map((u) => (u.uid === uid ? { ...u, ...parche } : u)))
  const quitar = (uid) => onCambiar(unidades.filter((u) => u.uid !== uid))

  const familiaAbierta = FAMILIAS.find((f) => f.id === filtro)

  return (
    <div>
      {/* "Todos" primero: es el estado por defecto y el que se usa para revisar
          lo capturado. Las familias filtran Y abren su paletero. */}
      <div className="flex flex-wrap gap-1.5">
        <Chip activo={filtro === 'todos'} onClick={() => setFiltro('todos')}>
          Todos
          {unidades.length > 0 && (
            <span className={filtro === 'todos' ? 'text-ink/60' : 'text-ember'}> · {unidades.length}</span>
          )}
        </Chip>
        {FAMILIAS.map((f) => {
          const n = unidades.filter((u) => POR_ID[u.id]?.familia === f.id).length
          return (
            <Chip key={f.id} activo={filtro === f.id} onClick={() => setFiltro(f.id)}>
              {f.label}
              {n > 0 && <span className={filtro === f.id ? 'text-ink/60' : 'text-ember'}> · {n}</span>}
            </Chip>
          )
        })}
      </div>

      {familiaAbierta ? (
        <>
          <p className="mt-2.5 text-[11px] leading-relaxed text-cream-3">{familiaAbierta.ayuda}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {familiaAbierta.items.map((d) => (
              <button
                key={d.id}
                onClick={() => agregar(d.id)}
                className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] text-cream-2 transition-colors hover:border-ember hover:text-ember"
              >
                + {d.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-2.5 text-[11px] leading-relaxed text-cream-3">
          Toca una categoría para anexar. Aquí abajo está todo lo que ya lleva la casa.
        </p>
      )}

      <div className="mt-4">
        <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">
          {filtro === 'todos' ? 'Todo lo anexado' : familiaAbierta?.label} · {visibles.length}
        </p>

        {visibles.length === 0 ? (
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-cream-3">
            {unidades.length === 0
              ? 'Todavía nada. Toca arriba lo que ya haya en la casa — no importa si no sabes el modelo.'
              : 'Nada de esta categoría todavía.'}
          </p>
        ) : (
          <div className="mt-1.5 space-y-1.5">
            {visibles.map((u) => {
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
                />
              )
            })}
          </div>
        )}
      </div>

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
