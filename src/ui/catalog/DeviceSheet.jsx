import { useEffect, useRef } from 'react'
import { CATEGORIES, ECOSYSTEMS, LINK_CLIENTE, LINK_LABEL, POWER_LABEL } from '../../content/catalog'
import { creditOf } from '../../content/photos'
import DevicePhoto, { PhotoFrame } from './DevicePhoto'

/**
 * La ficha de un producto, en panel lateral.
 *
 * Es la misma ficha para el cliente y para operaciones. Lo que cambia entre
 * los dos NO se decide aquí con un `if`: llega como `precio` y `extra` desde
 * quien la usa. Así el catálogo público jamás importa el módulo de costos ni
 * el de proveedores, y no hay forma de que se cuelen al bundle publicado.
 */

const ECO_LABEL = Object.fromEntries(ECOSYSTEMS.map((e) => [e.id, e.label]))

function Dato({ label, children }) {
  return (
    <div className="border-t border-line py-2.5">
      <dt className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">{label}</dt>
      <dd className="mt-0.5 text-[12.5px] leading-snug text-cream-2">{children}</dd>
    </div>
  )
}

export default function DeviceSheet({ device, onCerrar, precio, extra, siguiente, anterior }) {
  const panel = useRef(null)

  // Escape cierra y el foco entra al panel: la ficha se abre con clic pero
  // también se navega con el teclado cuando se están capturando cantidades.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar()
      else if (e.key === 'ArrowRight') siguiente?.()
      else if (e.key === 'ArrowLeft') anterior?.()
    }
    document.addEventListener('keydown', onKey)
    panel.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onCerrar, siguiente, anterior])

  const cat = CATEGORIES.find((c) => c.id === device.cat)
  const credito = creditOf(device.id)

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-[2px]"
        onClick={onCerrar}
        aria-hidden="true"
      />
      <aside
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={device.name}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-2xl border border-line bg-ink-2 outline-none sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[26rem] sm:rounded-none sm:rounded-l-2xl sm:border-y-0 sm:border-r-0"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink-2/95 px-4 py-2.5 backdrop-blur">
          <span className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">{cat?.label}</span>
          <button
            onClick={onCerrar}
            aria-label="Cerrar ficha"
            className="rounded-lg px-2 py-1 text-[16px] leading-none text-cream-3 transition-colors hover:text-cream"
          >
            ×
          </button>
        </div>

        <PhotoFrame className="aspect-[4/3] w-full">
          <DevicePhoto device={device} eager sizes="26rem" />
        </PhotoFrame>

        <div className="px-4 pt-4 pb-6">
          <p className="text-[11px] tracking-[0.1em] text-ember uppercase">{device.brand}</p>
          <h2 className="display mt-1 text-[22px] leading-tight text-cream">{device.name}</h2>

          {precio}

          <p className="mt-3 text-[13px] leading-relaxed text-cream-2">{device.pitch}</p>

          <dl className="mt-4">
            <Dato label="Cómo se conecta">
              <span className="text-cream">{LINK_LABEL[device.link]}</span> — {LINK_CLIENTE[device.link]}
            </Dato>
            <Dato label="Corriente">{POWER_LABEL[device.power]}</Dato>
            <Dato label="Funciona con">
              {device.eco.length === ECOSYSTEMS.length
                ? 'Apple Home, Google Home, Alexa y Home Assistant'
                : device.eco.map((e) => ECO_LABEL[e]).join(', ')}
            </Dato>
            <Dato label="Paquete">{device.tier}</Dato>
          </dl>

          {extra}

          {credito && (
            <p className="mt-5 border-t border-line pt-2.5 text-[10px] leading-relaxed text-cream-3/70">
              Foto: {credito.credito}
            </p>
          )}
        </div>
      </aside>
    </>
  )
}
