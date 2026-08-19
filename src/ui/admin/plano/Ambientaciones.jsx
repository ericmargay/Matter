import { useEffect, useRef, useState } from 'react'

import { escenasDe } from './escenas'

/**
 * Las ambientaciones, con su interruptor fuera del espacio.
 *
 * Que se activen desde aquí y no tocando el objeto en la escena es la parte
 * importante. En la casa nadie camina hasta la lámpara para prenderla: lo dice
 * por voz desde el sillón o lo toca en el teléfono. El plano tiene que poder
 * demostrar eso mismo, porque es lo que se está vendiendo — que la casa
 * responda sin ir a ella.
 *
 * El asistente contesta como contestaría el de verdad: suena, aparece la frase
 * y entonces pasa lo que tiene que pasar. Ese orden importa; si el cuarto
 * cambia antes de que hable, se pierde la relación de causa.
 */

/**
 * El sonido del asistente, sintetizado.
 *
 * Dos tonos cortos con caída suave, no un archivo. Así no hay que servir un
 * mp3 ni pedir permiso de reproducción antes de tiempo, y suena igual en
 * cualquier equipo. Se crea el contexto en el primer toque porque el
 * navegador no deja sonar sin que alguien haya interactuado.
 */
function useCampanita() {
  const ctx = useRef(null)
  return () => {
    try {
      ctx.current ??= new (window.AudioContext || window.webkitAudioContext)()
      const ac = ctx.current
      if (ac.state === 'suspended') ac.resume()
      const t = ac.currentTime
      for (const [i, hz] of [880, 1320].entries()) {
        const osc = ac.createOscillator()
        const vol = ac.createGain()
        osc.type = 'sine'
        osc.frequency.value = hz
        vol.gain.setValueAtTime(0, t + i * 0.09)
        vol.gain.linearRampToValueAtTime(0.14, t + i * 0.09 + 0.02)
        vol.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.34)
        osc.connect(vol).connect(ac.destination)
        osc.start(t + i * 0.09)
        osc.stop(t + i * 0.09 + 0.36)
      }
    } catch {
      // sin audio disponible la demostración sigue: el sonido es un extra
    }
  }
}

export default function Ambientaciones({ items, onCorrer, bloqueo }) {
  const escenas = escenasDe(items)
  const [activa, setActiva] = useState(null)
  const [dice, setDice] = useState(null)
  const campanita = useCampanita()
  const reloj = useRef(0)

  useEffect(() => () => clearTimeout(reloj.current), [])

  if (escenas.length === 0) return null

  const correr = (esc) => {
    if (bloqueo) return
    campanita()
    setActiva(esc.id)
    setDice(esc)
    // el asistente habla primero y el cuarto responde después: al revés se
    // pierde la relación de causa que es justo lo que se está enseñando
    clearTimeout(reloj.current)
    reloj.current = setTimeout(() => onCorrer(esc.entonces), 420)
    setTimeout(() => setDice(null), 3600)
  }

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

        <div className="mt-2 space-y-1.5">
          {escenas.map((e) => (
            <div
              key={e.id}
              className={`rounded-lg border px-2.5 py-2 transition-colors ${
                activa === e.id ? 'border-ember bg-ember/10' : 'border-line'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] text-cream">{e.nombre}</span>
                <button
                  onClick={() => correr(e)}
                  disabled={!!bloqueo}
                  className="shrink-0 rounded border border-ember px-2 py-0.5 text-[10.5px] text-ember transition-colors hover:bg-ember hover:text-ink disabled:opacity-40"
                >
                  accionar
                </button>
              </div>
              <p className="mt-0.5 text-[10.5px] leading-snug text-cream-3">{e.porque}</p>
              <span className="mt-1 inline-block rounded-full border border-thread/40 px-2 py-0.5 text-[10px] text-thread-2">
                “{e.voz}”
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* El asistente. Va fijo sobre el lienzo porque es lo que el cliente
          mira mientras el cuarto cambia. */}
      {dice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[60] flex justify-center px-4">
          <div className="asistente flex max-w-md items-start gap-2.5 rounded-2xl border border-thread/40 bg-ink-2/95 px-4 py-3 backdrop-blur">
            <span className="orbe mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-thread" />
            <div>
              <p className="text-[10px] tracking-[0.12em] text-thread uppercase">“{dice.voz}”</p>
              <p className="mt-0.5 text-[13.5px] leading-snug text-cream">{dice.dice}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
