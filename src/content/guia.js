/**
 * La guía de tu casa, armada desde el levantamiento.
 *
 * El problema que resuelve: a los tres meses de instalada, media casa
 * inteligente se deja de usar. No porque falle — porque nadie se acuerda de
 * qué puede pedirle. El cliente se queda con la app y la app no le dice qué
 * hacer, le dice qué hay.
 *
 * Así que esto no es un manual del aparato: es una lista de LO QUE PUEDE
 * PEDIR, en su idioma, con la frase exacta que funciona en su bocina. Nada de
 * "el sensor de presencia FP2 soporta detección por zonas": dice "entra al
 * baño de noche y la luz se prende sola al 15 %, sin despertarte".
 *
 * Y se arma sola desde lo cotizado. Si mañana se le quita una cortina o se le
 * suma un sensor, la guía cambia sin que nadie la reescriba — que es la única
 * forma de que no quede vieja al mes.
 */

/* ── qué se puede pedir con cada cosa ─────────────────────────────
   Cada regla mira el equipo del espacio y devuelve lo que se vuelve posible.
   `pide` es lo que tiene que haber; `voz` son las frases que van a funcionar
   de verdad en HomePod o Echo. */

const R = (id, cuando, titulo, texto, extra = {}) => ({ id, cuando, titulo, texto, ...extra })

/** Categorías presentes en un espacio, para no repetir la cuenta. */
const cats = (equipo) => new Set(equipo.map((d) => d.cat))
const hayLuz = (equipo) => equipo.some((d) => d.luz)
const hay = (equipo, cat) => cats(equipo).has(cat)

export const REGLAS = [
  R(
    'luz-voz',
    (e) => hayLuz(e),
    'Prender y apagar sin levantarte',
    'Cualquier luz de este espacio responde por voz, desde el teléfono o desde el reloj. Sirve con las manos ocupadas, que es cuando de verdad se agradece.',
    { voz: ['Oye Siri, prende la luz de {espacio}', 'Alexa, apaga {espacio}'] },
  ),
  R(
    'luz-atenuar',
    (e) => e.some((d) => d.luz?.k),
    'Bajarle a la luz según la hora',
    'La misma lámpara sirve para leer y para ver una película: se le pide un porcentaje y un tono. De noche conviene ámbar y bajo — la luz fría a las once te quita el sueño de verdad, no es cuento.',
    { voz: ['Oye Siri, pon {espacio} al 20 por ciento', 'Alexa, pon la luz cálida'] },
  ),
  R(
    'escena-pelicula',
    (e) => hayLuz(e) && (hay(e, 'pantallas') || hay(e, 'av')),
    'Modo película con una frase',
    'Baja las luces, apaga lo que estorba y deja la tele lista. Es la escena que más se usa de todas las que se programan.',
    { voz: ['Oye Siri, modo película', 'Alexa, pon modo cine'] },
  ),
  R(
    'cortina',
    (e) => hay(e, 'cortinas'),
    'Las cortinas se abren solas en la mañana',
    'Programadas al amanecer, despiertas con luz de verdad en vez de con la alarma. Y por la tarde bajan para que no se caliente el cuarto.',
    { voz: ['Oye Siri, abre las cortinas', 'Alexa, cierra las cortinas'] },
  ),
  R(
    'presencia',
    (e) => e.some((d) => d.cat === 'sensores'),
    'La luz se prende cuando entras',
    'Y se apaga sola cuando el cuarto se queda vacío un rato. Es lo que más impresiona a las visitas y lo que más baja el recibo, porque nadie deja luces prendidas.',
  ),
  R(
    'camara',
    (e) => hay(e, 'camaras'),
    'Ver qué pasa desde donde estés',
    'Aviso al teléfono si se mueve algo cuando no hay nadie. Se puede pedir en la tele o en la pantalla de la cocina.',
    { voz: ['Alexa, muéstrame la cámara'] },
  ),
  R(
    'enchufe',
    (e) => hay(e, 'energia'),
    'Apagar lo que se queda prendido',
    'La plancha, la cafetera, el calentador. Se apagan por voz, por horario o al salir de casa — y se puede ver cuánta luz gasta cada uno.',
    { voz: ['Oye Siri, apaga la cafetera'] },
  ),
  R(
    'fuga',
    (e) => hay(e, 'agua'),
    'Te avisa de una fuga antes de que la veas',
    'El sensor va en el piso bajo el mueble húmedo. En departamento es lo que evita el problema caro: el agua que le llega al vecino de abajo.',
  ),
  R(
    'gas',
    (e) => e.some((d) => d.id?.startsWith('gas-')),
    'Aviso de gas al teléfono',
    'Si detecta una fuga suena y te avisa aunque no estés. Está puesto a ras de piso porque el gas LP es más pesado que el aire y se acumula abajo.',
  ),
  R(
    'nfc',
    (e) => e.some((d) => d.id === 'nfc-tags'),
    'Acercar el teléfono a una etiqueta',
    'Una calcomanía junto a la puerta o en el buró: le acercas el teléfono y cambia toda la casa de golpe. No necesita internet ni pila, y es el control que más se acaba usando.',
  ),
  R(
    'pantalla',
    (e) => hay(e, 'pantallas'),
    'La tele se prende con la escena',
    'Entra al modo película sin buscar tres controles. Y se apaga con el resto de la casa cuando dices buenas noches.',
  ),
]

/* ── rutinas de toda la casa ──────────────────────────────────── */

export const RUTINAS = [
  {
    id: 'buenas-noches',
    titulo: 'Buenas noches',
    texto: 'Apaga toda la casa, baja cortinas y deja encendida solo la luz de paso al baño, en ámbar bajo.',
    voz: ['Oye Siri, buenas noches', 'Alexa, buenas noches'],
    pide: (todo) => hayLuz(todo),
  },
  {
    id: 'salgo',
    titulo: 'Me voy',
    texto: 'Apaga todo, cierra cortinas y activa los avisos de las cámaras. Se puede disparar solo cuando el último teléfono sale de casa.',
    voz: ['Oye Siri, me voy', 'Alexa, salgo de casa'],
    pide: (todo) => todo.length > 0,
  },
  {
    id: 'llego',
    titulo: 'Ya llegué',
    texto: 'Prende la entrada y la sala al llegar de noche, para no entrar a oscuras buscando el apagador.',
    voz: ['Oye Siri, ya llegué'],
    pide: (todo) => hayLuz(todo),
  },
  {
    id: 'buenos-dias',
    titulo: 'Buenos días',
    texto: 'Sube cortinas, prende la cafetera y pone la luz fría, que es la que ayuda a despertar.',
    voz: ['Oye Siri, buenos días', 'Alexa, buenos días'],
    pide: (todo) => todo.some((d) => d.cat === 'cortinas' || d.cat === 'energia'),
  },
]

/* ── armar la guía ────────────────────────────────────────────── */

/**
 * @param rooms  [{ nombre, items: {deviceId: n} }]
 * @param cat    DEVICE_BY_ID
 */
export function armarGuia(rooms = [], cat = {}) {
  const espacios = []
  const todo = []

  for (const r of rooms) {
    const equipo = Object.entries(r.items ?? {})
      .filter(([, n]) => n > 0)
      .map(([id]) => cat[id])
      .filter(Boolean)
    if (equipo.length === 0) continue
    todo.push(...equipo)

    const puede = REGLAS.filter((x) => x.cuando(equipo)).map((x) => ({
      ...x,
      voz: (x.voz ?? []).map((v) => v.replace('{espacio}', r.nombre.toLowerCase())),
    }))
    if (puede.length) espacios.push({ nombre: r.nombre, puede, piezas: equipo.length })
  }

  const rutinas = RUTINAS.filter((x) => x.pide(todo))
  return { espacios, rutinas, piezas: todo.length }
}
