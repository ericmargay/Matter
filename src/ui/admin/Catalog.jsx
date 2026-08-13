import { useMemo, useState } from 'react'
import { CATEGORIES, DEVICES, LINK_LABEL, catalogStats, refPrice } from '../../content/catalog'
import { CANALES, canalDe, linksDeCompra, notaDe } from '../../content/opsCatalog'
import { PHOTOS } from '../../content/photos'
import { LABOR_TIERS, laborTier } from '../../content/pricing'
import { useProyecto, useSurvey } from '../../store/survey'
import CatalogBrowser from '../catalog/CatalogBrowser'

/**
 * Catálogo de compras — la vista de operaciones.
 *
 * Es el mismo navegador que ve el cliente, con tres cosas encima: a qué cuarto
 * se está agregando, cuánto cuesta instalar cada pieza y con qué proveedor se
 * consigue. El `+` no arma una lista suelta: mete la pieza al cuarto activo del
 * levantamiento, así el catálogo y la cotización son la misma cosa.
 *
 * Sin proyecto abierto el catálogo se puede consultar —para eso también sirve,
 * para resolver una duda en una llamada— pero no se puede agregar nada: no
 * habría dónde guardarlo.
 */

const money = (n) => `$${Math.round(n).toLocaleString('es-MX')}`

/** Cuántos productos alcanzaron foto de fabricante. Se lee del manifiesto para
 *  que el número no mienta cuando `npm run photos` consiga alguno más. */
const conFoto = Object.keys(PHOTOS).length

/* ── stepper de cantidad ──────────────────────────────────────── */

function Stepper({ device, cuarto }) {
  const bump = useSurvey((s) => s.bump)
  const qty = cuarto?.items?.[device.id] ?? 0

  if (!cuarto) {
    return <span className="text-[10.5px] text-cream-3">Sin cuarto</span>
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => bump(device.id, -1)}
        disabled={!qty}
        aria-label={`Quitar ${device.name} de ${cuarto.nombre}`}
        className="h-6 w-6 rounded border border-line text-cream-2 transition-colors hover:border-cream/40 disabled:opacity-25"
      >
        −
      </button>
      <span className={`w-5 text-center text-[12.5px] tabular-nums ${qty ? 'text-ember' : 'text-cream-3'}`}>
        {qty}
      </span>
      <button
        onClick={() => bump(device.id, 1)}
        aria-label={`Agregar ${device.name} a ${cuarto.nombre}`}
        className="h-6 w-6 rounded border border-line text-cream-2 transition-colors hover:border-ember hover:bg-ember hover:text-ink"
      >
        +
      </button>
    </div>
  )
}

/* ── bloque de proveedores para la ficha ──────────────────────── */

function Proveedores({ device }) {
  const canal = CANALES[canalDe(device)]
  return (
    <div className="mt-5 rounded-xl border border-line bg-ink px-3.5 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Dónde se consigue</p>
        <span className="text-[10.5px] text-cream-3">{canal.label}</span>
      </div>
      <p className="mt-1 text-[11px] text-cream-3">{canal.hint}</p>

      <div className="mt-2.5 space-y-1.5">
        {linksDeCompra(device).map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 rounded-lg border border-line px-2.5 py-2 transition-colors hover:border-ember/50"
          >
            <span>
              <span className="block text-[12px] text-cream-2">{p.nombre}</span>
              <span className="block text-[10.5px] text-cream-3">{p.entrega}</span>
            </span>
            <span className="text-[11px] whitespace-nowrap text-ember">Buscar →</span>
          </a>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-cream-3/80">
        Abren una búsqueda, no una ficha: los marketplaces cambian de URL cada temporada y un enlace directo
        se rompe en semanas.
      </p>
    </div>
  )
}

/* ── vista de tabla ───────────────────────────────────────────── */

function Tabla({ cuarto }) {
  const [q, setQ] = useState('')
  const filas = useMemo(() => {
    const n = q.trim().toLowerCase()
    if (!n) return DEVICES
    return DEVICES.filter((d) => `${d.name} ${d.brand} ${d.pitch}`.toLowerCase().includes(n))
  }, [q])

  return (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar producto, marca o para qué sirve…"
        className="mt-3 w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-[13px] text-cream outline-none placeholder:text-cream-3 focus:border-ember/60"
      />
      <div className="mt-3 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead className="bg-ink-2 text-[10px] tracking-[0.12em] text-cream-3 uppercase">
            <tr>
              <th className="px-3 py-2.5 font-medium">Producto</th>
              <th className="px-3 py-2.5 font-medium">Enlace</th>
              <th className="px-3 py-2.5 font-medium">Instalación</th>
              <th className="px-3 py-2.5 text-right font-medium">Equipo</th>
              <th className="px-3 py-2.5 text-right font-medium">Instalado</th>
              <th className="px-3 py-2.5 font-medium">{cuarto ? cuarto.nombre : 'Cantidad'}</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((d) => {
              const tier = LABOR_TIERS[laborTier(d)]
              return (
                <tr key={d.id} className="border-t border-line align-top transition-colors hover:bg-ink-2/60">
                  <td className="px-3 py-2.5">
                    <div className="text-[13px] text-cream">{d.name}</div>
                    <div className="text-[10.5px] text-cream-3">
                      {d.brand} · {CATEGORIES.find((c) => c.id === d.cat)?.label} · {CANALES[canalDe(d)].label}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[11.5px] text-cream-2">{LINK_LABEL[d.link]}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-[11.5px] text-cream-2">{tier.label}</div>
                    <div className="text-[10.5px] text-cream-3">
                      {money(tier.price)} · {tier.mins} min
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-[12.5px] whitespace-nowrap text-cream-2">
                    {money(refPrice(d))}
                  </td>
                  <td className="px-3 py-2.5 text-right text-[12.5px] whitespace-nowrap text-cream">
                    {money(refPrice(d) + tier.price)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Stepper device={d} cuarto={cuarto} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filas.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-cream-3">Nada con ese texto.</p>
        )}
      </div>
    </>
  )
}

/* ── panel ────────────────────────────────────────────────────── */

export default function Catalog() {
  const proyecto = useProyecto()
  const setActiveRoom = useSurvey((s) => s.setActiveRoom)
  const [vista, setVista] = useState('galeria')

  const rooms = proyecto?.rooms ?? []
  const activo = proyecto?.activeRoom ?? rooms[0]?.id
  const cuarto = rooms.find((r) => r.id === activo) ?? null
  const stats = useMemo(() => catalogStats(), [])

  const barra = (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-ink-2 px-2.5 py-2">
      {!proyecto ? (
        <>
          <span className="text-[11.5px] text-cream-3">
            Consulta abierta. Para agregar equipo hace falta un proyecto.
          </span>
          <a href="#/admin/proyectos" className="ml-auto text-[11.5px] text-ember hover:underline">
            Ver proyectos →
          </a>
        </>
      ) : (
        <>
          <span className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Agregar a</span>
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRoom(r.id)}
              aria-pressed={r.id === activo}
              className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
                r.id === activo
                  ? 'border-ember bg-ember text-ink'
                  : 'border-line text-cream-3 hover:border-cream/30 hover:text-cream-2'
              }`}
            >
              {r.nombre}
            </button>
          ))}
          {rooms.length === 0 && (
            <span className="text-[11.5px] text-cream-3">Crea un cuarto en Levantamiento.</span>
          )}
          <a href="#/admin/levantamiento" className="ml-auto text-[11.5px] text-ember hover:underline">
            Ir al levantamiento →
          </a>
        </>
      )}
    </div>
  )

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          [stats.total, 'productos en catálogo'],
          [`${conFoto}/${stats.total}`, 'con foto de fabricante'],
          [stats.thread, 'con Thread nativo'],
          [money(stats.avg), 'precio promedio de equipo'],
          [rooms.length, 'cuartos en el levantamiento'],
        ].map(([n, label]) => (
          <div key={label} className="rounded-xl border border-line bg-ink-2 px-4 py-3">
            <div className="display text-2xl text-cream">{n}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-cream-3">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Vista</span>
        {[
          ['galeria', 'Galería'],
          ['tabla', 'Tabla'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setVista(id)}
            aria-pressed={vista === id}
            className={`rounded-full border px-3 py-1 text-[11.5px] transition-colors ${
              vista === id
                ? 'border-ember bg-ember text-ink'
                : 'border-line text-cream-3 hover:border-cream/30 hover:text-cream-2'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-cream-3">
          {cuarto ? (
            <>
              Agregando a <strong className="text-cream-2">{cuarto.nombre}</strong>
            </>
          ) : (
            'Sin cuarto destino'
          )}
        </span>
      </div>

      {vista === 'tabla' ? (
        <>
          <div className="mt-3">{barra}</div>
          <Tabla cuarto={cuarto} />
        </>
      ) : (
        <CatalogBrowser
          modo="ops"
          barra={barra}
          accion={(d) => <Stepper device={d} cuarto={cuarto} />}
          precio={(d) => {
            const tier = LABOR_TIERS[laborTier(d)]
            return (
              <div className="leading-tight">
                <div className="text-[13px] tabular-nums text-cream-2">{money(refPrice(d))}</div>
                <div className="text-[10px] text-cream-3">+{money(tier.price)} instalación</div>
              </div>
            )
          }}
          precioFicha={(d) => {
            const tier = LABOR_TIERS[laborTier(d)]
            return (
              <div className="mt-2">
                <p className="text-[15px] text-ember">
                  <strong className="tabular-nums">{money(refPrice(d) + tier.price)}</strong>
                  <span className="ml-1.5 text-[11.5px] text-cream-3">instalado</span>
                </p>
                <p className="mt-0.5 text-[11.5px] text-cream-3">
                  Equipo {money(refPrice(d))} ({money(d.price[0])}–{money(d.price[1])}) · {tier.label}{' '}
                  {money(tier.price)} · {tier.mins} min
                </p>
              </div>
            )
          }}
          fichaExtra={(d) => (
            <>
              <div className="mt-4 rounded-xl border border-ember/25 bg-ember/[0.06] px-3.5 py-3">
                <p className="text-[10px] tracking-[0.12em] text-ember uppercase">Nota de instalación</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-cream-2">{notaDe(d)}</p>
              </div>
              <Proveedores device={d} />
              {cuarto && (
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-line bg-ink px-3.5 py-3">
                  <span className="text-[12px] text-cream-2">
                    Agregar a <strong className="text-cream">{cuarto.nombre}</strong>
                  </span>
                  <Stepper device={d} cuarto={cuarto} />
                </div>
              )}
            </>
          )}
        />
      )}
    </>
  )
}
