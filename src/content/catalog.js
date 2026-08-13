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
  { id: 'av', label: 'Audio y video', hint: 'Bocinas, pantallas, cine' },
  { id: 'hubs', label: 'Hubs y controladores', hint: 'El cerebro y sus puentes' },
  { id: 'red', label: 'Red', hint: 'Access points, switches, rack' },
  { id: 'mascotas', label: 'Mascotas', hint: 'Alimentadores, puertas, fuentes' },
  { id: 'electro', label: 'Electrodomésticos', hint: 'Lo que ya viene con Matter' },
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
  { id: 'hue-a19', name: 'Hue White & Color A19', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [1290, 1590], tier: 'casa', pitch: 'El foco de color que se ve bien de verdad: 16 millones de tonos y blancos que no se ven verdes ni morados. El referente contra el que se comparan todos.' },
  { id: 'hue-bridge', name: 'Hue Bridge Pro', brand: 'Philips Hue', cat: 'hubs', link: 'cable', eco: ALL, power: 'corriente', price: [1490, 1890], tier: 'casa', pitch: 'La cajita que conecta todos tus focos Hue con Apple, Google o Alexa. Se enchufa junto al módem y se olvida.' },
  { id: 'nanoleaf-shapes', name: 'Shapes Hexágonos (kit 9)', brand: 'Nanoleaf', cat: 'iluminacion', link: 'thread', eco: ALL, power: 'corriente', price: [4200, 5400], tier: 'casa', pitch: 'Paneles hexagonales que se arman como quieras sobre el muro. Es la pieza que todo mundo fotografía cuando entra.' },
  { id: 'nanoleaf-lines', name: 'Lines 60° (kit 9)', brand: 'Nanoleaf', cat: 'iluminacion', link: 'thread', eco: ALL, power: 'corriente', price: [3600, 4600], tier: 'casa', pitch: 'Barras de luz que pintan el muro en vez de apuntarte a los ojos. Más sobrio que los hexágonos, para sala formal.' },
  { id: 'nanoleaf-essentials', name: 'Essentials Matter A19', brand: 'Nanoleaf', cat: 'iluminacion', link: 'thread', eco: ALL, power: 'corriente', price: [520, 720], tier: 'esencial', pitch: 'Color y blancos ajustables sin necesitar puente. Cada uno que pones hace más fuerte la red de la casa.' },
  { id: 'lifx-color', name: 'LIFX Color A19 Matter', brand: 'LIFX', cat: 'iluminacion', link: 'matter', eco: ALL, power: 'corriente', price: [890, 1150], tier: 'casa', pitch: 'El foco inteligente más brillante que existe: 1600 lúmenes. Para cuartos grandes donde los demás se quedan cortos.' },
  { id: 'hue-lightstrip', name: 'Hue Lightstrip Plus 2m', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [1690, 2100], tier: 'casa', pitch: 'Tira de luz para bajo gabinete de cocina o detrás de la tele. Se corta a la medida y se alarga por metro.' },
  { id: 'govee-strip', name: 'Govee M1 Matter 5m', brand: 'Govee', cat: 'iluminacion', link: 'matter', eco: ALL, power: 'corriente', price: [900, 1300], tier: 'esencial', pitch: 'Cinco metros de tira que puede mostrar varios colores a la vez. La entrada económica a la luz de color.' },
  { id: 'hue-downlight', name: 'Hue Downlight empotrable 6"', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'cableado', price: [1490, 1990], tier: 'medida', pitch: 'Luz empotrada en el plafón: no se ve el aparato, solo la luz. Requiere trabajo de plafón y electricista.' },
  { id: 'hue-gradient', name: 'Hue Play Gradient para TV 65"', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [4200, 5200], tier: 'medida', pitch: 'La pared detrás de la tele se pinta con los colores de lo que estás viendo, cuadro por cuadro. Cine en casa de verdad.' },
  { id: 'wiz-a19', name: 'WiZ Color A19', brand: 'WiZ (Signify)', cat: 'iluminacion', link: 'matter', eco: ALL, power: 'corriente', price: [320, 450], tier: 'esencial', pitch: 'Color a precio de foco normal, de la misma casa que hace Hue. Ideal cuando hay que resolver muchos puntos de luz.' },
  { id: 'aqara-t1m', name: 'Aqara Ceiling Light T1M', brand: 'Aqara', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'cableado', price: [2200, 2900], tier: 'casa', pitch: 'Plafón completo con un anillo de color alrededor. Sustituye la luminaria y queda como si viniera con la casa.' },
  { id: 'hue-outdoor', name: 'Hue Lily spot de jardín (kit 3)', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [6800, 8500], tier: 'medida', pitch: 'Spots para iluminar fachada, árboles y camino. Resisten lluvia y sol, y se encienden solos al anochecer.' },

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
