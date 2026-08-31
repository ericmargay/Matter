import { useMemo, useState } from 'react'
import { CATEGORIES, DEVICES } from '../../content/catalog'
import { CANALES, PROVEEDORES, canalDe, linksDeCompra, proveedoresDe } from '../../content/opsCatalog'

/**
 * Proveedores.
 *
 * Cuatro y no más, a propósito: son con los que hoy sabemos tiempos, garantía
 * y a quién llamarle cuando algo sale mal. Dos marketplaces para marca
 * terminada y dos mostradores del Centro para el material que hace falta el
 * mismo día en obra.
 *
 * Los enlaces abren una BÚSQUEDA, no una ficha. Es deliberado: Amazon y
 * MercadoLibre rotan sus URLs cada temporada y además bloquean la consulta
 * automática, así que un enlace guardado se rompe en semanas. Una búsqueda con
 * los términos correctos sigue sirviendo dentro de un año.
 */

const money = (n) => `$${Math.round(n).toLocaleString('es-MX')}`

function Ficha({ proveedor, piezas, primeras }) {
  return (
    <article className="rounded-xl border border-line bg-ink-2 p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-[15px] text-cream">{proveedor.nombre}</h3>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-cream-3">
          {proveedor.tipo}
        </span>
        <a
          href={proveedor.sitio}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[11.5px] text-ember hover:underline"
        >
          Abrir sitio →
        </a>
      </div>

      <p className="mt-1.5 text-[11.5px] text-cream-3">{proveedor.entrega}</p>
      <p className="mt-2.5 text-[12.5px] leading-relaxed text-cream-2">{proveedor.nota}</p>

      <p className="mt-2.5 rounded-lg border border-ember/25 bg-ember/[0.06] px-2.5 py-2 text-[11.5px] leading-relaxed text-cream-2">
        <strong className="text-ember">Ojo:</strong> {proveedor.ojo}
      </p>

      <p className="mt-3 border-t border-line pt-2.5 text-[11.5px] text-cream-3">
        Sugerido para <strong className="text-cream-2">{piezas}</strong> de {DEVICES.length} productos
        {primeras > 0 && <> · primera opción en {primeras}</>}.
      </p>
    </article>
  )
}

export default function Suppliers() {
  const [q, setQ] = useState('')
  const [prov, setProv] = useState('')

  /**
   * Dos cuentas por proveedor: en cuántos productos aparece como opción y en
   * cuántos es el primero al que hay que llamar. Las tiendas del Centro casi
   * nunca son la primera opción —no venden marca terminada— pero cubren buena
   * parte del catálogo como respaldo, y con una sola cuenta eso no se veía.
   */
  const cobertura = useMemo(() => {
    const total = Object.fromEntries(PROVEEDORES.map((p) => [p.id, 0]))
    const primero = Object.fromEntries(PROVEEDORES.map((p) => [p.id, 0]))
    for (const d of DEVICES) {
      const lista = proveedoresDe(d)
      lista.forEach((p, i) => {
        total[p.id]++
        if (i === 0) primero[p.id]++
      })
    }
    return { total, primero }
  }, [])

  const porCanal = useMemo(() => {
    const c = {}
    for (const d of DEVICES) c[canalDe(d)] = (c[canalDe(d)] ?? 0) + 1
    return c
  }, [])

  const filas = useMemo(() => {
    const n = q.trim().toLowerCase()
    return DEVICES.filter((d) => {
      if (prov && !proveedoresDe(d).some((p) => p.id === prov)) return false
      if (!n) return true
      return `${d.name} ${d.brand}`.toLowerCase().includes(n)
    })
  }, [q, prov])

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="display text-[24px] text-cream">Proveedores</h1>
      <p className="mt-0.5 max-w-[70ch] text-[12px] leading-relaxed text-cream-3">
        Con quién se surte cada cosa hoy. Cuando se abra cuenta con un distribuidor formal, se agrega aquí y
        el catálogo lo empieza a sugerir solo.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {PROVEEDORES.map((p) => (
          <Ficha
            key={p.id}
            proveedor={p}
            piezas={cobertura.total[p.id]}
            primeras={cobertura.primero[p.id]}
          />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {Object.entries(CANALES).map(([id, c]) => (
          <div key={id} className="rounded-xl border border-line bg-ink-2 px-4 py-3">
            <div className="display text-2xl text-cream">{porCanal[id] ?? 0}</div>
            <div className="mt-0.5 text-[11px] text-cream-2">{c.label}</div>
            <div className="text-[10.5px] leading-snug text-cream-3">{c.hint}</div>
          </div>
        ))}
      </div>

      {/* ── qué se compra dónde ── */}
      <h2 className="mt-8 text-[11px] tracking-[0.14em] text-cream-2 uppercase">Qué se compra dónde</h2>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto o marca…"
          className="min-w-[14rem] flex-1 rounded-lg border border-line bg-ink-2 px-3 py-1.5 text-[13px] text-cream outline-none placeholder:text-cream-3 focus:border-ember/60"
        />
        {PROVEEDORES.map((p) => (
          <button
            key={p.id}
            onClick={() => setProv(prov === p.id ? '' : p.id)}
            aria-pressed={prov === p.id}
            className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
              prov === p.id
                ? 'border-ember bg-ember text-ink'
                : 'border-line text-cream-3 hover:border-cream/30 hover:text-cream-2'
            }`}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead className="bg-ink-2 text-[10px] tracking-[0.12em] text-cream-3 uppercase">
            <tr>
              <th className="px-3 py-2.5 font-medium">Producto</th>
              <th className="px-3 py-2.5 font-medium">Canal</th>
              <th className="px-3 py-2.5 text-right font-medium">Equipo</th>
              <th className="px-3 py-2.5 font-medium">Buscar en</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((d) => (
              <tr key={d.id} className="border-t border-line transition-colors hover:bg-ink-2/60">
                <td className="px-3 py-2.5">
                  <div className="text-[13px] text-cream">{d.name}</div>
                  <div className="text-[10.5px] text-cream-3">
                    {d.brand} · {CATEGORIES.find((c) => c.id === d.cat)?.label}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-[11.5px] text-cream-2">{CANALES[canalDe(d)].label}</td>
                <td className="px-3 py-2.5 text-right text-[12.5px] whitespace-nowrap text-cream-2">
                  {money((d.price[0] + d.price[1]) / 2)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {linksDeCompra(d).map((p) => (
                      <a
                        key={p.id}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-line px-1.5 py-0.5 text-[10.5px] text-cream-3 transition-colors hover:border-ember hover:text-ember"
                      >
                        {p.nombre}
                      </a>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filas.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-cream-3">Nada con ese filtro.</p>
        )}
      </div>
    </div>
  )
}
