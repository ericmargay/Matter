import Section, { Head } from './Section'
import Reveal from './Reveal'
import { ecosystems } from '../content/site'
import { useStore } from '../store/store'

export default function Ecosystems() {
  const active = useStore((s) => s.ecosystem)
  const setEcosystem = useStore((s) => s.setEcosystem)
  const current = ecosystems.find((e) => e.id === active) ?? ecosystems[0]

  return (
    <Section id="ecosistemas">
      <Head
        eyebrow="Elegir cerebro"
        title="Un ecosistema, no cuatro apps"
        lede="Puedes mezclar marcas de dispositivos todo lo que quieras. Lo que no conviene mezclar es el control: se elige una casa y un cerebro. Esta es la conversación honesta sobre cuál te toca."
      />

      <Reveal className="mt-14">
        <div className="flex flex-wrap gap-2">
          {ecosystems.map((e) => {
            const on = e.id === active
            return (
              <button
                key={e.id}
                onClick={() => setEcosystem(e.id)}
                aria-pressed={on}
                className={`group flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-[13px] transition-all duration-400 ${
                  on ? 'border-cream/40 bg-cream/8 text-cream' : 'border-line text-cream-3 hover:border-cream/25 hover:text-cream-2'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full transition-transform duration-400 group-hover:scale-125"
                  style={{ background: e.tone }}
                />
                {e.name}
              </button>
            )
          })}
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-line md:grid-cols-[1.2fr_1fr]">
          <div className="bg-ink-2 p-8 md:p-10">
            <div
              className="mb-6 h-px w-16 transition-all duration-700"
              style={{ background: current.tone }}
            />
            <h3 className="display text-[clamp(1.75rem,3.5vw,2.75rem)]">{current.name}</h3>
            <p className="lede mt-4 max-w-[38ch]">{current.for}</p>

            <p className="mt-8 text-[11px] tracking-[0.16em] text-cream-3 uppercase">A favor</p>
            <ul className="mt-3 space-y-2">
              {current.pros.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[14px] text-cream-2">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full" style={{ background: current.tone }} />
                  {p}
                </li>
              ))}
            </ul>

            <p className="mt-7 text-[11px] tracking-[0.16em] text-cream-3 uppercase">A considerar</p>
            <ul className="mt-3 space-y-2">
              {current.cons.map((c) => (
                <li key={c} className="flex items-start gap-3 text-[14px] text-cream-3">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-cream-3" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-between bg-ink-2 p-8 md:p-10">
            <div>
              <p className="text-[11px] tracking-[0.16em] text-cream-3 uppercase">Qué instalamos como cerebro</p>

              {/* esta lista es literalmente el hardware que aparece en la
                  casa 3D al elegir este ecosistema */}
              <ul className="mt-4 divide-y divide-line">
                {current.kit.map((piece, i) => (
                  <li key={`${piece.name}-${i}`} className="flex items-baseline gap-3 py-2.5">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full"
                      style={{ background: piece.shape === 'none' ? 'var(--color-cream-3)' : current.tone }}
                    />
                    <span className="flex-1">
                      <span className="text-[14px] text-cream">{piece.name}</span>
                      <span className="block text-[12px] text-cream-3">{piece.role}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-[13px] leading-relaxed text-cream-2">
                Todo lo demás habla <strong className="font-medium text-cream">Matter</strong>: si en dos años cambias
                de opinión, cambias el cerebro y no la casa.
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-line p-5">
              <p className="text-[13px] text-cream-2">
                ¿No sabes cuál te toca? En la llamada de 15 minutos lo resolvemos con tres preguntas.
              </p>
              <a
                href="#contacto"
                className="mt-4 inline-flex items-center gap-2 text-[13px] text-ember transition-all duration-300 hover:gap-3"
              >
                Agendar llamada
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  )
}
