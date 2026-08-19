import { DEVICE_BY_ID } from '../../../content/catalog'

/**
 * Las ambientaciones de un espacio.
 *
 * No son una lista fija: se calculan con lo que de verdad quedó levantado. Si
 * el cuarto no tiene cortina, "modo película" no baja ninguna cortina — y si
 * no tiene nada atenuable, la escena ni se ofrece. Proponerle al cliente una
 * escena que su casa no puede hacer es la manera más rápida de perder su
 * confianza en la demostración.
 *
 * Cada una trae su frase de voz porque así es como se van a usar: nadie abre
 * la app para poner modo película. Y trae lo que el asistente contesta, que
 * es lo que se enseña en la junta.
 */

/* "prende habitación" no lo dice nadie. La lista es corta a propósito: son
   los espacios masculinos que salen en un levantamiento, y el resto cae en
   "la", que es lo que acierta la mayoría de las veces. */
const MASCULINOS = /^(ba[ñn]o|estudio|comedor|recibidor|patio|garaje|cuarto|pasillo|despacho|taller|jard[ií]n|balc[oó]n|desayunador|vest[ií]bulo|closet|cl[oó]set|s[oó]tano)\b/i

function conArticulo(nombre) {
  const n = (nombre || 'sala').trim()
  if (!n) return 'la sala'
  return `${MASCULINOS.test(n) ? 'el' : 'la'} ${n.toLowerCase()}`
}

const luces = (items) => items.filter((i) => i.clase === 'equipo' && i.params)
const deCat = (items, cat) => items.filter((i) => DEVICE_BY_ID[i.deviceId]?.cat === cat)

/** Acciones sobre un grupo, con el mismo formato que ya entiende el simulador. */
const nivel = (lista, pct) => lista.map((i) => ({ objetivo: i.id, accion: 'atenuar', valor: pct }))
const tono = (lista, k) => lista.map((i) => ({ objetivo: i.id, accion: 'tono', valor: k }))
const abrir = (lista, pct) => lista.map((i) => ({ objetivo: i.id, accion: 'abrir', valor: pct }))
const apagar = (lista) => lista.map((i) => ({ objetivo: i.id, accion: 'apagar', valor: null }))

/**
 * @param items  las piezas del plano
 * @returns [{ id, nombre, porque, voz, dice, entonces }]
 */
export function escenasDe(items = [], espacio = 'la sala') {
  /* El nombre del espacio entra en la frase porque así se dice en la casa:
     nadie dice "prende la sala" parado en su recámara. Con el nombre fijo, la
     demostración enseñaba un comando que el cliente no va a usar nunca. */
  const donde = conArticulo(espacio)
  const L = luces(items)
  const cortinas = deCat(items, 'cortinas')
  const pantallas = deCat(items, 'pantallas')
  const audio = deCat(items, 'av')
  const out = []

  if (L.length === 0 && cortinas.length === 0) return out

  if (L.length > 0) {
    out.push({
      id: 'brillante',
      nombre: 'Todo encendido',
      porque: 'Para limpiar, buscar algo o cuando llega gente.',
      voz: `Oye Siri, prende ${donde}`,
      dice: 'Listo, encendí todo.',
      entonces: [...nivel(L, 100), ...tono(L, 4000), ...abrir(cortinas, 100)],
    })

    out.push({
      id: 'estar',
      nombre: 'Estar',
      porque: 'El día a día: luz suficiente para platicar sin sentirse en un consultorio.',
      voz: `Oye Siri, luz de ${donde}`,
      dice: 'Va, luz de estar.',
      entonces: [...nivel(L, 65), ...tono(L, 3000)],
    })
  }

  if (L.length > 0 && (pantallas.length > 0 || audio.length > 0)) {
    out.push({
      id: 'pelicula',
      nombre: 'Modo película',
      porque: 'La que más se usa de todas las que se programan.',
      voz: 'Oye Siri, modo película',
      dice: 'Bajando luces y cerrando cortinas.',
      entonces: [
        ...nivel(L, 15),
        ...tono(L, 2200),
        ...abrir(cortinas, 0),
        ...pantallas.map((i) => ({ objetivo: i.id, accion: 'encender', valor: null })),
      ],
    })
  }

  if (L.length > 0) {
    out.push({
      id: 'lectura',
      nombre: 'Leer',
      porque: 'Luz alta y neutra donde se lee, baja en el resto.',
      voz: 'Oye Siri, quiero leer',
      dice: 'Luz de lectura.',
      entonces: [...nivel(L, 85), ...tono(L, 4500)],
    })

    out.push({
      id: 'noche',
      nombre: 'Buenas noches',
      porque: 'Apaga todo y deja la casa lista para dormir.',
      voz: 'Oye Siri, buenas noches',
      dice: 'Buenas noches. Apagué la sala.',
      entonces: [...apagar(L), ...abrir(cortinas, 0), ...apagar(pantallas)],
    })
  }

  /* Con sensores de presencia la casa deja de pedir órdenes y empieza a
     anticiparse — que es el salto que el cliente no ve venir hasta que lo
     vive. Y con paneles hay una escena que no es funcional sino de enseñar:
     la que se prende cuando llega visita. */
  const sensores = deCat(items, 'sensores')
  const paneles = items.filter((i) => i.params?.forma === 'panel')

  if (sensores.length > 0 && L.length > 0) {
    out.push({
      id: 'paso',
      nombre: 'Luz de paso',
      porque: 'De noche el sensor prende al 10 % y en ámbar. Alcanza para no tropezar y no te despierta.',
      voz: 'Oye Siri, luz de paso',
      dice: 'Listo, luz de paso.',
      entonces: [...nivel(L, 10), ...tono(L, 2200)],
    })
  }

  if (paneles.length > 0) {
    out.push({
      id: 'fiesta',
      nombre: 'Los paneles',
      porque: 'Apaga lo demás y deja solo la figura de la pared. Es la escena que se fotografía.',
      voz: 'Oye Siri, pon los paneles',
      dice: 'Va, solo los paneles.',
      entonces: [
        ...nivel(L.filter((i) => !paneles.includes(i)), 0),
        ...nivel(paneles, 100),
        ...tono(paneles, 2700),
      ],
    })
  }

  if (cortinas.length > 0) {
    out.push({
      id: 'amanecer',
      nombre: 'Abrir el día',
      porque: 'Las cortinas suben y entra luz de verdad. Tarda lo que tarda el motor.',
      voz: 'Oye Siri, abre las cortinas',
      dice: 'Abriendo cortinas.',
      entonces: [...abrir(cortinas, 100), ...nivel(L, 0)],
    })
  }

  return out
}
