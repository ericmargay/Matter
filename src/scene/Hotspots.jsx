import { useState } from 'react'
import { Html } from '@react-three/drei'
import { DEVICES } from './devices'
import { ecosystems } from '../content/site'
import { useStore } from '../store/store'
import { ROOMS, LEVEL_Y } from './layout'

/**
 * Etiquetas de cuarto: solo en el capítulo del levantamiento, donde los dos
 * pisos están separados en el aire y se pueden nombrar los dos a la vez.
 */
const ROOM_LABELS = [
  { id: 'garage', label: 'Garage', meta: '4 puntos' },
  { id: 'recibidor', label: 'Recibidor', meta: '6 puntos' },
  { id: 'sala', label: 'Sala', meta: '9 puntos' },
  { id: 'cocina', label: 'Cocina', meta: '11 puntos' },
  { id: 'bano', label: 'Medio baño', meta: '4 puntos' },
  { id: 'recamara', label: 'Recámara', meta: '8 puntos' },
  { id: 'banoP', label: 'Baño principal', meta: '6 puntos' },
  { id: 'estudio', label: 'Estudio', meta: '11 puntos' },
  { id: 'balcon', label: 'Balcón', meta: '5 puntos' },
]

/** Cuánto se levanta la planta alta en la vista explotada. */
const LIFT = 5.2

function Spot({ position, label, note }) {
  const [open, setOpen] = useState(false)

  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div
        className="hotspot animate-[spot_0.6s_var(--ease-out-expo)_both]"
        style={{ pointerEvents: 'auto' }}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="hotspot-dot" />
        <span className="hotspot-label">{label}</span>

        {note && (
          <span
            className="pointer-events-none absolute top-full left-4 mt-1.5 max-w-[15rem] rounded-lg border border-white/10 bg-ink/90 px-2.5 py-1.5 text-[11px] leading-snug text-cream-2 backdrop-blur-md transition-all duration-300"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-4px)',
              whiteSpace: 'normal',
            }}
          >
            {note}
          </span>
        )}
      </div>
    </Html>
  )
}

function RoomTag({ room, label, meta }) {
  const r = ROOMS[room]
  // la etiqueta sigue a su piso: el de arriba está levantado en este capítulo
  const y = LEVEL_Y[r.floor] + (r.floor === 1 ? LIFT : 0) + 2.0
  const pos = [(r.x[0] + r.x[1]) / 2, y, (r.z[0] + r.z[1]) / 2]

  return (
    <Html position={pos} center zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
      {/* la pastilla no es decorativa: sin ella el texto desaparece sobre la
          isla de la cocina, que es la zona más brillante de la escena */}
      <div className="animate-[spot_0.7s_var(--ease-out-expo)_both] rounded-xl border border-white/8 bg-ink/60 px-3 py-1.5 text-center backdrop-blur-md">
        <div className="display text-[15px] tracking-tight text-cream">{label}</div>
        <div className="mt-0.5 text-[10px] tracking-[0.14em] text-ember uppercase">{meta}</div>
      </div>
    </Html>
  )
}

export default function Hotspots() {
  const chapter = useStore((s) => s.chapter)
  const spots = useStore((s) => s.spots)
  const ecosystem = useStore((s) => s.ecosystem)

  if (!spots) return null

  if (chapter === 2) {
    return (
      <>
        {ROOM_LABELS.map((r) => (
          <RoomTag key={r.id} room={r.id} {...r} />
        ))}
      </>
    )
  }

  // el border router no es una marca genérica: es la pieza concreta del
  // ecosistema elegido, y decirlo así es más honesto que decir "hub"
  const eco = ecosystems.find((e) => e.id === ecosystem)
  const brain = eco?.kit.find((k) => k.shape !== 'none')

  return (
    <>
      {DEVICES.filter((d) => d.chapter === chapter).map((d) => (
        <Spot
          key={d.id}
          position={d.pos}
          label={d.id === 'border' && brain ? `${brain.name} · border router` : d.label}
          note={d.id === 'border' && brain ? brain.role : d.note}
        />
      ))}
    </>
  )
}
