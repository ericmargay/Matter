import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORIES, DEVICES, ECOSYSTEMS, LINKS, LINK_LABEL, TIERS } from '../../content/catalog'
import DevicePhoto, { PhotoFrame } from './DevicePhoto'
import DeviceSheet from './DeviceSheet'

/**
 * El catálogo, en galería.
 *
 * Antes esto era una tabla de 91 renglones: excelente para comparar precio
 * contra precio, pésima para decidir. Un catálogo de aparatos se recorre con
 * los ojos —"ese es el que quiero en la sala"— y sin foto no hay forma.
 *
 * La navegación es la misma que ya funciona en MenuOS: un riel de categorías
 * pegado arriba que va marcando dónde vas conforme bajas, y la ficha completa
 * en un panel lateral. Lo que cambia es qué se dice de cada producto: aquí no
 * hay ingredientes ni alérgenos, hay protocolo, corriente y con qué cerebros
 * sirve.
 *
 * El mismo componente sirve al cliente y a operaciones. La diferencia llega
 * por props —`accion`, `precio`, `fichaExtra`— para que el catálogo público no
 * tenga que importar costos ni proveedores.
 */

function Chip({ children, tone = '' }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[10px] whitespace-nowrap ${tone || 'border-line text-cream-3'}`}
    >
      {children}
    </span>
  )
}

/** Thread y Zigbee se pintan distinto: son los que forman malla. */
const LINK_TONE = {
  thread: 'text-thread border-thread/35 bg-thread/10',
  zigbee: 'text-ember-2 border-ember/30 bg-ember/10',
  poe: 'text-cream border-cream/25 bg-cream/8',
}

function Tag({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-all duration-200 ${
        active
          ? 'border-ember bg-ember text-ink'
          : 'border-line text-cream-3 hover:border-cream/30 hover:text-cream-2'
      }`}
    >
      {children}
      {count != null && (
        <span className={`text-[10px] tabular-nums ${active ? 'text-ink/60' : 'text-cream-3/70'}`}>{count}</span>
      )}
    </button>
  )
}

function TagRow({ label, children }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1.5">
      <span className="w-[5.5rem] flex-none text-[10px] tracking-[0.12em] text-cream-3 uppercase">{label}</span>
      {children}
    </div>
  )
}

/* ── tarjeta ──────────────────────────────────────────────────── */

function Card({ device, onAbrir, accion, precio }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-ink-2 transition-colors hover:border-cream/25">
      <button
        onClick={onAbrir}
        className="text-left"
        aria-label={`Ver ficha de ${device.name}`}
      >
        <PhotoFrame className="aspect-[4/3] w-full">
          <DevicePhoto
            device={device}
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 16rem"
            className="transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </PhotoFrame>

        <div className="px-3 pt-2.5">
          <p className="text-[10px] tracking-[0.1em] text-cream-3 uppercase">{device.brand}</p>
          <h3 className="mt-0.5 text-[13px] leading-snug text-cream">{device.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Chip tone={LINK_TONE[device.link]}>{LINK_LABEL[device.link]}</Chip>
            {device.eco.length === ECOSYSTEMS.length && <Chip>Todos los ecosistemas</Chip>}
          </div>
        </div>
      </button>

      <div className="mt-auto flex items-end justify-between gap-2 px-3 pt-2.5 pb-3">
        {precio}
        {accion}
      </div>
    </article>
  )
}

/* ── navegador ────────────────────────────────────────────────── */

export default function CatalogBrowser({
  /** 'cliente' esconde los filtros de operación (enlace, paquete). */
  modo = 'cliente',
  /** Barra que se fija bajo el riel — en operaciones, el cuarto destino. */
  barra,
  /** Botones de la tarjeta: `(device) => ReactNode`. */
  accion,
  /** Precio de la tarjeta: `(device) => ReactNode`. */
  precio,
  /** Precio dentro de la ficha: `(device) => ReactNode`. */
  precioFicha,
  /** Bloque extra de la ficha: `(device) => ReactNode`. */
  fichaExtra,
}) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [ecos, setEcos] = useState([])
  const [links, setLinks] = useState([])
  const [tier, setTier] = useState('')
  const [abierto, setAbierto] = useState(null)

  const riel = useRef(null)
  const [activa, setActiva] = useState(CATEGORIES[0]?.id ?? '')

  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const filtrados = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return DEVICES.filter((d) => {
      if (cat && d.cat !== cat) return false
      // varias etiquetas del mismo grupo suman (OR); grupos distintos filtran (AND)
      if (ecos.length && !ecos.some((e) => d.eco.includes(e))) return false
      if (links.length && !links.includes(d.link)) return false
      if (tier && d.tier !== tier) return false
      if (!needle) return true
      return `${d.name} ${d.brand} ${d.pitch}`.toLowerCase().includes(needle)
    })
  }, [q, cat, ecos, links, tier])

  const filtrando = !!(q.trim() || cat || ecos.length || links.length || tier)

  /* Sin filtros el catálogo se lee por secciones y el riel navega entre ellas;
     con filtros puestos eso estorba —quedarían encabezados de una pieza— así
     que los resultados caen en una sola cuadrícula. */
  const secciones = useMemo(
    () =>
      filtrando
        ? []
        : CATEGORIES.map((c) => ({ cat: c, items: filtrados.filter((d) => d.cat === c.id) })).filter(
            (s) => s.items.length > 0,
          ),
    [filtrados, filtrando],
  )

  // El riel marca la categoría que se está viendo
  useEffect(() => {
    if (filtrando) return
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setActiva(e.target.id.replace('cat-', ''))
      },
      { rootMargin: '-15% 0px -75% 0px' },
    )
    for (const s of secciones) {
      const el = document.getElementById(`cat-${s.cat.id}`)
      if (el) obs.observe(el)
    }
    return () => obs.disconnect()
  }, [secciones, filtrando])

  // …y el chip marcado se mantiene a la vista dentro del riel
  useEffect(() => {
    riel.current?.querySelector('[data-activo="true"]')?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [activa])

  const limpiar = () => {
    setQ('')
    setCat('')
    setEcos([])
    setLinks([])
    setTier('')
  }

  const irA = (id) => document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // flechas del teclado para recorrer productos sin cerrar la ficha
  const mover = (paso) => {
    if (!abierto) return
    const i = filtrados.findIndex((d) => d.id === abierto.id)
    const sig = filtrados[i + paso]
    if (sig) setAbierto(sig)
  }

  const cuenta = (fn) => DEVICES.filter(fn).length

  return (
    <>
      {/* ── buscador + riel de categorías ── */}
      <div className="sticky top-0 z-20 -mx-3 bg-ink/92 px-3 pt-3 pb-2 backdrop-blur-xl sm:-mx-5 sm:px-5">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por producto, marca o para qué sirve…"
            className="min-w-0 flex-1 rounded-lg border border-line bg-ink-2 px-3 py-2 text-[13px] text-cream outline-none placeholder:text-cream-3 focus:border-ember/60"
          />
          <span className="hidden text-[12px] whitespace-nowrap text-cream-3 sm:inline">
            {filtrados.length} de {DEVICES.length}
          </span>
          {filtrando && (
            <button onClick={limpiar} className="text-[11.5px] whitespace-nowrap text-ember hover:underline">
              Limpiar
            </button>
          )}
        </div>

        <nav aria-label="Categorías" className="mt-2 -mx-1 overflow-x-auto px-1 pb-0.5">
          <div ref={riel} className="flex w-max gap-1.5">
            {CATEGORIES.map((c) => {
              const marcado = cat ? cat === c.id : !filtrando && activa === c.id
              return (
                <button
                  key={c.id}
                  data-activo={marcado}
                  onClick={() => (filtrando ? setCat(cat === c.id ? '' : c.id) : irA(c.id))}
                  className={`rounded-full border px-3 py-1.5 text-[11.5px] whitespace-nowrap transition-colors ${
                    marcado
                      ? 'border-ember bg-ember text-ink'
                      : 'border-line text-cream-3 hover:border-cream/30 hover:text-cream-2'
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </nav>

        {barra}
      </div>

      {/* ── filtros finos: solo operaciones ── */}
      {modo === 'ops' && (
        <div className="mt-3 hidden rounded-xl border border-line bg-ink-2/50 px-3 py-1.5 sm:block">
          <TagRow label="Enlace">
            {LINKS.map((l) => (
              <Tag
                key={l}
                active={links.includes(l)}
                count={cuenta((d) => d.link === l)}
                onClick={() => toggle(links, setLinks, l)}
              >
                {LINK_LABEL[l]}
              </Tag>
            ))}
          </TagRow>
          <TagRow label="Ecosistema">
            {ECOSYSTEMS.map((e) => (
              <Tag
                key={e.id}
                active={ecos.includes(e.id)}
                count={cuenta((d) => d.eco.includes(e.id))}
                onClick={() => toggle(ecos, setEcos, e.id)}
              >
                {e.label}
              </Tag>
            ))}
          </TagRow>
          <TagRow label="Paquete">
            {TIERS.map((t) => (
              <Tag
                key={t}
                active={tier === t}
                count={cuenta((d) => d.tier === t)}
                onClick={() => setTier(tier === t ? '' : t)}
              >
                {t}
              </Tag>
            ))}
          </TagRow>
        </div>
      )}

      {modo === 'cliente' && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Funciona con</span>
          {ECOSYSTEMS.map((e) => (
            <Tag
              key={e.id}
              active={ecos.includes(e.id)}
              count={cuenta((d) => d.eco.includes(e.id))}
              onClick={() => toggle(ecos, setEcos, e.id)}
            >
              {e.label}
            </Tag>
          ))}
        </div>
      )}

      {/* ── cuadrícula ── */}
      {filtrando ? (
        <Grid items={filtrados} onAbrir={setAbierto} accion={accion} precio={precio} />
      ) : (
        secciones.map((s) => (
          <section key={s.cat.id} id={`cat-${s.cat.id}`} className="scroll-mt-32 pt-7">
            <div className="flex items-baseline gap-3">
              <h2 className="display text-[19px] text-cream">{s.cat.label}</h2>
              <span className="text-[11.5px] text-cream-3">{s.cat.hint}</span>
            </div>
            <Grid items={s.items} onAbrir={setAbierto} accion={accion} precio={precio} />
          </section>
        ))
      )}

      {filtrados.length === 0 && (
        <p className="px-4 py-16 text-center text-[13px] text-cream-3">
          Nada con esas etiquetas. Quita alguna o busca por marca.
        </p>
      )}

      {abierto && (
        <DeviceSheet
          device={abierto}
          onCerrar={() => setAbierto(null)}
          siguiente={() => mover(1)}
          anterior={() => mover(-1)}
          precio={precioFicha?.(abierto)}
          extra={fichaExtra?.(abierto)}
        />
      )}
    </>
  )
}

function Grid({ items, onAbrir, accion, precio }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((d) => (
        <Card
          key={d.id}
          device={d}
          onAbrir={() => onAbrir(d)}
          accion={accion?.(d)}
          precio={precio?.(d)}
        />
      ))}
    </div>
  )
}
