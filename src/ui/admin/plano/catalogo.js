import * as P from '../../../scene/props'
import * as F from '../../../scene/fixtures'
import * as X from './props'
import * as N from './muebles'

/**
 * Qué se puede poner en un cuarto, según qué cuarto sea.
 *
 * El mobiliario no se modela aquí: se reusa el del recorrido de la casa, que
 * ya existe y ya está resuelto. Esos componentes llevan dentro un enganche a
 * la iluminación del tour (`useDimmed`), pero se apaga solo cuando el cuarto
 * no es uno de los del recorrido — que es siempre el caso aquí. Quedan como
 * geometría inerte, que es justo lo que se necesita: en el plano la luz no la
 * hace el mueble, la hacen los dispositivos levantados.
 *
 * `w` y `d` son la huella en metros. No son exactos al milímetro; sirven para
 * dibujar la selección y para avisar cuando algo no cabe.
 */

/* El "objeto" que representa al cuarto mismo —piso y muros—. Vive aquí, en un
   módulo hoja, porque lo necesitan tanto el editor como la escena 3D: tocar el
   piso selecciona el espacio igual que tocar un mueble selecciona el mueble. */
export const ID_MUROS = '__muros'

/**
 * Las versiones de un mismo mueble.
 *
 * Cinco camas no son cinco colores: son cinco siluetas, y la silueta es lo
 * único que se distingue en un plano isométrico. Además casi ninguna es
 * decorativa —una cabecera capitonada tapa la lámpara de buró que sí
 * funcionaba con una plataforma, un clóset de espejo devuelve la luz que uno
 * abierto se traga— así que elegir aquí decide cosas de la instalación.
 *
 * `V(id, label, porque, props)` — `props` va al componente y puede además
 * cambiar la huella (`w`, `d`, `alto`) cuando la versión es de otro tamaño.
 */
const V = (id, label, porque, props = {}) => ({ id, label, porque, props })

const A = (label, Comp, w, d, alto = 0.8, props = {}) => ({ label, Comp, w, d, alto, props })

/**
 * Pieza ya modelada con el sistema de diseño nuevo.
 *
 * `Nuevo` gana sobre `Comp` cuando existe. Se hace así para migrar mueble por
 * mueble sin romper el editor: lo que ya está en el lenguaje nuevo se ve con
 * el lenguaje nuevo, y lo que falta sigue dibujándose como antes hasta que le
 * toque. Un cambio de golpe habría dejado media casa sin muebles.
 */
const AN = (label, Nuevo, w, d, alto = 0.8, props = {}) => ({ label, Comp: Nuevo, Nuevo, w, d, alto, props })

/**
 * Portafoco: el mueble no da luz, sostiene un foco.
 *
 * Marcarlo importa porque es la venta más fácil del catálogo. Al cliente no
 * hay que cambiarle el mueble ni picarle pared: se le cambia el foco por uno
 * inteligente y esa lámpara queda automatizada. Con la marca puesta, el plano
 * puede señalar cada una y ofrecer el foco ahí mismo.
 */
const L = (label, Comp, w, d, alto, props = {}) => ({ label, Comp, w, d, alto, props, portafoco: true })

export const MUEBLES = {
  /* ── sala y estar ── */
  sofa: AN('Sofá', N.Sofa, 2.4, 0.95, 0.8, { w: 2.4, d: 0.95 }),
  mesaCentro: AN('Mesa de centro', N.MesaCentro, 1.1, 0.62, 0.45, { w: 1.1, d: 0.62 }),
  mueble_tv: AN('Mueble de TV', N.MuebleTv, 1.9, 0.42, 0.5, { w: 1.9, d: 0.42 }),
  tv: AN('Pantalla', N.Pantalla, 1.5, 0.06, 0.9, { w: 1.5 }),
  tapete: AN('Tapete', N.Tapete, 2.6, 1.8, 0.03, { w: 2.6, d: 1.8 }),
  librero: A('Librero', P.Shelf, 1.6, 0.35, 1.8),
  planta: AN('Planta', N.Planta, 0.42, 0.42, 1.1, { alto: 1.05 }),
  bocina: AN('Bocina', N.Bocina, 0.16, 0.16, 0.3, { alto: 0.28 }),

  /* ── recámara ── */
  cama: { ...(AN('Cama', N.Cama, 1.62, 2.05, 0.95, { w: 1.6, largo: 2.0 })), variantes: [
    V('plataforma', 'Plataforma', 'Base baja y cabecera de tabla. La más común y la que menos estorba.', { v: 'plataforma' }),
    V('capitonada', 'Capitonada', 'Cabecera alta y acolchada. OJO: tapa la lámpara de buró que funcionaba con una plataforma.', { v: 'capitonada' }),
    V('dosel', 'Con dosel', 'Cuatro postes y travesaños. Pide 2.4 m de altura libre y se pelea con la luz de plafón.', { v: 'dosel' }),
    V('individual', 'Individual', 'Una plaza, 1.00 × 1.90. Para recámara secundaria o cuarto de servicio.', { v: 'individual', w: 1.0, largo: 1.9 }),
    V('baja', 'Baja sobre tarima', 'Sin cabecera y con la tarima sobresaliendo. Deja el muro libre para paneles o un cuadro.', { v: 'baja' }),
  ] },
  buro: { ...(AN('Buró', N.Buro, 0.46, 0.4, 0.54, { w: 0.46, alto: 0.52 })), variantes: [
    V('cajones', 'Dos cajones', 'El de siempre. Superficie completa para lámpara y despertador.', { v: 'cajones' }),
    V('repisa', 'Cajón y repisa', 'Un cajón arriba y hueco abierto abajo. Ahí caben libros y el cargador.', { v: 'repisa' }),
    V('patasAltas', 'Patas altas', 'Cuerpo chico sobre patas de madera. Se ve más ligero y se limpia debajo.', { v: 'patasAltas' }),
    V('redondo', 'Velador redondo', 'Cilíndrico, sin esquinas. Cabe en un pasillo angosto entre cama y muro.', { v: 'redondo' }),
    V('flotante', 'Flotante', 'Colgado del muro, sin patas. Hay que resolver el contacto ANTES de colgarlo.', { v: 'flotante' }),
  ] },
  closet: { ...(AN('Clóset', N.Closet, 1.8, 0.6, 2.15, { w: 1.8, alto: 2.15, d: 0.6 })), variantes: [
    V('dosPuertas', 'Dos puertas', 'Abatibles. Necesita 60 cm libres al frente para abrir.', { v: 'dosPuertas' }),
    V('corredizas', 'Corredizas', 'No necesita espacio al frente, pero solo se abre la mitad a la vez.', { v: 'corredizas' }),
    V('tresPuertas', 'Tres puertas', 'Para muro largo. Más hojas, hojas más angostas.', { v: 'tresPuertas' }),
    V('abierto', 'Abierto', 'Entrepaños y tubo a la vista. Se traga la luz del cuarto: pide una tira dentro.', { v: 'abierto' }),
    V('conEspejo', 'Con espejo', 'Una hoja espejeada. Devuelve luz y hace ver el cuarto al doble.', { v: 'conEspejo' }),
  ] },
  /* ── comedor ──
     La isla de cocina hace de mesa: mismas proporciones y misma altura, y
     ahorra modelar una pieza que se vería igual. */
  mesaComedor: A('Mesa de comedor', P.Island, 1.9, 0.95, 0.78),

  /* ── cocina ── */
  barra: A('Barra de cocina', P.KitchenRun, 3.4, 0.65, 0.9),
  isla: A('Isla', P.Island, 1.9, 0.9, 0.9),
  refri: A('Refrigerador', P.Fridge, 0.75, 0.7, 1.8),

  /* ── baño ── */
  wc: A('WC', F.Toilet, 0.4, 0.7, 0.75),
  lavabo: A('Lavabo', F.Vanity, 1.0, 0.5, 0.85),
  regadera: A('Regadera', F.Shower, 1.1, 1.0, 2.1),
  espejo: A('Espejo', F.Mirror, 0.9, 0.05, 0.8),
  toallero: A('Toallero', F.TowelRail, 0.6, 0.1, 0.1),

  /* ── estudio ── */
  escritorio: A('Escritorio', P.Desk, 1.8, 0.7, 0.75),
  monitor: A('Monitor', P.Monitor, 1.05, 0.2, 0.5),
  monitorCurvo: { ...(A('Monitor curvo', X.MonitorCurvo, 0.82, 0.28, 0.52)), variantes: [
    V('ultra34', 'Ultrapanorámico 34\u2033', '80 cm de ancho, curvatura 1500R. El más usado para trabajar.', { v: 'ultra34' }),
    V('plano27', 'Plano 27\u2033', 'Recto, 60 cm. Cabe en cualquier escritorio y es el más barato.', { v: 'plano27' }),
    V('curvo32', 'Curvo 32\u2033', 'Más alto y con más curva. Para ver y para jugar.', { v: 'curvo32' }),
    V('doble27', 'Doble 27\u2033', 'Dos pantallas en ángulo. Ocupa 1.25 m y pide dos contactos.', { v: 'doble27' }),
    V('ultra49', 'Ultrapanorámico 49\u2033', '1.19 m de ancho. No cabe en un escritorio de 1.20: hay que medir antes.', { v: 'ultra49' }),
  ] },
  silla: A('Silla', P.OfficeChair, 0.6, 0.6, 1.0),
  rack: A('Rack', P.Rack, 0.6, 0.6, 1.2),

  /* ── lo que hace que se vea habitado ──
     Sin esto un plano se ve a maqueta de inmobiliaria. Los libros de canto, la
     maceta del rincón y el gato dormido son lo que lo vuelven la casa de
     alguien — y es lo que hace que el cliente sonría cuando lo ve. */
  mesaRedonda: A('Mesa redonda', X.MesaRedonda, 1.1, 1.1, 0.75),
  mesaLateral: AN('Mesa lateral', N.MesaLateral, 0.46, 0.46, 0.56, { d: 0.44, alto: 0.52 }),
  mesaTrabajo: A('Mesa de trabajo', X.MesaTrabajo, 1.4, 0.6, 0.74),
  libreroLleno: AN('Librero con libros', N.Librero, 1.1, 0.32, 1.7, { w: 1.05, alto: 1.6 }),
  cuadroSolo: AN('Cuadro', N.Cuadro, 0.58, 0.06, 0.78, { w: 0.55, h: 0.72 }),
  muroCuadros: A('Muro de cuadros', X.MuroCuadros, 1.2, 0.05, 1.1),
  plantaAlta: AN('Planta alta', N.Planta, 0.45, 0.45, 1.35, { alto: 1.3 }),
  macetaChica: A('Maceta', X.MacetaChica, 0.2, 0.2, 0.35),
  gato: A('Gato dormido', X.GatoDormido, 0.4, 0.5, 0.25),
  perro: A('Perro dormido', X.PerroDormido, 0.5, 0.7, 0.35),
  camaMascota: A('Cama de mascota', X.CamaMascota, 0.65, 0.65, 0.15),

  /* ── el lote grande ──
     La herramienta es solo para casas inteligentes, así que el catálogo puede
     ser largo sin volverse un cajón de sastre: todo lo que está aquí es algo
     que de verdad aparece en un levantamiento, y varias de estas piezas son
     justo donde va la instalación —la lavadora que se va a medir, el boiler
     que decide si hay gas, la lámpara de pie que va a llevar el foco. */
  sillon: A('Sillón', X.Sillon, 0.95, 0.9, 0.8),
  puf: AN('Puf', N.Puf, 0.6, 0.6, 0.4, { d: 0.6 }),
  lamparaPie: { ...({ ...AN('Lámpara de pie', N.LamparaPie, 0.36, 0.36, 1.7, { alto: 1.62 }), portafoco: true }), variantes: [
    V('cono', 'Pantalla cónica', 'La de siempre. Manda la luz al piso y deja el techo oscuro.', { v: 'cono' }),
    V('tambor', 'Tambor', 'Recta y ancha. Reparte parejo arriba y abajo.', { v: 'tambor' }),
    V('globo', 'Globo', 'Esfera opalina. Ilumina en todas direcciones, es la que más ambienta.', { v: 'globo' }),
    V('papel', 'Farol de papel', 'Alta y angosta. Luz suave repartida a lo largo, casi sin sombra dura.', { v: 'papel' }),
    V('arco', 'De arco', 'El brazo cruza sobre el sillón o la cama. Ilumina donde se lee sin poner nada al lado.', { v: 'arco' }),
  ] },
  chimenea: A('Chimenea', X.Chimenea, 1.7, 0.45, 1.2),
  relojPared: A('Reloj de pared', X.RelojPared, 0.34, 0.05, 0.34),
  revistero: A('Revistero', X.Revistero, 0.42, 0.3, 0.45),

  sillaComedor: A('Silla de comedor', X.SillaComedor, 0.46, 0.46, 0.95),
  bancoBarra: A('Banco de barra', X.BancoBarra, 0.36, 0.36, 0.72),
  alacena: A('Alacena', X.Alacena, 1.8, 0.35, 0.7),
  campana: A('Campana', X.Campana, 0.84, 0.84, 0.7),
  estufa: A('Estufa', X.Estufa, 0.78, 0.64, 0.95),
  microondas: A('Microondas', X.Microondas, 0.52, 0.38, 0.3),
  lavavajillas: A('Lavavajillas', X.Lavavajillas, 0.6, 0.6, 0.85),

  comoda: AN('Cómoda', N.Comoda, 1.1, 0.45, 0.82, { w: 1.1, alto: 0.82, d: 0.45 }),
  espejoPie: A('Espejo de pie', X.EspejoPie, 0.55, 0.3, 1.65),
  bancaPie: A('Banca de pie de cama', X.BancaPie, 1.2, 0.4, 0.5),
  cuna: A('Cuna', X.Cuna, 1.3, 0.7, 0.75),

  tina: A('Tina', X.Tina, 1.7, 0.78, 0.6),
  lavadora: A('Lavadora', X.Lavadora, 0.64, 0.64, 0.88),
  secadora: A('Secadora', X.Secadora, 0.64, 0.64, 0.88),
  boiler: A('Boiler', X.Boiler, 0.42, 0.25, 0.7),
  lavadero: A('Lavadero', X.Lavadero, 0.94, 0.64, 0.9),
  tendedero: A('Tendedero', X.Tendedero, 1.45, 0.2, 1.1),
  tinaco: A('Tinaco', X.Tinaco, 0.9, 0.9, 1.05),

  archivero: A('Archivero', X.Archivero, 0.45, 0.55, 0.7),
  pizarron: A('Pizarrón', X.Pizarron, 1.8, 0.05, 1.05),
  sillaVisita: A('Silla de visita', X.SillaVisita, 0.46, 0.46, 0.9),
  macetaGrande: A('Maceta grande', X.MacetaGrande, 0.55, 0.55, 1.3),

  /* ── arte ── */
  cuadroArte: AN('Cuadro de arte', N.Cuadro, 0.66, 0.06, 0.86, { w: 0.62, h: 0.8, tono: 'acento' }),
  cuadroGrande: AN('Cuadro grande', N.Cuadro, 1.36, 0.06, 0.96, { w: 1.3, h: 0.9, tono: 'apoyo' }),
  triptico: A('Tríptico', X.TripticoArte, 1.5, 0.05, 0.68),
  cuadroPiso: A('Cuadro recargado', X.CuadroPiso, 0.86, 0.3, 1.1),

  /* ── lámparas: todas llevan foco inteligente ── */
  lamparaArco: L('Lámpara de arco', X.LamparaArco, 1.3, 0.4, 1.85),
  lamparaColgante: L('Colgante', X.LamparaColgante, 0.24, 0.24, 1.5),
  lamparaEsfera: L('Colgante esfera', X.LamparaEsfera, 0.32, 0.32, 1.2),
  lamparaTripode: L('Lámpara trípode', X.LamparaTripode, 0.5, 0.5, 1.5),
  lamparaEscritorio: L('Lámpara de escritorio', X.LamparaEscritorio, 0.45, 0.2, 0.62),
  lamparaBuro: { ...AN('Lámpara de buró', N.LamparaBuro, 0.3, 0.3, 0.44, { alto: 0.42 }), portafoco: true },

  /* ── envolvente ── */
  ventana: A('Ventana', P.WindowUnit, 1.4, 0.1, 1.5),
  persiana: A('Persiana', P.Blinds, 1.4, 0.1, 1.5),
  puerta: A('Puerta corrediza', F.SlidingDoor, 2.2, 0.15, 2.3),
  cuadro: A('Cuadro', P.Artwork, 0.6, 0.05, 0.8),
}

/**
 * Qué ofrece cada tipo de cuarto.
 *
 * La lista no es "todo lo que existe" a propósito: quien levanta una recámara
 * no quiere ir descartando WCs. Siempre se puede abrir el catálogo completo.
 */
export const POR_TIPO = {
  sala: ['sofa', 'sillon', 'puf', 'mesaCentro', 'mueble_tv', 'tv', 'tapete', 'libreroLleno', 'lamparaPie', 'chimenea', 'plantaAlta', 'macetaChica', 'macetaGrande', 'bocina', 'mesaLateral', 'mesaRedonda', 'muroCuadros', 'cuadroSolo', 'relojPared', 'revistero', 'gato', 'perro', 'camaMascota', 'ventana', 'persiana', 'lamparaArco', 'lamparaTripode', 'lamparaColgante', 'cuadroArte', 'cuadroGrande', 'triptico', 'cuadroPiso'],
  recamara: ['cama', 'buro', 'escritorio', 'monitorCurvo', 'lamparaEscritorio', 'closet', 'comoda', 'bancaPie', 'espejoPie', 'cuna', 'tapete', 'tv', 'lamparaPie', 'plantaAlta', 'macetaChica', 'libreroLleno', 'muroCuadros', 'cuadroSolo', 'relojPared', 'gato', 'camaMascota', 'ventana', 'persiana', 'lamparaBuro', 'lamparaTripode', 'cuadroArte', 'triptico'],
  cocina: ['barra', 'isla', 'refri', 'estufa', 'campana', 'alacena', 'microondas', 'lavavajillas', 'bancoBarra', 'sillaComedor', 'ventana', 'planta', 'macetaChica', 'relojPared', 'lamparaEsfera', 'lamparaColgante', 'cuadroArte'],
  bano: ['wc', 'lavabo', 'tina', 'regadera', 'espejo', 'toallero', 'boiler', 'ventana', 'macetaChica', 'cuadroArte'],
  estudio: ['escritorio', 'mesaTrabajo', 'monitor', 'monitorCurvo', 'silla', 'sillaVisita', 'archivero', 'pizarron', 'libreroLleno', 'rack', 'lamparaPie', 'plantaAlta', 'macetaChica', 'muroCuadros', 'gato', 'ventana', 'persiana', 'lamparaEscritorio', 'lamparaArco', 'cuadroArte', 'cuadroPiso', 'triptico'],
  comedor: ['mesaComedor', 'mesaRedonda', 'sillaComedor', 'tapete', 'libreroLleno', 'lamparaPie', 'plantaAlta', 'macetaChica', 'macetaGrande', 'muroCuadros', 'relojPared', 'ventana', 'bocina', 'lamparaColgante', 'lamparaEsfera', 'cuadroGrande', 'cuadroArte'],
  servicio: ['lavadora', 'secadora', 'lavadero', 'boiler', 'tendedero', 'tinaco', 'rack', 'librero', 'archivero', 'ventana'],
  exterior: ['planta', 'tapete', 'bocina'],
  generico: Object.keys(MUEBLES),
}

export const TIPOS = [
  { id: 'sala', label: 'Sala / estar' },
  { id: 'recamara', label: 'Recámara' },
  { id: 'cocina', label: 'Cocina' },
  { id: 'bano', label: 'Baño' },
  { id: 'comedor', label: 'Comedor' },
  { id: 'estudio', label: 'Estudio / oficina' },
  { id: 'servicio', label: 'Servicio / rack' },
  { id: 'exterior', label: 'Exterior' },
  { id: 'generico', label: 'Otro' },
]

/**
 * Adivina el tipo por el nombre del cuarto.
 *
 * Se acierta la mayoría de las veces porque los cuartos se llaman como se
 * llaman; cuando falla, el técnico lo corrige con un selector y su elección
 * queda guardada. Preguntar siempre habría sido un paso de más en el 90 % de
 * los casos.
 */
export function tipoPorNombre(nombre = '') {
  const n = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (/bano|banio|wc|toilet|medio bano/.test(n)) return 'bano'
  if (/recamara|dormitorio|habitacion|cuarto \d|alcoba/.test(n)) return 'recamara'
  if (/cocina|cocineta/.test(n)) return 'cocina'
  if (/comedor/.test(n)) return 'comedor'
  if (/estudio|oficina|despacho|home ?office|juntas|set|area abierta|open/.test(n)) return 'estudio'
  if (/rack|site|servicio|lavado|bodega|maquinas/.test(n)) return 'servicio'
  if (/jardin|terraza|balcon|patio|alberca|cochera|fachada|exterior/.test(n)) return 'exterior'
  // "abierta" salió de aquí: en un proyecto de oficinas, "Área abierta" es
  // plan abierto de trabajo y pide 300–500 lux, no los 100–200 de una sala
  if (/sala|estancia|family|recepcion|loft/.test(n)) return 'sala'
  return 'generico'
}

/** Muebles sugeridos para arrancar un cuarto que está en blanco. */
export const ARRANQUE = {
  recamara: [
    { tipo: 'cama', x: 0, z: -0.3, rot: 0 },
    { tipo: 'buro', x: -1.2, z: -1.1, rot: 0 },
    { tipo: 'closet', x: 0, z: 1.4, rot: Math.PI },
  ],
  bano: [
    { tipo: 'wc', x: -0.9, z: -0.7, rot: 0 },
    { tipo: 'lavabo', x: 0.6, z: -0.9, rot: 0 },
    { tipo: 'regadera', x: 0.6, z: 1.0, rot: 0 },
  ],
  sala: [
    { tipo: 'sofa', x: 0, z: 1.0, rot: Math.PI },
    { tipo: 'mesaCentro', x: 0, z: 0, rot: 0 },
    { tipo: 'mueble_tv', x: 0, z: -1.4, rot: 0 },
  ],
  cocina: [{ tipo: 'barra', x: 0, z: -1.2, rot: 0 }],
  estudio: [
    { tipo: 'escritorio', x: 0, z: -1.0, rot: 0 },
    { tipo: 'silla', x: 0, z: -0.2, rot: 0 },
  ],
}
