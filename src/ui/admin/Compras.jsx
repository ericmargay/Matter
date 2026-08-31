import { useProyecto, useSurvey } from '../../store/survey'
import { CATEGORIES, DEVICE_BY_ID } from '../../content/catalog'
import { unitPrice } from '../../content/pricing'
import DevicePhoto, { PhotoFrame } from '../catalog/DevicePhoto'

/**
 * Compras: lo que la plataforma escogió para TODO el proyecto, junto.
 *
 * La cotización ya arma esta lista para calcular un total; esto es la misma
 * cuenta pero para lo otro que hace falta antes de instalar — decidir dónde
 * se compra cada cosa. Por eso vive aparte y no adentro de un cuarto: el
 * mismo foco en tres recámaras se compra una sola vez, junto, no tres veces
 * por separado.
 *
 * Precio y URL son del PROYECTO, no del catálogo: el catálogo es de todos
 * los clientes, y lo que aquí se corrige —"lo compramos en tal tienda a tal
 * precio"— es de esta casa. `editarCompra` guarda cada aparato por su cuenta,
 * así que dos productos no se pisan entre sí.
 */
export default function Compras() {
  const proyecto = useProyecto()
  const editarCompra = useSurvey((s) => s.editarCompra)

  if (!proyecto) return null

  /* Un aparato puede estar en varios cuartos; aquí se junta en una sola
     fila con cuántas piezas van y en dónde, que es como se compra de
     verdad —un solo pedido, no uno por cuarto. */
  const porDevice = new Map()
  for (const room of proyecto.rooms ?? []) {
    for (const [id, qty] of Object.entries(room.items ?? {})) {
      if (qty <= 0) continue
      const actual = porDevice.get(id) ?? { qty: 0, cuartos: [] }
      actual.qty += qty
      actual.cuartos.push({ nombre: room.nombre, qty })
      porDevice.set(id, actual)
    }
  }

  const filas = [...porDevice.entries()]
    .map(([id, info]) => ({ id, dev: DEVICE_BY_ID[id], ...info }))
    .filter((f) => f.dev)
    .sort((a, b) => a.dev.name.localeCompare(b.dev.name, 'es'))

  const overrides = proyecto.compras?.productos ?? {}
  const totalGeneral = filas.reduce((a, f) => a + (overrides[f.id]?.precio ?? unitPrice(f.dev)) * f.qty, 0)

  return (
    <div className="mx-auto max-w-[1100px]">
      <p className="eyebrow">Compras</p>
      <h1 className="display text-[24px] text-cream">{proyecto.nombre}</h1>
      <p className="mx-auto mt-1 max-w-[62ch] text-[13px] leading-relaxed text-cream-3">
        Lo que la plataforma escogió para los {proyecto.rooms?.length ?? 0} espacios de este proyecto, con foto,
        precio y enlace de compra editables. Lo que se corrija aquí es de este proyecto, no del catálogo general.
      </p>

      {filas.length === 0 ? (
        <p className="mt-10 text-center text-[13px] text-cream-3">Todavía no hay equipo levantado en ningún espacio.</p>
      ) : (
        <>
          <div className="mt-6 flex items-baseline justify-between border-b border-line pb-3">
            <span className="text-[11px] tracking-[0.12em] text-cream-3 uppercase">
              {filas.length} producto{filas.length === 1 ? '' : 's'} · {filas.reduce((a, f) => a + f.qty, 0)} piezas
            </span>
            <span className="text-[15px] text-cream">
              <strong className="text-ember">${Math.round(totalGeneral).toLocaleString('es-MX')}</strong> equipo
            </span>
          </div>

          <div className="mt-4 space-y-2.5 pb-10">
            {filas.map((f) => {
              const over = overrides[f.id] ?? {}
              const precio = over.precio ?? unitPrice(f.dev)
              const cat = CATEGORIES.find((c) => c.id === f.dev.cat)
              return (
                <div key={f.id} className="flex gap-3 rounded-xl border border-line bg-ink p-3">
                  <PhotoFrame className="h-20 w-20 flex-none rounded-lg">
                    <DevicePhoto device={f.dev} />
                  </PhotoFrame>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <p className="truncate text-[14px] text-cream">{f.dev.name}</p>
                      <span className="text-[11.5px] tabular-nums text-cream-3">
                        {f.qty} pieza{f.qty === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-cream-3">
                      {f.dev.brand} · {cat?.label ?? f.dev.cat}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-cream-3/80">
                      {f.cuartos.map((c) => `${c.nombre} ×${c.qty}`).join(' · ')}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[11.5px] text-cream-2">
                        <span className="text-cream-3">$</span>
                        <input
                          type="number"
                          min="0"
                          value={precio}
                          onChange={(e) => editarCompra(f.id, { precio: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-24 rounded border border-line bg-ink-2 px-1.5 py-0.5 text-[12.5px] text-cream outline-none focus:border-ember/60"
                        />
                        <span className="text-cream-3">
                          c/u · ${Math.round(precio * f.qty).toLocaleString('es-MX')} total
                        </span>
                      </label>
                      {over.precio != null && (
                        <button
                          /* null, no undefined: el evento viaja por WebSocket como
                             JSON, y JSON.stringify se come las claves en
                             undefined —el "borrado" nunca llegaba al servidor.
                             null sí sobrevive el viaje, y el `??` de abajo lo
                             trata igual: cae al precio de catálogo. */
                          onClick={() => editarCompra(f.id, { precio: null })}
                          className="text-[10.5px] text-cream-3 underline decoration-dotted underline-offset-2 hover:text-ember"
                        >
                          volver al precio de catálogo
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      placeholder="URL del producto — pégala aquí si ya sabes dónde se compra"
                      value={over.url ?? ''}
                      onChange={(e) => editarCompra(f.id, { url: e.target.value })}
                      className="mt-1.5 w-full rounded border border-line bg-ink-2 px-2 py-1 text-[11.5px] text-cream outline-none placeholder:text-cream-3/60 focus:border-ember/60"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
