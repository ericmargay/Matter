export default function Section({ id, children, className = '', tone = 'ink' }) {
  const bg = tone === 'ink2' ? 'bg-ink-2' : 'bg-ink'
  return (
    <section id={id} className={`relative z-10 ${bg} px-5 py-24 md:px-8 md:py-32 ${className}`}>
      <div className="mx-auto w-full max-w-[1400px]">{children}</div>
    </section>
  )
}

export function Head({ eyebrow, title, lede, className = '' }) {
  return (
    <div className={`max-w-[52rem] ${className}`}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="display text-[clamp(2rem,5vw,3.75rem)]">{title}</h2>
      {lede && <p className="lede mt-5 max-w-[46ch]">{lede}</p>}
    </div>
  )
}
