import { useState } from 'react'

import { CAPACIDADES, FICHAS } from '../../content/escuela'

/**
 * Lo que hay que saber para levantar bien, sin que nadie tenga que entrenarlo.
 *
 * Es interactiva porque el error caro no es no saber: es suponer que todos los
 * modelos de una familia hacen lo mismo. Un Apple TV de 64 GB y uno de 128 GB
 * se ven idénticos y solo uno arma la malla Thread; un Echo Dot y un Echo
 * grande se llaman casi igual y solo uno trae Zigbee. Se escoge el modelo que
 * hay en la casa y la ficha contesta qué se puede prometer y qué no.
 *
 * La lista de capacidades se pinta siempre completa, con lo que NO tiene en
 * gris tachado. Enseñar lo ausente es la mitad del valor: es lo que evita
 * cotizar sensores Thread para una casa que no puede encenderlos.
 */
export default function Escuela() {
  const [abierta, setAbierta] = useState(FICHAS[0].id)
  const [elegida, setElegida] = useState({})

  const ficha = FICHAS.find((f) => f.id === abierta) ?? FICHAS[0]
  const variante = ficha.variantes.find((v) => v.id === elegida[ficha.id]) ?? null
  const claves = Object.keys(CAPACIDADES)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <header>
        <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Levantamiento</p>
        <h1 className="display mt-1 text-[26px] leading-tight text-cream sm:text-[30px]">
          Lo que hay que saber en la casa del cliente
        </h1>
        <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-cream-2">
          No explica cómo funciona Thread. Explica lo que cambia la propuesta enfrente del cliente: qué modelo
          sirve de central, cuál no aunque se llame parecido, y qué se puede prometer sin quedar mal en la
          entrega. Escoge lo que haya en la casa y contesta sola.
        </p>
      </header>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {FICHAS.map((f) => (
          <button
            key={f.id}
            onClick={() => setAbierta(f.id)}
            className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
              abierta === f.id ? 'border-ember bg-ember text-ink' : 'border-line text-cream-2 hover:border-cream/40'
            }`}
          >
            {f.eco}
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-2xl border border-line bg-ink-2 p-4 sm:p-5">
        <h2 className="display text-[19px] text-cream">{ficha.titulo}</h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-cream-2">{ficha.entrada}</p>

        <p className="mt-4 text-[10px] tracking-[0.12em] text-cream-3 uppercase">{ficha.pregunta}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {ficha.variantes.map((v) => {
            const on = elegida[ficha.id] === v.id
            return (
              <button
                key={v.id}
                onClick={() => setElegida((e) => ({ ...e, [ficha.id]: on ? null : v.id }))}
                className={`rounded-lg border px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                  on ? 'border-ember bg-ember/15 text-ember' : 'border-line text-cream-2 hover:border-cream/40'
                }`}
              >
                {v.label}
              </button>
            )
          })}
        </div>

        {variante ? (
          <div className="mt-4 border-t border-line pt-4">
            {/* Solo se pinta la rejilla de capacidades donde tiene sentido:
                en red y en apagadores la respuesta es la nota, no una lista
                de radios. */}
            {variante.capacidades.length > 0 || ficha.id === 'apple' || ficha.id === 'alexa' || ficha.id === 'google' ? (
              <div className="grid gap-1.5 sm:grid-cols-2">
                {claves.map((k) => {
                  const tiene = variante.capacidades.includes(k)
                  return (
                    <div
                      key={k}
                      className={`rounded-lg border px-2.5 py-2 ${
                        tiene ? 'border-emerald-500/30 bg-emerald-500/[0.06]' : 'border-line opacity-45'
                      }`}
                    >
                      <p className={`text-[12px] ${tiene ? 'text-cream' : 'text-cream-3 line-through'}`}>
                        {CAPACIDADES[k].label}
                      </p>
                      <p className="mt-0.5 text-[10.5px] leading-snug text-cream-3">{CAPACIDADES[k].ayuda}</p>
                    </div>
                  )
                })}
              </div>
            ) : null}

            <div className="mt-3 rounded-xl border border-ember/30 bg-ember/[0.06] px-3 py-2.5">
              <p className="text-[10px] tracking-[0.12em] text-ember uppercase">Qué decirle al cliente</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-cream-2">{variante.nota}</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 border-t border-line pt-4 text-[12px] text-cream-3">
            Escoge una opción de arriba para ver qué se puede y qué no.
          </p>
        )}
      </section>

      <p className="mt-4 text-[11px] leading-relaxed text-cream-3">
        Verificado en agosto de 2026. Cuando algo cambie —y va a cambiar— se corrige en{' '}
        <span className="text-cream-2">content/escuela.js</span> y se actualiza para todos.
      </p>
    </div>
  )
}
