import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

import { activeChapter } from './scene/chapters'
import { scrollState, useStore } from './store/store'

import Nav from './ui/Nav'
import Loader from './ui/Loader'
import Hero from './ui/Hero'
import Story from './ui/Story'
import Protocols from './ui/Protocols'
import Ecosystems from './ui/Ecosystems'
import Process from './ui/Process'
import Packages from './ui/Packages'
import Faq from './ui/Faq'
import Contact from './ui/Contact'
import Footer from './ui/Footer'

/**
 * three + drei + postprocessing pesan ~400 kB comprimidos. Cargarlos aparte
 * deja que el hero y el texto pinten de inmediato, detrás del loader.
 */
const Experience = lazy(() => import('./scene/Experience'))

/**
 * El panel de operaciones se compila solo cuando se pide.
 *
 * En GitHub Pages el sitio es público, y el catálogo lleva estructura de
 * costos, márgenes de instalación y canales de proveedor. Con VITE_ADMIN=off
 * el import queda en una rama muerta y el bundler ni siquiera emite el
 * chunk: no es una contraseña que se pueda saltar, es código que no viajó.
 *
 * La cotización SÍ se publica siempre: es lo que se le manda al cliente.
 */
const ADMIN_ENABLED = import.meta.env.VITE_ADMIN !== 'off'

const Admin = ADMIN_ENABLED ? lazy(() => import('./ui/admin/Admin')) : null
const Quote = lazy(() => import('./ui/admin/Quote'))

/** Ruteo por hash: #/admin abre el panel. Sin router ni servidor extra. */
function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Equipos donde el postproceso y las sombras no valen la pena. */
function detectQuality() {
  if (typeof window === 'undefined') return 'high'
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 900
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4 || (navigator.deviceMemory ?? 8) <= 4
  return coarse || narrow || reduced || weak ? 'low' : 'high'
}

export default function App() {
  const route = useHashRoute()

  // #/cotizacion?d=<payload> — la cotización viaja dentro del propio enlace
  if (route.startsWith('#/cotizacion')) {
    const token = new URLSearchParams(route.split('?')[1] ?? '').get('d') ?? ''
    return (
      <Suspense fallback={<div className="min-h-screen bg-ink" />}>
        <Quote token={token} />
      </Suspense>
    )
  }

  if (route.startsWith('#/admin')) {
    if (!ADMIN_ENABLED) return <AdminOff />
    const section = route.split('/')[2]?.split('?')[0] || 'levantamiento'
    return (
      <Suspense fallback={<div className="min-h-screen bg-ink" />}>
        <Admin section={section} />
      </Suspense>
    )
  }

  return <Site />
}

/** Aviso cuando alguien llega a #/admin en un build público. */
function AdminOff() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-center">
      <div className="max-w-sm">
        <p className="display text-2xl text-cream">Panel de operaciones</p>
        <p className="mt-2 text-[13px] leading-relaxed text-cream-3">
          No forma parte de esta publicación. Corre el proyecto en local o despliega con{' '}
          <code className="text-cream-2">VITE_ADMIN=on</code> para usarlo.
        </p>
        <a href="#/" className="mt-5 inline-block rounded-full border border-line px-4 py-2 text-[13px] text-cream-2">
          Ir al sitio
        </a>
      </div>
    </div>
  )
}

function Site() {
  const heroRef = useRef(null)
  const storyRef = useRef(null)
  const sceneRef = useRef(null)

  // el canvas deja de renderizar cuando la historia sale de pantalla
  const [sceneOn, setSceneOn] = useState(true)
  const setQuality = useStore((s) => s.setQuality)
  const setChapter = useStore((s) => s.setChapter)
  const setSpots = useStore((s) => s.setSpots)

  useEffect(() => {
    setQuality(detectQuality())
  }, [setQuality])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: !reduced,
      syncTouch: false,
    })

    const update = () => {
      const vh = window.innerHeight
      const y = window.scrollY

      scrollState.pageY = y

      // ── avance dentro del recorrido 3D ──
      const story = storyRef.current
      if (story) {
        const top = story.offsetTop
        /* -vh*2 y no -vh: el último capítulo (la malla) tiene que quedarse
           quieto un viewport completo antes de que la sección se despegue.
           Con -vh llegaba al 100% justo cuando ya se estaba yendo. */
        const span = Math.max(1, story.offsetHeight - vh * 2)
        const p = clamp01((y - top) / span)
        scrollState.progress = p
        setChapter(activeChapter(p))
      }

      // ── el hero se disuelve en el primer viewport ──
      const hero = heroRef.current
      if (hero) {
        const f = clamp01(y / (vh * 0.62))
        hero.style.opacity = String(1 - f)
        hero.style.transform = `translateY(${-f * 44}px)`
        hero.style.pointerEvents = f > 0.6 ? 'none' : ''
        setSpots(f > 0.55)
      }

      // ── apagar el canvas cuando ya no se ve ──
      const scene = sceneRef.current
      if (scene) {
        const rect = scene.getBoundingClientRect()
        setSceneOn(rect.bottom > vh * 0.15)
      }
    }

    lenis.on('scroll', update)
    update()

    let raf
    const loop = (time) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    window.addEventListener('resize', update)

    // los anclas del nav pasan por lenis para que el scroll siga siendo suave
    const onClick = (e) => {
      const link = e.target.closest?.('a[href^="#"]')
      if (!link) return
      const id = link.getAttribute('href')
      if (!id || id === '#') return
      const el = document.querySelector(id)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: id === '#top' ? 0 : -40 })
    }
    document.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', update)
      document.removeEventListener('click', onClick)
      lenis.destroy()
    }
  }, [setChapter, setSpots])

  return (
    <div className="grain">
      <Loader />
      <Nav />

      <main>
        {/* hero + recorrido comparten un solo canvas fijo detrás */}
        <div ref={sceneRef} className="relative">
          {/* El canvas queda debajo de todo (z-0) y solo recibe puntero
              mientras el recorrido está en pantalla; si no, taparía las
              secciones de abajo con un elemento fijo invisible. */}
          <div
            className="fixed inset-0 z-0 transition-opacity duration-700"
            style={{ opacity: sceneOn ? 1 : 0, pointerEvents: sceneOn ? 'auto' : 'none' }}
            aria-hidden="true"
          >
            <Suspense fallback={null}>
              <Experience active={sceneOn} />
            </Suspense>
          </div>

          <Hero innerRef={heroRef} />
          <Story innerRef={storyRef} />
        </div>

        <Protocols />
        <Ecosystems />
        <Process />
        <Packages />
        <Faq />
        <Contact />
      </main>

      <Footer />
    </div>
  )
}
