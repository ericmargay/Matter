import { hero, brand, proof } from '../content/site'

/**
 * `innerRef` lo escribe App directamente en cada scroll.
 * Pasar el fade por estado de React re-renderizaría el hero 60 veces
 * por segundo para animar una opacidad.
 */
export default function Hero({ innerRef }) {
  return (
    <section
      ref={innerRef}
      id="top"
      // sin pointer-events el hero taparía el canvas y mataría el parallax;
      // los hijos interactivos lo vuelven a activar
      className="pointer-events-none relative z-10 flex h-screen items-end px-5 pb-16 md:px-8 md:pb-20"
    >
      {/* velo: sin esto el texto pelea con la casa */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent md:bg-gradient-to-r md:from-ink md:via-ink/60 md:to-transparent" />

      <div className="pointer-events-auto relative mx-auto w-full max-w-[1400px]">
        <p className="eyebrow mb-5 animate-[rise_1s_var(--ease-out-expo)_0.2s_both]">{hero.eyebrow}</p>

        <h1 className="display max-w-[16ch] text-[clamp(2.75rem,8.5vw,7rem)]">
          {hero.title.map((line, i) => (
            <span key={line} className="block overflow-hidden">
              <span
                className="block animate-[rise_1.1s_var(--ease-out-expo)_both]"
                style={{ animationDelay: `${0.32 + i * 0.11}s` }}
              >
                {i === hero.title.length - 1 ? <em className="not-italic text-ember">{line}</em> : line}
              </span>
            </span>
          ))}
        </h1>

        <p className="lede mt-7 max-w-[46ch] animate-[rise_1s_var(--ease-out-expo)_0.75s_both]">{hero.lede}</p>

        <div className="mt-9 flex flex-wrap items-center gap-3 animate-[rise_1s_var(--ease-out-expo)_0.9s_both]">
          <a
            href="#contacto"
            className="rounded-full bg-ember px-6 py-3.5 text-[14px] font-medium text-ink transition-all duration-400 hover:bg-ember-2"
          >
            {hero.cta}
          </a>
          <a
            href="#red"
            className="rounded-full border border-cream/20 px-6 py-3.5 text-[14px] text-cream transition-all duration-400 hover:border-cream/50"
          >
            {hero.ctaSecondary}
          </a>
        </div>

        <div className="mt-12 hidden gap-10 border-t border-line pt-6 animate-[rise_1s_var(--ease-out-expo)_1.05s_both] lg:flex">
          {proof.map((p) => (
            <div key={p.label}>
              <div className="display text-2xl text-cream">{p.n}</div>
              <div className="mt-0.5 text-[11px] tracking-wide text-cream-3">{p.label}</div>
            </div>
          ))}
          <div className="ml-auto self-end text-right text-[11px] tracking-wide text-cream-3">
            {brand.city}
          </div>
        </div>
      </div>

      {/* pista de scroll */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2.5 md:flex">
        <span className="text-[10px] tracking-[0.22em] text-cream-3 uppercase">{hero.scrollHint}</span>
        <span className="relative block h-8 w-px overflow-hidden bg-line">
          <span className="absolute inset-x-0 top-0 h-3 animate-[trickle_2.2s_ease-in-out_infinite] bg-ember" />
        </span>
      </div>
    </section>
  )
}
