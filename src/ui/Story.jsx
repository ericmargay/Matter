import { chapters } from '../content/tour'
import { CHAPTER_COUNT } from '../scene/chapters'
import { useStore } from '../store/store'
import ControlCenter from './ControlCenter'
import Assistant from './Assistant'

/**
 * Riel de progreso.
 * Va arriba y en horizontal porque la banda derecha ya la ocupa el centro
 * de control, y dos columnas flotantes del mismo lado se estorban.
 */
function Rail({ active }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 hidden justify-center md:flex">
      <div className="flex items-center gap-1.5 rounded-full border border-line/70 bg-ink/45 px-3 py-2 backdrop-blur-xl">
        {chapters.map((c, i) => (
          <span
            key={c.id}
            className="block h-[3px] rounded-full transition-all duration-500"
            style={{
              width: i === active ? 30 : 12,
              background: i === active ? 'var(--color-ember)' : 'var(--color-line)',
            }}
          />
        ))}
        <span className="ml-2 min-w-[9rem] text-[10px] tracking-[0.14em] text-ember uppercase">
          {chapters[active]?.eyebrow}
        </span>
      </div>
    </div>
  )
}

function Panel({ chapter, active }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-8 md:px-8 md:pb-16"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? 'none' : 'translateY(22px)',
        transition: 'opacity .7s var(--ease-out-expo), transform .7s var(--ease-out-expo)',
        // sin esto los paneles inactivos siguen capturando clics del control
        visibility: active ? 'visible' : 'hidden',
      }}
      aria-hidden={!active}
    >
      <div className="mx-auto w-full max-w-[1400px]">
        {/* en móvil el control va apilado sobre la tarjeta: es la única
            forma de garantizar que nunca se encimen */}
        <div className="mb-2.5 space-y-2 md:hidden">
          <Assistant compact />
          <ControlCenter compact />
        </div>

        <div className="max-w-[34rem] rounded-2xl border border-line/80 bg-ink/75 p-5 backdrop-blur-xl md:p-7">
          <p className="eyebrow mb-2.5">{chapter.eyebrow}</p>
          <h2 className="display text-[clamp(1.375rem,3.2vw,2.6rem)]">{chapter.title}</h2>
          <p className="lede mt-3 text-[13.5px] leading-[1.55] md:text-[15px] md:leading-[1.6]">{chapter.body}</p>

          <ul className="mt-4 flex flex-wrap gap-1.5 md:mt-5">
            {chapter.devices.map((d) => (
              <li key={d} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-cream-2">
                {d}
              </li>
            ))}
          </ul>
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
      {/* pointer-events-none: los hotspots del canvas viven debajo de esta capa */}
      <div className="pointer-events-none sticky top-0 h-screen w-full overflow-hidden">
        {/* velos: arriba para el nav, abajo para el panel */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/85 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/85 to-transparent" />

        {chapters.map((c, i) => (
          <Panel key={c.id} chapter={c} active={i === active} />
        ))}

        <Rail active={active} />

        {/* centro de control fijo a la derecha en pantallas grandes */}
        {/* columna derecha: el asistente arriba del control, porque la
            frase de voz es lo primero que queremos que se pruebe */}
        <div className="absolute right-6 bottom-16 hidden w-[360px] space-y-2.5 md:block lg:right-8">
          <Assistant />
          <ControlCenter />
        </div>
      </div>
    </section>
  )
}
