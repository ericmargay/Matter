/**
 * El recorrido de la casa: una historia por espacio.
 *
 * El orden y la cantidad tienen que empatar con KEYFRAMES en
 * scene/chapters.js — cada capítulo necesita su posición de cámara.
 *
 * `room` liga el capítulo con un cuarto de scene/layout.js. Los capítulos
 * sin `room` (exterior, corte, red) son de transición y no llevan controles.
 */
export const chapters = [
  {
    id: 'exterior',
    eyebrow: 'Antes de entrar',
    title: 'La casa te ve llegar',
    body: 'Son las 9:40. El sensor de la calle ya encendió el arbotante al 30% y la cámara distinguió que el coche que se acerca es el tuyo, no el del vecino.',
    devices: ['Sensor exterior', 'Cámara con detección', 'Arbotante al 30%', 'Horarios por astro'],
  },
  {
    id: 'llegada',
    room: 'garage',
    eyebrow: 'La llegada',
    title: 'El portón sube antes de que frenes',
    body: 'Tu teléfono cruza la geocerca y basta una frase. Nada de control remoto que se pierde ni clave que se le olvida a alguien.',
    devices: ['Portón Matter', 'Geocerca', 'Apertura por voz'],
  },
  {
    id: 'garage',
    room: 'garage',
    eyebrow: 'El garage',
    title: 'La luz ya estaba encendida',
    body: 'El sensor de presencia prende antes de que abras la puerta del coche, y apaga tres minutos después de que entras a la casa. Nunca lo tocas.',
    devices: ['Sensor de presencia', 'Luz con apagado por tiempo', 'Contacto del portón'],
  },
  {
    id: 'recibidor',
    room: 'recibidor',
    eyebrow: 'El recibidor',
    title: 'Un tag de 40 pesos y se acabó',
    body: 'Llegas con las manos ocupadas. Acercas el teléfono a la consola y corre la escena completa: luz al 40%, clima a 23° y alarma desarmada.',
    devices: ['Chapa NFC', 'Sensor de presencia', 'Desarme de alarma', 'Botonera de escenas'],
  },
  {
    id: 'corte',
    eyebrow: 'El levantamiento',
    title: 'Dos plantas, un solo sistema',
    body: 'Antes de cotizar levantamos los dos niveles: mapa de calor por piso, muros contados y revisión de qué apagadores tienen neutro. La escalera es donde se cae la señal en casi todas las casas de dos pisos.',
    devices: ['Mapa por nivel', 'Plano de dispositivos', 'Revisión eléctrica', 'Puntos de red'],
  },
  {
    id: 'sala',
    room: 'sala',
    eyebrow: 'Sala',
    title: 'Una escena, no catorce switches',
    body: 'Ver película baja las persianas, apaga el plafón, deja la lámpara de piso al 15% en tono ámbar y prende la barra de sonido en la entrada correcta. Un botón físico en la pared, porque las visitas no se van a bajar tu app.',
    devices: ['Dimmer con neutro', 'Persiana motorizada', 'Botonera de escenas', 'Audio multiroom'],
  },
  {
    id: 'cocina',
    room: 'cocina',
    eyebrow: 'Cocina',
    title: 'La que más se usa y la peor iluminada',
    body: 'Tira LED bajo gabinete con sensor de movimiento a 2700K en la noche y 4000K de día. Sensor de fuga bajo la tarja que cierra la llave de paso. Y el foco sobre la isla que baja solo cuando pones la mesa.',
    devices: ['LED bajo gabinete', 'Sensor de fuga', 'Válvula de corte', 'Temperatura de color'],
  },
  {
    id: 'bano',
    room: 'bano',
    eyebrow: 'Medio baño',
    title: 'El cuarto donde nadie quiere buscar el apagador',
    body: 'De día entra al 100%. Después de medianoche, el mismo sensor lo enciende al 5% en ámbar, sin deslumbrar. El extractor arranca solo con la humedad y se queda ocho minutos más después de que sales, que es lo que evita el moho en la esquina del plafón.',
    devices: ['Sensor con horario', 'Luz nocturna al 5%', 'Extractor por humedad', 'Apagado por vacío'],
  },
  {
    id: 'recamara',
    room: 'recamara',
    eyebrow: 'Recámara',
    title: 'Despertar sin alarma',
    body: 'Veinte minutos antes de tu hora, la luz sube de 1% a 60% simulando amanecer y la persiana se abre a la mitad. En la noche, un sensor bajo la cama enciende una guía de piso al 3% cuando te paras. No despierta a nadie.',
    devices: ['Amanecer simulado', 'Persiana con horario', 'Luz de piso nocturna', 'Sensor de cama'],
  },
  {
    id: 'banoP',
    room: 'banoP',
    eyebrow: 'Baño principal',
    title: 'Espejo, vapor y piso tibio',
    body: 'El espejo se enciende con luz neutra a 4000K para maquillarse y rasurarse — la única parte de la casa donde la luz cálida es un error. El extractor lee humedad real, no un timer. Y el piso radiante arranca a las 6:10 para que a las 6:30 ya esté tibio.',
    devices: ['Espejo retroiluminado', 'Sensor de humedad', 'Piso radiante', 'Luz nocturna'],
  },
  {
    id: 'estudio',
    room: 'estudio',
    eyebrow: 'Estudio',
    title: 'Que la casa sepa que estás en junta',
    body: 'Cuando tu cámara se enciende, un foco afuera del cuarto se pone rojo, el timbre pasa a silencio y las notificaciones del piso se pausan. Se acabó el "perdón, están tocando".',
    devices: ['Estado en junta', 'Timbre silenciado', 'Luz indicadora', 'UPS para el rack'],
  },
  {
    id: 'balcon',
    room: 'balcon',
    eyebrow: 'Balcón',
    title: 'Nube come a sus horas aunque no estés',
    body: 'El alimentador tira su ración a las 8:00 y a las 19:00, y te avisa si la tolva se está acabando. Si te agarra el tráfico, lo activas desde donde estés. La puerta corrediza tiene sensor: si alguien la deja abierta más de cinco minutos, el aire se apaga solo.',
    devices: ['Alimentador Matter', 'Sensor de puerta', 'Cámara con audio', 'Riego de macetas'],
  },
  {
    id: 'red',
    eyebrow: 'Lo que nadie te muestra',
    title: 'Abajo de todo hay una red',
    body: 'Cada foco es un nodo. Los que están conectados a corriente repiten la señal y forman una malla Thread que se cura sola: si un nodo cae, la ruta se recalcula en milisegundos. En una casa de dos pisos esto no es un lujo: es lo único que hace que la recámara responda igual de rápido que la sala.',
    devices: ['Border router', 'Malla Thread', 'VLAN de IoT', 'Access points por nivel'],
  },
]

/** Palabra de activación según el cerebro elegido. */
export const wakeWords = {
  apple: 'Oye Siri',
  google: 'Hey Google',
  alexa: 'Alexa',
  ha: 'Asistente',
}

/**
 * Comandos de voz por capítulo.
 *
 * `action` la resuelve el store: casi todas corren una escena del cuarto,
 * y las dos especiales (portón y alimentador) mueven cosas de la escena 3D.
 */
export const assistant = {
  1: {
    command: 'abre el garage',
    action: { type: 'garage' },
    reply: 'Abriendo el portón. Prendí la luz del garage.',
  },
  3: {
    command: 'llegué a casa',
    action: { type: 'scene', room: 'recibidor', scene: 'llegue' },
    reply: 'Bienvenido. Desarmé la alarma y dejé la entrada al 40%.',
  },
  5: {
    command: 'pon una película',
    action: { type: 'scene', room: 'sala', scene: 'cine' },
    reply: 'Listo. Bajé las persianas y encendí la pantalla.',
  },
  6: {
    command: 'voy a cocinar',
    action: { type: 'scene', room: 'cocina', scene: 'cocinar' },
    reply: 'Cocina al 95% en 4000K. La campana también está encendida.',
  },
  7: {
    command: 'modo noche en el baño',
    action: { type: 'scene', room: 'bano', scene: 'noche' },
    reply: 'Luz al 5% en ámbar. No va a deslumbrar a nadie.',
  },
  8: {
    command: 'buenas noches',
    action: { type: 'scene', room: 'recamara', scene: 'noche' },
    reply: 'Buenas noches. Cerré la persiana y dejé la guía de piso lista.',
  },
  9: {
    command: 'enciende el espejo',
    action: { type: 'scene', room: 'banoP', scene: 'espejo' },
    reply: 'Espejo en 4000K y extractor encendido.',
  },
  10: {
    command: 'estoy en junta',
    action: { type: 'scene', room: 'estudio', scene: 'junta' },
    reply: 'Puse la luz de junta en rojo y silencié el timbre.',
  },
  11: {
    command: 'dale de comer a Nube',
    action: { type: 'feed' },
    reply: 'Servida su ración. Quedan once en la tolva.',
  },
}

/**
 * Centro de control por cuarto.
 *
 * Cada escena manda varios dispositivos a la vez: ese es justamente el
 * argumento de venta. Una escena que solo prende un foco no convence a nadie.
 * `set` se aplica tal cual sobre el estado del cuarto en el store.
 */
export const roomControls = {
  recibidor: {
    chapter: 3,
    label: 'Recibidor',
    scenes: [
      { id: 'llegue', name: 'Llegué', icon: 'sofa', set: { level: 0.42, warmth: 0.9 } },
      { id: 'salgo', name: 'Salgo', icon: 'power', set: { level: 0, warmth: 0.9 } },
      { id: 'visitas', name: 'Visitas', icon: 'dinner', set: { level: 0.85, warmth: 0.75 } },
      { id: 'noche', name: 'Noche', icon: 'moon', set: { level: 0.08, warmth: 1 } },
    ],
    sliders: [
      { key: 'level', icon: 'brightness', label: 'Brillo' },
      { key: 'warmth', icon: 'temp', label: 'Tono' },
    ],
    toggles: [],
  },
  sala: {
    chapter: 5,
    label: 'Sala',
    scenes: [
      { id: 'estar', name: 'Estar', icon: 'sofa', set: { level: 0.68, warmth: 0.85, tv: false, blinds: 0.35 } },
      { id: 'cine', name: 'Cine', icon: 'film', set: { level: 0.12, warmth: 1, tv: true, blinds: 0 } },
      { id: 'lectura', name: 'Lectura', icon: 'book', set: { level: 0.62, warmth: 0.55, tv: false, blinds: 0.2 } },
      { id: 'salir', name: 'Salir', icon: 'power', set: { level: 0, warmth: 0.85, tv: false, blinds: 0 } },
    ],
    sliders: [
      { key: 'level', icon: 'brightness', label: 'Brillo' },
      { key: 'warmth', icon: 'temp', label: 'Tono' },
      { key: 'blinds', icon: 'blinds', label: 'Persiana' },
    ],
    toggles: [{ key: 'tv', icon: 'tv', label: 'Pantalla' }],
  },
  cocina: {
    chapter: 6,
    label: 'Cocina',
    scenes: [
      { id: 'cocinar', name: 'Cocinar', icon: 'pot', set: { level: 0.95, warmth: 0.15 } },
      { id: 'cena', name: 'Cena', icon: 'dinner', set: { level: 0.45, warmth: 0.95 } },
      { id: 'noche', name: 'Noche', icon: 'moon', set: { level: 0.12, warmth: 1 } },
      { id: 'salir', name: 'Apagar', icon: 'power', set: { level: 0, warmth: 0.6 } },
    ],
    sliders: [
      { key: 'level', icon: 'brightness', label: 'Brillo' },
      { key: 'warmth', icon: 'temp', label: 'Tono' },
    ],
    toggles: [],
  },
  bano: {
    chapter: 7,
    label: 'Medio baño',
    scenes: [
      { id: 'dia', name: 'Día', icon: 'brightness', set: { level: 1, warmth: 0.3, fan: false } },
      { id: 'noche', name: 'Noche', icon: 'moon', set: { level: 0.05, warmth: 1, fan: false } },
      { id: 'extractor', name: 'Extractor', icon: 'blinds', set: { level: 0.8, warmth: 0.4, fan: true } },
      { id: 'off', name: 'Apagar', icon: 'power', set: { level: 0, warmth: 0.6, fan: false } },
    ],
    sliders: [
      { key: 'level', icon: 'brightness', label: 'Brillo' },
      { key: 'warmth', icon: 'temp', label: 'Tono' },
    ],
    toggles: [{ key: 'fan', icon: 'blinds', label: 'Extractor' }],
  },
  recamara: {
    chapter: 8,
    label: 'Recámara',
    scenes: [
      { id: 'despertar', name: 'Despertar', icon: 'sunrise', set: { level: 0.72, warmth: 0.55, blinds: 0.75 } },
      { id: 'leer', name: 'Leer', icon: 'book', set: { level: 0.5, warmth: 0.9, blinds: 0.15 } },
      { id: 'noche', name: 'Dormir', icon: 'bed', set: { level: 0.06, warmth: 1, blinds: 0 } },
      { id: 'salir', name: 'Apagar', icon: 'power', set: { level: 0, warmth: 1, blinds: 0 } },
    ],
    sliders: [
      { key: 'level', icon: 'brightness', label: 'Brillo' },
      { key: 'warmth', icon: 'temp', label: 'Tono' },
      { key: 'blinds', icon: 'blinds', label: 'Persiana' },
    ],
    toggles: [],
  },
  banoP: {
    chapter: 9,
    label: 'Baño principal',
    scenes: [
      { id: 'espejo', name: 'Espejo', icon: 'brightness', set: { level: 0.95, warmth: 0.2, fan: true } },
      { id: 'ducha', name: 'Ducha', icon: 'pot', set: { level: 0.7, warmth: 0.7, fan: true } },
      { id: 'noche', name: 'Noche', icon: 'moon', set: { level: 0.06, warmth: 1, fan: false } },
      { id: 'off', name: 'Apagar', icon: 'power', set: { level: 0, warmth: 0.5, fan: false } },
    ],
    sliders: [
      { key: 'level', icon: 'brightness', label: 'Brillo' },
      { key: 'warmth', icon: 'temp', label: 'Tono' },
    ],
    toggles: [{ key: 'fan', icon: 'blinds', label: 'Extractor' }],
  },
  estudio: {
    chapter: 10,
    label: 'Estudio',
    scenes: [
      { id: 'trabajo', name: 'Trabajo', icon: 'work', set: { level: 0.88, warmth: 0.35, busy: false } },
      { id: 'junta', name: 'En junta', icon: 'meeting', set: { level: 0.7, warmth: 0.45, busy: true } },
      { id: 'noche', name: 'Noche', icon: 'moon', set: { level: 0.3, warmth: 0.95, busy: false } },
      { id: 'salir', name: 'Apagar', icon: 'power', set: { level: 0, warmth: 0.5, busy: false } },
    ],
    sliders: [
      { key: 'level', icon: 'brightness', label: 'Brillo' },
      { key: 'warmth', icon: 'temp', label: 'Tono' },
    ],
    toggles: [{ key: 'busy', icon: 'meeting', label: 'En junta' }],
  },
  balcon: {
    chapter: 11,
    label: 'Balcón',
    scenes: [
      { id: 'tarde', name: 'Tarde', icon: 'sunrise', set: { level: 0.3, warmth: 0.9 } },
      { id: 'cena', name: 'Cena', icon: 'dinner', set: { level: 0.7, warmth: 1 } },
      { id: 'noche', name: 'Noche', icon: 'moon', set: { level: 0.15, warmth: 1 } },
      { id: 'off', name: 'Apagar', icon: 'power', set: { level: 0, warmth: 1 } },
    ],
    sliders: [
      { key: 'level', icon: 'brightness', label: 'Brillo' },
      { key: 'warmth', icon: 'temp', label: 'Tono' },
    ],
    toggles: [{ key: 'feeder', icon: 'pot', label: 'Alimentador' }],
  },
}
