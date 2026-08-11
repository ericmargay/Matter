import Section, { Head } from './Section'
import Reveal from './Reveal'
import { protocols } from '../content/site'

/**
 * Diagrama de la malla.
 * Es la sección educativa del sitio: casi nadie que compra domótica sabe
 * qué es un border router, y explicarlo con un dibujo vende mejor que
 * explicarlo con tres párrafos.
 */
function MeshDiagram() {
  const routers = [
    [190, 60],
    [300, 118],
    [110, 150],
    [255, 205],
    [80, 245],
  ]
  const leaves = [
    [352, 62],
    [40, 92],
    [330, 168],
    [172, 232],
    [188, 296],
    [22, 190],
  ]
  const links = [
    [[190, 60], [300, 118]],
    [[190, 60], [110, 150]],
    [[300, 118], [255, 205]],
    [[110, 150], [255, 205]],
    [[110, 150], [80, 245]],
    [[255, 205], [80, 245]],
    [[300, 118], [352, 62]],
    [[110, 150], [40, 92]],
    [[300, 118], [330, 168]],
    [[255, 205], [172, 232]],
    [[80, 245], [188, 296]],
    [[110, 150], [22, 190]],
  ]

  return (
    <svg viewBox="-14 6 414 324" className="w-full max-w-md" role="img" aria-label="Diagrama de una malla Thread">
      <title>Malla Thread: un border router, repetidores enchufados y sensores de pila</title>

      {links.map(([a, b], i) => (
        <line
          key={i}
          x1={a[0]}
          y1={a[1]}
          x2={b[0]}
          y2={b[1]}
          stroke="var(--color-thread)"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
      ))}

      {/* alcance del border router */}
      <circle cx="190" cy="60" r="24" fill="none" stroke="var(--color-ember)" strokeOpacity="0.25" strokeDasharray="3 5" />

      {leaves.map(([x, y], i) => (
        <g key={`l${i}`}>
          <circle cx={x} cy={y} r="4" fill="var(--color-ember-2)" fillOpacity="0.85" />
        </g>
      ))}

      {routers.slice(1).map(([x, y], i) => (
        <circle key={`r${i}`} cx={x} cy={y} r="6.5" fill="var(--color-thread)" />
      ))}

      {/* border router */}
      <circle cx="190" cy="60" r="11" fill="var(--color-ember)" />
      <circle cx="190" cy="60" r="4" fill="var(--color-ink)" />

      <g fontSize="9.5" fill="var(--color-cream-3)" fontFamily="var(--font-sans)">
        <text x="190" y="22" textAnchor="middle" fill="var(--color-ember)">
          Border router
        </text>
        <text x="190" y="34" textAnchor="middle" opacity="0.7">
          conecta la malla con tu red
        </text>
        <text x="312" y="112" fill="var(--color-thread)">
          Repetidor
        </text>
        <text x="352" y="46" textAnchor="middle" fill="var(--color-ember-2)">
          Sensor de pila
        </text>
      </g>
    </svg>
  )
}

export default function Protocols() {
  return (
    <Section id="red" tone="ink2">
      <Head
        eyebrow="Lo que hay debajo"
        title={
          <>
            Primero la red.
            <br />
            Después los aparatos.
          </>
        }
        lede="La mayoría de las instalaciones que nos toca rescatar no fallaron por la marca de los focos: fallaron porque nadie midió la señal antes de colgar treinta dispositivos de un módem de la compañía de internet."
      />

      <div className="mt-16 grid items-start gap-14 lg:grid-cols-[1fr_420px]">
        <div className="grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2">
          {protocols.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.06} className="bg-ink-2 p-7">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="display text-2xl">{p.name}</h3>
                <span className="text-[11px] tracking-[0.14em] text-cream-3 uppercase">{p.kicker}</span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-cream-2">{p.body}</p>
              <div className="mt-6 flex items-baseline gap-2 border-t border-line pt-4">
                <span className="display text-3xl text-ember">{p.stat}</span>
                <span className="text-[11px] text-cream-3">{p.statLabel}</span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1} className="lg:sticky lg:top-28">
          <div className="rounded-2xl border border-line bg-ink p-7">
            <MeshDiagram />
            <div className="mt-6 space-y-2.5 border-t border-line pt-5 text-[13px] text-cream-2">
              <p className="flex gap-2.5">
                <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-ember" />
                <span>
                  <strong className="font-medium text-cream">Border router.</strong> Traduce entre Thread y tu WiFi.
                  Un HomePod, un Nest Hub o un Echo ya lo son.
                </span>
              </p>
              <p className="flex gap-2.5">
                <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-thread" />
                <span>
                  <strong className="font-medium text-cream">Repetidores.</strong> Todo lo enchufado a corriente
                  extiende la malla. Más focos inteligentes = mejor señal, no peor.
                </span>
              </p>
              <p className="flex gap-2.5">
                <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-ember-2" />
                <span>
                  <strong className="font-medium text-cream">Sensores de pila.</strong> Solo hablan cuando pasa algo.
                  Por eso duran años.
                </span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
