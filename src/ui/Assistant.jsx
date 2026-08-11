import { useEffect, useRef } from 'react'
import { assistant, wakeWords, roomControls } from '../content/tour'
import { ecosystems } from '../content/site'
import { useStore } from '../store/store'

/**
 * Botón de asistente por voz.
 *
 * En los capítulos donde hay algo que pedir aparece la frase que dirías en
 * voz alta. Al tocarla el orbe entra en escucha, se transcribe el comando y
 * la casa 3D hace la acción de verdad — el portón sube, la persiana baja, el
 * alimentador sirve. Es la demo que un integrador haría parado en tu sala.
 *
 * El orbe cambia con el ecosistema: Siri es un degradado que respira, Google
 * son sus cuatro puntos, Alexa el anillo cian, Home Assistant el pulso ámbar.
 */

/* ── orbes por marca ───────────────────────────────────────────── */

function SiriOrb({ active }) {
  return (
    <span className={`orb ${active ? 'orb-on' : ''}`} aria-hidden="true">
      <span className="orb-siri" />
    </span>
  )
}

function GoogleOrb({ active }) {
  const dots = ['#4285f4', '#ea4335', '#fbbc05', '#34a853']
  return (
    <span className={`orb ${active ? 'orb-on' : ''}`} aria-hidden="true">
      <span className="flex items-center justify-center gap-[3px]">
        {dots.map((c, i) => (
          <span
            key={c}
            className="orb-dot"
            style={{ background: c, animationDelay: `${i * 0.11}s`, animationPlayState: active ? 'running' : 'paused' }}
          />
        ))}
      </span>
    </span>
  )
}

function AlexaOrb({ active }) {
  return (
    <span className={`orb ${active ? 'orb-on' : ''}`} aria-hidden="true">
      <span className="orb-ring" />
      <span className="orb-ring orb-ring-2" />
    </span>
  )
}

function HaOrb({ active }) {
  return (
    <span className={`orb ${active ? 'orb-on' : ''}`} aria-hidden="true">
      <span className="orb-pulse" />
    </span>
  )
}

const ORBS = { apple: SiriOrb, google: GoogleOrb, alexa: AlexaOrb, ha: HaOrb }

/* ── botón ─────────────────────────────────────────────────────── */

export default function Assistant({ compact = false }) {
  const chapter = useStore((s) => s.chapter)
  const ecosystem = useStore((s) => s.ecosystem)
  const voice = useStore((s) => s.voice)
  const setVoice = useStore((s) => s.setVoice)
  const runScene = useStore((s) => s.runScene)
  const setGarage = useStore((s) => s.setGarage)
  const feed = useStore((s) => s.feed)

  const timers = useRef([])

  // si te sales del capítulo a media respuesta, se cancela todo
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [chapter])

  const entry = assistant[chapter]
  if (!entry) return null

  const eco = ecosystems.find((e) => e.id === ecosystem) ?? ecosystems[0]
  const Orb = ORBS[ecosystem] ?? SiriOrb
  const wake = wakeWords[ecosystem] ?? 'Oye Siri'

  const mine = voice.chapter === chapter
  const listening = mine && voice.phase === 'listening'
  const replying = mine && voice.phase === 'reply'

  const run = () => {
    if (listening) return
    timers.current.forEach(clearTimeout)
    timers.current = []

    setVoice({ chapter, phase: 'listening', reply: '' })

    // 900 ms de "escuchando" antes de actuar: sin esa pausa no se lee como
    // un asistente, se lee como un botón
    timers.current.push(
      setTimeout(() => {
        const a = entry.action
        if (a.type === 'garage') setGarage(true)
        else if (a.type === 'feed') feed()
        else if (a.type === 'scene') {
          const preset = roomControls[a.room]?.scenes.find((s) => s.id === a.scene)?.set
          if (preset) runScene(a.room, a.scene, preset)
        }
        setVoice({ chapter, phase: 'reply', reply: entry.reply })
      }, 900),
    )

    timers.current.push(setTimeout(() => setVoice({ chapter: null, phase: null, reply: '' }), 5200))
  }

  return (
    <div className="pointer-events-auto">
      <button
        onClick={run}
        aria-live="polite"
        className={`group flex w-full items-center gap-3 rounded-[1.4rem] border px-3.5 text-left backdrop-blur-2xl transition-all duration-400 ${
          compact ? 'py-2.5' : 'py-3'
        } ${
          listening
            ? 'border-white/30 bg-white/12'
            : 'border-white/12 bg-ink/72 hover:border-white/25 hover:bg-ink/85'
        }`}
        style={{ boxShadow: '0 18px 46px -18px rgba(0,0,0,0.8)' }}
      >
        <Orb active={listening} />

        <span className="min-w-0 flex-1">
          <span className="block text-[10px] tracking-[0.16em] text-cream-3 uppercase">
            {listening ? 'Escuchando…' : replying ? eco.short : `Pídeselo a ${eco.short}`}
          </span>
          <span
            className={`block truncate text-[13px] transition-colors duration-300 ${
              replying ? 'text-ember-2' : 'text-cream'
            }`}
          >
            {replying ? entry.reply : `“${wake}, ${entry.command}”`}
          </span>
        </span>

        {!listening && !replying && (
          <span className="flex-none text-[11px] text-cream-3 transition-transform duration-300 group-hover:translate-x-0.5">
            Probar →
          </span>
        )}
      </button>
    </div>
  )
}
