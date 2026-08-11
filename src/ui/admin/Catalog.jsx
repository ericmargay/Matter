import { useMemo, useState } from 'react'
import { CATEGORIES, DEVICES, ECOSYSTEMS, LINKS, TIERS, catalogStats } from '../../content/catalog'
import { LABOR_TIERS, laborTier, unitPrice } from '../../content/pricing'
import { useSurvey } from '../../store/survey'

/**
 * Catálogo de compras.
 *
 * El `+` no arma una lista suelta: mete la pieza al cuarto activo del
 * levantamiento. Así el catálogo y la cotización son la misma cosa y no hay
 * que capturar nada dos veces.
 */

const money = (n) => `$${n.toLocaleString('es-MX')}`

const ECO_SHORT = { apple: 'Apple', google: 'Google', alexa: 'Alexa', ha: 'HA' }

const LINK_LABEL = {
  thread: 'Thread',
  wifi: 'WiFi',
  zigbee: 'Zigbee',
  zwave: 'Z-Wave',
  matter: 'Matter/WiFi',
  ble: 'Bluetooth',
  poe: 'PoE',
  cable: 'Cableado',
}

// Thread y Zigbee se pintan distinto porque son los que forman malla: de un
// vistazo se ve si un pedido trae suficientes repetidores.
const LINK_TONE = {
  thread: 'text-thread border-thread/35 bg-thread/10',
  zigbee: 'text-ember-2 border-ember/30 bg-ember/10',
  poe: 'text-cream border-cream/25 bg-cream/8',
}

function Chip({ children, tone = '' }) {
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] whitespace-nowrap ${tone || 'border-line text-cream-3'}`}>
      {children}
    </span>
  )
}

/**
 * Etiqueta filtrante. Sustituye a los dropdowns: se ve todo el universo de
 * opciones de un golpe y se combinan sin abrir tres menús.
 */
function Tag({ active, onClick, children, count, tone }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] transition-all duration-200 ${
        active
          ? 'border-ember bg-ember text-ink'
          : `border-line text-cream-3 hover:border-cream/30 hover:text-cream-2 ${tone ?? ''}`
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

export default function Catalog() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [ecos, setEcos] = useState([]) // multi
  const [links, setLinks] = useState([]) // multi
  const [tier, setTier] = useState('')

  const rooms = useSurvey((s) => s.rooms)
  const activeRoom = useSurvey((s) => s.activeRoom) ?? rooms[0]?.id
  const setActiveRoom = useSurvey((s) => s.setActiveRoom)
  const bump = useSurvey((s) => s.bump)

  const stats = useMemo(() => catalogStats(), [])

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return DEVICES.filter((d) => {
      if (cat && d.cat !== cat) return false
      // varias etiquetas del mismo grupo suman (OR); grupos distintos filtran (AND)
      if (ecos.length && !ecos.some((e) => d.eco.includes(e))) return false
      if (links.length && !links.includes(d.link)) return false
      if (tier && d.tier !== tier) return false
      if (!needle) return true
      return `${d.name} ${d.brand} ${d.note}`.toLowerCase().includes(needle)
    })
  }, [q, cat, ecos, links, tier])

  const countBy = (fn) => DEVICES.filter(fn).length
  const clear = () => {
    setQ('')
    setCat('')
    setEcos([])
    setLinks([])
    setTier('')
  }
  const dirty = q || cat || ecos.length || links.length || tier

  const room = rooms.find((r) => r.id === activeRoom)

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          [stats.total, 'productos en catálogo'],
          [stats.thread, 'con Thread nativo'],
          [money(stats.avg), 'precio promedio'],
          ...ECOSYSTEMS.slice(0, 3).map((e) => [stats.byEco[e.id], `compatibles ${e.label}`]),
        ].map(([n, label]) => (
          <div key={label} className="rounded-xl border border-line bg-ink-2 px-4 py-3">
            <div className="display text-2xl text-cream">{n}</div>
            <div className="mt-0.5 text-[11px] text-cream-3">{label}</div>
          </div>
        ))}
      </div>

      {/* ── a qué cuarto se agregan las piezas ── */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-ink-2 px-3 py-2.5">
        <span className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Agregar a</span>
        {rooms.map((r) => (
          <Tag key={r.id} active={r.id === activeRoom} onClick={() => setActiveRoom(r.id)}>
            {r.nombre}
          </Tag>
        ))}
        {rooms.length === 0 && (
          <span className="text-[12px] text-cream-3">Crea un cuarto en la sección Levantamiento.</span>
        )}
        <a href="#/admin/levantamiento" className="ml-auto text-[11.5px] text-ember hover:underline">
          Ir al levantamiento →
        </a>
      </div>

      {/* ── filtros por etiqueta ── */}
      <div className="mt-4 rounded-xl border border-line bg-ink-2/50 px-3 py-2">
        <div className="flex items-center gap-2 pb-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto, marca o nota…"
            className="min-w-[14rem] flex-1 rounded-lg border border-line bg-ink px-3 py-1.5 text-[13px] text-cream outline-none placeholder:text-cream-3 focus:border-ember/60"
          />
          <span className="text-[12px] text-cream-3">{rows.length} de {DEVICES.length}</span>
          {dirty ? (
            <button onClick={clear} className="text-[11.5px] text-ember hover:underline">
              Limpiar
            </button>
          ) : null}
        </div>

        <TagRow label="Categoría">
          {CATEGORIES.map((c) => (
            <Tag
              key={c.id}
              active={cat === c.id}
              count={countBy((d) => d.cat === c.id)}
              onClick={() => setCat(cat === c.id ? '' : c.id)}
            >
              {c.label}
            </Tag>
          ))}
        </TagRow>

        <TagRow label="Enlace">
          {LINKS.map((l) => (
            <Tag
              key={l}
              active={links.includes(l)}
              count={countBy((d) => d.link === l)}
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
              count={countBy((d) => d.eco.includes(e.id))}
              onClick={() => toggle(ecos, setEcos, e.id)}
            >
              {e.label}
            </Tag>
          ))}
        </TagRow>

        <TagRow label="Paquete">
          {TIERS.map((t) => (
            <Tag key={t} active={tier === t} count={countBy((d) => d.tier === t)} onClick={() => setTier(tier === t ? '' : t)}>
              {t}
            </Tag>
          ))}
        </TagRow>
      </div>

      {/* ── tabla ── */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-ink-2 text-[10px] tracking-[0.12em] text-cream-3 uppercase">
            <tr>
              <th className="px-3 py-2.5 font-medium">Producto</th>
              <th className="px-3 py-2.5 font-medium">Enlace</th>
              <th className="px-3 py-2.5 font-medium">Ecosistemas</th>
              <th className="px-3 py-2.5 font-medium">Instalación</th>
              <th className="px-3 py-2.5 text-right font-medium">Equipo</th>
              <th className="px-3 py-2.5 font-medium">{room ? room.nombre : 'Cantidad'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const qty = room?.items?.[d.id] ?? 0
              const tierId = laborTier(d)
              return (
                <tr key={d.id} className="border-t border-line align-top transition-colors hover:bg-ink-2/60">
                  <td className="px-3 py-3">
                    <div className="text-[13px] text-cream">{d.name}</div>
                    <div className="text-[11px] text-cream-3">
                      {d.brand} · {CATEGORIES.find((c) => c.id === d.cat)?.label} · {d.source}
                    </div>
                    <div className="mt-1 max-w-[36rem] text-[11.5px] leading-snug text-cream-2">{d.note}</div>
                  </td>
                  <td className="px-3 py-3">
                    <Chip tone={LINK_TONE[d.link]}>{LINK_LABEL[d.link]}</Chip>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {d.eco.length === 4 ? (
                        <Chip tone="border-cream/25 text-cream-2">Todos</Chip>
                      ) : (
                        d.eco.map((e) => <Chip key={e}>{ECO_SHORT[e]}</Chip>)
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-[11.5px] text-cream-2">{LABOR_TIERS[tierId].label}</div>
                    <div className="text-[10.5px] text-cream-3">
                      {money(LABOR_TIERS[tierId].price)} · {LABOR_TIERS[tierId].mins} min
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-[12.5px] whitespace-nowrap text-cream-2">
                    {money(unitPrice(d))}
                    <div className="text-[10.5px] text-cream-3">
                      {money(d.price[0])}–{money(d.price[1])}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => bump(d.id, -1)}
                        disabled={!qty}
                        aria-label={`Quitar ${d.name}`}
                        className="h-6 w-6 rounded border border-line text-cream-2 transition-colors hover:border-cream/40 disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-[13px] tabular-nums">{qty}</span>
                      <button
                        onClick={() => bump(d.id, 1)}
                        disabled={!room}
                        aria-label={`Agregar ${d.name}`}
                        className="h-6 w-6 rounded border border-line text-cream-2 transition-colors hover:border-ember hover:bg-ember hover:text-ink disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-cream-3">
            Nada con esas etiquetas. Quita alguna o busca por marca.
          </p>
        )}
      </div>
    </>
  )
}
