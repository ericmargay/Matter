import { DEVICES, catalogStats } from '../content/catalog'
import { brand } from '../content/site'
import CatalogBrowser from './catalog/CatalogBrowser'
import Logo from './Logo'

/**
 * Catálogo para clientes — #/catalogo
 *
 * Es la página que se manda por WhatsApp cuando alguien pregunta "¿y qué
 * puedo poner?". A propósito no es una tienda: no hay carrito, no hay stock y
 * el precio que se muestra es el del equipo, sin instalación, porque eso se
 * cotiza contra el levantamiento y no contra una lista.
 *
 * Vive en el sitio público y solo importa `content/catalog.js`. La nota del
 * instalador, el canal de proveedor y el costo de mano de obra están en otros
 * módulos que esta página nunca toca — así no viajan al navegador de nadie.
 */

const money = (n) => `$${Math.round(n).toLocaleString('es-MX')}`

/** Precio del equipo, siempre como "desde": el rango real depende del día. */
const desde = (d) => money(d.price[0])

function PrecioTarjeta({ device }) {
  return (
    <div className="leading-tight">
      <div className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Equipo desde</div>
      <div className="text-[13.5px] tabular-nums text-cream-2">{desde(device)}</div>
    </div>
  )
}

export default function Catalogo() {
  const stats = catalogStats()

  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4">
          <a href="#/" className="flex items-center gap-2.5 text-cream">
            <Logo size={22} spin={false} />
            <span className="display text-[19px]">{brand.name}</span>
          </a>
          <nav className="flex items-center gap-4 text-[13px]">
            <a href="#/" className="text-cream-3 transition-colors hover:text-cream">
              El sitio
            </a>
            <a
              href="#/#contacto"
              className="rounded-full border border-cream/20 px-4 py-1.5 text-cream transition-all hover:border-ember hover:bg-ember hover:text-ink"
            >
              Agenda tu levantamiento
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 pb-20">
        <section className="py-10">
          <p className="eyebrow">Catálogo</p>
          <h1 className="display mt-2 max-w-[18ch] text-[clamp(2rem,5vw,3.4rem)] leading-[1.02] text-cream">
            Todo lo que le podemos poner a tu casa.
          </h1>
          <p className="mt-4 max-w-[58ch] text-[14px] leading-relaxed text-cream-2">
            {stats.total} productos que instalamos y damos soporte. No vendemos aparatos sueltos: hacemos el
            levantamiento, escogemos contigo lo que de verdad te sirve y lo dejamos funcionando. El precio que
            ves es el del equipo — la instalación se cotiza aparte, después de ver tu casa.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [stats.total, 'productos en catálogo'],
              [stats.thread, 'refuerzan la malla de la casa'],
              [stats.byEco.apple, 'funcionan con Apple Home'],
              [stats.byEco.ha, 'funcionan sin depender de la nube'],
            ].map(([n, label]) => (
              <div key={label} className="rounded-xl border border-line bg-ink-2 px-4 py-3">
                <div className="display text-2xl text-cream">{n}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-cream-3">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <CatalogBrowser
          modo="cliente"
          precio={(d) => <PrecioTarjeta device={d} />}
          precioFicha={(d) => (
            <p className="mt-2 text-[15px] text-ember">
              Equipo desde <strong className="tabular-nums">{desde(d)}</strong>
              <span className="ml-1.5 text-[11.5px] text-cream-3">+ instalación</span>
            </p>
          )}
          fichaExtra={() => (
            <div className="mt-5 rounded-xl border border-line bg-ink px-3.5 py-3">
              <p className="text-[12px] leading-relaxed text-cream-2">
                ¿Te sirve para tu casa? En el levantamiento revisamos si tu instalación lo aguanta y cuántos
                hacen falta de verdad.
              </p>
              <a
                href="#/#contacto"
                className="mt-2.5 inline-block rounded-lg bg-ember px-3 py-2 text-[12.5px] font-medium text-ink transition-colors hover:bg-ember-2"
              >
                Agenda tu levantamiento
              </a>
            </div>
          )}
        />
      </main>

      <footer className="border-t border-line px-5 py-10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 text-[11px] text-cream-3 sm:flex-row sm:justify-between">
          <span>
            Precios de referencia en pesos con IVA, sujetos a disponibilidad. {DEVICES.length} productos ·
            actualizado por trimestre.
          </span>
          <span>
            Matter™ y Thread™ son marcas de la Connectivity Standards Alliance y del Thread Group. No estamos
            afiliados a Apple, Google ni Amazon.
          </span>
        </div>
      </footer>
    </div>
  )
}
