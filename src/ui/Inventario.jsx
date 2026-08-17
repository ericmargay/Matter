import { useMemo, useState } from 'react'

import { FAMILIAS, POR_ID, leerInventario, lineaVacia, totalPiezas } from '../content/inventario'

/**
 * El anexador de dispositivos.
 *
 * Vive fuera de `ui/admin` a propósito: el mismo componente lo usamos nosotros
 * en el levantamiento y lo usa el cliente desde su enlace. Si fueran dos, el
 * día que agreguemos una familia se nos olvidaría una de las dos.
 *
 * La regla de diseño es una sola: **no escribir**. Alguien contestando esto
 * desde el teléfono, parado en su sala, no va a teclear "Echo Dot 5ª
 * generación". Va a tocar "Amazon Echo Dot", tocar "+" dos veces y seguir.
 * El modelo se escoge de una lista y siempre incluye "No sé cuál", porque la
 * mitad de la gente no sabe y obligar a inventar es peor que no preguntar: un
 * dato inventado se levanta como cierto y después se compra sobre él.
 */

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

/** Una línea anexada: cuánto hay y de qué modelo. */
function Linea({ linea, onCambiar, onQuitar }) {
  const d = POR_ID[linea.id]
  if (!d) return null

  return (
    <div className="rounded-lg border border-line px-2.5 py-2">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-cream">{d.label}</span>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => (linea.cant <= 1 ? onQuitar() : onCambiar({ cant: linea.cant - 1 }))}
            aria-label={`Menos ${d.label}`}
            className="h-7 w-7 rounded border border-line text-cream-2 transition-colors hover:border-cream/40"
          >
            −
          </button>
          <span className="w-6 text-center text-[13px] tabular-nums text-ember">{linea.cant}</span>
          <button
            onClick={() => onCambiar({ cant: linea.cant + 1 })}
            aria-label={`Más ${d.label}`}
            className="h-7 w-7 rounded border border-line text-cream-2 transition-colors hover:border-ember hover:bg-ember hover:text-ink"
          >
            +
          </button>
        </div>
      </div>

      {/* El modelo se escoge, no se escribe. "No sé cuál" es una respuesta
          válida y va incluida en todas las listas. */}
      {d.modelos && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {d.modelos.map((m) => (
            <button
              key={m}
              onClick={() => onCambiar({ modelo: linea.modelo === m ? '' : m })}
              className={`rounded border px-1.5 py-0.5 text-[10.5px] transition-colors ${
                linea.modelo === m
                  ? 'border-ember bg-ember/15 text-ember'
                  : 'border-line text-cream-3 hover:border-cream/35'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {(d.border || d.zigbee || d.matter || d.ojo) && (
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
          {d.border && <span className="text-thread">Router de borde Thread</span>}
          {d.zigbee && <span className="text-ember-2">Puente Zigbee</span>}
          {d.matter && <span className="text-cream-3">Habla Matter</span>}
          {d.ojo === 'marca-blanca' && <span className="text-red-400">No habla Matter</span>}
          {d.ojo === 'repetidor' && <span className="text-red-400">Parte la red en dos</span>}
        </div>
      )}
    </div>
  )
}

/**
 * @param inv        lista de líneas
 * @param onCambiar  recibe la lista nueva completa
 * @param modo       'ops' muestra el análisis; 'cliente' lo oculta —al cliente
 *                   no se le enseña el diagnóstico, se le enseña en la junta
 */
export default function Inventario({ inv = [], onCambiar, modo = 'ops' }) {
  const [abierta, setAbierta] = useState(FAMILIAS[0].id)

  const analisis = useMemo(() => (modo === 'ops' ? leerInventario(inv) : []), [inv, modo])
  const total = totalPiezas(inv)

  const agregar = (id) => {
    const ya = inv.findIndex((l) => l.id === id)
    // segundo toque sobre lo mismo: sube la cuenta en vez de duplicar la línea
    if (ya >= 0) return onCambiar(inv.map((l, i) => (i === ya ? { ...l, cant: l.cant + 1 } : l)))
    onCambiar([...inv, lineaVacia(id)])
  }

  const cambiar = (i, parche) => onCambiar(inv.map((l, n) => (n === i ? { ...l, ...parche } : l)))
  const quitar = (i) => onCambiar(inv.filter((_, n) => n !== i))

  const familia = FAMILIAS.find((f) => f.id === abierta)

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {FAMILIAS.map((f) => {
          const n = inv.filter((l) => POR_ID[l.id]?.familia === f.id).reduce((a, l) => a + l.cant, 0)
          return (
            <Chip key={f.id} activo={abierta === f.id} onClick={() => setAbierta(f.id)}>
              {f.label}
              {n > 0 && <span className={abierta === f.id ? 'text-ink/60' : 'text-ember'}> · {n}</span>}
            </Chip>
          )
        })}
      </div>

      {familia && (
        <>
          <p className="mt-2.5 text-[11px] leading-relaxed text-cream-3">{familia.ayuda}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {familia.items.map((d) => (
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
      )}

      <div className="mt-4">
        <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">
          Anexado · {total} {total === 1 ? 'aparato' : 'aparatos'}
        </p>

        {inv.length === 0 ? (
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-cream-3">
            Todavía nada. Toca arriba lo que ya haya en la casa — no importa si no sabes el modelo.
          </p>
        ) : (
          <div className="mt-1.5 space-y-1.5">
            {inv.map((l, i) => (
              <Linea
                key={`${l.id}-${i}`}
                linea={l}
                onCambiar={(parche) => cambiar(i, parche)}
                onQuitar={() => quitar(i)}
              />
            ))}
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
                  ? 'border-red-500/35 bg-red-500/[0.06]'
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
