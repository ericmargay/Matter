import { create } from 'zustand'

/**
 * scrollState es intencionalmente NO reactivo.
 * El scroll cambia 60 veces por segundo; si eso pasara por React,
 * re-renderizaríamos el árbol entero cada frame. El render loop de
 * R3F lee este objeto directamente y solo el índice de capítulo
 * (que cambia ~8 veces en toda la página) vive en el store de React.
 */
export const scrollState = {
  progress: 0, // 0..1 a lo largo de todo el recorrido 3D
  index: 0, // capítulo entero actual
  t: 0, // 0..1 dentro del capítulo actual
  pageY: 0,
  storyOut: 0, // 0..1 cuánto se ha salido la escena al terminar la historia

  // escritos por CameraRig cada frame, leídos por la casa y la malla
  cut: 0, // 0 casa cerrada · 1 dollhouse abierto
  up: 1, // 0 planta alta oculta · 1 visible
  lift: 0, // 0 pisos apilados · 1 axonometría explotada
  net: 0, // 0 casa sólida · 1 casa fantasma + malla Thread
}

export const useStore = create((set, get) => ({
  ready: false,
  setReady: (ready) => set({ ready }),

  started: false,
  start: () => set({ started: true }),

  // capítulo activo (reactivo, para la UI)
  chapter: 0,
  setChapter: (chapter) => {
    if (get().chapter !== chapter) set({ chapter })
  },

  // ecosistema seleccionado — cambia el hardware que aparece en la escena
  ecosystem: 'apple',
  setEcosystem: (ecosystem) => set({ ecosystem }),

  /**
   * Estado de la casa. Lo mueve el centro de control y lo lee la escena.
   * Vive en React (y no en un objeto mutable como scrollState) porque
   * cambia solo cuando alguien toca algo, no sesenta veces por segundo.
   */
  /* Los valores de arranque no son neutros: son las 9:40 de la noche con
     gente en casa. Eso es lo que hace que desde la calle se vea luz cálida
     por las ventanas en vez de una maqueta apagada. */
  home: {
    garage: { level: 0, warmth: 0.4, scene: null },
    recibidor: { level: 0.4, warmth: 0.95, scene: 'llegue' },
    sala: { level: 0.68, warmth: 0.85, blinds: 0.35, tv: true, scene: 'estar' },
    cocina: { level: 0.5, warmth: 0.75, scene: 'cena' },
    bano: { level: 0.05, warmth: 1, fan: false, scene: 'noche' },
    recamara: { level: 0.32, warmth: 1, blinds: 0.4, scene: 'leer' },
    banoP: { level: 0.06, warmth: 1, fan: false, scene: 'noche' },
    estudio: { level: 0.7, warmth: 0.5, busy: false, scene: 'trabajo' },
    balcon: { level: 0.35, warmth: 1, feeder: false, scene: 'tarde' },
  },

  /** Un control suelto: subir el brillo, abrir la persiana. */
  setRoom: (id, patch) =>
    set((s) => ({
      home: {
        ...s.home,
        // tocar un control saca al cuarto de la escena en la que estaba
        [id]: { ...s.home[id], ...patch, scene: patch.scene ?? null },
      },
    })),

  /** Una escena completa: varios dispositivos a la vez, que es el punto. */
  runScene: (id, sceneId, preset) =>
    set((s) => ({
      home: { ...s.home, [id]: { ...s.home[id], ...preset, scene: sceneId } },
    })),

  // los hotspots se guardan mientras el hero manda: si no, las etiquetas
  // caen encima del titular
  spots: false,
  setSpots: (spots) => {
    if (get().spots !== spots) set({ spots })
  },

  // 'high' | 'low' — degradado para móviles y equipos lentos
  quality: 'high',
  setQuality: (quality) => set({ quality }),

  /* ── cosas de la escena que el asistente puede mover ───────────
     Van aquí y no en `home` porque no son "una luz de un cuarto":
     el portón es un motor con dos estados y el alimentador es un
     evento puntual que la escena anima a partir de su marca de tiempo. */
  garageOpen: false,
  setGarage: (garageOpen) => set({ garageOpen }),

  fedAt: 0,
  feed: () => {
    set({ fedAt: performance.now() })
    // el plato queda servido: el balcón lo refleja en su toggle
    const s = get()
    s.setRoom('balcon', { feeder: true })
    setTimeout(() => useStore.getState().setRoom('balcon', { feeder: false }), 4000)
  },

  /* ── asistente de voz ──────────────────────────────────────────
     phase: null (en reposo) · 'listening' · 'reply' */
  voice: { chapter: null, phase: null, reply: '' },
  setVoice: (voice) => set({ voice }),

  menuOpen: false,
  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),
  closeMenu: () => set({ menuOpen: false }),
}))
