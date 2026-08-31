import { useState } from 'react'

import { useProyecto, useSurvey, useTarifas } from '../../store/survey'
import { CATEGORIES, DEVICES, DEVICE_BY_ID } from '../../content/catalog'
import { quote, unitPrice } from '../../content/pricing'
import { instalacionDelProyecto } from '../../content/instalacion'
import { planCompra } from '../../content/paquetes'
import { MATERIALES, precioMaterial } from '../../content/materiales'
import DevicePhoto, { PhotoFrame } from '../catalog/DevicePhoto'

/**
 * Compras: lo que la plataforma escogió para TODO el proyecto, junto.
 *
 * La cotización ya arma esta lista para calcular un total; esto es la misma
 * cuenta pero para lo otro que hace falta antes de instalar — decidir dónde
 * se compra cada cosa, si se cambia por otra opción, si hay que quitarla o
 * agregar una que no estaba, y cuánto cuestan de verdad los servicios
 * detrás. Por eso vive aparte y no adentro de un cuarto: el mismo foco en
 * tres recámaras se compra una sola vez, junto, no tres veces por separado.
 *
 * Precio, URL, foto y paquetes son del NEGOCIO (`estado.tarifas`), no del
 * proyecto ni del catálogo curado: el catálogo es de todos los clientes, y
 * lo que aquí se corrige —"lo compramos en tal tienda a tal precio", "esta
 * es la foto real de la caja que llegó"— es de esta casa, pero de CUALQUIER
 * levantamiento suyo, no solo de este. Corregir el precio de un foco en un
 * proyecto lo corrige para el siguiente también. Materiales e insumos
 * separan lo mismo: precio por unidad del negocio, cantidad de cada
 * proyecto. Todo alimenta la cotización oficial (quote()): cambiarlo aquí
 * mueve el total que ve el cliente en Levantamiento y en Proyectos, no solo
 * esta pantalla.
 */
export default function Compras() {
  const proyecto = useProyecto()
  const tarifas = useTarifas()
  const editarProductoGlobal = useSurvey((s) => s.editarProductoGlobal)
  const editarMaterialTarifa = useSurvey((s) => s.editarMaterialTarifa)
  const setCantidadMaterial = useSurvey((s) => s.setCantidadMaterial)
  const eliminarCompra = useSurvey((s) => s.eliminarCompra)
  const cambiarAlternativa = useSurvey((s) => s.cambiarAlternativa)
  const setExtras = useSurvey((s) => s.setExtras)
  const setQty = useSurvey((s) => s.setQty)
  const [cambiando, setCambiando] = useState(null) // deviceId con el picker de alternativas abierto
  const [editandoFoto, setEditandoFoto] = useState(null) // deviceId con el campo de foto abierto
  const [editandoPaquetes, setEditandoPaquetes] = useState(null) // deviceId con el editor de paquetes abierto
  const [menuAbierto, setMenuAbierto] = useState(null) // deviceId con el menú de "más acciones" abierto
  const [agregando, setAgregando] = useState(false)
  const [vista, setVista] = useState('producto') // 'producto' (una lista, junta) | 'espacio' (por cuarto)

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
      actual.cuartos.push({ id: room.id, nombre: room.nombre, qty })
      porDevice.set(id, actual)
    }
  }

  const filas = [...porDevice.entries()]
    .map(([id, info]) => ({ id, dev: DEVICE_BY_ID[id], ...info }))
    .filter((f) => f.dev)
    .sort((a, b) => a.dev.name.localeCompare(b.dev.name, 'es'))

  /* La corrección real de un producto: gana la tarifa del negocio; si un
     proyecto viejo trae su propio ajuste de cuando esa capa no existía
     todavía, se ve ese mientras nadie la corrija de nuevo aquí —misma regla
     que usa quote(). */
  const legado = proyecto.compras?.productos ?? {}
  const efectivoDe = (id) => ({ ...(legado[id] ?? {}), ...(tarifas.productos?.[id] ?? {}) })
  const precioDe = (dev) => tarifas.productos?.[dev.id]?.precio ?? legado[dev.id]?.precio ?? unitPrice(dev)
  const totalGeneral = filas.reduce((a, f) => a + precioDe(f.dev) * f.qty, 0)

  /* La misma fórmula que arma la cotización oficial, aquí solo para poder
     editar el costo de cada servicio con el mismo gesto que un producto. */
  const q = quote({
    obra: proyecto.obra,
    rooms: proyecto.rooms,
    extras: proyecto.extras,
    compras: proyecto.compras,
    materiales: proyecto.materiales,
    tarifas,
  })
  const overServicios = proyecto.extras?.serviciosOverride ?? {}
  const patchServicio = (id, valor) => setExtras({ serviciosOverride: { ...overServicios, [id]: valor } })

  return (
    <div className="mx-auto max-w-[1100px]">
      <p className="eyebrow">Compras</p>
      <h1 className="display text-[24px] text-cream">{proyecto.nombre}</h1>
      <p className="mx-auto mt-1 max-w-[62ch] text-[13px] leading-relaxed text-cream-3">
        Lo que la plataforma escogió para los {proyecto.rooms?.length ?? 0} espacios de este proyecto, con foto,
        precio, alternativa y enlace de compra editables — y el costo real de cada servicio. Lo que se corrija aquí
        es de este proyecto, no del catálogo general, y mueve el total de la cotización.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-1 rounded-lg border border-line p-0.5 text-[11.5px]">
          <button
            onClick={() => setVista('producto')}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              vista === 'producto' ? 'bg-cream/10 text-cream' : 'text-cream-3 hover:text-cream-2'
            }`}
          >
            Por producto
          </button>
          <button
            onClick={() => setVista('espacio')}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              vista === 'espacio' ? 'bg-cream/10 text-cream' : 'text-cream-3 hover:text-cream-2'
            }`}
          >
            Por espacio
          </button>
        </div>
        <div className="flex items-center gap-3">
          {filas.length > 0 && (
            <span className="text-[13px] text-cream-2">
              {filas.length} producto{filas.length === 1 ? '' : 's'} ·{' '}
              <strong className="text-ember">${Math.round(totalGeneral).toLocaleString('es-MX')}</strong> equipo
            </span>
          )}
          <button
            onClick={() => setAgregando(true)}
            className="rounded-lg border border-line px-2.5 py-1 text-[11px] text-cream-2 hover:border-ember/60 hover:text-cream"
          >
            + Agregar producto
          </button>
        </div>
      </div>

      {agregando && (
        <AgregarProducto
          proyecto={proyecto}
          existentes={porDevice}
          onCerrar={() => setAgregando(false)}
        />
      )}

      {filas.length === 0 ? (
        <p className="mt-10 text-center text-[13px] text-cream-3">Todavía no hay equipo levantado en ningún espacio.</p>
      ) : vista === 'espacio' ? (
        <PorEspacio proyecto={proyecto} precioDe={precioDe} q={q} />
      ) : (
        <>
          <div className="mt-4 space-y-2.5">
            {filas.map((f) => {
              const over = efectivoDe(f.id)
              const precio = precioDe(f.dev)
              const cat = CATEGORIES.find((c) => c.id === f.dev.cat)
              const alternativas = DEVICES.filter((d) => d.cat === f.dev.cat && d.id !== f.id)
              const plan = over.paquetes?.length ? planCompra(f.qty, over.paquetes) : null
              return (
                <div key={f.id} className="flex gap-3 rounded-xl border border-line bg-ink p-3">
                  <PhotoFrame className="h-20 w-20 flex-none rounded-lg">
                    <DevicePhoto device={f.dev} srcOverride={over.foto} />
                  </PhotoFrame>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <p className="truncate text-[14px] text-cream">{f.dev.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11.5px] tabular-nums text-cream-3">
                          {f.qty} pieza{f.qty === 1 ? '' : 's'}
                        </span>
                        <MenuAcciones
                          abierto={menuAbierto === f.id}
                          onAbrir={() => setMenuAbierto(f.id)}
                          onCerrar={() => setMenuAbierto(null)}
                          opciones={[
                            alternativas.length > 0 && {
                              label: 'Cambiar por otra opción',
                              onClick: () => setCambiando(f.id),
                            },
                            { label: over.foto ? 'Cambiar foto' : 'Poner foto real', onClick: () => setEditandoFoto(f.id) },
                            {
                              label: over.paquetes?.length ? 'Editar paquetes' : 'Se vende en paquetes',
                              onClick: () => setEditandoPaquetes(f.id),
                            },
                            {
                              label: 'Quitar de compras',
                              peligro: true,
                              onClick: () =>
                                confirm(`¿Quitar "${f.dev.name}" de la lista de compras?`) && eliminarCompra(f.id),
                            },
                          ].filter(Boolean)}
                        />
                      </div>
                    </div>
                    <p className="text-[11.5px] text-cream-3">
                      {f.dev.brand} · {cat?.label ?? f.dev.cat}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-cream-3/80">
                      {f.cuartos.map((c) => (
                        <label key={c.id} className="flex items-center gap-1">
                          <span>{c.nombre} ×</span>
                          <input
                            type="number"
                            min="0"
                            value={c.qty}
                            onChange={(e) => setQty(f.id, Math.max(0, Number(e.target.value) || 0), c.id)}
                            title={`Cantidad en ${c.nombre} — 0 la quita de ahí`}
                            className="w-11 rounded border border-line bg-ink-2 px-1 py-0.5 text-center text-cream-2 outline-none focus:border-ember/60"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[11.5px] text-cream-2">
                        <span className="text-cream-3">$</span>
                        <input
                          type="number"
                          min="0"
                          value={precio}
                          onChange={(e) => editarProductoGlobal(f.id, { precio: Math.max(0, Number(e.target.value) || 0) })}
                          title="Aplica a todos los proyectos: es el precio real del negocio, no solo de este."
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
                          onClick={() => editarProductoGlobal(f.id, { precio: null })}
                          className="text-[10.5px] text-cream-3 underline decoration-dotted underline-offset-2 hover:text-ember"
                        >
                          volver al precio de catálogo
                        </button>
                      )}
                    </div>

                    {cambiando === f.id && (
                      <select
                        autoFocus
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) cambiarAlternativa(f.id, e.target.value)
                          setCambiando(null)
                        }}
                        onBlur={() => setCambiando(null)}
                        className="mt-1.5 w-full rounded border border-line bg-ink-2 px-2 py-1 text-[11.5px] text-cream outline-none focus:border-ember/60"
                      >
                        <option value="" disabled>
                          Elegir otra opción de {cat?.label ?? f.dev.cat}…
                        </option>
                        {alternativas.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} — {d.brand} · ${unitPrice(d).toLocaleString('es-MX')}
                          </option>
                        ))}
                      </select>
                    )}

                    {editandoFoto === f.id && (
                      <input
                        autoFocus
                        type="url"
                        placeholder="URL de la foto real — la de la caja que llegó, no la del catálogo"
                        defaultValue={over.foto ?? ''}
                        onBlur={(e) => {
                          editarProductoGlobal(f.id, { foto: e.target.value.trim() || null })
                          setEditandoFoto(null)
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        className="mt-1.5 w-full rounded border border-line bg-ink-2 px-2 py-1 text-[11.5px] text-cream outline-none placeholder:text-cream-3/60 focus:border-ember/60"
                      />
                    )}

                    {editandoPaquetes === f.id && (
                      <EditorPaquetes
                        paquetes={over.paquetes ?? []}
                        onCambiar={(paquetes) => editarProductoGlobal(f.id, { paquetes: paquetes.length ? paquetes : null })}
                        onCerrar={() => setEditandoPaquetes(null)}
                      />
                    )}

                    {plan && (
                      <p className="mt-1.5 rounded-lg bg-ink-2 px-2 py-1.5 text-[11px] leading-snug text-cream-2">
                        Comprar {plan.combo.map((c) => `${c.veces}× paquete de ${c.tam}`).join(' + ')} ={' '}
                        {plan.unidades} piezas · ${Math.round(plan.costoTotal).toLocaleString('es-MX')}
                        {plan.sobran > 0 && (
                          <span className="text-ember"> · sobran {plan.sobran}, no hay combinación exacta para {f.qty}</span>
                        )}
                      </p>
                    )}

                    <input
                      type="url"
                      placeholder="URL del producto — pégala aquí si ya sabes dónde se compra"
                      value={over.url ?? ''}
                      onChange={(e) => editarProductoGlobal(f.id, { url: e.target.value })}
                      className="mt-1.5 w-full rounded border border-line bg-ink-2 px-2 py-1 text-[11.5px] text-cream outline-none placeholder:text-cream-3/60 focus:border-ember/60"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <Materiales
        proyecto={proyecto}
        tarifas={tarifas}
        total={q.materialesTotal}
        onCantidad={setCantidadMaterial}
        onTarifa={editarMaterialTarifa}
      />

      <div className="mt-8 flex items-baseline justify-between border-b border-line pb-3">
        <span className="text-[11px] tracking-[0.12em] text-cream-3 uppercase">
          Servicios · instalación, cableado y puesta en marcha
        </span>
        <span className="text-[15px] text-cream">
          <strong className="text-ember">${Math.round(q.serviciosTotal).toLocaleString('es-MX')}</strong> servicios
        </span>
      </div>

      <div className="mt-4 space-y-2.5 pb-10">
        {q.servicios.map((linea) => (
          <div key={linea.id} className="rounded-xl border border-line bg-ink p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
              <p className="text-[13px] text-cream">{linea.concepto}</p>
              {!linea.editado && (
                <span
                  title="Calculado con la fórmula estándar del negocio, no capturado a mano para este proyecto. Corrígelo si no aplica."
                  className="rounded-full border border-line px-2 py-0.5 text-[10px] tracking-wide text-cream-3 uppercase"
                >
                  estimado
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[10.5px] text-cream-3/80">{linea.detalle}</p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11.5px] text-cream-2">
                <span className="text-cream-3">$</span>
                <input
                  type="number"
                  min="0"
                  value={linea.importe}
                  onChange={(e) => patchServicio(linea.id, Math.max(0, Number(e.target.value) || 0))}
                  className="w-28 rounded border border-line bg-ink-2 px-1.5 py-0.5 text-[12.5px] text-cream outline-none focus:border-ember/60"
                />
                <span className="text-cream-3">total del servicio</span>
              </label>
              {linea.editado && (
                <button
                  onClick={() => patchServicio(linea.id, null)}
                  className="text-[10.5px] text-cream-3 underline decoration-dotted underline-offset-2 hover:text-ember"
                >
                  volver al costo calculado
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Lo mismo que la lista de arriba, pero acomodado por cuarto en vez de
 *  junto: cuánto cuesta CADA espacio, equipo más instalación. Es la
 *  pregunta que se hace al presupuestar por partes o al explicarle al
 *  cliente por qué la cocina sale más cara que la recámara.
 *
 *  La instalación de cada cuarto sale de la misma fórmula que ya usa la
 *  cotización (`instalacionDelProyecto`), pero escalada para que la suma
 *  de los cuartos dé EXACTO lo que de verdad se está cobrando —el de la
 *  fila "Instalación" de Servicios, que puede traer un costo corregido a
 *  mano o el mínimo de proyecto aplicado—. Sin ese ajuste, los espacios
 *  sumarían un número y la cotización real otro. */
function PorEspacio({ proyecto, precioDe, q }) {
  const formula = instalacionDelProyecto(proyecto.rooms ?? [])
  const lineaInstalacion = q.servicios.find((l) => l.id === 'instalacion')
  const factor = formula.suma > 0 ? (lineaInstalacion?.importe ?? formula.total) / formula.suma : 0

  const espacios = (proyecto.rooms ?? [])
    .map((room) => {
      const productos = Object.entries(room.items ?? {})
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const dev = DEVICE_BY_ID[id]
          if (!dev) return null
          const precio = precioDe(dev)
          return { id, dev, qty, importe: precio * qty }
        })
        .filter(Boolean)
        .sort((a, b) => b.importe - a.importe)
      const subtotalProductos = productos.reduce((a, p) => a + p.importe, 0)
      const costoInstalacion = (formula.porEspacio.find((x) => x.room.id === room.id)?.total ?? 0) * factor
      return { room, productos, subtotalProductos, costoInstalacion, total: subtotalProductos + costoInstalacion }
    })
    .filter((e) => e.productos.length > 0)

  if (espacios.length === 0) {
    return <p className="mt-10 text-center text-[13px] text-cream-3">Todavía no hay equipo levantado en ningún espacio.</p>
  }

  return (
    <div className="mt-4 space-y-2.5 pb-4">
      {espacios.map((e) => (
        <div key={e.room.id} className="rounded-xl border border-line bg-ink p-3">
          <div className="flex items-baseline justify-between">
            <p className="text-[13.5px] text-cream">{e.room.nombre}</p>
            <p className="text-[13.5px] text-cream">
              <strong className="text-ember">${Math.round(e.total).toLocaleString('es-MX')}</strong>
            </p>
          </div>
          <div className="mt-2 space-y-1 text-[11.5px]">
            {e.productos.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-cream-2">
                <span className="truncate">
                  {p.dev.name} ×{p.qty}
                </span>
                <span className="flex-none tabular-nums text-cream-3">
                  ${Math.round(p.importe).toLocaleString('es-MX')}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 border-t border-line/60 pt-1 text-cream-3">
              <span>Instalación de este espacio</span>
              <span className="tabular-nums">${Math.round(e.costoInstalacion).toLocaleString('es-MX')}</span>
            </div>
          </div>
        </div>
      ))}
      <p className="pt-1 text-[10.5px] text-cream-3/80">
        La instalación de cada espacio es una proporción del costo real de "Instalación" en Servicios, más abajo —
        corrígelo ahí si no es el correcto, no aquí.
      </p>
    </div>
  )
}

/** Materiales e insumos: lo que hace falta para dejar instalado lo que se
 *  compró, más allá del aparato en sí — cable, canaleta, tornillería. La
 *  lista siempre se ve completa, con o sin cantidad puesta, para que sirva
 *  de checklist y no solo de recibo: "¿ya pensé en la canaleta de esta
 *  casa?" se contesta viéndola, no recordándola.
 *
 *  El precio por unidad es del negocio —mismo costo en cualquier
 *  proyecto—; la cantidad es de este, porque una casa de dos recámaras no
 *  gasta el mismo cable que un departamento de uno. Poner el precio en $0
 *  es válido a propósito: hay insumos que no se cobran aparte, pero se
 *  quiere ver cuánto se estaría regalando. */
function Materiales({ proyecto, tarifas, total, onCantidad, onTarifa }) {
  const [agregando, setAgregando] = useState(false)

  const propios = Object.entries(tarifas?.materiales ?? {})
    .filter(([id, m]) => m && !MATERIALES.some((base) => base.id === id))
    .map(([id, m]) => ({ id, nombre: m.nombre ?? id, unidad: m.unidad ?? 'pza', detalle: m.detalle ?? '', personalizado: true }))

  const lista = [...MATERIALES.map((m) => ({ ...m, personalizado: false })), ...propios]

  return (
    <>
      <div className="mt-8 flex items-baseline justify-between border-b border-line pb-3">
        <span className="text-[11px] tracking-[0.12em] text-cream-3 uppercase">
          Materiales e insumos · lo necesario para dejarlo instalado
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[15px] text-cream">
            <strong className="text-ember">${Math.round(total).toLocaleString('es-MX')}</strong> materiales
          </span>
          <button
            onClick={() => setAgregando(true)}
            className="rounded-lg border border-line px-2.5 py-1 text-[11px] text-cream-2 hover:border-ember/60 hover:text-cream"
          >
            + Agregar material
          </button>
        </div>
      </div>

      {agregando && (
        <AgregarMaterial
          onCerrar={() => setAgregando(false)}
          onCrear={(id, campos) => {
            onTarifa(id, campos)
            setAgregando(false)
          }}
        />
      )}

      <div className="mt-4 space-y-2.5 pb-10">
        {lista.map((m) => {
          const qty = proyecto.materiales?.[m.id] ?? 0
          const precio = precioMaterial(m.id, tarifas)
          return (
            <div key={m.id} className="rounded-xl border border-line bg-ink p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <p className="text-[13px] text-cream">{m.nombre}</p>
                {m.personalizado && (
                  <button
                    onClick={() => confirm(`¿Quitar "${m.nombre}" de materiales?`) && onTarifa(m.id, null)}
                    className="text-[10.5px] text-cream-3/70 hover:text-red-400"
                  >
                    quitar
                  </button>
                )}
              </div>
              {m.detalle && <p className="mt-0.5 text-[10.5px] text-cream-3/80">{m.detalle}</p>}

              <div className="mt-2 flex flex-wrap items-center gap-4 text-[11.5px]">
                <label className="flex items-center gap-1.5 text-cream-2">
                  <span className="text-cream-3">en este proyecto:</span>
                  <input
                    type="number"
                    min="0"
                    value={qty}
                    onChange={(e) => onCantidad(m.id, Math.max(0, Number(e.target.value) || 0))}
                    className="w-16 rounded border border-line bg-ink-2 px-1.5 py-0.5 text-center text-cream outline-none focus:border-ember/60"
                  />
                  <span className="text-cream-3">{m.unidad}</span>
                </label>
                <label className="flex items-center gap-1.5 text-cream-2">
                  <span className="text-cream-3">$</span>
                  <input
                    type="number"
                    min="0"
                    value={precio}
                    onChange={(e) => onTarifa(m.id, { precio: Math.max(0, Number(e.target.value) || 0) })}
                    title="Aplica a todos los proyectos: es el precio real del negocio."
                    className="w-20 rounded border border-line bg-ink-2 px-1.5 py-0.5 text-cream outline-none focus:border-ember/60"
                  />
                  <span className="text-cream-3">c/u</span>
                </label>
                {qty > 0 && (
                  <span className="text-cream-3">= ${Math.round(qty * precio).toLocaleString('es-MX')}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/** Dar de alta un material que no está en la lista de arranque —el mismo
 *  gesto que "no está en el catálogo" para un producto. */
function AgregarMaterial({ onCerrar, onCrear }) {
  const [nombre, setNombre] = useState('')
  const [unidad, setUnidad] = useState('pza')
  const [precio, setPrecio] = useState(0)

  const crear = () => {
    if (!nombre.trim()) return
    const id = `material-${nombre
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 28)}-${Math.random().toString(36).slice(2, 6)}`
    onCrear(id, { nombre: nombre.trim(), unidad: unidad.trim() || 'pza', precio: Number(precio) || 0 })
  }

  const campo =
    'w-full rounded border border-line bg-ink px-2 py-1 text-[12px] text-cream outline-none focus:border-ember/60'

  return (
    <div className="mt-4 rounded-xl border border-line bg-ink p-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-cream">Agregar material</p>
        <button onClick={onCerrar} className="text-[11px] text-cream-3 hover:text-cream">
          cerrar
        </button>
      </div>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
        <input autoFocus placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${campo} sm:col-span-2`} />
        <input placeholder="Unidad (m, pza, rollo…)" value={unidad} onChange={(e) => setUnidad(e.target.value)} className={campo} />
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-[11.5px] text-cream-2">
          <span className="text-cream-3">$</span>
          <input
            type="number"
            min="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="w-24 rounded border border-line bg-ink-2 px-1.5 py-0.5 text-cream outline-none focus:border-ember/60"
          />
          <span className="text-cream-3">precio de arranque, se puede ajustar después</span>
        </label>
        <button onClick={crear} className="ml-auto rounded-lg bg-ember px-3 py-1.5 text-[11.5px] font-medium text-ink hover:bg-ember/90">
          Agregar
        </button>
      </div>
    </div>
  )
}

/** El botón "⋯" de cada producto: agrupa lo que antes eran cuatro links
 *  sueltos —cambiar de alternativa, foto, paquetes, quitar— en un solo
 *  menú, para que la tarjeta no se vea como una lista de vínculos azules. */
function MenuAcciones({ abierto, onAbrir, onCerrar, opciones }) {
  return (
    <div className="relative">
      <button
        onClick={() => (abierto ? onCerrar() : onAbrir())}
        aria-label="Más acciones"
        className={`rounded-md px-1.5 py-0.5 text-[13px] leading-none transition-colors ${
          abierto ? 'bg-cream/10 text-cream' : 'text-cream-3 hover:bg-cream/8 hover:text-cream-2'
        }`}
      >
        ⋯
      </button>
      {abierto && (
        <>
          {/* capa invisible para cerrar el menú al hacer click afuera */}
          <div className="fixed inset-0 z-10" onClick={onCerrar} />
          <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-line bg-ink-2 py-1 text-[11.5px] shadow-lg">
            {opciones.map((o) => (
              <button
                key={o.label}
                onClick={() => {
                  o.onClick()
                  onCerrar()
                }}
                className={`block w-full px-3 py-1.5 text-left hover:bg-cream/8 ${o.peligro ? 'text-red-400' : 'text-cream-2'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Los tamaños de paquete en los que se vende esto, cada uno con su precio.
 *  Amazon casi nunca vende un aparato de smart home suelto y a granel: viene
 *  en 2, 4, 6 — y el precio por pieza cambia entre paquetes. Sin esto no hay
 *  con qué calcular `planCompra`. */
function EditorPaquetes({ paquetes, onCambiar, onCerrar }) {
  const set = (i, campo, valor) => {
    const copia = paquetes.map((p, j) => (j === i ? { ...p, [campo]: valor } : p))
    onCambiar(copia)
  }
  const quitar = (i) => onCambiar(paquetes.filter((_, j) => j !== i))
  const agregar = () => onCambiar([...paquetes, { tam: 2, precio: 0 }])

  return (
    <div className="mt-1.5 rounded-lg border border-line bg-ink-2 p-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-cream-3">Tamaño de paquete y precio, tal como se vende</p>
        <button onClick={onCerrar} className="text-[10.5px] text-cream-3 hover:text-cream">
          cerrar
        </button>
      </div>
      <div className="mt-1.5 space-y-1">
        {paquetes.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11.5px]">
            <input
              type="number"
              min="1"
              value={p.tam}
              onChange={(e) => set(i, 'tam', Math.max(1, Number(e.target.value) || 1))}
              className="w-14 rounded border border-line bg-ink px-1.5 py-0.5 text-cream outline-none focus:border-ember/60"
            />
            <span className="text-cream-3">pzas por</span>
            <span className="text-cream-3">$</span>
            <input
              type="number"
              min="0"
              value={p.precio}
              onChange={(e) => set(i, 'precio', Math.max(0, Number(e.target.value) || 0))}
              className="w-24 rounded border border-line bg-ink px-1.5 py-0.5 text-cream outline-none focus:border-ember/60"
            />
            <button onClick={() => quitar(i)} className="ml-1 text-cream-3/70 hover:text-red-400">
              quitar
            </button>
          </div>
        ))}
      </div>
      <button onClick={agregar} className="mt-1.5 text-[10.5px] text-cream-3 underline decoration-dotted hover:text-ember">
        + agregar tamaño de paquete
      </button>
    </div>
  )
}

/** Agregar un producto que todavía no está en ningún cuarto — del catálogo,
 *  o uno que no existe ahí y se da de alta con lo mínimo. Necesita un
 *  cuarto: la lista de Compras se arma a partir de lo que hay en los
 *  cuartos, así que no hay "agregar sin cuarto". */
function AgregarProducto({ proyecto, existentes, onCerrar }) {
  const setQty = useSurvey((s) => s.setQty)
  const nuevoDevice = useSurvey((s) => s.nuevoDevice)
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [nuevo, setNuevo] = useState(false)
  const [form, setForm] = useState({ name: '', brand: '', precio: 0, cat: 'iluminacion' })
  const [cuartoId, setCuartoId] = useState(proyecto.rooms[0]?.id ?? '')
  const [qty, setQtyLocal] = useState(1)

  const resultados =
    !nuevo && busqueda.trim().length > 1
      ? DEVICES.filter(
          (d) =>
            !existentes.has(d.id) &&
            (d.name.toLowerCase().includes(busqueda.toLowerCase()) ||
              d.brand.toLowerCase().includes(busqueda.toLowerCase())),
        ).slice(0, 8)
      : []

  const agregar = () => {
    if (!cuartoId || qty <= 0) return
    if (nuevo) {
      if (!form.name.trim()) return
      const id = `propio-${form.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 28)}-${Math.random().toString(36).slice(2, 6)}`
      nuevoDevice({
        id,
        name: form.name.trim(),
        brand: form.brand.trim() || 'Sin marca',
        cat: form.cat,
        link: 'wifi',
        eco: ['apple', 'google', 'alexa'],
        power: 'corriente',
        price: [Number(form.precio) || 0, Number(form.precio) || 0],
        tier: 'esencial',
        pitch: 'Dado de alta desde Compras.',
      })
      setQty(id, qty, cuartoId)
    } else if (seleccionado) {
      setQty(seleccionado, qty, cuartoId)
    } else {
      return
    }
    onCerrar()
  }

  const campo =
    'w-full rounded border border-line bg-ink px-2 py-1 text-[12px] text-cream outline-none focus:border-ember/60'

  return (
    <div className="mt-4 rounded-xl border border-line bg-ink p-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-cream">Agregar producto</p>
        <button onClick={onCerrar} className="text-[11px] text-cream-3 hover:text-cream">
          cerrar
        </button>
      </div>

      <div className="mt-2 flex gap-2 text-[11px]">
        <button
          onClick={() => setNuevo(false)}
          className={`rounded-full border px-2.5 py-1 ${!nuevo ? 'border-ember bg-ember/12 text-cream' : 'border-line text-cream-3'}`}
        >
          Del catálogo
        </button>
        <button
          onClick={() => setNuevo(true)}
          className={`rounded-full border px-2.5 py-1 ${nuevo ? 'border-ember bg-ember/12 text-cream' : 'border-line text-cream-3'}`}
        >
          No está en el catálogo
        </button>
      </div>

      {!nuevo ? (
        <div className="mt-2">
          <input
            autoFocus
            placeholder="Buscar por nombre o marca…"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setSeleccionado(null)
            }}
            className={campo}
          />
          {resultados.length > 0 && (
            <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto">
              {resultados.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSeleccionado(d.id)
                    setBusqueda(`${d.name} — ${d.brand}`)
                  }}
                  className={`block w-full rounded border px-2 py-1 text-left text-[11.5px] ${
                    seleccionado === d.id ? 'border-ember bg-ember/10 text-cream' : 'border-line text-cream-2 hover:bg-cream/6'
                  }`}
                >
                  {d.name} — {d.brand} · ${unitPrice(d).toLocaleString('es-MX')}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <input
            autoFocus
            placeholder="Cómo se llama"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={`${campo} sm:col-span-2`}
          />
          <input
            placeholder="Marca"
            value={form.brand}
            onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            className={campo}
          />
          <input
            type="number"
            min="0"
            placeholder="Precio unitario"
            value={form.precio}
            onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
            className={campo}
          />
          <select
            value={form.cat}
            onChange={(e) => setForm((f) => ({ ...f, cat: e.target.value }))}
            className={`${campo} sm:col-span-2`}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select value={cuartoId} onChange={(e) => setCuartoId(e.target.value)} className={`${campo} w-auto`}>
          {proyecto.rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQtyLocal(Math.max(1, Number(e.target.value) || 1))}
          className={`${campo} w-16`}
        />
        <button
          onClick={agregar}
          className="rounded-lg bg-ember px-3 py-1.5 text-[11.5px] font-medium text-ink hover:bg-ember/90"
        >
          Agregar
        </button>
      </div>
    </div>
  )
}
