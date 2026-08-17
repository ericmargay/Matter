/**
 * Qué espacios tiene cada tipo de propiedad, y con qué nacen.
 *
 * El levantamiento se hace caminando, y caminando uno no piensa "voy a crear
 * un cuarto genérico": piensa "aquí está la cocina". Por eso la lista se
 * ofrece hecha y por tipo de propiedad — en una oficina nadie va a levantar
 * una recámara, y ofrecérsela es ruido.
 *
 * Cada espacio trae `equipo`: lo que normalmente lleva ese espacio. No es un
 * paquete cerrado ni una venta sugerida, es el punto de partida del que se
 * quita y se agrega. Sale de la experiencia de qué se instala de verdad:
 * un baño lleva sensor de humedad porque el extractor por timer no sirve, una
 * cocina lleva sensor de fuga porque es el dispositivo con mejor retorno de
 * toda la casa.
 *
 * `tipo` es el que usa el plano 3D para amueblar y para juzgar los lux.
 */

/* ── tipos de propiedad ────────────────────────────────────────── */

export const PROPIEDADES = [
  { id: 'casa', label: 'Casa', hint: 'Unifamiliar, uno o varios niveles' },
  { id: 'departamento', label: 'Departamento', hint: 'En edificio, un nivel' },
  { id: 'condominio', label: 'Condominio / privada', hint: 'Casa en régimen, con áreas comunes' },
  { id: 'oficina', label: 'Oficinas', hint: 'Corporativo, despacho, coworking' },
  { id: 'comercio', label: 'Comercio', hint: 'Local, tienda, restaurante' },
  { id: 'recinto', label: 'Recinto / salón', hint: 'Eventos, galería, estudio' },
  { id: 'hospedaje', label: 'Hospedaje', hint: 'Airbnb, hotel boutique' },
]

/* ── el catálogo de espacios ───────────────────────────────────────
   `en` dice en qué tipos de propiedad se ofrece. Un espacio puede vivir en
   varios: una cocina existe igual en casa que en departamento. */

const E = (id, nombre, tipo, m2, en, equipo, nota = '', autos = []) => ({
  id, nombre, tipo, m2, en, equipo, nota, autos,
})

/**
 * Una automatización propuesta.
 *
 * `voz` es la frase tal cual se dice. Importa más de lo que parece: es lo
 * único de toda la instalación que el cliente le va a enseñar a sus visitas, y
 * si la frase es rara —"activar escena cocina noche"— no la usa nadie. Se
 * escriben como se hablan.
 */
const A = (nombre, cuando, entonces, voz = []) => ({ nombre, cuando, entonces, voz })

const TODAS = ['casa', 'departamento', 'condominio', 'oficina', 'comercio', 'recinto', 'hospedaje']
const VIVIENDA = ['casa', 'departamento', 'condominio', 'hospedaje']
const TRABAJO = ['oficina', 'comercio', 'recinto']

export const ESPACIOS = [
  /* ── accesos ── */
  E('acceso', 'Acceso / entrada', 'sala', 8, VIVIENDA, { 'yale-assure2': 1, 'aqara-g4': 1, 'aqara-p2': 1, 'nanoleaf-essentials': 2, 'eve-motion': 1 },
    'La cerradura y el timbre son lo primero que el cliente le enseña a las visitas.', [
    A('Llegar de noche', 'La cerradura se abre después del atardecer', 'Se prende la entrada al 60 % y la sala al 30 %',
      ['Oye Siri, ya llegué', 'Alexa, llegué a casa']),
    A('Salir', 'Nadie en casa 10 minutos', 'Todo se apaga y la cerradura se asegura',
      ['Oye Siri, me voy', 'Alexa, buenas noches']),
    A('Tocan el timbre', 'El timbre suena', 'La pantalla de la cocina muestra la cámara'),
  ]),
  E('lobby', 'Lobby / recepción', 'sala', 26, [...TRABAJO, 'condominio'], { 'hue-downlight': 6, 'aqara-fp2': 1, 'ultraloq-bolt': 1, 'aqara-g4': 1, 'eufy-indoor': 1, 'sonos-era100': 2 },
    'Control de acceso con códigos temporales y luz que reacciona a la presencia.'),
  E('recibidor', 'Recibidor', 'sala', 10, VIVIENDA, { 'nanoleaf-essentials': 2, 'eve-motion': 1, 'meross-plug': 1 }),

  /* ── vivir ── */
  E('sala', 'Sala', 'sala', 28, VIVIENDA, { 'hue-a19': 5, 'nanoleaf-lines': 1, 'aqara-fp2': 1, 'sonos-era100': 2, 'switchbot-curtain3': 2, 'samsung-qn90': 1, 'appletv-4k': 1 },
    'El cuarto donde se enseña la casa. Aquí van las escenas que impresionan.', [
    A('Modo película', 'Se pide por voz o arranca la tele', 'Persianas abajo, luces al 15 % y ámbar, barra de sonido encendida',
      ['Oye Siri, película', 'Alexa, pon modo cine']),
    A('Tarde de sol', 'Pasa de las 17:00 y hay sol de poniente', 'Las persianas bajan a la mitad'),
    A('Se vació la sala', 'El sensor no ve a nadie por 15 minutos', 'Se apaga todo menos la luz de paso'),
    A('Buenas noches', 'Se pide por voz', 'Se apaga toda la planta baja',
      ['Oye Siri, buenas noches', 'Alexa, buenas noches']),
  ]),
  E('comedor', 'Comedor', 'comedor', 20, VIVIENDA, { 'hue-a19': 3, 'lutron-diva': 1, 'aqara-th': 1 }),
  E('family', 'Family room / TV', 'sala', 26, ['casa', 'condominio'], { 'hue-a19': 4, 'hue-gradient': 1, 'hue-syncbox': 1, 'samsung-frame-65': 1, 'sonos-arc': 1, 'aqara-fp300': 1 }),
  E('cocina', 'Cocina', 'cocina', 22, [...VIVIENDA, 'comercio'], { 'hue-lightstrip': 2, 'hue-downlight': 4, 'aqara-leak': 2, 'aqara-th': 1, 'meross-plug': 2, 'echo-show8': 1 },
    'Sensor de fuga bajo la tarja: es el dispositivo con mejor retorno de toda la casa.', [
    A('Cocinar', 'Se pide por voz', 'Todo al 100 % y en 4000 K, que es donde se distinguen los colores de la comida',
      ['Oye Siri, voy a cocinar', 'Alexa, modo cocina']),
    A('Fuga bajo la tarja', 'El sensor detecta agua', 'Alerta al teléfono y, si hay válvula, corta el paso'),
    A('Levantarse de noche', 'Movimiento entre 12 y 6 de la mañana', 'Solo la tira bajo gabinete al 10 %'),
  ]),
  E('cocineta', 'Cocineta', 'cocina', 10, ['departamento', 'oficina', 'hospedaje'], { 'hue-lightstrip': 1, 'aqara-leak': 1, 'meross-plug': 2 }),

  /* ── dormir ── */
  E('recamaraP', 'Recámara principal', 'recamara', 24, VIVIENDA, { 'hue-a19': 4, 'switchbot-curtain3': 2, 'aqara-th': 1, 'eve-motion': 1, 'nest-hub2': 1, 'sensibo-air': 1 },
    'Persiana motorizada y tono cálido de noche: es donde más se nota una buena instalación.', [
    A('Despertar', 'Quince minutos antes de la alarma', 'La persiana sube despacio y la luz pasa de ámbar a blanco',
      ['Oye Siri, buenos días', 'Alexa, buenos días']),
    A('Dormir', 'Se pide por voz', 'Persiana abajo, luces fuera, minisplit a 24°',
      ['Oye Siri, a dormir', 'Alexa, hora de dormir']),
    A('Calor de madrugada', 'Pasa de 26° dentro', 'El minisplit arranca en silencio'),
  ]),
  E('recamara', 'Recámara', 'recamara', 16, VIVIENDA, { 'nanoleaf-essentials': 3, 'aqara-p2': 1, 'aqara-th': 1 }),
  E('vestidor', 'Vestidor', 'recamara', 12, ['casa', 'condominio'], { 'nanoleaf-essentials': 4, 'eve-motion': 2 },
    'Luz por presencia: las manos van ocupadas y el apagador queda lejos.'),

  /* ── húmedos ── */
  E('banoP', 'Baño principal', 'bano', 10, VIVIENDA, { 'nanoleaf-essentials': 3, 'aqara-th': 2, 'aqara-leak': 1, 'hue-downlight': 2 },
    'El sensor de humedad dispara el extractor cuando de verdad hace falta, no por timer.', [
    A('Se bañó alguien', 'La humedad sube de 70 %', 'El extractor corre hasta que baje de 60 %'),
    A('Luz de madrugada', 'Movimiento entre 12 y 6', 'Luz al 5 % en ámbar, sin deslumbrar'),
  ]),
  E('bano', 'Baño', 'bano', 6, TODAS, { 'nanoleaf-essentials': 2, 'aqara-th': 1 }),
  E('medioBano', 'Medio baño', 'bano', 4, [...VIVIENDA, 'oficina', 'comercio'], { 'nanoleaf-essentials': 1, 'eve-motion': 1 }),
  E('lavado', 'Cuarto de lavado', 'servicio', 8, ['casa', 'condominio', 'departamento'], { 'aqara-leak': 2, 'thirdreality-vibration': 1, 'nanoleaf-essentials': 1, 'lg-thinq': 1 },
    'El sensor de vibración avisa cuando termina la lavadora.'),

  E('zotehuela', 'Zotehuela', 'servicio', 9, ['casa', 'departamento', 'condominio'], { 'aqara-leak': 2, 'thirdreality-vibration': 1, 'nanoleaf-essentials': 1, 'aqara-p2': 1, 'shelly-1mini': 1 },
    'El espacio que nadie levanta y donde vive medio problema: lavadora, boiler, tinaco y el registro eléctrico. El sensor de fuga aquí evita el escurrimiento que se descubre tres meses después.', [
    A('Terminó la lavadora', 'El sensor de vibración deja de detectar', 'Aviso al teléfono para que no se quede la ropa adentro'),
    A('Fuga en el boiler', 'El sensor detecta agua', 'Alerta inmediata y corte si hay válvula'),
    A('Luz al abrir', 'La puerta se abre', 'Se prende la luz 3 minutos y se apaga sola'),
  ]),

  /* ── trabajo ── */
  E('estudio', 'Estudio / home office', 'estudio', 14, VIVIENDA, { 'hue-a19': 3, 'eve-energy': 2, 'aqara-fp300': 1, 'levoit-core': 1 }),
  E('areaAbierta', 'Área abierta de trabajo', 'estudio', 90, ['oficina', 'comercio'], { 'hue-downlight': 14, 'aqara-fp2': 3, 'unifi-u7': 3, 'levoit-core': 2, 'aqara-tvoc': 1 },
    'Presencia por zonas: apagar una nave completa por un solo sensor deja gente a oscuras.'),
  E('juntas', 'Sala de juntas', 'estudio', 24, TRABAJO, { 'hue-downlight': 6, 'samsung-qn90': 1, 'switchbot-roller': 2, 'aqara-fp2': 1, 'sonos-era100': 2 },
    'La pantalla hace de hub Matter, así que no hace falta un cerebro aparte.'),
  E('privado', 'Oficina privada', 'estudio', 14, TRABAJO, { 'hue-downlight': 4, 'aqara-fp300': 1, 'eve-energy': 2 }),

  /* ── técnicos ── */
  E('rack', 'Site / rack', 'servicio', 6, TODAS, { 'unifi-cloudgw': 1, 'unifi-switch8': 1, 'rack-6u': 1, 'patch-panel': 1, 'apc-ups': 1, 'ha-green': 1, 'reolink-nvr': 1 },
    'Sin UPS, un apagón de dos minutos tira toda la casa.'),
  E('bodega', 'Bodega', 'servicio', 8, TODAS, { 'nanoleaf-essentials': 1, 'aqara-p2': 1, 'eve-motion': 1 }),
  E('maquinas', 'Cuarto de máquinas', 'servicio', 10, ['casa', 'condominio', 'comercio', 'recinto'], { 'shelly-1mini': 2, 'aqara-leak': 2, 'shelly-em': 1, 'moen-flo': 1 }),

  /* ── exteriores ── */
  E('jardin', 'Jardín', 'exterior', 40, ['casa', 'condominio', 'recinto'], { 'hue-outdoor': 2, 'rachio-3': 1, 'reolink-810a': 2, 'aqara-valve': 1 }),
  E('terraza', 'Terraza', 'exterior', 20, TODAS, { 'hue-outdoor': 1, 'sonos-era100': 1, 'netro-pixie': 1, 'reolink-810a': 1 }),
  E('balcon', 'Balcón', 'exterior', 8, ['departamento', 'hospedaje'], { 'hue-outdoor': 1, 'aqara-p2': 1 }),
  E('azotea', 'Azotea', 'exterior', 45, ['casa', 'departamento', 'condominio', 'comercio'], { 'hue-outdoor': 2, 'reolink-810a': 2, 'unifi-u7': 1, 'aqara-leak': 1 },
    'Tinaco y bomba viven aquí: el sensor de fuga en azotea evita el escurrimiento que nadie ve.'),
  E('cochera', 'Cochera / garage', 'exterior', 32, ['casa', 'condominio', 'comercio'], { 'shelly-1mini': 1, 'reolink-810a': 1, 'eve-motion': 1, 'hue-outdoor': 1, 'aqara-p2': 1 },
    'El Shelly va en paralelo al botón del portón: se conserva el control que ya existe.'),
  E('fachada', 'Fachada', 'exterior', 15, ['casa', 'condominio', 'comercio', 'recinto'], { 'hue-outdoor': 3, 'reolink-810a': 2, 'aqara-g4': 1 }),
  E('alberca', 'Alberca', 'exterior', 50, ['casa', 'condominio', 'recinto', 'hospedaje'], { 'hue-outdoor': 4, 'reolink-810a': 2, 'shelly-1mini': 1 }),

  /* ── circulaciones ── */
  E('pasillo', 'Pasillo', 'generico', 10, TODAS, { 'nanoleaf-essentials': 2, 'eve-motion': 2 },
    'Luz por movimiento al 20 % de noche: nadie se despierta del todo para ir al baño.'),
  E('escalera', 'Escalera', 'generico', 12, ['casa', 'condominio', 'oficina', 'comercio'], { 'nanoleaf-essentials': 3, 'eve-motion': 2 }),

  /* ── comercio y recinto ── */
  E('salaVentas', 'Piso de venta', 'sala', 60, ['comercio'], { 'hue-downlight': 12, 'aqara-fp2': 2, 'eufy-indoor': 2, 'sonos-era100': 2, 'aqara-tvoc': 1 }),
  E('salon', 'Salón principal', 'sala', 120, ['recinto'], { 'hue-downlight': 18, 'nanoleaf-lines': 4, 'sonos-arc': 1, 'sonos-era100': 4, 'aqara-fp2': 3, 'switchbot-roller': 4 },
    'Escenas de iluminación por momento del evento: entrada, cena, baile.'),
  E('barra', 'Barra / bar', 'cocina', 18, ['comercio', 'recinto'], { 'hue-lightstrip': 3, 'hue-downlight': 4, 'meross-plug': 2, 'aqara-leak': 1 }),
  E('almacen', 'Almacén', 'servicio', 25, ['comercio', 'recinto'], { 'nanoleaf-essentials': 4, 'eve-motion': 2, 'aqara-p2': 2, 'aqara-th': 1 }),

  /* ── hospedaje ── */
  E('suite', 'Suite', 'recamara', 30, ['hospedaje'], { 'hue-a19': 4, 'switchbot-curtain3': 2, 'sensibo-air': 1, 'aqara-th': 1, 'ultraloq-bolt': 1, 'echo-show8': 1 },
    'Cerradura con código por reserva: no hay que entregar llaves ni cambiarlas.'),
]

export const ESPACIO_BY_ID = Object.fromEntries(ESPACIOS.map((e) => [e.id, e]))

/** Los que tienen sentido en este tipo de propiedad. */
export const espaciosDe = (propiedad) => ESPACIOS.filter((e) => e.en.includes(propiedad))

/**
 * Con qué espacios arranca un proyecto nuevo.
 *
 * Se crean solos al dar de alta: casi toda casa tiene sala, cocina y una
 * recámara, y empezar con la lista en blanco obliga a teclear lo obvio.
 */
export const ARRANQUE_PROPIEDAD = {
  casa: ['acceso', 'sala', 'comedor', 'cocina', 'recamaraP', 'banoP', 'rack'],
  departamento: ['acceso', 'sala', 'cocina', 'recamaraP', 'bano'],
  condominio: ['acceso', 'sala', 'comedor', 'cocina', 'recamaraP', 'banoP', 'cochera', 'rack'],
  oficina: ['lobby', 'areaAbierta', 'juntas', 'cocineta', 'bano', 'rack'],
  comercio: ['lobby', 'salaVentas', 'almacen', 'bano', 'rack'],
  recinto: ['lobby', 'salon', 'barra', 'bano', 'rack'],
  hospedaje: ['lobby', 'suite', 'bano', 'rack'],
}
