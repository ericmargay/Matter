/**
 * Catálogo de compras.
 *
 * Esta lista está escrita desde la silla de quien levanta el pedido, no desde
 * la de quien escribe el copy: interesa qué protocolo habla, con qué cerebros
 * sirve, de dónde se alimenta, en qué paquete entra y con qué proveedor se
 * consigue en México.
 *
 * ⚠️ Los precios son estimados en MXN con IVA, orden de magnitud a validar
 * contra cotización real. Sirven para armar presupuesto, no para facturar.
 * Revisar cada trimestre: en esta categoría los precios se mueven mucho.
 *
 * eco       — ecosistemas donde funciona nativo (sin puente extra)
 * link      — cómo llega a la malla: thread | wifi | zigbee | zwave | poe |
 *             ble | cable | matter (Matter over WiFi genérico)
 * power     — corriente | pila | poe | cableado (requiere electricista)
 * tier      — esencial | casa | medida (en qué paquete lo metemos)
 * source    — retail (se compra ya) | distribuidor (cuenta mayorista) |
 *             importacion (no hay canal formal en MX todavía)
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

const ALL = ['apple', 'google', 'alexa', 'ha']

export const DEVICES = [
  /* ── Iluminación ─────────────────────────────────────────── */
  { id: 'hue-a19', name: 'Hue White & Color A19', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [1290, 1590], tier: 'casa', source: 'retail', note: 'El estándar de oro en color y consistencia. Necesita el Bridge, que a cambio te da Zigbee para toda la casa.' },
  { id: 'hue-bridge', name: 'Hue Bridge Pro', brand: 'Philips Hue', cat: 'hubs', link: 'cable', eco: ALL, power: 'corriente', price: [1490, 1890], tier: 'casa', source: 'retail', note: 'Expone todo Hue como Matter. Sin él los focos Hue no llegan al ecosistema.' },
  { id: 'nanoleaf-shapes', name: 'Shapes Hexágonos (kit 9)', brand: 'Nanoleaf', cat: 'iluminacion', link: 'thread', eco: ALL, power: 'corriente', price: [4200, 5400], tier: 'casa', source: 'retail', note: 'El muro que se lleva todas las fotos. Thread nativo, así que además repite la malla.' },
  { id: 'nanoleaf-lines', name: 'Lines 60° (kit 9)', brand: 'Nanoleaf', cat: 'iluminacion', link: 'thread', eco: ALL, power: 'corriente', price: [3600, 4600], tier: 'casa', source: 'retail', note: 'Luz indirecta sobre muro. Más discreto que Shapes para sala formal.' },
  { id: 'nanoleaf-essentials', name: 'Essentials Matter A19', brand: 'Nanoleaf', cat: 'iluminacion', link: 'thread', eco: ALL, power: 'corriente', price: [520, 720], tier: 'esencial', source: 'retail', note: 'El foco Thread más barato que aguanta. Cada uno que instalas engorda la malla.' },
  { id: 'lifx-color', name: 'LIFX Color A19 Matter', brand: 'LIFX', cat: 'iluminacion', link: 'matter', eco: ALL, power: 'corriente', price: [890, 1150], tier: 'casa', source: 'retail', note: 'El más brillante del mercado (1600 lm). WiFi: no cuentes con él para la malla.' },
  { id: 'hue-lightstrip', name: 'Hue Lightstrip Plus 2m', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [1690, 2100], tier: 'casa', source: 'retail', note: 'Bajo gabinete de cocina y detrás de la tele. Extensible por metro.' },
  { id: 'govee-strip', name: 'Govee M1 Matter 5m', brand: 'Govee', cat: 'iluminacion', link: 'matter', eco: ALL, power: 'corriente', price: [900, 1300], tier: 'esencial', source: 'retail', note: 'Alternativa económica a Hue. RGBIC real, app fea pero con Matter no la abres.' },
  { id: 'hue-downlight', name: 'Hue Downlight empotrable 6"', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'cableado', price: [1490, 1990], tier: 'medida', source: 'distribuidor', note: 'Para plafón de tablaroca. Requiere corte y electricista.' },
  { id: 'hue-gradient', name: 'Hue Play Gradient para TV 65"', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [4200, 5200], tier: 'medida', source: 'retail', note: 'Sincroniza con lo que se ve en pantalla. Necesita Hue Sync Box para HDMI.' },
  { id: 'wiz-a19', name: 'WiZ Color A19', brand: 'WiZ (Signify)', cat: 'iluminacion', link: 'matter', eco: ALL, power: 'corriente', price: [320, 450], tier: 'esencial', source: 'retail', note: 'La opción de volumen cuando el presupuesto manda. Misma casa que Hue, otra liga.' },
  { id: 'aqara-t1m', name: 'Aqara Ceiling Light T1M', brand: 'Aqara', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'cableado', price: [2200, 2900], tier: 'casa', source: 'importacion', note: 'Plafón con anillo RGB. Sustituye la luminaria completa; se ve integrado.' },
  { id: 'hue-outdoor', name: 'Hue Lily spot de jardín (kit 3)', brand: 'Philips Hue', cat: 'iluminacion', link: 'zigbee', eco: ALL, power: 'corriente', price: [6800, 8500], tier: 'medida', source: 'distribuidor', note: 'Bajo voltaje, IP65. Para iluminar fachada y árboles.' },

  /* ── Interruptores y dimmers ─────────────────────────────── */
  { id: 'lutron-diva', name: 'Caséta Diva dimmer', brand: 'Lutron', cat: 'control', link: 'ble', eco: ALL, power: 'cableado', price: [1600, 2100], tier: 'casa', source: 'importacion', note: 'El único dimmer que funciona SIN neutro y sin zumbido. Requiere Smart Bridge propio.' },
  { id: 'lutron-bridge', name: 'Caséta Smart Bridge Pro', brand: 'Lutron', cat: 'hubs', link: 'cable', eco: ALL, power: 'corriente', price: [2400, 3000], tier: 'casa', source: 'importacion', note: 'Obligatorio para Caséta. La versión Pro es la que abre API local para Home Assistant.' },
  { id: 'inovelli-blue', name: 'Blue Series 2-1 dimmer', brand: 'Inovelli', cat: 'control', link: 'zigbee', eco: ALL, power: 'cableado', price: [900, 1200], tier: 'casa', source: 'importacion', note: 'Barra LED de notificación en el propio apagador. Requiere neutro.' },
  { id: 'shelly-dimmer', name: 'Shelly Dimmer 2 (módulo)', brand: 'Shelly', cat: 'control', link: 'wifi', eco: ALL, power: 'cableado', price: [700, 950], tier: 'casa', source: 'distribuidor', note: 'Va DENTRO de la caja del apagador: conserva el apagador que ya te gusta. Sin neutro.' },
  { id: 'shelly-1mini', name: 'Shelly 1 Mini Gen4', brand: 'Shelly', cat: 'control', link: 'wifi', eco: ALL, power: 'cableado', price: [320, 480], tier: 'esencial', source: 'distribuidor', note: 'El comodín: mete cualquier circuito tonto al sistema por 400 pesos.' },
  { id: 'aqara-h1', name: 'Aqara Switch H1 doble', brand: 'Aqara', cat: 'control', link: 'zigbee', eco: ALL, power: 'cableado', price: [750, 980], tier: 'casa', source: 'importacion', note: 'Versión con y sin neutro. Caja europea: revisar chalupa antes de cotizar.' },
  { id: 'aqara-cube', name: 'Aqara Cube T1 Pro', brand: 'Aqara', cat: 'control', link: 'zigbee', eco: ['ha'], power: 'pila', price: [520, 700], tier: 'medida', source: 'importacion', note: 'Control por gestos. Divertido en demo; en la vida real solo lo usan los entusiastas.' },
  { id: 'friends-fob', name: 'Friends of Hue botonera 4', brand: 'Senic / Runa', cat: 'control', link: 'zigbee', eco: ALL, power: 'cableado', price: [2100, 2800], tier: 'medida', source: 'importacion', note: 'Sin pila y sin cable: genera su energía al presionarse. Se pega sobre muro.' },
  { id: 'thirdreality-switch', name: 'Third Reality Smart Switch', brand: 'Third Reality', cat: 'control', link: 'zigbee', eco: ALL, power: 'cableado', price: [420, 600], tier: 'esencial', source: 'retail', note: 'Lo más barato que sí dura. Para cuartos secundarios.' },

  /* ── Sensores ────────────────────────────────────────────── */
  { id: 'aqara-fp2', name: 'Aqara Presence Sensor FP2', brand: 'Aqara', cat: 'sensores', link: 'wifi', eco: ALL, power: 'corriente', price: [1400, 1800], tier: 'casa', source: 'importacion', note: 'mmWave: detecta que estás aunque estés quieto leyendo. Cambia por completo la automatización de luces.' },
  { id: 'aqara-fp300', name: 'Aqara Presence FP300 (Thread)', brand: 'Aqara', cat: 'sensores', link: 'thread', eco: ALL, power: 'pila', price: [1100, 1500], tier: 'casa', source: 'importacion', note: 'mmWave de pila, sin cable. Ideal donde no hay contacto cerca.' },
  { id: 'eve-motion', name: 'Eve Motion (Thread)', brand: 'Eve', cat: 'sensores', link: 'thread', eco: ALL, power: 'pila', price: [1100, 1400], tier: 'casa', source: 'importacion', note: 'PIR clásico con luz y temperatura. Pila de dos años, sin nube.' },
  { id: 'aqara-p2', name: 'Aqara Door & Window P2', brand: 'Aqara', cat: 'sensores', link: 'thread', eco: ALL, power: 'pila', price: [620, 850], tier: 'esencial', source: 'importacion', note: 'Contacto Thread. Puerta principal, corrediza del balcón y ventanas de planta baja.' },
  { id: 'aqara-th', name: 'Aqara Temp & Humidity', brand: 'Aqara', cat: 'sensores', link: 'zigbee', eco: ALL, power: 'pila', price: [280, 400], tier: 'esencial', source: 'importacion', note: 'El que dispara el extractor del baño por humedad real y no por timer.' },
  { id: 'aqara-leak', name: 'Aqara Water Leak Sensor', brand: 'Aqara', cat: 'agua', link: 'zigbee', eco: ALL, power: 'pila', price: [340, 480], tier: 'esencial', source: 'importacion', note: 'Bajo tarja, lavadora y boiler. El dispositivo con mejor retorno de toda la casa.' },
  { id: 'firstalert-smoke', name: 'Onelink humo + CO', brand: 'First Alert', cat: 'sensores', link: 'wifi', eco: ['apple', 'google', 'alexa'], power: 'cableado', price: [2400, 3200], tier: 'casa', source: 'importacion', note: 'Reemplaza el detector cableado existente. Revisar norma local antes de sustituir.' },
  { id: 'thirdreality-vibration', name: 'Third Reality Vibration', brand: 'Third Reality', cat: 'sensores', link: 'zigbee', eco: ALL, power: 'pila', price: [340, 460], tier: 'medida', source: 'retail', note: 'Avisa cuando termina la lavadora o si alguien mueve la caja fuerte.' },
  { id: 'aqara-tvoc', name: 'Aqara TVOC Air Monitor', brand: 'Aqara', cat: 'clima', link: 'zigbee', eco: ALL, power: 'pila', price: [900, 1200], tier: 'medida', source: 'importacion', note: 'Calidad de aire con pantalla e-ink. Buen disparador para el purificador.' },

  /* ── Acceso y seguridad ──────────────────────────────────── */
  { id: 'yale-assure2', name: 'Yale Assure Lock 2 (Matter)', brand: 'Yale', cat: 'acceso', link: 'thread', eco: ALL, power: 'pila', price: [5900, 7800], tier: 'casa', source: 'distribuidor', note: 'Teclado, llave física de respaldo y Thread. Medir espesor y preparación de puerta.' },
  { id: 'nuki-4', name: 'Nuki Smart Lock 4 Pro', brand: 'Nuki', cat: 'acceso', link: 'thread', eco: ALL, power: 'pila', price: [6500, 8500], tier: 'casa', source: 'importacion', note: 'Se monta SOBRE la cerradura existente: la opción para quien renta y no puede hacer obra.' },
  { id: 'ultraloq-bolt', name: 'Ultraloq Bolt Mission', brand: 'U-tec', cat: 'acceso', link: 'thread', eco: ALL, power: 'pila', price: [4800, 6200], tier: 'casa', source: 'importacion', note: 'Huella + código + app. Mejor precio-función del segmento.' },
  { id: 'aqara-g4', name: 'Aqara Video Doorbell G4', brand: 'Aqara', cat: 'acceso', link: 'wifi', eco: ALL, power: 'pila', price: [1900, 2500], tier: 'esencial', source: 'importacion', note: 'Funciona con pilas o con el transformador del timbre viejo. Graba local en microSD.' },
  { id: 'reolink-doorbell', name: 'Reolink Video Doorbell PoE', brand: 'Reolink', cat: 'acceso', link: 'poe', eco: ['ha'], power: 'poe', price: [2200, 2900], tier: 'casa', source: 'retail', note: 'Cableado PoE: cero pilas y cero nube. Requiere correr cable hasta el rack.' },
  { id: 'switchbot-keypad', name: 'SwitchBot Keypad Vision', brand: 'SwitchBot', cat: 'acceso', link: 'ble', eco: ALL, power: 'pila', price: [1400, 1900], tier: 'medida', source: 'retail', note: 'Teclado exterior con cámara para la cerradura. Códigos temporales para servicio.' },
  { id: 'aqara-hub-m3', name: 'Aqara Hub M3', brand: 'Aqara', cat: 'hubs', link: 'cable', eco: ALL, power: 'corriente', price: [2200, 2900], tier: 'casa', source: 'importacion', note: 'Zigbee + Thread + border router + sirena + IR. El puente que más cubre por su precio.' },

  /* ── Cámaras ─────────────────────────────────────────────── */
  { id: 'reolink-810a', name: 'Reolink RLC-811A PoE 4K', brand: 'Reolink', cat: 'camaras', link: 'poe', eco: ['ha'], power: 'poe', price: [2600, 3400], tier: 'casa', source: 'retail', note: 'Exterior, zoom óptico, detección de persona/coche. Va al NVR, no a la nube.' },
  { id: 'reolink-nvr', name: 'Reolink NVR 8ch + 2TB', brand: 'Reolink', cat: 'camaras', link: 'cable', eco: ['ha'], power: 'corriente', price: [5800, 7500], tier: 'casa', source: 'retail', note: 'Grabación local. Va en el rack con el UPS: sin corriente no sirve de nada.' },
  { id: 'unifi-g5', name: 'UniFi Protect G5 Bullet', brand: 'Ubiquiti', cat: 'camaras', link: 'poe', eco: ['ha'], power: 'poe', price: [3900, 5200], tier: 'medida', source: 'distribuidor', note: 'Si la casa ya lleva red UniFi, es la opción coherente. Necesita un host Protect.' },
  { id: 'eufy-indoor', name: 'eufy Indoor Cam S350', brand: 'eufy (Anker)', cat: 'camaras', link: 'wifi', eco: ['alexa', 'google', 'ha'], power: 'corriente', price: [1800, 2400], tier: 'esencial', source: 'retail', note: 'Interior con seguimiento. Sin suscripción obligatoria; ojo con la política de privacidad.' },
  { id: 'aqara-g5pro', name: 'Aqara Camera Hub G5 Pro', brand: 'Aqara', cat: 'camaras', link: 'wifi', eco: ALL, power: 'corriente', price: [2900, 3800], tier: 'casa', source: 'importacion', note: 'Cámara + hub Zigbee/Thread en un solo aparato. HomeKit Secure Video.' },
  { id: 'logitech-view', name: 'Logitech Circle View', brand: 'Logitech', cat: 'camaras', link: 'wifi', eco: ['apple'], power: 'corriente', price: [3200, 4200], tier: 'medida', source: 'importacion', note: 'Solo Apple, pero es la mejor integración de HomeKit Secure Video que existe.' },

  /* ── Clima ───────────────────────────────────────────────── */
  { id: 'ecobee-premium', name: 'ecobee Smart Thermostat Premium', brand: 'ecobee', cat: 'clima', link: 'matter', eco: ALL, power: 'cableado', price: [5200, 6800], tier: 'casa', source: 'importacion', note: 'Para casa con calefacción/central. En la mayoría de las casas en México no aplica.' },
  { id: 'sensibo-air', name: 'Sensibo Air Pro', brand: 'Sensibo', cat: 'clima', link: 'wifi', eco: ALL, power: 'corriente', price: [2600, 3400], tier: 'casa', source: 'importacion', note: 'ESTE sí aplica en México: hace inteligente cualquier minisplit por infrarrojo.' },
  { id: 'tado-ac', name: 'tado° Smart AC Control V3+', brand: 'tado°', cat: 'clima', link: 'wifi', eco: ALL, power: 'corriente', price: [2400, 3100], tier: 'casa', source: 'importacion', note: 'Alternativa a Sensibo. Mejor app, geocerca más confiable.' },
  { id: 'broadlink-rm4', name: 'BroadLink RM4 Pro', brand: 'BroadLink', cat: 'clima', link: 'wifi', eco: ['ha', 'alexa', 'google'], power: 'corriente', price: [600, 900], tier: 'esencial', source: 'retail', note: 'IR + RF genérico. La opción barata para minisplit, tele vieja y ventilador de techo.' },
  { id: 'levoit-core', name: 'Levoit Core 400S purificador', brand: 'Levoit', cat: 'clima', link: 'matter', eco: ALL, power: 'corriente', price: [3400, 4400], tier: 'medida', source: 'retail', note: 'Se automatiza con el sensor de calidad de aire. En CDMX se justifica solo.' },
  { id: 'aqara-fan', name: 'Controlador de ventilador de techo', brand: 'Aqara / Sonoff', cat: 'clima', link: 'zigbee', eco: ALL, power: 'cableado', price: [700, 1100], tier: 'casa', source: 'importacion', note: 'Va dentro del dosel del ventilador. Verificar que el motor sea de velocidad por capacitor.' },

  /* ── Cortinas y persianas ────────────────────────────────── */
  { id: 'switchbot-roller', name: 'SwitchBot Roller Shade (Matter)', brand: 'SwitchBot', cat: 'cortinas', link: 'matter', eco: ALL, power: 'corriente', price: [4200, 5600], tier: 'casa', source: 'retail', note: 'Persiana completa a medida con motor incluido. Se pide con las medidas del vano.' },
  { id: 'switchbot-curtain3', name: 'SwitchBot Curtain 3', brand: 'SwitchBot', cat: 'cortinas', link: 'ble', eco: ALL, power: 'pila', price: [1900, 2600], tier: 'esencial', source: 'retail', note: 'Se monta sobre el riel que ya tienes. Sin obra, reversible. Requiere Hub Mini para Matter.' },
  { id: 'somfy-roll', name: 'Somfy Roll Up WireFree RTS', brand: 'Somfy', cat: 'cortinas', link: 'cable', eco: ['ha'], power: 'pila', price: [5800, 7800], tier: 'medida', source: 'distribuidor', note: 'Grado profesional, silencioso. Necesita puente RTS o TaHoma para integrarse.' },
  { id: 'aqara-driver-e1', name: 'Aqara Curtain Driver E1', brand: 'Aqara', cat: 'cortinas', link: 'zigbee', eco: ALL, power: 'pila', price: [1600, 2200], tier: 'casa', source: 'importacion', note: 'Riel motorizado por batería recargable. Buena relación precio-ruido.' },
  { id: 'ikea-fyrtur', name: 'IKEA FYRTUR persiana', brand: 'IKEA', cat: 'cortinas', link: 'zigbee', eco: ALL, power: 'pila', price: [2200, 3200], tier: 'esencial', source: 'retail', note: 'Blackout, medidas fijas. La entrada más barata a persiana motorizada.' },

  /* ── Energía ─────────────────────────────────────────────── */
  { id: 'eve-energy', name: 'Eve Energy (Thread)', brand: 'Eve', cat: 'energia', link: 'thread', eco: ALL, power: 'corriente', price: [900, 1200], tier: 'esencial', source: 'importacion', note: 'Contacto con medición de consumo. Cada uno es también un repetidor Thread.' },
  { id: 'meross-plug', name: 'Meross Smart Plug Matter', brand: 'Meross', cat: 'energia', link: 'matter', eco: ALL, power: 'corriente', price: [280, 420], tier: 'esencial', source: 'retail', note: 'El de volumen. Clavija tipo americano, sirve tal cual en México.' },
  { id: 'shelly-em', name: 'Shelly 3EM Gen3 medidor', brand: 'Shelly', cat: 'energia', link: 'wifi', eco: ['ha'], power: 'cableado', price: [1900, 2600], tier: 'medida', source: 'distribuidor', note: 'Medición trifásica en el centro de carga. Para casas con paneles solares.' },
  { id: 'apc-ups', name: 'APC Back-UPS Pro 1500VA', brand: 'APC', cat: 'energia', link: 'cable', eco: ['ha'], power: 'corriente', price: [4200, 5600], tier: 'casa', source: 'retail', note: 'Rack, módem y NVR. Sin UPS, un apagón de dos minutos te tira toda la casa.' },
  { id: 'thirdreality-plug', name: 'Third Reality Zigbee Plug', brand: 'Third Reality', cat: 'energia', link: 'zigbee', eco: ALL, power: 'corriente', price: [250, 360], tier: 'esencial', source: 'retail', note: 'Repetidor Zigbee barato. Se ponen tres y la malla Zigbee deja de dar problemas.' },

  /* ── Agua y riego ────────────────────────────────────────── */
  { id: 'moen-flo', name: 'Moen Flo válvula 1"', brand: 'Moen', cat: 'agua', link: 'wifi', eco: ['alexa', 'google', 'ha'], power: 'corriente', price: [11000, 15000], tier: 'medida', source: 'importacion', note: 'Corta el agua de toda la casa al detectar fuga. Instalación de plomero, no de técnico.' },
  { id: 'aqara-valve', name: 'Aqara Water Valve Controller', brand: 'Aqara', cat: 'agua', link: 'zigbee', eco: ALL, power: 'corriente', price: [1900, 2600], tier: 'casa', source: 'importacion', note: 'Se monta sobre la llave de paso existente. Reversible, sin cortar tubería.' },
  { id: 'rachio-3', name: 'Rachio 3 riego 8 zonas', brand: 'Rachio', cat: 'agua', link: 'wifi', eco: ALL, power: 'corriente', price: [5200, 6800], tier: 'medida', source: 'importacion', note: 'Riega según pronóstico. Se paga solo en jardín grande.' },
  { id: 'netro-pixie', name: 'Netro Pixie riego por batería', brand: 'Netro', cat: 'agua', link: 'wifi', eco: ['ha'], power: 'pila', price: [1900, 2600], tier: 'medida', source: 'importacion', note: 'Para macetas de balcón y terraza donde no hay contacto.' },

  /* ── Audio y video ───────────────────────────────────────── */
  { id: 'sonos-era100', name: 'Sonos Era 100', brand: 'Sonos', cat: 'av', link: 'wifi', eco: ['apple', 'google', 'alexa'], power: 'corriente', price: [5900, 7200], tier: 'casa', source: 'retail', note: 'La referencia de multiroom. Se agrupa por cuarto y suena parejo.' },
  { id: 'sonos-arc', name: 'Sonos Arc Ultra', brand: 'Sonos', cat: 'av', link: 'wifi', eco: ['apple', 'google', 'alexa'], power: 'corriente', price: [21000, 26000], tier: 'medida', source: 'retail', note: 'Barra para sala principal. eARC: revisar que la tele lo tenga.' },
  { id: 'homepod-mini', name: 'HomePod mini', brand: 'Apple', cat: 'hubs', link: 'thread', eco: ['apple'], power: 'corriente', price: [1999, 2499], tier: 'esencial', source: 'retail', note: 'Border router Thread + voz. En casa Apple, el primer aparato que se compra.' },
  { id: 'appletv-4k', name: 'Apple TV 4K (Wi-Fi + Ethernet)', brand: 'Apple', cat: 'hubs', link: 'thread', eco: ['apple'], power: 'corriente', price: [3499, 4299], tier: 'esencial', source: 'retail', note: 'Hub principal de Apple Home. La versión con Ethernet es la que trae Thread.' },
  { id: 'echo-show8', name: 'Echo Show 8 (3ª gen)', brand: 'Amazon', cat: 'hubs', link: 'thread', eco: ['alexa'], power: 'corriente', price: [2499, 3299], tier: 'esencial', source: 'retail', note: 'Pantalla + border router + Zigbee. El mejor precio por hub del mercado.' },
  { id: 'echo-dot', name: 'Echo Dot (5ª gen)', brand: 'Amazon', cat: 'hubs', link: 'wifi', eco: ['alexa'], power: 'corriente', price: [999, 1499], tier: 'esencial', source: 'retail', note: 'Voz en cuartos secundarios. Barato y suficiente.' },
  { id: 'nest-hub2', name: 'Nest Hub (2ª gen)', brand: 'Google', cat: 'hubs', link: 'thread', eco: ['google'], power: 'corriente', price: [1999, 2699], tier: 'esencial', source: 'retail', note: 'Border router de Google + pantalla de buró. Sensor de sueño incluido.' },
  { id: 'hue-syncbox', name: 'Hue Play HDMI Sync Box 8K', brand: 'Philips Hue', cat: 'av', link: 'cable', eco: ALL, power: 'corriente', price: [7500, 9500], tier: 'medida', source: 'importacion', note: 'Sincroniza luces con la imagen. Va entre las fuentes HDMI y la tele.' },

  /* ── Hubs y controladores ────────────────────────────────── */
  { id: 'ha-green', name: 'Home Assistant Green', brand: 'Nabu Casa', cat: 'hubs', link: 'cable', eco: ['ha'], power: 'corriente', price: [2400, 3200], tier: 'casa', source: 'importacion', note: 'Servidor local listo para usar. La base de cualquier instalación que deba sobrevivir a la nube.' },
  { id: 'ha-yellow', name: 'Home Assistant Yellow (PoE)', brand: 'Nabu Casa', cat: 'hubs', link: 'poe', eco: ['ha'], power: 'poe', price: [4800, 6500], tier: 'medida', source: 'importacion', note: 'Versión de rack con Zigbee integrado y ranura NVMe. Para instalaciones grandes.' },
  { id: 'skyconnect', name: 'Home Assistant Connect ZBT-1', brand: 'Nabu Casa', cat: 'hubs', link: 'cable', eco: ['ha'], power: 'corriente', price: [700, 1000], tier: 'casa', source: 'importacion', note: 'Dongle USB: da Zigbee y Thread al servidor. Usar extensión USB o mete ruido.' },
  { id: 'ikea-dirigera', name: 'IKEA DIRIGERA', brand: 'IKEA', cat: 'hubs', link: 'cable', eco: ALL, power: 'corriente', price: [1500, 1990], tier: 'esencial', source: 'retail', note: 'Puente Zigbee barato con Matter. Tiene tienda en México, lo que simplifica la logística.' },
  { id: 'switchbot-hub2', name: 'SwitchBot Hub 2', brand: 'SwitchBot', cat: 'hubs', link: 'wifi', eco: ALL, power: 'corriente', price: [1200, 1700], tier: 'esencial', source: 'retail', note: 'Puente Matter para todo SwitchBot + IR + sensor de temperatura.' },

  /* ── Red ─────────────────────────────────────────────────── */
  { id: 'unifi-u7', name: 'UniFi U7 Pro (WiFi 7)', brand: 'Ubiquiti', cat: 'red', link: 'poe', eco: ['ha'], power: 'poe', price: [3800, 4900], tier: 'casa', source: 'distribuidor', note: 'Access point de plafón. Se colocan por mapa de calor, no por corazonada.' },
  { id: 'unifi-cloudgw', name: 'UniFi Cloud Gateway Ultra', brand: 'Ubiquiti', cat: 'red', link: 'cable', eco: ['ha'], power: 'corriente', price: [3200, 4200], tier: 'casa', source: 'distribuidor', note: 'Router + controlador. Aquí se crea la VLAN de IoT que aísla los dispositivos.' },
  { id: 'unifi-switch8', name: 'UniFi Switch Lite 8 PoE', brand: 'Ubiquiti', cat: 'red', link: 'poe', eco: ['ha'], power: 'corriente', price: [2600, 3400], tier: 'casa', source: 'distribuidor', note: 'Alimenta APs y cámaras por un solo cable. 52W: alcanza para 4 APs.' },
  { id: 'tplink-deco', name: 'TP-Link Deco BE63 (pack 3)', brand: 'TP-Link', cat: 'red', link: 'wifi', eco: ['ha'], power: 'corriente', price: [8500, 11000], tier: 'esencial', source: 'retail', note: 'Mesh de consumo cuando no se puede cablear. Más simple que UniFi, menos control.' },
  { id: 'rack-6u', name: 'Rack de pared 6U + organizador', brand: 'Genérico', cat: 'red', link: 'cable', eco: ['ha'], power: 'corriente', price: [2200, 3200], tier: 'casa', source: 'distribuidor', note: 'Lo que convierte un nido de cables en una instalación entregable. Siempre con ventilación.' },
  { id: 'patch-panel', name: 'Patch panel 12 puertos Cat6', brand: 'Genérico', cat: 'red', link: 'cable', eco: ['ha'], power: 'corriente', price: [700, 1200], tier: 'casa', source: 'distribuidor', note: 'Etiquetado por cuarto. Es la diferencia entre dar mantenimiento en 5 minutos o en 2 horas.' },

  /* ── Mascotas ────────────────────────────────────────────── */
  { id: 'petlibro-granary', name: 'PETLIBRO Granary Camera Feeder', brand: 'PETLIBRO', cat: 'mascotas', link: 'wifi', eco: ['alexa', 'google', 'ha'], power: 'corriente', price: [2400, 3200], tier: 'casa', source: 'retail', note: 'Alimentador con cámara y voz grabada. Respaldo de pilas para apagones.' },
  { id: 'sureflap-hub', name: 'SureFlap DualScan + Hub', brand: 'Sure Petcare', cat: 'mascotas', link: 'wifi', eco: ['ha'], power: 'pila', price: [4200, 5600], tier: 'medida', source: 'importacion', note: 'Puerta que solo abre a tu mascota por microchip. Requiere corte en puerta o muro.' },
  { id: 'petkit-fountain', name: 'PETKIT Eversweet fuente', brand: 'PETKIT', cat: 'mascotas', link: 'wifi', eco: ['alexa', 'google'], power: 'corriente', price: [1400, 1900], tier: 'medida', source: 'retail', note: 'Avisa cuando falta agua o toca cambiar filtro.' },
  { id: 'tractive-gps', name: 'Tractive GPS collar', brand: 'Tractive', cat: 'mascotas', link: 'cable', eco: ['ha'], power: 'pila', price: [1400, 1900], tier: 'medida', source: 'retail', note: 'Suscripción mensual obligatoria. Se integra a HA por API no oficial.' },

  /* ── Electrodomésticos ───────────────────────────────────── */
  { id: 'roborock-s8', name: 'Roborock S8 MaxV Ultra', brand: 'Roborock', cat: 'electro', link: 'matter', eco: ALL, power: 'corriente', price: [24000, 32000], tier: 'medida', source: 'retail', note: 'Matter solo expone arranque/paro; para limpiar un cuarto específico hay que usar su app.' },
  { id: 'lg-thinq', name: 'Lavadora LG con ThinQ', brand: 'LG', cat: 'electro', link: 'wifi', eco: ALL, power: 'cableado', price: [16000, 30000], tier: 'medida', source: 'retail', note: 'Matter en modelos 2024 en adelante. Verificar número de modelo antes de prometer.' },
  { id: 'midea-minisplit', name: 'Minisplit Midea WiFi inverter', brand: 'Midea', cat: 'clima', link: 'wifi', eco: ['alexa', 'google', 'ha'], power: 'cableado', price: [9000, 16000], tier: 'medida', source: 'retail', note: 'Si el cliente va a comprar minisplit nuevo, que sea uno con WiFi de fábrica.' },
  { id: 'samsung-frame', name: 'Samsung The Frame 65"', brand: 'Samsung', cat: 'av', link: 'wifi', eco: ALL, power: 'corriente', price: [26000, 36000], tier: 'medida', source: 'retail', note: 'SmartThings de fábrica; funciona como hub Matter. Modo galería cuando está apagada.' },
]

/** Resumen para el encabezado del panel. */
export function catalogStats() {
  const byEco = Object.fromEntries(
    ECOSYSTEMS.map((e) => [e.id, DEVICES.filter((d) => d.eco.includes(e.id)).length]),
  )
  const thread = DEVICES.filter((d) => d.link === 'thread').length
  const avg = Math.round(DEVICES.reduce((a, d) => a + (d.price[0] + d.price[1]) / 2, 0) / DEVICES.length)
  return { total: DEVICES.length, byEco, thread, avg }
}
