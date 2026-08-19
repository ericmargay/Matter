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
  wc: A('WC', F.Toilet, 0.4, 0.7, 0.75),
  lavabo: A('Lavabo', F.Vanity, 1.0, 0.5, 0.85),
  regadera: A('Regadera', F.Shower, 1.1, 1.0, 2.1),
  espejo: A('Espejo', F.Mirror, 0.9, 0.05, 0.8),
  toallero: A('Toallero', F.TowelRail, 0.6, 0.1, 0.1),

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

  sillaComedor: A('Silla de comedor', X.SillaComedor, 0.46, 0.46, 0.95),
  bancoBarra: A('Banco de barra', X.BancoBarra, 0.36, 0.36, 0.72),
  alacena: A('Alacena', X.Alacena, 1.8, 0.35, 0.7),
  campana: A('Campana', X.Campana, 0.84, 0.84, 0.7),
  estufa: A('Estufa', X.Estufa, 0.78, 0.64, 0.95),
  microondas: A('Microondas', X.Microondas, 0.52, 0.38, 0.3),
  lavavajillas: A('Lavavajillas', X.Lavavajillas, 0.6, 0.6, 0.85),

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
