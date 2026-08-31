import { useState } from 'react'

import { GRUPOS, ITEMS, TIENDAS, costoArranque } from '../../content/taller'

/**
 * El material y la herramienta con que se instala.
 *
 * Va aparte del catálogo de productos porque se compra distinto: el equipo se
 * le vende al cliente pieza por pieza, esto se compra una vez y se amortiza en
 * veinte obras. Mezclarlos llevaba a cobrarle el multímetro al cliente.
 */
const money = (n) => `$${Math.round(n).toLocaleString('es-MX')}`

export default function Taller() {
  const [abierto, setAbierto] = useState(GRUPOS[0].id)
  const [soloHerramienta, setSolo] = useState(false)

  const g = GRUPOS.find((x) => x.id === abierto) ?? GRUPOS[0]
  const items = soloHerramienta ? g.items.filter((i) => i.herramienta) : g.items
  const arranque = costoArranque(soloHerramienta)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header>
        <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Operaciones</p>
        <h1 className="display mt-1 text-[26px] leading-tight text-cream sm:text-[30px]">
          Con qué se instala
        </h1>
        <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-cream-2">
          El criterio para que algo esté aquí: que su ausencia haya arruinado una instalación. No es una lista de
          deseos de ferretería — es lo que hay que llevar en la caja para no volver al día siguiente.
        </p>
        <p className="mt-2 text-[12px] text-cream-3">
          Armar todo: <span className="text-cream-2">{money(arranque.min)} – {money(arranque.max)}</span>
          {' · '}
          {ITEMS.length} referencias · precios de la CDMX, agosto 2026
        </p>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {GRUPOS.map((x) => (
          <button
            key={x.id}
            onClick={() => setAbierto(x.id)}
            className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
              abierto === x.id ? 'border-ember bg-ember text-ink' : 'border-line text-cream-2 hover:border-cream/40'
            }`}
          >
            {x.titulo}
          </button>
        ))}
        <button
          onClick={() => setSolo((v) => !v)}
          className={`ml-auto rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
            soloHerramienta ? 'border-thread bg-thread/15 text-thread-2' : 'border-line text-cream-3 hover:border-cream/40'
          }`}
        >
          {soloHerramienta ? 'Solo herramienta' : 'Todo'}
        </button>
      </div>

      <section className="mt-5">
        <h2 className="display text-[19px] text-cream">{g.titulo}</h2>
        <p className="mt-1.5 max-w-prose text-[12.5px] leading-relaxed text-cream-2">{g.entrada}</p>

        <div className="mt-3 space-y-1.5">
          {items.map((i) => (
            <div key={i.id} className="rounded-xl border border-line bg-ink-2 px-3.5 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[13.5px] text-cream">
                  {i.nombre}
                  {i.herramienta && <span className="ml-1.5 text-[10px] text-thread">herramienta</span>}
                </p>
                <p className="text-[12.5px] tabular-nums text-cream-2">
                  {money(i.precio[0])} – {money(i.precio[1])}
                  <span className="ml-1 text-[10.5px] text-cream-3">/ {i.unidad}</span>
                </p>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-cream-2">{i.porque}</p>
              {i.ojo && (
                <p className="mt-1 rounded-lg border border-ember/30 bg-ember/[0.06] px-2 py-1.5 text-[11.5px] leading-snug text-ember-2">
                  {i.ojo}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {i.donde.map((d) => (
                  <span key={d} className="rounded border border-line px-1.5 py-0.5 text-[10.5px] text-cream-3">
                    {TIENDAS[d]?.nombre ?? d}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 border-t border-line pt-5">
        <h2 className="display text-[17px] text-cream">Dónde se compra</h2>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {Object.entries(TIENDAS).map(([id, t]) => (
            <div key={id} className="rounded-xl border border-line px-3 py-2.5">
              <p className="text-[12.5px] text-cream">{t.nombre}</p>
              <p className="text-[10.5px] text-cream-3">{t.tipo} · {t.donde}</p>
              <p className="mt-1 text-[11.5px] leading-snug text-cream-2">{t.nota}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
