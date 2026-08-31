import { useEffect, useRef, useState } from 'react'

import { useTonos, useVoz } from './asistente/voz'

/**
 * El asistente, como se comporta en el teléfono.
 *
 * Vive fuera de `ui/admin` a propósito: lo mismo que se afina aquí para el
 * levantamiento va a ir después en la guía del cliente. Ahí el valor no está
 * en la lista de comandos —ésa ya la tiene— sino en ver el comportamiento: el
 * orbe que reacciona, el tono de entrada, la pausa, y la respuesta hablada.
 * Un comando escrito no convence a nadie; oírlo funcionar sí.
 *
 * La secuencia copia la del aparato de verdad, y el orden importa:
 *
 *   1. tono de entrada + el orbe se enciende          (te está oyendo)
 *   2. aparece lo que se pidió                        (te entendió)
 *   3. ~600 ms de proceso, el orbe gira               (lo está haciendo)
 *   4. tono de salida + responde en voz               ("Listo")
 *   5. y HASTA ENTONCES el cuarto cambia
 *
 * Si el cuarto cambia antes de la respuesta se pierde la relación de causa,
 * que es justo lo único que el cliente está leyendo.
 */

/**
 * @param peticion  { voz, dice }  lo que se pidió y lo que contesta
 * @param onHacer   se llama cuando termina de responder: entonces cambia el cuarto
 * @param conVoz    si habla o solo suena
 */
export default function Asistente({ peticion, onHacer, conVoz = true }) {
  const [fase, setFase] = useState(null) // 'oyendo' | 'haciendo' | 'listo'
  const tonos = useTonos()
  const hablar = useVoz()
  const relojes = useRef([])

  useEffect(() => () => relojes.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (!peticion) return
    relojes.current.forEach(clearTimeout)
    relojes.current = []

    tonos.entrada()
    setFase('oyendo')

    const en = (ms, fn) => relojes.current.push(setTimeout(fn, ms))
    en(340, () => setFase('haciendo'))
    en(940, () => {
      setFase('listo')
      tonos.salida()
      if (conVoz) hablar(peticion.dice)
      onHacer?.()
    })
    en(4200, () => setFase(null))
    // el asistente reacciona a una petición nueva, no a que cambien sus manejadores
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peticion])

  if (!peticion || !fase) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[60] flex justify-center px-4">
      <div className={`asistente-marco ${fase === 'haciendo' ? 'trabajando' : ''}`}>
        <div className="flex max-w-md items-center gap-3 rounded-[15px] bg-ink-2/96 px-4 py-3 backdrop-blur">
          <span className={`siri siri-${fase}`} aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-[10px] tracking-[0.12em] text-cream-3 uppercase">“{peticion.voz}”</p>
            <p className="mt-0.5 text-[13.5px] leading-snug text-cream">
              {fase === 'listo' ? peticion.dice : 'Un momento…'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
