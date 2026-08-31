import { DEVICES } from './catalog'

/**
 * Modelo de costos y datos fiscales.
 *
 * Todo lo que aquí es número está pensado para editarse: son tarifas de
 * arranque inferidas de cuánto tarda cada trabajo, no precios de lista
 * negociados. La regla al cambiarlos es una sola — que el costo salga de
 * horas reales de cuadrilla, no de un porcentaje sobre el equipo.
 */

/* ── mano de obra y tarifas ──────────────────────────────────────
   Los números viven en rates.js (demo, versionado) y se pisan con
   rates.local.js si existe (real, en .gitignore). import.meta.glob no
   truena cuando el archivo no está: devuelve un objeto vacío. */
import { LABOR_TIERS as DEMO_LABOR, RATES as DEMO_RATES } from './rates'
import { acomodoDeCables, instalacionDelProyecto } from './instalacion'
import { MATERIAL_BY_ID, precioMaterial } from './materiales'

const overrides = import.meta.glob('./rates.local.js', { eager: true })
const local = Object.values(overrides)[0]

/** true cuando el panel corre con las tarifas inventadas. */
export const USING_DEMO_RATES = !local

export const LABOR_TIERS = { ...DEMO_LABOR, ...(local?.LABOR_TIERS ?? {}) }
export const RATES = { ...DEMO_RATES, ...(local?.RATES ?? {}) }

/** Reglas por categoría; ganan sobre la inferencia por alimentación. */
const LABOR_BY_CAT = {
  /* El material de acomodo no cobra mano de obra propia: se instala dentro del
     acomodo de cable, que ya se cobra por punto. */
  cableado: 'material',
  cortinas: 'alto',
  acceso: 'alto',
  camaras: 'alto',
  agua: 'obra',
  red: 'medio',
  hubs: 'plug',
  av: 'plug',
  electro: 'plug',
  mascotas: 'plug',
}

const LABOR_BY_POWER = {
  pila: 'simple',
  corriente: 'plug',
  poe: 'alto',
  cableado: 'medio',
}

/** Nivel de instalación de un dispositivo del catálogo. */
export function laborTier(device) {
  if (device.cat === 'iluminacion' && device.power === 'cableado') return 'medio'
  if (device.cat === 'control') return 'medio'
  if (device.cat === 'clima' && device.power === 'cableado') return 'alto'
  return LABOR_BY_CAT[device.cat] ?? LABOR_BY_POWER[device.power] ?? 'simple'
}

/** El levantamiento se descuenta del total si el cliente instala con nosotros. */
export const LEVANTAMIENTO_ACREDITABLE = true

/* ── datos fiscales ───────────────────────────────────────────
   Viven en content/fiscal.js para que la cotización pública pueda
   usarlos sin arrastrar el catálogo. Se reexportan por comodidad. */
export {
  EMISOR,
  REGIMENES,
  USOS_CFDI,
  FORMAS_PAGO,
  METODOS_PAGO,
  CLAVE_PROD_SERV,
  CLAVE_UNIDAD,
  enLetra,
} from './fiscal'

import { CLAVE_PROD_SERV, CLAVE_UNIDAD } from './fiscal'

/* ── cálculo ──────────────────────────────────────────────────── */

const round = (n) => Math.round(n)

/** Precio de referencia de un dispositivo: el punto medio del rango. */
export function unitPrice(device) {
  return round((device.price[0] + device.price[1]) / 2)
}

/**
 * Convierte un levantamiento en una cotización con todas sus partidas.
 * Devuelve las líneas ya listas para pintarse igual en el panel y en la
 * cotización pública: una sola fuente para los dos.
 */
export function quote(survey) {
  /* Tres capas, la más específica gana: la tarifa de arranque del código,
     la tarifa REAL del negocio (`estado.tarifas`, se corrige una vez y
     aplica a cualquier proyecto), y —solo por compatibilidad con lo que ya
     se había corregido antes de que existiera la capa del negocio— un
     ajuste de este proyecto en particular. */
  const rates = { ...RATES, ...(survey.tarifas?.rates ?? {}), ...(survey.rates ?? {}) }

  // ── equipo, agrupado por dispositivo aunque esté en varios cuartos ──
  const counts = {}
  for (const room of survey.rooms ?? []) {
    for (const [id, qty] of Object.entries(room.items ?? {})) {
      if (qty > 0) counts[id] = (counts[id] ?? 0) + qty
    }
  }

  const equipo = []

  for (const [id, qty] of Object.entries(counts)) {
    const d = DEVICES.find((x) => x.id === id)
    if (!d) continue
    /* El precio real es el que se corrigió en Compras —"lo compramos en tal
       tienda a tal precio"—, no el de catálogo. Gana la tarifa del negocio
       (aplica a todos los proyectos); si nadie la puso ahí pero un proyecto
       viejo trae su propio ajuste de cuando esa capa no existía, se usa
       ese. Si nadie tocó nada, cae al de catálogo. */
    const sobrescrito = survey.tarifas?.productos?.[id]?.precio ?? survey.compras?.productos?.[id]?.precio
    const unit = sobrescrito ?? unitPrice(d)
    /* El nombre y el modelo también se corrigen en Compras cuando lo que
       de verdad se instaló no es exactamente el genérico del catálogo —
       pasa seguido al sustituir por lo que hay con el proveedor. */
    const nombre = survey.tarifas?.productos?.[id]?.nombre || d.name
    const modelo = survey.tarifas?.productos?.[id]?.modelo
    equipo.push({
      id,
      concepto: `${nombre}${modelo ? ` (${modelo})` : ''} — ${d.brand}`,
      clave: CLAVE_PROD_SERV[d.cat] ?? CLAVE_PROD_SERV.servicio,
      unidad: CLAVE_UNIDAD.pieza,
      qty,
      unit,
      importe: unit * qty,
      link: d.link,
      cat: d.cat,
      editado: sobrescrito != null,
    })

  }

  /* La instalación se cobra por ESPACIO, no por pieza. Cobrar por pieza
     inflaba la cotización hasta volverla irreal —el sexto foco de una
     recámara no cuesta lo mismo que el primero— y además no es como se
     trabaja: el instalador llega a un cuarto y resuelve lo que haya en esa
     visita. */
  const inst = instalacionDelProyecto(survey.rooms ?? [])
  const laborTotal = inst.total

  equipo.sort((a, b) => b.importe - a.importe)

  // ── servicios ──
  const m2 = Number(survey.obra?.m2) || 0
  const niveles = Math.max(1, Number(survey.obra?.niveles) || 1)
  const extraM2 = Math.max(0, m2 - rates.levantamientoIncluidoM2)
  const levantamiento =
    rates.levantamientoBase + extraM2 * rates.levantamientoM2 + (niveles - 1) * rates.levantamientoNivel

  /* Acomodo de cables: se cuentan los aparatos a los que se les definió cable
     en el taller. Es la partida que casi nadie cotiza y todo mundo reclama
     cuando ve seis cables cruzando el zoclo de su recámara nueva. */
  const conCable = (survey.rooms ?? []).reduce(
    (a, r) => a + (r.plano?.items ?? []).filter((i) => i.cable).length,
    0,
  )
  const acomodo = acomodoDeCables(conCable, survey.extras?.acomodoCables ?? 'ninguno')

  const puntosRed = Number(survey.extras?.puntosRed) || 0
  const escenas = Number(survey.extras?.escenas) || 0
  const km = Number(survey.extras?.km) || 0

  const equipoTotal = equipo.reduce((a, l) => a + l.importe, 0)
  const puestaEnMarcha = round(equipoTotal * rates.puestaEnMarchaPct)

  /* Cada servicio se calcula con su fórmula de siempre, pero el número final
     se puede corregir por proyecto —la visita costó más porque había que
     subir tinacos, el acomodo de cables se negoció aparte, etc.—. Igual que
     el precio de un producto en Compras: el cálculo es el punto de partida,
     no la última palabra. `id` es la clave con la que se guarda esa
     corrección; sin ella no hay dónde amarrar el override. */
  const overridesServicios = survey.extras?.serviciosOverride ?? {}
  const conCosto = (id, linea) => {
    const sobrescrito = overridesServicios[id]
    if (sobrescrito == null) return { id, ...linea, editado: false }
    const qty = linea.qty || 1
    return { id, ...linea, unit: round(sobrescrito / qty), importe: round(sobrescrito), editado: true }
  }

  const servicios = [
    conCosto('levantamiento', {
      concepto: `Levantamiento en sitio — ${m2 || '—'} m², ${niveles} nivel${niveles > 1 ? 'es' : ''}`,
      detalle: 'Mapa de calor por nivel, plano de dispositivos, revisión eléctrica y de neutro',
      qty: 1,
      unit: round(levantamiento),
      importe: round(levantamiento),
    }),
    conCosto('instalacion', {
      concepto: `Instalación — ${inst.porEspacio.length} espacio${inst.porEspacio.length === 1 ? '' : 's'}`,
      detalle:
        inst.porEspacio.map((x) => `${x.room.nombre} $${round(x.total).toLocaleString('es-MX')}`).join(' · ') ||
        'Sin piezas todavía',
      qty: 1,
      unit: round(laborTotal),
      importe: round(laborTotal),
    }),
  ]

  if (acomodo.importe > 0 || overridesServicios.acomodo != null) {
    servicios.push(
      conCosto('acomodo', {
        concepto: `Acomodo de cables — ${acomodo.label.toLowerCase()}`,
        detalle: `${acomodo.porque} Se cobra por punto: ${acomodo.puntos} aparato${acomodo.puntos === 1 ? '' : 's'} con cable${acomodo.puntos < 3 ? ', con mínimo de 3' : ''}.`,
        qty: Math.max(acomodo.puntos, 3),
        unit: acomodo.precio,
        importe: acomodo.importe,
      }),
    )
  }

  if (puntosRed > 0) {
    servicios.push(
      conCosto('puntosRed', {
        concepto: 'Puntos de red estructurada Cat6',
        detalle: 'Cable, jack, ponchado, patch panel y certificación por punto',
        qty: puntosRed,
        unit: rates.puntoRed,
        importe: puntosRed * rates.puntoRed,
      }),
    )
  }

  if (escenas > 0) {
    servicios.push(
      conCosto('escenas', {
        concepto: 'Diseño y programación de escenas',
        detalle: 'Incluye ajuste con el cliente presente y una revisión posterior',
        qty: escenas,
        unit: rates.escena,
        importe: escenas * rates.escena,
      }),
    )
  }

  servicios.push(
    conCosto('puestaEnMarcha', {
      concepto: 'Puesta en marcha y afinación',
      detalle: 'Actualización de firmware, pruebas de cobertura y corrección de rutas',
      qty: 1,
      unit: puestaEnMarcha,
      importe: puestaEnMarcha,
    }),
    conCosto('entrenamiento', {
      concepto: 'Entrenamiento y documentación',
      detalle: 'Sesión con la familia, planos as-built, credenciales y etiquetado del rack',
      qty: 1,
      unit: rates.entrenamiento + rates.documentacion,
      importe: rates.entrenamiento + rates.documentacion,
    }),
  )

  if (km > 0) {
    servicios.push(
      conCosto('viaticos', {
        concepto: 'Viáticos fuera de zona metropolitana',
        detalle: `${km} km ida y vuelta`,
        qty: km,
        unit: rates.viaticoKm,
        importe: km * rates.viaticoKm,
      }),
    )
  }

  const serviciosTotal = servicios.reduce((a, l) => a + l.importe, 0)

  /* ── materiales e insumos ──
     La cantidad es del proyecto —cuánto cable hace falta aquí—; el precio
     por unidad es del negocio, igual que el de un producto: un metro de
     canaleta cuesta lo mismo en cualquier levantamiento. */
  const materiales = Object.entries(survey.materiales ?? {})
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      // del catálogo de arranque, o de uno personalizado dado de alta desde Compras
      const base = MATERIAL_BY_ID[id]
      const propio = survey.tarifas?.materiales?.[id]
      const concepto = base?.nombre ?? propio?.nombre
      if (!concepto) return null
      const unidad = base?.unidad ?? propio?.unidad ?? 'pza'
      const detalle = base?.detalle ?? propio?.detalle ?? ''
      const unit = precioMaterial(id, survey.tarifas)
      return { id, concepto, unidad, detalle, qty, unit, importe: unit * qty }
    })
    .filter(Boolean)
    .sort((a, b) => b.importe - a.importe)

  const materialesTotal = materiales.reduce((a, l) => a + l.importe, 0)

  const bruto = equipoTotal + serviciosTotal + materialesTotal

  const descPct = Number(survey.extras?.descuentoPct) || 0
  const acredita = survey.extras?.acreditaLevantamiento ? round(levantamiento) : 0
  const descuento = round(bruto * (descPct / 100)) + acredita

  const subtotal = bruto - descuento
  const iva = round(subtotal * rates.iva)
  const total = subtotal + iva

  return {
    equipo,
    servicios,
    materiales,
    equipoTotal,
    serviciosTotal,
    materialesTotal,
    /* El desglose de instalación ahora es por espacio, no un conteo de piezas
       por dificultad. Quien lo pinte tiene el detalle aquí. */
    instalacion: inst,
    bruto,
    descuento,
    descPct,
    acredita,
    subtotal,
    iva,
    total,
    piezas: Object.values(counts).reduce((a, b) => a + b, 0),
  }
}

/**
 * Diagnóstico de red del levantamiento.
 *
 * Es la revisión que evita la llamada de soporte tres semanas después:
 * ¿hay border router?, ¿hay suficientes nodos enchufados para que la malla
 * se sostenga?, ¿alcanzan los access points para los metros y los niveles?
 */
export function networkCheck(survey) {
  const counts = {}
  for (const room of survey.rooms ?? []) {
    for (const [id, qty] of Object.entries(room.items ?? {})) {
      if (qty > 0) counts[id] = (counts[id] ?? 0) + qty
    }
  }

  const byLink = {}
  let repetidores = 0
  let dePila = 0
  let borderRouters = 0
  let aps = 0

  for (const [id, qty] of Object.entries(counts)) {
    const d = DEVICES.find((x) => x.id === id)
    if (!d) continue
    byLink[d.link] = (byLink[d.link] ?? 0) + qty
    // solo lo enchufado repite malla; lo de pila nunca enruta
    if (d.power === 'pila') dePila += qty
    else if (d.link === 'thread' || d.link === 'zigbee') repetidores += qty
    if (d.cat === 'hubs' && (d.link === 'thread' || d.link === 'cable')) borderRouters += qty
    if (d.cat === 'red' && d.link === 'poe') aps += qty
  }

  const m2 = Number(survey.obra?.m2) || 0
  const niveles = Math.max(1, Number(survey.obra?.niveles) || 1)
  // regla de dedo: un AP por cada ~90 m² y mínimo uno por nivel
  const apsSugeridos = Math.max(niveles, Math.ceil(m2 / 90))

  const alerts = []
  if (borderRouters === 0 && (byLink.thread ?? 0) > 0) {
    alerts.push({ level: 'error', text: 'Hay dispositivos Thread pero ningún border router. Sin él, la malla no existe.' })
  }
  if (dePila > repetidores * 3 && dePila > 3) {
    alerts.push({
      level: 'warn',
      text: `${dePila} dispositivos de pila contra ${repetidores} repetidores. Agrega nodos enchufados o la malla va a tener huecos.`,
    })
  }
  if (aps < apsSugeridos) {
    alerts.push({
      level: 'warn',
      text: `Para ${m2 || '—'} m² en ${niveles} nivel${niveles > 1 ? 'es' : ''} sugerimos ${apsSugeridos} access point${apsSugeridos > 1 ? 's' : ''}; van ${aps}.`,
    })
  }
  if ((byLink.wifi ?? 0) + (byLink.matter ?? 0) > 18) {
    alerts.push({
      level: 'warn',
      text: 'Más de 18 dispositivos en WiFi. Conviene VLAN de IoT y revisar el límite de clientes del AP.',
    })
  }
  if (alerts.length === 0 && Object.keys(counts).length > 0) {
    alerts.push({ level: 'ok', text: 'La topología se sostiene: hay border router, repetidores suficientes y cobertura acorde a los metros.' })
  }

  return { byLink, repetidores, dePila, borderRouters, aps, apsSugeridos, alerts }
}

