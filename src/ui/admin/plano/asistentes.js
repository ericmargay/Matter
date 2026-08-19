import { DEVICE_BY_ID } from '../../../content/catalog'

/**
 * Qué asistente vive en este espacio y hasta dónde llega.
 *
 * La pregunta no es retórica. En esta recámara hay un Apple TV y un Echo Spot,
 * o sea Siri y Alexa al mismo tiempo, y no controlan lo mismo: los sensores
 * Onvis y el atenuador Eve son de HomeKit y Alexa no los ve; el enchufe de
 * Amazon es de Alexa y Siri no lo ve. Enseñarle al cliente una lista de
 * comandos sin decirle cuál asistente los puede correr es prometer algo que
 * no va a pasar en su casa, y se descubre el primer día.
 *
 * Por eso el alcance se calcula, no se declara: sale del campo `eco` de cada
 * aparato del catálogo, que es el mismo dato con el que se cotiza.
 */

export const ASISTENTES = {
  apple: {
    id: 'apple',
    nombre: 'Siri',
    casa: 'Apple Home',
    invocar: 'Oye Siri',
    responde: 'Listo',
    glifo: 'orbe',
    /* Un Apple TV o un HomePod: sin uno de ellos en la casa, Siri no puede
       correr nada cuando no estás — no hay quién ejecute. */
    cuna: (d) => d.eco?.length === 1 && d.eco[0] === 'apple' && (d.cat === 'hubs' || d.cat === 'av'),
  },
  alexa: {
    id: 'alexa',
    nombre: 'Alexa',
    casa: 'Alexa',
    invocar: 'Alexa',
    responde: 'Ok',
    glifo: 'anillo',
    cuna: (d) => d.eco?.length === 1 && d.eco[0] === 'alexa' && (d.cat === 'hubs' || d.cat === 'av'),
  },
  google: {
    id: 'google',
    nombre: 'Google',
    casa: 'Google Home',
    invocar: 'Oye Google',
    responde: 'Listo',
    glifo: 'puntos',
    cuna: (d) => d.eco?.length === 1 && d.eco[0] === 'google' && (d.cat === 'hubs' || d.cat === 'av'),
  },
}

const dev = (i) => DEVICE_BY_ID[i.deviceId]

/** Los asistentes que de verdad hay levantados aquí. */
export function asistentesDe(items = []) {
  const hay = new Set()
  for (const i of items) {
    const d = dev(i)
    if (!d) continue
    for (const a of Object.values(ASISTENTES)) if (a.cuna(d)) hay.add(a.id)
  }
  return [...hay].map((id) => ASISTENTES[id])
}

/* Dos cosas distintas y hay que separarlas. A un foco o a una cortina se les
   PIDE algo: son órdenes de voz. A un sensor de movimiento no se le pide nada
   —nunca nadie dijo "Alexa, detecta movimiento"— pero es lo que dispara las
   automatizaciones. Un asistente puede alcanzar lo primero y no lo segundo, y
   la conversación con el cliente cambia por completo según cuál falte. */
const SE_MANDA = new Set(['iluminacion', 'cortinas', 'energia', 'clima', 'acceso', 'agua', 'av', 'pantallas'])
const AUTOMATIZA = new Set(['sensores', 'control'])

const cuenta = (d) => d && (SE_MANDA.has(d.cat) || AUTOMATIZA.has(d.cat))

/**
 * Hasta dónde llega un asistente en este espacio.
 *
 * `eco` dice con qué casas habla cada aparato: uno Matter las trae todas, uno
 * de HomeKit trae solo `apple`. La red y los hubs no entran —nadie le pide
 * nada a un nodo de malla— y por eso no cuentan ni a favor ni en contra.
 */
export function alcanceDe(asistente, items = []) {
  const manda = []
  const automatiza = []
  const fuera = []

  for (const i of items) {
    const d = dev(i)
    if (!cuenta(d)) continue
    const alcanza = d.eco?.includes(asistente.id)
    if (!alcanza) fuera.push({ item: i, device: d })
    else if (SE_MANDA.has(d.cat)) manda.push({ item: i, device: d })
    else automatiza.push({ item: i, device: d })
  }

  return { manda, automatiza, fuera, total: manda.length + automatiza.length + fuera.length }
}

/** El id de cada aparato al que este asistente sí le puede pedir algo. */
export const idsQueManda = (asistente, items) =>
  new Set(alcanceDe(asistente, items).manda.map((x) => x.item.id))

/**
 * Por qué un aparato se le queda fuera, dicho como se le dice al cliente.
 *
 * Importa que sea una frase y no un "no compatible": lo que decide si se
 * cambia el aparato o se cambia de asistente es el motivo, no el veredicto.
 */
export function porQueFuera(device, asistente) {
  const casas = (device.eco ?? []).map((e) => ASISTENTES[e]?.casa ?? e).filter(Boolean)
  if (casas.length === 0) return `no entra a ningún asistente por voz`
  return `es de ${casas.join(' y ')}; ${asistente.nombre} no lo ve`
}

/** Aparatos repetidos, contados. Cuatro focos iguales son una línea, no cuatro. */
export function agrupar(lista) {
  const m = new Map()
  for (const x of lista) {
    const k = x.device.id
    m.set(k, { device: x.device, n: (m.get(k)?.n ?? 0) + 1 })
  }
  return [...m.values()]
}
