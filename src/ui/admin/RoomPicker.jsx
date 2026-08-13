import { useEffect } from 'react'
import { refPrice } from '../../content/catalog'
import { CANALES, canalDe, linksDeCompra, notaDe } from '../../content/opsCatalog'
import { LABOR_TIERS, laborTier } from '../../content/pricing'
import { useSurvey } from '../../store/survey'
import CatalogBrowser from '../catalog/CatalogBrowser'

/**
 * Agregar equipo a UN cuarto, sin salirse del levantamiento.
 *
 * El recorrido viejo obligaba a ir al catálogo, acordarse de marcar el cuarto
 * destino en una barra de arriba y regresar. Levantando en casa del cliente eso
 * se equivoca: se terminaba cargando la recámara con lo de la cocina.
 *
 * Aquí el cuarto no se elige — ya está elegido, es el que dice el título — y
 * cada `+` cae por fuerza en él. Es la diferencia entre capturar por producto y
 * capturar por habitación, que es como se recorre una casa.
 */

const money = (n) => `$${Math.round(n).toLocaleString('es-MX')}`

function Stepper({ device, room }) {
  const bump = useSurvey((s) => s.bump)
  const qty = room.items?.[device.id] ?? 0
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => bump(device.id, -1, room.id)}
        disabled={!qty}
        aria-label={`Quitar ${device.name} de ${room.nombre}`}
        className="h-6 w-6 rounded border border-line text-cream-2 transition-colors hover:border-cream/40 disabled:opacity-25"
      >
        −
      </button>
      <span className={`w-5 text-center text-[12.5px] tabular-nums ${qty ? 'text-ember' : 'text-cream-3'}`}>
        {qty}
      </span>
      <button
        onClick={() => bump(device.id, 1, room.id)}
        aria-label={`Agregar ${device.name} a ${room.nombre}`}
        className="h-6 w-6 rounded border border-line text-cream-2 transition-colors hover:border-ember hover:bg-ember hover:text-ink"
      >
        +
      </button>
    </div>
  )
}

export default function RoomPicker({ room, onCerrar }) {
  // el fondo no debe desplazarse detrás del selector
  useEffect(() => {
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = antes
      document.removeEventListener('keydown', onKey)
    }
  }, [onCerrar])

  const piezas = Object.values(room.items ?? {}).reduce((a, b) => a + b, 0)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
        <div>
          <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Agregando equipo a</p>
          <h2 className="display text-[20px] text-cream">{room.nombre}</h2>
        </div>
        <span className="rounded-full border border-line px-2.5 py-1 text-[11.5px] text-cream-3">
          {room.m2} m² · {room.tipo}
        </span>
        <span className="text-[12px] text-cream-2">
          {piezas} {piezas === 1 ? 'pieza' : 'piezas'} en este cuarto
        </span>
        <button
          onClick={onCerrar}
          className="ml-auto rounded-lg bg-ember px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-ember-2"
        >
          Listo
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-16">
        <CatalogBrowser
          modo="ops"
          accion={(d) => <Stepper device={d} room={room} />}
          precio={(d) => (
            <div className="leading-tight">
              <div className="text-[13px] tabular-nums text-cream-2">{money(refPrice(d))}</div>
              <div className="text-[10px] text-cream-3">
                +{money(LABOR_TIERS[laborTier(d)].price)} instalación
              </div>
            </div>
          )}
          precioFicha={(d) => {
            const tier = LABOR_TIERS[laborTier(d)]
            return (
              <div className="mt-2">
                <p className="text-[15px] text-ember">
                  <strong className="tabular-nums">{money(refPrice(d) + tier.price)}</strong>
                  <span className="ml-1.5 text-[11.5px] text-cream-3">instalado</span>
                </p>
                <p className="mt-0.5 text-[11.5px] text-cream-3">
                  Equipo {money(refPrice(d))} · {tier.label} {money(tier.price)} · {tier.mins} min
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

              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-line bg-ink px-3.5 py-3">
                <span className="text-[12px] text-cream-2">
                  Agregar a <strong className="text-cream">{room.nombre}</strong>
                </span>
                <Stepper device={d} room={room} />
              </div>

              <div className="mt-4 rounded-xl border border-line bg-ink px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Dónde se consigue</p>
                  <span className="text-[10.5px] text-cream-3">{CANALES[canalDe(d)].label}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {linksDeCompra(d).map((p) => (
                    <a
                      key={p.id}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-line px-2 py-1 text-[11px] text-cream-3 transition-colors hover:border-ember hover:text-ember"
                    >
                      {p.nombre} →
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}
        />
      </div>
    </div>
  )
}
