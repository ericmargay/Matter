import Section, { Head } from './Section'
import Reveal from './Reveal'
import { process } from '../content/site'

export default function Process() {
  return (
    <Section id="proceso" tone="ink2">
      <Head
        eyebrow="Cómo trabajamos"
        title="Nadie compra nada antes del paso 02"
        lede="El levantamiento es lo primero que cobramos y lo único que necesitas comprar para empezar. Si después decides no instalar con nosotros, el plano y el mapa de red son tuyos."
      />

      <div className="mt-16 border-t border-line">
        {process.map((step, i) => (
          <Reveal key={step.n} delay={i * 0.05}>
            <div className="group grid items-start gap-4 border-b border-line py-8 transition-colors duration-500 hover:bg-ink/40 md:grid-cols-[5rem_1fr_10rem] md:gap-8 md:py-9">
              <span className="display text-2xl text-cream-3 transition-colors duration-500 group-hover:text-ember">
                {step.n}
              </span>
              <div>
                <h3 className="display text-[clamp(1.25rem,2.4vw,1.75rem)]">{step.title}</h3>
                <p className="mt-2.5 max-w-[52ch] text-[14px] leading-relaxed text-cream-2">{step.body}</p>
              </div>
              <span className="text-[12px] text-cream-3 md:text-right">{step.time}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
