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
  sofa: { ...(AN('Sofá', N.Sofa, 2.4, 0.95, 0.8, { w: 2.4, d: 0.95 })), variantes: [
    V('recto', 'Recto de tres', '2.40 con brazos normales. El de siempre.', { v: 'recto' }),
    V('respaldoAlto', 'Respaldo alto', 'Respaldo de 92 cm. Tapa lo que haya en el muro de atrás: ojo con los contactos.', { v: 'respaldoAlto' }),
    V('bajo', 'Bajo', 'Asiento y respaldo bajos. Deja ver el cuarto completo desde la puerta.', { v: 'bajo' }),
    V('brazoAncho', 'Brazo ancho', 'Brazos de 40 cm que sirven de mesa. Come 32 cm de asiento.', { v: 'brazoAncho' }),
    V('sinBrazos', 'Sin brazos', 'Todo el ancho es asiento. Para una sala angosta.', { v: 'sinBrazos' }),
    V('chaise', 'Con chaise', 'Brazo largo hacia un lado. Pasa de 2.40 × 0.95 a 2.40 × 1.60: mide el paso.', { v: 'chaise', d: 1.6 }),
    V('dosPlazas', 'Dos plazas', '1.60 de frente. Para un estudio o una sala chica.', { v: 'recto', w: 1.6 }),
    V('grande', 'Cuatro plazas', '3.00 de frente. Pide 3.60 de muro libre.', { v: 'recto', w: 3.0 }),
    V('modularBajo', 'Modular bajo', 'Bajo y de tres metros. La pieza de una sala grande y despejada.', { v: 'bajo', w: 3.0 }),
    V('chaiseGrande', 'Chaise grande', '3.00 con chaise. La configuración más común de sala familiar.', { v: 'chaise', w: 3.0, d: 1.7 }),
  ] },
  mesaCentro: { ...(AN('Mesa de centro', N.MesaCentro, 1.1, 0.62, 0.45, { w: 1.1, d: 0.62 })), variantes: [
    V('dosNiveles', 'Dos niveles', 'Tablero y entrepaño. Ahí viven los controles y las revistas.', { v: 'dosNiveles' }),
    V('simple', 'Tablero simple', 'Un solo tablero sobre cuatro patas. Se ve más ligera.', { v: 'simple' }),
    V('costados', 'Costados macizos', 'Dos tablones en vez de patas. Ancla la sala.', { v: 'costados' }),
    V('marco', 'Marco de metal', 'Estructura fina de metal. Se ve el tapete completo por debajo.', { v: 'marco' }),
    V('redonda', 'Redonda', 'Sin esquinas. Para paso angosto o casa con niños.', { v: 'redonda', w: 0.9, d: 0.9 }),
    V('tambor', 'Tambor', 'Cilindro macizo. Pesa a la vista y cierra el paso visual de abajo.', { v: 'tambor', w: 0.8, d: 0.8 }),
    V('baja', 'Baja', '30 cm de alto. Para sofá bajo; en uno normal queda incómoda.', { v: 'baja' }),
    V('larga', 'Larga', '1.50 de frente. Para sofá de 3.00 o más.', { v: 'dosNiveles', w: 1.5 }),
    V('chica', 'Chica', '0.80 de frente. Para sala de dos plazas.', { v: 'simple', w: 0.8, d: 0.5 }),
    V('nido', 'Nido redondo', 'Redonda y baja, se mueve con una mano. Libera la sala cuando llega gente.', { v: 'redonda', w: 0.62, d: 0.62 }),
  ] },
  mueble_tv: { ...(AN('Mueble de TV', N.MuebleTv, 1.9, 0.42, 0.5, { w: 1.9, d: 0.42 })), variantes: [
    V('puertas', 'Con puertas', 'Cierra lo que hay dentro. El módem respira mal aquí: ojo.', { v: 'puertas' }),
    V('abierto', 'Abierto', 'Repisa a la vista. Es donde de verdad debe ir el módem y el Apple TV.', { v: 'abierto' }),
    V('patas', 'Con patas', 'Levantado 20 cm. Se limpia debajo y el cable pasa por atrás sin doblarse.', { v: 'patas' }),
    V('flotante', 'Flotante', 'Colgado del muro. Hay que dejar el contacto y el HDMI antes de colgarlo.', { v: 'flotante' }),
    V('bajo', 'Bajo', '32 cm de alto. Deja la tele a la altura del sillón.', { v: 'bajo' }),
    V('largo', 'Largo', '2.40 de frente. Para pantalla de 65\u2033 en adelante.', { v: 'puertas', w: 2.4 }),
    V('corto', 'Corto', '1.20 de frente. Para recámara o cuarto de tele chico.', { v: 'puertas', w: 1.2 }),
    V('largoAbierto', 'Largo abierto', '2.40 con repisa a la vista. Lo mejor para una consola y un receptor.', { v: 'abierto', w: 2.4 }),
    V('flotanteLargo', 'Flotante largo', '2.40 colgado. La imagen de sala más limpia que hay.', { v: 'flotante', w: 2.4 }),
    V('profundo', 'Profundo', '55 cm de fondo. Cabe un equipo de audio de verdad.', { v: 'puertas', d: 0.55 }),
  ] },
  tv: { ...(AN('Pantalla', N.Pantalla, 1.5, 0.06, 0.9, { w: 1.5 })), variantes: [
    V('muro', 'Colgada al muro', 'Sobre soporte fijo. Necesita contacto y HDMI detrás de la pantalla.', { v: 'muro' }),
    V('base', 'Con base central', 'Se apoya en el mueble. El cable baja a la vista si no hay canaleta.', { v: 'base' }),
    V('patas', 'Con patas', 'Dos patas separadas. Pide un mueble tan ancho como la tele.', { v: 'patas' }),
    V('marco', 'Tipo cuadro', 'Marco grueso, se lee como obra apagada. Va colgada y a ras de muro.', { v: 'marco' }),
    V('lienzo', 'Lienzo de proyector', 'No hay pantalla: hay proyector. Contacto en el plafón y HDMI hasta allá.', { v: 'lienzo', w: 2.4 }),
    V('m43', '43\u2033', '0.96 de ancho. Recámara o cocina.', { v: 'muro', w: 0.96 }),
    V('m55', '55\u2033', '1.23 de ancho. La medida más vendida.', { v: 'muro', w: 1.23 }),
    V('m65', '65\u2033', '1.45 de ancho. Pide 2.60 de distancia para verse bien.', { v: 'muro', w: 1.45 }),
    V('m75', '75\u2033', '1.67 de ancho. Pide 3.00 de distancia y muro reforzado.', { v: 'muro', w: 1.67 }),
    V('m85base', '85\u2033 con base', '1.90 de ancho apoyada. El mueble tiene que medir 1.90 o más.', { v: 'base', w: 1.9 }),
  ] },
  tapete: { ...(AN('Tapete', N.Tapete, 2.6, 1.8, 0.03, { w: 2.6, d: 1.8 })), variantes: [
    V('cenefa', 'Con cenefa', 'Marco de un tono y campo de otro. El más común.', { v: 'cenefa' }),
    V('liso', 'Liso', 'Un solo tono. Deja que hablen los muebles.', { v: 'liso' }),
    V('rayas', 'A rayas', 'Bandas a lo ancho. Alarga visualmente el cuarto.', { v: 'rayas' }),
    V('redondo', 'Redondo', 'Para debajo de una mesa redonda o al pie de la cama.', { v: 'redondo' }),
    V('corredor', 'Corredor', 'Angosto y largo, al costado de la cama o en un pasillo.', { v: 'corredor' }),
    V('cenefaGrande', 'Con cenefa, grande', '3.00 × 2.20. El que se mete bajo la cama y sale de los dos lados.', { v: 'cenefa', w: 3.0, d: 2.2 }),
    V('lisoGrande', 'Liso grande', '3.00 × 2.20 de un solo tono. Amortigua el eco de un cuarto vacío.', { v: 'liso', w: 3.0, d: 2.2 }),
    V('rayasAncho', 'Rayas anchas', 'Bandas gruesas. Marca la zona de estar dentro de un espacio largo.', { v: 'rayas', w: 3.0, d: 2.0 }),
    V('redondoGrande', 'Redondo grande', '2.20 de diámetro. Para debajo de una mesa redonda de seis.', { v: 'redondo', w: 2.2, d: 2.2 }),
    V('corredorLargo', 'Corredor largo', '3.20 × 0.80. Pasillo o al pie de una cama king.', { v: 'corredor', w: 3.2, d: 1.9 }),
  ] },
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
    V('barrotes', 'Cabecera de barrotes', 'Marco de tubo con travesaños. Deja ver el muro de atrás: no compite con un cuadro ni con paneles.', { v: 'barrotes' }),
    V('trineo', 'Trineo', 'Cabecera y piecera inclinadas. Ocupa 20 cm más de largo del que dice la medida del colchón.', { v: 'trineo' }),
    V('conPiecera', 'Con piecera', 'Tabla baja a los pies. Cambia por dónde se entra a la cama y en un cuarto angosto decide si se pasa.', { v: 'conPiecera' }),
    V('conCajones', 'Base con cajones', 'Guardado bajo el colchón. OJO: tapa el contacto de abajo, hay que subirlo antes.', { v: 'conCajones' }),
    V('king', 'King size', '1.90 × 2.00. Pide 70 cm libres de cada lado para poder tender.', { v: 'king', w: 1.9 }),
  ] },
  buro: { ...(AN('Buró', N.Buro, 0.46, 0.4, 0.54, { w: 0.46, alto: 0.52 })), variantes: [
    V('cajones', 'Dos cajones', 'El de siempre. Superficie completa para lámpara y despertador.', { v: 'cajones' }),
    V('repisa', 'Cajón y repisa', 'Un cajón arriba y hueco abierto abajo. Ahí caben libros y el cargador.', { v: 'repisa' }),
    V('patasAltas', 'Patas altas', 'Cuerpo chico sobre patas de madera. Se ve más ligero y se limpia debajo.', { v: 'patasAltas' }),
    V('redondo', 'Velador redondo', 'Cilíndrico, sin esquinas. Cabe en un pasillo angosto entre cama y muro.', { v: 'redondo' }),
    V('flotante', 'Flotante', 'Colgado del muro, sin patas. Hay que resolver el contacto ANTES de colgarlo.', { v: 'flotante' }),
    V('ancho', 'Ancho', 'Dos cajones sobre patas altas, 60 cm. Cabe una lámpara grande y el teléfono.', { v: 'ancho', w: 0.6 }),
    V('taburete', 'Taburete', 'Solo la tapa sobre tres patas. Lo mínimo, para una recámara chica.', { v: 'taburete', w: 0.38 }),
    V('canasta', 'Canasta', 'Cuerpo de fibra sobre patas de metal. Guarda a la vista y no pesa visualmente.', { v: 'canasta' }),
    V('vidrio', 'Cubierta de vidrio', 'Cajones con tapa clara. Devuelve luz en vez de tragársela.', { v: 'repisa' }),
    V('doble', 'Doble alto', 'Más alto que el colchón, para leer con la lámpara arriba del hombro.', { v: 'cajones', alto: 0.66 }),
  ] },
  closet: { ...(AN('Clóset', N.Closet, 1.8, 0.6, 2.15, { w: 1.8, alto: 2.15, d: 0.6 })), variantes: [
    V('dosPuertas', 'Dos puertas', 'Abatibles. Necesita 60 cm libres al frente para abrir.', { v: 'dosPuertas' }),
    V('corredizas', 'Corredizas', 'No necesita espacio al frente, pero solo se abre la mitad a la vez.', { v: 'corredizas' }),
    V('tresPuertas', 'Tres puertas', 'Para muro largo. Más hojas, hojas más angostas.', { v: 'tresPuertas' }),
    V('abierto', 'Abierto', 'Entrepaños y tubo a la vista. Se traga la luz del cuarto: pide una tira dentro.', { v: 'abierto' }),
    V('conEspejo', 'Con espejo', 'Una hoja espejeada. Devuelve luz y hace ver el cuarto al doble.', { v: 'conEspejo' }),
    V('cuatroPuertas', 'Cuatro puertas', 'Para muro completo. Hojas angostas, abren en 40 cm.', { v: 'tresPuertas', w: 2.4 }),
    V('bajo', 'Bajo', '1.60 de alto. Deja el muro libre arriba para un cuadro o una tira de luz.', { v: 'dosPuertas', alto: 1.6 }),
    V('abiertoAncho', 'Abierto ancho', 'Vestidor a la vista de 2.40. Pide iluminación propia dentro, siempre.', { v: 'abierto', w: 2.4 }),
    V('corredizasAncho', 'Corredizas anchas', '2.40 con dos hojas grandes. Cero espacio al frente.', { v: 'corredizas', w: 2.4 }),
    V('espejoDoble', 'Doble espejo', 'Las dos hojas espejeadas. Duplica el cuarto y la luz que hay.', { v: 'conEspejo', w: 2.0 }),
  ] },
  /* ── comedor ──
     La isla de cocina hace de mesa: mismas proporciones y misma altura, y
     ahorra modelar una pieza que se vería igual. */
  mesaComedor: { ...(A('Mesa de comedor', P.Island, 1.9, 0.95, 0.78)), variantes: [
    V('p4', '4 plazas · 1.20', 'Cuadrada corta. Pide 2.80 × 2.80 de espacio con sillas.', { w: 1.2, d: 0.9 }),
    V('p6', '6 plazas · 1.60', 'La más común. Pide 3.20 × 2.90.', { w: 1.6, d: 0.9 }),
    V('p8', '8 plazas · 2.00', 'Pide 3.60 × 2.90 para poder sentarse sin pegarle al muro.', { w: 2.0, d: 0.95 }),
    V('p10', '10 plazas · 2.60', 'Comedor formal. Pide 4.20 × 3.00 y un colgante de 1.20 arriba.', { w: 2.6, d: 1.0 }),
    V('p12', '12 plazas · 3.00', 'De salón. Dos colgantes, no uno.', { w: 3.0, d: 1.1 }),
    V('angosta6', 'Angosta · 6 plazas', '1.80 × 0.75. Para comedor de paso.', { w: 1.8, d: 0.75 }),
    V('anchaFamiliar', 'Ancha familiar', '2.00 × 1.10. Se come de un lado y se trabaja del otro.', { w: 2.0, d: 1.1 }),
    V('desayunador', 'Desayunador', '1.40 × 0.80 pegada a muro. Cuatro lugares sin comedor formal.', { w: 1.4, d: 0.8 }),
    V('alta', 'Alta de bar', '1.60 a 1.05 de alto. Con bancos, no con sillas.', { w: 1.6, d: 0.8, alto: 1.05 }),
    V('extensible', 'Extensible abierta', '2.40 con la hoja puesta. Hay que dejar el espacio aunque casi nunca esté abierta.', { w: 2.4, d: 0.95 }),
  ] },
  /* ── cocina ── */
  barra: A('Barra de cocina', P.KitchenRun, 3.4, 0.65, 0.9),
  isla: A('Isla', P.Island, 1.9, 0.9, 0.9),
  refri: A('Refrigerador', P.Fridge, 0.75, 0.7, 1.8),

  /* ── baño ── */
  wc: { ...(A('WC', F.Toilet, 0.4, 0.7, 0.75)), variantes: [
    V('alargado', 'Alargado', '68 cm de fondo. El cómodo, si el baño lo permite.', { w: 0.38, d: 0.68 }),
    V('compacto', 'Compacto', '60 cm. En un baño de 1.40 esos 8 cm son la puerta abriendo o no.', { w: 0.36, d: 0.6 }),
    V('redondo', 'Taza redonda', '63 cm. El de siempre en México.', { w: 0.37, d: 0.63 }),
    V('unaPieza', 'De una pieza', '72 cm, más bajo de tanque. Se limpia mejor.', { w: 0.4, d: 0.72, alto: 0.68 }),
    V('colgado', 'Colgado', 'Tanque en el muro. Pide muro de tabla-roca reforzado y decidirlo antes.', { w: 0.38, d: 0.56, alto: 0.42 }),
    V('esquinero', 'De esquina', 'Tanque triangular. Para el baño donde ya no cabe nada.', { w: 0.42, d: 0.62 }),
    V('altoConfort', 'Alto confort', 'Asiento a 48 cm. El que pide alguien mayor o con rodilla operada.', { w: 0.38, d: 0.68, alto: 0.86 }),
    V('infantil', 'Infantil', 'Bajo, para baño de niños.', { w: 0.32, d: 0.52, alto: 0.6 }),
    V('conBidet', 'Con asiento lavador', 'Necesita CONTACTO junto al WC, y casi nunca lo hay.', { w: 0.4, d: 0.7 }),
    V('doble', 'Doble descarga', 'El mismo con botón de dos volúmenes.', { w: 0.38, d: 0.66 }),
  ] },
  lavabo: { ...(A('Lavabo', F.Vanity, 1.0, 0.5, 0.85)), variantes: [
    V('v100', 'Mueble 1.00', 'Un lavabo con gabinete. El estándar.', { w: 1.0 }),
    V('v080', 'Mueble 0.80', 'Para baño chico o de visitas.', { w: 0.8 }),
    V('v120', 'Mueble 1.20', 'Un lavabo con mucha cubierta a los lados.', { w: 1.2 }),
    V('v150doble', 'Doble 1.50', 'Dos lavabos. Dos desagües y dos tomas: se decide antes de azulejar.', { w: 1.5 }),
    V('v180doble', 'Doble 1.80', 'Dos lavabos holgados, de recámara principal.', { w: 1.8 }),
    V('v060', 'Mínimo 0.60', 'Medio baño bajo la escalera.', { w: 0.6 }),
    V('flotante', 'Flotante 1.00', 'Sin patas. El desagüe tiene que salir por el muro, no por el piso.', { w: 1.0 }),
    V('flotante120', 'Flotante 1.20', 'La versión ancha del mismo problema de desagüe.', { w: 1.2 }),
    V('conTorre', 'Con torre 1.00', 'Gabinete alto a un lado. Come 30 cm de muro.', { w: 1.3 }),
    V('sobrecubierta', 'De sobreponer', 'Tazón encima de la cubierta. La llave tiene que ser alta.', { w: 1.0 }),
  ] },
  regadera: { ...(A('Regadera', F.Shower, 1.1, 1.0, 2.1)), variantes: [
    V('r110', '1.10 × 1.00', 'La de siempre.', { w: 1.1, d: 1.0 }),
    V('r090', '0.90 × 0.90', 'Cuadrada mínima. Se siente apretada de verdad.', { w: 0.9, d: 0.9 }),
    V('r120', '1.20 × 0.90', 'Rectangular cómoda.', { w: 1.2, d: 0.9 }),
    V('r150', '1.50 × 0.90', 'Con banca o con dos salidas.', { w: 1.5, d: 0.9 }),
    V('r180', '1.80 × 0.90', 'De recámara principal. Dos regaderas de verdad.', { w: 1.8, d: 0.9 }),
    V('esquina', 'De esquina 1.00', 'Aprovecha el rincón muerto.', { w: 1.0, d: 1.0 }),
    V('alargada', 'Alargada 2.00 × 0.80', 'Corrida a lo largo del baño.', { w: 2.0, d: 0.8 }),
    V('conTina', 'Sobre tina 1.70 × 0.80', 'Regadera dentro de la tina. Una sola toma para las dos.', { w: 1.7, d: 0.8 }),
    V('abierta', 'Abierta 1.40 × 1.20', 'Sin puerta, con pendiente al piso. Pide desagüe lineal.', { w: 1.4, d: 1.2 }),
    V('doble', 'Doble 2.20 × 1.00', 'Dos salidas independientes. Dos mezcladoras y más gasto de gas.', { w: 2.2, d: 1.0 }),
  ] },
  espejo: { ...(A('Espejo', F.Mirror, 0.9, 0.05, 0.8)), variantes: [
    V('e090', '0.90 × 0.80', 'Sobre un lavabo de 1.00.', { w: 0.9, h: 0.8 }),
    V('e070', '0.70 × 0.90', 'Vertical, para lavabo de 0.80.', { w: 0.7, h: 0.9 }),
    V('e120', '1.20 × 0.90', 'Sobre un lavabo ancho.', { w: 1.2, h: 0.9 }),
    V('e150doble', '1.50 doble', 'Corrido sobre dos lavabos.', { w: 1.5, h: 0.9 }),
    V('circular', 'Circular 0.80', 'Redondo. Pide arbotantes a los lados, no luz de arriba.', { w: 0.8, h: 0.8 }),
    V('altoTecho', 'De piso a plafón', '0.90 × 1.80. Devuelve el doble de luz al baño.', { w: 0.9, h: 1.8 }),
    V('conLuz', 'Con luz perimetral', '0.90 × 0.80 retroiluminado. Necesita contacto DETRÁS del espejo.', { w: 0.9, h: 0.8 }),
    V('conLuzAncho', 'Con luz, 1.40', 'El mismo problema de contacto, al doble de ancho.', { w: 1.4, h: 0.9 }),
    V('gabinete', 'Con gabinete', '0.90 × 0.75 y 15 cm de fondo. Guarda y refleja.', { w: 0.9, h: 0.75 }),
    V('cuerpoEntero', 'De cuerpo entero', '0.60 × 1.70 en el muro. Para vestidor o recámara.', { w: 0.6, h: 1.7 }),
  ] },
  toallero: { ...(A('Toallero', F.TowelRail, 0.6, 0.1, 0.1)), variantes: [
    V('t060', 'Barra 0.60', 'La de siempre, junto a la regadera.', { w: 0.6 }),
    V('t045', 'Barra 0.45', 'Para baño angosto.', { w: 0.45 }),
    V('t090', 'Barra 0.90', 'Dos toallas grandes.', { w: 0.9 }),
    V('doble', 'Barra doble 0.60', 'Dos niveles en el mismo ancho.', { w: 0.6 }),
    V('argolla', 'Argolla', 'Para la toalla de manos, junto al lavabo.', { w: 0.22 }),
    V('escalera', 'Escalera 0.50', 'Cuatro barras. Ocupa 1.20 de alto de muro.', { w: 0.5 }),
    V('electrico', 'Eléctrico 0.60', 'Toallero calefactor. CONTACTO detrás y circuito propio.', { w: 0.6 }),
    V('electricoAlto', 'Eléctrico escalera', '0.50 y 1.40 de alto. El mismo contacto, más carga.', { w: 0.5 }),
    V('gancho', 'Perchero de ganchos', '0.40 con tres ganchos. Lo que de verdad se usa.', { w: 0.4 }),
    V('depie', 'De pie', 'No va al muro: se para junto a la tina. Sin taladro.', { w: 0.55 }),
  ] },
  /* ── estudio ── */
  escritorio: { ...(A('Escritorio', P.Desk, 1.8, 0.7, 0.75)), variantes: [
    V('m140', '1.40 × 0.60', 'El de una recámara. Cabe un monitor de 27 y nada más.', { w: 1.4, d: 0.6 }),
    V('m160', '1.60 × 0.70', 'El estándar de oficina. Monitor y papeles al mismo tiempo.', { w: 1.6, d: 0.7 }),
    V('m180', '1.80 × 0.70', 'Cabe un ultrapanorámico de 34 con espacio a los lados.', { w: 1.8, d: 0.7 }),
    V('m200', '2.00 × 0.80', 'Dos monitores o dos personas. Pide 3.00 de muro con la silla.', { w: 2.0, d: 0.8 }),
    V('angosto', '1.20 × 0.50', 'Para un hueco. Un monitor de 24 y el teclado, ya.', { w: 1.2, d: 0.5 }),
    V('profundo', '1.60 × 0.80', 'Fondo de 80: cabe un monitor a la distancia correcta de los ojos.', { w: 1.6, d: 0.8 }),
    V('largo', '2.40 × 0.60', 'Corrido a lo largo del muro. El que mejor aprovecha una recámara.', { w: 2.4, d: 0.6 }),
    V('dePie', 'De pie · 1.60', 'A 1.05 de alto. El contacto tiene que subir con él.', { w: 1.6, d: 0.7, alto: 1.05 }),
    V('esquinaChica', 'De esquina · 1.40', 'Dos alas cortas. Aprovecha un rincón muerto.', { w: 1.4, d: 1.4 }),
    V('esquinaGrande', 'De esquina · 1.80', 'Rincón completo. Pide contacto en las dos alas.', { w: 1.8, d: 1.8 }),
  ] },
  monitor: A('Monitor', P.Monitor, 1.05, 0.2, 0.5),
  monitorCurvo: { ...(A('Monitor curvo', X.MonitorCurvo, 0.82, 0.28, 0.52)), variantes: [
    V('ultra34', 'Ultrapanorámico 34\u2033', '80 cm de ancho, curvatura 1500R. El más usado para trabajar.', { v: 'ultra34' }),
    V('plano27', 'Plano 27\u2033', 'Recto, 60 cm. Cabe en cualquier escritorio y es el más barato.', { v: 'plano27' }),
    V('curvo32', 'Curvo 32\u2033', 'Más alto y con más curva. Para ver y para jugar.', { v: 'curvo32' }),
    V('doble27', 'Doble 27\u2033', 'Dos pantallas en ángulo. Ocupa 1.25 m y pide dos contactos.', { v: 'doble27' }),
    V('ultra49', 'Ultrapanorámico 49\u2033', '1.19 m de ancho. No cabe en un escritorio de 1.20: hay que medir antes.', { v: 'ultra49' }),
    V('plano24', 'Plano 24\u2033', '53 cm. El de un escritorio chico o un segundo monitor vertical.', { v: 'plano27', w: 0.55 }),
    V('curvo34', 'Curvo 34\u2033 alto', 'Misma huella, más alto. Para leer documentos largos.', { v: 'curvo32' }),
    V('dobleUltra', 'Doble ultrapanorámico', 'Dos de 34\u2033. Necesita 1.70 de escritorio y dos contactos.', { v: 'doble27', w: 1.7 }),
    V('tv43', 'Pantalla de 43\u2033 como monitor', '1.00 de ancho. Se usa de monitor y de tele: un aparato menos.', { v: 'ultra49' }),
    V('vertical', 'Vertical', 'Girado 90\u00b0. Para código o para leer; ocupa 35 cm de frente.', { v: 'plano27', w: 0.36 }),
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
  libreroLleno: { ...(AN('Librero con libros', N.Librero, 1.1, 0.32, 1.7, { w: 1.05, alto: 1.6 })), variantes: [
    V('l90', '0.90 × 1.80', 'De recámara o estudio chico.', { w: 0.9, h: 1.8, alto: 1.8 }),
    V('l120', '1.20 × 1.80', 'El estándar.', { w: 1.2, h: 1.8, alto: 1.8 }),
    V('l160', '1.60 × 1.80', 'Ya pide anclaje al muro.', { w: 1.6, h: 1.8, alto: 1.8 }),
    V('l200', '2.00 × 2.10', 'Muro completo. Se ilumina con tira, no con plafón.', { w: 2.0, h: 2.1, alto: 2.1 }),
    V('bajo', 'Bajo 1.60 × 0.90', 'A la altura del respaldo del sofá. Sirve de repisa.', { w: 1.6, h: 0.9, alto: 0.9 }),
    V('bajoLargo', 'Bajo largo 2.40 × 0.75', 'Corrido bajo una ventana.', { w: 2.4, h: 0.75, alto: 0.75 }),
    V('altoAngosto', 'Alto angosto 0.60 × 2.10', 'Para un hueco entre puerta y esquina.', { w: 0.6, h: 2.1, alto: 2.1 }),
    V('techo', 'De piso a techo 1.20 × 2.50', 'Llega al plafón. Se instala antes de pintar.', { w: 1.2, h: 2.5, alto: 2.5 }),
    V('doble', 'Doble 2.40 × 2.10', 'Dos cuerpos. Ancla obligado y tira dentro.', { w: 2.4, h: 2.1, alto: 2.1 }),
    V('vitrina', 'Vitrina 0.90 × 2.00', 'Cerrado y alto. Pide luz interior propia.', { w: 0.9, h: 2.0, alto: 2.0 }),
  ] },
  cuadroSolo: { ...(AN('Cuadro', N.Cuadro, 0.58, 0.06, 0.78, { w: 0.55, h: 0.72 })), variantes: [
    V('c40', '40 × 50', 'De pasillo o sobre un buró.', { w: 0.4, h: 0.5 }),
    V('c55', '55 × 72', 'El de siempre.', { w: 0.55, h: 0.72 }),
    V('c70', '70 × 90', 'Sobre una cómoda o un mueble de TV.', { w: 0.7, h: 0.9 }),
    V('c90', '90 × 120', 'Pieza principal de un muro.', { w: 0.9, h: 1.2 }),
    V('c120', '120 × 90 horizontal', 'Sobre una cabecera o un sofá.', { w: 1.2, h: 0.9 }),
    V('panoramico', 'Panorámico 160 × 70', 'Encima de un sofá de tres.', { w: 1.6, h: 0.7 }),
    V('cuadrado60', 'Cuadrado 60', 'Para agrupar de tres o de cuatro.', { w: 0.6, h: 0.6 }),
    V('cuadrado90', 'Cuadrado 90', 'Solo, centrado en un muro corto.', { w: 0.9, h: 0.9 }),
    V('vertical', 'Vertical 50 × 140', 'Alarga un muro bajo.', { w: 0.5, h: 1.4 }),
    V('mini', 'Mini 25 × 30', 'De repisa, recargado.', { w: 0.25, h: 0.3 }),
  ] },
  muroCuadros: A('Muro de cuadros', X.MuroCuadros, 1.2, 0.05, 1.1),
  plantaAlta: AN('Planta alta', N.Planta, 0.45, 0.45, 1.35, { alto: 1.3 }),
  macetaChica: { ...(A('Maceta', X.MacetaChica, 0.2, 0.2, 0.35)), variantes: [
    V('m20', '20 cm', 'De repisa o de mesa. Una suculenta.', { w: 0.2, d: 0.2, alto: 0.24 }),
    V('m28', '28 cm', 'De buró o de barra.', { w: 0.28, d: 0.28, alto: 0.32 }),
    V('m35', '35 cm', 'De piso, planta chica.', { w: 0.35, d: 0.35, alto: 0.4 }),
    V('m45', '45 cm', 'De piso, planta de interior mediana.', { w: 0.45, d: 0.45, alto: 0.5 }),
    V('m60', '60 cm', 'Planta grande de rincón.', { w: 0.6, d: 0.6, alto: 0.65 }),
    V('alta', 'Alta y angosta', '30 cm de boca, 70 de alto. Para un helecho colgante.', { w: 0.3, d: 0.3, alto: 0.7 }),
    V('baja', 'Baja y ancha', '55 de boca, 25 de alto. Cactáceas o suculentas juntas.', { w: 0.55, d: 0.55, alto: 0.25 }),
    V('cuadrada', 'Cuadrada 40', 'De esquina, se recarga en dos muros.', { w: 0.4, d: 0.4, alto: 0.45 }),
    V('jardinera', 'Jardinera', '1.00 × 0.30. Corre a lo largo de un muro o una ventana.', { w: 1.0, d: 0.3, alto: 0.35 }),
    V('conPedestal', 'Con pedestal', '30 cm sobre base de 60. Sube la planta a la vista.', { w: 0.3, d: 0.3, alto: 0.95 }),
  ] },
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
    V('tripodeAlta', 'Trípode alta', 'Tres patas abiertas y pantalla ancha. Aguanta bien en un rincón sin muro atrás.', { v: 'tripodeAlta' }),
    V('columna', 'Columna opalina', 'Toda la pieza es la luz. La que menos sombra dura hace de las diez.', { v: 'columna' }),
    V('plato', 'Plato al techo', 'Rebota toda la luz en el plafón. La más suave, y la peor para leer.', { v: 'plato' }),
    V('tresLuces', 'Tres luces', 'Tres pantallas en un mismo poste. Se pueden encender por separado si van en circuitos distintos.', { v: 'tresLuces' }),
    V('invertido', 'Cono invertido', 'Abre hacia arriba y se estrecha abajo. Luz indirecta con un remate más marcado.', { v: 'invertido' }),
  ] },
  chimenea: A('Chimenea', X.Chimenea, 1.7, 0.45, 1.2),
  relojPared: A('Reloj de pared', X.RelojPared, 0.34, 0.05, 0.34),
  revistero: A('Revistero', X.Revistero, 0.42, 0.3, 0.45),

  sillaComedor: { ...(A('Silla de comedor', X.SillaComedor, 0.46, 0.46, 0.95)), variantes: [
    V('estandar', 'Estándar', '46 × 90. La de siempre. Pide 60 cm de retiro para levantarse.', { w: 0.46, alto: 0.9, d: 0.5 }),
    V('ancha', 'Ancha', '52 cm. Cómoda, pero en una mesa de seis ya no caben seis.', { w: 0.52, alto: 0.9, d: 0.55 }),
    V('angosta', 'Angosta', '40 cm. Entra una más por lado en la misma mesa.', { w: 0.4, alto: 0.9, d: 0.46 }),
    V('respaldoAlto', 'Respaldo alto', '1.05 de alto. Tapa la vista si la mesa está a media sala.', { w: 0.46, alto: 1.05, d: 0.5 }),
    V('respaldoBajo', 'Respaldo bajo', '75 cm. Deja ver el cuarto completo.', { w: 0.46, alto: 0.75, d: 0.5 }),
    V('conBrazos', 'Con brazos', '56 cm. Las de cabecera, dos por comedor.', { w: 0.56, alto: 0.92, d: 0.55 }),
    V('banca', 'Banca 1.20', 'Tres lugares en un solo mueble. Se guarda bajo la mesa.', { w: 1.2, alto: 0.45, d: 0.4 }),
    V('bancaLarga', 'Banca 1.60', 'Cuatro lugares del lado del muro.', { w: 1.6, alto: 0.45, d: 0.4 }),
    V('infantil', 'Infantil', '38 × 70. Para niño, no periquera.', { w: 0.38, alto: 0.7, d: 0.4 }),
    V('tapizada', 'Tapizada', '50 cm y más gruesa. Más cómoda y más difícil de limpiar.', { w: 0.5, alto: 0.92, d: 0.56 }),
  ] },
  bancoBarra: { ...(A('Banco de barra', X.BancoBarra, 0.36, 0.36, 0.72)), variantes: [
    V('b65', 'Alto 65', 'Para barra de 90. El estándar.', { w: 0.36, alto: 0.65, d: 0.36 }),
    V('b75', 'Alto 75', 'Para barra de 1.05, de las altas.', { w: 0.36, alto: 0.75, d: 0.36 }),
    V('b45', 'Bajo 45', 'Para mesa normal, no para barra.', { w: 0.36, alto: 0.45, d: 0.36 }),
    V('conRespaldo', 'Con respaldo 65', 'Se puede estar una hora, no diez minutos.', { w: 0.4, alto: 1.0, d: 0.4 }),
    V('conRespaldo75', 'Con respaldo 75', 'El mismo, para barra alta.', { w: 0.4, alto: 1.1, d: 0.4 }),
    V('ancho', 'Ancho 65', '44 cm de asiento. Cómodo; caben menos por barra.', { w: 0.44, alto: 0.65, d: 0.44 }),
    V('angosto', 'Angosto 65', '30 cm. Entran cuatro donde entraban tres.', { w: 0.3, alto: 0.65, d: 0.3 }),
    V('regulable', 'Regulable', 'Sube y baja de 60 a 78. Para barra de altura rara.', { w: 0.38, alto: 0.7, d: 0.38 }),
    V('tapizado', 'Tapizado 65', 'Asiento acolchado. En cocina se ensucia.', { w: 0.4, alto: 0.68, d: 0.4 }),
    V('conBrazos', 'Con brazos', '48 cm. El de una barra que se usa de comedor.', { w: 0.48, alto: 1.0, d: 0.46 }),
  ] },
  alacena: { ...(A('Alacena', X.Alacena, 1.8, 0.35, 0.7)), variantes: [
    V('a180', '1.80 · dos puertas', 'La de siempre, sobre la barra.', { w: 1.8, alto: 0.7, hojas: 2 }),
    V('a240', '2.40 · tres puertas', 'Corrida sobre una barra larga.', { w: 2.4, alto: 0.7, hojas: 3 }),
    V('a120', '1.20 · dos puertas', 'Para cocina angosta.', { w: 1.2, alto: 0.7, hojas: 2 }),
    V('alta', 'Alta 0.90', 'Un entrepaño más. Lo de arriba se alcanza con banco.', { w: 1.8, alto: 0.9, hojas: 2 }),
    V('bajaLarga', 'Baja y larga', '2.40 × 0.50. Deja ver el muro y la tira de luz debajo.', { w: 2.4, alto: 0.5, hojas: 3 }),
    V('techo', 'Hasta el techo', '1.80 × 1.20. Aprovecha el muro completo; se instala antes de plafón.', { w: 1.8, alto: 1.2, hojas: 2 }),
    V('cuatro', 'Cuatro puertas', '3.00 corridos. Hojas angostas, abren en 40 cm.', { w: 3.0, alto: 0.7, hojas: 4 }),
    V('profunda', 'Profunda 45', 'Fondo de 45: cabe la vajilla grande, pero se golpea la cabeza.', { w: 1.8, alto: 0.7, d: 0.45, hojas: 2 }),
    V('esquina', 'De esquina', '0.90 × 0.90. El mueble que siempre queda muerto si no se resuelve.', { w: 0.9, alto: 0.7, hojas: 1 }),
    V('vitrina', 'Con vitrina', '1.80 de una hoja abierta. Pide tira de luz dentro.', { w: 1.8, alto: 0.7, hojas: 1 }),
  ] },
  campana: { ...(A('Campana', X.Campana, 0.84, 0.84, 0.7)), variantes: [
    V('piramide', 'Pirámide de pared', '84 cm, la clásica. Ducto al muro y contacto arriba.', { w: 0.84, tipo: 'piramide' }),
    V('piramide90', 'Pirámide de 90', 'Para estufa de seis. La campana va 15 cm más ancha que la estufa.', { w: 0.9, tipo: 'piramide' }),
    V('recta', 'Recta de pared', 'Caja plana con chimenea. La que menos estorba a la vista.', { w: 0.84, tipo: 'recta' }),
    V('recta90', 'Recta de 90', 'Misma forma para estufa de seis.', { w: 0.9, tipo: 'recta' }),
    V('isla', 'De isla', 'Cuelga y se ve por los cuatro lados. Refuerzo en losa y ducto por plafón.', { w: 0.9, tipo: 'isla' }),
    V('isla120', 'De isla · 1.20', 'Sobre isla grande o estufa semiprofesional.', { w: 1.2, tipo: 'isla' }),
    V('gaveta', 'De gaveta', 'Se esconde bajo la alacena. No se ve, pero el ducto sigue existiendo.', { w: 0.6, tipo: 'gaveta' }),
    V('gaveta90', 'De gaveta · 90', 'La misma, para estufa ancha.', { w: 0.9, tipo: 'gaveta' }),
    V('compacta', 'Compacta 60', 'Para parrilla de 60 en cocina chica.', { w: 0.6, tipo: 'recta' }),
    V('grande', 'Grande 1.20', 'Pirámide de 1.20. Pide motor externo o suena como avión.', { w: 1.2, tipo: 'piramide' }),
  ] },
  estufa: { ...(A('Estufa', X.Estufa, 0.78, 0.64, 0.95)), variantes: [
    V('gas4', 'Gas · 4 quemadores', '76 cm. La de siempre. Pide sensor de fuga cerca del PISO: el LP se acumula abajo.', { w: 0.76, quemadores: 4 }),
    V('gas6', 'Gas · 6 quemadores', '91 cm. No cabe en el hueco de 76 que suele dejar el albañil: mídelo.', { w: 0.91, quemadores: 6 }),
    V('gas4chica', 'Gas · 60 cm', 'Para cocina angosta o departamento chico.', { w: 0.6, quemadores: 4 }),
    V('empotradaGas', 'Parrilla de gas empotrada', 'Solo la parrilla; el mueble de abajo es carpintería. Mismo sensor de fuga.', { w: 0.76, quemadores: 4, empotrada: true }),
    V('empotradaGas5', 'Parrilla de gas · 5', '90 cm empotrada, cinco quemadores. La de una cocina que se usa.', { w: 0.9, quemadores: 6, empotrada: true }),
    V('induccion4', 'Inducción · 4 zonas', '60 cm. Sin gas: no lleva sensor de fuga, pero pide 220 V y circuito propio de 40 A.', { w: 0.6, quemadores: 4, empotrada: true, induccion: true }),
    V('induccion5', 'Inducción · 5 zonas', '80 cm. Mismo circuito dedicado, más carga.', { w: 0.8, quemadores: 6, empotrada: true, induccion: true }),
    V('electrica', 'Eléctrica de piso', '76 cm con horno eléctrico. 220 V hasta el mueble.', { w: 0.76, quemadores: 4, induccion: true }),
    V('profesional', 'Semiprofesional', '1.20 y seis quemadores. Campana de 1.20 obligada y ducto de verdad.', { w: 1.2, quemadores: 6 }),
    V('dosQuemadores', 'Parrilla de dos', '40 cm. Para cocineta, azotehuela o cuarto de servicio.', { w: 0.4, quemadores: 2, empotrada: true }),
  ] },
  microondas: { ...(A('Microondas', X.Microondas, 0.52, 0.38, 0.3)), variantes: [
    V('m20', '20 litros', '46 cm. El chico, de barra.', { w: 0.46, alto: 0.27, d: 0.34 }),
    V('m25', '25 litros', '52 cm. El más vendido.', { w: 0.52, alto: 0.3, d: 0.38 }),
    V('m30', '30 litros', '55 cm. Con plato grande.', { w: 0.55, alto: 0.32, d: 0.42 }),
    V('m42', '42 litros', '60 cm. Ya es de empotrar, no de barra.', { w: 0.6, alto: 0.38, d: 0.45 }),
    V('empotrado', 'De empotrar 60', 'Va en torre de horno. Contacto detrás y ventilación arriba.', { w: 0.6, alto: 0.4, d: 0.5 }),
    V('bajoAlacena', 'Bajo alacena', 'Colgado bajo el gabinete. Libera la barra entera.', { w: 0.76, alto: 0.4, d: 0.4 }),
    V('conGrill', 'Con grill', '58 cm y más alto. Pide su propio circuito si se usa a diario.', { w: 0.58, alto: 0.36, d: 0.42 }),
    V('compacto', 'Compacto', '44 cm. Para cocineta o cuarto de servicio.', { w: 0.44, alto: 0.26, d: 0.32 }),
    V('torre', 'En torre con horno', 'Empotrado sobre el horno. Dos circuitos, no uno.', { w: 0.6, alto: 0.45, d: 0.55 }),
    V('grande', 'Grande 1.10 pies', '62 cm. El de una familia grande.', { w: 0.62, alto: 0.36, d: 0.46 }),
  ] },
  lavavajillas: { ...(A('Lavavajillas', X.Lavavajillas, 0.6, 0.6, 0.85)), variantes: [
    V('l60', '60 cm', 'El estándar, 12 servicios. Toma de agua, drenaje y contacto.', { w: 0.6 }),
    V('l45', '45 cm', 'Angosto, 9 servicios. Para cocina chica.', { w: 0.45 }),
    V('integrado60', 'Integrado 60', 'Con frente de carpintería: desaparece en el mueble.', { w: 0.6, integrado: true }),
    V('integrado45', 'Integrado 45', 'El angosto, también oculto.', { w: 0.45, integrado: true }),
    V('semiIntegrado', 'Semiintegrado', 'Frente de madera y panel a la vista arriba.', { w: 0.6 }),
    V('l60ancho', '60 XL', '14 servicios. Mismo hueco, más alto por dentro.', { w: 0.6 }),
    V('cajon', 'De cajón', '60 cm en dos cajones independientes. Dos ciclos a la vez.', { w: 0.6, integrado: true }),
    V('sobreBarra', 'De barra', '55 cm, encima. Sin obra: se conecta a la llave del fregadero.', { w: 0.55 }),
    V('compacto', 'Compacto', '45 cm y bajo. Para departamento sin lugar.', { w: 0.45 }),
    V('doble', 'Doble 60', 'Dos equipos de 60. Cocina de casa grande o de renta corta.', { w: 1.2 }),
  ] },
  comoda: { ...(AN('Cómoda', N.Comoda, 1.1, 0.45, 0.82, { w: 1.1, alto: 0.82, d: 0.45 })), variantes: [
    V('tres', 'Tres cajones', 'La de recámara. 82 cm de alto, buena superficie encima.', { v: 'tres' }),
    V('cuatro', 'Cuatro cajones', 'Más guardado en el mismo ancho. Cajones más bajos.', { v: 'cuatro' }),
    V('seis', 'Seis cajones', 'Dos columnas de tres. Para ropa de dos personas.', { v: 'seis' }),
    V('dosPuertas', 'Dos puertas', 'Abatible en vez de cajones. Ahí cabe el módem sin que se vea.', { v: 'dosPuertas' }),
    V('patasAltas', 'Patas altas', 'Cuerpo levantado 26 cm. Se ve más ligera y se limpia debajo.', { v: 'patasAltas' }),
    V('ancha', 'Ancha', '1.60 de frente. Sirve de mueble de tele en una recámara.', { v: 'tres', w: 1.6 }),
    V('angosta', 'Angosta', '0.80 de frente. Para el hueco entre la puerta y el clóset.', { v: 'tres', w: 0.8 }),
    V('alta', 'Alta', '1.20 de alto, cuatro cajones. Guarda lo mismo ocupando la mitad de muro.', { v: 'cuatro', alto: 1.2 }),
    V('seisAlta', 'Seis cajones alta', 'Dos columnas y 1.10 de alto. La cajonera de una pareja.', { v: 'seis', alto: 1.1 }),
    V('puertasAltas', 'Puertas y patas', 'Abatible sobre patas. Ahí cabe el módem sin que se vea y sin ahogarlo.', { v: 'dosPuertas', alto: 0.9 }),
  ] },
  espejoPie: A('Espejo de pie', X.EspejoPie, 0.55, 0.3, 1.65),
  bancaPie: A('Banca de pie de cama', X.BancaPie, 1.2, 0.4, 0.5),
  cuna: A('Cuna', X.Cuna, 1.3, 0.7, 0.75),

  tina: { ...(A('Tina', X.Tina, 1.7, 0.78, 0.6)), variantes: [
    V('t170', '1.70 × 0.78', 'La estándar empotrada.', { w: 1.7, d: 0.78 }),
    V('t150', '1.50 × 0.70', 'Corta, para baño chico.', { w: 1.5, d: 0.7 }),
    V('t180', '1.80 × 0.80', 'Holgada, de recámara principal.', { w: 1.8, d: 0.8 }),
    V('exenta170', 'Exenta 1.70', 'Separada del muro. Toma y desagüe en el PISO: se decide antes de colar.', { w: 1.7, d: 0.78, exenta: true }),
    V('exenta160', 'Exenta ovalada 1.60', 'La de las fotos. Pide 60 cm libres alrededor.', { w: 1.6, d: 0.8, exenta: true }),
    V('esquina', 'De esquina 1.40', 'Triangular. Aprovecha el rincón y ahorra 40 cm de muro.', { w: 1.4, d: 1.4 }),
    V('honda', 'Honda japonesa', '1.20 × 0.80 y profunda. Se llena más: revisa el boiler.', { w: 1.2, d: 0.8, exenta: true }),
    V('conHidro', 'Con hidromasaje', '1.80 × 0.90. Necesita contacto propio y registro para la bomba.', { w: 1.8, d: 0.9 }),
    V('doble', 'Doble 2.00', 'Para dos, con desagüe al centro.', { w: 2.0, d: 1.0, exenta: true }),
    V('infantil', 'Infantil 1.20', 'Baja y corta, para baño de niños.', { w: 1.2, d: 0.7 }),
  ] },
  lavadora: { ...(A('Lavadora', X.Lavadora, 0.64, 0.64, 0.88)), variantes: [
    V('carga60', 'Carga frontal 60', 'La estándar. Toma, drenaje y contacto propio.', { w: 0.6, alto: 0.85, d: 0.6 }),
    V('carga70', 'Carga superior 70', 'Más ancha y más alta. No se le puede poner secadora encima.', { w: 0.7, alto: 1.05, d: 0.68 }),
    V('compacta', 'Compacta 50', 'Para azotehuela angosta.', { w: 0.5, alto: 0.82, d: 0.5 }),
    V('grande', 'Gran capacidad 68', '22 kg. Pide toma reforzada y piso a nivel.', { w: 0.68, alto: 0.9, d: 0.72 }),
    V('empotrada', 'De empotrar 60', 'Bajo cubierta. La cubierta se hace después de medirla.', { w: 0.6, alto: 0.82, d: 0.58 }),
    V('torre', 'Lavasecadora torre', '60 × 1.80: lavadora y secadora en un solo hueco.', { w: 0.6, alto: 1.8, d: 0.62 }),
    V('dosEnUno', 'Lava y seca 60', 'Una sola máquina. Un contacto, un drenaje, la mitad del espacio.', { w: 0.6, alto: 0.85, d: 0.62 }),
    V('doble', 'Doble 1.20', 'Dos equipos lado a lado. Dos contactos y dos tomas.', { w: 1.2, alto: 0.85, d: 0.6 }),
    V('industrial', 'Semiindustrial 75', 'Para renta corta o casa grande. 220 V.', { w: 0.75, alto: 1.0, d: 0.75 }),
    V('portatil', 'Portátil 45', 'Se conecta a la llave del lavadero. Sin obra.', { w: 0.45, alto: 0.7, d: 0.45 }),
  ] },
  secadora: { ...(A('Secadora', X.Secadora, 0.64, 0.64, 0.88)), variantes: [
    V('gas60', 'De gas 60', 'La más barata de operar. Necesita línea de gas Y ducto al exterior.', { w: 0.6, alto: 0.85, d: 0.6 }),
    V('electrica60', 'Eléctrica 60', 'Sin gas, pero 220 V y circuito propio.', { w: 0.6, alto: 0.85, d: 0.6 }),
    V('condensacion', 'De condensación 60', 'Sin ducto: para departamento sin salida al exterior.', { w: 0.6, alto: 0.85, d: 0.62 }),
    V('compacta', 'Compacta 50', 'Azotehuela angosta.', { w: 0.5, alto: 0.82, d: 0.5 }),
    V('grande', 'Gran capacidad 68', 'Pide ducto de 10 cm y salida corta.', { w: 0.68, alto: 0.9, d: 0.72 }),
    V('apilada', 'Apilada sobre lavadora', '60 × 1.75. Un solo hueco, dos equipos: kit de apilado obligatorio.', { w: 0.6, alto: 0.9, d: 0.6 }),
    V('empotrada', 'De empotrar 60', 'Bajo cubierta. El ducto sale por atrás.', { w: 0.6, alto: 0.82, d: 0.58 }),
    V('doble', 'Doble 1.20', 'Dos equipos. Dos ductos, no uno.', { w: 1.2, alto: 0.85, d: 0.6 }),
    V('bombaCalor', 'Bomba de calor 60', 'La que menos gasta. Tarda el doble y no lleva ducto.', { w: 0.6, alto: 0.85, d: 0.64 }),
    V('industrial', 'Semiindustrial 75', 'Ducto de 15 cm y gas de verdad.', { w: 0.75, alto: 1.0, d: 0.75 }),
  ] },
  boiler: { ...(A('Boiler', X.Boiler, 0.42, 0.25, 0.7)), variantes: [
    V('paso6', 'De paso 6 L', 'Para un baño. Gas y ducto de tiro.', { w: 0.35, alto: 0.6, d: 0.22 }),
    V('paso11', 'De paso 11 L', 'Dos baños si no se usan a la vez.', { w: 0.42, alto: 0.7, d: 0.25 }),
    V('paso16', 'De paso 16 L', 'Dos baños simultáneos. Línea de gas de mayor calibre.', { w: 0.48, alto: 0.8, d: 0.28 }),
    V('deposito38', 'Depósito 38 L', 'El de siempre. Tarda en calentar y guarda.', { w: 0.45, alto: 1.2, d: 0.45 }),
    V('deposito76', 'Depósito 76 L', 'Casa de cuatro. Ocupa un metro cuadrado real.', { w: 0.55, alto: 1.5, d: 0.55 }),
    V('electrico', 'Eléctrico 40 L', 'Sin gas ni ducto, pero circuito de 30 A propio.', { w: 0.42, alto: 1.0, d: 0.42 }),
    V('solar', 'Solar 150 L', 'En azotea, con respaldo. Pide estructura y 1.80 × 2.00 libres.', { w: 1.8, alto: 0.6, d: 1.2 }),
    V('instantaneoElec', 'Instantáneo eléctrico', 'Bajo el lavabo. 220 V a 30 cm del agua: se cotiza con electricista.', { w: 0.3, alto: 0.4, d: 0.15 }),
    V('condensacion', 'De condensación', 'Más eficiente y con desagüe de condensados, que casi nadie deja.', { w: 0.5, alto: 0.85, d: 0.3 }),
    V('doble', 'Dos de paso 11', 'Uno por zona. Menos espera y menos gas desperdiciado.', { w: 0.9, alto: 0.7, d: 0.25 }),
  ] },
  lavadero: A('Lavadero', X.Lavadero, 0.94, 0.64, 0.9),
  tendedero: A('Tendedero', X.Tendedero, 1.45, 0.2, 1.1),
  tinaco: A('Tinaco', X.Tinaco, 0.9, 0.9, 1.05),

  archivero: A('Archivero', X.Archivero, 0.45, 0.55, 0.7),
  pizarron: A('Pizarrón', X.Pizarron, 1.8, 0.05, 1.05),
  sillaVisita: { ...(A('Silla de visita', X.SillaVisita, 0.46, 0.46, 0.9)), variantes: [
    V('estandar', 'Estándar', '50 × 82. La del otro lado del escritorio.', { w: 0.5, alto: 0.82, d: 0.55 }),
    V('compacta', 'Compacta', '44 cm. Para oficina chica.', { w: 0.44, alto: 0.78, d: 0.48 }),
    V('conBrazos', 'Con brazos', '58 cm. La de una sala de juntas.', { w: 0.58, alto: 0.84, d: 0.58 }),
    V('alta', 'Respaldo alto', '95 cm. Se lee como silla de titular.', { w: 0.5, alto: 0.95, d: 0.55 }),
    V('lounge', 'Lounge', '70 × 75, baja y honda. Para esperar, no para trabajar.', { w: 0.7, alto: 0.75, d: 0.75 }),
    V('apilable', 'Apilable', '45 cm. Se guardan cinco en un metro de muro.', { w: 0.45, alto: 0.8, d: 0.5 }),
    V('plegable', 'Plegable', '44 cm. La que sale solo cuando llega gente.', { w: 0.44, alto: 0.8, d: 0.46 }),
    V('ejecutiva', 'Ejecutiva', '62 × 1.10. Con base de estrella; pide 1.20 de retiro.', { w: 0.62, alto: 1.1, d: 0.62 }),
    V('taburete', 'Taburete', '40 × 45, sin respaldo. Se mete debajo del escritorio.', { w: 0.4, alto: 0.45, d: 0.4 }),
    V('doble', 'Confidente doble', '1.10 de dos plazas. Para recibidor.', { w: 1.1, alto: 0.82, d: 0.6 }),
  ] },
  macetaGrande: A('Maceta grande', X.MacetaGrande, 0.55, 0.55, 1.3),

  /* ── arte ── */
  cuadroArte: AN('Cuadro de arte', N.Cuadro, 0.66, 0.06, 0.86, { w: 0.62, h: 0.8, tono: 'acento' }),
  cuadroGrande: AN('Cuadro grande', N.Cuadro, 1.36, 0.06, 0.96, { w: 1.3, h: 0.9, tono: 'apoyo' }),
  triptico: A('Tríptico', X.TripticoArte, 1.5, 0.05, 0.68),
  cuadroPiso: A('Cuadro recargado', X.CuadroPiso, 0.86, 0.3, 1.1),

  /* ── lámparas: todas llevan foco inteligente ── */
  lamparaArco: { ...(L('Lámpara de arco', X.LamparaArco, 1.3, 0.4, 1.85)), variantes: [
    V('a110', 'Arco 1.10', 'El de siempre, sobre un sillón de tres.', { alcance: 1.1, altura: 1.35 }),
    V('a140', 'Arco 1.40', 'Llega al centro de una sala grande desde el rincón.', { alcance: 1.4, altura: 1.45 }),
    V('a080', 'Arco 0.80', 'Corto, para junto a una cama o un sillón individual.', { alcance: 0.8, altura: 1.25 }),
    V('alto', 'Arco alto', 'Cabeza a 2.05. Pide techo de 2.60 o roza.', { alcance: 1.2, altura: 1.6 }),
    V('bajo', 'Arco bajo', 'Cabeza a 1.55. Para techo bajo o para leer sentado.', { alcance: 1.1, altura: 1.1 }),
    V('comedor', 'De comedor', 'Alcance de 1.60: sustituye al colgante cuando no hay salida en el techo.', { alcance: 1.6, altura: 1.5 }),
    V('lectura', 'De lectura', 'Corto y bajo: el cono cae justo sobre el sillón.', { alcance: 0.9, altura: 1.15 }),
    V('gran', 'Gran arco', '1.90 de vuelo. Necesita 60 kg de base y 2.20 de muro libre.', { alcance: 1.9, altura: 1.6 }),
    V('esquina', 'De esquina', 'Vuelo corto y mucha altura: cae desde el rincón sin estorbar el paso.', { alcance: 0.7, altura: 1.7 }),
    V('cama', 'Sobre la cama', 'Alcance de 1.30 a 1.40 de alto. Sustituye a las dos lámparas de buró.', { alcance: 1.3, altura: 1.4 }),
  ] },
  lamparaColgante: { ...(L('Colgante', X.LamparaColgante, 0.24, 0.24, 1.5)), variantes: [
    V('campana', 'Campana', 'Cono cerrado. Manda la luz abajo, sobre la mesa. Cuelga a 75 cm del tablero.', { v: 'campana', caida: 1.24 }),
    V('campanaAlta', 'Campana alta', 'La misma en un techo de 3.00. El cable de 1.90 hay que pedirlo.', { v: 'campana', caida: 1.9 }),
    V('plato', 'Plato ancho', 'Más ancho y más plano. Cubre una mesa larga con una sola.', { v: 'plato', caida: 1.24 }),
    V('tambor', 'Tambor', 'Cilindro recto. Reparte arriba y abajo por igual, no hace cono.', { v: 'tambor', caida: 1.2 }),
    V('invertido', 'Invertido', 'Casi toda la luz al techo. Ambiente puro: para leer no sirve.', { v: 'invertido', caida: 1.2 }),
    V('tubo', 'Tubo largo', 'Angosto y largo. Para barra angosta o pasillo.', { v: 'tubo', caida: 1.0 }),
    V('jaula', 'Jaula', 'La luz sale por todos lados. A la altura del ojo deslumbra: cuélgala alto.', { v: 'jaula', caida: 1.3 }),
    V('domo', 'Domo', 'Hondo, el clásico de barra. Concentra sin deslumbrar de lado.', { v: 'domo', caida: 1.2 }),
    V('pasillo', 'De pasillo', 'Campana con caída corta: 2.10 libres, que es lo mínimo para pasar debajo.', { v: 'campana', caida: 0.5 }),
    V('dobleAltura', 'De doble altura', 'Caída de 2.60. Se cambia el foco con andamio: que sea de los que duran.', { v: 'tambor', caida: 2.6 }),
  ] },
  lamparaEsfera: { ...(L('Colgante esfera', X.LamparaEsfera, 0.32, 0.32, 1.2)), variantes: [
    V('e16', 'Esfera 32 cm', 'La de siempre. Sobre una mesa de cuatro.', { r: 0.16, caida: 1.0 }),
    V('e22', 'Esfera 44 cm', 'Sobre mesa de seis o en un recibidor.', { r: 0.22, caida: 1.0 }),
    V('e30', 'Esfera 60 cm', 'Pieza principal. Pide 2.80 de altura o queda encima de la cabeza.', { r: 0.3, caida: 0.9 }),
    V('e12', 'Esfera 24 cm', 'Chica, para agrupar de tres.', { r: 0.12, caida: 1.1 }),
    V('alta', 'Esfera con caída larga', 'Cable de 1.90 para techo de 3.00.', { r: 0.18, caida: 1.9 }),
    V('baja', 'Esfera baja', 'A 70 cm del techo. Para pasillo o baño.', { r: 0.16, caida: 0.7 }),
    V('racimo3', 'Racimo de tres', 'Tres esferas a distinta altura en una sola salida. Deja caja arriba.', { r: 0.14, caida: 1.0, racimo: 3 }),
    V('racimo5', 'Racimo de cinco', 'Cinco cuerpos, una salida. Sobre isla o mesa larga.', { r: 0.12, caida: 1.0, racimo: 5 }),
    V('escalera', 'De escalera', 'Caída de 2.60 sobre el hueco. Se limpia una vez al año, si acaso.', { r: 0.22, caida: 2.6 }),
    V('doble', 'Par grande', 'Dos de 44 cm. Lo que pide una mesa de ocho.', { r: 0.22, caida: 1.0, racimo: 2 }),
  ] },
  lamparaTripode: { ...(L('Lámpara trípode', X.LamparaTripode, 0.5, 0.5, 1.5)), variantes: [
    V('t125', 'Trípode 1.55', 'La de siempre, junto a un sillón.', { alto: 1.25, abre: 0.22, pantalla: 0.24 }),
    V('t145', 'Trípode alta 1.75', 'Ilumina por encima del respaldo. En techo de 2.40 ya se ve apretada.', { alto: 1.45, abre: 0.24, pantalla: 0.26 }),
    V('t105', 'Trípode baja 1.35', 'Para un rincón con techo bajo.', { alto: 1.05, abre: 0.2, pantalla: 0.22 }),
    V('abierta', 'Patas abiertas', 'Base de 68 cm. Estable sin muro, pero se tropieza con ella.', { alto: 1.25, abre: 0.34, pantalla: 0.24 }),
    V('cerrada', 'Patas cerradas', 'Base de 30 cm. Cabe entre el sillón y el muro.', { alto: 1.25, abre: 0.15, pantalla: 0.24 }),
    V('pantallaAncha', 'Pantalla ancha', 'Pantalla de 60 cm. Cubre el sillón entero.', { alto: 1.25, abre: 0.22, pantalla: 0.3 }),
    V('pantallaChica', 'Pantalla chica', 'Cono cerrado: luz de lectura, no de ambiente.', { alto: 1.25, abre: 0.22, pantalla: 0.17 }),
    V('esbelta', 'Esbelta', 'Alta y de base cerrada. Para un hueco angosto.', { alto: 1.5, abre: 0.16, pantalla: 0.2 }),
    V('robusta', 'Robusta', 'Baja, abierta y de pantalla ancha. Ancla un rincón.', { alto: 1.1, abre: 0.32, pantalla: 0.3 }),
    V('lectura', 'De lectura', 'Alta con pantalla chica: el cono cae sobre el libro y no sobre la tele.', { alto: 1.45, abre: 0.2, pantalla: 0.16 }),
  ] },
  lamparaEscritorio: { ...(L('Lámpara de escritorio', X.LamparaEscritorio, 0.45, 0.2, 0.62)), variantes: [
    V('estandar', 'Estándar', 'Base de disco, brazo normal. La de siempre.', { brazo: 1 }),
    V('larga', 'Brazo largo', 'Alcanza el centro de un escritorio de 80 de fondo.', { brazo: 1.35 }),
    V('corta', 'Brazo corto', 'Para un escritorio de 50. Ocupa lo mínimo.', { brazo: 0.75 }),
    V('pinza', 'De pinza', 'Se muerde al canto de la mesa. No ocupa superficie, que en 60 cm es la mitad del problema.', { pinza: true, brazo: 1 }),
    V('pinzaLarga', 'De pinza, brazo largo', 'Pinza y alcance completo. La de quien tiene dos monitores.', { pinza: true, brazo: 1.35 }),
    V('alta', 'Alta', 'Brazo alto: la luz entra por arriba del monitor y no se refleja en él.', { brazo: 1.6 }),
    V('bajaLectura', 'Baja de lectura', 'Cerca del papel. Deslumbra si se levanta la vista.', { brazo: 0.7 }),
    V('pinzaAlta', 'De pinza alta', 'Pinza y brazo alto. La de un escritorio contra el muro.', { pinza: true, brazo: 1.6 }),
    V('compacta', 'Compacta', 'Todo chico. Para buró que se usa de escritorio.', { brazo: 0.6 }),
    V('extendida', 'Extendida', 'Brazo de 1.8. Cubre un escritorio de esquina desde un solo punto.', { brazo: 1.8 }),
  ] },
  lamparaBuro: { ...({ ...AN('Lámpara de buró', N.LamparaBuro, 0.3, 0.3, 0.44, { alto: 0.42 }), portafoco: true }), variantes: [
    V('cono', 'Pantalla cónica', 'La de siempre. Luz al libro y al buró, no al techo.', { v: 'cono' }),
    V('globo', 'Globo', 'Esfera opalina. Ambienta el cuarto entero; para leer se queda corta.', { v: 'globo' }),
    V('hongo', 'Hongo', 'Cerrada arriba, toda la luz abajo. La mejor para leer en cama.', { v: 'hongo' }),
    V('tubo', 'Tubo', 'Cilindro alto y angosto. Ocupa poco en un buró chico.', { v: 'tubo' }),
    V('articulada', 'Articulada', 'Brazo que se acomoda. Se apunta al libro sin despertar a quien duerme al lado.', { v: 'articulada' }),
    V('conoAlta', 'Cónica alta', 'La misma pantalla 12 cm más arriba. Deja el libro iluminado sin deslumbrar.', { v: 'cono', alto: 0.54 }),
    V('globoChico', 'Globo chico', 'Esfera de 20 cm. Ocupa lo mínimo en un buró angosto.', { v: 'globo', alto: 0.32 }),
    V('hongoAlto', 'Hongo alto', 'Media esfera a 55 cm. Cubre los dos lados de la cama desde un solo buró.', { v: 'hongo', alto: 0.55 }),
    V('tuboLargo', 'Tubo largo', 'Cilindro de 60 cm. Se lee como una columna, no como una lámpara.', { v: 'tubo', alto: 0.6 }),
    V('articuladaLarga', 'Articulada larga', 'Brazo que alcanza el centro de la cama sin moverla de sitio.', { v: 'articulada', alto: 0.55 }),
  ] },
  /* ── envolvente ── */
  puerta: {
    ...AN('Puerta', N.Puerta, 0.9, 0.24, 2.1, { w: 0.9, alto: 2.1 }),
    variantes: [
      V('abatible', 'Abatible', 'La de paso de siempre, 0.90 × 2.10. Se dibuja abierta: lo que importa del plano es el barrido de la hoja.', { v: 'abatible' }),
      V('cerrada', 'Abatible cerrada', 'La misma, dibujada cerrada. Para cuando el barrido ya se resolvió y estorba verlo.', { v: 'cerrada' }),
      V('tablero', 'De tablero', 'Con dos entrepaños. La de una casa de siempre.', { v: 'tablero' }),
      V('vidrio', 'Con paño de vidrio', 'Deja pasar luz al pasillo. Ojo si el cuarto necesita oscuridad para dormir.', { v: 'vidrio' }),
      V('corrediza', 'Corrediza', 'No se come piso, pero deja ese tramo de muro inservible para un mueble o un apagador.', { v: 'corrediza' }),
      V('granero', 'Tipo granero', 'Corre sobre riel a la vista. Necesita un muro libre del ancho de la puerta, al lado.', { v: 'granero' }),
      V('doble', 'Doble hoja', '1.60 de claro. Para sala-comedor o vestidor.', { v: 'doble', w: 1.6 }),
      V('francesa', 'Francesa', 'Dos hojas con vidrio. Se usa a jardín o a terraza.', { v: 'francesa', w: 1.6 }),
      V('plegable', 'Plegable', 'Dos paneles que se doblan. Come la mitad de barrido que una abatible.', { v: 'plegable' }),
      V('oculta', 'Oculta a ras', 'Sin marco y del color del muro. Se pierde a propósito; el apagador tiene que ir lejos de ella.', { v: 'oculta' }),
      V('pivotante', 'Pivotante ancha', '1.10 girando sobre su centro. Entrada principal, no interior.', { v: 'pivotante', w: 1.1 }),
      V('arco', 'Remate de arco', 'Con arco arriba. Pide 2.40 de altura libre.', { v: 'arco' }),
    ],
  },
  ventana: { ...(A('Ventana', P.WindowUnit, 1.4, 0.1, 1.5)), variantes: [
    V('v080', '0.80 × 1.20', 'De baño o de cocina. Alta y chica.', { w: 0.8, h: 1.2, alto: 1.2 }),
    V('v120', '1.20 × 1.40', 'La de recámara de siempre.', { w: 1.2, h: 1.4, alto: 1.4 }),
    V('v150', '1.50 × 1.50', 'Cuadrada. La más común de sala.', { w: 1.5, h: 1.5, alto: 1.5 }),
    V('v180', '1.80 × 1.50', 'Ancha. Ya pide dos cortinas o una de 2.00.', { w: 1.8, h: 1.5, alto: 1.5 }),
    V('v240', '2.40 × 1.60', 'Ventanal. Un motor de cortina no alcanza: van dos.', { w: 2.4, h: 1.6, alto: 1.6 }),
    V('corridaBaja', 'Corrida baja', '2.40 × 0.90 arriba de una barra.', { w: 2.4, h: 0.9, alto: 0.9 }),
    V('altaBaño', 'Alta de baño', '0.60 × 0.50 pegada al plafón. No pide cortina.', { w: 0.6, h: 0.5, alto: 0.5 }),
    V('pisoTecho', 'De piso a techo', '1.20 × 2.30. Cortina de 2.60 y motor de riel largo.', { w: 1.2, h: 2.3, alto: 2.3 }),
    V('dobleAltura', 'Doble altura', '1.80 × 3.20. Motorizada por fuerza: no se alcanza a mano.', { w: 1.8, h: 3.2, alto: 3.2 }),
    V('esquina', 'De esquina', '2.00 × 1.50 doblando el muro. Dos rieles independientes.', { w: 2.0, h: 1.5, alto: 1.5 }),
  ] },
  persiana: A('Persiana', P.Blinds, 1.4, 0.1, 1.5),
  // La corrediza grande de terraza: es un vano, no una puerta de paso.
  ventanalCorredizo: A('Ventanal corredizo', F.SlidingDoor, 2.2, 0.15, 2.3),
  cuadro: A('Cuadro', P.Artwork, 0.6, 0.05, 0.8),
}

/**
 * Qué ofrece cada tipo de cuarto.
 *
 * La lista no es "todo lo que existe" a propósito: quien levanta una recámara
 * no quiere ir descartando WCs. Siempre se puede abrir el catálogo completo.
 */
export const POR_TIPO = {
  sala: ['puerta', 'ventanalCorredizo', 'sofa', 'sillon', 'puf', 'mesaCentro', 'mueble_tv', 'tv', 'tapete', 'libreroLleno', 'lamparaPie', 'chimenea', 'plantaAlta', 'macetaChica', 'macetaGrande', 'bocina', 'mesaLateral', 'mesaRedonda', 'muroCuadros', 'cuadroSolo', 'relojPared', 'revistero', 'gato', 'perro', 'camaMascota', 'ventana', 'persiana', 'lamparaArco', 'lamparaTripode', 'lamparaColgante', 'cuadroArte', 'cuadroGrande', 'triptico', 'cuadroPiso'],
  recamara: ['puerta', 'cama', 'buro', 'escritorio', 'monitorCurvo', 'lamparaEscritorio', 'closet', 'comoda', 'bancaPie', 'espejoPie', 'cuna', 'tapete', 'tv', 'lamparaPie', 'plantaAlta', 'macetaChica', 'libreroLleno', 'muroCuadros', 'cuadroSolo', 'relojPared', 'gato', 'camaMascota', 'ventana', 'persiana', 'lamparaBuro', 'lamparaTripode', 'cuadroArte', 'triptico'],
  cocina: ['puerta', 'barra', 'isla', 'refri', 'estufa', 'campana', 'alacena', 'microondas', 'lavavajillas', 'bancoBarra', 'sillaComedor', 'ventana', 'planta', 'macetaChica', 'relojPared', 'lamparaEsfera', 'lamparaColgante', 'cuadroArte'],
  bano: ['puerta', 'wc', 'lavabo', 'tina', 'regadera', 'espejo', 'toallero', 'boiler', 'ventana', 'macetaChica', 'cuadroArte'],
  estudio: ['puerta', 'escritorio', 'mesaTrabajo', 'monitor', 'monitorCurvo', 'silla', 'sillaVisita', 'archivero', 'pizarron', 'libreroLleno', 'rack', 'lamparaPie', 'plantaAlta', 'macetaChica', 'muroCuadros', 'gato', 'ventana', 'persiana', 'lamparaEscritorio', 'lamparaArco', 'cuadroArte', 'cuadroPiso', 'triptico'],
  comedor: ['puerta', 'mesaComedor', 'mesaRedonda', 'sillaComedor', 'tapete', 'libreroLleno', 'lamparaPie', 'plantaAlta', 'macetaChica', 'macetaGrande', 'muroCuadros', 'relojPared', 'ventana', 'bocina', 'lamparaColgante', 'lamparaEsfera', 'cuadroGrande', 'cuadroArte'],
  servicio: ['puerta', 'lavadora', 'secadora', 'lavadero', 'boiler', 'tendedero', 'tinaco', 'rack', 'librero', 'archivero', 'ventana'],
  exterior: ['puerta', 'ventanalCorredizo', 'planta', 'tapete', 'bocina'],
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
