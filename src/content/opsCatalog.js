/**
 * La mitad del catálogo que NO sale de la oficina.
 *
 * Nota interna del instalador, canal por el que se consigue y proveedores
 * sugeridos. Vive aparte de `catalog.js` por una razón concreta: el catálogo
 * para clientes importa solo el público, así que este archivo nunca entra al
 * bundle que se publica. La nota de que un aparato "tiene app fea" o de que
 * hay que revisar la chalupa antes de cotizar es conversación de taller.
 *
 * canal — retail (se compra ya, en piso o en línea)
 *         distribuidor (hay que abrir cuenta mayorista)
 *         importacion (no hay canal formal en México todavía)
 */

/* ── proveedores con los que trabajamos hoy ───────────────────────
   La lista es corta a propósito: son los cuatro donde de verdad
   sabemos tiempos, garantía y a quién llamarle si algo sale mal.
   Cuando se abra cuenta con un distribuidor formal, se agrega aquí. */
export const PROVEEDORES = [
  {
    id: 'amazon',
    nombre: 'Amazon México',
    tipo: 'Marketplace',
    entrega: '1–3 días en CDMX',
    nota: 'El default para marca conocida. Devolución sin pelear, que es lo que lo hace útil cuando un aparato sale malo en obra.',
    ojo: 'Verificar que el vendedor sea Amazon y no un tercero: en tercero la garantía se vuelve un trámite.',
    buscar: (q) => `https://www.amazon.com.mx/s?k=${encodeURIComponent(q)}`,
    sitio: 'https://www.amazon.com.mx',
  },
  {
    id: 'ml',
    nombre: 'MercadoLibre',
    tipo: 'Marketplace',
    entrega: '1–4 días, mismo día en zona centro',
    nota: 'Donde aparece lo que Amazon México no trae, sobre todo Aqara y SwitchBot. Precios se mueven semana a semana.',
    ojo: 'Filtrar por vendedor con reputación verde y revisar que sea versión global, no la china con app aparte.',
    buscar: (q) => `https://listado.mercadolibre.com.mx/${encodeURIComponent(q.trim().replace(/\s+/g, '-').toLowerCase())}`,
    sitio: 'https://www.mercadolibre.com.mx',
  },
  {
    id: 'unit',
    nombre: 'Unit Electronics',
    tipo: 'Tienda de electrónica · CDMX',
    entrega: 'Mostrador el mismo día · Rep. del Salvador, Centro',
    nota: 'Para lo que se resuelve el mismo día: módulos, fuentes, cable, conectores, herramienta. Cuando falta una pieza en obra, es la que salva la instalación.',
    ojo: 'No manejan marca de casa inteligente terminada. Aquí se compra el material, no el producto.',
    buscar: (q) => `https://uelectronics.com/?s=${encodeURIComponent(q)}&post_type=product`,
    sitio: 'https://uelectronics.com',
  },
  {
    id: 'ag',
    nombre: 'AG Electrónica',
    tipo: 'Tienda de electrónica · CDMX',
    entrega: 'Mostrador el mismo día · Centro',
    nota: 'La otra mitad del Centro. Buen inventario de componente, fuente y sensor suelto, y tienen catálogo en línea con número de parte.',
    ojo: 'Se busca por número de parte más que por nombre comercial.',
    buscar: (q) => `https://www.agelectronica.com/resultados?busca=${encodeURIComponent(q)}`,
    sitio: 'https://www.agelectronica.com',
  },
]

export const PROVEEDOR_BY_ID = Object.fromEntries(PROVEEDORES.map((p) => [p.id, p]))

export const CANALES = {
  retail: { label: 'Retail', hint: 'Se compra ya, sin cuenta ni trámite' },
  distribuidor: { label: 'Distribuidor', hint: 'Requiere cuenta mayorista' },
  importacion: { label: 'Importación', hint: 'Sin canal formal en México todavía' },
}

/**
 * Nota interna + canal, por id de dispositivo.
 *
 * `prov` solo se escribe cuando la regla por default se equivoca: las tiendas
 * del Centro sirven para material y módulo suelto, no para una cerradura Yale.
 */
export const OPS = {
  /* ── Iluminación ── */
  'hue-a19': { canal: 'retail', note: 'El estándar de oro en color y consistencia. Necesita el Bridge, que a cambio te da Zigbee para toda la casa.' },
  'hue-bridge': { canal: 'retail', note: 'Expone todo Hue como Matter. Sin él los focos Hue no llegan al ecosistema.' },
  'nanoleaf-shapes': { canal: 'retail', note: 'El muro que se lleva todas las fotos. Thread nativo, así que además repite la malla.' },
  'nanoleaf-lines': { canal: 'retail', note: 'Luz indirecta sobre muro. Más discreto que Shapes para sala formal.' },
  'nanoleaf-essentials': { canal: 'retail', note: 'El foco Thread más barato que aguanta. Cada uno que instalas engorda la malla.' },
  'lifx-color': { canal: 'retail', note: 'El más brillante del mercado (1600 lm). WiFi: no cuentes con él para la malla.' },
  'hue-lightstrip': { canal: 'retail', note: 'Bajo gabinete de cocina y detrás de la tele. Extensible por metro.' },
  'govee-strip': { canal: 'retail', note: 'Alternativa económica a Hue. RGBIC real, app fea pero con Matter no la abres.' },
  'hue-downlight': { canal: 'distribuidor', note: 'Para plafón de tablaroca. Requiere corte y electricista.' },
  'hue-gradient': { canal: 'retail', note: 'Sincroniza con lo que se ve en pantalla. Necesita Hue Sync Box para HDMI.' },
  'wiz-a19': { canal: 'retail', note: 'La opción de volumen cuando el presupuesto manda. Misma casa que Hue, otra liga.' },
  'aqara-t1m': { canal: 'importacion', note: 'Plafón con anillo RGB. Sustituye la luminaria completa; se ve integrado.' },
  'hue-outdoor': { canal: 'distribuidor', note: 'Bajo voltaje, IP65. Para iluminar fachada y árboles.' },

  /* ── Interruptores y dimmers ── */
  'lutron-diva': { canal: 'importacion', note: 'El único dimmer que funciona SIN neutro y sin zumbido. Requiere Smart Bridge propio.' },
  'lutron-bridge': { canal: 'importacion', note: 'Obligatorio para Caséta. La versión Pro es la que abre API local para Home Assistant.' },
  'inovelli-blue': { canal: 'importacion', note: 'Barra LED de notificación en el propio apagador. Requiere neutro.' },
  'shelly-dimmer': { canal: 'distribuidor', prov: ['ml', 'unit', 'amazon'], note: 'Va DENTRO de la caja del apagador: conserva el apagador que ya te gusta. Sin neutro.' },
  'shelly-1mini': { canal: 'distribuidor', prov: ['ml', 'unit', 'ag'], note: 'El comodín: mete cualquier circuito tonto al sistema por 400 pesos.' },
  'aqara-h1': { canal: 'importacion', note: 'Versión con y sin neutro. Caja europea: revisar chalupa antes de cotizar.' },
  'aqara-cube': { canal: 'importacion', note: 'Control por gestos. Divertido en demo; en la vida real solo lo usan los entusiastas.' },
  'friends-fob': { canal: 'importacion', note: 'Sin pila y sin cable: genera su energía al presionarse. Se pega sobre muro.' },
  'thirdreality-switch': { canal: 'retail', note: 'Lo más barato que sí dura. Para cuartos secundarios.' },

  /* ── Sensores ── */
  'aqara-fp2': { canal: 'importacion', note: 'mmWave: detecta que estás aunque estés quieto leyendo. Cambia por completo la automatización de luces.' },
  'aqara-fp300': { canal: 'importacion', note: 'mmWave de pila, sin cable. Ideal donde no hay contacto cerca.' },
  'eve-motion': { canal: 'importacion', note: 'PIR clásico con luz y temperatura. Pila de dos años, sin nube.' },
  'aqara-p2': { canal: 'importacion', note: 'Contacto Thread. Puerta principal, corrediza del balcón y ventanas de planta baja.' },
  'aqara-th': { canal: 'importacion', note: 'El que dispara el extractor del baño por humedad real y no por timer.' },
  'aqara-leak': { canal: 'importacion', note: 'Bajo tarja, lavadora y boiler. El dispositivo con mejor retorno de toda la casa.' },
  'firstalert-smoke': { canal: 'importacion', note: 'Reemplaza el detector cableado existente. Revisar norma local antes de sustituir.' },
  'thirdreality-vibration': { canal: 'retail', note: 'Avisa cuando termina la lavadora o si alguien mueve la caja fuerte.' },
  'aqara-tvoc': { canal: 'importacion', note: 'Calidad de aire con pantalla e-ink. Buen disparador para el purificador.' },

  /* ── Acceso y seguridad ── */
  'yale-assure2': { canal: 'distribuidor', note: 'Teclado, llave física de respaldo y Thread. Medir espesor y preparación de puerta.' },
  'nuki-4': { canal: 'importacion', note: 'Se monta SOBRE la cerradura existente: la opción para quien renta y no puede hacer obra.' },
  'ultraloq-bolt': { canal: 'importacion', note: 'Huella + código + app. Mejor precio-función del segmento.' },
  'aqara-g4': { canal: 'importacion', note: 'Funciona con pilas o con el transformador del timbre viejo. Graba local en microSD.' },
  'reolink-doorbell': { canal: 'retail', note: 'Cableado PoE: cero pilas y cero nube. Requiere correr cable hasta el rack.' },
  'switchbot-keypad': { canal: 'retail', note: 'Teclado exterior con cámara para la cerradura. Códigos temporales para servicio.' },
  'aqara-hub-m3': { canal: 'importacion', note: 'Zigbee + Thread + border router + sirena + IR. El puente que más cubre por su precio.' },

  /* ── Cámaras ── */
  'reolink-810a': { canal: 'retail', note: 'Exterior, zoom óptico, detección de persona/coche. Va al NVR, no a la nube.' },
  'reolink-nvr': { canal: 'retail', note: 'Grabación local. Va en el rack con el UPS: sin corriente no sirve de nada.' },
  'unifi-g5': { canal: 'distribuidor', note: 'Si la casa ya lleva red UniFi, es la opción coherente. Necesita un host Protect.' },
  'eufy-indoor': { canal: 'retail', note: 'Interior con seguimiento. Sin suscripción obligatoria; ojo con la política de privacidad.' },
  'aqara-g5pro': { canal: 'importacion', note: 'Cámara + hub Zigbee/Thread en un solo aparato. HomeKit Secure Video.' },
  'logitech-view': { canal: 'importacion', note: 'Solo Apple, pero es la mejor integración de HomeKit Secure Video que existe.' },

  /* ── Clima ── */
  'ecobee-premium': { canal: 'importacion', note: 'Para casa con calefacción/central. En la mayoría de las casas en México no aplica.' },
  'sensibo-air': { canal: 'importacion', note: 'ESTE sí aplica en México: hace inteligente cualquier minisplit por infrarrojo.' },
  'tado-ac': { canal: 'importacion', note: 'Alternativa a Sensibo. Mejor app, geocerca más confiable.' },
  'broadlink-rm4': { canal: 'retail', prov: ['ml', 'amazon', 'unit'], note: 'IR + RF genérico. La opción barata para minisplit, tele vieja y ventilador de techo.' },
  'levoit-core': { canal: 'retail', note: 'Se automatiza con el sensor de calidad de aire. En CDMX se justifica solo.' },
  'aqara-fan': { canal: 'importacion', prov: ['ml', 'unit', 'ag'], note: 'Va dentro del dosel del ventilador. Verificar que el motor sea de velocidad por capacitor.' },

  /* ── Cortinas y persianas ── */
  'switchbot-roller': { canal: 'retail', note: 'Persiana completa a medida con motor incluido. Se pide con las medidas del vano.' },
  'switchbot-curtain3': { canal: 'retail', note: 'Se monta sobre el riel que ya tienes. Sin obra, reversible. Requiere Hub Mini para Matter.' },
  'somfy-roll': { canal: 'distribuidor', note: 'Grado profesional, silencioso. Necesita puente RTS o TaHoma para integrarse.' },
  'aqara-driver-e1': { canal: 'importacion', note: 'Riel motorizado por batería recargable. Buena relación precio-ruido.' },
  'ikea-fyrtur': { canal: 'retail', note: 'Blackout, medidas fijas. La entrada más barata a persiana motorizada.' },

  /* ── Energía ── */
  'eve-energy': { canal: 'importacion', note: 'Contacto con medición de consumo. Cada uno es también un repetidor Thread.' },
  'meross-plug': { canal: 'retail', note: 'El de volumen. Clavija tipo americano, sirve tal cual en México.' },
  'shelly-em': { canal: 'distribuidor', prov: ['ml', 'unit', 'ag'], note: 'Medición trifásica en el centro de carga. Para casas con paneles solares.' },
  'apc-ups': { canal: 'retail', note: 'Rack, módem y NVR. Sin UPS, un apagón de dos minutos te tira toda la casa.' },
  'thirdreality-plug': { canal: 'retail', note: 'Repetidor Zigbee barato. Se ponen tres y la malla Zigbee deja de dar problemas.' },

  /* ── Agua y riego ── */
  'moen-flo': { canal: 'importacion', note: 'Corta el agua de toda la casa al detectar fuga. Instalación de plomero, no de técnico.' },
  'aqara-valve': { canal: 'importacion', note: 'Se monta sobre la llave de paso existente. Reversible, sin cortar tubería.' },
  'rachio-3': { canal: 'importacion', note: 'Riega según pronóstico. Se paga solo en jardín grande.' },
  'netro-pixie': { canal: 'importacion', note: 'Para macetas de balcón y terraza donde no hay contacto.' },

  /* ── Audio y video ── */
  'sonos-era100': { canal: 'retail', note: 'La referencia de multiroom. Se agrupa por cuarto y suena parejo.' },
  'sonos-arc': { canal: 'retail', note: 'Barra para sala principal. eARC: revisar que la tele lo tenga.' },
  'homepod-mini': { canal: 'retail', note: 'Border router Thread + voz. En casa Apple, el primer aparato que se compra.' },
  'appletv-4k': { canal: 'retail', note: 'Hub principal de Apple Home. La versión con Ethernet es la que trae Thread.' },
  'echo-show8': { canal: 'retail', note: 'Pantalla + border router + Zigbee. El mejor precio por hub del mercado.' },
  'echo-dot': { canal: 'retail', note: 'Voz en cuartos secundarios. Barato y suficiente.' },
  'nest-hub2': { canal: 'retail', note: 'Border router de Google + pantalla de buró. Sensor de sueño incluido.' },
  'hue-syncbox': { canal: 'importacion', note: 'Sincroniza luces con la imagen. Va entre las fuentes HDMI y la tele.' },

  /* ── Hubs y controladores ── */
  'ha-green': { canal: 'importacion', note: 'Servidor local listo para usar. La base de cualquier instalación que deba sobrevivir a la nube.' },
  'ha-yellow': { canal: 'importacion', note: 'Versión de rack con Zigbee integrado y ranura NVMe. Para instalaciones grandes.' },
  'skyconnect': { canal: 'importacion', prov: ['ml', 'amazon', 'unit'], note: 'Dongle USB: da Zigbee y Thread al servidor. Usar extensión USB o mete ruido.' },
  'ikea-dirigera': { canal: 'retail', note: 'Puente Zigbee barato con Matter. Tiene tienda en México, lo que simplifica la logística.' },
  'switchbot-hub2': { canal: 'retail', note: 'Puente Matter para todo SwitchBot + IR + sensor de temperatura.' },

  /* ── Red ── */
  'unifi-u7': { canal: 'distribuidor', note: 'Access point de plafón. Se colocan por mapa de calor, no por corazonada.' },
  'unifi-cloudgw': { canal: 'distribuidor', note: 'Router + controlador. Aquí se crea la VLAN de IoT que aísla los dispositivos.' },
  'unifi-switch8': { canal: 'distribuidor', note: 'Alimenta APs y cámaras por un solo cable. 52W: alcanza para 4 APs.' },
  'tplink-deco': { canal: 'retail', note: 'Mesh de consumo cuando no se puede cablear. Más simple que UniFi, menos control.' },
  'rack-6u': { canal: 'distribuidor', prov: ['unit', 'ag', 'ml'], note: 'Lo que convierte un nido de cables en una instalación entregable. Siempre con ventilación.' },
  'patch-panel': { canal: 'distribuidor', prov: ['unit', 'ag', 'ml'], note: 'Etiquetado por cuarto. Es la diferencia entre dar mantenimiento en 5 minutos o en 2 horas.' },

  /* ── Mascotas ── */
  'petlibro-granary': { canal: 'retail', note: 'Alimentador con cámara y voz grabada. Respaldo de pilas para apagones.' },
  'sureflap-hub': { canal: 'importacion', note: 'Puerta que solo abre a tu mascota por microchip. Requiere corte en puerta o muro.' },
  'petkit-fountain': { canal: 'retail', note: 'Avisa cuando falta agua o toca cambiar filtro.' },
  'tractive-gps': { canal: 'retail', note: 'Suscripción mensual obligatoria. Se integra a HA por API no oficial.' },

  /* ── Electrodomésticos ── */
  'roborock-s8': { canal: 'retail', note: 'Matter solo expone arranque/paro; para limpiar un cuarto específico hay que usar su app.' },
  'lg-thinq': { canal: 'retail', note: 'Matter en modelos 2024 en adelante. Verificar número de modelo antes de prometer.' },
  'midea-minisplit': { canal: 'retail', note: 'Si el cliente va a comprar minisplit nuevo, que sea uno con WiFi de fábrica.' },
  'samsung-frame': { canal: 'retail', note: 'SmartThings de fábrica; funciona como hub Matter. Modo galería cuando está apagada.' },
}

/** Canal por el que se consigue el aparato. */
export const canalDe = (device) => OPS[device.id]?.canal ?? 'retail'

/** La nota que solo lee quien instala. */
export const notaDe = (device) => OPS[device.id]?.note ?? ''

/** Por default, marca terminada se busca en los marketplaces; el material del Centro. */
const POR_CANAL = {
  retail: ['amazon', 'ml'],
  distribuidor: ['ml', 'amazon'],
  importacion: ['amazon', 'ml'],
}

/** Proveedores sugeridos para un dispositivo, en orden de a quién llamar primero. */
export const proveedoresDe = (device) =>
  (OPS[device.id]?.prov ?? POR_CANAL[canalDe(device)]).map((id) => PROVEEDOR_BY_ID[id]).filter(Boolean)

/** Enlaces de búsqueda listos para abrir. Los marketplaces bloquean el
 *  scrapeo automático, pero una búsqueda en el navegador funciona igual. */
export const linksDeCompra = (device) =>
  proveedoresDe(device).map((p) => ({
    ...p,
    url: p.buscar(p.id === 'unit' || p.id === 'ag' ? device.name : `${device.brand} ${device.name}`),
  }))
