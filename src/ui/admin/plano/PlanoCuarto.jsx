import { Suspense, lazy, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import { CATEGORIES, DEVICE_BY_ID, ECOSYSTEMS, LINK_LABEL } from '../../../content/catalog'
import { uid, planoVacio } from '../../../sync/eventos'
import { useSurvey } from '../../../store/survey'
import { ARRANQUE, ID_MUROS, MUEBLES, POR_TIPO, TIPOS, tipoPorNombre } from './catalogo'
import { MUROS_ACABADO, PISOS } from './acabados'
import { cableDeMueble, cablePorDefecto, llevaCable } from './cables'
import { COLOR as COLOR_CABLE } from './cables.jsx'
import { useEstilo } from './estilo'
import {
  agrandarSiNoCabe,
  anclaAuto,
  anclaEnEsquina,
  anclaEnMuro,
  comoSeLlama,
  GIRO_MURO,
  limitarPorSolape,
  murosCerca,
  resolverAnclas,
  sonContiguos,
} from './anclas'
import { MUEBLES_DE_MURO } from './muros'
import { comoAloja, dispositivosDe } from './aloja'
import { ESPACIOS } from '../../../content/espacios'
import { DISPOSICIONES } from './paneles'

/* El Style Lab se carga solo cuando se abre: calibrar es una tarea aparte de
   levantar, y su panel no tiene por qué viajar en el bundle del editor. */
const StyleLab = lazy(() => import('./StyleLab'))
const Ambientaciones = lazy(() => import('./Ambientaciones'))
const TallerPieza = lazy(() => import('./TallerPieza'))
import { ALTURA_POR_FORMA, diagnosticoLux, luxDelCuarto, parametrosIniciales } from './luz'
import {
  ACCIONES,
  DISPAROS,
  accionesDe,
  compVacio,
  duracionDe,
  frasear,
  useSimulacion,
} from './comportamiento'

/* three pesa; el plano se carga solo cuando alguien lo abre */
const Escena = lazy(() => import('./Escena'))

/**
 * El plano de una habitación.
 *
 * Para qué sirve, en una frase: para discutir la instalación con el cliente
 * antes de taladrar. Dónde queda cada pieza, cuánta luz va a dar el cuarto,
 * por dónde corre el cable y qué apaga cada apagador — todo eso hoy se
 * resuelve en la cabeza del que levanta y se pierde en el camino a la obra.
 *
 * No pretende ser un software de arquitectura. Las medidas son las del
 * levantamiento y la geometría es una caja: lo que se está diseñando aquí es
 * la instalación, no la casa.
 */

const num = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def)

/* ── piezas de interfaz ───────────────────────────────────────── */

function Grupo({ titulo, children, right }) {
  return (
    <section className="border-b border-line last:border-0">
      <header className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <h3 className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">{titulo}</h3>
        {right}
      </header>
      <div className="px-3 pb-3">{children}</div>
    </section>
  )
}

function Chip({ activo, onClick, children, tono }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activo}
      className={`rounded-lg border px-2 py-1 text-left text-[11.5px] transition-colors ${
        activo ? 'border-ember bg-ember text-ink' : `border-line text-cream-2 hover:border-cream/35 ${tono ?? ''}`
      }`}
    >
      {children}
    </button>
  )
}

const inputCls =
  'w-full rounded border border-line bg-ink px-2 py-1 text-[12px] text-cream outline-none focus:border-ember/60'

function Medida({ label, value, onChange, step = 0.1, min = 0.5, disabled = false, title }) {
  return (
    <label className="block" title={disabled ? title : undefined}>
      <span className="mb-0.5 block text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(num(e.target.value))}
        className={`${inputCls} ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
      />
    </label>
  )
}

/* ── editor ───────────────────────────────────────────────────── */

/**
 * Deshacer y rehacer sobre el plano del cuarto.
 *
 * Se puede hacer barato porque cada cambio ya escribe el plano ENTERO: la
 * historia es una pila de fotos, no una lista de operaciones que haya que
 * invertir. Deshacer es volver a guardar una foto vieja, y por eso también
 * viaja a los demás socios y queda en el historial como cualquier otro cambio
 * — que es lo correcto: si Carpio deshace algo, del otro lado tiene que
 * desaparecer.
 *
 * Lo que sí hace falta pensar es el agrupado. Arrastrar una pieza dispara
 * decenas de guardados por segundo; sin agrupar, Ctrl+Z devolvería un
 * milímetro. Dos cambios seguidos con el mismo motivo y a menos de segundo y
 * medio cuentan como uno solo, así que un arrastre completo se deshace de un
 * golpe.
 */
const SIN_PROPIOS = []

/* Dos vocabularios para los mismos cuatro muros: la escena 3D los nombra
   norte/sur/este/oeste —así están las mallas contra las que se pica—, y el
   sistema de anclas los nombra x-/x+/z-/z+ —así los espera `anclaEnMuro`—.
   Nacieron en momentos distintos y no valía la pena unificarlos; esto es
   nada más la traducción. */
const ANCLA_DE_MURO = { norte: 'z-', sur: 'z+', oeste: 'x-', este: 'x+' }

const NOMBRE_SUPERFICIE = { piso: 'el piso', muro: 'un muro', techo: 'el plafón' }

const PASOS = 60
const JUNTOS = 1500

function useHistoria(plano, aplicar) {
  const pasado = useRef([])
  const futuro = useRef([])
  const ultimo = useRef({ que: null, t: 0 })
  const ahora = useRef(plano)
  const [, redibujar] = useReducer((n) => n + 1, 0)

  ahora.current = plano

  const anotar = (antes, que) => {
    const t = Date.now()
    const seguido = que != null && que === ultimo.current.que && t - ultimo.current.t < JUNTOS
    ultimo.current = { que, t }
    if (seguido) return // mismo gesto: ya quedó guardada la foto de antes
    pasado.current.push({ plano: antes, que })
    if (pasado.current.length > PASOS) pasado.current.shift()
    futuro.current = []
    redibujar()
  }

  const saltar = (de, a, prefijo) => {
    const paso = de.current.pop()
    if (!paso) return
    a.current.push({ plano: ahora.current, que: paso.que })
    aplicar(paso.plano, `${prefijo} ${(paso.que ?? 'un cambio').toLowerCase()}`)
    ultimo.current = { que: null, t: 0 }
    redibujar()
  }

  return {
    anotar,
    deshacer: () => saltar(pasado, futuro, 'Deshizo:'),
    rehacer: () => saltar(futuro, pasado, 'Rehízo:'),
    queDeshace: pasado.current.at(-1)?.que ?? null,
    queRehace: futuro.current.at(-1)?.que ?? null,
  }
}

export default function PlanoCuarto({ room, onCerrar }) {
  const setPlano = useSurvey((s) => s.setPlano)
  const nuevoDevice = useSurvey((s) => s.nuevoDevice)
  const quitarDevice = useSurvey((s) => s.quitarDevice)
  /* Sin el `?? []` DENTRO del selector: devolver un array nuevo en cada lectura
     hace que la tienda crea que cambió siempre, y eso es un ciclo de render
     infinito —React lo corta con "Maximum update depth" y se cae el editor
     entero—. El vacío se pone fuera, con una constante que no cambia. */
  const propios = useSurvey((s) => s.proyectos.find((p) => p.id === s.activoId)?.devices) ?? SIN_PROPIOS

  const plano = useMemo(() => ({ ...planoVacio(room.m2), ...(room.plano ?? {}) }), [room.plano, room.m2])
  const tipo = plano.tipoCuarto ?? tipoPorNombre(room.nombre)

  const [seleccion, setSeleccion] = useState(null)
  /* El cable seleccionado vive aparte de `seleccion`: no es un item del
     plano —es un campo dentro de otro item—, así que no puede compartir el
     mismo id. Elegir uno u otro es excluyente: seleccionar una pieza suelta
     el cable elegido, y al revés. */
  const [cableSeleccionado, setCableSeleccionado] = useState(null)
  const [colocando, setColocando] = useState(null)
  /* Dónde caería la pieza AHORA MISMO, mientras se arrastra —piso, muro o
     plafón, el que haya debajo del puntero en este instante—. Es lo que
     pinta el fantasma; se limpia cada vez que se deja de colocar algo. */
  const [puntero, setPuntero] = useState(null)
  useEffect(() => {
    if (!colocando) setPuntero(null)
  }, [colocando])
  /* Se abre de DÍA. De noche, un cuarto sin luces colocadas es una pantalla
     negra, y esa no es la primera impresión de una herramienta que funciona.
     El modo noche es para lo otro: juzgar si con estas piezas se ve. */
  const [modo, setModo] = useState('dia')

  /* Qué cota se está editando: null | 'x' | 'z'. Es un modo aparte a
     propósito. Mientras dura, la cámara no gira y nada se selecciona ni se
     arrastra — cambiar una medida es un gesto de precisión, y compartirlo con
     el orbitado hacía imposible atinarle. */
  const [midiendo, setMidiendo] = useState(null)

  /* Un modo a la vez. Es la diferencia entre acomodar y pelearse: con mover y
     girar vivos al mismo tiempo, arrastrar una pieza la giraba de pasada. */
  const [modoGizmo, setModoGizmo] = useState('mover')

  const [lab, setLab] = useState(false)
  const [simulando, setSimulando] = useState(false)
  /* El simulador vive aquí y no en el store: es estado de la demostración,
     no del levantamiento. Que el cliente deje una luz apagada probando no
     tiene por qué viajarle a Carpio ni quedar en el historial. */
  const { sim, comps, disparar, dispararPorPieza, correr, bloqueo, liberar } = useSimulacion(plano)
  const [uniendo, setUniendo] = useState(null)
  /* Qué pieza está en el taller. Es un modo aparte, no un panel: el cuarto
     desaparece para que se vea lo que se está cambiando. */
  /* La entrada al taller es un movimiento, no un corte. Primero la cámara del
     cuarto vuela hasta la pieza; cuando llega, el taller se monta con la
     cámara EN LA MISMA pose y aparece encima con una disolvencia. Como la
     pieza está en el mismo sitio y del mismo tamaño en las dos escenas, lo que
     se ve es el cuarto desvaneciéndose alrededor de algo que no se movió. */
  const [enTaller, setEnTaller] = useState(null)
  const [enfoque, setEnfoque] = useState(null)
  const [poseTaller, setPoseTaller] = useState(null)
  const [poseAntes, setPoseAntes] = useState(null)
  const [rectCuarto, setRectCuarto] = useState(null)
  /* Qué clavija está en la mano. Es estado de gesto, no del levantamiento: no
     se guarda ni viaja a nadie. */
  const [enMano, setEnMano] = useState(null)
  const [visible, setVisible] = useState(false)
  const [altaDevice, setAltaDevice] = useState(false)

  // el fondo no debe desplazarse detrás del editor
  useEffect(() => {
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      /* Nada de atajos mientras se escribe. Sin esto, un Backspace corrigiendo
         una medida borraba la pieza seleccionada, y teclear "sala" en un campo
         cambiaba el modo del gizmo a escalar. */
      const t = e.target
      const escribiendo =
        t instanceof HTMLElement &&
        (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

      if (e.key === 'Escape') {
        if (enMano) setEnMano(null)
        else if (midiendo) setMidiendo(null)
        else if (uniendo) setUniendo(null)
        else if (colocando) setColocando(null)
        else if (cableSeleccionado) setCableSeleccionado(null)
        else onCerrar()
      }
      if (midiendo || escribiendo) return

      /* Ctrl+Z / ⌘Z. Va después de descartar los campos de texto a propósito:
         escribiendo, deshacer tiene que deshacer LO QUE SE ESCRIBE, no el
         plano. Con Shift, o con Ctrl+Y, rehace. */
      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) historia.rehacer()
        else historia.deshacer()
        return
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        historia.rehacer()
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && seleccion) {
        e.preventDefault()
        if (seleccion === ID_MUROS) return // los muros no se borran
        quitar(seleccion)
      }
      // g/r/s como en cualquier editor 3D: la mano ya sabe dónde están
      if (e.key === 'g') setModoGizmo('mover')
      if (e.key === 'r') setModoGizmo('girar')
      if (e.key === 's') setModoGizmo('escalar')

      /* Y las flechas hacen lo que diga el modo, sobre lo que esté
         seleccionado. El gizmo sirve para acomodar a ojo; las flechas para el
         último centímetro, que es donde el ratón siempre se pasa. Con Shift
         van diez veces más rápido y con Alt diez veces más fino, que es la
         convención de todos los editores.

         En mover, las flechas corren la pieza por el piso —izquierda y derecha
         en X, arriba y abajo en Z, que es como se lee un plano— y la altura va
         en Re Pág y Av Pág, porque es la que menos se toca. */
      const esFlecha = e.key.startsWith('Arrow') || e.key === 'PageUp' || e.key === 'PageDown'
      if (seleccion && seleccion !== ID_MUROS && esFlecha) {
        const it = plano.items.find((i) => i.id === seleccion)
        if (!it) return
        e.preventDefault()
        const factor = e.shiftKey ? 10 : e.altKey ? 0.1 : 1
        const horiz = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
        const vert = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0

        if (modoGizmo === 'girar') {
          const paso = ((horiz || vert) * 5 * factor * Math.PI) / 180
          parchar(seleccion, { rot: (it.rot ?? 0) + paso }, 'Giró una pieza')
          return
        }
        if (modoGizmo === 'escalar') {
          const paso = (horiz || vert) * 0.02 * factor
          const esc = Math.max(0.2, Math.min(4, (it.esc ?? 1) + paso))
          parchar(seleccion, { esc: Number(esc.toFixed(3)) }, 'Escaló una pieza')
          return
        }
        /* Mover. La pieza se vuelve a pegar a lo que quede debajo después de
           cada paso, así que correr el Apple TV dos centímetros sobre el buró
           lo deja sobre el buró, y sacarlo del buró lo despega solo. */
        const paso = 0.01 * factor
        const alto = e.key === 'PageUp' ? 1 : e.key === 'PageDown' ? -1 : 0
        const movida = {
          ...it,
          x: Number((it.x + horiz * paso).toFixed(3)),
          z: Number((it.z - vert * paso).toFixed(3)),
          y: Number(Math.max(0, (it.y ?? 0) + alto * paso).toFixed(3)),
        }
        const items = plano.items.map((x) => (x.id === seleccion ? conAncla(movida) : x))
        guardar({ items }, 'Movió una pieza')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = antes
      document.removeEventListener('keydown', onKey)
    }
  })

  const historia = useHistoria(plano, (viejo, que) => setPlano(room.id, viejo, que))

  /**
   * Guardar, resolviendo antes lo que está pegado a algo.
   *
   * Va aquí y no en cada llamada porque es una regla del plano, no de quien lo
   * edita: si el cuarto cambió de medidas o un mueble se corrió, lo que estaba
   * encima o dentro del muro tiene que haberse movido con él ANTES de que esto
   * se guarde. Si no, el contacto se queda flotando en media sala y el Apple
   * TV en el aire donde estaba el buró.
   */
  const guardar = (patch, que) => {
    historia.anotar(plano, que)

    /* Si lo que cambia son las MEDIDAS, primero se amarra lo que todavía no lo
       estaba —contra las medidas viejas, que son las que dicen qué toca qué— y
       hasta entonces se estira. Así no hace falta que el cuarto se haya abierto
       antes con esta versión: cualquier plano viejo se pone al día en el
       momento en que se le mueve una pared, que es justo cuando importa. */
    const cambiaMedida =
      (patch.ancho != null && patch.ancho !== plano.ancho) ||
      (patch.largo != null && patch.largo !== plano.largo)

    let siguiente = { ...plano, ...patch }
    if (cambiaMedida) {
      const base = patch.items ?? plano.items
      const anclados = base.map((it) => {
        if (it.ancla || it.suelta) return it
        const ancla = anclaAuto(it, plano, base)
        return ancla ? { ...it, ancla } : it
      })
      /* No se reacomoda nada: si al encoger dos muebles van a quedar uno
         encima del otro, la medida no llega hasta ahí. El número que el
         cliente ve en el campo es el que de verdad se guardó. */
      const limitado = limitarPorSolape({ ...plano, items: anclados }, patch)
      siguiente = { ...plano, ...limitado, items: anclados }
    }

    const items = resolverAnclas(siguiente)
    setPlano(room.id, items === siguiente.items ? siguiente : { ...siguiente, items }, que)
  }

  /* ── una sola vez por cuarto: pegar lo que nunca se pegó ──
     Los planos dibujados antes de que existieran los vínculos traen aparatos
     flotando sobre los burós y contactos que no saben en qué muro viven. Se
     resuelve al abrir, una vez, y sólo si de verdad cambia algo. Después ya no
     se toca: adivinar el vínculo en cada apertura movería piezas que alguien
     puso a mano donde quería. */
  const anclado = useRef(null)
  useEffect(() => {
    if (!plano?.items?.length || anclado.current === room.id) return
    anclado.current = room.id
    let tocados = 0
    const items = plano.items.map((it) => {
      if (it.ancla || it.suelta) return it
      const ancla = anclaAuto(it, plano, plano.items)
      if (!ancla) return it
      tocados += 1
      return { ...it, ancla }
    })
    if (tocados) {
      guardar({ items }, `Pegó ${tocados} ${tocados === 1 ? 'pieza' : 'piezas'} a su muro o su mueble`)
      return
    }

    /* Y aunque no haya nada que pegar, se vuelve a resolver una vez con las
       alturas ya MEDIDAS de la geometría. Al abrir, la primera resolución usa
       el número del catálogo porque los muebles todavía no se han dibujado; un
       instante después ya se sabe dónde quedó cada tapa, y es entonces cuando
       lo que va encima se sienta de verdad. */
    const t = setTimeout(() => {
      const puestos = resolverAnclas(plano)
      if (puestos !== plano.items) {
        guardar({ items: puestos }, 'Asentó lo que va sobre un mueble')
      }
    }, 600)
    return () => clearTimeout(t)
    // sólo al abrir el cuarto: es una puesta al día, no una regla de cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, plano?.items?.length])

  /** Vuelve a calcular a qué está pegada una pieza, respetando que la hayan soltado a mano. */
  const conAncla = (it) => {
    if (it.suelta) return it
    const ancla = anclaAuto(it, plano, plano.items)
    return ancla ? { ...it, ancla } : { ...it, ancla: undefined }
  }

  /** El cable que hoy tiene una pieza: el suyo, o el que trae de fábrica. */
  const cableDe = (it) => {
    if (it.cable) return it.cable
    if (it.clase === 'equipo') {
      const d = DEVICE_BY_ID[it.deviceId]
      return llevaCable(d) ? cablePorDefecto(d) : null
    }
    return MUEBLES[it.tipo]?.enchufa ? cableDeMueble(it.tipo) : null
  }

  /**
   * Acomodar todos los cables por el muro, o devolverlos al piso.
   *
   * Es un servicio que damos y por eso es un botón y no una casilla escondida
   * en cada pieza: en la visita se decide para el cuarto entero —"esto lo
   * dejamos ordenado"— y se cotiza por punto. La canaleta se pega, se pinta
   * del color del muro y es reversible, que es lo que la hace la opción
   * correcta en departamento rentado.
   *
   * Se materializa el cable en la pieza que no lo tenía: mientras vive como
   * valor de fábrica no se puede acomodar nada, porque no hay dónde guardar la
   * decisión.
   */
  const acomodarCables = (ruta) => {
    let tocados = 0
    const items = plano.items.map((it) => {
      const c = cableDe(it)
      if (!c || c.ruta === ruta) return it
      tocados += 1
      return { ...it, cable: { ...c, ruta } }
    })
    if (!tocados) return
    guardar(
      { items },
      ruta === 'muro'
        ? `Acomodó ${tocados} ${tocados === 1 ? 'cable' : 'cables'} en el muro`
        : `Regresó ${tocados} ${tocados === 1 ? 'cable' : 'cables'} al piso`,
    )
  }

  /** Contactos normales del cuarto: cada uno lleva su adaptador. */
  const cuantosEnchufes = plano.items.filter(
    (i) => i.clase === 'punto' && i.tipo === 'enchufe',
  ).length

  /** Cuántos cables hay y cuántos ya están acomodados. */
  const cuentaCables = plano.items.reduce(
    (a, it) => {
      const c = cableDe(it)
      if (!c) return a
      return { total: a.total + 1, enMuro: a.enMuro + (c.ruta === 'muro' ? 1 : 0) }
    },
    { total: 0, enMuro: 0 },
  )

  /**
   * Trazar cable: se elige un punto, luego otro, y queda el tramo.
   *
   * Se dibuja a través del muro a propósito. Lo que hace útil este plano el
   * día que haya que abrir una pared es justamente poder ver por dónde va lo
   * que no se ve.
   */
  const unirCon = (id) => {
    const a = plano.items.find((i) => i.id === uniendo)
    const b = plano.items.find((i) => i.id === id)
    if (a && b) {
      const tramo = {
        id: uid('t'),
        de: [a.x, a.y ?? 0.4, a.z],
        a: [b.x, b.y ?? 0.4, b.z],
        entre: [a.id, b.id],
      }
      guardar({ tramos: [...(plano.tramos ?? []), tramo] }, 'Trazó una línea eléctrica')
    }
    setUniendo(null)
    setSeleccion(id)
  }

  const seleccionar = (id) => {
    if (uniendo && id && id !== uniendo) return unirCon(id)
    setCableSeleccionado(null)
    setSeleccion(id)
  }

  /**
   * Tocar un muro en la escena, con algo seleccionado.
   *
   * Sin nada seleccionado, tocar un muro selecciona el cuarto —lo de
   * siempre—. Con una pieza seleccionada, el muro deja de ser un botón de
   * selección y se vuelve la manija de su vínculo:
   *
   *   - tocar el muro al que YA está pegada la despega — un clic, no un
   *     viaje al panel a buscar "Despegar".
   *   - tocar un muro distinto la pega ahí.
   *   - tocar un SEGUNDO muro, contiguo al primero, la esquina entre los
   *     dos —con separación de cada uno, no encajada adentro de ninguno—,
   *     que es justo el gesto de "métela en esta esquina" que no existía.
   */
  const onTocarMuro = (muroTocado) => {
    const item = seleccion && plano.items.find((i) => i.id === seleccion)
    if (!item) {
      seleccionar(ID_MUROS)
      return
    }

    // Cuarto3D habla en 'norte'/'sur'/'oeste'/'este' —el vocabulario de
    // muros.js, por dónde se ve un muro—; el ancla habla en 'x-'/'x+'/'z-'/
    // 'z+' —el de anclas.js, con qué eje y signo se calcula la posición—.
    // Son el mismo muro, pero sin esta traducción ninguna comparación de
    // aquí para abajo encontraría nunca coincidencia.
    const muroId = ANCLA_DE_MURO[muroTocado] ?? muroTocado

    const muroActual = item.ancla?.a === 'muro' ? item.ancla.muro : null
    const esMuroDeMuro = MUEBLES_DE_MURO.has(item.tipo)

    if (muroActual === muroId) {
      parchar(item.id, { ancla: undefined, suelta: true }, 'Despegó una pieza del muro')
      return
    }

    if (muroActual && sonContiguos(muroActual, muroId)) {
      const ancla = anclaEnEsquina(item, plano, muroActual, muroId, item.ancla.sep, 0.02)
      if (ancla) {
        parchar(item.id, { ancla, suelta: undefined }, 'Esquinó una pieza entre dos muros')
        return
      }
    }

    const ancla = anclaEnMuro(item, plano, muroId)
    if (!ancla) return
    parchar(
      item.id,
      { ancla, suelta: undefined, ...(esMuroDeMuro ? { rot: GIRO_MURO[muroId] ?? item.rot } : {}) },
      'Vinculó una pieza a un muro',
    )
  }

  /** El id que llega es el del APARATO al que pertenece el cable, no un id
      propio del cable —no lo tiene. */
  const seleccionarCable = (id) => {
    setSeleccion(null)
    setCableSeleccionado((actual) => (actual === id ? null : id))
  }

  /** Grosor y color son de ESTE cable, no del estilo del cuarto: se guardan
      dentro de `item.cable`, junto con el largo y la ruta que ya vivían ahí
      —los de fábrica si la pieza nunca había tenido uno propio, con
      `cableDe`, para no perderlos al escribir solo el grosor o el color. */
  const parcharCable = (id, cambios) =>
    guardar(
      {
        items: plano.items.map((it) =>
          it.id === id ? { ...it, cable: { ...cableDe(it), ...cambios } } : it,
        ),
      },
      'Cambió un cable',
    )

  const setItems = (items, que) => guardar({ items }, que)

  /* Arrastrar un muro dispara decenas de medidas por segundo. `setPlano` ya
     agrupa el envío, así que la pantalla responde a cada cuadro y al registro
     llega un solo cambio cuando se suelta. */
  const LLAVE = { x: 'ancho', z: 'largo', y: 'alto' }

  const medir = (eje, valor) => {
    const llave = LLAVE[eje]
    if (!llave) return
    /* La altura también se jala. Antes sólo se escribía, y desde que lo del
       plafón se amarra al plafón hay una razón para moverla: subir el techo
       tiene que subir los empotrados con él. */
    guardar({ [llave]: Number(valor.toFixed(2)) }, `Ajustó las medidas de ${room.nombre}`)
  }

  /* ── acciones sobre los objetos ── */

  /* A qué muro, piso o plafón le toca a algo, según qué es —no todo cabe en
     cualquier lado: una ventana no se cuelga del plafón y un sensor de
     movimiento no se para en el piso a media sala. Esto es lo que decide,
     mientras se arrastra, qué superficies se ofrecen y cuáles se rechazan. */
  const superficiesDe = (col) => {
    if (!col) return []
    if (col.clase === 'mueble') return MUEBLES_DE_MURO.has(col.tipo) ? ['muro'] : ['piso']
    if (col.clase === 'punto') return col.tipo === 'salida' ? ['techo'] : ['muro']
    if (col.clase === 'equipo') {
      const dev = DEVICE_BY_ID[col.deviceId]
      return dev?.cat === 'iluminacion' ? ['muro', 'techo'] : ['muro', 'piso']
    }
    return ['piso']
  }

  /**
   * Pone lo que se estaba arrastrando justo donde se soltó —piso, muro o
   * plafón, según de dónde venga `punto`— y con el vínculo ya armado: nunca
   * queda una pieza que "adivinar" después. El muro fija su propia altura y
   * su propio giro con la misma cuenta que ya usa el resto del plano
   * (`anclaEnMuro`), así que da igual si se picó a la altura de un
   * interruptor o de una ventana: queda pegada donde se picó.
   */
  const colocar = (punto) => {
    if (!colocando || !punto) return
    const id = uid('i')
    const permitidas = superficiesDe(colocando)
    const superficie = permitidas.includes(punto.superficie) ? punto.superficie : permitidas[0]
    let item, que

    const enMuro = (extra) => {
      const muro = ANCLA_DE_MURO[punto.muro] ?? murosCerca(punto, plano)[0]?.muro
      const base = { id, x: punto.x, y: punto.y, z: punto.z, rot: GIRO_MURO[muro] ?? 0, ...extra }
      return { ...base, ancla: anclaEnMuro(base, plano, muro) }
    }
    const enTecho = (extra) => {
      const base = { id, x: punto.x, y: punto.y, z: punto.z, rot: 0, ...extra }
      const ancla = {
        a: 'techo',
        u: (punto.x + (plano.ancho ?? 4) / 2) / (plano.ancho ?? 4),
        v: (punto.z + (plano.largo ?? 4) / 2) / (plano.largo ?? 4),
        y: punto.y,
      }
      return { ...base, ancla }
    }

    if (colocando.clase === 'mueble') {
      item =
        superficie === 'muro'
          ? enMuro({ clase: 'mueble', tipo: colocando.tipo })
          : { id, x: punto.x, y: 0, z: punto.z, rot: 0, clase: 'mueble', tipo: colocando.tipo }
      que = `Colocó ${MUEBLES[colocando.tipo]?.label?.toLowerCase() ?? 'un mueble'}`
    } else if (colocando.clase === 'equipo') {
      const dev = DEVICE_BY_ID[colocando.deviceId]
      const params = parametrosIniciales(dev)
      const extra = { clase: 'equipo', deviceId: colocando.deviceId, params }
      item =
        superficie === 'muro'
          ? enMuro(extra)
          : superficie === 'techo'
            ? enTecho(extra)
            : { id, x: punto.x, y: params ? (ALTURA_POR_FORMA[params.forma] ?? 2.4) : 0.3, z: punto.z, rot: 0, ...extra }
      que = `Colocó ${dev?.name ?? 'un dispositivo'}`
    } else {
      const extra = { clase: 'punto', tipo: colocando.tipo }
      item = superficie === 'techo' ? enTecho(extra) : enMuro({ ...extra, y: colocando.tipo === 'apagador' ? 1.2 : 0.4 })
      que = `Colocó un ${colocando.tipo}`
    }

    const items = [...plano.items, item]
    /* Y si la pieza ya no cabe contra ese muro, el cuarto crece. Es una regla
       de obra: si va un clóset de 1.80 contra esa pared, la pared mide por lo
       menos 1.80. */
    guardar({ items, ...agrandarSiNoCabe({ ...plano, items }) }, que)
    setSeleccion(item.id)
    setColocando(null)
  }

  const mover = (id, x, y, z) =>
    setItems(
      plano.items.map((i) =>
        i.id === id
          ? { ...i, x: Number(x.toFixed(2)), ...(y != null ? { y: Number(y.toFixed(3)) } : {}), z: Number(z.toFixed(2)) }
          : i,
      ),
      'Movió una pieza en el plano',
    )

  /* Escalar una pieza que tiene algo encima —por ancla o por cercanía— la
     deja incongruente con lo que carga: el Apple TV se queda flotando al
     lado del buró que acaba de encoger, o colgando del aire sobre uno que
     creció. La regla vive aquí y no sólo en el campo de texto porque hay
     otras dos formas de escalar —el gizmo del lienzo y las flechas con el
     modo activo— y las tres tienen que respetarla igual. */
  const parchar = (id, patch, que) => {
    let real = patch
    if (patch.esc != null) {
      const it = plano.items.find((i) => i.id === id)
      const tieneEncima =
        it &&
        (plano.items.some((i) => i.ancla?.a === 'mueble' && i.ancla.id === id) ||
          dispositivosDe(it, plano.items).length > 0)
      if (tieneEncima) {
        const { esc: _esc, ...resto } = patch
        real = resto
      }
    }
    setItems(plano.items.map((i) => (i.id === id ? { ...i, ...real } : i)), que)
  }

  /**
   * Dónde va el módulo que vuelve inteligente ese apagador.
   *
   * Marca también las luminarias que controla, porque el módulo tiene que
   * caber en algún lado: si va en la luminaria, hay que ver que el registro
   * tenga espacio, y eso se decide mirando el plano, no en la obra.
   */
  const ponerModulo = (puntoId, modulo) => {
    const regla = (plano.reglas ?? []).find((r) => r.disparo === puntoId)
    const destinos = new Set(regla?.destinos ?? [])
    setItems(
      plano.items.map((i) => {
        if (i.id === puntoId) return { ...i, modulo }
        if (destinos.has(i.id)) return { ...i, conModulo: modulo === 'luminaria' }
        return i
      }),
      modulo === 'luminaria' ? 'Puso el módulo en la luminaria' : modulo === 'atras' ? 'Puso el módulo detrás del apagador' : 'Cambió a apagador inteligente',
    )
  }

  /* Una sola escritura, no dos. Cuando esto borraba los items en un `guardar`
     y limpiaba las reglas en otro, el segundo partía del mismo `plano` de este
     render —con la pieza todavía dentro— y la reponía: borrar no borraba
     nada. Todo lo que cambia junto se manda junto. */
  const quitar = (id) => {
    // las reglas y los tramos que apuntaban a lo borrado se van con él: una
    // regla colgando de un fantasma es peor que no tener regla
    const reglas = (plano.reglas ?? [])
      .filter((r) => r.disparo !== id)
      .map((r) => ({ ...r, destinos: (r.destinos ?? []).filter((d) => d !== id) }))
    const tramos = (plano.tramos ?? []).filter((t) => !t.entre?.includes(id))
    guardar(
      { items: plano.items.filter((i) => i.id !== id), reglas, tramos },
      'Quitó una pieza del plano',
    )
    setSeleccion(null)
  }

  const arrancarCuarto = () => {
    const receta = ARRANQUE[tipo]
    if (!receta) return
    const nuevos = receta.map((r) => ({ id: uid('i'), clase: 'mueble', ...r }))
    setItems([...plano.items, ...nuevos], `Amuebló ${room.nombre} con la base de ${tipo}`)
  }

  /* ── equipo levantado, listo para colocar ── */

  const porColocar = useMemo(() => {
    const puestos = {}
    for (const i of plano.items) if (i.clase === 'equipo') puestos[i.deviceId] = (puestos[i.deviceId] ?? 0) + 1
    return Object.entries(room.items ?? {})
      .filter(([, q]) => q > 0)
      .map(([deviceId, q]) => ({ deviceId, faltan: q - (puestos[deviceId] ?? 0), total: q }))
  }, [room.items, plano.items])

  /* ── luz ── */

  /** Qué apagadores tienen una regla: son los únicos que hacen algo al tocarlos. */
  const conRegla = useMemo(() => new Set(comps.map((c) => c.cuando.ref).filter(Boolean)), [comps])

  /* Los lúmenes siguen al simulador: atenuar al 40 % baja los lux del
     recuadro, que es justo la pregunta que se contesta con el deslizador. */
  const lumenes = useMemo(
    () =>
      plano.items
        .filter((i) => i.clase === 'equipo' && i.params)
        .reduce((a, i) => a + i.params.lm * ((i.params.brillo ?? 100) / 100) * (sim[i.id]?.nivel ?? 1), 0),
    [plano.items, sim],
  )

  const area = plano.ancho * plano.largo
  const lux = luxDelCuarto(lumenes, area)
  const diag = diagnosticoLux(lux, tipo)

  /* ── reglas ── */

  const seleccionado = plano.items.find((i) => i.id === seleccion)
  const enMuros = seleccion === ID_MUROS
  const dueñoDelCable = cableSeleccionado && plano.items.find((i) => i.id === cableSeleccionado)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      {/* ── barra ── */}
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <div>
          <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Plano de</p>
          <h2 className="display text-[19px] text-cream">{room.nombre}</h2>
        </div>

        <select
          value={tipo}
          onChange={(e) => guardar({ tipoCuarto: e.target.value }, `Cambió el tipo de ${room.nombre}`)}
          className="rounded-lg border border-line bg-ink-2 px-2 py-1 text-[12px] text-cream-2 outline-none"
        >
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="flex items-end gap-2">
          <Medida label="Ancho m" value={plano.ancho} onChange={(v) => guardar({ ancho: v }, 'Cambió el ancho del cuarto')} />
          <Medida label="Largo m" value={plano.largo} onChange={(v) => guardar({ largo: v }, 'Cambió el largo del cuarto')} />
          <Medida label="Alto m" value={plano.alto} onChange={(v) => guardar({ alto: v }, 'Cambió la altura del cuarto')} />
          <Medida label="Piso" value={plano.piso} step={1} min={-1} onChange={(v) => guardar({ piso: v }, 'Cambió el cuarto de piso')} />
        </div>

        <label className="flex items-center gap-1.5">
          <span className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Muro</span>
          <input
            type="color"
            value={plano.muroColor ?? '#3f4a63'}
            onChange={(e) => guardar({ muroColor: e.target.value }, 'Cambió el color de los muros')}
            className="h-7 w-9 cursor-pointer rounded border border-line bg-ink"
          />
          <input
            type="number"
            step="0.02"
            min="0.05"
            max="0.4"
            value={plano.muroGrosor ?? 0.12}
            onChange={(e) => guardar({ muroGrosor: num(e.target.value, 0.12) }, 'Cambió el grosor de los muros')}
            title="Grosor del muro en metros"
            className="w-16 rounded border border-line bg-ink px-1.5 py-1 text-[12px] text-cream outline-none"
          />
        </label>

        <span className="text-[11px] text-cream-3">
          {area.toFixed(1)} m² · {room.m2} m² declarados
        </span>

        <div className="ml-auto flex items-center gap-2">
          {[
            ['noche', 'Noche'],
            ['dia', 'Día'],
          ].map(([id, label]) => (
            <Chip key={id} activo={modo === id} onClick={() => setModo(id)}>
              {label}
            </Chip>
          ))}
          <Chip activo={simulando} onClick={() => setSimulando((v) => !v)}>
            Simular
          </Chip>
          <Chip activo={lab} onClick={() => setLab((v) => !v)}>
            Estilo 3D
          </Chip>
          <button
            onClick={onCerrar}
            className="rounded-lg bg-ember px-4 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-ember-2"
          >
            Listo
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ── paleta ── */}
        <aside className="w-[15rem] shrink-0 overflow-y-auto border-r border-line">
          <Grupo
            titulo="Mobiliario"
            right={
              ARRANQUE[tipo] && plano.items.length === 0 ? (
                <button onClick={arrancarCuarto} className="text-[10.5px] text-ember hover:underline">
                  amueblar
                </button>
              ) : null
            }
          >
            <div className="grid grid-cols-2 gap-1">
              {(POR_TIPO[tipo] ?? POR_TIPO.generico).map((k) => (
                <Chip
                  key={k}
                  activo={colocando?.clase === 'mueble' && colocando.tipo === k}
                  onClick={() => setColocando({ clase: 'mueble', tipo: k })}
                >
                  {MUEBLES[k].label}
                </Chip>
              ))}
            </div>
          </Grupo>

          {/* Dar de alta un aparato que no está. Siempre aparece uno: la marca
              que compró el cliente en el súper, el que traía de la casa
              anterior, el modelo que salió el mes pasado. Hasta ahora eso
              significaba esperar a que alguien lo metiera al código. */}
          <Grupo titulo="Aparatos">
            <button
              onClick={() => setAltaDevice(true)}
              className="w-full rounded-lg border border-thread/50 px-2 py-1.5 text-[11.5px] text-thread-2 transition-colors hover:bg-thread/10"
            >
              Dar de alta un aparato →
            </button>
            <p className="mt-1.5 text-[10.5px] leading-snug text-cream-3">
              Queda en este proyecto y entra a todo: cotización, alcance del asistente, ambientaciones y su
              propio mando.
            </p>
            {propios.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {propios.map((d) => (
                  <div key={d.id} className="flex items-center gap-1">
                    <button
                      onClick={() => setColocando({ clase: 'equipo', deviceId: d.id })}
                      className={`min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left text-[11px] transition-colors ${
                        colocando?.deviceId === d.id ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
                      }`}
                    >
                      {d.name}
                    </button>
                    <button
                      onClick={() => quitarDevice(d.id)}
                      title="Quitar del catálogo de este proyecto"
                      className="shrink-0 px-1 text-[11px] text-cream-3 hover:text-ember"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Grupo>

          <Grupo titulo="Instalación eléctrica">
            <div className="grid grid-cols-2 gap-1">
              {[
                ['enchufe', 'Enchufe'],
                ['apagador', 'Apagador'],
                ['salida', 'Salida de techo'],
              ].map(([t, label]) => (
                <Chip
                  key={t}
                  activo={colocando?.clase === 'punto' && colocando.tipo === t}
                  onClick={() => setColocando({ clase: 'punto', tipo: t })}
                >
                  {label}
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-[10.5px] leading-snug text-cream-3">
              Las líneas se trazan seleccionando dos puntos y usando “Unir con cable”.
            </p>

            {/* ── acomodo de cable ──
                El desorden de cables es de las primeras cosas que el cliente
                nota y de las últimas que alguien le ofrece resolver. Aquí se
                enseña antes de cotizarlo: se ve el cuarto con los cables por
                el piso, se aprieta el botón, y se ve con los cables subidos al
                muro. Esa comparación vende el servicio sola. */}
            {cuentaCables.total > 0 && (
              <div className="mt-3 rounded-lg border border-line p-2">
                <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">
                  Acomodo de cable
                </p>
                <p className="mt-1 text-[10.5px] leading-snug text-cream-3">
                  {cuentaCables.enMuro === 0
                    ? `${cuentaCables.total} ${cuentaCables.total === 1 ? 'cable cae' : 'cables caen'} por el piso, como queda si nadie lo pide.`
                    : `${cuentaCables.enMuro} de ${cuentaCables.total} van por canaleta en el muro.`}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <Chip
                    activo={cuentaCables.enMuro === cuentaCables.total}
                    onClick={() => acomodarCables('muro')}
                  >
                    Subir al muro
                  </Chip>
                  <Chip activo={cuentaCables.enMuro === 0} onClick={() => acomodarCables('piso')}>
                    Dejar en el piso
                  </Chip>
                </div>
                <p className="mt-2 text-[10.5px] leading-snug text-cream-3">
                  Canaleta pegada y pintada del color del muro, con grapas donde no la amerita. Sin
                  obra y reversible: se cotiza por punto y entra el material del catálogo.
                </p>
              </div>
            )}

            {/* ── el adaptador de tres vías ──
                Va en todos los contactos y por eso se cuenta solo. Es de las
                piezas que nadie cotiza y que arreglan medio cuarto: la
                clavija se pliega, así que el mueble vuelve a quedar pegado al
                muro en vez de separado por un cable doblado. */}
            {cuantosEnchufes > 0 && (
              <div className="mt-2 rounded-lg border border-line p-2">
                <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">
                  Adaptadores de 3 vías
                </p>
                <p className="mt-1 text-[10.5px] leading-snug text-cream-3">
                  Uno por contacto: <span className="text-cream">{cuantosEnchufes}</span> en este
                  espacio. Ya salen dibujados en el plano.
                </p>
                <p className="mt-1 text-[10.5px] leading-snug text-cream-3">
                  Dan la tercera toma que siempre falta y su clavija se pliega, que es lo que deja
                  arrimar el mueble al muro. Se piden de Amazon Estados Unidos, con una semana de
                  espera.
                </p>
              </div>
            )}
          </Grupo>

          <Objetos
            items={plano.items}
            seleccion={seleccion}
            onSeleccionar={seleccionar}
            onQuitar={quitar}
          />

          <Grupo titulo={`Equipo levantado · ${porColocar.length}`}>
            {porColocar.length === 0 && (
              <p className="text-[11px] text-cream-3">
                Este cuarto no tiene equipo. Agrégalo desde el levantamiento y aparece aquí.
              </p>
            )}
            <div className="space-y-1">
              {porColocar.map(({ deviceId, faltan, total }) => {
                const d = DEVICE_BY_ID[deviceId]
                if (!d) return null
                return (
                  <button
                    key={deviceId}
                    disabled={faltan <= 0}
                    onClick={() => setColocando({ clase: 'equipo', deviceId })}
                    className={`w-full rounded-lg border px-2 py-1.5 text-left transition-colors ${
                      colocando?.deviceId === deviceId
                        ? 'border-ember bg-ember text-ink'
                        : faltan > 0
                          ? 'border-line text-cream-2 hover:border-cream/35'
                          : 'border-line/60 text-cream-3/50'
                    }`}
                  >
                    <span className="block truncate text-[11.5px]">{d.name}</span>
                    <span className="block text-[10px] opacity-70">
                      {faltan > 0 ? `${faltan} de ${total} por colocar` : `${total} colocados`}
                      {d.luz ? ` · ${d.luz.lm} lm` : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </Grupo>
        </aside>

        {/* ── lienzo ── */}
        <div className="relative min-w-0 flex-1">
          <Suspense fallback={<div className="grid h-full place-items-center text-[13px] text-cream-3">Cargando plano…</div>}>
            <Escena
              plano={plano}
              seleccion={seleccion}
              onSeleccionar={seleccionar}
              onTocarMuro={onTocarMuro}
              cableSeleccionado={cableSeleccionado}
              onSeleccionarCable={seleccionarCable}
              onMover={mover}
              onColocar={colocar}
              colocando={colocando}
              superficies={superficiesDe(colocando)}
              puntero={puntero}
              onApuntar={setPuntero}
              sim={sim}
              modo={modo}
              onAccionar={bloqueo ? undefined : dispararPorPieza}
              conRegla={conRegla}
              onMedida={medir}
              midiendo={midiendo}
              onMidiendo={setMidiendo}
              modoGizmo={modoGizmo}
              onParchar={parchar}
              onFinGizmo={() => {
                /* Al soltar, la pieza se vuelve a pegar a lo que quedó debajo.
                   Es lo que hace que mover el buró a otro muro se lleve el
                   Apple TV, y que arrastrar un contacto de un muro a otro lo
                   deje anclado al nuevo. */
                const items = plano.items.map((it) =>
                  it.id === seleccion ? conAncla(it) : it,
                )
                guardar(
                  { items, ...agrandarSiNoCabe({ ...plano, items }) },
                  `Acomodó una pieza en ${room.nombre}`,
                )
              }}
              enMano={enMano}
              onTomarClavija={setEnMano}
              /* Arrastrar el cable con el ratón. El rótulo va SIEMPRE igual a
                 propósito: la historia junta los cambios seguidos que se
                 llaman igual, así que un arrastre de dos segundos deja una
                 sola entrada de deshacer en vez de cien. */
              onGuiarCable={(id, x, z) => {
                const it = plano.items.find((i) => i.id === id)
                const base = it && (it.cable ?? cableDe(it))
                if (!base) return
                /* El piso por el que se arrastra no tiene orillas, así que hay
                   que ponérselas: sin esto el cable se iba por fuera del muro
                   y quedaba acomodado en la calle. Y de paso empujar hacia la
                   esquina lo deja pegado a ella, que es lo que uno quiere. */
                const dentro = (v, mitad) => Math.max(-mitad + 0.06, Math.min(mitad - 0.06, v))
                parchar(
                  id,
                  {
                    cable: {
                      ...base,
                      guia: { x: dentro(x, plano.ancho / 2), z: dentro(z, plano.largo / 2) },
                    },
                  },
                  'Acomodó un cable',
                )
              }}
              onEnchufar={(itemId, enchufeId) => {
                setEnMano(null)
                const it = plano.items.find((x) => x.id === itemId)
                if (!it) return
                const base = it.cable ?? cableDe(it) ?? cablePorDefecto(DEVICE_BY_ID[it.deviceId])
                parchar(itemId, { cable: { ...base, enchufe: enchufeId } }, 'Conectó un aparato a otro contacto')
              }}
              enfoque={enfoque}
              disolver={
                enfoque && !enfoque.volver
                  ? { centro: { x: enfoque.x, z: enfoque.z }, dist: enfoque.dist, tam: enfoque.tam }
                  : null
              }
              onEnfocado={(m) => {
                /* El vuelo de VUELTA también avisa cuando llega, y ahí no hay
                   pieza que enfocar ni dirección que heredar: sin esta guarda,
                   cerrar el taller reventaba al aterrizar. */
                /* Aterrizó el vuelo de VUELTA: se limpia el enfoque para que
                   la cámara quede libre. Dejarlo puesto era lo que hacía que
                   el cuarto no se dejara girar ni acercar después de cerrar el
                   taller. */
                if (enfoque?.volver) {
                  setEnfoque(null)
                  setPoseAntes(null)
                  return
                }
                if (!enfoque || !m.dir) return
                /* La pose se guarda RELATIVA a la pieza: en el taller la pieza
                   está en el origen, así que la cámara tiene que ir a la misma
                   distancia y en la misma dirección, no a las mismas
                   coordenadas del cuarto. */
                setPoseTaller({
                  pos: [m.dir.x * enfoque.dist, enfoque.mira + m.dir.y * enfoque.dist, m.dir.z * enfoque.dist],
                  mira: enfoque.mira,
                })
                setPoseAntes(m.desde)
              }}
              onDisuelto={() => {
                /* Se cruza cuando el cuarto YA se disolvió y la cámara ya está
                   donde va a quedar: las dos escenas son la misma imagen, así
                   que el cambio no tiene nada que enseñar. */
                if (!enfoque || enfoque.volver || enTaller) return
                // se monta invisible; aparece cuando ya tiene imagen
                setEnTaller(enfoque.id)
              }}
            />

          {altaDevice && (
        <AltaDevice
          onCerrar={() => setAltaDevice(false)}
          onCrear={(d) => {
            nuevoDevice(d)
            setAltaDevice(false)
            setColocando({ clase: 'equipo', deviceId: d.id })
          }}
        />
      )}

      {enTaller && (
        <Suspense fallback={null}>
          <TallerPieza
            item={plano.items.find((i) => i.id === enTaller)}
            puntos={plano.items.filter((i) => i.clase === 'punto' && i.tipo === 'enchufe')}
            red={plano.red}
            pose={poseTaller}
            visible={visible}
            rect={rectCuarto}
            onPintado={() => setVisible(true)}
            onGuardar={(patch, que) => parchar(enTaller, patch, que)}
            onCerrar={() => {
              /* Al revés: primero se desvanece el taller y solo entonces se
                 desmonta y se suelta la cámara del cuarto. Desmontarlo de
                 golpe devolvería el cuarto de un corte. */
              setVisible(false)
              setTimeout(() => {
                setEnTaller(null)
                setPoseTaller(null)
                // y de regreso al encuadre que se dejó, no a uno cualquiera
                setEnfoque(poseAntes ? { volver: poseAntes } : null)
              }, 320)
            }}
          />
        </Suspense>
      )}

      {/* Deshacer, a la vista. El atajo existe, pero un levantador parado
              en una sala con el teléfono en la otra mano no se acuerda de
              Ctrl+Z: el botón dice además QUÉ va a deshacer, que es la
              diferencia entre atreverse a probar algo y no tocarlo. */}
          <div className="absolute top-3 right-3 flex gap-0.5 rounded-xl border border-line bg-ink/92 p-1 backdrop-blur">
            <button
              onClick={historia.deshacer}
              disabled={!historia.queDeshace}
              title={historia.queDeshace ? `Deshacer: ${historia.queDeshace} · ⌘Z` : 'Nada que deshacer'}
              className="rounded-lg px-2 py-1.5 text-cream-2 transition-colors enabled:hover:bg-cream/10 enabled:hover:text-cream disabled:opacity-25"
            >
              <IconoHistoria />
            </button>
            <button
              onClick={historia.rehacer}
              disabled={!historia.queRehace}
              title={historia.queRehace ? `Rehacer: ${historia.queRehace} · ⇧⌘Z` : 'Nada que rehacer'}
              className="rounded-lg px-2 py-1.5 text-cream-2 transition-colors enabled:hover:bg-cream/10 enabled:hover:text-cream disabled:opacity-25"
            >
              <IconoHistoria alReves />
            </button>
          </div>

          {/* La barra de mover/girar/escalar no aplica al espacio: los muros se
              ajustan con sus cotas, no con un gizmo. */}
          {seleccion && seleccion !== ID_MUROS && !midiendo && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-0.5 rounded-xl border border-line bg-ink/92 p-1 backdrop-blur">
              {[
                ['mover', 'Mover', 'G'],
                ['girar', 'Girar', 'R'],
                ['escalar', 'Escalar', 'S'],
              ].map(([id, label, tecla]) => (
                <button
                  key={id}
                  onClick={() => setModoGizmo(id)}
                  className={`rounded-lg px-2.5 py-1 text-[11.5px] transition-colors ${
                    modoGizmo === id ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/10'
                  }`}
                >
                  {label} <span className="opacity-50">{tecla}</span>
                </button>
              ))}
            </div>
          )}
          </Suspense>

          {uniendo && (
            <div className="absolute inset-x-0 top-3 flex flex-col items-center gap-1.5">
              <span className="rounded-full border border-thread bg-ink/90 px-3 py-1.5 text-[12px] text-thread">
                Elige el otro extremo del cable · Esc para cancelar
              </span>
              {/* también por lista: en 3D hay que atinarle a una caja de nueve
                  centímetros montada en el muro, y el cable es de lo que más
                  se traza. Que el modo preciso exista no obliga a usarlo. */}
              <div className="flex flex-wrap justify-center gap-1 rounded-xl border border-line bg-ink/92 p-1.5 backdrop-blur">
                {plano.items
                  .filter((i) => i.clase === 'punto' && i.id !== uniendo)
                  .map((i, n) => (
                    <button
                      key={i.id}
                      onClick={() => unirCon(i.id)}
                      className="rounded-lg border border-thread/40 px-2 py-1 text-[11px] text-thread-2 hover:bg-thread/15"
                    >
                      {i.tipo} {n + 1}
                    </button>
                  ))}
                {plano.items.filter((i) => i.clase === 'punto' && i.id !== uniendo).length === 0 && (
                  <span className="px-2 py-1 text-[11px] text-cream-3">Coloca otro punto para unirlo.</span>
                )}
              </div>
            </div>
          )}

          {midiendo && (
            <div className="absolute inset-x-0 top-3 flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-ember bg-ink/92 py-1.5 pr-1.5 pl-3.5 text-[12px] text-ember backdrop-blur">
                <span>
                  Midiendo {midiendo === 'x' ? 'el ancho' : midiendo === 'y' ? 'la altura' : 'el largo'} ·
                  jala la flecha
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="1.2"
                  value={plano[LLAVE[midiendo]] ?? plano.largo}
                  onChange={(e) =>
                    Number(e.target.value) >= 1.2 && medir(midiendo, Number(e.target.value))
                  }
                  className="w-20 rounded-lg border border-ember/40 bg-ink px-2 py-1 text-[12px] tabular-nums text-cream"
                />
                <button
                  onClick={() => setMidiendo(null)}
                  className="rounded-full bg-ember px-3 py-1 text-[12px] font-medium text-ink"
                >
                  Listo
                </button>
              </div>
            </div>
          )}

          {colocando && !midiendo && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
              <span className="rounded-full border border-ember bg-ink/90 px-3 py-1.5 text-[12px] text-ember">
                Haz clic en {NOMBRE_SUPERFICIE[superficiesDe(colocando)[0]] ?? 'el espacio'}
                {superficiesDe(colocando).length > 1 ? ` o ${NOMBRE_SUPERFICIE[superficiesDe(colocando)[1]]}` : ''} para
                colocar · Esc para cancelar
              </span>
            </div>
          )}

          {/* lectura de iluminación: la respuesta que el plano viene a dar */}
          <div className="absolute bottom-3 left-3 rounded-xl border border-line bg-ink/92 px-3 py-2 backdrop-blur">
            <div className="flex items-baseline gap-2">
              <span className="display text-[20px] text-cream">{lux}</span>
              <span className="text-[11px] text-cream-3">lux medios · {Math.round(lumenes)} lm</span>
            </div>
            <p
              className={`mt-0.5 max-w-[24rem] text-[11px] leading-snug ${
                diag.nivel === 'ok' ? 'text-emerald-300' : diag.nivel === 'bajo' ? 'text-red-300' : 'text-ember-2'
              }`}
            >
              {diag.texto}
            </p>
          </div>
        </div>

        {lab && (
          <Suspense fallback={null}>
            <StyleLab onCerrar={() => setLab(false)} />
          </Suspense>
        )}

        {/* ── inspector ── */}
        <aside className="w-[16rem] shrink-0 overflow-y-auto border-l border-line">
          {enMuros ? (
            <InspectorMuros plano={plano} onGuardar={guardar} />
          ) : seleccionado ? (
            <Inspector
              item={seleccionado}
              plano={plano}
              onParchar={parchar}
              onQuitar={quitar}
              onUnir={() => setUniendo(seleccionado.id)}
              tramos={plano.tramos ?? []}
              onModulo={ponerModulo}
              onMandar={correr}
              estado={sim?.[seleccionado.id]}
              bloqueo={bloqueo}
              items={plano.items}
              sim={sim}
              onSeleccionar={seleccionar}
              onTaller={(id) => {
                const it = plano.items.find((x) => x.id === id)
                if (!it) return
                const def = MUEBLES[it.tipo]
                const va = def?.variantes?.find((v) => v.id === it.variante)
                const props = { ...def?.props, ...(va?.props ?? {}), ...(it.ajustes ?? {}) }
                const tam = Math.max(
                  props.w ?? it.huella?.w ?? def?.w ?? 0.3,
                  props.d ?? it.huella?.d ?? def?.d ?? 0.3,
                  props.alto ?? props.h ?? it.huella?.alto ?? def?.alto ?? 0.3,
                  0.25,
                )
                /* La misma cuenta de encuadre que usa el taller. Si aquí y allá
                   no fuera igual, la pieza cambiaría de tamaño al cruzar. */
                /* El rectángulo exacto del lienzo del cuarto: el taller nace
                   ahí para que el cruce no mueva ni un pixel. */
                const c = document.querySelector('div.fixed.inset-0.z-50 canvas')
                if (c) {
                  const r = c.getBoundingClientRect()
                  setRectCuarto({ left: r.left, top: r.top, width: r.width, height: r.height })
                }
                setEnfoque({
                  x: it.x,
                  y: it.y ?? 0,
                  z: it.z,
                  dist: tam * 1.9 + 0.5,
                  mira: Math.min(tam * 0.45, 1.1),

                  tam,
                  id,
                })
              }}
              onQuitarTramo={(tid) => guardar({ tramos: plano.tramos.filter((t) => t.id !== tid) }, 'Quitó una línea eléctrica')}
            />
          ) : dueñoDelCable ? (
            <InspectorCable
              item={dueñoDelCable}
              cable={cableDe(dueñoDelCable)}
              onCambiar={(cambios) => parcharCable(cableSeleccionado, cambios)}
              onCerrar={() => setCableSeleccionado(null)}
            />
          ) : (
            <Grupo titulo="Nada seleccionado">
              <p className="text-[11px] leading-relaxed text-cream-3">
                Toca una pieza del plano para moverla, girarla o ajustarla. Arrástrala para cambiarla de lugar.
              </p>
            </Grupo>
          )}

          <Suspense fallback={null}>
            <Ambientaciones items={plano.items} onCorrer={correr} bloqueo={bloqueo} espacio={room.nombre} />
          </Suspense>

          <Automatizaciones nombre={room.nombre} />

          <Comportamientos
            comps={comps}
            items={plano.items}
            onDisparar={disparar}
            bloqueo={bloqueo}
            onLiberar={liberar}
            onGuardar={(cs, que) => guardar({ comportamientos: cs }, que)}
          />
        </aside>
      </div>
    </div>
  )
}

/* ── automatizaciones sugeridas ───────────────────────────────────
   Se buscan por el nombre del espacio, no por un id guardado: los espacios se
   renombran ("Recámara de Ana") y perder las sugerencias por eso sería tonto.

   Van aquí y no en una pantalla de escenas aparte porque es donde se decide:
   viendo el cuarto con sus dispositivos puestos es cuando uno se pregunta qué
   debería hacer solo. Y los comandos de voz son lo único que el cliente le
   enseña a sus visitas — si la frase suena rara, no la usa nadie. */

function Automatizaciones({ nombre }) {
  const esp = useMemo(() => {
    const n = nombre.toLowerCase()
    return (
      ESPACIOS.find((e) => e.autos?.length && n.includes(e.nombre.toLowerCase())) ??
      ESPACIOS.find((e) => e.autos?.length && e.nombre.toLowerCase().split(' ')[0] && n.includes(e.nombre.toLowerCase().split(' ')[0]))
    )
  }, [nombre])

  if (!esp?.autos?.length) return null

  return (
    <Grupo titulo={`Automatizaciones sugeridas · ${esp.autos.length}`}>
      <div className="space-y-2">
        {esp.autos.map((a) => (
          <div key={a.nombre} className="rounded-lg border border-line px-2 py-1.5">
            <p className="text-[11.5px] text-cream">{a.nombre}</p>
            <p className="mt-0.5 text-[10.5px] leading-snug text-cream-3">
              <span className="text-cream-2">Cuando</span> {a.cuando}
            </p>
            <p className="text-[10.5px] leading-snug text-cream-3">
              <span className="text-cream-2">Entonces</span> {a.entonces}
            </p>
            {a.voz?.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {a.voz.map((v) => (
                  <span key={v} className="rounded border border-thread/35 px-1.5 py-0.5 text-[10px] text-thread-2">
                    “{v}”
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-cream-3">
        Se programan en la puesta en marcha. Los comandos funcionan en HomePod mini y en Echo Dot.
      </p>
    </Grupo>
  )
}

/* ── árbol de objetos ─────────────────────────────────────────── */

/**
 * Todo lo que hay en el espacio, en una lista.
 *
 * Faltaba lo más básico de un editor 3D: saber qué hay. Las piezas chicas
 * —un sensor de cinco centímetros montado en un plafón, el módulo detrás de un
 * apagador— son imposibles de tomar con el puntero en un plano isométrico, y
 * si no se pueden tomar tampoco se pueden editar. Desde la lista sí.
 *
 * Va agrupado por lo que es cada cosa, no por jerarquía de escena: aquí nadie
 * anida un sofá dentro de otro, y en cambio sí importa separar el mobiliario
 * del equipo que se cotiza.
 */
const GRUPOS = [
  ['equipo', 'Equipo'],
  ['mueble', 'Mobiliario'],
  ['punto', 'Instalación'],
]


function Objetos({ items, seleccion, onSeleccionar, onQuitar }) {
  const nombre = (it) =>
    it.clase === 'mueble'
      ? (MUEBLES[it.tipo]?.label ?? it.tipo)
      : it.clase === 'equipo'
        ? (DEVICE_BY_ID[it.deviceId]?.name ?? 'Equipo')
        : it.tipo

  return (
    <Grupo titulo={`Objetos · ${items.length + 1}`}>
      <div className="space-y-2">
        {/* Los muros son un objeto más, como en cualquier editor 3D: se
            seleccionan y se editan en el inspector, no en un campo suelto
            del encabezado que nadie encuentra. */}
        <button
          onClick={() => onSeleccionar(ID_MUROS)}
          className={`flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[11.5px] transition-colors ${
            seleccion === ID_MUROS ? 'bg-ember/20 text-ember' : 'text-cream-2 hover:bg-cream/8'
          }`}
        >
          Muros y piso
        </button>
        {GRUPOS.map(([clase, label]) => {
          const del = items.filter((i) => i.clase === clase)
          if (!del.length) return null
          return (
            <div key={clase}>
              <p className="mb-1 text-[10px] tracking-[0.12em] text-cream-3 uppercase">
                {label} · {del.length}
              </p>
              <div className="space-y-0.5">
                {del.map((it) => (
                  <div
                    key={it.id}
                    className={`group flex items-center gap-1 rounded px-1.5 py-1 transition-colors ${
                      seleccion === it.id ? 'bg-ember/20 text-ember' : 'text-cream-2 hover:bg-cream/8'
                    }`}
                  >
                    <button
                      onClick={() => onSeleccionar(it.id)}
                      className="min-w-0 flex-1 truncate text-left text-[11.5px]"
                    >
                      {nombre(it)}
                    </button>
                    <span className="shrink-0 text-[9.5px] tabular-nums text-cream-3">
                      {it.x.toFixed(1)}, {it.z.toFixed(1)}
                    </span>
                    <button
                      onClick={() => onQuitar(it.id)}
                      aria-label={`Quitar ${nombre(it)}`}
                      className="borrar shrink-0 text-[13px]"
                    >
                      <span>×</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Grupo>
  )
}

/* ── inspector de los muros ───────────────────────────────────── */

/**
 * El grosor del muro no es decoración: decide si la caja del apagador da para
 * meter el módulo detrás. Un muro de tabique de 12 cm sí; uno de tablaroca de
 * 7 con la caja a ras, casi nunca — y ahí hay que irse a la luminaria. Por eso
 * se levanta y por eso ahora se ve en el plano.
 */
const MUROS_TIPICOS = [
  [0.07, 'Tablaroca', 'Poco fondo. El módulo casi siempre se va a la luminaria.'],
  [0.12, 'Block o tabique', 'Lo normal en la Ciudad de México. El módulo entra detrás.'],
  [0.2, 'Muro de carga', 'De sobra para cualquier módulo.'],
]

/**
 * Un acabado por fila, con su nombre y por qué elegirlo.
 *
 * El "por qué" no es relleno: el piso y el muro son las dos superficies más
 * grandes del cuarto, y quien decide es el cliente, no nosotros. Ver "loseta
 * de 60 × 60, lo de baño y cocina" al lado de "tabla de 30 cm, se ve más
 * nueva" es lo que le permite decidir sin que le expliquen cada una.
 */
function Acabados({ titulo, opciones, valor, onElegir }) {
  const actual = valor ?? opciones[0].id
  return (
    <>
      <p className="mt-3 text-[10px] tracking-[0.12em] text-cream-3 uppercase">{titulo}</p>
      <div className="mt-1 space-y-1">
        {opciones.map((o) => {
          const on = o.id === actual
          return (
            <button
              key={o.id}
              onClick={() => onElegir(o.id)}
              className={`block w-full rounded px-1.5 py-1 text-left transition-colors ${
                on ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
              }`}
            >
              <span className="block text-[11px]">{o.label}</span>
              <span className={`block text-[10px] leading-snug ${on ? 'text-ink/70' : 'text-cream-3'}`}>
                {o.porque}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}

function InspectorMuros({ plano, onGuardar }) {
  const grosor = plano.muroGrosor ?? 0.12
  return (
    <Grupo titulo="Muros y piso">
      <Acabados
        titulo="Piso"
        opciones={PISOS}
        valor={plano.piso}
        onElegir={(id) => onGuardar({ piso: id }, 'Cambió el acabado del piso')}
      />
      <Acabados
        titulo="Acabado de muro"
        opciones={MUROS_ACABADO}
        valor={plano.muroAcabado}
        onElegir={(id) => onGuardar({ muroAcabado: id }, 'Cambió el acabado de los muros')}
      />

      <p className="mt-3 text-[10px] tracking-[0.12em] text-cream-3 uppercase">Grosor</p>
      <div className="mt-1 space-y-1">
        {MUROS_TIPICOS.map(([v, label, ayuda]) => (
          <button
            key={v}
            onClick={() => onGuardar({ muroGrosor: v }, 'Cambió el grosor de los muros')}
            className={`block w-full rounded px-1.5 py-1 text-left transition-colors ${
              Math.abs(grosor - v) < 0.005 ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
            }`}
          >
            <span className="block text-[11px]">
              {label} · {(v * 100).toFixed(0)} cm
            </span>
            <span className={`block text-[10px] ${Math.abs(grosor - v) < 0.005 ? 'text-ink/70' : 'text-cream-3'}`}>
              {ayuda}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Medida
          label="Grosor m"
          value={grosor}
          step={0.01}
          min={0.04}
          onChange={(v) => onGuardar({ muroGrosor: v }, 'Cambió el grosor de los muros')}
        />
        <label className="block">
          <span className="block text-[10px] text-cream-3">Color</span>
          <input
            type="color"
            value={plano.muroColor ?? '#3f4a63'}
            onChange={(e) => onGuardar({ muroColor: e.target.value }, 'Cambió el color de los muros')}
            className="mt-0.5 h-7 w-full rounded border border-line bg-ink"
          />
        </label>
      </div>

      {/* La red. Va aquí, con el espacio, porque es una condición del lugar
          como el grosor del muro: en la misma casa la recámara del fondo puede
          estar en otra malla, y eso decide si un aparato empareja o no. */}
      <p className="mt-3 text-[10px] tracking-[0.12em] text-cream-3 uppercase">Red inalámbrica</p>
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        <label className="block">
          <span className="block text-[10px] text-cream-3">Nombre de red</span>
          <input
            value={plano.red?.ssid ?? ''}
            onChange={(e) => onGuardar({ red: { ...(plano.red ?? {}), ssid: e.target.value } }, 'Anotó la red')}
            placeholder="MiCasa_2.4"
            className="mt-0.5 w-full rounded border border-line bg-ink px-1.5 py-1 text-[11.5px] text-cream placeholder:text-cream-3/50"
          />
        </label>
        <label className="block">
          <span className="block text-[10px] text-cream-3">Contraseña</span>
          <input
            value={plano.red?.clave ?? ''}
            onChange={(e) => onGuardar({ red: { ...(plano.red ?? {}), clave: e.target.value } }, 'Anotó la red')}
            className="mt-0.5 w-full rounded border border-line bg-ink px-1.5 py-1 text-[11.5px] text-cream"
          />
        </label>
      </div>
      <div className="mt-1 flex gap-1">
        {[
          ['2.4', '2.4 GHz'],
          ['5', '5 GHz'],
          ['mixta', 'Combinada'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => onGuardar({ red: { ...(plano.red ?? {}), banda: id } }, 'Anotó la banda de la red')}
            className={`flex-1 rounded px-1.5 py-1 text-[10.5px] transition-colors ${
              (plano.red?.banda ?? '') === id ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {plano.red?.banda === 'mixta' && (
        <p className="mt-1 text-[10px] leading-snug text-ember">
          Combinada: casi todo lo Matter sobre WiFi solo empareja en 2.4 GHz. Hay que separar la banda ANTES de
          llegar a instalar, o no empareja ninguno.
        </p>
      )}

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <Medida label="Ancho m" value={plano.ancho} step={0.1} min={1.2} onChange={(v) => onGuardar({ ancho: v }, 'Ajustó las medidas')} />
        <Medida label="Largo m" value={plano.largo} step={0.1} min={1.2} onChange={(v) => onGuardar({ largo: v }, 'Ajustó las medidas')} />
        <Medida label="Alto m" value={plano.alto} step={0.05} min={2} onChange={(v) => onGuardar({ alto: v }, 'Ajustó las medidas')} />
      </div>
    </Grupo>
  )
}

/**
 * El mando de un aparato, pieza por pieza.
 *
 * Lo que se ofrece sale de lo que el aparato ACEPTA, no de una lista fija:
 * ofrecerle "atenuar" a un enchufe es mentir, y una cortina no se enciende, se
 * abre. Es la misma tabla con la que se arman las automatizaciones, así que no
 * hay dos verdades que mantener.
 *
 * Y tarda lo que tarda de verdad: una cortina se toma sus doce segundos aquí
 * igual que en la casa. Es lo que evita la conversación incómoda de la
 * entrega —"¿por qué la mía no se abre de golpe como en la maqueta?"—.
 */
function Mando({ item, dev, estado, onMandar, bloqueo }) {
  const posibles = accionesDe(dev).filter((a) => !ACCIONES[a].sinObjetivo)
  if (posibles.length === 0) return null

  const nivel = estado?.nivel ?? 1
  const prendido = nivel > 0.02
  const abierto = Math.round((estado?.apertura ?? 0) * 100)
  const esCortina = dev.cat === 'cortinas'
  const enColor = !!estado?.rgb

  const mandar = (accion, valor = null) => {
    if (bloqueo) return
    onMandar([{ objetivo: item.id, accion, valor }])
  }

  const chip = (texto, onClick, on = false) => (
    <button
      key={texto}
      onClick={onClick}
      disabled={!!bloqueo}
      className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-40 ${
        on ? 'border-ember bg-ember/15 text-cream' : 'border-line text-cream-2 hover:bg-cream/8'
      }`}
    >
      {texto}
    </button>
  )

  return (
    <div className="mt-2 rounded-lg border border-thread/30 bg-thread/[0.05] px-2 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] tracking-[0.12em] text-thread-2 uppercase">Pruébalo</p>
        <span className="text-[10.5px] text-cream-3">
          {esCortina
            ? `${abierto} % abierta`
            : !prendido
              ? 'apagado'
              : `al ${Math.round(nivel * 100)} %${enColor ? ' · en color' : ''}`}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1">
        {/* Una cortina no se apaga: se abre o se cierra. El "alternar" que
            acepta por dentro se ofrece con esas dos palabras más abajo. */}
        {posibles.includes('alternar') &&
          !esCortina &&
          chip(prendido ? 'Apagar' : 'Encender', () => mandar('alternar'))}
        {posibles.includes('abrir') && (
          <>
            {chip('Abrir', () => mandar('abrir', 100), abierto >= 99)}
            {chip('A la mitad', () => mandar('abrir', 50), abierto > 40 && abierto < 60)}
            {chip('Cerrar', () => mandar('abrir', 0), abierto <= 1)}
          </>
        )}
        {posibles.includes('atenuar') &&
          [100, 60, 30, 10].map((n) =>
            chip(`${n} %`, () => mandar('atenuar', n), prendido && Math.round(nivel * 100) === n),
          )}
      </div>

      {posibles.includes('tono') && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {[
            [2200, 'Vela'],
            [2700, 'Cálido'],
            [4000, 'Neutro'],
            [6000, 'Frío'],
          ].map(([k, label]) => chip(label, () => mandar('tono', k), !enColor && (estado?.k ?? 0) === k))}
        </div>
      )}

      {/* La paleta, solo en los que de verdad hacen color. Un foco de blanco
          regulable no la ve: ofrecerle "pon la sala en morado" es la clase de
          promesa que se cae el día de la entrega. */}
      {posibles.includes('color') && (
        <div className="mt-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {COLORES.map(([hex, nombre]) => (
              <button
                key={hex}
                onClick={() => mandar('color', hex)}
                disabled={!!bloqueo}
                title={nombre}
                aria-label={nombre}
                className={`h-6 w-6 rounded-full border transition-transform disabled:opacity-40 ${
                  enColor && estado.rgb === hex
                    ? 'scale-110 border-cream'
                    : 'border-line hover:scale-110'
                }`}
                style={{ background: hex }}
              />
            ))}
            {/* Cualquier otro: el selector del sistema. Doce colores cubren lo
                que se pide de palabra; el resto se elige a ojo. */}
            <label
              className={`grid h-6 w-6 cursor-pointer place-items-center rounded-full border text-[11px] ${
                enColor && !COLORES.some(([h]) => h === estado.rgb)
                  ? 'border-cream text-cream'
                  : 'border-line text-cream-3'
              }`}
              title="Otro color"
            >
              +
              <input
                type="color"
                className="sr-only"
                value={estado?.rgb ?? '#ff5f6d'}
                onChange={(e) => mandar('color', e.target.value)}
              />
            </label>
          </div>
          {enColor && (
            <button
              onClick={() => mandar('tono', 2700)}
              className="mt-1 text-[10.5px] text-cream-3 underline decoration-dotted underline-offset-2 hover:text-cream"
            >
              volver a blanco
            </button>
          )}
        </div>
      )}

      <p className="mt-1.5 text-[10px] leading-snug text-cream-3">
        Tarda lo que tarda en la casa: {duracionDe(dev, posibles.includes('abrir') ? 'abrir' : 'atenuar')} s.
      </p>
    </div>
  )
}

/**
 * Deshacer y rehacer, dibujados.
 *
 * Las flechas de teclado (↶ ↷) las pinta la fuente del sistema, así que
 * cambian de forma, de grosor y hasta de tamaño según el equipo: en algunos
 * salían casi rectas y no se leían como "regresar". Este es el mismo trazo que
 * el resto de los iconos de la herramienta —línea de 1.6, puntas redondas— y
 * se ve igual en todos lados.
 *
 * Es una flecha que da media vuelta hacia atrás. Rehacer es la misma
 * espejeada, que es como se reconoce el par sin leer nada.
 */
function IconoHistoria({ alReves = false, size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={alReves ? { transform: 'scaleX(-1)' } : undefined}
    >
      {/* el arco: sale de la izquierda, sube y regresa */}
      <path d="M4 9h9.5a5.5 5.5 0 0 1 0 11H8" />
      {/* la punta, apuntando a donde empieza el arco */}
      <path d="M7.5 5.5 4 9l3.5 3.5" />
    </svg>
  )
}

/**
 * Alta de un aparato que no está en el catálogo.
 *
 * Se piden solo los datos que CAMBIAN algo aguas abajo, y se dice para qué
 * sirve cada uno: la categoría decide qué se le puede pedir y dónde se coloca;
 * los ecosistemas deciden qué asistente lo alcanza —que es de lo que se queja
 * el cliente el primer día—; el enlace decide si necesita puente; los lúmenes
 * y el tono entran al cálculo de luz del cuarto. Pedir la ficha completa de un
 * fabricante sería un formulario que nadie llena.
 *
 * Queda en ESTE proyecto. El catálogo curado es lo que se le propone a
 * cualquier cliente; esto es lo que ya tiene éste en su casa.
 */
function AltaDevice({ onCerrar, onCrear }) {
  const [d, setD] = useState({
    name: '',
    brand: '',
    cat: 'iluminacion',
    link: 'wifi',
    eco: ['apple', 'google', 'alexa'],
    power: 'corriente',
    precio: 0,
    lm: 800,
    k: 2700,
    rgb: false,
  })
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }))
  const esLuz = d.cat === 'iluminacion'

  const crear = () => {
    if (!d.name.trim()) return
    const id = `propio-${d.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 28)}-${Math.random().toString(36).slice(2, 6)}`
    onCrear({
      id,
      name: d.name.trim(),
      brand: d.brand.trim() || 'Sin marca',
      cat: d.cat,
      link: d.link,
      eco: d.eco,
      power: d.power,
      price: [Number(d.precio) || 0, Number(d.precio) || 0],
      tier: 'esencial',
      ...(esLuz
        ? { luz: { lm: Number(d.lm) || 800, k: [d.rgb ? 1800 : 2700, 6500], haz: 180, forma: 'punto', rgb: d.rgb } }
        : {}),
      pitch: 'Dado de alta en el levantamiento. Revisar ficha del fabricante antes de cotizar.',
    })
  }

  const campo = 'mt-0.5 w-full rounded-lg border border-line bg-ink px-2 py-1.5 text-[12px] text-cream'

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/80 p-4 backdrop-blur">
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-ink p-4">
        <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Alta de aparato</p>
        <h3 className="display mt-0.5 text-[19px] text-cream">Uno que no está en el catálogo</h3>
        <p className="mt-1.5 text-[11px] leading-snug text-cream-3">
          Solo lo que cambia algo después. Queda en este proyecto y entra a la cotización, al alcance del
          asistente, a las ambientaciones y a su propio mando.
        </p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="block text-[10px] text-cream-3">Cómo se llama</span>
            <input
              autoFocus
              value={d.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Foco RGB 9 W"
              className={campo}
            />
          </label>
          <label className="block">
            <span className="block text-[10px] text-cream-3">Marca</span>
            <input value={d.brand} onChange={(e) => set('brand', e.target.value)} className={campo} />
          </label>
          <label className="block">
            <span className="block text-[10px] text-cream-3">Precio unitario</span>
            <input
              type="number"
              min="0"
              value={d.precio}
              onChange={(e) => set('precio', e.target.value)}
              className={campo}
            />
          </label>

          <label className="block">
            <span className="block text-[10px] text-cream-3">Qué es</span>
            <select value={d.cat} onChange={(e) => set('cat', e.target.value)} className={campo}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[10px] text-cream-3">Cómo se conecta</span>
            <select value={d.link} onChange={(e) => set('link', e.target.value)} className={campo}>
              {['matter', 'thread', 'wifi', 'zigbee', 'zwave', 'ble', 'cable', 'poe'].map((l) => (
                <option key={l} value={l}>
                  {LINK_LABEL[l] ?? l}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <span className="block text-[10px] text-cream-3">Con qué asistentes habla</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {ECOSYSTEMS.map((e) => {
                const on = d.eco.includes(e.id)
                return (
                  <button
                    key={e.id}
                    onClick={() => set('eco', on ? d.eco.filter((x) => x !== e.id) : [...d.eco, e.id])}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      on ? 'border-ember bg-ember/12 text-cream' : 'border-line text-cream-3 hover:bg-cream/6'
                    }`}
                  >
                    {e.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-1 text-[10px] leading-snug text-cream-3">
              Esto es lo que decide qué asistente lo alcanza, y es de lo que se queja el cliente el primer día.
              Si no estás seguro, mira la caja: viene impreso.
            </p>
          </div>

          <label className="block">
            <span className="block text-[10px] text-cream-3">Cómo se alimenta</span>
            <select value={d.power} onChange={(e) => set('power', e.target.value)} className={campo}>
              {['corriente', 'enchufe', 'cableado', 'pila', 'poe', 'ninguna'].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>

          {esLuz && (
            <>
              <label className="block">
                <span className="block text-[10px] text-cream-3">Lúmenes</span>
                <input
                  type="number"
                  min="0"
                  value={d.lm}
                  onChange={(e) => set('lm', e.target.value)}
                  className={campo}
                />
              </label>
              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={d.rgb}
                  onChange={(e) => set('rgb', e.target.checked)}
                  className="h-4 w-4 accent-[#4d9fff]"
                />
                <span className="text-[11.5px] text-cream-2">Hace color, no solo blanco regulable</span>
              </label>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCerrar} className="rounded-lg border border-line px-3 py-1.5 text-[12px] text-cream-2">
            Cancelar
          </button>
          <button
            onClick={crear}
            disabled={!d.name.trim()}
            className="rounded-lg bg-ember px-3.5 py-1.5 text-[12px] text-ink disabled:opacity-40"
          >
            Dar de alta y colocar
          </button>
        </div>
      </div>
    </div>
  )
}

/* Doce colores con nombre. No es una rueda de color: en la casa nadie pide
   "#7c3aed", pide morado. Los doce son los que se dicen de palabra, y para
   todo lo demás está el selector del sistema. */
const COLORES = [
  ['#ff3b30', 'Rojo'],
  ['#ff6b35', 'Naranja'],
  ['#ffb300', 'Ámbar'],
  ['#ffe066', 'Amarillo'],
  ['#7ed957', 'Verde'],
  ['#2fbf71', 'Verde bosque'],
  ['#2ec4c4', 'Turquesa'],
  ['#3b9dff', 'Azul'],
  ['#3b5bff', 'Azul rey'],
  ['#8b5cf6', 'Morado'],
  ['#e879b9', 'Rosa'],
  ['#ff5f6d', 'Coral'],
]

/* ── inspector de la pieza seleccionada ───────────────────────── */

/**
 * A qué está pegada la pieza, y el botón para despegarla.
 *
 * Se enseña siempre, aunque no esté pegada a nada: saber que algo NO está
 * anclado importa tanto como saber a qué lo está — es la diferencia entre
 * "se va a mover con el buró" y "se va a quedar flotando".
 */
const Amarre = ({ activo, onClick, children }) => (
  <button
    onClick={onClick}
    className={`rounded-full border px-2 py-0.5 text-[10.5px] transition-colors ${
      activo ? 'border-ember bg-ember/12 text-cream' : 'border-line text-cream-3 hover:bg-cream/6'
    }`}
  >
    {children}
  </button>
)

function Vinculo({ item, items, plano, onParchar, onSeleccionar }) {
  const a = item.ancla
  const nombre = comoSeLlama(a, items)
  const suelta = !!item.suelta

  return (
    <div className="mt-2 rounded-lg border border-line px-2 py-2">
      <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Va pegada a</p>
      <p className="mt-1 text-[11.5px] leading-snug text-cream-2">
        {suelta ? (
          <>Nada. Se queda donde está aunque se mueva lo de alrededor.</>
        ) : a ? (
          <>
            <span className="text-cream">{nombre}</span>. Si eso se mueve o el cuarto cambia de
            medidas, se va con él.
          </>
        ) : (
          <>Nada todavía. Suéltala encima de un mueble o contra un muro y se pega sola.</>
        )}
      </p>
      {/* A qué se amarra. Los dos muros más cercanos —el mueble esquinado toca
          dos y hay que poder decir a cuál— más el piso y el plafón, que son
          superficies como cualquier otra: una maceta que se queda en el suelo
          está amarrada al suelo, y un empotrado al plafón. */}
      {!suelta && plano && (
        <div className="mt-2 flex flex-wrap gap-1">
          {murosCerca(item, plano)
            .slice(0, 2)
            .map((m) => (
              <Amarre
                key={m.muro}
                activo={a?.a === 'muro' && a.muro === m.muro}
                onClick={() => onParchar(item.id, { ancla: anclaEnMuro(item, plano, m.muro) })}
              >
                {m.label} · {Math.round(m.dist * 100)} cm
              </Amarre>
            ))}
          <Amarre
            activo={a?.a === 'piso'}
            onClick={() => onParchar(item.id, { ancla: { a: 'piso' }, y: 0 })}
          >
            el piso
          </Amarre>
          <Amarre
            activo={a?.a === 'techo'}
            onClick={() =>
              onParchar(item.id, {
                ancla: {
                  a: 'techo',
                  u: (item.x + plano.ancho / 2) / plano.ancho,
                  v: (item.z + plano.largo / 2) / plano.largo,
                  y: item.y ?? (plano.alto ?? 2.6) - 0.2,
                },
              })
            }
          >
            el plafón
          </Amarre>
        </div>
      )}

      {/* Cuánto se despega del muro. La cama contra la pared de los contactos
          los tapa, y hay que poder separarla diez centímetros para verlos —o
          para que quepa el zoclo, o el radiador, o el cable. Se escribe, no se
          adivina. */}
      {!suelta && a?.a === 'muro' && (
        <div className="mt-2">
          <Medida
            label="Separación del muro · cm"
            value={Math.round((a.sep ?? 0) * 100)}
            step={1}
            min={0}
            onChange={(v) =>
              onParchar(item.id, { ancla: { ...a, sep: Math.max(0, v) / 100 } })
            }
          />
        </div>
      )}

      <div className="mt-2 flex gap-1.5">
        {(a || suelta) && (
          <button
            onClick={() =>
              onParchar(item.id, suelta ? { suelta: undefined } : { ancla: undefined, suelta: true })
            }
            className="flex-1 rounded-lg border border-line px-2 py-1 text-[11px] text-cream-2 hover:border-cream/35"
          >
            {suelta ? 'Volver a pegar' : 'Despegar'}
          </button>
        )}
        {a?.a === 'mueble' && (
          <button
            onClick={() => onSeleccionar?.(a.id)}
            className="rounded-lg border border-line px-2 py-1 text-[11px] text-cream-3 hover:border-cream/35"
          >
            ver el mueble
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * El grosor y el color de UN cable.
 *
 * Un cable no es una pieza del plano —vive metido en `item.cable`, sin id
 * propio— así que no tiene un Inspector como el de un mueble o un aparato.
 * Éste es más chico a propósito: dos controles y ya, porque es lo único que
 * de verdad varía cable por cable. El largo y la ruta se siguen editando
 * donde ya se editaban.
 */
function InspectorCable({ item, cable, onCambiar, onCerrar }) {
  const grosorCuarto = useEstilo((e) => e.grosorCable)
  const colorDefecto = COLOR_CABLE[cable.ruta] ?? COLOR_CABLE.piso
  const nombre =
    item.clase === 'equipo' ? (DEVICE_BY_ID[item.deviceId]?.name ?? 'dispositivo') : MUEBLES[item.tipo]?.label ?? item.tipo

  return (
    <Grupo
      titulo={`Cable · ${nombre}`}
      right={
        <button onClick={onCerrar} className="text-[10.5px] text-cream-3 hover:text-ember">
          cerrar
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-1.5">
        <Medida
          label="Grosor · mm"
          value={cable.grosor ?? grosorCuarto}
          step={0.5}
          min={1}
          onChange={(v) => onCambiar({ grosor: Math.max(1, v) })}
        />
        <label className="block">
          <span className="mb-0.5 block text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Color</span>
          <input
            type="color"
            value={cable.color ?? colorDefecto}
            onChange={(e) => onCambiar({ color: e.target.value })}
            className="h-[26px] w-full cursor-pointer rounded border border-line bg-ink"
          />
        </label>
      </div>
      {(cable.grosor != null || cable.color != null) && (
        <button
          onClick={() => onCambiar({ grosor: undefined, color: undefined })}
          className="mt-2 w-full rounded-lg border border-line px-2 py-1 text-[11px] text-cream-2 hover:border-cream/35"
        >
          Volver al grosor y color del cuarto
        </button>
      )}
    </Grupo>
  )
}

function Inspector({
  item,
  plano,
  onParchar,
  onQuitar,
  onUnir,
  tramos,
  onQuitarTramo,
  onModulo,
  onMandar,
  estado,
  bloqueo,
  items = [],
  sim,
  onSeleccionar,
  onTaller,
}) {
  const dev = item.clase === 'equipo' ? DEVICE_BY_ID[item.deviceId] : null
  const alojados = useMemo(() => dispositivosDe(item, items), [item, items])
  /* Lo que vive ENCIMA de esta pieza —por ancla explícita, un monitor sobre
     el escritorio, o por cercanía, un foco metido en la lámpara— se mueve con
     ella pero no cambia de tamaño con ella. Escalar el mueble sin tocar lo de
     arriba deja al Apple TV flotando a un lado del buró o colgando del aire
     sobre el escritorio, así que mientras algo repose ahí, la escala se
     queda fija. */
  const hijos = useMemo(
    () => items.filter((i) => i.ancla?.a === 'mueble' && i.ancla.id === item.id),
    [item.id, items],
  )
  const encima = useMemo(() => {
    const ids = new Set([...hijos, ...alojados].map((i) => i.id))
    return ids.size
  }, [hijos, alojados])
  const tieneEncima = encima > 0
  const p = item.params

  const titulo =
    item.clase === 'mueble' ? MUEBLES[item.tipo]?.label : item.clase === 'equipo' ? dev?.name : `Punto · ${item.tipo}`

  return (
    <Grupo
      titulo={titulo ?? 'Pieza'}
      right={
        <button onClick={() => onQuitar(item.id)} className="text-[10.5px] text-cream-3 hover:text-ember">
          quitar
        </button>
      }
    >
      {dev && (
        <p className="mb-2 text-[10.5px] text-cream-3">
          {dev.brand} · {CATEGORIES.find((c) => c.id === dev.cat)?.label}
        </p>
      )}

      {/* ── a qué está pegada ──
          Lo importante no es el dato, es poder soltarla: una pieza que se
          pega sola a lo que pase por debajo y no se puede despegar es peor
          que una que no se pega a nada. */}
      <Vinculo item={item} items={items} plano={plano} onParchar={onParchar} onSeleccionar={onSeleccionar} />

      {/* Todo a mano además del gizmo: cuando el cliente da una medida
          exacta —"el buró va a 40 cm de la pared"— hay que poder escribirla. */}
      <p className="mt-2 mb-1 text-[10px] tracking-[0.12em] text-cream-3 uppercase">Transformación</p>
      <div className="grid grid-cols-3 gap-1.5">
        <Medida label="X m" value={item.x} min={-50} onChange={(v) => onParchar(item.id, { x: v })} />
        <Medida label="Y m" value={item.y ?? 0} min={0} onChange={(v) => onParchar(item.id, { y: v })} />
        <Medida label="Z m" value={item.z} min={-50} onChange={(v) => onParchar(item.id, { z: v })} />
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <Medida
          label="Giro °"
          value={Math.round((((item.rot ?? 0) * 180) / Math.PI) % 360)}
          step={5}
          min={-360}
          onChange={(v) => onParchar(item.id, { rot: (v * Math.PI) / 180 })}
        />
        <Medida
          label="Escala"
          value={item.esc ?? 1}
          step={0.05}
          min={0.2}
          disabled={tieneEncima}
          title="Tiene algo encima: despégalo o muévelo antes de cambiar el tamaño."
          onChange={(v) => onParchar(item.id, { esc: Math.max(0.2, Math.min(4, v)) })}
        />
      </div>
      {tieneEncima && (
        <p className="mt-1 text-[10px] text-cream-3">
          No se puede escalar: tiene {encima === 1 ? 'algo' : `${encima} cosas`} encima.
        </p>
      )}

      {item.clase === 'punto' && item.tipo === 'apagador' && (
        <div className="mt-2 space-y-1.5 rounded-lg border border-line px-2 py-2">
          <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Cómo lo hacemos inteligente</p>
          {[
            ['atras', 'Módulo detrás del apagador', 'Se conserva el apagador que ya está. Necesita fondo en la caja.'],
            ['luminaria', 'Módulo en la luminaria', 'Cuando la caja no da o no hay neutro ahí.'],
            [null, 'Se cambia el apagador', 'Apagador inteligente completo, se ve distinto.'],
          ].map(([v, label, ayuda]) => (
            <button
              key={label}
              onClick={() => onModulo(item.id, v)}
              className={`block w-full rounded px-1.5 py-1 text-left transition-colors ${
                (item.modulo ?? null) === v ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
              }`}
            >
              <span className="block text-[11px]">{label}</span>
              <span className={`block text-[10px] ${(item.modulo ?? null) === v ? 'text-ink/70' : 'text-cream-3'}`}>
                {ayuda}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Al taller: la pieza sola, sin cuarto, para poder tocarla.
          Corregir una proporción o mover por dónde sale un cable dejaba de ser
          algo que se hace y pasaba a ser algo que se pide. */}
      {onTaller && (item.clase === 'mueble' || item.clase === 'equipo') && (
        <button
          onClick={() => onTaller(item.id)}
          className="mt-2 w-full rounded-lg border border-cream/25 px-2 py-1.5 text-[11.5px] text-cream-2 transition-colors hover:border-ember hover:text-cream"
        >
          Editar partes y funcionalidad →
        </button>
      )}

      {/* Lo que se le puede pedir a ESTE aparato, ahora mismo.
          Hasta aquí la demostración era por ambientaciones —escenas de varios
          aparatos a la vez— y faltaba lo más simple: prender esta lámpara. En
          la junta el cliente señala una cosa y pregunta "¿y ésta?", y no había
          forma de contestarle sin correr una escena entera. */}
      {item.clase === 'equipo' && dev && onMandar && (
        <Mando item={item} dev={dev} estado={estado} onMandar={onMandar} bloqueo={bloqueo} />
      )}

      {/* Lo inteligente que este mueble lleva dentro o encima.
          El cliente no ve dos piezas: ve una lámpara. Cuando la señala y
          pregunta "¿ésta se apaga desde el teléfono?", la respuesta tiene que
          estar aquí y no en un punto invisible flotando adentro de ella. */}
      {item.clase === 'mueble' &&
        onMandar &&
        alojados.map((eq) => {
          const d = DEVICE_BY_ID[eq.deviceId]
          return (
            <div key={eq.id} className="mt-2">
              <p className="text-[10px] leading-snug text-cream-3">
                {MUEBLES[item.tipo]?.label} {comoAloja(item, d)}{' '}
                <button
                  onClick={() => onSeleccionar?.(eq.id)}
                  className="text-cream underline decoration-dotted underline-offset-2 hover:text-ember"
                >
                  {d.name}
                </button>
              </p>
              <Mando item={eq} dev={d} estado={sim?.[eq.id]} onMandar={onMandar} bloqueo={bloqueo} />
            </div>
          )
        })}

      {/* Las versiones de este mueble. Va arriba de todo lo demás porque es lo
          primero que se decide: qué cama, no dónde va la cama. */}
      {item.clase === 'mueble' && MUEBLES[item.tipo]?.variantes?.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">
            Versión · {MUEBLES[item.tipo].variantes.length}
          </p>
          <div className="mt-1 space-y-1">
            {MUEBLES[item.tipo].variantes.map((va, i) => {
              const on = (item.variante ?? MUEBLES[item.tipo].variantes[0].id) === va.id
              return (
                <button
                  key={va.id}
                  onClick={() => onParchar(item.id, { variante: va.id }, `Cambió a ${va.label.toLowerCase()}`)}
                  className={`block w-full rounded px-1.5 py-1 text-left transition-colors ${
                    on ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
                  }`}
                >
                  <span className="block text-[11px]">
                    {i + 1}. {va.label}
                  </span>
                  <span className={`block text-[10px] leading-snug ${on ? 'text-ink/70' : 'text-cream-3'}`}>
                    {va.porque}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {item.clase === 'mueble' && MUEBLES[item.tipo]?.portafoco && (
        <div className="mt-2 rounded-lg border border-ember/30 bg-ember/[0.06] px-2 py-2">
          <p className="text-[10px] tracking-[0.12em] text-ember uppercase">Aquí va un foco inteligente</p>
          <p className="mt-1 text-[10.5px] leading-snug text-cream-2">
            Esta lámpara no se cambia: se le cambia el foco. Es la pieza más barata de automatizar de toda la
            casa y no pide obra ni tocar la instalación.
          </p>
        </div>
      )}

      {item.clase === 'punto' && (
        <div className="mt-2 space-y-1">
          <button
            onClick={onUnir}
            className="w-full rounded-lg border border-thread/50 px-2 py-1 text-[11.5px] text-thread-2 hover:bg-thread/10"
          >
            Unir con cable →
          </button>
          {tramos
            .filter((t) => t.entre?.includes(item.id))
            .map((t, i) => (
              <button
                key={t.id}
                onClick={() => onQuitarTramo(t.id)}
                className="flex w-full items-center justify-between rounded border border-line px-2 py-0.5 text-[10.5px] text-cream-3 hover:border-ember hover:text-ember"
              >
                Cable {i + 1} <span>quitar</span>
              </button>
            ))}
        </div>
      )}

      {item.clase !== 'mueble' && (
        <div className="mt-2">
          <Medida
            label="Altura m"
            value={item.y ?? 0}
            min={0}
            onChange={(v) => onParchar(item.id, { y: v }, 'Cambió la altura de una pieza')}
          />
        </div>
      )}

      {/* Dónde va montado el foco. Cambia cómo se dibuja —roseta y bulbo en
          el plafón, solo el resplandor dentro de una pantalla— y eso es lo que
          separa un plano de un diagrama. */}
      {p && p.forma !== 'panel' && p.forma !== 'lineal' && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Dónde va montado</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {[
              ['techo', 'Al plafón'],
              ['empotrado', 'Empotrado'],
              ['lampara', 'Dentro de una lámpara'],
              ['muro', 'Arbotante en muro'],
              ['libre', 'Suelto'],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => onParchar(item.id, { params: { ...p, montaje: v } }, 'Cambió el montaje de un foco')}
                className={`rounded border px-1.5 py-0.5 text-[10.5px] transition-colors ${
                  (p.montaje ?? 'techo') === v
                    ? 'border-ember bg-ember/15 text-ember'
                    : 'border-line text-cream-3 hover:border-cream/35'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* La composición de los paneles se decide en el muro, no en la caja.
          Cambia el muro que se necesita, dónde queda el cable y lo que el
          cliente va a ver — así que se escoge en el levantamiento. */}
      {p?.forma === 'panel' && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Cómo se arman los paneles</p>
          <div className="mt-1.5 space-y-1">
            {DISPOSICIONES.map((d) => {
              const on = (p.disposicion ?? 'triangulo') === d.id
              return (
                <button
                  key={d.id}
                  onClick={() => onParchar(item.id, { params: { ...p, disposicion: d.id } }, `Cambió la figura de los paneles`)}
                  className={`block w-full rounded px-1.5 py-1 text-left transition-colors ${
                    on ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
                  }`}
                >
                  <span className="block text-[11px]">{d.nombre}</span>
                  <span className={`block text-[10px] leading-snug ${on ? 'text-ink/70' : 'text-cream-3'}`}>
                    {d.porque}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Los parámetros fotométricos se editan por pieza, no por catálogo: en
          la misma casa el mismo foco va al 100 % en la cocina y al 30 % en la
          recámara, y el plano tiene que poder decir eso. */}
      {p && (
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Cómo ilumina</p>

          <label className="block">
            <span className="flex justify-between text-[11px] text-cream-3">
              Brillo <span className="text-cream-2">{p.brillo}%</span>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={p.brillo}
              onChange={(e) => onParchar(item.id, { params: { ...p, brillo: num(e.target.value) } })}
              className="w-full accent-[var(--color-ember)]"
            />
          </label>

          <label className="block">
            <span className="flex justify-between text-[11px] text-cream-3">
              Tono <span className="text-cream-2">{p.k} K</span>
            </span>
            <input
              type="range"
              min={dev?.luz?.k?.[0] ?? 2200}
              max={dev?.luz?.k?.[1] ?? 6500}
              step="50"
              value={p.k}
              onChange={(e) => onParchar(item.id, { params: { ...p, k: num(e.target.value) } })}
              className="w-full accent-[var(--color-ember)]"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <Medida
              label="Lúmenes"
              value={p.lm}
              step={50}
              min={0}
              onChange={(v) => onParchar(item.id, { params: { ...p, lm: v } }, 'Ajustó los lúmenes de una pieza')}
            />
            <Medida
              label="Haz °"
              value={p.haz}
              step={5}
              min={5}
              onChange={(v) => onParchar(item.id, { params: { ...p, haz: v } }, 'Ajustó el haz de una pieza')}
            />
          </div>
          <p className="text-[10px] leading-snug text-cream-3">
            Salen de la ficha del fabricante. Se ajustan aquí cuando la pieza real no se porta como dice la caja.
          </p>
        </div>
      )}
    </Grupo>
  )
}

/* ── comportamientos: eventos, acciones y tiempos reales ──────── */

/**
 * El editor de "qué pasa cuando pasa algo".
 *
 * Sustituye a las reglas viejas, que solo sabían de un apagador alternando un
 * grupo de luces. Ahora el disparador puede ser un sensor, una frase, una
 * hora o que alguien llegue, y la acción puede atenuar, cambiar el tono o
 * abrir una cortina a la mitad.
 *
 * Cada acción trae el tiempo que tarda el aparato de verdad, y ese tiempo se
 * ve correr en el plano. No es adorno: es lo que se va a programar en la
 * puesta en marcha, y lo que el cliente ya vio y aprobó.
 */
function Comportamientos({ comps, items, onGuardar, onDisparar, bloqueo, onLiberar }) {
  const [abierto, setAbierto] = useState(null)

  const puntos = items.filter((i) => i.clase === 'punto' && i.tipo === 'apagador')
  const equipos = items.filter((i) => i.clase === 'equipo')
  const sensores = equipos.filter((i) => DEVICE_BY_ID[i.deviceId]?.cat === 'sensores')

  const nombreDe = (it) =>
    it.clase === 'equipo' ? (DEVICE_BY_ID[it.deviceId]?.name ?? 'dispositivo') : it.tipo

  const guardar = (nuevos, que) => onGuardar(nuevos, que)

  const parchar = (id, parche) =>
    guardar(
      comps.map((c) => (c.id === id ? { ...c, ...parche } : c)),
      'Cambió un comportamiento',
    )

  const agregar = () => {
    const c = compVacio(uid('c'))
    guardar([...comps, c], 'Agregó un comportamiento')
    setAbierto(c.id)
  }

  const quitar = (id) => guardar(comps.filter((c) => c.id !== id), 'Quitó un comportamiento')

  const agregarAccion = (c) => {
    const primero = equipos[0]
    if (!primero) return
    const acciones = accionesDe(DEVICE_BY_ID[primero.deviceId])
    parchar(c.id, {
      entonces: [...c.entonces, { objetivo: primero.id, accion: acciones[0], valor: ACCIONES[acciones[0]].def ?? null }],
    })
  }

  const parcharAccion = (c, i, parche) =>
    parchar(c.id, { entonces: c.entonces.map((a, n) => (n === i ? { ...a, ...parche } : a)) })

  return (
    <Grupo
      titulo={`Comportamiento · ${comps.length}`}
      right={
        <button onClick={agregar} className="text-[10.5px] text-cream-3 hover:text-ember">
          agregar
        </button>
      }
    >
      {/* Con la casa bloqueada nada responde, y hay que decir por qué: un
          sistema que deja de obedecer sin explicarse se siente descompuesto. */}
      {bloqueo && (
        <div className="mb-2 rounded-lg border border-rose-500/50 bg-rose-500/10 px-2.5 py-2">
          <p className="text-[11.5px] text-rose-300">Casa bloqueada · {bloqueo.nombre}</p>
          <p className="mt-0.5 text-[10.5px] leading-snug text-cream-2">
            Ninguna automatización va a mover nada hasta que alguien lo libere. Cada relevador que abre o cierra
            hace chispa, y con gas acumulado eso es lo que hay que evitar.
          </p>
          <button
            onClick={onLiberar}
            className="mt-1.5 rounded border border-rose-400 px-2 py-0.5 text-[10.5px] text-rose-200 hover:bg-rose-500/20"
          >
            Ya revisé — liberar la casa
          </button>
        </div>
      )}

      {comps.length === 0 && (
        <p className="text-[11px] leading-relaxed text-cream-3">
          Nada automatizado todavía. Esto es lo que el cliente sí entiende del levantamiento — y lo que se
          programa el día de la puesta en marcha.
        </p>
      )}

      <div className="space-y-1.5">
        {comps.map((c) => {
          const f = frasear(c, items)
          const d = DISPAROS[c.cuando.tipo]
          const editando = abierto === c.id
          const listo = c.entonces.length > 0 && (d?.pide == null || c.cuando.ref || c.cuando.valor)

          return (
            <div key={c.id} className="rounded-lg border border-line px-2 py-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] leading-snug text-cream">
                    <span className="text-cream-3">Cuando</span> {f.cuando}
                  </p>
                  <p className="text-[10.5px] leading-snug text-cream-2">
                    <span className="text-cream-3">Entonces</span> {f.entonces}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5">
                  {listo && (
                    <button
                      onClick={() => onDisparar(c.id)}
                      className="rounded border border-ember px-2 py-0.5 text-[10.5px] text-ember hover:bg-ember hover:text-ink"
                    >
                      probar
                    </button>
                  )}
                  <button
                    onClick={() => setAbierto(editando ? null : c.id)}
                    className="text-[10.5px] text-cream-3 hover:text-ember"
                  >
                    {editando ? 'listo' : 'editar'}
                  </button>
                </span>
              </div>

              {editando && (
                <div className="mt-2 space-y-2 border-t border-line pt-2">
                  {/* ── el disparador ── */}
                  <div>
                    <p className="mb-1 text-[10px] tracking-[0.12em] text-cream-3 uppercase">Cuando</p>
                    <select
                      value={c.cuando.tipo}
                      onChange={(e) =>
                        parchar(c.id, { cuando: { tipo: e.target.value, ref: null, valor: null } })
                      }
                      className="w-full rounded border border-line bg-ink px-1.5 py-1 text-[11px] text-cream"
                    >
                      {Object.entries(DISPAROS).map(([id, v]) => (
                        <option key={id} value={id}>
                          {v.label}
                        </option>
                      ))}
                    </select>

                    {d?.pide === 'punto' && (
                      <select
                        value={c.cuando.ref ?? ''}
                        onChange={(e) => parchar(c.id, { cuando: { ...c.cuando, ref: e.target.value } })}
                        className="mt-1 w-full rounded border border-line bg-ink px-1.5 py-1 text-[11px] text-cream"
                      >
                        <option value="">Cuál apagador…</option>
                        {puntos.map((x, n) => (
                          <option key={x.id} value={x.id}>
                            Apagador {n + 1}
                          </option>
                        ))}
                      </select>
                    )}

                    {d?.pide === 'equipo' && (
                      <select
                        value={c.cuando.ref ?? ''}
                        onChange={(e) => parchar(c.id, { cuando: { ...c.cuando, ref: e.target.value } })}
                        className="mt-1 w-full rounded border border-line bg-ink px-1.5 py-1 text-[11px] text-cream"
                      >
                        <option value="">Cuál sensor…</option>
                        {(sensores.length ? sensores : equipos).map((x) => (
                          <option key={x.id} value={x.id}>
                            {nombreDe(x)}
                          </option>
                        ))}
                      </select>
                    )}

                    {(d?.pide === 'frase' || d?.pide === 'hora') && (
                      <input
                        type={d.pide === 'hora' ? 'time' : 'text'}
                        value={c.cuando.valor ?? ''}
                        placeholder={d.pide === 'frase' ? 'Oye Siri, buenas noches' : ''}
                        onChange={(e) => parchar(c.id, { cuando: { ...c.cuando, valor: e.target.value } })}
                        className="mt-1 w-full rounded border border-line bg-ink px-1.5 py-1 text-[11px] text-cream"
                      />
                    )}

                    {d?.ayuda && <p className="mt-1 text-[10px] leading-snug text-cream-3">{d.ayuda}</p>}
                  </div>

                  {/* ── las acciones ── */}
                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Entonces</p>
                      <button onClick={() => agregarAccion(c)} className="text-[10.5px] text-cream-3 hover:text-ember">
                        + acción
                      </button>
                    </div>

                    {equipos.length === 0 && (
                      <p className="text-[10.5px] text-cream-3">No hay dispositivos colocados en este espacio.</p>
                    )}

                    <div className="space-y-1.5">
                      {c.entonces.map((a, i) => {
                        const obj = items.find((x) => x.id === a.objetivo)
                        const dev = obj ? DEVICE_BY_ID[obj.deviceId] : null
                        const opciones = accionesDe(dev)
                        const acc = ACCIONES[a.accion]
                        const seg = duracionDe(dev, a.accion)
                        return (
                          <div key={i} className="rounded border border-line px-1.5 py-1">
                            <div className="flex items-center gap-1">
                              <select
                                value={a.accion}
                                onChange={(e) =>
                                  parcharAccion(c, i, {
                                    accion: e.target.value,
                                    valor: ACCIONES[e.target.value].def ?? null,
                                  })
                                }
                                className="rounded border border-line bg-ink px-1 py-0.5 text-[10.5px] text-cream"
                              >
                                {opciones.map((o) => (
                                  <option key={o} value={o}>
                                    {ACCIONES[o].label}
                                  </option>
                                ))}
                              </select>

                              {acc?.valor && (
                                <input
                                  type="number"
                                  value={a.valor ?? acc.def}
                                  min={acc.min}
                                  max={acc.max}
                                  step={acc.paso ?? 5}
                                  onChange={(e) => parcharAccion(c, i, { valor: num(e.target.value) })}
                                  className="w-14 rounded border border-line bg-ink px-1 py-0.5 text-[10.5px] tabular-nums text-cream"
                                />
                              )}
                              {acc?.valor && <span className="text-[10px] text-cream-3">{acc.unidad}</span>}

                              <button
                                onClick={() => parchar(c.id, { entonces: c.entonces.filter((_, n) => n !== i) })}
                                className="ml-auto text-[11px] text-cream-3 hover:text-ember"
                                aria-label="Quitar acción"
                              >
                                ×
                              </button>
                            </div>

                            {/* Avisar y sonar la alarma no le hacen nada a un
                                aparato: no piden objetivo. */}
                            {acc?.sinObjetivo ? (
                              <p className="mt-1 text-[10.5px] text-thread-2">
                                No mueve ningún aparato — solo avisa.
                              </p>
                            ) : (
                            <select
                              value={a.objetivo}
                              onChange={(e) => {
                                const nuevo = items.find((x) => x.id === e.target.value)
                                const ops = accionesDe(nuevo ? DEVICE_BY_ID[nuevo.deviceId] : null)
                                parcharAccion(c, i, {
                                  objetivo: e.target.value,
                                  accion: ops.includes(a.accion) ? a.accion : ops[0],
                                })
                              }}
                              className="mt-1 w-full rounded border border-line bg-ink px-1 py-0.5 text-[10.5px] text-cream"
                            >
                              {equipos.map((x) => (
                                <option key={x.id} value={x.id}>
                                  {nombreDe(x)}
                                </option>
                              ))}
                            </select>
                            )}

                            {/* El tiempo no se edita: lo pone el aparato. */}
                            <p className="mt-0.5 text-[10px] text-cream-3">
                              Tarda {seg < 1 ? `${Math.round(seg * 1000)} ms` : `${seg} s`} · lo que tarda de verdad
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <button onClick={() => quitar(c.id)} className="text-[10.5px] text-cream-3 hover:text-ember">
                    quitar este comportamiento
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-cream-3">
        Los tiempos salen del aparato, no de la animación. Lo que se ve aquí es lo que se programa el día de la
        puesta en marcha.
      </p>
    </Grupo>
  )
}
