import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { DEVICE_BY_ID } from '../../../content/catalog'

/**
 * Qué pasa cuando pasa algo.
 *
 * Esta es la parte que separa el plano de una maqueta bonita. Un editor 3D
 * genérico te deja decir "al hacer clic, mueve esto en 0.30 s con ease in
 * out" — números que alguien escogió porque se veían bien. Aquí no hay que
 * escogerlos: la persiana tarda lo que tarda una persiana, el foco atenúa en
 * la rampa que trae de fábrica, y el relevador de un enchufe cierra en un
 * suspiro. Los tiempos salen del aparato, no del gusto de quien anima.
 *
 * Eso importa por una razón práctica: lo que se arma aquí no es una animación,
 * es **la especificación de la automatización que se va a programar en la
 * puesta en marcha**. El mismo objeto sirve para enseñarle al cliente cómo va
 * a quedar y para que quien configure el HomePod sepa qué escribir. Si la
 * animación miente sobre el tiempo, el cliente se lleva una expectativa que la
 * casa no va a cumplir — y esa decepción se paga en la entrega.
 */

/* ── qué dispara ──────────────────────────────────────────────── */

/**
 * `pide` dice qué hay que completar para que el disparador quede definido:
 * una pieza del plano, una frase, una hora, o nada.
 */
export const DISPAROS = {
  apagador: {
    label: 'Apagador de pared',
    pide: 'punto',
    ayuda: 'El que ya está. Se conserva y se le mete el módulo detrás o en la luminaria.',
  },
  presencia: {
    label: 'El sensor ve a alguien',
    pide: 'equipo',
    cat: 'sensores',
    ayuda: 'Entrar al cuarto enciende. Es lo que más impresiona en la demostración.',
  },
  vacio: {
    label: 'El cuarto se queda solo',
    pide: 'equipo',
    cat: 'sensores',
    ayuda: 'Con retardo, si no se apaga encima de quien sigue ahí quieto.',
  },
  contacto: {
    label: 'Se abre la puerta',
    pide: 'equipo',
    cat: 'sensores',
    ayuda: 'Sensor de contacto en marco o ventana.',
  },
  voz: {
    label: 'Comando de voz',
    pide: 'frase',
    ayuda: 'Funciona en HomePod mini y en Echo Dot. Conviene que la frase sea corta y no se parezca a otra.',
  },
  horario: {
    label: 'A cierta hora',
    pide: 'hora',
    ayuda: 'También sirve para “al atardecer”, que el hub calcula solo según la fecha.',
  },
  gas: {
    label: 'El detector de gas se dispara',
    pide: 'equipo',
    cat: 'sensores',
    ayuda:
      'Mientras no haya válvula de corte instalada a norma, esto es lo que protege: el aviso llega al teléfono aunque no haya nadie en casa.',
  },
  llegada: {
    label: 'Alguien llega a casa',
    pide: null,
    ayuda: 'Por la ubicación del teléfono. Pide que todos tengan la app del ecosistema.',
  },
}

/* ── qué hace ─────────────────────────────────────────────────── */

export const ACCIONES = {
  /* Avisar no mueve nada, y en el caso del gas eso es justamente el punto:
     con fuga NO se debe abrir ni cerrar un solo contacto eléctrico, porque
     abrir o cerrar hace chispa. La automatización avisa; ventilar y cerrar la
     llave lo hace una persona con la mano. */
  avisar: { label: 'Avisar al teléfono', sinObjetivo: true },
  alarma: { label: 'Sonar la alarma', sinObjetivo: true },
  /* El seguro. Después de una fuga, la casa se queda quieta: ninguna
     automatización vuelve a mover un relevador hasta que una persona lo
     libere. Cada contacto que abre o cierra hace chispa, y en una casa con
     gas acumulado el sensor de presencia del pasillo prendiendo una luz es
     tan peligroso como el extractor. Es de las cosas que solo se le ocurren a
     alguien que ya pensó en qué pasa DESPUÉS de la alarma. */
  bloquear: {
    label: 'Bloquear las automatizaciones',
    sinObjetivo: true,
    ayuda: 'Nada vuelve a moverse solo hasta que alguien lo libere a mano o desde el teléfono.',
  },
  encender: { label: 'Encender' },
  apagar: { label: 'Apagar' },
  alternar: { label: 'Alternar', ayuda: 'Si está prendido apaga, y al revés. Es como se porta un apagador.' },
  atenuar: { label: 'Atenuar a', valor: true, unidad: '%', min: 0, max: 100, def: 40 },
  tono: { label: 'Poner el tono en', valor: true, unidad: 'K', min: 2200, max: 6500, paso: 100, def: 2700 },
  abrir: { label: 'Abrir a', valor: true, unidad: '%', min: 0, max: 100, def: 100 },
}

/** Qué acciones acepta cada cosa. Ofrecer “atenuar” a un enchufe es mentir. */
export function accionesDe(device) {
  if (!device) return ['avisar', 'alarma', 'bloquear', 'alternar', 'encender', 'apagar']
  if (device.cat === 'cortinas') return ['abrir', 'alternar']
  if (device.luz) return ['alternar', 'encender', 'apagar', 'atenuar', 'tono']
  return ['alternar', 'encender', 'apagar']
}

/* ── cuánto tarda de verdad ───────────────────────────────────── */

/**
 * Segundos que tarda el aparato en llegar a donde se le mandó.
 *
 * No son tiempos de animación: son los del catálogo y los de haberlas visto
 * operar. Una persiana motorizada de metro y medio se toma sus diez o doce
 * segundos y no hay forma de apurarla; un foco atenuable llega en menos de
 * medio segundo; un relevador de enchufe cierra y ya.
 *
 * Que el plano se tarde lo mismo es lo que evita la conversación incómoda de
 * la entrega — “¿por qué mi cortina no se abre de golpe como en la
 * presentación?”.
 */
const SEGUNDOS_POR_CAT = {
  cortinas: 12,
  cerraduras: 1.6,
  pantallas: 4,
  energia: 0.15,
}

export function duracionDe(device, accion) {
  if (accion === 'avisar' || accion === 'alarma' || accion === 'bloquear') return 0.2
  if (accion === 'tono') return 0.9
  const s = SEGUNDOS_POR_CAT[device?.cat]
  if (s != null) return s
  return device?.luz ? 0.4 : 0.3
}

/* ── el modelo ────────────────────────────────────────────────── */

export const compVacio = (id) => ({
  id,
  nombre: '',
  cuando: { tipo: 'apagador', ref: null, valor: null },
  entonces: [],
})

/**
 * Las reglas viejas eran un caso particular de esto: un apagador que alterna
 * un grupo. Se leen como comportamientos para no perder lo ya levantado ni
 * pedirle a nadie que lo vuelva a capturar.
 */
export function comportamientosDe(plano) {
  if (plano.comportamientos) return plano.comportamientos
  return (plano.reglas ?? []).map((r) => ({
    id: r.id,
    nombre: '',
    cuando: { tipo: 'apagador', ref: r.disparo, valor: null },
    entonces: (r.destinos ?? []).map((objetivo) => ({ objetivo, accion: 'alternar', valor: null })),
  }))
}

/** Cómo se lee un comportamiento en una línea, para la lista y el resumen. */
export function frasear(comp, items) {
  const nombreDe = (id) => {
    const it = items.find((x) => x.id === id)
    if (!it) return 'algo'
    return it.clase === 'equipo' ? (DEVICE_BY_ID[it.deviceId]?.name ?? 'dispositivo') : it.tipo
  }

  const d = DISPAROS[comp.cuando.tipo]
  let cuando = d?.label ?? '—'
  if (d?.pide === 'frase' && comp.cuando.valor) cuando = `Se dice “${comp.cuando.valor}”`
  if (d?.pide === 'hora' && comp.cuando.valor) cuando = `A las ${comp.cuando.valor}`

  const entonces =
    comp.entonces
      .map((a) => {
        const acc = ACCIONES[a.accion]
        const v = acc?.valor ? ` ${a.valor}${acc.unidad}` : ''
        return `${acc?.label ?? a.accion}${v} ${nombreDe(a.objetivo)}`
      })
      .join(', ') || 'nada todavía'

  return { cuando, entonces }
}

/* ── el simulador ─────────────────────────────────────────────── */

/** Estado en el que nace cada pieza: como se ve al entrar al cuarto. */
const inicial = (item) => ({
  nivel: 1, // fracción del brillo que trae la pieza
  apertura: DEVICE_BY_ID[item.deviceId]?.cat === 'cortinas' ? 0 : 1,
  k: item.params?.k ?? 2700,
})

/**
 * Corre los comportamientos y anima hacia el estado nuevo.
 *
 * La interpolación es lineal a propósito. Un `ease in out` se ve más elegante
 * y es exactamente el tipo de mentira que no queremos: una persiana sube a
 * velocidad constante, no acelera al principio ni frena al final. Lo que se ve
 * en pantalla tiene que ser lo que se va a ver en la casa.
 */
export function useSimulacion(plano) {
  const items = plano.items
  const comps = useMemo(() => comportamientosDe(plano), [plano])

  /* El estado vive en una ref y se copia a React para pintar.
     La primera versión lo tenía solo en `useState` y mutaba `anim` dentro del
     updater — que React ejecuta cuando le conviene, no cuando se le llama. El
     resultado: el reloj de la transición arrancaba DESPUÉS de haberse leído,
     `t` salía negativo y las luces subían de 1 a 1.03 en vez de bajar a 0, y
     ahí se quedaban. Los updaters tienen que ser puros; el reloj y el bucle
     van por fuera. */
  const estado = useRef(Object.fromEntries(items.map((i) => [i.id, inicial(i)])))
  const [sim, setSim] = useState(estado.current)

  const anim = useRef(new Map())
  const raf = useRef(0)

  /* `bloqueo` no es parte de `sim` porque no es el estado de una pieza: es el
     estado de la CASA. Guarda qué comportamiento lo puso, para poder decir en
     pantalla por qué nada responde — un bloqueo silencioso se siente a
     descompostura. */
  const [bloqueo, setBloqueo] = useState(null)

  // piezas nuevas o borradas: el estado sigue a los items sin perder lo puesto
  useEffect(() => {
    const s = {}
    for (const i of items) s[i.id] = estado.current[i.id] ?? inicial(i)
    estado.current = s
    setSim(s)
  }, [items])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const correr = useCallback(() => {
    cancelAnimationFrame(raf.current)

    const paso = () => {
      const ahora = performance.now()
      const s = { ...estado.current }
      let vivos = false

      for (const [id, a] of anim.current) {
        const t = a.dur <= 0 ? 1 : Math.max(0, Math.min(1, (ahora - a.t0) / (a.dur * 1000)))
        const mez = (de, hacia) => de + (hacia - de) * t
        const previo = s[id] ?? { nivel: 1, apertura: 1, k: 2700 }
        s[id] = {
          nivel: a.nivel != null ? mez(a.de.nivel, a.nivel) : previo.nivel,
          apertura: a.apertura != null ? mez(a.de.apertura, a.apertura) : previo.apertura,
          k: a.k != null ? Math.round(mez(a.de.k, a.k)) : previo.k,
        }
        if (t >= 1) anim.current.delete(id)
        else vivos = true
      }

      estado.current = s
      setSim(s)
      if (vivos) raf.current = requestAnimationFrame(paso)
    }

    raf.current = requestAnimationFrame(paso)
  }, [])

  /** Manda una pieza a un destino, con el tiempo que le toca al aparato. */
  const mandar = useCallback(
    (objetivo, accion, valor) => {
      const it = items.find((x) => x.id === objetivo)
      if (!it) return
      const dev = DEVICE_BY_ID[it.deviceId]
      const de = estado.current[objetivo] ?? inicial(it)
      const destino = { de, t0: performance.now(), dur: duracionDe(dev, accion) }

      if (accion === 'avisar' || accion === 'alarma' || accion === 'bloquear') return
      if (accion === 'encender') destino.nivel = 1
      else if (accion === 'apagar') destino.nivel = 0
      else if (accion === 'atenuar') destino.nivel = Math.max(0, Math.min(1, (valor ?? 0) / 100))
      else if (accion === 'tono') destino.k = valor ?? 2700
      else if (accion === 'abrir') destino.apertura = Math.max(0, Math.min(1, (valor ?? 100) / 100))
      else if (accion === 'alternar') {
        if (dev?.cat === 'cortinas') destino.apertura = de.apertura > 0.5 ? 0 : 1
        else destino.nivel = de.nivel > 0.02 ? 0 : 1
      }

      anim.current.set(objetivo, destino)
    },
    [items],
  )

  /** Dispara un comportamiento completo. */
  const disparar = useCallback(
    (compId) => {
      const c = comps.find((x) => x.id === compId)
      if (!c) return

      const bloquea = c.entonces.some((a) => a.accion === 'bloquear')

      /* Con la casa bloqueada no corre nada — ni siquiera el comportamiento
         que la bloqueó, para que probarlo dos veces no reinicie el reloj. Lo
         único que la saca es una mano: `liberar()`. */
      if (bloqueo && !bloquea) return

      for (const a of c.entonces) mandar(a.objetivo, a.accion, a.valor)
      if (bloquea) setBloqueo({ comp: c.id, nombre: c.nombre || frasear(c, items).cuando, desde: Date.now() })
      correr()
    },
    [comps, mandar, correr, bloqueo, items],
  )

  /** Dispara lo que cuelgue de una pieza del plano — tocar el apagador. */
  const dispararPorPieza = useCallback(
    (itemId) => {
      for (const c of comps) if (c.cuando.ref === itemId) disparar(c.id)
    },
    [comps, disparar],
  )

  /** Lo que hace una persona: reconocer la alarma y devolver la casa a modo
   *  normal. En la instalación real es un botón en la app o el interruptor
   *  físico de la sirena. */
  const liberar = useCallback(() => setBloqueo(null), [])

  return { sim, comps, disparar, dispararPorPieza, bloqueo, liberar }
}
