import { useState } from 'react'
import Section, { Head } from './Section'
import Reveal from './Reveal'
import { faq } from '../content/site'

function Item({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-line">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-6 py-6 text-left"
      >
        <span
          className={`text-[clamp(1rem,1.8vw,1.25rem)] leading-snug transition-colors duration-400 ${
            open ? 'text-cream' : 'text-cream-2'
          }`}
        >
          {q}
        </span>
        <span
          className="relative mt-2 block h-3 w-3 flex-none transition-transform duration-500"
          style={{ transform: open ? 'rotate(135deg)' : 'none' }}
          aria-hidden="true"
        >
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-ember" />
          <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-ember" />
        </span>
      </button>

      {/* grid-rows 0fr → 1fr: anima altura sin medir nada en JS */}
      <div
        className="grid transition-all duration-500 ease-[var(--ease-out-expo)]"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <p className="max-w-[62ch] pr-10 pb-7 text-[14px] leading-relaxed text-cream-2">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <Section tone="ink2">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
        <Head
          eyebrow="Preguntas"
          title={
            <>
              Lo que
              <br />
              siempre
              <br />
              preguntan
            </>
          }
          className="lg:sticky lg:top-28 lg:self-start"
        />

        <div className="border-t border-line">
          {faq.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.04}>
              <Item {...f} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  )
}
