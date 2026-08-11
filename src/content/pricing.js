import { DEVICES } from './catalog'

/**
 * Modelo de costos y datos fiscales.
 *
 * Todo lo que aquí es número está pensado para editarse: son tarifas de
 * arranque inferidas de cuánto tarda cada trabajo, no precios de lista
 * negociados. La regla al cambiarlos es una sola — que el costo salga de
 * horas reales de cuadrilla, no de un porcentaje sobre el equipo.
 */

/* ── mano de obra ─────────────────────────────────────────────── */

/**
 * Cuánto cuesta instalar UNA pieza, por dificultad.
 * Base: cuadrilla de dos (técnico + ayudante) a ~$650/hora con traslado
 * prorrateado. El nivel sale del tiempo que se lleva la pieza, no del
 * precio del aparato: una persiana barata se instala igual de lento que
 * una cara.
 */
export const LABOR_TIERS = {
  plug: { label: 'Enchufar', price: 120, mins: 10, hint: 'Se conecta y se empareja. Contactos, bocinas, hubs.' },
  simple: { label: 'Simple', price: 260, mins: 25, hint: 'Adherible o de rosca. Focos, sensores de pila, tiras.' },
  medio: { label: 'Medio', price: 520, mins: 50, hint: 'Abrir caja y cablear. Dimmers, botoneras, módulos.' },
  alto: { label: 'Alto', price: 1150, mins: 110, hint: 'Ajuste mecánico o cable nuevo. Persianas, cerraduras, cámaras.' },
  obra: { label: 'Con obra', price: 2200, mins: 210, hint: 'Requiere plomero, albañil o corte. Válvulas, empotrados.' },
}

/** Reglas por categoría; ganan sobre la inferencia por alimentación. */
const LABOR_BY_CAT = {
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

/* ── servicios ────────────────────────────────────────────────── */

export const RATES = {
  levantamientoBase: 1500, // hasta 150 m² y un nivel, zona metropolitana
  levantamientoM2: 8, // por m² arriba de 150
  levantamientoNivel: 450, // por cada nivel adicional
  levantamientoIncluidoM2: 150,

  puntoRed: 850, // cable Cat6, jack, ponchado, patch y prueba de certificación
  escena: 350, // diseño, programación y ajuste con el cliente presente
  entrenamiento: 1200, // sesión con toda la familia, incluida la persona que ayuda
  documentacion: 900, // planos as-built, credenciales y etiquetado del rack

  puestaEnMarchaPct: 0.06, // sobre el equipo: pruebas, firmware y afinación
  viaticoKm: 14, // fuera de zona metropolitana, ida y vuelta
  garantiaMeses: 12,

  iva: 0.16,
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
  const rates = { ...RATES, ...(survey.rates ?? {}) }

  // ── equipo, agrupado por dispositivo aunque esté en varios cuartos ──
  const counts = {}
  for (const room of survey.rooms ?? []) {
    for (const [id, qty] of Object.entries(room.items ?? {})) {
      if (qty > 0) counts[id] = (counts[id] ?? 0) + qty
    }
  }

  const equipo = []
  let laborTotal = 0
  const laborCount = {}

  for (const [id, qty] of Object.entries(counts)) {
    const d = DEVICES.find((x) => x.id === id)
    if (!d) continue
    const unit = unitPrice(d)
    equipo.push({
      id,
      concepto: `${d.name} — ${d.brand}`,
      clave: CLAVE_PROD_SERV[d.cat] ?? CLAVE_PROD_SERV.servicio,
      unidad: CLAVE_UNIDAD.pieza,
      qty,
      unit,
      importe: unit * qty,
      link: d.link,
      cat: d.cat,
    })

    const tier = laborTier(d)
    laborCount[tier] = (laborCount[tier] ?? 0) + qty
    laborTotal += LABOR_TIERS[tier].price * qty
  }

  equipo.sort((a, b) => b.importe - a.importe)

  // ── servicios ──
  const m2 = Number(survey.obra?.m2) || 0
  const niveles = Math.max(1, Number(survey.obra?.niveles) || 1)
  const extraM2 = Math.max(0, m2 - rates.levantamientoIncluidoM2)
  const levantamiento =
    rates.levantamientoBase + extraM2 * rates.levantamientoM2 + (niveles - 1) * rates.levantamientoNivel

  const puntosRed = Number(survey.extras?.puntosRed) || 0
  const escenas = Number(survey.extras?.escenas) || 0
  const km = Number(survey.extras?.km) || 0

  const equipoTotal = equipo.reduce((a, l) => a + l.importe, 0)
  const puestaEnMarcha = round(equipoTotal * rates.puestaEnMarchaPct)

  const servicios = [
    {
      concepto: `Levantamiento en sitio — ${m2 || '—'} m², ${niveles} nivel${niveles > 1 ? 'es' : ''}`,
      detalle: 'Mapa de calor por nivel, plano de dispositivos, revisión eléctrica y de neutro',
      qty: 1,
      unit: round(levantamiento),
      importe: round(levantamiento),
    },
    {
      concepto: 'Instalación y puesta en obra',
      detalle: Object.entries(laborCount)
        .map(([t, n]) => `${n} × ${LABOR_TIERS[t].label.toLowerCase()}`)
        .join(' · ') || 'Sin piezas todavía',
      qty: 1,
      unit: round(laborTotal),
      importe: round(laborTotal),
    },
  ]

  if (puntosRed > 0) {
    servicios.push({
      concepto: 'Puntos de red estructurada Cat6',
      detalle: 'Cable, jack, ponchado, patch panel y certificación por punto',
      qty: puntosRed,
      unit: rates.puntoRed,
      importe: puntosRed * rates.puntoRed,
    })
  }

  if (escenas > 0) {
    servicios.push({
      concepto: 'Diseño y programación de escenas',
      detalle: 'Incluye ajuste con el cliente presente y una revisión posterior',
      qty: escenas,
      unit: rates.escena,
      importe: escenas * rates.escena,
    })
  }

  servicios.push(
    {
      concepto: 'Puesta en marcha y afinación',
      detalle: 'Actualización de firmware, pruebas de cobertura y corrección de rutas',
      qty: 1,
      unit: puestaEnMarcha,
      importe: puestaEnMarcha,
    },
    {
      concepto: 'Entrenamiento y documentación',
      detalle: 'Sesión con la familia, planos as-built, credenciales y etiquetado del rack',
      qty: 1,
      unit: rates.entrenamiento + rates.documentacion,
      importe: rates.entrenamiento + rates.documentacion,
    },
  )

  if (km > 0) {
    servicios.push({
      concepto: 'Viáticos fuera de zona metropolitana',
      detalle: `${km} km ida y vuelta`,
      qty: km,
      unit: rates.viaticoKm,
      importe: km * rates.viaticoKm,
    })
  }

  const serviciosTotal = servicios.reduce((a, l) => a + l.importe, 0)
  const bruto = equipoTotal + serviciosTotal

  const descPct = Number(survey.extras?.descuentoPct) || 0
  const acredita = survey.extras?.acreditaLevantamiento ? round(levantamiento) : 0
  const descuento = round(bruto * (descPct / 100)) + acredita

  const subtotal = bruto - descuento
  const iva = round(subtotal * rates.iva)
  const total = subtotal + iva

  return {
    equipo,
    servicios,
    equipoTotal,
    serviciosTotal,
    laborCount,
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

