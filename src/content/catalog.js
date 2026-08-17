/**
 * Catálogo de producto — la mitad que sí puede ver un cliente.
 *
 * Aquí vive lo que describe al aparato: qué es, qué hace, con qué cerebros
 * sirve, cómo llega a la malla y cuánto cuesta el equipo. Nada de esto es
 * secreto: son datos de ficha técnica y precios de lista.
 *
 * Lo que NO está aquí —la nota interna del instalador, el canal de proveedor,
 * el nivel de mano de obra— vive en `opsCatalog.js`, que solo importa el panel.
 * Es lo mismo que ya hacía `quoteLink.js`: si el módulo público no lo importa,
 * el bundler no lo emite y no viaja al navegador del cliente.
 *
 * ⚠️ Los precios son estimados en MXN con IVA, orden de magnitud a validar
 * contra cotización real. Sirven para armar presupuesto, no para facturar.
 * Revisar cada trimestre: en esta categoría los precios se mueven mucho.
 *
 * eco    — ecosistemas donde funciona nativo (sin puente extra)
 * link   — cómo llega a la malla: thread | wifi | zigbee | zwave | poe |
 *          ble | cable | matter (Matter over WiFi genérico)
 * power  — corriente | pila | poe | cableado (requiere electricista)
 * tier   — esencial | casa | medida (en qué paquete lo metemos)
 * pitch  — la frase que lee el cliente. Qué gana él, no qué protocolo habla.
 * detalle — el párrafo de abajo: qué hace, qué necesita y qué NO hace. Lo
 *           último importa más de lo que parece: la mitad de los disgustos
 *           salen de esperar algo que el aparato nunca prometió.
 * propio — lo fabricamos nosotros; el precio se cierra con el cliente
 * luz    — fotometría, para simular la iluminación en el plano 3D:
 *          { lm, k, haz, forma }
 *            lm    lúmenes que entrega la pieza completa
 *            k     temperatura de color en kelvin — [min, max] si es ajustable
 *            haz   apertura del haz en grados (180 = reparte a todos lados)
 *            forma punto | lineal | panel — cómo se reparte la luz
 *
 *          ⚠️ Son valores de ficha del fabricante, no medidos con luxómetro.
 *          Sirven para comparar y para que el plano se parezca a la realidad,
 *          no para un cálculo luminotécnico que se firme.
 */

export const CATEGORIES = [
  { id: 'iluminacion', label: 'Iluminación', hint: 'Focos, tiras, paneles y luminarias' },
  { id: 'control', label: 'Interruptores y dimmers', hint: 'Lo que va en la pared' },
  { id: 'sensores', label: 'Sensores', hint: 'Presencia, contacto, fuga, humo' },
  { id: 'acceso', label: 'Acceso y seguridad', hint: 'Cerraduras, timbres, alarma' },
  { id: 'camaras', label: 'Cámaras', hint: 'Interior, exterior y NVR' },
  { id: 'clima', label: 'Clima', hint: 'Termostatos, minisplits, purificación' },
  { id: 'cortinas', label: 'Cortinas y persianas', hint: 'Motores y controladores' },
  { id: 'energia', label: 'Energía', hint: 'Contactos, medición, respaldo' },
  { id: 'agua', label: 'Agua y riego', hint: 'Válvulas, fugas, jardín' },
  { id: 'pantallas', label: 'Pantallas', hint: 'Televisores que además son cerebro de la casa' },
  { id: 'av', label: 'Audio y video', hint: 'Bocinas, barras de sonido, cine' },
  { id: 'hubs', label: 'Hubs y controladores', hint: 'El cerebro y sus puentes' },
  { id: 'red', label: 'Red', hint: 'Access points, switches, rack' },
  { id: 'mascotas', label: 'Mascotas', hint: 'Alimentadores, puertas, fuentes' },
  { id: 'electro', label: 'Electrodomésticos', hint: 'Lo que ya viene con Matter' },
  /* Interiorismo. No es relleno de catálogo: es la mitad de lo que vendemos.
     Una casa llena de sensores y sin nada en los muros se ve a oficina, y el
     cliente lo nota aunque no sepa nombrarlo. Estas piezas hacen que la
     tecnología se lea como parte de la casa y no como una instalación
     encima de ella. */
  { id: 'interiores', label: 'Interiorismo', hint: 'Arte, plantas, tapetes y piezas que hacen habitable lo instalado' },
]

export const ECOSYSTEMS = [
  { id: 'apple', label: 'Apple Home' },
  { id: 'google', label: 'Google Home' },
  { id: 'alexa', label: 'Alexa' },
  { id: 'ha', label: 'Home Assistant' },
]

export const LINKS = ['thread', 'wifi', 'zigbee', 'zwave', 'matter', 'ble', 'poe', 'cable']
export const TIERS = ['esencial', 'casa', 'medida']

/** Cómo se le dice a cada enlace en pantalla. */
export const LINK_LABEL = {
  thread: 'Thread',
  wifi: 'WiFi',
  zigbee: 'Zigbee',
  zwave: 'Z-Wave',
  matter: 'Matter/WiFi',
  ble: 'Bluetooth',
  poe: 'PoE',
  cable: 'Cableado',
}

/** Lo mismo, explicado para quien no tiene por qué saber qué es Thread. */
export const LINK_CLIENTE = {
  thread: 'Se conecta a la malla de la casa y además la refuerza. No usa tu WiFi.',
  zigbee: 'Red propia de bajo consumo, con puente. No satura el WiFi.',
  zwave: 'Red propia de largo alcance, con puente.',
  wifi: 'Se conecta al WiFi de la casa.',
  matter: 'Matter sobre WiFi: entra directo a Apple, Google o Alexa.',
  ble: 'Bluetooth de corto alcance; necesita un puente para salir a internet.',
  poe: 'Un solo cable de red le da datos y corriente.',
  cable: 'Va conectado por cable al rack o al módem.',
}

export const POWER_LABEL = {
  corriente: 'Se enchufa',
  pila: 'De pila',
  poe: 'Cable de red (PoE)',
  cableado: 'Requiere instalación eléctrica',
}

const ALL = ['apple', 'google', 'alexa', 'ha']

export const DEVICES = [
  /* ── Iluminación ─────────────────────────────────────────── */
  { id: 'hue-a19', name: 'Hue White & Color A19', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [1290, 1590], tier: 'casa', luz: { lm: 1100, k: [2000, 6500], haz: 180, forma: 'punto' }, pitch: 'El foco de color que se ve bien de verdad: 16 millones de tonos y blancos que no se ven verdes ni morados. El referente contra el que se comparan todos.' },
  { id: 'hue-bridge', name: 'Hue Bridge Pro', brand: 'Philips Hue', cat: 'hubs', link: 'cable', eco: ALL, power: 'corriente', price: [1490, 1890], tier: 'casa', pitch: 'La cajita que conecta todos tus focos Hue con Apple, Google o Alexa. Se enchufa junto al módem y se olvida.' },
  { id: 'nanoleaf-shapes', name: 'Shapes Hexágonos (kit 9)', brand: 'Nanoleaf', cat: 'iluminacion', link: 'thread', eco: ALL, power: 'corriente', price: [4200, 5400], tier: 'casa', luz: { lm: 900,  k: [1200, 6500], haz: 120, forma: 'panel' }, pitch: 'Paneles hexagonales que se arman como quieras sobre el muro. Es la pieza que todo mundo fotografía cuando entra.' },
  { id: 'nanoleaf-lines', name: 'Lines 60° (kit 9)', brand: 'Nanoleaf', cat: 'iluminacion', link: 'thread', eco: ALL, power: 'corriente', price: [3600, 4600], tier: 'casa', luz: { lm: 1200, k: [1200, 6500], haz: 120, forma: 'lineal' }, pitch: 'Barras de luz que pintan el muro en vez de apuntarte a los ojos. Más sobrio que los hexágonos, para sala formal.' },
  { id: 'nanoleaf-essentials', name: 'Essentials Matter A19', brand: 'Nanoleaf', cat: 'iluminacion', link: 'thread', eco: ALL, power: 'corriente', price: [520, 720], tier: 'esencial', luz: { lm: 800, k: [2700, 6500], haz: 180, forma: 'punto' }, pitch: 'Color y blancos ajustables sin necesitar puente. Cada uno que pones hace más fuerte la red de la casa.' },
  { id: 'lifx-color', name: 'LIFX Color A19 Matter', brand: 'LIFX', cat: 'iluminacion', link: 'matter', eco: ALL, power: 'corriente', price: [890, 1150], tier: 'casa', luz: { lm: 1600, k: [1500, 9000], haz: 180, forma: 'punto' }, pitch: 'El foco inteligente más brillante que existe: 1600 lúmenes. Para cuartos grandes donde los demás se quedan cortos.' },
  { id: 'hue-lightstrip', name: 'Hue Lightstrip Plus 2m', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [1690, 2100], tier: 'casa', luz: { lm: 1600, k: [2000, 6500], haz: 120, forma: 'lineal' }, pitch: 'Tira de luz para bajo gabinete de cocina o detrás de la tele. Se corta a la medida y se alarga por metro.' },
  { id: 'govee-strip', name: 'Govee M1 Matter 5m', brand: 'Govee', cat: 'iluminacion', link: 'matter', eco: ALL, power: 'corriente', price: [900, 1300], tier: 'esencial', luz: { lm: 1500, k: [2200, 6500], haz: 120, forma: 'lineal' }, pitch: 'Cinco metros de tira que puede mostrar varios colores a la vez. La entrada económica a la luz de color.' },
  { id: 'hue-downlight', name: 'Hue Downlight empotrable 6"', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'cableado', price: [1490, 1990], tier: 'medida', luz: { lm: 1100, k: [2200, 6500], haz: 60,  forma: 'punto' }, pitch: 'Luz empotrada en el plafón: no se ve el aparato, solo la luz. Requiere trabajo de plafón y electricista.' },
  { id: 'hue-gradient', name: 'Hue Play Gradient para TV 65"', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [4200, 5200], tier: 'medida', luz: { lm: 1100, k: [2000, 6500], haz: 140, forma: 'lineal' }, pitch: 'La pared detrás de la tele se pinta con los colores de lo que estás viendo, cuadro por cuadro. Cine en casa de verdad.' },
  { id: 'wiz-a19', name: 'WiZ Color A19', brand: 'WiZ (Signify)', cat: 'iluminacion', link: 'matter', eco: ALL, power: 'corriente', price: [320, 450], tier: 'esencial', luz: { lm: 800,  k: [2200, 6500], haz: 180, forma: 'punto' }, pitch: 'Color a precio de foco normal, de la misma casa que hace Hue. Ideal cuando hay que resolver muchos puntos de luz.' },
  { id: 'aqara-t1m', name: 'Aqara Ceiling Light T1M', brand: 'Aqara', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'cableado', price: [2200, 2900], tier: 'casa', luz: { lm: 2000, k: [2700, 6500], haz: 140, forma: 'panel' }, pitch: 'Plafón completo con un anillo de color alrededor. Sustituye la luminaria y queda como si viniera con la casa.' },
  { id: 'hue-outdoor', name: 'Hue Lily spot de jardín (kit 3)', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [6800, 8500], tier: 'medida', luz: { lm: 1920, k: [2000, 6500], haz: 45,  forma: 'punto' }, pitch: 'Spots para iluminar fachada, árboles y camino. Resisten lluvia y sol, y se encienden solos al anochecer.' },

  /* ── Lo que hacemos nosotros ──────────────────────────────
     No se compra: se diseña con el cliente y se fabrica. Por eso el precio
     es uno solo y no un rango — es el punto de partida de esa plática, no
     una lista de la que se elige. */
  { id: 'mx-luz-medida', name: 'Iluminación a la medida', brand: 'Matter México', cat: 'iluminacion', link: 'thread', eco: ALL, power: 'corriente', price: [15000, 15000], tier: 'medida', propio: true, luz: { lm: 2400, k: [1800, 6500], haz: 120, forma: 'lineal' }, pitch: 'Luz hecha para tu espacio, no adaptada a él: se diseña con la medida exacta del nicho, la cornisa o el mueble, y se fabrica aquí. Habla Thread, así que además refuerza la red de la casa.' },

  /* ── Interruptores y dimmers ─────────────────────────────── */
  { id: 'lutron-diva', name: 'Caséta Diva dimmer', brand: 'Lutron', cat: 'control', link: 'ble', eco: ALL, power: 'cableado', price: [1600, 2100], tier: 'casa', pitch: 'El atenuador que nunca zumba ni parpadea, y funciona en instalaciones viejas donde otros no pueden. El estándar de la industria.' },
  { id: 'lutron-bridge', name: 'Caséta Smart Bridge Pro', brand: 'Lutron', cat: 'hubs', link: 'cable', eco: ALL, power: 'corriente', price: [2400, 3000], tier: 'casa', pitch: 'El puente que conecta los apagadores Lutron con el resto de la casa.' },
  { id: 'inovelli-blue', name: 'Blue Series 2-1 dimmer', brand: 'Inovelli', cat: 'control', link: 'zigbee', eco: ALL, power: 'cableado', price: [900, 1200], tier: 'casa', pitch: 'Apagador con una barra de luz que puede avisarte cosas: se puso verde cuando cerró la puerta, rojo si hay una fuga.' },
  { id: 'shelly-dimmer', name: 'Shelly Dimmer 2 (módulo)', brand: 'Shelly', cat: 'control', link: 'wifi', eco: ALL, power: 'cableado', price: [700, 950], tier: 'casa', pitch: 'Se esconde dentro de la caja del apagador: conservas el apagador que combina con tu casa y por dentro ya es inteligente.' },
  { id: 'shelly-1mini', name: 'Shelly 1 Mini Gen4', brand: 'Shelly', cat: 'control', link: 'wifi', eco: ALL, power: 'cableado', price: [320, 480], tier: 'esencial', pitch: 'Del tamaño de una moneda. Vuelve inteligente cualquier cosa que ya esté cableada: el boiler, el portón, la bomba.' },
  { id: 'aqara-h1', name: 'Aqara Switch H1 doble', brand: 'Aqara', cat: 'control', link: 'zigbee', eco: ALL, power: 'cableado', price: [750, 980], tier: 'casa', pitch: 'Apagador doble que se ve limpio en la pared y sigue funcionando como apagador normal aunque se caiga el internet.' },
  { id: 'aqara-cube', name: 'Aqara Cube T1 Pro', brand: 'Aqara', cat: 'control', link: 'zigbee', eco: ['ha'], power: 'pila', price: [520, 700], tier: 'medida', pitch: 'Un cubo que controla la casa según cómo lo gires o lo golpees. Vive en la mesa de centro y es el favorito de las visitas.' },
  { id: 'friends-fob', name: 'Friends of Hue botonera 4', brand: 'Senic / Runa', cat: 'control', link: 'zigbee', eco: ALL, power: 'cableado', price: [2100, 2800], tier: 'medida', pitch: 'Botonera que no lleva pila ni cable: genera su propia energía con el clic. Se pega donde te haga falta un apagador y nunca hubo.' },
  { id: 'thirdreality-switch', name: 'Third Reality Smart Switch', brand: 'Third Reality', cat: 'control', link: 'zigbee', eco: ALL, power: 'cableado', price: [420, 600], tier: 'esencial', pitch: 'Apagador inteligente sin adornos, a buen precio. Para cuartos secundarios y áreas de servicio.' },

  /* ── Sensores ────────────────────────────────────────────── */
  { id: 'aqara-fp2', name: 'Aqara Presence Sensor FP2', brand: 'Aqara', cat: 'sensores', link: 'wifi', eco: ALL, power: 'corriente', price: [1400, 1800], tier: 'casa', pitch: 'Sabe que sigues ahí aunque estés quieto leyendo. Es la diferencia entre que la luz se apague en tu cara y que la casa entienda que no te has ido.' },
  { id: 'aqara-fp300', name: 'Aqara Presence FP300 (Thread)', brand: 'Aqara', cat: 'sensores', link: 'thread', eco: ALL, power: 'pila', price: [1100, 1500], tier: 'casa', pitch: 'La misma detección fina de presencia, pero de pila: se pone donde no hay contacto cerca, sin obra.' },
  { id: 'eve-motion', name: 'Eve Motion (Thread)', brand: 'Eve', cat: 'sensores', link: 'thread', eco: ALL, power: 'pila', price: [1100, 1400], tier: 'casa', pitch: 'Detecta movimiento y mide luz y temperatura. Dos años de pila y nada de sus datos sale de tu casa.' },
  { id: 'aqara-p2', name: 'Aqara Door & Window P2', brand: 'Aqara', cat: 'sensores', link: 'thread', eco: ALL, power: 'pila', price: [620, 850], tier: 'esencial', pitch: 'Avisa si una puerta o ventana quedó abierta. Puerta principal, corrediza del balcón y ventanas de planta baja.' },
  { id: 'aqara-th', name: 'Aqara Temp & Humidity', brand: 'Aqara', cat: 'sensores', link: 'zigbee', eco: ALL, power: 'pila', price: [280, 400], tier: 'esencial', pitch: 'Mide temperatura y humedad de cada cuarto. Es el que hace que el extractor del baño prenda cuando de verdad hace falta.' },
  { id: 'aqara-leak', name: 'Aqara Water Leak Sensor', brand: 'Aqara', cat: 'agua', link: 'zigbee', eco: ALL, power: 'pila', price: [340, 480], tier: 'esencial', pitch: 'Del tamaño de una moneda, va bajo la tarja, la lavadora y el boiler. Te avisa de la fuga la noche que pasa, no cuando ya se cayó el plafón.' },
  { id: 'firstalert-smoke', name: 'Onelink humo + CO', brand: 'First Alert', cat: 'sensores', link: 'wifi', eco: ['apple', 'google', 'alexa'], power: 'cableado', price: [2400, 3200], tier: 'casa', pitch: 'Detector de humo y monóxido que además te manda la alerta al teléfono aunque no estés en casa.' },
  { id: 'thirdreality-vibration', name: 'Third Reality Vibration', brand: 'Third Reality', cat: 'sensores', link: 'zigbee', eco: ALL, power: 'pila', price: [340, 460], tier: 'medida', pitch: 'Avisa cuando algo se movió: que terminó la lavadora, que se abrió el cajón, que alguien tocó la caja fuerte.' },
  { id: 'aqara-tvoc', name: 'Aqara TVOC Air Monitor', brand: 'Aqara', cat: 'clima', link: 'zigbee', eco: ALL, power: 'pila', price: [900, 1200], tier: 'medida', pitch: 'Mide qué tan limpio está el aire del cuarto y lo muestra en su pantalla. En la Ciudad de México, el dato que enciende el purificador solo.' },

  /* ── Acceso y seguridad ──────────────────────────────────── */
  { id: 'yale-assure2', name: 'Yale Assure Lock 2 (Matter)', brand: 'Yale', cat: 'acceso', link: 'thread', eco: ALL, power: 'pila', price: [5900, 7800], tier: 'casa', pitch: 'Entras con código, con el teléfono o con la llave de siempre. Y sabes a qué hora llegaron los niños sin tener que preguntar.' },
  { id: 'nuki-4', name: 'Nuki Smart Lock 4 Pro', brand: 'Nuki', cat: 'acceso', link: 'thread', eco: ALL, power: 'pila', price: [6500, 8500], tier: 'casa', pitch: 'Se monta encima de tu cerradura actual, por dentro: no se cambia nada de la puerta. La opción para quien renta.' },
  { id: 'ultraloq-bolt', name: 'Ultraloq Bolt Mission', brand: 'U-tec', cat: 'acceso', link: 'thread', eco: ALL, power: 'pila', price: [4800, 6200], tier: 'casa', pitch: 'Abre con huella en menos de un segundo. También por código, por app o con llave.' },
  { id: 'aqara-g4', name: 'Aqara Video Doorbell G4', brand: 'Aqara', cat: 'acceso', link: 'wifi', eco: ALL, power: 'pila', price: [1900, 2500], tier: 'esencial', pitch: 'Ves y hablas con quien toca, estés donde estés. Graba en una memoria dentro de tu casa, no en la nube de nadie.' },
  { id: 'reolink-doorbell', name: 'Reolink Video Doorbell PoE', brand: 'Reolink', cat: 'acceso', link: 'poe', eco: ['ha'], power: 'poe', price: [2200, 2900], tier: 'casa', pitch: 'Timbre con cámara conectado por cable: nunca se queda sin pila ni se desconecta. Sin suscripción.' },
  { id: 'switchbot-keypad', name: 'SwitchBot Keypad Vision', brand: 'SwitchBot', cat: 'acceso', link: 'ble', eco: ALL, power: 'pila', price: [1400, 1900], tier: 'medida', pitch: 'Teclado con cámara junto a la puerta. Das un código que sirve solo el martes de 9 a 11 para quien hace la limpieza.' },
  { id: 'aqara-hub-m3', name: 'Aqara Hub M3', brand: 'Aqara', cat: 'hubs', link: 'cable', eco: ALL, power: 'corriente', price: [2200, 2900], tier: 'casa', pitch: 'El cerebro que junta casi todo: habla con los sensores, trae sirena y hasta puede controlar el minisplit por infrarrojo.' },

  /* ── Cámaras ─────────────────────────────────────────────── */
  { id: 'reolink-810a', name: 'Reolink RLC-811A PoE 4K', brand: 'Reolink', cat: 'camaras', link: 'poe', eco: ['ha'], power: 'poe', price: [2600, 3400], tier: 'casa', pitch: 'Cámara de exterior en 4K con zoom real. Distingue si lo que se movió fue una persona, un coche o el perro.' },
  { id: 'reolink-nvr', name: 'Reolink NVR 8ch + 2TB', brand: 'Reolink', cat: 'camaras', link: 'cable', eco: ['ha'], power: 'corriente', price: [5800, 7500], tier: 'casa', pitch: 'La grabadora donde queda el video de todas las cámaras, dentro de tu casa. Semanas de grabación sin pagar mensualidad.' },
  { id: 'unifi-g5', name: 'UniFi Protect G5 Bullet', brand: 'Ubiquiti', cat: 'camaras', link: 'poe', eco: ['ha'], power: 'poe', price: [3900, 5200], tier: 'medida', pitch: 'Cámara de grado profesional que se ve y se administra junto con la red. Para casas que ya llevan equipo UniFi.' },
  { id: 'eufy-indoor', name: 'eufy Indoor Cam S350', brand: 'eufy (Anker)', cat: 'camaras', link: 'wifi', eco: ['alexa', 'google', 'ha'], power: 'corriente', price: [1800, 2400], tier: 'esencial', pitch: 'Cámara de interior que gira y sigue lo que se mueve. Sin suscripción obligatoria.' },
  { id: 'aqara-g5pro', name: 'Aqara Camera Hub G5 Pro', brand: 'Aqara', cat: 'camaras', link: 'wifi', eco: ALL, power: 'corriente', price: [2900, 3800], tier: 'casa', pitch: 'Cámara de exterior que además hace de cerebro para los sensores. Dos aparatos en uno, un solo enchufe.' },
  { id: 'logitech-view', name: 'Logitech Circle View', brand: 'Logitech', cat: 'camaras', link: 'wifi', eco: ['apple'], power: 'corriente', price: [3200, 4200], tier: 'medida', pitch: 'Para casa Apple: el video se guarda cifrado en tu iCloud y solo tú puedes verlo. Trae tapa física para el lente.' },

  /* ── Clima ───────────────────────────────────────────────── */
  { id: 'ecobee-premium', name: 'ecobee Smart Thermostat Premium', brand: 'ecobee', cat: 'clima', link: 'matter', eco: ALL, power: 'cableado', price: [5200, 6800], tier: 'casa', pitch: 'Termostato para casa con sistema central de aire o calefacción. Aprende tus horarios y ajusta solo.' },
  { id: 'sensibo-air', name: 'Sensibo Air Pro', brand: 'Sensibo', cat: 'clima', link: 'wifi', eco: ALL, power: 'corriente', price: [2600, 3400], tier: 'casa', pitch: 'Vuelve inteligente el minisplit que ya tienes, sin cambiarlo. Se apaga solo cuando sales y está frío cuando llegas.' },
  { id: 'tado-ac', name: 'tado° Smart AC Control V3+', brand: 'tado°', cat: 'clima', link: 'wifi', eco: ALL, power: 'corriente', price: [2400, 3100], tier: 'casa', pitch: 'Igual que Sensibo, con una app más cuidada y control por cercanía: el aire se enciende cuando vas de regreso.' },
  { id: 'broadlink-rm4', name: 'BroadLink RM4 Pro', brand: 'BroadLink', cat: 'clima', link: 'wifi', eco: ['ha', 'alexa', 'google'], power: 'corriente', price: [600, 900], tier: 'esencial', pitch: 'Copia los controles remotos que ya tienes: minisplit, tele vieja, ventilador de techo. La forma barata de sumar lo que no es inteligente.' },
  { id: 'levoit-core', name: 'Levoit Core 400S purificador', brand: 'Levoit', cat: 'clima', link: 'matter', eco: ALL, power: 'corriente', price: [3400, 4400], tier: 'medida', pitch: 'Purificador que se enciende solo cuando el aire del cuarto se ensucia. En esta ciudad, se justifica sin discusión.' },
  { id: 'aqara-fan', name: 'Controlador de ventilador de techo', brand: 'Aqara / Sonoff', cat: 'clima', link: 'zigbee', eco: ALL, power: 'cableado', price: [700, 1100], tier: 'casa', pitch: 'Va escondido en el ventilador que ya tienes y le da velocidad y horario desde el teléfono o por voz.' },

  /* ── Cortinas y persianas ────────────────────────────────── */
  { id: 'switchbot-roller', name: 'SwitchBot Roller Shade (Matter)', brand: 'SwitchBot', cat: 'cortinas', link: 'matter', eco: ALL, power: 'corriente', price: [4200, 5600], tier: 'casa', pitch: 'Persiana hecha a la medida de tu ventana, con el motor ya integrado. Abre con el sol y baja a la hora de dormir.' },
  { id: 'switchbot-curtain3', name: 'SwitchBot Curtain 3', brand: 'SwitchBot', cat: 'cortinas', link: 'ble', eco: ALL, power: 'pila', price: [1900, 2600], tier: 'esencial', pitch: 'Se engancha al riel de tus cortinas actuales y las jala solo. Sin obra, sin cambiar nada, y se puede quitar.' },
  { id: 'somfy-roll', name: 'Somfy Roll Up WireFree RTS', brand: 'Somfy', cat: 'cortinas', link: 'cable', eco: ['ha'], power: 'pila', price: [5800, 7800], tier: 'medida', pitch: 'Motor de persiana de grado profesional: prácticamente no se oye. Lo que se pone cuando la persiana está en la recámara.' },
  { id: 'aqara-driver-e1', name: 'Aqara Curtain Driver E1', brand: 'Aqara', cat: 'cortinas', link: 'zigbee', eco: ALL, power: 'pila', price: [1600, 2200], tier: 'casa', pitch: 'Motoriza el riel que ya está puesto. Batería recargable que dura meses.' },
  { id: 'ikea-fyrtur', name: 'IKEA FYRTUR persiana', brand: 'IKEA', cat: 'cortinas', link: 'zigbee', eco: ALL, power: 'pila', price: [2200, 3200], tier: 'esencial', pitch: 'Persiana blackout motorizada al precio más accesible. Viene en medidas fijas: hay que revisar que embone en tu ventana.' },

  /* ── Energía ─────────────────────────────────────────────── */
  { id: 'eve-energy', name: 'Eve Energy (Thread)', brand: 'Eve', cat: 'energia', link: 'thread', eco: ALL, power: 'corriente', price: [900, 1200], tier: 'esencial', pitch: 'Contacto inteligente que además te dice cuánta luz gasta lo que tiene enchufado. Y de paso refuerza la red de la casa.' },
  { id: 'meross-plug', name: 'Meross Smart Plug Matter', brand: 'Meross', cat: 'energia', link: 'matter', eco: ALL, power: 'corriente', price: [280, 420], tier: 'esencial', pitch: 'El contacto inteligente básico y confiable. Lámpara de piso, cafetera, luces del árbol.' },
  { id: 'shelly-em', name: 'Shelly 3EM Gen3 medidor', brand: 'Shelly', cat: 'energia', link: 'wifi', eco: ['ha'], power: 'cableado', price: [1900, 2600], tier: 'medida', pitch: 'Mide el consumo de toda la casa desde el centro de carga. Con paneles solares, te dice cuánto produces y cuánto usas.' },
  { id: 'apc-ups', name: 'APC Back-UPS Pro 1500VA', brand: 'APC', cat: 'energia', link: 'cable', eco: ['ha'], power: 'corriente', price: [4200, 5600], tier: 'casa', pitch: 'La batería que mantiene viva la casa cuando se va la luz: internet, cámaras y cerebro siguen funcionando.' },
  { id: 'thirdreality-plug', name: 'Third Reality Zigbee Plug', brand: 'Third Reality', cat: 'energia', link: 'zigbee', eco: ALL, power: 'corriente', price: [250, 360], tier: 'esencial', pitch: 'Contacto inteligente económico que además repite la señal. Tres de estos repartidos y la casa deja de tener puntos ciegos.' },

  /* ── Agua y riego ────────────────────────────────────────── */
  { id: 'moen-flo', name: 'Moen Flo válvula 1"', brand: 'Moen', cat: 'agua', link: 'wifi', eco: ['alexa', 'google', 'ha'], power: 'corriente', price: [11000, 15000], tier: 'medida', pitch: 'Cierra el agua de toda la casa sola en cuanto detecta una fuga. La diferencia entre un susto y perder los pisos.' },
  { id: 'aqara-valve', name: 'Aqara Water Valve Controller', brand: 'Aqara', cat: 'agua', link: 'zigbee', eco: ALL, power: 'corriente', price: [1900, 2600], tier: 'casa', pitch: 'Se monta sobre la llave de paso que ya está: no se corta tubería. Cierra el agua desde el teléfono o cuando el sensor detecta fuga.' },
  { id: 'rachio-3', name: 'Rachio 3 riego 8 zonas', brand: 'Rachio', cat: 'agua', link: 'wifi', eco: ALL, power: 'corriente', price: [5200, 6800], tier: 'medida', pitch: 'Riega según el clima: si va a llover, no riega. En jardín grande se paga solo en el recibo del agua.' },
  { id: 'netro-pixie', name: 'Netro Pixie riego por batería', brand: 'Netro', cat: 'agua', link: 'wifi', eco: ['ha'], power: 'pila', price: [1900, 2600], tier: 'medida', pitch: 'Riego automático para macetas de balcón y terraza, donde no hay contacto ni toma de jardín.' },

  /* ── Audio y video ───────────────────────────────────────── */
  { id: 'sonos-era100', name: 'Sonos Era 100', brand: 'Sonos', cat: 'av', link: 'wifi', eco: ['apple', 'google', 'alexa'], power: 'corriente', price: [5900, 7200], tier: 'casa', pitch: 'Música por cuarto que se agrupa y suena parejo en toda la casa. La referencia del audio multiroom.' },
  { id: 'sonos-arc', name: 'Sonos Arc Ultra', brand: 'Sonos', cat: 'av', link: 'wifi', eco: ['apple', 'google', 'alexa'], power: 'corriente', price: [21000, 26000], tier: 'medida', pitch: 'Barra de sonido para la sala principal: el sonido rodea sin poner bocinas por todos lados.' },
  { id: 'homepod-mini', name: 'HomePod mini', brand: 'Apple', cat: 'hubs', link: 'thread', eco: ['apple'], power: 'corriente', price: [1999, 2499], tier: 'esencial', pitch: 'Bocina con Siri que además es el corazón de la casa Apple. En casa Apple, es el primer aparato que se compra.' },
  { id: 'appletv-4k', name: 'Apple TV 4K (Wi-Fi + Ethernet)', brand: 'Apple', cat: 'hubs', link: 'thread', eco: ['apple'], power: 'corriente', price: [3499, 4299], tier: 'esencial', pitch: 'Ve series y, al mismo tiempo, es el cerebro que mantiene la casa funcionando cuando no estás.' },
  { id: 'echo-show8', name: 'Echo Show 8 (3ª gen)', brand: 'Amazon', cat: 'hubs', link: 'thread', eco: ['alexa'], power: 'corriente', price: [2499, 3299], tier: 'esencial', pitch: 'Pantalla con Alexa que además hace de cerebro de la casa. La forma más económica de tener las dos cosas.' },
  { id: 'echo-dot', name: 'Echo Dot (5ª gen)', brand: 'Amazon', cat: 'hubs', link: 'wifi', eco: ['alexa'], power: 'corriente', price: [999, 1499], tier: 'esencial', pitch: 'Voz en recámaras y cuartos secundarios, a precio de nada.' },
  { id: 'nest-hub2', name: 'Nest Hub (2ª gen)', brand: 'Google', cat: 'hubs', link: 'thread', eco: ['google'], power: 'corriente', price: [1999, 2699], tier: 'esencial', pitch: 'Pantalla de buró con Google que también es el cerebro de la casa. Mide cómo duermes sin traer nada puesto.' },
  { id: 'hue-syncbox', name: 'Hue Play HDMI Sync Box 8K', brand: 'Philips Hue', cat: 'av', link: 'cable', eco: ALL, power: 'corriente', price: [7500, 9500], tier: 'medida', pitch: 'Hace que todas las luces del cuarto sigan lo que pasa en la pantalla, con cualquier fuente: consola, streaming, lo que sea.' },

  /* ── Pantallas ─────────────────────────────────────────────
     Mucha gente no llega buscando "domótica": llega buscando una tele. Y
     resulta que la tele que ya iba a comprar puede ser el cerebro de la casa
     sin pagar un peso extra. Por eso están en el catálogo: es la conversación
     más fácil de empezar. */
  { id: 'samsung-frame-65', name: 'The Frame 65" (2025)', brand: 'Samsung', cat: 'pantallas', link: 'wifi', eco: ALL, power: 'corriente', price: [26000, 34000], tier: 'medida', pitch: 'Apagada parece un cuadro colgado en el muro, no una pantalla negra. Y de paso es el cerebro de la casa: trae SmartThings con Matter y Thread de fábrica.', detalle: 'El acabado mate y el marco intercambiable son lo que la hacen pasar por cuadro; el modo galería enseña arte cuando no la usas. Como hub controla dispositivos Matter aunque no seas de Samsung, y su Thread border router sirve a los sensores de pila de toda la casa. Ojo: el brillo mate se paga en las escenas oscuras — si lo tuyo es el cine a oscuras, la QN90 se ve mejor.' },
  { id: 'samsung-qn90', name: 'Neo QLED QN90F 65"', brand: 'Samsung', cat: 'pantallas', link: 'wifi', eco: ALL, power: 'corriente', price: [24000, 32000], tier: 'medida', pitch: 'La que se ve bien en una sala con ventanas: mucho brillo y buen contraste. También hace de cerebro de la casa.', detalle: 'Mini-LED con control por zonas, que es lo que le gana al sol de la tarde en una sala clara. Trae SmartThings con Matter y border router Thread, igual que The Frame, pero con mejor imagen y sin el marco decorativo. Para la mayoría de las salas mexicanas —luz de sobra, cortina a medias— esta es la decisión correcta.' },
  { id: 'lg-c5-oled', name: 'OLED evo C5 65"', brand: 'LG', cat: 'pantallas', link: 'wifi', eco: ALL, power: 'corriente', price: [28000, 38000], tier: 'medida', pitch: 'El negro de verdad negro: cada píxel se apaga solo. Para el cuarto donde se ve cine con la luz baja.', detalle: 'OLED con webOS, que integra Matter y funciona como hub ThinQ. Es la mejor imagen de la lista en penumbra y la peor en un cuarto con ventana al poniente — no es un defecto del panel, es cómo funciona el OLED. Si la tele va a estar prendida todo el día con noticieros, mejor la Neo QLED por el desgaste.' },
  { id: 'hisense-u7', name: 'Hisense U7Q 65"', brand: 'Hisense', cat: 'pantallas', link: 'wifi', eco: ['google', 'alexa', 'ha'], power: 'corriente', price: [13000, 18000], tier: 'casa', pitch: 'La opción sensata cuando el presupuesto manda: buena imagen y Google TV integrado, a la mitad del precio de las de arriba.', detalle: 'Mini-LED con Google TV, así que entra a Google Home sin puente y responde a la voz del Nest. No es hub Matter ni border router Thread: para eso hace falta un Nest Hub o un Apple TV aparte. La consideramos cuando la pantalla es para una recámara o un cuarto de tele secundario.' },
  { id: 'appletv-4k-hub', name: 'Apple TV 4K como cerebro', brand: 'Apple', cat: 'pantallas', link: 'thread', eco: ['apple'], power: 'corriente', price: [3499, 4299], tier: 'esencial', pitch: 'Convierte cualquier tele en una pantalla lista para casa inteligente, y es el cerebro de Apple Home. La forma más barata de resolver las dos cosas.', detalle: 'Si ya tienes una tele que te gusta, esto es más barato que cambiarla: le da apps decentes y, sobre todo, hace de hub de Apple Home y de border router Thread. La versión con Ethernet es la que trae Thread — la de Wi-Fi solamente NO. Es el error de compra más común de esta lista.' },

  /* ── Hubs y controladores ────────────────────────────────── */
  { id: 'ha-green', name: 'Home Assistant Green', brand: 'Nabu Casa', cat: 'hubs', link: 'cable', eco: ['ha'], power: 'corriente', price: [2400, 3200], tier: 'casa', pitch: 'El cerebro que corre dentro de tu casa: si se cae el internet, las automatizaciones siguen. Nada depende de la nube de un fabricante.' },
  { id: 'ha-yellow', name: 'Home Assistant Yellow (PoE)', brand: 'Nabu Casa', cat: 'hubs', link: 'poe', eco: ['ha'], power: 'poe', price: [4800, 6500], tier: 'medida', pitch: 'La versión de rack, para casas grandes con muchos dispositivos. Un solo cable de red le da datos y corriente.' },
  { id: 'skyconnect', name: 'Home Assistant Connect ZBT-1', brand: 'Nabu Casa', cat: 'hubs', link: 'cable', eco: ['ha'], power: 'corriente', price: [700, 1000], tier: 'casa', pitch: 'La antena que le permite al cerebro hablar con los sensores de bajo consumo. Pequeña y necesaria.' },
  { id: 'ikea-dirigera', name: 'IKEA DIRIGERA', brand: 'IKEA', cat: 'hubs', link: 'cable', eco: ALL, power: 'corriente', price: [1500, 1990], tier: 'esencial', pitch: 'Puente económico que conecta focos y sensores IKEA con Apple, Google o Alexa. Se consigue aquí mismo, sin importar nada.' },
  { id: 'switchbot-hub2', name: 'SwitchBot Hub 2', brand: 'SwitchBot', cat: 'hubs', link: 'wifi', eco: ALL, power: 'corriente', price: [1200, 1700], tier: 'esencial', pitch: 'Puente para los aparatos SwitchBot que además copia controles remotos y mide temperatura.' },

  /* ── Red ─────────────────────────────────────────────────── */
  { id: 'unifi-u7', name: 'UniFi U7 Pro (WiFi 7)', brand: 'Ubiquiti', cat: 'red', link: 'poe', eco: ['ha'], power: 'poe', price: [3800, 4900], tier: 'casa', pitch: 'Antena de WiFi de plafón, del tipo que usan hoteles y oficinas. Se colocan según dónde falla la señal, no a ojo.' },
  { id: 'unifi-cloudgw', name: 'UniFi Cloud Gateway Ultra', brand: 'Ubiquiti', cat: 'red', link: 'cable', eco: ['ha'], power: 'corriente', price: [3200, 4200], tier: 'casa', pitch: 'El router serio de la casa. Aquí es donde los dispositivos quedan separados de tus computadoras y teléfonos.' },
  { id: 'unifi-switch8', name: 'UniFi Switch Lite 8 PoE', brand: 'Ubiquiti', cat: 'red', link: 'poe', eco: ['ha'], power: 'corriente', price: [2600, 3400], tier: 'casa', pitch: 'Da internet y corriente por un solo cable a antenas y cámaras. Menos enchufes, menos cables colgando.' },
  { id: 'tplink-deco', name: 'TP-Link Deco BE63 (pack 3)', brand: 'TP-Link', cat: 'red', link: 'wifi', eco: ['ha'], power: 'corriente', price: [8500, 11000], tier: 'esencial', pitch: 'WiFi para toda la casa sin abrir muros: tres aparatos que se pasan la señal entre sí.' },
  { id: 'rack-6u', name: 'Rack de pared 6U + organizador', brand: 'Genérico', cat: 'red', link: 'cable', eco: ['ha'], power: 'corriente', price: [2200, 3200], tier: 'casa', pitch: 'El gabinete donde vive todo el equipo, ordenado y ventilado. Es la diferencia entre una instalación y un nido de cables.' },
  { id: 'patch-panel', name: 'Patch panel 12 puertos Cat6', brand: 'Genérico', cat: 'red', link: 'cable', eco: ['ha'], power: 'corriente', price: [700, 1200], tier: 'casa', pitch: 'Todos los cables de la casa llegan aquí, etiquetados por cuarto. Cuando algo falla, se arregla en minutos y no en horas.' },

  /* ── Mascotas ────────────────────────────────────────────── */
  { id: 'petlibro-granary', name: 'PETLIBRO Granary Camera Feeder', brand: 'PETLIBRO', cat: 'mascotas', link: 'wifi', eco: ['alexa', 'google', 'ha'], power: 'corriente', price: [2400, 3200], tier: 'casa', pitch: 'Sirve la comida a su hora, con tu voz grabada llamándolo, y lo ves comer desde el teléfono. Trae pilas para los apagones.' },
  { id: 'sureflap-hub', name: 'SureFlap DualScan + Hub', brand: 'Sure Petcare', cat: 'mascotas', link: 'wifi', eco: ['ha'], power: 'pila', price: [4200, 5600], tier: 'medida', pitch: 'Puerta que reconoce el chip de tu mascota y solo le abre a ella. Ni el gato del vecino ni nada más.' },
  { id: 'petkit-fountain', name: 'PETKIT Eversweet fuente', brand: 'PETKIT', cat: 'mascotas', link: 'wifi', eco: ['alexa', 'google'], power: 'corriente', price: [1400, 1900], tier: 'medida', pitch: 'Agua siempre en movimiento, que es como les gusta beber. Avisa cuando falta agua o toca cambiar el filtro.' },
  { id: 'tractive-gps', name: 'Tractive GPS collar', brand: 'Tractive', cat: 'mascotas', link: 'cable', eco: ['ha'], power: 'pila', price: [1400, 1900], tier: 'medida', pitch: 'Localizador en el collar: si se sale, sabes exactamente dónde está. Requiere plan mensual.' },

  /* ── Electrodomésticos ───────────────────────────────────── */
  { id: 'roborock-s8', name: 'Roborock S8 MaxV Ultra', brand: 'Roborock', cat: 'electro', link: 'matter', eco: ALL, power: 'corriente', price: [24000, 32000], tier: 'medida', pitch: 'Aspira, trapea y se lava y se seca solo en su base. Se puede mandar a limpiar la cocina cuando sales de casa.' },
  { id: 'lg-thinq', name: 'Lavadora LG con ThinQ', brand: 'LG', cat: 'electro', link: 'wifi', eco: ALL, power: 'cableado', price: [16000, 30000], tier: 'medida', pitch: 'Te avisa al teléfono cuando termina el ciclo, para que la ropa no se quede olvidada dentro toda la tarde.' },
  { id: 'midea-minisplit', name: 'Minisplit Midea WiFi inverter', brand: 'Midea', cat: 'clima', link: 'wifi', eco: ['alexa', 'google', 'ha'], power: 'cableado', price: [9000, 16000], tier: 'medida', pitch: 'Si vas a comprar minisplit nuevo, que ya venga conectado de fábrica: sale más barato que hacerlo inteligente después.' },
  { id: 'samsung-frame', name: 'Samsung The Frame 65"', brand: 'Samsung', cat: 'av', link: 'wifi', eco: ALL, power: 'corriente', price: [26000, 36000], tier: 'medida', pitch: 'Apagada parece un cuadro colgado en el muro, no una pantalla negra. Y además funciona como cerebro de la casa.' },

  /* ── interiorismo ──────────────────────────────────────────────
     Lo que se cotiza junto con la instalación, no aparte. El tapete que
     esconde el registro del piso, la planta que tapa el rack, el cuadro que
     va donde iba a quedar el sensor a la vista: cada pieza resuelve algo
     técnico además de verse bien. Eso es lo que estamos vendiendo. */
  { id: 'int-cuadro-serie', name: 'Serie de arte original', brand: 'Matter México', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [3200, 9800], tier: 'medida', propio: true, pitch: 'Tres a cinco piezas de artista mexicano, escogidas para el muro que ya tienes y el tamaño que pide. Se cuelgan el mismo día de la instalación, con la luz de acento ya apuntada.', detalle: 'Trabajamos con ilustradores y pintores de la Ciudad de México. Se escoge en el levantamiento con foto del muro, y el precio depende de la pieza y del formato. La instalación va incluida y queda alineada con el circuito de luz de acento, que es lo que hace que un cuadro se vea colgado en vez de recargado.' },
  { id: 'int-cuadro-marco', name: 'Enmarcado a la medida', brand: 'Matter México', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [850, 2400], tier: 'esencial', propio: true, pitch: 'Para lo que ya tienes y está guardado: marco a medida, montaje y colgado nivelado.', detalle: 'Mucha gente ya tiene arte y lo tiene en un clóset porque enmarcarlo es un trámite. Se resuelve en la misma visita.' },
  { id: 'int-muro-galeria', name: 'Muro de galería', brand: 'Matter México', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [6500, 18000], tier: 'medida', propio: true, pitch: 'La composición completa de un muro: siete a doce piezas, trazo previo en papel y colgado en una sola sesión.', detalle: 'Se entrega el trazo antes de picar pared. Incluye la luz rasante, que es lo que separa un muro de galería de un muro con cuadros colgados.' },
  { id: 'int-monstera', name: 'Monstera deliciosa', brand: 'Vivero', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [780, 1650], tier: 'esencial', pitch: 'La planta de interior de esta década, y con razón: aguanta poca luz, crece rápido y llena un rincón entero.', detalle: 'Va en maceta de barro o cerámica según el espacio. Riego cada 7 a 10 días; es la más perdonadora de las grandes.' },
  { id: 'int-ficus', name: 'Ficus lyrata', brand: 'Vivero', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [1200, 2800], tier: 'casa', pitch: 'El árbol de interior de hoja grande. Da altura donde el techo es alto y ningún mueble alcanza.', detalle: 'Pide luz indirecta abundante, junto a ventana y nunca a pleno sol. Es la más vistosa y la más quisquillosa.' },
  { id: 'int-sansevieria', name: 'Sansevieria', brand: 'Vivero', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [320, 680], tier: 'esencial', pitch: 'La que no se muere. Para baño, pasillo o el rincón sin ventana donde nada más aguanta.', detalle: 'Riego cada 15 a 20 días. Es la que ponemos donde queda el rack o el nodo de red, porque tapa sin pedir mantenimiento.' },
  { id: 'int-pothos', name: 'Potos colgante', brand: 'Vivero', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [280, 620], tier: 'esencial', pitch: 'Cae desde un librero o una repisa alta y suaviza toda la esquina. La más barata de las que se ven caras.' },
  { id: 'int-olivo', name: 'Olivo de interior', brand: 'Vivero', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [1900, 3800], tier: 'casa', pitch: 'Hoja plateada y porte de árbol. Es la pieza que hace que una sala se vea terminada.' },
  { id: 'int-maceta', name: 'Maceta de barro o cerámica', brand: 'Taller mexicano', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [450, 2200], tier: 'esencial', pitch: 'Barro de Oaxaca o cerámica esmaltada, con plato y base para no marcar el piso.', detalle: 'La maceta de plástico del vivero es lo que hace que una planta cara se vea barata. Se cambia siempre.' },
  { id: 'int-tapete-lana', name: 'Tapete de lana', brand: 'Taller mexicano', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [4800, 16000], tier: 'casa', pitch: 'Lana natural tejida en telar, de Teotitlán o Temoaya. Define la sala sin obra y aguanta décadas.', detalle: 'Además del uso obvio: es lo que tapa un registro de piso o un remate de cableado que quedó a la vista. Se mide en el levantamiento con el mobiliario ya puesto, porque un tapete chico encoge el cuarto en vez de definirlo.' },
  { id: 'int-tapete-yute', name: 'Tapete de yute', brand: 'Taller mexicano', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [1800, 5200], tier: 'esencial', pitch: 'Fibra natural, textura gruesa y precio amable. El que funciona debajo de una mesa de centro.' },
  { id: 'int-tapete-lavable', name: 'Tapete lavable', brand: 'Especialidad', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [1400, 4200], tier: 'esencial', pitch: 'Para casa con niños o perro: se levanta y se mete a la lavadora. Delgado, no estorba a la puerta.' },
  { id: 'int-tapete-entrada', name: 'Tapete de entrada', brand: 'Especialidad', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [650, 1800], tier: 'esencial', pitch: 'Bajo perfil para que abra la puerta, y del ancho del claro completo.', detalle: 'Va donde suele ir el sensor de presencia del recibidor: se escogen juntos para que el sensor no lo lea como movimiento.' },
  { id: 'int-basurero-sep', name: 'Basurero de separación', brand: 'Especialidad', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [1600, 4200], tier: 'esencial', pitch: 'Dos o tres compartimentos en un solo mueble, con tapa suave y bolsa oculta. Para que separar no dependa de la voluntad.', detalle: 'La separación falla cuando el segundo bote está lejos. Este resuelve orgánico e inorgánico en el mismo gesto y cabe bajo tarja.' },
  { id: 'int-basurero-sensor', name: 'Basurero con sensor', brand: 'Especialidad', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'pila', price: [1900, 3600], tier: 'casa', pitch: 'Abre solo al acercar la mano. En cocina es donde más se agradece: se abre con las manos llenas o sucias.', detalle: 'De pila, con batería de meses. No es Matter ni pretende serlo: es de las cosas que funcionan mejor sin conectarse a nada.' },
  { id: 'int-basurero-bano', name: 'Basurero de baño con pedal', brand: 'Especialidad', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [420, 1100], tier: 'esencial', pitch: 'Acero o cerámica, tapa amortiguada, del tamaño que de verdad cabe junto al WC.' },
  { id: 'int-cesto-ropa', name: 'Cesto de ropa tejido', brand: 'Taller mexicano', cat: 'interiores', link: 'ninguno', eco: ALL, power: 'ninguna', price: [780, 2400], tier: 'esencial', pitch: 'Palma o mimbre con forro lavable. Para recámara y zotehuela, donde el de plástico se ve de servicio.' },
]

/** Índice por id: el catálogo se consulta mucho por id y `find` en cada render cuesta. */
export const DEVICE_BY_ID = Object.fromEntries(DEVICES.map((d) => [d.id, d]))

/** Precio de referencia del equipo: el punto medio del rango. */
export const refPrice = (d) => Math.round((d.price[0] + d.price[1]) / 2)

/** Resumen para el encabezado del panel y del catálogo público. */
export function catalogStats() {
  const byEco = Object.fromEntries(
    ECOSYSTEMS.map((e) => [e.id, DEVICES.filter((d) => d.eco.includes(e.id)).length]),
  )
  const thread = DEVICES.filter((d) => d.link === 'thread').length
  const avg = Math.round(DEVICES.reduce((a, d) => a + refPrice(d), 0) / DEVICES.length)
  return { total: DEVICES.length, byEco, thread, avg }
}
