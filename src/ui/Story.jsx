import { useEffect, useState } from 'react'
import { chapters } from '../content/tour'
import { CHAPTER_COUNT } from '../scene/chapters'
import { useStore } from '../store/store'
import ControlCenter from './ControlCenter'
import Assistant from './Assistant'

/**
 * Riel de progreso: arriba y en horizontal, porque la banda derecha la
 * ocupan el asistente y el centro de control.
 */
function Rail({ active }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[4.6rem] flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-full border border-line/70 bg-ink/50 px-2.5 py-1.5 backdrop-blur-xl">
        {chapters.map((c, i) => (
          <span
            key={c.id}
            className="block h-[3px] rounded-full transition-all duration-500"
            style={{
              width: i === active ? 22 : 8,
              background: i === active ? 'var(--color-ember)' : 'var(--color-line)',
            }}
          />
        ))}
        <span className="ml-1.5 hidden text-[10px] tracking-[0.14em] text-ember uppercase sm:block">
          {chapters[active]?.eyebrow}
        </span>
      </div>
    </div>
  )
}

/**
 * Tarjeta de capítulo.
 *
 * Ocupa lo menos posible: en un teléfono el 3D es el producto y el texto
 * es el pie de foto, no al revés. Por eso el cuerpo llega recortado a tres
 * líneas y se despliega solo si alguien quiere leerlo — la mayoría no lo
 * hace y no debería costarle media pantalla.
 */
function Panel({ chapter, active }) {
  const [abierto, setAbierto] = useState(false)

  // cada capítulo empieza recogido
  useEffect(() => {
    if (!active) setAbierto(false)
  }, [active])

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3 md:px-8 md:pb-8"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'none' : 'translateY(14px)',
        transition: 'opacity .55s var(--ease-out-expo), transform .55s var(--ease-out-expo)',
        visibility: active ? 'visible' : 'hidden',
      }}
      aria-hidden={!active}
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-2 md:hidden">
          <Assistant compact />
        </div>

        <div className="pointer-events-auto max-w-[27rem] rounded-2xl border border-line/70 bg-ink/78 px-4 py-3 backdrop-blur-xl md:px-5 md:py-4">
          <div className="flex items-baseline gap-2">
            <p className="eyebrow">{chapter.eyebrow}</p>
            <span className="ml-auto text-[10px] text-cream-3">{chapter.devices.length} dispositivos</span>
          </div>

          <h2 className="display mt-1 text-[clamp(1.15rem,2.2vw,1.55rem)] leading-tight">{chapter.title}</h2>

          <p
            className={`mt-1.5 text-[12.5px] leading-[1.5] text-cream-2 transition-all md:text-[13px] ${
              abierto ? '' : 'line-clamp-2 md:line-clamp-3'
            }`}
          >
            {chapter.body}
          </p>

          <button
            onClick={() => setAbierto((v) => !v)}
            className="mt-1.5 text-[11px] text-ember transition-opacity hover:opacity-80"
          >
            {abierto ? 'Menos' : 'Leer más'}
          </button>

          {abierto && (
            <ul className="mt-2.5 flex flex-wrap gap-1">
              {chapter.devices.map((d) => (
                <li key={d} className="rounded-full border border-line px-2 py-0.5 text-[10.5px] text-cream-3">
                  {d}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-2 md:hidden">
          <ControlCenter compact />
        </div>
      </div>
    </div>
  )
}

export default function Story({ innerRef }) {
  const active = useStore((s) => s.chapter)

  return (
    <section
      ref={innerRef}
      id="casa"
      className="relative z-10"
      style={{ height: `${CHAPTER_COUNT * 100}vh` }}
    >
      <div className="pointer-events-none sticky top-0 h-screen w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/80 to-transparent" />

        {chapters.map((c, i) => (
          <Panel key={c.id} chapter={c} active={i === active} />
        ))}

        <Rail active={active} />

        {/* en escritorio, asistente y control viven en la columna derecha */}
        <div className="absolute right-6 bottom-8 hidden w-[340px] space-y-2 md:block lg:right-8">
          <Assistant />
          <ControlCenter />
        </div>
      </div>
    </section>
  )
}
