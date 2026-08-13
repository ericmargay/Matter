import { create } from 'zustand'

import {
  ESTADOS,
  aplicar,
  nuevoCuarto,
  nuevoFolio,
  nuevoProyecto,
  reducir,
  seccionDe,
  uid,
} from '../sync/eventos'
import { conectar, enCola, mandar } from './conexion'

export { ESTADOS, nuevoFolio }

/**
 * Operaciones: proyectos, levantamiento y quién cambió qué.
 *
 * El estado no se guarda: se deriva. Cada acción arma un evento, lo aplica
 * aquí mismo para que la pantalla responda al instante, y lo manda al
 * servidor, que le pone autor y hora y se lo reparte a los demás socios.
 *
 * Dos consecuencias que valen la pena:
 *
 * — El historial no hay que escribirlo. Es la misma lista de eventos con la
 *   que se arma el estado, así que no puede quedar incompleto.
 * — Todos los eventos son idempotentes a propósito (las cantidades son
 *   absolutas, no incrementos). Por eso el evento que vuelve sellado se puede
 *   volver a aplicar encima del optimista sin cuidados especiales, y una
 *   reconexión que reenvía la cola no descuadra nada.
 *
 * Lo que NO se sincroniza: qué proyecto tienes abierto y en qué cuarto estás
 * parado. Eso es de cada quien —los dos socios pueden andar en casas
 * distintas— y vive en localStorage.
 */

/* ── preferencias locales, no compartidas ─────────────────────── */

const LLAVE_UI = 'matter-ui'

const leerUI = () => {
  try {
    return JSON.parse(localStorage.getItem(LLAVE_UI)) ?? {}
  } catch {
    return {}
  }
}

const guardarUI = (ui) => {
  try {
    localStorage.setItem(LLAVE_UI, JSON.stringify(ui))
  } catch {
    /* modo privado o cuota llena: no vale tirar la app por esto */
  }
}

/* ── envío agrupado ───────────────────────────────────────────────
   Escribir "María Fernández" son quince pulsaciones. Mandar quince eventos
   dejaría un historial ilegible y quince viajes de red por un solo cambio,
   así que el patch se acumula y sale cuando la persona deja de teclear. */

const ESPERA = 700
const buffers = new Map()

function agrupar(clave, tipo, proyectoId, mezclar, extra = {}) {
  const previo = buffers.get(clave)
  clearTimeout(previo?.timer)
  const patch = { ...(previo?.patch ?? {}), ...mezclar }

  const enviar = () => {
    buffers.delete(clave)
    despachar(tipo, proyectoId, { ...extra, patch })
  }

  buffers.set(clave, { patch, enviar, timer: setTimeout(enviar, ESPERA) })
}

/** Saca de inmediato lo que esté esperando: al cerrar la pestaña o al
 *  cambiar de proyecto no se puede quedar un cambio a medio camino. */
export function vaciarPendientes() {
  for (const b of [...buffers.values()]) {
    clearTimeout(b.timer)
    b.enviar()
  }
}

/* ── la tienda ────────────────────────────────────────────────── */

const ui = leerUI()

export const useSurvey = create((set, get) => ({
  proyectos: [],
  eventos: [],

  yo: null,
  socios: {},
  conectados: [],
  conexion: 'conectando', // conectando | listo | caido
  cargado: false,
  enCola: 0,

  activoId: ui.activoId ?? null,
  activeRoom: ui.activeRoom ?? null,

  /* ── entrada de datos del servidor ── */

  _hola: ({ usuario, socios, estado, eventos }) =>
    set((s) => {
      // lo que todavía no confirma el servidor se vuelve a poner encima del
      // estado recién llegado, para que no parpadee lo que acabas de escribir
      let base = estado
      const sinConfirmar = s.eventos.filter((e) => e.pendiente)
      for (const ev of sinConfirmar) base = aplicar(base, ev)
      return {
        yo: usuario,
        socios,
        proyectos: base.proyectos,
        eventos: [...eventos, ...sinConfirmar],
        cargado: true,
      }
    }),

  _evento: (ev) =>
    set((s) => {
      const estado = aplicar({ proyectos: s.proyectos }, ev)
      // si es el eco de algo nuestro, se sustituye el optimista por el sellado
      const i = s.eventos.findIndex((e) => e.id === ev.id)
      const eventos = i === -1 ? [...s.eventos, ev] : s.eventos.with(i, ev)
      return { proyectos: estado.proyectos, eventos, enCola: enCola() }
    }),

  _presencia: (conectados) => set({ conectados }),
  _conexion: (conexion) => set({ conexion, enCola: enCola() }),

  /**
   * Se pregunta primero quién soy por HTTP y solo entonces se abre el socket.
   *
   * Es por el mensaje de error: un WebSocket rechazado no dice por qué —el
   * navegador no expone el 401 del handshake— así que reintentaría en silencio
   * para siempre. Con una petición normal sí se distingue "no has entrado" de
   * "no hay servidor", que son dos problemas con dos soluciones distintas.
   */
  arrancar: async () => {
    const st = get()
    try {
      const r = await fetch('/api/yo', { credentials: 'same-origin' })
      if (r.status === 401) return set({ conexion: 'sin-sesion' })
      if (!r.ok) return set({ conexion: 'sin-servidor' })
      const { usuario, socios } = await r.json()
      set({ yo: usuario, socios })
    } catch {
      return set({ conexion: 'sin-servidor' })
    }

    conectar({
      onHola: st._hola,
      onEvento: st._evento,
      onPresencia: st._presencia,
      onConexion: st._conexion,
    })
  },

  /* ── proyectos ── */

  crearProyecto: (datos) => {
    const proyecto = nuevoProyecto(datos)
    despachar('proyecto.crear', proyecto.id, { proyecto })
    set({ activoId: proyecto.id, activeRoom: null })
    return proyecto.id
  },

  abrirProyecto: (id) => {
    vaciarPendientes()
    set({ activoId: id, activeRoom: null })
  },

  cerrarProyecto: () => {
    vaciarPendientes()
    set({ activoId: null, activeRoom: null })
  },

  renombrarProyecto: (id, nombre) => despachar('proyecto.editar', id, { patch: { nombre } }),
  setEstado: (id, estado) => despachar('proyecto.editar', id, { patch: { estado } }),
  archivarProyecto: (id, archivado = true) => {
    despachar('proyecto.editar', id, { patch: { archivado } })
    if (archivado && get().activoId === id) set({ activoId: null })
  },

  eliminarProyecto: (id) => {
    despachar('proyecto.eliminar', id, {})
    if (get().activoId === id) set({ activoId: null })
  },

  /** Copia cliente, propiedad y cuartos —sin piezas— a un proyecto nuevo. */
  duplicarProyecto: (id) => {
    const orig = get().proyectos.find((p) => p.id === id)
    if (!orig) return null
    const proyecto = nuevoProyecto({
      nombre: `${orig.nombre} (copia)`,
      cliente: orig.cliente,
      obra: orig.obra,
      extras: orig.extras,
      rooms: orig.rooms.map((r) => ({ ...nuevoCuarto(r.nombre, r.m2, r.tipo), notas: r.notas })),
    })
    despachar('proyecto.crear', proyecto.id, { proyecto })
    set({ activoId: proyecto.id, activeRoom: null })
    return proyecto.id
  },

  /* ── levantamiento del proyecto abierto ── */

  setCliente: (patch) => {
    const id = get().activoId
    if (!id) return
    aplicarYa(set, get, 'cliente.editar', id, { patch })
    agrupar(`${id}:cliente`, 'cliente.editar', id, patch)
  },

  setObra: (patch) => {
    const id = get().activoId
    if (!id) return
    aplicarYa(set, get, 'obra.editar', id, { patch })
    agrupar(`${id}:obra`, 'obra.editar', id, patch)
  },

  setExtras: (patch) => {
    const id = get().activoId
    if (!id) return
    aplicarYa(set, get, 'servicios.editar', id, { patch })
    agrupar(`${id}:servicios`, 'servicios.editar', id, patch)
  },

  setFolio: (folio) => {
    const id = get().activoId
    if (id) despachar('proyecto.editar', id, { patch: { folio } })
  },

  addRoom: (nombre) => {
    const id = get().activoId
    if (!id) return null
    const p = get().proyectos.find((x) => x.id === id)
    const cuarto = nuevoCuarto(nombre || `Cuarto ${(p?.rooms.length ?? 0) + 1}`)
    despachar('cuarto.agregar', id, { cuarto })
    set({ activeRoom: cuarto.id })
    return cuarto.id
  },

  updateRoom: (cuartoId, patch) => {
    const id = get().activoId
    if (!id) return
    const nombre = cuartoNombre(get(), id, cuartoId)
    aplicarYa(set, get, 'cuarto.editar', id, { cuartoId, cuartoNombre: nombre, patch })
    agrupar(`${id}:${cuartoId}`, 'cuarto.editar', id, patch, { cuartoId, cuartoNombre: nombre })
  },

  removeRoom: (cuartoId) => {
    const id = get().activoId
    if (!id) return
    despachar('cuarto.eliminar', id, { cuartoId, cuartoNombre: cuartoNombre(get(), id, cuartoId) })
    if (get().activeRoom === cuartoId) set({ activeRoom: null })
  },

  setActiveRoom: (activeRoom) => set({ activeRoom }),

  /** Suma o resta piezas. Viaja la cantidad final, no el incremento. */
  bump: (deviceId, delta, roomId) => {
    const s = get()
    const p = s.proyectos.find((x) => x.id === s.activoId)
    if (!p) return
    const target = roomId ?? s.activeRoom ?? p.rooms[0]?.id
    const cuarto = p.rooms.find((r) => r.id === target)
    if (!cuarto) return

    const anterior = cuarto.items?.[deviceId] ?? 0
    const qty = Math.max(0, anterior + delta)
    if (qty === anterior) return

    if (!roomId) set({ activeRoom: target })
    despachar('equipo.cantidad', p.id, {
      cuartoId: target,
      cuartoNombre: cuarto.nombre,
      deviceId,
      qty,
      anterior,
    })
  },

  setQty: (deviceId, qty, roomId) => {
    const s = get()
    const p = s.proyectos.find((x) => x.id === s.activoId)
    if (!p) return
    const target = roomId ?? s.activeRoom ?? p.rooms[0]?.id
    const cuarto = p.rooms.find((r) => r.id === target)
    if (!cuarto) return
    despachar('equipo.cantidad', p.id, {
      cuartoId: target,
      cuartoNombre: cuarto.nombre,
      deviceId,
      qty: Math.max(0, qty),
      anterior: cuarto.items?.[deviceId] ?? 0,
    })
  },

  totalOf: (deviceId) => {
    const s = get()
    const p = s.proyectos.find((x) => x.id === s.activoId)
    return p ? p.rooms.reduce((a, r) => a + (r.items[deviceId] ?? 0), 0) : 0
  },

  vaciarPiezas: () => {
    const id = get().activoId
    if (id) despachar('equipo.vaciar', id, {})
  },
}))

/* ── despacho ─────────────────────────────────────────────────── */

const cuartoNombre = (s, proyectoId, cuartoId) =>
  s.proyectos.find((p) => p.id === proyectoId)?.rooms.find((r) => r.id === cuartoId)?.nombre ?? ''

/**
 * Arma el evento, lo aplica de inmediato y lo manda.
 *
 * El autor que se pone aquí es provisional y sirve solo para pintar el
 * historial mientras el servidor responde: el definitivo lo pone él, a partir
 * de la sesión, y llega con el eco.
 */
function despachar(tipo, proyectoId, datos) {
  const st = useSurvey.getState()
  const ev = {
    id: uid('e'),
    tipo,
    proyectoId,
    datos,
    autor: st.yo ?? '—',
    ts: new Date().toISOString(),
    pendiente: true,
  }
  st._evento(ev)
  mandar(ev)
  useSurvey.setState({ enCola: enCola() })
  return ev
}

/** Para los campos que se agrupan: se ve el cambio ya, el evento sale luego. */
function aplicarYa(set, get, tipo, proyectoId, datos) {
  const estado = aplicar({ proyectos: get().proyectos }, { tipo, proyectoId, datos })
  set({ proyectos: estado.proyectos })
}

/* ── selectores ───────────────────────────────────────────────── */

/**
 * El proyecto abierto, o `null`.
 *
 * Devuelve el objeto tal cual vive en el arreglo —no una copia— porque zustand
 * v5 compara por identidad: un selector que construya algo nuevo en cada
 * render haría que React se queje del snapshot y vuelva a renderizar en bucle.
 */
export const useProyecto = () => useSurvey((s) => s.proyectos.find((p) => p.id === s.activoId) ?? null)

/** Quién hizo un cambio, listo para pintarse. */
export const useSocio = (usuario) =>
  useSurvey(
    (s) => s.socios[usuario] ?? { nombre: usuario ?? 'desconocido', corto: usuario ?? '—', color: '#9c9388' },
  )

/** Historial de un proyecto, lo más reciente primero. */
export function historial(eventos, proyectoId, seccion) {
  return eventos
    .filter((e) => e.proyectoId === proyectoId && (!seccion || seccionDe(e.tipo) === seccion))
    .slice()
    .reverse()
}

/**
 * Cuándo se creó y cuándo se tocó por última vez cada proyecto, y quién.
 *
 * Sale del registro y no de un campo guardado en el proyecto: un campo hay que
 * acordarse de actualizarlo en cada acción y tarde o temprano se olvida una.
 * El primer y el último evento no se pueden desincronizar de la realidad
 * porque SON la realidad.
 */
export function fechasPorProyecto(eventos) {
  const m = new Map()
  for (const e of eventos) {
    const previo = m.get(e.proyectoId)
    if (!previo) m.set(e.proyectoId, { creado: e.ts, creadoPor: e.autor, tocado: e.ts, tocadoPor: e.autor })
    else if (e.ts >= previo.tocado) {
      previo.tocado = e.ts
      previo.tocadoPor = e.autor
    }
  }
  return m
}

/* ── efectos de módulo ────────────────────────────────────────── */

// las preferencias locales se persisten solas al cambiar
useSurvey.subscribe((s, antes) => {
  if (s.activoId !== antes.activoId || s.activeRoom !== antes.activeRoom) {
    guardarUI({ activoId: s.activoId, activeRoom: s.activeRoom })
  }
})

if (typeof window !== 'undefined') {
  // cerrar la pestaña con un nombre a medio escribir no puede perderlo
  window.addEventListener('pagehide', vaciarPendientes)
}

/** Reconstruye el estado desde cero. Solo lo usan las pruebas. */
export const estadoDesde = reducir
