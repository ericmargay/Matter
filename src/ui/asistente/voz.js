import { useEffect, useRef } from 'react'

/**
 * La voz del asistente: los dos tonos y el habla.
 *
 * Viven aparte porque ya los usan dos pieles distintas —el asistente sencillo
 * y el teléfono con Siri— y el sonido tiene que ser el mismo en las dos. Si
 * cada una sintetizara sus notas, la demostración sonaría a dos productos.
 */

/* ── sonidos ──────────────────────────────────────────────────────
   Sintetizados, no archivos: no hay que servir un mp3, suenan igual en
   cualquier equipo y se pueden afinar con dos números. El de entrada sube
   —pregunta— y el de salida baja y cierra —afirma—. Es la misma gramática que
   usan los asistentes de verdad y por eso se reconoce sin pensarlo. */
export function useTonos() {
  const ctx = useRef(null)

  const abrir = () => {
    ctx.current ??= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.current.state === 'suspended') ctx.current.resume()
    return ctx.current
  }

  const tocar = (notas, volumen = 0.13) => {
    try {
      const ac = abrir()
      const t0 = ac.currentTime
      notas.forEach(([hz, cuando, dura], i) => {
        const osc = ac.createOscillator()
        const vol = ac.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(hz, t0 + cuando)
        vol.gain.setValueAtTime(0, t0 + cuando)
        vol.gain.linearRampToValueAtTime(volumen * (i === 0 ? 1 : 0.85), t0 + cuando + 0.015)
        vol.gain.exponentialRampToValueAtTime(0.0001, t0 + cuando + dura)
        osc.connect(vol).connect(ac.destination)
        osc.start(t0 + cuando)
        osc.stop(t0 + cuando + dura + 0.02)
      })
    } catch {
      // sin audio la demostración sigue; el sonido es un extra, no el mensaje
    }
  }

  return {
    // entrada: dos notas que suben, como una pregunta
    entrada: () => tocar([[660, 0, 0.16], [990, 0.085, 0.26]]),
    // salida: dos que bajan y cierran, como un "ya"
    salida: () => tocar([[880, 0, 0.14], [587, 0.09, 0.34]], 0.11),
  }
}

/** La voz. Se usa la del sistema en español si la hay. */
export function useVoz() {
  const voz = useRef(null)
  useEffect(() => {
    const cargar = () => {
      const vs = window.speechSynthesis?.getVoices?.() ?? []
      voz.current =
        vs.find((v) => /es-MX/i.test(v.lang)) ??
        vs.find((v) => /^es/i.test(v.lang)) ??
        null
    }
    cargar()
    window.speechSynthesis?.addEventListener?.('voiceschanged', cargar)
    return () => window.speechSynthesis?.removeEventListener?.('voiceschanged', cargar)
  }, [])

  return (texto) => {
    try {
      const s = window.speechSynthesis
      if (!s) return
      s.cancel()
      const u = new SpeechSynthesisUtterance(texto)
      if (voz.current) u.voice = voz.current
      u.lang = voz.current?.lang ?? 'es-MX'
      u.rate = 1.02
      u.pitch = 1.0
      s.speak(u)
    } catch {
      // si el navegador no habla, queda el texto en pantalla
    }
  }
}
