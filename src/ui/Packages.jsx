import Section, { Head } from './Section'
import Reveal from './Reveal'
import { packages } from '../content/site'

export default function Packages() {
  return (
    <Section id="paquetes">
      <Head
        eyebrow="Paquetes"
        title="Precios con piso, no con letras chiquitas"
        lede="Los montos incluyen equipo, instalación, configuración y entrenamiento. Lo que cambia el precio hacia arriba es la obra: muros de concreto, falta de neutro y cableado nuevo."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {packages.map((p, i) => (
          <Reveal key={p.id} delay={i * 0.08}>
            <div
              className={`flex h-full flex-col rounded-2xl border p-8 transition-all duration-500 ${
                p.featured
                  ? 'border-ember/45 bg-gradient-to-b from-ember/8 to-transparent'
                  : 'border-line bg-ink-2 hover:border-cream/20'
              }`}
            >
              {p.featured && (
                <span className="mb-5 self-start rounded-full bg-ember px-2.5 py-1 text-[10px] font-medium tracking-[0.1em] text-ink uppercase">
                  El más pedido
                </span>
              )}

              <h3 className="display text-3xl">{p.name}</h3>
              <p className="mt-2 text-[13px] text-cream-3">{p.pitch}</p>

              <div className="mt-7 border-t border-line pt-6">
                <div className="display text-[clamp(1.75rem,3vw,2.25rem)] text-cream">{p.price}</div>
                <div className="mt-1 text-[11px] text-cream-3">{p.unit}</div>
              </div>

              <ul className="mt-7 flex-1 space-y-3">
                {p.includes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] leading-snug text-cream-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" className="mt-1 flex-none" aria-hidden="true">
                      <path
                        d="M2.5 7.5l3 3 6-7"
                        fill="none"
                        stroke={p.featured ? 'var(--color-ember)' : 'var(--color-cream-3)'}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="#contacto"
                className={`mt-9 rounded-full py-3.5 text-center text-[14px] font-medium transition-all duration-400 ${
                  p.featured
                    ? 'bg-ember text-ink hover:bg-ember-2'
                    : 'border border-cream/20 text-cream hover:border-cream/50'
                }`}
              >
                {p.id === 'medida' ? 'Hablar del proyecto' : 'Empezar por el levantamiento'}
              </a>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <p className="mt-8 max-w-[60ch] text-[12px] leading-relaxed text-cream-3">
          Precios en pesos mexicanos, sin IVA, vigentes en zona metropolitana. Fuera del área se cobra viático. El
          levantamiento se descuenta del total si instalas con nosotros.
        {' '}
          <a href="#/cotizacion?d=demo" className="text-ember underline-offset-2 hover:underline">
            Así se ve una cotización nuestra →
          </a></p>
      </Reveal>
    </Section>
  )
}
