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
    mayoreo: 'No publica escalas. Lo más cercano son las promociones de dos piezas y la cuenta de Amazon Business, que a veces enseña precio por volumen en la misma ficha.',
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
    mayoreo: 'No hay escalas. Algunos vendedores publican paquetes de 2, 3 o 4 y ahí está todo el descuento por cantidad que va a haber.',
    nombre: 'MercadoLibre',
    tipo: 'Marketplace',
    entrega: '1–4 días, mismo día en zona centro',
    nota: 'Donde aparece lo que Amazon México no trae, sobre todo Aqara y SwitchBot. Precios se mueven semana a semana.',
    ojo: 'Filtrar por vendedor con reputación verde y revisar que sea versión global, no la china con app aparte.',
    buscar: (q) => `https://listado.mercadolibre.com.mx/${slugML(q)}`,
    sitio: 'https://www.mercadolibre.com.mx',
  },
  {
    id: 'unit',
    mayoreo: 'Sí, y publicadas en la propia ficha: se ven los cortes a 10, 15 y 25 piezas sin pedir cuenta ni cotización. Es el único de la lista que lo enseña abierto.',
    nombre: 'UNIT Electronics',
    tipo: 'Distribuidor oficial Sonoff · CDMX',
    entrega: 'Mostrador el mismo día en el Centro · envío a toda la república',
    nota: 'Distribuidor oficial de Sonoff en México, con la línea completa y precio de lista publicado. Es el primero al que se le pregunta por cualquier pieza Sonoff, y de paso resuelve el material de obra —módulos, fuentes, cable, conectores— el mismo día. También traen las tarjetas Matter/Thread que usamos en el taller de firmware.',
    ojo: 'Precio de lista con IVA, sin cuenta mayorista de por medio; para volumen hay que pedirles cotización aparte. Algunas piezas dicen "consulta en nuestras sucursales": ésas no tienen precio en línea y hay que llamar.',
    buscar: (q) => `https://uelectronics.com/?s=${encodeURIComponent(q)}&post_type=product`,
    sitio: 'https://uelectronics.com',
  },
  {
    id: 'ag',
    mayoreo: 'Tienen lista de mayoreo por número de parte, pero pide cuenta y no está publicada. FALTA abrirla y capturar los cortes.',
    nombre: 'AG Electrónica',
    tipo: 'Tienda de electrónica · CDMX',
    entrega: 'Mostrador el mismo día · Centro',
    nota: 'La otra mitad del Centro. Buen inventario de componente, fuente y sensor suelto, y tienen catálogo en línea con número de parte.',
    ojo: 'Se busca por número de parte más que por nombre comercial.',
    buscar: (q) => `https://www.agelectronica.com/resultados?busca=${encodeURIComponent(q)}`,
    sitio: 'https://www.agelectronica.com',
  },
  {
    id: 'aliexpress',
    mayoreo: 'Baja por cantidad desde piezas sueltas, y por eso sirve para probar. Los cortes de verdad empiezan donde AliExpress termina.',
    nombre: 'AliExpress',
    tipo: 'Importación directa · pieza',
    entrega: '12–25 días con envío estándar · 7–10 con el rápido',
    nota: 'Donde el mismo sensor cuesta un tercio. Sirve para los primeros proyectos y para probar un modelo antes de comprometerse: se piden dos, se instalan, y si aguantan se escala.',
    ojo: 'Verificar que diga Matter en la ficha Y en la caja — hay clones con el logo en la foto y sin certificar. Sin factura no hay deducción, y la garantía es devolver a China: para lo que va empotrado en un muro, no vale la pena ahorrar.',
    buscar: (q) => `https://es.aliexpress.com/w/wholesale-${slugML(q)}.html`,
    sitio: 'https://es.aliexpress.com',
  },
  {
    id: 'alibaba',
    mayoreo: 'Es el único donde el precio es de fábrica y la escala es el trato completo: MOQ, muestra, molde y empaque propio. Aquí la escala no es un descuento, es el modelo.',
    nombre: 'Alibaba',
    tipo: 'Importación por volumen · serie',
    entrega: '30–60 días marítimo · 10–15 aéreo',
    nota: 'Para cuando ya haya pedido en serie. Precio de fábrica, marca propia posible y el fabricante te hace el firmware con tu VID cuando tengas la certificación.',
    ojo: 'Pide muestra ANTES del pedido grande, siempre. Cotiza DDP para que el precio incluya aduana e IVA: en FOB el 16 % más el pedimento aparecen después y se come el margen. Pedido mínimo típico de 100 a 500 piezas.',
    buscar: (q) => `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}`,
    sitio: 'https://www.alibaba.com',
  },
]

export const PROVEEDOR_BY_ID = Object.fromEntries(PROVEEDORES.map((p) => [p.id, p]))

export const CANALES = {
  retail: { label: 'Retail', hint: 'Se compra ya, sin cuenta ni trámite' },
  distribuidor: { label: 'Distribuidor', hint: 'Requiere cuenta mayorista' },
  importacion: { label: 'Importación', hint: 'Sin canal formal en México; se trae directo' },
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

  /* ── Energía ── */
  'enchufe-matter-15a': { canal: 'retail', prov: ['amazon', 'ml'], note: 'Se pide de a cuatro o no sale la cuenta. Certificado Matter de verdad —hay clones con el logo impreso y sin certificar—, así que revisar que la caja traiga el código QR de emparejamiento Matter y no solo un QR de app.' },

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

  'tapo-tc70': { canal: 'retail', note: 'La cámara de entrada de gama. Graba en microSD: cotizar la tarjeta aparte, que es lo que se olvida y luego el cliente descubre que no guardó nada. No es Matter ni entra a Casa de Apple.' },

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

  /* ── Lo propio y las pantallas ── */
  'mx-luz-medida': { canal: 'distribuidor', prov: ['unit', 'ag', 'ml'], note: 'Lo fabricamos nosotros. El precio de lista es el punto de partida: se cierra con el cliente según metros de perfil, óptica y acabado. El material sale del Centro.' },
  'samsung-frame-65': { canal: 'retail', note: 'El marco decorativo va aparte y el cliente casi siempre lo asume incluido: aclararlo en la cotización. El One Connect box pide su propio registro cerca de la tele.' },
  'samsung-qn90': { canal: 'retail', note: 'La que más recomendamos para sala clara. Verificar que el modelo sea del año en curso: los de dos años atrás no traen border router Thread.' },
  'lg-c5-oled': { canal: 'retail', note: 'No la pongas en cuarto con ventana al poniente ni de tele de fondo todo el día. Si el cliente insiste, dejarlo por escrito.' },
  'hisense-u7': { canal: 'retail', note: 'No es hub Matter ni border router: si es la única pantalla de la casa, hay que sumar un Nest Hub o Apple TV al presupuesto.' },
  'appletv-4k-hub': { canal: 'retail', note: 'SOLO el modelo con Ethernet trae Thread. Es el error de compra más frecuente; conviene comprarlo nosotros y no dejar que lo traiga el cliente.' },

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
  importacion: ['aliexpress', 'ml', 'amazon'],
}

/* Marcas con distribuidor formal en México. A ésas no se les busca en un
   marketplace primero: se le pregunta a quien las distribuye, que es quien
   tiene precio de lista, existencia real y a quién reclamarle la garantía. */
const DISTRIBUYE = { Sonoff: ['unit', 'ml', 'amazon'] }

/** Proveedores sugeridos para un dispositivo, en orden de a quién llamar primero. */
export const proveedoresDe = (device) =>
  (OPS[device.id]?.prov ?? DISTRIBUYE[device.brand] ?? POR_CANAL[canalDe(device)])
    .map((id) => PROVEEDOR_BY_ID[id])
    .filter(Boolean)

/** Enlaces de búsqueda listos para abrir. Los marketplaces bloquean el
 *  scrapeo automático, pero una búsqueda en el navegador funciona igual. */
/* ── cómo se arma la búsqueda ─────────────────────────────────────
   La versión anterior pegaba marca y nombre tal cual y salían cosas como
   "Philips Hue Hue White & Color A19": la marca repetida porque el nombre ya
   la trae, y un `&` que MercadoLibre convierte en %26 dentro de la ruta y
   rompe el listado. Buscar con eso no devuelve el producto, devuelve ruido.

   Aquí se limpia antes de mandar: se quita la marca si el nombre ya la dice,
   se tiran los símbolos que ningún buscador entiende, y se recorta lo que
   solo tiene sentido en nuestra ficha —"(kit 9)", "2m", "4ª gen"—.  */

const SIMBOLOS = /[&()[\]{}/\\+·—–"'°]/g

/** Palabras que no ayudan a encontrar el producto en una tienda. */
const RELLENO = /\b(kit|pack|paquete|gen|generación|incluye|con)\b/gi

export function consultaDe(device, proveedor) {
  // `busqueda` permite corregir a mano el caso raro donde el nombre comercial
  // no se parece a como lo listan las tiendas
  if (device.busqueda) return device.busqueda

  const marca = (device.brand ?? '').trim()
  let nombre = (device.name ?? '').trim()

  // si el nombre ya empieza con la marca —o con su última palabra— no se repite
  const ultima = marca.split(/\s+/).pop()?.toLowerCase() ?? ''
  const yaLaTrae = nombre.toLowerCase().startsWith(marca.toLowerCase()) ||
    (ultima.length >= 3 && nombre.toLowerCase().startsWith(ultima))

  /* En AG se busca la pieza, no la marca comercial: su catálogo es de
     componente y "Sonoff" no le dice nada. En UNIT es al revés —distribuyen
     marca y su buscador la entiende—, así que ahí la marca ayuda. */
  const conMarca = proveedor === 'ag' ? false : !yaLaTrae

  // el paréntesis se va entero: "(kit 9)" dejaba un "9" suelto que ensucia
  nombre = nombre.replace(/\([^)]*\)/g, ' ').replace(SIMBOLOS, ' ').replace(RELLENO, ' ')
  const q = `${conMarca ? marca : ''} ${nombre}`.replace(/\s+/g, ' ').trim()
  return q
}

/** El slug de MercadoLibre: sin acentos, sin símbolos, con guiones. */
const slugML = (q) =>
  q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

export const linksDeCompra = (device) =>
  proveedoresDe(device).map((p) => ({
    ...p,
    url: p.buscar(consultaDe(device, p.id)),
  }))

/* ── precios que vimos con nuestros ojos ──────────────────────────
   El catálogo trae rangos estimados; esta tabla dice cuáles ya se validaron
   contra la lista de un proveedor, cuánto costaban y cuándo. Existe porque un
   presupuesto armado sobre estimaciones y uno armado sobre precios de lista se
   ven igual en pantalla, y solo uno se sostiene frente al cliente.

   Cuando UNIT abra su API esto se llena solo; mientras tanto se captura a
   mano y se anota la fecha, que es lo que permite saber cuándo ya envejeció. */
export const PRECIOS_VISTOS = {
  'sonoff-zbmini-l2': { prov: 'unit', precio: 221, como: 'ZBMINIL2 Interruptor Extreme Zigbee Sin Neutro', visto: '2026-08-22' },
  'sonoff-m5': { prov: 'unit', precio: [311, 359], como: 'SwitchMan M5-120 US C2 y C3', visto: '2026-08-22' },
  'sonoff-t6-120m': { prov: 'unit', precio: [352, 373], como: 'T6-120M 1C y 2C táctil Wi-Fi Matter', visto: '2026-08-22' },
  'sonoff-nspanel-pro': { prov: 'unit', precio: [2074, 2374], como: 'NSPanel Pro Panel de Control Inteligente', visto: '2026-08-22' },
  'sonoff-snzb-02p': { prov: 'unit', precio: 192, como: 'SNZB-02P Sensor de Humedad y Temperatura Zigbee', visto: '2026-08-22' },
  'sonoff-garage': { prov: 'unit', precio: 174, como: 'SwitchMan 5V Interruptor WiFi Cerradura Portón', visto: '2026-08-22' },

  /* Amazon México. Aquí el precio depende del tamaño del paquete más que de
     la marca: el foco Matter cuesta 158 comprado de a dos y 95 de a seis, y
     esa diferencia decide una casa entera. El rango dice eso, no una
     incertidumbre. */
  'orein-a19-matter': { prov: 'amazon', precio: [95, 158], como: 'Orein Matter Focos Inteligentes — 95 en pack de 6, 118 de 4, 158 de 2', visto: '2026-08-22' },
  'enchufe-matter-15a': { prov: 'amazon', precio: [157, 212], como: 'Matter Smart Plug Mini 15 A pack de 4 — 212 el Linkind de marca', visto: '2026-08-22' },
  'tapo-tc70': { prov: 'amazon', precio: 499, como: 'Tapo TP-Link TC70 360° 1080p', visto: '2026-08-22' },
  'sonoff-minir4m': { prov: 'amazon', precio: [274, 372], como: 'SONOFF Matter Smart Switch mini DIY — 274 en promoción de 2, 372 de lista', visto: '2026-08-22' },
  'shelly-1mini': { prov: 'amazon', precio: 440, como: 'Shelly 1 Mini Gen4 Matter, Zigbee y Wi-Fi, 8 A', visto: '2026-08-22' },
  'aqara-th': { prov: 'amazon', precio: 664, como: 'Aqara Zigbee sensor de temperatura y humedad', visto: '2026-08-22' },
  'aqara-g5pro': { prov: 'amazon', precio: 4175, como: 'Aqara Hub cámara 4MP G5 Pro exterior', visto: '2026-08-22' },
  'ultraloq-bolt': { prov: 'amazon', precio: [2618, 3213], como: 'ULTRALOQ Bolt SE Matter — 3213 la de huella WiFi', visto: '2026-08-22' },
}

/** Si el precio ya se validó contra una lista de proveedor, con quién y cuándo. */
export const precioVisto = (device) => PRECIOS_VISTOS[device.id] ?? null

/* ── lo que cuesta según cuántas se pidan ─────────────────────────
   El precio de una pieza no es un número, es una escala. El SwitchMan M5-120
   cuesta 311 sueltas y 255 si se piden 25 —dieciocho por ciento— y esa
   diferencia no aparece en ninguna cotización nuestra porque hoy compramos de
   a una. Anotar la escala es el primer paso para dejar de hacerlo.

   Cada corte es { desde, precio }: el precio unitario a partir de esa
   cantidad. `iva` dice si el número ya lo trae —en tienda mexicana casi
   siempre sí, pero en una lista de mayoreo casi nunca, y confundirlo mueve el
   dieciséis por ciento del análisis—. Cuando no se sabe, se dice 'por
   confirmar' y no se adivina.

   ⚠️ Capturado a mano de la ficha del proveedor. Cuando UNIT abra su API esto
   se llena solo; mientras tanto, la fecha es lo que dice si ya envejeció. */
export const ESCALAS = {
  'sonoff-m5': {
    prov: 'unit',
    sku: 'AR4333',
    variante: '2 CH',
    iva: 'por confirmar',
    visto: '2026-08-24',
    cortes: [
      { desde: 1, precio: 311.0 },
      { desde: 10, precio: 289.76 },
      { desde: 15, precio: 271.35 },
      { desde: 25, precio: 255.15 },
    ],
    nota: 'Existencia en las cuatro sucursales en cero: sale de bodega, no de mostrador. Para obra de un día eso importa más que el precio.',
  },

  /* En Amazon la escala no viene por cantidad sino por tamaño de paquete, que
     es la misma idea con otro nombre: el foco cuesta 158 comprado de a dos y
     95 de a seis. */
  'orein-a19-matter': {
    prov: 'amazon',
    iva: 'incluido',
    visto: '2026-08-24',
    cortes: [
      { desde: 2, precio: 157.52 },
      { desde: 4, precio: 118.45 },
      { desde: 6, precio: 94.64 },
    ],
    nota: 'El de seis estaba en oferta Prime: la lista es 729 el paquete, o sea 121.50 el foco. La escala real hay que leerla contra 121.50, no contra 94.64.',
  },
}

/** Los cortes de precio por cantidad de un aparato, si se conocen. */
export const escalasDe = (device) => ESCALAS[device.id] ?? null

/**
 * Cuánto costaría la pieza si pidiéramos `cantidad`.
 *
 * Devuelve el corte que aplica, no una interpolación: los proveedores no
 * interpolan, cobran el escalón.
 */
export function precioPorCantidad(device, cantidad = 1) {
  const e = ESCALAS[device.id]
  if (!e) return null
  const corte = [...e.cortes].reverse().find((c) => cantidad >= c.desde) ?? e.cortes[0]
  return { ...corte, prov: e.prov, iva: e.iva, ahorro: e.cortes[0].precio - corte.precio }
}

/* ── de dónde sale de verdad ──────────────────────────────────────
   Un aparato de Amazon o de UNIT ya pasó por dos o tres manos: alguien lo
   fabricó, alguien lo importó y alguien lo puso en un anaquel. Saber en qué
   escalón compramos nosotros es lo que decide si el equipo deja margen o solo
   pasa por nuestras manos al mismo precio.

   Los precios de fábrica son de listado público en Alibaba y NO son una
   cotización: sirven para dimensionar la brecha, no para cerrar un pedido. */
export const RAIZ = {
  'sonoff-m5': {
    fabrica: 'ITEAD / SONOFF (Shenzhen)',
    fob: [10.9, 13.5],
    moneda: 'USD',
    moq: '1–5 piezas en listado; 10,000 para empaque propio',
    fuente: 'listados de Alibaba, 2026-08-24',
    ojo: 'SONOFF tiene programa de distribuidor propio. Antes de ir a un intermediario de Alibaba conviene tocar la puerta de la marca.',
  },
  'orein-a19-matter': {
    fabrica: 'Sin marca — OREIN es marca de vendedor, no de fábrica',
    fob: [2.68, 4.5],
    moneda: 'USD',
    moq: '2 a 1,000 piezas según proveedor',
    fuente: 'listados de Alibaba para foco inteligente 9 W, 2026-08-24',
    ojo: 'El rango bajo es de foco Tuya sin certificar. Matter certificado cuesta más y hay clones con el logo impreso: la certificación se pide por número de VID/PID, no por foto.',
  },
}

export const raizDe = (device) => RAIZ[device.id] ?? null
