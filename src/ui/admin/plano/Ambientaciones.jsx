import { useState } from 'react'

import Asistente from '../../Asistente'
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

export default function Ambientaciones({ items, onCorrer, bloqueo }) {
  const escenas = escenasDe(items)
  const [activa, setActiva] = useState(null)
  const [peticion, setPeticion] = useState(null)

  if (escenas.length === 0) return null

  const correr = (esc) => {
    if (bloqueo) return
    setActiva(esc.id)
    /* Objeto nuevo cada vez aunque sea la misma escena: es lo que hace que el
       asistente vuelva a arrancar su secuencia al pedirla dos veces. */
    setPeticion({ voz: esc.voz, dice: esc.dice, acciones: esc.entonces, n: Date.now() })
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

      {/* El cuarto cambia cuando el asistente termina de responder, no antes. */}
      <Asistente peticion={peticion} onHacer={() => onCorrer(peticion.acciones)} />
    </>
  )
}
