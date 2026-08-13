import { nuevoCuarto, nuevoProyecto, uid } from '../src/sync/eventos.js'

/**
 * Los ocho proyectos con los que arranca el registro.
 *
 * No son maquetas de escaparate: son levantamientos con la forma que tienen
 * los de verdad —casas, departamentos y oficinas, en distintos puntos del
 * proceso— para poder revisar cómo se comporta el panel con datos que pesan.
 *
 * Cada uno se siembra como una TIRA DE EVENTOS fechados en el pasado y
 * repartidos entre los dos socios, no como un estado ya cocinado. Así el
 * historial de cada proyecto tiene desde el primer día algo real que contar, y
 * se puede ver cómo se lee cuando dos personas trabajan sobre la misma casa.
 *
 * Solo corre si el registro está vacío: en cuanto haya un cambio de verdad,
 * esto no vuelve a tocarse nunca.
 */

const dia = (iso, h = 10, m = 0) => new Date(`${iso}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-06:00`).toISOString()

/* Cada renglón: [cuartoNombre, m2, tipo, { deviceId: cantidad }, notas] */
const CASOS = [
  {
    nombre: 'Casa Fernández — Del Valle',
    autor: 'margay',
    inicio: '2026-03-09',
    estado: 'cerrado',
    cliente: {
      nombre: 'María Fernández',
      razonSocial: 'FERNANDEZ LOPEZ MARIA GUADALUPE',
      rfc: 'FELM810214H23',
      cp: '03100',
      email: 'maria.fernandez@correo.com',
      tel: '55 4182 6690',
      direccion: 'Adolfo Prieto 1428, Del Valle Centro, Benito Juárez',
    },
    obra: { tipo: 'Casa', m2: 240, niveles: 2, zona: 'Benito Juárez' },
    extras: { puntosRed: 8, escenas: 14, km: 0, descuentoPct: 8, vigencia: 20 },
    cuartos: [
      ['Sala', 34, 'interior', { 'hue-a19': 6, 'nanoleaf-lines': 1, 'sonos-era100': 2, 'aqara-fp2': 1 }, 'Plafón de tablaroca, sí hay neutro en los tres apagadores.'],
      ['Comedor', 20, 'interior', { 'hue-a19': 4, 'lutron-diva': 1 }, ''],
      ['Cocina', 24, 'interior', { 'hue-lightstrip': 2, 'aqara-leak': 2, 'aqara-th': 1, 'meross-plug': 2 }, 'Fuga vieja bajo la tarja: el sensor va antes que nada.'],
      ['Recámara principal', 28, 'interior', { 'hue-a19': 4, 'switchbot-curtain3': 2, 'aqara-th': 1, 'eve-motion': 1 }, 'Riel de cortina existente, corredizo. No hay contacto cerca de la ventana.'],
      ['Recámara 2', 18, 'interior', { 'nanoleaf-essentials': 2, 'aqara-p2': 1 }, ''],
      ['Baño principal', 9, 'húmedo', { 'aqara-th': 1, 'nanoleaf-essentials': 2 }, 'Extractor por humedad, no por timer.'],
      ['Estudio', 14, 'interior', { 'hue-a19': 3, 'eve-energy': 2, 'aqara-fp300': 1 }, ''],
      ['Entrada y fachada', 12, 'exterior', { 'yale-assure2': 1, 'aqara-g4': 1, 'hue-outdoor': 1, 'reolink-810a': 2 }, 'Puerta de 45 mm, sí acepta la Yale.'],
      ['Rack y servicio', 6, 'servicio', { 'unifi-cloudgw': 1, 'unifi-switch8': 1, 'unifi-u7': 3, 'rack-6u': 1, 'patch-panel': 1, 'apc-ups': 1, 'ha-green': 1, 'homepod-mini': 1 }, 'Bajo la escalera. Ventilación forzada.'],
    ],
  },
  {
    nombre: 'Depto Polanco 704 — Torre Anáhuac',
    autor: 'carpio',
    inicio: '2026-04-21',
    estado: 'instalacion',
    cliente: {
      nombre: 'Rodrigo Bezares',
      razonSocial: 'BEZARES MONTOYA RODRIGO',
      rfc: 'BEMR900726QK4',
      cp: '11560',
      email: 'r.bezares@outlook.com',
      tel: '55 2298 4471',
      direccion: 'Anatole France 311, int. 704, Polanco, Miguel Hidalgo',
    },
    obra: { tipo: 'Departamento', m2: 118, niveles: 1, zona: 'Miguel Hidalgo' },
    extras: { puntosRed: 3, escenas: 10, km: 0, descuentoPct: 0, vigencia: 15 },
    cuartos: [
      ['Sala-comedor', 38, 'interior', { 'nanoleaf-shapes': 1, 'hue-a19': 5, 'sonos-arc': 1, 'aqara-fp2': 1, 'switchbot-roller': 3 }, 'Ventanal de 4.2 m a poniente. La persiana es lo que resuelve el calor de la tarde.'],
      ['Cocina integral', 12, 'interior', { 'hue-lightstrip': 1, 'aqara-leak': 1, 'meross-plug': 2 }, ''],
      ['Recámara principal', 22, 'interior', { 'hue-a19': 3, 'switchbot-roller': 2, 'nest-hub2': 1, 'aqara-th': 1 }, ''],
      ['Recámara 2 / oficina', 15, 'interior', { 'nanoleaf-essentials': 2, 'eve-energy': 1 }, ''],
      ['Baño', 7, 'húmedo', { 'aqara-th': 1, 'nanoleaf-essentials': 1 }, ''],
      ['Acceso', 5, 'interior', { 'nuki-4': 1, 'aqara-p2': 1, 'switchbot-hub2': 1 }, 'Régimen de condominio: no se puede cambiar la cerradura. Nuki va por dentro.'],
      ['Cuarto de lavado', 4, 'servicio', { 'aqara-leak': 1, 'thirdreality-vibration': 1, 'tplink-deco': 1 }, 'No hay ducto para cablear: mesh WiFi.'],
    ],
  },
  {
    nombre: 'Oficinas Verte — Roma Norte',
    autor: 'margay',
    inicio: '2026-05-14',
    estado: 'cotizado',
    cliente: {
      nombre: 'Paulina Estrada',
      razonSocial: 'VERTE ESTUDIO SA DE CV',
      rfc: 'VES2103115T8',
      regimen: '601',
      cp: '06700',
      usoCfdi: 'G03',
      email: 'paulina@verte.studio',
      tel: '55 7710 3358',
      direccion: 'Colima 188, piso 2, Roma Norte, Cuauhtémoc',
    },
    obra: { tipo: 'Oficina', m2: 310, niveles: 1, zona: 'Cuauhtémoc' },
    extras: { puntosRed: 24, escenas: 6, km: 0, descuentoPct: 5, vigencia: 30 },
    cuartos: [
      ['Área abierta', 140, 'interior', { 'hue-downlight': 18, 'aqara-fp2': 4, 'unifi-u7': 4, 'levoit-core': 2 }, 'Plafón reticulado. 18 luminarias en cuatro circuitos.'],
      ['Sala de juntas grande', 34, 'interior', { 'hue-downlight': 6, 'samsung-frame': 1, 'switchbot-roller': 2, 'aqara-fp2': 1, 'sonos-era100': 2 }, 'La pantalla también hace de hub Matter.'],
      ['Sala de juntas chica', 16, 'interior', { 'hue-downlight': 4, 'aqara-fp2': 1 }, ''],
      ['Cocineta', 14, 'interior', { 'hue-lightstrip': 1, 'aqara-leak': 1, 'meross-plug': 3 }, ''],
      ['Baños', 18, 'húmedo', { 'aqara-th': 2, 'nanoleaf-essentials': 4 }, 'Extractores ligados a humedad.'],
      ['Recepción', 22, 'interior', { 'nanoleaf-lines': 2, 'aqara-g4': 1, 'ultraloq-bolt': 1, 'eufy-indoor': 1 }, 'Códigos temporales para visitas y mensajería.'],
      ['Site', 8, 'servicio', { 'unifi-cloudgw': 1, 'unifi-switch8': 2, 'rack-6u': 2, 'patch-panel': 3, 'apc-ups': 2, 'ha-yellow': 1, 'reolink-nvr': 1 }, 'Rack de 12U ya instalado por el arrendador; se aprovecha.'],
      ['Terraza', 30, 'exterior', { 'hue-outdoor': 2, 'reolink-810a': 2, 'netro-pixie': 2 }, ''],
    ],
  },
  {
    nombre: 'Casa Solano — Coyoacán',
    autor: 'carpio',
    inicio: '2026-06-02',
    estado: 'levantamiento',
    cliente: {
      nombre: 'Ignacio Solano',
      razonSocial: 'SOLANO RIVAS IGNACIO',
      rfc: 'SORI750918P41',
      cp: '04100',
      email: 'nacho.solano@gmail.com',
      tel: '55 3390 8125',
      direccion: 'Francisco Sosa 402, Villa Coyoacán, Coyoacán',
    },
    obra: { tipo: 'Casa', m2: 195, niveles: 2, zona: 'Coyoacán' },
    extras: { puntosRed: 6, escenas: 8, km: 0, descuentoPct: 0, vigencia: 15 },
    cuartos: [
      ['Sala', 30, 'interior', { 'hue-a19': 5, 'shelly-dimmer': 3, 'aqara-fp2': 1 }, 'Casa de 1954: NO hay neutro en ninguna caja. Todo con módulo Shelly detrás del apagador.'],
      ['Comedor', 18, 'interior', { 'hue-a19': 3, 'shelly-dimmer': 1 }, 'Muro de tabique macizo, taladro de percusión.'],
      ['Cocina', 16, 'interior', { 'aqara-leak': 2, 'aqara-th': 1, 'shelly-1mini': 2 }, ''],
      ['Recámara principal', 24, 'interior', { 'hue-a19': 3, 'aqara-driver-e1': 2, 'aqara-th': 1 }, ''],
      ['Recámara 2', 16, 'interior', { 'nanoleaf-essentials': 2 }, ''],
      ['Jardín', 45, 'exterior', { 'hue-outdoor': 2, 'aqara-valve': 1, 'reolink-810a': 2, 'sureflap-hub': 1 }, 'Dos perros. La puerta de mascota va al muro del patio, no a la puerta.'],
      ['Bodega', 10, 'servicio', { 'ha-green': 1, 'skyconnect': 1, 'tplink-deco': 1, 'apc-ups': 1 }, ''],
    ],
  },
  {
    nombre: 'Depto Condesa — Ámsterdam 240',
    autor: 'margay',
    inicio: '2026-06-18',
    estado: 'cotizado',
    cliente: {
      nombre: 'Renata Ibáñez',
      razonSocial: 'IBAÑEZ CORTES RENATA',
      rfc: 'IACR940305LM7',
      cp: '06100',
      email: 'renata.ibanez@proton.me',
      tel: '55 8804 2217',
      direccion: 'Ámsterdam 240, int. 3B, Hipódromo, Cuauhtémoc',
    },
    obra: { tipo: 'Departamento', m2: 76, niveles: 1, zona: 'Cuauhtémoc' },
    extras: { puntosRed: 2, escenas: 6, km: 0, descuentoPct: 0, vigencia: 15 },
    cuartos: [
      ['Estancia', 26, 'interior', { 'nanoleaf-essentials': 4, 'govee-strip': 1, 'echo-show8': 1, 'switchbot-curtain3': 2 }, 'Departamento rentado: nada que deje marca. Todo reversible.'],
      ['Cocina', 9, 'interior', { 'aqara-leak': 1, 'meross-plug': 2, 'aqara-th': 1 }, ''],
      ['Recámara', 18, 'interior', { 'nanoleaf-essentials': 2, 'switchbot-curtain3': 1, 'echo-dot': 1 }, ''],
      ['Baño', 6, 'húmedo', { 'aqara-th': 1 }, ''],
      ['Acceso', 4, 'interior', { 'aqara-p2': 1, 'switchbot-hub2': 1, 'switchbot-keypad': 1 }, 'La cerradura no se toca; teclado exterior adherido.'],
    ],
  },
  {
    nombre: 'Casa Mendieta — Santa Fe',
    autor: 'carpio',
    inicio: '2026-07-07',
    estado: 'instalacion',
    cliente: {
      nombre: 'Alfonso Mendieta',
      razonSocial: 'MENDIETA CARRANZA ALFONSO',
      rfc: 'MECA690411GT2',
      cp: '05348',
      email: 'amendieta@grupomc.mx',
      tel: '55 1145 7702',
      direccion: 'Vista Real 88, Bosque Real, Huixquilucan',
    },
    obra: { tipo: 'Casa', m2: 480, niveles: 3, zona: 'Huixquilucan' },
    extras: { puntosRed: 18, escenas: 22, km: 34, descuentoPct: 10, vigencia: 30 },
    cuartos: [
      ['Sala doble altura', 62, 'interior', { 'hue-downlight': 12, 'hue-gradient': 1, 'sonos-arc': 1, 'sonos-era100': 4, 'switchbot-roller': 4, 'aqara-fp2': 2 }, 'Doble altura: los downlights van con andamio, cotizar día extra de cuadrilla.'],
      ['Cocina', 32, 'interior', { 'hue-lightstrip': 3, 'hue-downlight': 6, 'aqara-leak': 3, 'lg-thinq': 1, 'aqara-th': 1 }, ''],
      ['Comedor formal', 28, 'interior', { 'hue-downlight': 6, 'lutron-diva': 2, 'lutron-bridge': 1 }, 'Lutron por el candil: es lo único que no zumba con esas lámparas.'],
      ['Recámara principal', 42, 'interior', { 'hue-a19': 6, 'somfy-roll': 4, 'aqara-th': 1, 'sensibo-air': 1, 'nest-hub2': 1 }, 'Persianas Somfy: el cliente ya las tenía, se integran con puente RTS.'],
      ['Vestidor', 16, 'interior', { 'nanoleaf-essentials': 4, 'eve-motion': 2 }, ''],
      ['Baño principal', 18, 'húmedo', { 'aqara-th': 2, 'hue-downlight': 4, 'aqara-leak': 1 }, ''],
      ['Recámaras secundarias', 54, 'interior', { 'hue-a19': 9, 'aqara-p2': 3, 'aqara-th': 3 }, 'Tres recámaras, se levantan como una sola partida.'],
      ['Estudio', 24, 'interior', { 'hue-downlight': 4, 'eve-energy': 3, 'aqara-fp300': 1 }, ''],
      ['Cine en casa', 30, 'interior', { 'hue-syncbox': 1, 'hue-gradient': 1, 'samsung-frame': 1, 'sonos-era100': 2 }, ''],
      ['Cocina de servicio', 14, 'servicio', { 'aqara-leak': 2, 'shelly-1mini': 2 }, ''],
      ['Jardín y alberca', 120, 'exterior', { 'hue-outdoor': 4, 'rachio-3': 1, 'reolink-810a': 4, 'moen-flo': 1 }, 'Riego por zonas, 8 válvulas existentes.'],
      ['Cuarto de máquinas', 12, 'servicio', { 'unifi-cloudgw': 1, 'unifi-switch8': 3, 'unifi-u7': 6, 'rack-6u': 2, 'patch-panel': 4, 'apc-ups': 2, 'ha-yellow': 1, 'reolink-nvr': 1, 'appletv-4k': 2 }, ''],
    ],
  },
  {
    nombre: 'Loft Juárez — Estudio fotográfico',
    autor: 'margay',
    inicio: '2026-07-24',
    estado: 'levantamiento',
    cliente: {
      nombre: 'Diego Arrieta',
      razonSocial: 'ARRIETA VELA DIEGO ARMANDO',
      rfc: 'AIVD880129R55',
      regimen: '626',
      cp: '06600',
      email: 'hola@diegoarrieta.mx',
      tel: '55 6621 9048',
      direccion: 'Milán 44, Juárez, Cuauhtémoc',
    },
    obra: { tipo: 'Loft', m2: 145, niveles: 1, zona: 'Cuauhtémoc' },
    extras: { puntosRed: 6, escenas: 12, km: 0, descuentoPct: 0, vigencia: 15 },
    cuartos: [
      ['Set principal', 70, 'interior', { 'lifx-color': 8, 'nanoleaf-lines': 4, 'eve-energy': 6, 'aqara-fp2': 1 }, 'Necesita tono ajustable de verdad, no color decorativo. LIFX por lúmenes.'],
      ['Cuarto oscuro', 12, 'servicio', { 'nanoleaf-essentials': 2, 'aqara-p2': 1, 'aqara-th': 1 }, 'Luz de seguridad ámbar, control por escena aparte.'],
      ['Área de edición', 24, 'interior', { 'hue-a19': 3, 'nanoleaf-lines': 2, 'eve-energy': 2 }, ''],
      ['Cocineta', 10, 'interior', { 'meross-plug': 2, 'aqara-leak': 1 }, ''],
      ['Baño', 6, 'húmedo', { 'aqara-th': 1, 'nanoleaf-essentials': 1 }, ''],
      ['Acceso y bodega', 18, 'servicio', { 'ultraloq-bolt': 1, 'eufy-indoor': 2, 'aqara-p2': 2, 'tplink-deco': 1 }, 'Equipo caro en bodega: sensor de puerta con alerta inmediata.'],
    ],
  },
  {
    nombre: 'Casa Villalobos — Tlalpan',
    autor: 'carpio',
    inicio: '2026-08-04',
    estado: 'levantamiento',
    cliente: {
      nombre: 'Gabriela Villalobos',
      razonSocial: 'VILLALOBOS NUÑEZ GABRIELA',
      rfc: 'VING860612D19',
      cp: '14000',
      email: 'gaby.villalobos@correo.com',
      tel: '55 4477 1290',
      direccion: 'Camino a Santa Teresa 1040, Jardines en la Montaña, Tlalpan',
    },
    obra: { tipo: 'Casa', m2: 320, niveles: 2, zona: 'Tlalpan' },
    extras: { puntosRed: 12, escenas: 16, km: 12, descuentoPct: 5, vigencia: 20 },
    cuartos: [
      ['Sala', 40, 'interior', { 'hue-a19': 6, 'nanoleaf-shapes': 1, 'aqara-fp2': 1, 'sonos-era100': 2 }, ''],
      ['Cocina', 26, 'interior', { 'hue-lightstrip': 2, 'aqara-leak': 2, 'aqara-th': 1, 'roborock-s8': 1 }, ''],
      ['Comedor', 22, 'interior', { 'hue-a19': 4, 'inovelli-blue': 2 }, 'Sí hay neutro: se puede usar apagador con barra de notificación.'],
      ['Recámara principal', 32, 'interior', { 'hue-a19': 4, 'aqara-driver-e1': 3, 'sensibo-air': 1, 'aqara-th': 1 }, 'Minisplit Mirage de 2021, control por infrarrojo.'],
      ['Recámara 2', 20, 'interior', { 'nanoleaf-essentials': 3, 'aqara-p2': 1 }, ''],
      ['Recámara 3', 18, 'interior', { 'nanoleaf-essentials': 3, 'aqara-p2': 1 }, ''],
      ['Baños', 24, 'húmedo', { 'aqara-th': 3, 'nanoleaf-essentials': 5, 'aqara-leak': 1 }, ''],
      ['Family room', 28, 'interior', { 'hue-a19': 4, 'samsung-frame': 1, 'appletv-4k': 1, 'aqara-fp300': 1 }, ''],
      ['Cochera', 36, 'exterior', { 'shelly-1mini': 1, 'reolink-810a': 2, 'aqara-p2': 1, 'hue-outdoor': 1 }, 'Portón con motor Merik: el Shelly va en paralelo al botón de pared.'],
      ['Rack', 6, 'servicio', { 'unifi-cloudgw': 1, 'unifi-switch8': 2, 'unifi-u7': 4, 'rack-6u': 1, 'patch-panel': 2, 'apc-ups': 1, 'ha-green': 1, 'reolink-nvr': 1 }, ''],
    ],
  },
]

/** El otro socio: quien no levantó es quien revisa. Así todos los proyectos
 *  tienen huella de los dos, que es justo lo que se quería poder mirar. */
const otro = (a) => (a === 'margay' ? 'carpio' : 'margay')

/**
 * Convierte cada caso en la tira de eventos que lo habría producido.
 * Las horas van avanzando para que el historial se lea como una jornada real
 * y no como si todo hubiera pasado en el mismo instante.
 */
export function eventosIniciales() {
  const salida = []

  for (const caso of CASOS) {
    const autor = caso.autor
    const revisor = otro(autor)
    const base = new Date(`${caso.inicio}T00:00:00-06:00`)
    const fecha = (offsetDias, h, m = 0) => {
      const d = new Date(base)
      d.setDate(d.getDate() + offsetDias)
      return dia(d.toISOString().slice(0, 10), h, m)
    }

    const rooms = caso.cuartos.map(([nombre, m2, tipo]) => nuevoCuarto(nombre, m2, tipo))
    const proyecto = {
      ...nuevoProyecto({
        nombre: caso.nombre,
        cliente: caso.cliente,
        obra: caso.obra,
        extras: caso.extras,
        rooms: [],
      }),
      rooms: [],
    }

    const push = (tipo, datos, quien, ts) =>
      salida.push({ id: uid('e'), tipo, proyectoId: proyecto.id, datos, autor: quien, ts })

    // 1 — alta, con el proyecto todavía sin cuartos
    push('proyecto.crear', { proyecto }, autor, fecha(0, 9, 15))
    push('cliente.editar', { patch: caso.cliente }, autor, fecha(0, 9, 22))
    push('obra.editar', { patch: caso.obra }, autor, fecha(0, 9, 40))

    // 2 — el recorrido de la casa, cuarto por cuarto
    let hora = 10
    let minuto = 0
    caso.cuartos.forEach(([nombre, , , items, notas], i) => {
      const cuarto = rooms[i]
      push('cuarto.agregar', { cuarto }, autor, fecha(0, hora, minuto))
      minuto += 4
      if (minuto >= 60) {
        hora++
        minuto -= 60
      }

      for (const [deviceId, qty] of Object.entries(items)) {
        push(
          'equipo.cantidad',
          { cuartoId: cuarto.id, cuartoNombre: nombre, deviceId, qty, anterior: 0 },
          autor,
          fecha(0, hora, minuto),
        )
        minuto += 2
        if (minuto >= 60) {
          hora++
          minuto -= 60
        }
      }

      if (notas) {
        push(
          'cuarto.editar',
          { cuartoId: cuarto.id, cuartoNombre: nombre, patch: { notas } },
          autor,
          fecha(0, hora, minuto),
        )
        minuto += 3
        if (minuto >= 60) {
          hora++
          minuto -= 60
        }
      }
    })

    // 3 — al día siguiente el otro socio revisa y ajusta
    push('servicios.editar', { patch: caso.extras }, revisor, fecha(1, 11, 5))

    const revisado = rooms[Math.min(2, rooms.length - 1)]
    if (revisado) {
      const items = Object.entries(caso.cuartos[rooms.indexOf(revisado)][3])
      if (items.length > 0) {
        const [deviceId, qty] = items[0]
        push(
          'equipo.cantidad',
          {
            cuartoId: revisado.id,
            cuartoNombre: revisado.nombre,
            deviceId,
            qty: qty + 1,
            anterior: qty,
          },
          revisor,
          fecha(1, 11, 18),
        )
      }
      push(
        'cuarto.editar',
        {
          cuartoId: revisado.id,
          cuartoNombre: revisado.nombre,
          patch: { notas: `${caso.cuartos[rooms.indexOf(revisado)][4] || 'Revisado en gabinete.'} Confirmado en segunda visita.`.trim() },
        },
        revisor,
        fecha(1, 11, 26),
      )
    }

    // 4 — el estado al que llegó cada proyecto
    if (caso.estado !== 'levantamiento') {
      push('proyecto.editar', { patch: { estado: 'cotizado' } }, autor, fecha(2, 17, 30))
    }
    if (caso.estado === 'instalacion' || caso.estado === 'cerrado') {
      push('proyecto.editar', { patch: { estado: 'instalacion' } }, revisor, fecha(9, 9, 10))
    }
    if (caso.estado === 'cerrado') {
      push('proyecto.editar', { patch: { estado: 'cerrado' } }, autor, fecha(23, 18, 45))
    }

  }

  // el registro se guarda en orden cronológico: es como se lee y como se
  // vuelve a aplicar al arrancar
  return salida.sort((a, b) => a.ts.localeCompare(b.ts))
}
