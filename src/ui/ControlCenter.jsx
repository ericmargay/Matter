import { useCallback, useRef } from 'react'
import Icon from './Icon'
import { roomControls } from '../content/tour'
import { ecosystems } from '../content/site'
import { useStore } from '../store/store'

/**
 * Centro de control.
 *
 * Es el argumento de venta hecho interfaz: en vez de contarle a alguien que
 * "una escena mueve varios dispositivos", que le pique a "Cine" y vea bajar
 * la persiana, atenuarse la lámpara y encenderse la tele en la casa 3D.
 *
 * Se dibuja como HTML encima del canvas, no dentro de la escena: así el
 * texto es texto (accesible, seleccionable, nítido en cualquier pantalla).
 */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/* ── slider vertical, como el de brillo del centro de control ──── */
function VSlider({ value, onChange, icon, label, track }) {
  const ref = useRef(null)

  const set = useCallback(
    (clientY) => {
      const r = ref.current.getBoundingClientRect()
      onChange(clamp01(1 - (clientY - r.top) / r.height))
    },
    [onChange],
  )

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          set(e.clientY)
        }}
        onPointerMove={(e) => e.buttons === 1 && set(e.clientY)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') onChange(clamp01(value + 0.1))
          if (e.key === 'ArrowDown') onChange(clamp01(value - 0.1))
        }}
        className="relative h-[148px] w-11 cursor-ns-resize touch-none overflow-hidden rounded-[1.15rem] border border-white/10 bg-white/6 outline-none transition-colors focus-visible:border-ember/70"
      >
        <div
          className="absolute inset-x-0 bottom-0 transition-[height] duration-150 ease-out"
          style={{ height: `${value * 100}%`, background: track }}
        />
        <span
          className="absolute inset-x-0 bottom-2.5 flex justify-center transition-colors duration-300"
          style={{ color: value > 0.22 ? 'var(--color-ink)' : 'var(--color-cream-2)' }}
        >
          <Icon name={icon} size={16} />
        </span>
      </div>
      <span className="text-[10px] tracking-wide text-cream-3">{label}</span>
    </div>
  )
}

/* ── tesela de escena ──────────────────────────────────────────── */
function SceneTile({ scene, active, onClick, compact }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      // icono arriba y etiqueta abajo: en columnas de ~70px un layout en
      // fila corta palabras como "Lectura" a la mitad
      className={`flex flex-col items-center rounded-2xl border px-1.5 transition-all duration-300 ${
        compact ? 'gap-1 py-1.5' : 'gap-1.5 py-2.5'
      } ${
        active
          ? 'border-ember/60 bg-ember/18 text-cream'
          : 'border-white/10 bg-white/5 text-cream-2 hover:border-white/25 hover:bg-white/8'
      }`}
    >
      <span
        className={`flex flex-none items-center justify-center rounded-full transition-colors duration-300 ${
          compact ? 'h-6 w-6' : 'h-7 w-7'
        } ${active ? 'bg-ember text-ink' : 'bg-white/8 text-cream-2'}`}
      >
        <Icon name={scene.icon} size={compact ? 13 : 15} />
      </span>
      <span className={`leading-tight ${compact ? 'text-[10px]' : 'text-[11px]'}`}>{scene.name}</span>
    </button>
  )
}

/* ── interruptor ───────────────────────────────────────────────── */
function Toggle({ on, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex flex-1 items-center gap-2.5 rounded-2xl border px-3 py-2.5 transition-all duration-300 ${
        on ? 'border-ember/60 bg-ember/18 text-cream' : 'border-white/10 bg-white/5 text-cream-3 hover:bg-white/8'
      }`}
    >
      <Icon name={icon} size={15} />
      <span className="text-[12px]">{label}</span>
      <span
        className={`ml-auto h-[18px] w-8 rounded-full p-[2px] transition-colors duration-300 ${
          on ? 'bg-ember' : 'bg-white/15'
        }`}
      >
        <span
          className="block h-[14px] w-[14px] rounded-full bg-ink transition-transform duration-300"
          style={{ transform: on ? 'translateX(14px)' : 'none' }}
        />
      </span>
    </button>
  )
}

/* ── selector de cerebro ───────────────────────────────────────── */
function BrainPicker() {
  const active = useStore((s) => s.ecosystem)
  const setEcosystem = useStore((s) => s.setEcosystem)

  return (
    <div className="mt-4 border-t border-white/8 pt-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-cream-3 uppercase">
        <Icon name="hub" size={12} />
        Cerebro de la casa
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {ecosystems.map((e) => {
          const on = e.id === active
          return (
            <button
              key={e.id}
              onClick={() => setEcosystem(e.id)}
              aria-pressed={on}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] whitespace-nowrap transition-all duration-300 ${
                on ? 'border-white/35 bg-white/10 text-cream' : 'border-white/8 text-cream-3 hover:text-cream-2'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.tone }} />
              {e.short}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const TRACKS = {
  level: 'linear-gradient(to top, #6b4a1f, #ffc48a)',
  warmth: 'linear-gradient(to top, #cfe0ff, #ffa955)',
  blinds: 'linear-gradient(to top, #3a3a42, #cfc4b1)',
}

export default function ControlCenter({ compact = false }) {
  const chapter = useStore((s) => s.chapter)
  const home = useStore((s) => s.home)
  const setRoom = useStore((s) => s.setRoom)
  const runScene = useStore((s) => s.runScene)

  const entry = Object.entries(roomControls).find(([, c]) => c.chapter === chapter)
  if (!entry) return null

  const [id, cfg] = entry
  const state = home[id]

  return (
    <div
      className={`pointer-events-auto rounded-[1.6rem] border border-white/10 bg-ink/72 backdrop-blur-2xl ${
        compact ? 'p-3' : 'p-4'
      }`}
      style={{ boxShadow: '0 24px 60px -20px rgba(0,0,0,0.75)' }}
    >
      <div className={`flex items-baseline justify-between ${compact ? 'mb-2' : 'mb-3'}`}>
        <span className="text-[11px] tracking-[0.16em] text-cream-2 uppercase">{cfg.label}</span>
        <span className="text-[10px] text-cream-3">
          {state.scene ? cfg.scenes.find((s) => s.id === state.scene)?.name : 'Manual'}
        </span>
      </div>

      <div className={compact ? 'flex gap-2' : 'flex gap-3'}>
        <div className={`grid flex-1 gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-2'}`}>
          {cfg.scenes.map((scene) => (
            <SceneTile
              key={scene.id}
              scene={scene}
              compact={compact}
              active={state.scene === scene.id}
              onClick={() => runScene(id, scene.id, scene.set)}
            />
          ))}
        </div>

        {!compact && (
          <div className="flex gap-2">
            {cfg.sliders.map((s) => (
              <VSlider
                key={s.key}
                icon={s.icon}
                label={s.label}
                track={TRACKS[s.key]}
                value={state[s.key] ?? 0}
                onChange={(v) => setRoom(id, { [s.key]: v })}
              />
            ))}
          </div>
        )}
      </div>

      {!compact && cfg.toggles.length > 0 && (
        <div className="mt-2 flex gap-2">
          {cfg.toggles.map((t) => (
            <Toggle
              key={t.key}
              icon={t.icon}
              label={t.label}
              on={!!state[t.key]}
              onClick={() => setRoom(id, { [t.key]: !state[t.key] })}
            />
          ))}
        </div>
      )}

      {!compact && <BrainPicker />}
    </div>
  )
}
