/**
 * Cotización de ejemplo.
 *
 * Sirve para enseñarle a alguien cómo se ve el documento sin tener que
 * levantar una casa de verdad. Todos los datos son ficticios: el cliente no
 * existe, el RFC no corresponde a nadie y las tarifas son las de demo.
 *
 * Va como paquete YA RESUELTO, con la misma forma que produce
 * `buildQuotePayload`. Eso importa por dos razones: se pinta con el mismo
 * componente que una cotización real —así que lo que ves es lo que se
 * manda— y no arrastra el catálogo ni el modelo de costos al bundle
 * público.
 *
 * Las sumas están calculadas, no inventadas: equipo $106,886 + servicios
 * $49,163 − levantamiento acreditado $2,600 = $153,449 + 16% = $178,001.
 */

export const DEMO_QUOTE = {
  s: 2,
  demo: true,
  f: 'MTR-2608-431',
  d: '2026-08-10',
  v: 15,

  c: {
    nombre: 'Uriel Carpio',
    razonSocial: 'CARPIO MENDOZA URIEL',
    rfc: 'CAMU880412J28',
    regimen: '612',
    cp: '07820',
    usoCfdi: 'G03',
    formaPago: '03',
    metodoPago: 'PUE',
    email: 'uriel@carpio.mx',
    tel: '55 9330 3039',
    direccion: 'Colinas de San José 214, Lindavista, Gustavo A. Madero, CDMX',
  },

  o: { tipo: 'Casa', m2: 210, niveles: 2, zona: 'Zona metropolitana' },

  r: [
    { n: 'Garage', m: 24, t: 'servicio', u: 3 },
    { n: 'Recibidor', m: 18, t: 'interior', u: 5 },
    { n: 'Sala', m: 32, t: 'interior', u: 11 },
    { n: 'Cocina y comedor', m: 34, t: 'interior', u: 9 },
    { n: 'Medio baño', m: 6, t: 'húmedo', u: 3 },
    { n: 'Recámara principal', m: 28, t: 'interior', u: 8 },
    { n: 'Baño principal', m: 11, t: 'húmedo', u: 4 },
    { n: 'Estudio', m: 20, t: 'interior', u: 6 },
    { n: 'Balcón', m: 16, t: 'exterior', u: 3 },
  ],

  L: [
    // ── equipo ──
    { k: '43222600', x: 'H87', q: 1, c: 'Apple TV 4K (Wi-Fi + Ethernet) — Apple', s: 'Hubs y controladores', p: 3899, i: 3899 },
    { k: '43222600', x: 'H87', q: 3, c: 'HomePod mini — Apple', s: 'Hubs y controladores', p: 2249, i: 6747 },
    { k: '39111500', x: 'H87', q: 14, c: 'Essentials Matter A19 — Nanoleaf', s: 'Iluminación', p: 620, i: 8680 },
    { k: '39111500', x: 'H87', q: 1, c: 'Shapes Hexágonos (kit 9) — Nanoleaf', s: 'Iluminación', p: 4800, i: 4800 },
    { k: '39111500', x: 'H87', q: 2, c: 'Hue Lightstrip Plus 2m — Philips Hue', s: 'Iluminación', p: 1895, i: 3790 },
    { k: '39121300', x: 'H87', q: 6, c: 'Caséta Diva dimmer — Lutron', s: 'Interruptores y dimmers', p: 1850, i: 11100 },
    { k: '43222600', x: 'H87', q: 1, c: 'Caséta Smart Bridge Pro — Lutron', s: 'Hubs y controladores', p: 2700, i: 2700 },
    { k: '46171610', x: 'H87', q: 4, c: 'Aqara Door & Window P2 — Aqara', s: 'Sensores', p: 735, i: 2940 },
    { k: '46171610', x: 'H87', q: 2, c: 'Aqara Presence Sensor FP2 — Aqara', s: 'Sensores', p: 1600, i: 3200 },
    { k: '40151500', x: 'H87', q: 3, c: 'Aqara Water Leak Sensor — Aqara', s: 'Agua y riego', p: 410, i: 1230 },
    { k: '46171500', x: 'H87', q: 1, c: 'Yale Assure Lock 2 (Matter) — Yale', s: 'Acceso y seguridad', p: 6850, i: 6850 },
    { k: '46171500', x: 'H87', q: 1, c: 'Aqara Video Doorbell G4 — Aqara', s: 'Acceso y seguridad', p: 2200, i: 2200 },
    { k: '30171600', x: 'H87', q: 3, c: 'SwitchBot Roller Shade (Matter) — SwitchBot', s: 'Cortinas y persianas', p: 4900, i: 14700 },
    { k: '40101700', x: 'H87', q: 2, c: 'Sensibo Air Pro — Sensibo', s: 'Clima', p: 3000, i: 6000 },
    { k: '40151500', x: 'H87', q: 1, c: 'Aqara Water Valve Controller — Aqara', s: 'Agua y riego', p: 2250, i: 2250 },
    { k: '43222600', x: 'H87', q: 2, c: 'UniFi U7 Pro (WiFi 7) — Ubiquiti', s: 'Red', p: 4350, i: 8700 },
    { k: '43222600', x: 'H87', q: 1, c: 'UniFi Cloud Gateway Ultra — Ubiquiti', s: 'Red', p: 3700, i: 3700 },
    { k: '43222600', x: 'H87', q: 1, c: 'UniFi Switch Lite 8 PoE — Ubiquiti', s: 'Red', p: 3000, i: 3000 },
    { k: '43222600', x: 'H87', q: 1, c: 'Rack de pared 6U + organizador — Genérico', s: 'Red', p: 2700, i: 2700 },
    { k: '39121000', x: 'H87', q: 1, c: 'APC Back-UPS Pro 1500VA — APC', s: 'Energía', p: 4900, i: 4900 },
    { k: '10121800', x: 'H87', q: 1, c: 'PETLIBRO Granary Camera Feeder — PETLIBRO', s: 'Mascotas', p: 2800, i: 2800 },

    // ── servicios ──
    {
      k: '81111800', x: 'E48', q: 1,
      c: 'Levantamiento en sitio — 210 m², 2 niveles',
      s: 'Mapa de calor por nivel, plano de dispositivos, revisión eléctrica y de neutro',
      p: 2600, i: 2600,
    },
    {
      k: '81111800', x: 'E48', q: 1,
      c: 'Instalación y puesta en obra',
      s: '9 × enchufar · 24 × simple · 9 × medio · 7 × alto · 1 × con obra',
      p: 24850, i: 24850,
    },
    {
      k: '81111800', x: 'E48', q: 8,
      c: 'Puntos de red estructurada Cat6',
      s: 'Cable, jack, ponchado, patch panel y certificación por punto',
      p: 900, i: 7200,
    },
    {
      k: '81111800', x: 'E48', q: 14,
      c: 'Diseño y programación de escenas',
      s: 'Incluye ajuste con el cliente presente y una revisión posterior',
      p: 400, i: 5600,
    },
    {
      k: '81111800', x: 'E48', q: 1,
      c: 'Puesta en marcha y afinación',
      s: 'Actualización de firmware, pruebas de cobertura y corrección de rutas',
      p: 6413, i: 6413,
    },
    {
      k: '81111800', x: 'E48', q: 1,
      c: 'Entrenamiento y documentación',
      s: 'Sesión con la familia, planos as-built, credenciales y etiquetado del rack',
      p: 2500, i: 2500,
    },
  ],

  T: { bruto: 156049, desc: 2600, acredita: 2600, sub: 153449, iva: 24552, tot: 178001 },

  N: '19 thread · 12 zigbee · 9 wifi · 5 poe · 4 ble · 3 matter',
  a: 2,
  g: 12,
}
