/**
 * Dispositivos instalados en la casa.
 *
 * Una sola lista alimenta dos cosas:
 *   1. los hotspots HTML que aparecen sobre la escena, y
 *   2. los nodos de la malla Thread del último capítulo.
 *
 * kind:
 *   border  — border router, la raíz de la malla
 *   mains   — enchufado a corriente, así que además repite señal
 *   battery — de pila, solo habla; nunca enruta
 *
 * chapter empata con el índice de content/tour.js → chapters[]
 * Las posiciones de planta alta van sobre y = 3.1.
 */
export const DEVICES = [
  // 0 · exterior
  { id: 'cam', chapter: 0, kind: 'mains', pos: [1.4, 2.95, 5.2], label: 'Cámara con detección', note: 'Distingue persona, coche y paquete' },
  { id: 'porch', chapter: 0, kind: 'mains', pos: [-3.9, 2.2, 5.3], label: 'Arbotante + sensor', note: '30% a partir de las 21:00' },
  { id: 'bell', chapter: 0, kind: 'mains', pos: [-0.2, 1.45, 5.15], label: 'Timbre con video', note: 'Habla desde el celular estés donde estés' },
  { id: 'gate', chapter: 0, kind: 'battery', pos: [-5.6, 1.0, 15.9], label: 'Contacto de reja', note: 'Dispara la escena de llegada' },

  // 1 · llegada · 2 · garage
  { id: 'gdoor', chapter: 1, kind: 'mains', pos: [-5.6, 2.55, 5.1], label: 'Portón Matter', note: 'Se abre por voz, geocerca o botón' },
  { id: 'gsensor', chapter: 2, kind: 'battery', pos: [-7.2, 2.5, 3.4], label: 'Sensor de presencia', note: 'Apaga la luz tres minutos después' },
  { id: 'glight', chapter: 2, kind: 'mains', pos: [-4.2, 2.6, 1.6], label: 'Luz del garage', note: 'Se enciende antes de que te bajes' },
  { id: 'lock', chapter: 3, kind: 'battery', pos: [-1.35, 1.15, 4.86], label: 'Chapa NFC', note: 'Se abre con el teléfono; llave física de respaldo' },

  // 3 · recibidor
  { id: 'nfc', chapter: 3, kind: 'battery', pos: [-2.82, 1.36, 2.0], label: 'Tag NFC "Llegué"', note: 'Cuesta 40 pesos y no necesita pila' },
  { id: 'scenes', chapter: 3, kind: 'mains', pos: [-0.1, 1.22, 4.88], label: 'Botonera de escenas', note: 'Para las visitas y para quien no usa apps' },
  { id: 'presence', chapter: 3, kind: 'battery', pos: [-1.0, 2.4, 4.8], label: 'Sensor de presencia', note: 'Prende al 40% cuando entras con las manos llenas' },
  { id: 'wallpanel', chapter: 3, kind: 'mains', pos: [-3.0, 1.5, 3.2], label: 'Panel de pared', note: 'El control que no depende de un teléfono' },

  // 5 · sala
  { id: 'dimmer', chapter: 5, kind: 'mains', pos: [1.35, 1.2, 2.1], label: 'Dimmer con neutro', note: 'Regula sin zumbido ni parpadeo' },
  { id: 'tv', chapter: 5, kind: 'mains', pos: [4.6, 1.78, 0.9], label: 'Escena "Cine"', note: 'Persianas, luz al 12% y barra en HDMI 2' },
  { id: 'sonos', chapter: 5, kind: 'mains', pos: [5.9, 0.62, 1.05], label: 'Audio multiroom', note: 'La música te sigue de cuarto en cuarto' },
  { id: 'lamp', chapter: 5, kind: 'mains', pos: [2.3, 1.66, 1.5], label: 'Lámpara Thread', note: 'También repite la señal de la malla' },
  { id: 'blindS', chapter: 5, kind: 'mains', pos: [7.75, 2.4, 2.8], label: 'Persiana motorizada', note: 'Baja sola con el sol de la tarde' },

  // 6 · cocina
  { id: 'strip', chapter: 6, kind: 'mains', pos: [4.4, 1.55, -4.35], label: 'Tira bajo gabinete', note: '2700K en la noche, 4000K de día' },
  { id: 'leak', chapter: 6, kind: 'battery', pos: [3.48, 0.16, -4.5], label: 'Sensor de fuga', note: 'Cierra la llave de paso solo' },
  { id: 'pendant', chapter: 6, kind: 'mains', pos: [4.6, 1.5, -2.0], label: 'Colgantes regulables', note: 'Bajan al 45% cuando pones la mesa' },
  { id: 'kscreen', chapter: 6, kind: 'mains', pos: [7.8, 1.6, -2.6], label: 'Pantalla asistente', note: 'Intercomunicador y control por voz' },

  // 7 · medio baño
  { id: 'bmirror', chapter: 7, kind: 'mains', pos: [-2.2, 1.6, -2.0], label: 'Espejo con halo', note: 'La luz sale de atrás, no te encandila' },
  { id: 'bfan', chapter: 7, kind: 'mains', pos: [0.7, 2.15, -2.0], label: 'Extractor por humedad', note: 'Se queda ocho minutos después de salir' },
  { id: 'bnight', chapter: 7, kind: 'mains', pos: [-1.5, 0.16, -1.92], label: 'Luz nocturna al 5%', note: 'Ámbar, para no despertarte del todo' },
  { id: 'bsensor', chapter: 7, kind: 'battery', pos: [-1.0, 2.65, -3.0], label: 'Sensor con horario', note: 'Mismo sensor, distinta luz según la hora' },

  // 8 · recámara
  { id: 'blind', chapter: 8, kind: 'mains', pos: [4.6, 4.8, -4.78], label: 'Persiana motorizada', note: 'Se abre a la mitad con el amanecer' },
  { id: 'sunrise', chapter: 8, kind: 'mains', pos: [3.15, 3.92, -4.12], label: 'Amanecer simulado', note: 'De 1% a 60% en veinte minutos' },
  { id: 'floorlight', chapter: 8, kind: 'mains', pos: [4.6, 3.22, -1.9], label: 'Guía de piso al 3%', note: 'Se enciende sin despertar a nadie' },
  { id: 'mmwave', chapter: 8, kind: 'battery', pos: [7.8, 5.3, -2.4], label: 'Sensor mmWave', note: 'Detecta que estás, aunque no te muevas' },

  // 9 · baño principal
  { id: 'pmirror', chapter: 9, kind: 'mains', pos: [-2.1, 4.7, -1.42], label: 'Espejo a 4000K', note: 'La única luz fría que sí conviene en casa' },
  { id: 'pfan', chapter: 9, kind: 'mains', pos: [0.75, 5.25, -1.4], label: 'Extractor por humedad', note: 'Lee humedad real, no un timer' },
  { id: 'radiant', chapter: 9, kind: 'mains', pos: [-1.0, 3.2, -2.6], label: 'Piso radiante', note: 'Arranca 6:10 para estar tibio a las 6:30' },
  { id: 'shower', chapter: 9, kind: 'battery', pos: [0.3, 4.5, -4.2], label: 'Sensor de la regadera', note: 'Enciende el extractor en cuanto abres' },

  // 10 · estudio
  { id: 'rack', chapter: 10, kind: 'mains', pos: [-7.5, 4.25, -4.4], label: 'Rack + UPS', note: 'Etiquetado y documentado' },
  { id: 'busy', chapter: 10, kind: 'mains', pos: [-3.1, 4.72, -1.6], label: 'Luz "en junta"', note: 'Se pone roja cuando prende tu cámara' },
  { id: 'border', chapter: 10, kind: 'border', pos: [-7.72, 4.4, -2.4], label: 'Border router', note: 'El puente entre Thread y tu red' },
  { id: 'bias', chapter: 10, kind: 'mains', pos: [-5.6, 4.08, -4.8], label: 'Bias light', note: 'Menos fatiga visual en la noche' },

  // 11 · balcón
  { id: 'feeder', chapter: 11, kind: 'mains', pos: [2.7, 3.85, 1.1], label: 'Alimentador Matter', note: '8:00 y 19:00, y aviso si baja la tolva' },
  { id: 'slider', chapter: 11, kind: 'battery', pos: [4.6, 5.35, 0.25], label: 'Sensor de puerta', note: 'Apaga el aire si la dejan abierta' },
  { id: 'petcam', chapter: 11, kind: 'mains', pos: [1.5, 5.2, 2.4], label: 'Cámara con audio', note: 'Para hablarle a Nube desde la oficina' },
  { id: 'irrigation', chapter: 11, kind: 'battery', pos: [1.9, 3.6, 4.4], label: 'Riego de macetas', note: 'Riega según el pronóstico, no según el reloj' },

  // 11 · red — infraestructura que solo aparece al final
  { id: 'ap1', chapter: 12, kind: 'mains', pos: [-1.0, 2.65, 0.4], label: 'Access point · PB', note: 'Colocado por mapa de calor, no por corazonada' },
  { id: 'ap2', chapter: 12, kind: 'mains', pos: [1.0, 5.5, -2.0], label: 'Access point · PA', note: 'En dos pisos siempre hace falta el segundo' },
  { id: 'switch', chapter: 12, kind: 'mains', pos: [-7.5, 4.55, -4.4], label: 'Switch PoE', note: 'VLAN separada solo para IoT' },
]

/** Nodos que sí enrutan: los enchufados a corriente. */
export const ROUTER_KINDS = new Set(['border', 'mains'])

/**
 * Aristas de la malla, calculadas en vez de escritas a mano.
 * Cada nodo se cuelga de los enrutadores que tenga más cerca — que es,
 * a grandes rasgos, lo que hace Thread al formar la topología.
 */
export function buildEdges(nodes) {
  const routers = nodes.filter((n) => ROUTER_KINDS.has(n.kind))
  const seen = new Set()
  const edges = []

  const d2 = (a, b) =>
    (a.pos[0] - b.pos[0]) ** 2 + (a.pos[1] - b.pos[1]) ** 2 + (a.pos[2] - b.pos[2]) ** 2

  for (const node of nodes) {
    const isRouter = ROUTER_KINDS.has(node.kind)
    const links = routers
      .filter((r) => r.id !== node.id)
      .sort((a, b) => d2(node, a) - d2(node, b))
      // un enrutador se enmalla con dos vecinos; una pila solo cuelga de uno
      .slice(0, isRouter ? 2 : 1)

    for (const other of links) {
      const key = [node.id, other.id].sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)
      edges.push([node, other])
    }
  }
  return edges
}
