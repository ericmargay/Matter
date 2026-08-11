import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * El levantamiento en curso.
 *
 * Se guarda en localStorage porque todavía no hay backend: el técnico captura
 * en la casa del cliente y no queremos que un refresh le borre dos horas de
 * trabajo. Cuando exista servidor, esto se cambia por un fetch y lo demás
 * sigue igual.
 */

const nuevoCuarto = (nombre = 'Cuarto', m2 = 15) => ({
  id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
  nombre,
  m2,
  tipo: 'interior',
  notas: '',
  items: {},
})

const VACIO = {
  folio: '',
  cliente: {
    nombre: '',
    razonSocial: '',
    rfc: '',
    regimen: '612',
    cp: '',
    usoCfdi: 'G03',
    formaPago: '03',
    metodoPago: 'PUE',
    email: '',
    tel: '',
    direccion: '',
  },
  obra: { tipo: 'Casa', m2: 180, niveles: 2, zona: 'Zona metropolitana' },
  rooms: [nuevoCuarto('Sala', 28), nuevoCuarto('Cocina', 22), nuevoCuarto('Recámara principal', 24)],
  extras: { puntosRed: 4, escenas: 8, km: 0, descuentoPct: 0, acreditaLevantamiento: true, vigencia: 15 },
}

export const useSurvey = create(
  persist(
    (set, get) => ({
      ...structuredClone(VACIO),
      activeRoom: null,

      setCliente: (patch) => set((s) => ({ cliente: { ...s.cliente, ...patch } })),
      setObra: (patch) => set((s) => ({ obra: { ...s.obra, ...patch } })),
      setExtras: (patch) => set((s) => ({ extras: { ...s.extras, ...patch } })),
      setFolio: (folio) => set({ folio }),

      addRoom: (nombre) =>
        set((s) => {
          const r = nuevoCuarto(nombre || `Cuarto ${s.rooms.length + 1}`)
          return { rooms: [...s.rooms, r], activeRoom: r.id }
        }),

      updateRoom: (id, patch) =>
        set((s) => ({ rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      removeRoom: (id) =>
        set((s) => ({
          rooms: s.rooms.filter((r) => r.id !== id),
          activeRoom: s.activeRoom === id ? null : s.activeRoom,
        })),

      setActiveRoom: (activeRoom) => set({ activeRoom }),

      /** Suma o resta piezas en un cuarto. Si no hay cuarto activo, usa el primero. */
      bump: (deviceId, delta, roomId) =>
        set((s) => {
          const target = roomId ?? s.activeRoom ?? s.rooms[0]?.id
          if (!target) return s
          return {
            activeRoom: target,
            rooms: s.rooms.map((r) =>
              r.id !== target
                ? r
                : { ...r, items: { ...r.items, [deviceId]: Math.max(0, (r.items[deviceId] ?? 0) + delta) } },
            ),
          }
        }),

      /** Cuántas piezas de este dispositivo hay en todo el levantamiento. */
      totalOf: (deviceId) =>
        get().rooms.reduce((a, r) => a + (r.items[deviceId] ?? 0), 0),

      reset: () => set({ ...structuredClone(VACIO), activeRoom: null }),
    }),
    { name: 'matter-levantamiento', version: 1 },
  ),
)

/** Folio legible: MTR-AAMM-NNN */
export function nuevoFolio() {
  const d = new Date()
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const n = String(Math.floor(Math.random() * 900) + 100)
  return `MTR-${yy}${mm}-${n}`
}
