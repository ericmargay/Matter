import { useMemo, useState } from 'react'

import Asistente from '../../Asistente'
import GlifoAsistente from '../../GlifoAsistente'
import { ASISTENTES, agrupar, alcanceDe, asistentesDe, idsQueManda, porQueFuera } from './asistentes'
import { escenasDe } from './escenas'

/**
 * Las ambientaciones, con su interruptor fuera del espacio y con nombre y
 * apellido de quién las va a atender.
 *
 * Que se activen desde aquí y no tocando el objeto en la escena es la parte
 * importante. En la casa nadie camina hasta la lámpara para prenderla: lo dice
 * por voz desde el sillón. El plano tiene que poder demostrar eso mismo,
 * porque es lo que se está vendiendo — que la casa responda sin ir a ella.
 *
 * Y quién responde no da igual. En esta recámara hay un Apple TV y un Echo
 * Spot, o sea Siri y Alexa a la vez, y no alcanzan lo mismo: los sensores
 * Onvis y el atenuador Eve son de HomeKit y Alexa no los ve; el enchufe de
 * Amazon es de Alexa y Siri no lo ve. Una lista de comandos sin decir cuál
 * asistente los corre es prometer algo que se descubre falso el primer día.
 *
 * Por eso el botón lleva el glifo del asistente en vez de decir "accionar", y
 * la escena se corre SOLO sobre lo que ese asistente alcanza de verdad.
 */

export default function Ambientaciones({ items, onCorrer, bloqueo, espacio }) {
  const escenas = escenasDe(items, espacio)
  const disponibles = useMemo(() => asistentesDe(items), [items])
  const [quien, setQuien] = useState(null)
  const [activa, setActiva] = useState(null)
  const [peticion, setPeticion] = useState(null)
  const [verFuera, setVerFuera] = useState(false)

  /* Si no hay ninguno levantado, la app del teléfono: es lo que queda, y es
     honesto decirlo así en vez de fingir una voz que no está instalada. */
  const asistente = disponibles.find((a) => a.id === quien) ?? disponibles[0] ?? null
  const alcance = useMemo(() => (asistente ? alcanceDe(asistente, items) : null), [asistente, items])
  const suyos = useMemo(() => (asistente ? idsQueManda(asistente, items) : null), [asistente, items])

  if (escenas.length === 0) return null

  const correr = (esc) => {
    if (bloqueo) return
    /* La escena se recorta a lo que ESTE asistente alcanza. Correrla completa
       sería enseñar en la maqueta algo que en la casa no va a pasar. */
    const acciones = suyos ? esc.entonces.filter((a) => suyos.has(a.objetivo)) : esc.entonces
    if (acciones.length === 0) return
    setActiva(esc.id)
    /* Objeto nuevo cada vez aunque sea la misma escena: es lo que hace que el
       asistente vuelva a arrancar su secuencia al pedirla dos veces. */
    setPeticion({
      voz: frase(esc, asistente),
      dice: asistente?.responde ?? 'Listo',
      acciones,
      n: Date.now(),
    })
  }

  const cuantas = (esc) => (suyos ? esc.entonces.filter((a) => suyos.has(a.objetivo)).length : esc.entonces.length)

  return (
    <>
      <div className="border-t border-line px-3 py-3">
        <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">
          Ambientaciones · {escenas.length}
        </p>
        <p className="mt-1 text-[10.5px] leading-snug text-cream-3">
          Salen de lo que hay levantado en este espacio. Se accionan desde aquí, como se accionan de verdad: sin
          ir hasta el aparato.
        </p>

        {/* ── a quién se le pide ── */}
        {disponibles.length > 0 && (
          <div className="mt-2.5 rounded-lg border border-line p-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {disponibles.map((a) => {
                const on = a.id === asistente?.id
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      setQuien(a.id)
                      setVerFuera(false)
                    }}
                    className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] transition-colors ${
                      on ? 'border-ember bg-ember/12 text-cream' : 'border-line text-cream-3 hover:bg-cream/6'
                    }`}
                  >
                    <GlifoAsistente tipo={a.glifo} size={14} activo={on} />
                    {a.nombre}
                  </button>
                )
              })}
            </div>

            {alcance && (
              <>
                <p className="mt-2 text-[10.5px] leading-snug text-cream-2">
                  {asistente.nombre} le puede pedir algo a{' '}
                  <span className="text-cream">{alcance.manda.length}</span> de {alcance.total} aparatos de este
                  espacio
                  {alcance.automatiza.length > 0 && (
                    <>
                      {' '}
                      y usar <span className="text-cream">{alcance.automatiza.length}</span> para automatizar
                    </>
                  )}
                  .
                </p>

                {alcance.fuera.length > 0 ? (
                  <>
                    <button
                      onClick={() => setVerFuera((v) => !v)}
                      className="mt-1 text-left text-[10.5px] text-ember underline decoration-dotted underline-offset-2"
                    >
                      {alcance.fuera.length} se le quedan fuera {verFuera ? '−' : '+'}
                    </button>
                    {verFuera && (
                      <ul className="mt-1 space-y-1">
                        {agrupar(alcance.fuera).map(({ device, n }) => (
                          <li key={device.id} className="text-[10.5px] leading-snug text-cream-3">
                            <span className="text-cream-2">
                              {n > 1 ? `${n} × ` : ''}
                              {device.name}
                            </span>{' '}
                            — {porQueFuera(device, asistente)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className="mt-1 text-[10.5px] text-thread-2">
                    Alcanza todo lo que hay en este espacio.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-2 space-y-1.5">
          {escenas.map((e) => {
            const n = cuantas(e)
            const total = e.entonces.length
            const puede = n > 0
            return (
              <div
                key={e.id}
                className={`rounded-lg border px-2.5 py-2 transition-colors ${
                  activa === e.id ? 'border-ember bg-ember/10' : 'border-line'
                } ${puede ? '' : 'opacity-45'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-cream">{e.nombre}</span>
                  <button
                    onClick={() => correr(e)}
                    disabled={!!bloqueo || !puede}
                    title={
                      puede
                        ? `Pedírselo a ${asistente?.nombre ?? 'la app'}`
                        : `${asistente?.nombre} no alcanza nada de esta ambientación`
                    }
                    className="shrink-0 rounded-full border border-line p-1 transition-colors hover:border-ember disabled:opacity-40"
                  >
                    <GlifoAsistente
                      tipo={asistente?.glifo ?? 'orbe'}
                      size={18}
                      activo={activa === e.id}
                    />
                  </button>
                </div>
                <p className="mt-0.5 text-[10.5px] leading-snug text-cream-3">{e.porque}</p>
                <span className="mt-1 inline-block rounded-full border border-thread/40 px-2 py-0.5 text-[10px] text-thread-2">
                  “{frase(e, asistente)}”
                </span>
                {/* Lo que esta ambientación deja fuera con este asistente. Es
                    la línea que evita la conversación incómoda de después. */}
                {puede && n < total && (
                  <p className="mt-1 text-[10px] leading-snug text-ember">
                    {asistente.nombre} mueve {n} de {total}: el resto no lo alcanza.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* El cuarto cambia cuando el asistente termina de responder, no antes. */}
      <Asistente peticion={peticion} onHacer={() => onCorrer(peticion.acciones)} />
    </>
  )
}

/* La frase se arma con la invocación de quien va a atender, no con una fija.
   "Oye Siri, pon modo película" y "Alexa, pon modo película" son la misma
   orden y dos frases distintas, y el cliente va a decir la suya. */
function frase(escena, asistente) {
  const orden = escena.voz.replace(/^(oye siri|alexa|oye google|hey siri)[,\s]+/i, '')
  const inv = asistente?.invocar ?? ASISTENTES.apple.invocar
  return `${inv}, ${orden}`
}
