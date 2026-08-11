import { useEffect, useState } from 'react'
import { brand } from '../content/site'
import { useStore } from '../store/store'
import Logo from './Logo'

/**
 * Pantalla de entrada.
 * No espera assets (la escena es procedural, no hay nada que bajar): espera
 * a que las tipografías estén listas y a que el primer frame de WebGL haya
 * pasado, que es lo que de verdad se ve feo si lo enseñas a medias.
 */
export default function Loader() {
  const [gone, setGone] = useState(false)
  const [pct, setPct] = useState(0)
  const setReady = useStore((s) => s.setReady)

  useEffect(() => {
    let raf
    let done = false
    const started = performance.now()
    const MIN = 1100 // que no parpadee en conexiones rápidas

    const fonts = document.fonts ? document.fonts.ready : Promise.resolve()
    fonts.then(() => {
      done = true
    })

    const tick = () => {
      const elapsed = performance.now() - started
      const byTime = Math.min(1, elapsed / MIN)
      // se detiene en 92% hasta que las fuentes carguen: es honesto y se siente vivo
      const value = done ? byTime : Math.min(0.92, byTime)
      setPct(value)

      if (value >= 1) {
        setReady(true)
        setTimeout(() => setGone(true), 700)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [setReady])

  if (gone) return null

  const out = pct >= 1

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-ink transition-all duration-700 ease-[var(--ease-out-expo)]"
      style={{ opacity: out ? 0 : 1, pointerEvents: out ? 'none' : 'auto' }}
      aria-hidden={out}
    >
      <Logo size={54} className="mb-4 text-cream" />
      <div className="display text-4xl tracking-tight">{brand.name}</div>
      <div className="mt-1 text-[11px] tracking-[0.2em] text-cream-3 uppercase">{brand.tagline}</div>

      <div className="mt-8 h-px w-40 overflow-hidden bg-line">
        <div
          className="h-full bg-ember transition-[width] duration-200 ease-linear"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="mt-3 font-mono text-[10px] text-cream-3">{Math.round(pct * 100)}%</div>
    </div>
  )
}
