/**
 * Lo que hay que saber para levantar bien.
 *
 * Esto existe para que nadie tenga que sentarse a entrenar a un levantador
 * nuevo. No explica cómo funciona Thread ni qué es un clúster: explica lo que
 * cambia la propuesta enfrente del cliente, que es otra cosa. Un levantador
 * que sabe que el Apple TV de 64 GB no trae radio Thread vale más que uno que
 * sabe recitar la pila de protocolos.
 *
 * La regla al escribir aquí: cada dato tiene que poder terminar en una frase
 * que se le diga al cliente, o en una decisión de compra. Si no, sobra.
 *
 * El formato es interactivo a propósito. Se escoge el modelo que hay en la
 * casa y la ficha responde qué se puede y qué no — porque el error caro no es
 * no saber, es suponer que todos los modelos de una familia hacen lo mismo.
 * No lo hacen, y ahí es donde se promete algo que no se va a poder entregar.
 *
 * Verificado en agosto de 2026. Lo que cambie, se corrige aquí.
 */

/* ── qué puede hacer un aparato ───────────────────────────────── */

export const CAPACIDADES = {
  hub: {
    label: 'Central de la casa',
    ayuda: 'Sin esto no hay automatizaciones ni control desde fuera de casa. Es lo primero que se decide.',
  },
  thread: {
    label: 'Router de borde Thread',
    ayuda: 'Arma la malla por donde hablan los sensores y focos modernos. Sin uno, lo Thread que se cotice no enciende.',
  },
  zigbee: {
    label: 'Puente Zigbee',
    ayuda: 'Deja entrar sensores baratos. Es la diferencia entre un sensor de $300 y uno de $1,100.',
  },
  matter: { label: 'Controlador Matter', ayuda: 'Puede adoptar cualquier aparato con el logo Matter.' },
  voz: { label: 'Control por voz', ayuda: 'Micrófono en el cuarto. Sin esto, todo se hace desde el teléfono.' },
  camara: { label: 'Ve cámaras', ayuda: 'Puede mostrar la cámara en pantalla o en la tele.' },
  tablero: {
    label: 'Sirve de tablero',
    ayuda: 'Pantalla fija con las escenas a la mano. Es lo que hace que la casa se use y no se olvide.',
  },
}

/* ── las fichas ───────────────────────────────────────────────── */

const V = (id, label, capacidades, nota) => ({ id, label, capacidades, nota })

export const FICHAS = [
  {
    id: 'apple',
    eco: 'Apple Home',
    titulo: 'Qué sirve de central en una casa Apple',
    entrada:
      'Si todos traen iPhone, la casa se arma aquí aunque hayan comprado aparatos de Alexa. La trampa está en que dos aparatos con el mismo nombre no hacen lo mismo: hay que preguntar el modelo exacto.',
    pregunta: '¿Qué hay en la casa?',
    variantes: [
      V('appletv-3-128', 'Apple TV 4K 3ª gen · 128 GB (WiFi + Ethernet)', ['hub', 'thread', 'matter', 'camara'],
        'La mejor central de Apple que se puede comprar hoy. El Ethernet importa: la malla Thread se porta mejor con la central cableada.'),
      V('appletv-3-64', 'Apple TV 4K 3ª gen · 64 GB (solo WiFi)', ['hub', 'matter', 'camara'],
        'OJO: este NO trae radio Thread. Es el mismo aparato de afuera y la diferencia no se ve en la caja. Si el cliente tiene este y se cotizaron sensores Thread, falta un HomePod mini o no van a encender.'),
      V('appletv-2', 'Apple TV 4K 2ª gen (2021)', ['hub', 'thread', 'matter', 'camara'],
        'Sí es router de borde Thread. Sirve perfectamente de central.'),
      V('appletv-hd', 'Apple TV HD o más viejo', ['hub'],
        'Hace de central de la casa vieja, pero no habla Matter ni Thread. Con Matter en la propuesta, no alcanza.'),
      V('homepod-mini', 'HomePod mini', ['hub', 'thread', 'matter', 'voz'],
        'La central más barata de Apple y además router de borde Thread. Es la recomendación por defecto cuando hay iPhone y no hay nada más.'),
      V('homepod-2', 'HomePod grande 2ª gen', ['hub', 'thread', 'matter', 'voz'],
        'Igual que el mini en lo que importa, con mejor sonido y sensor de temperatura.'),
      V('homepod-1', 'HomePod grande 1ª gen (2018)', ['hub', 'matter', 'voz'],
        'Hace de central pero no trae Thread. Con sensores Thread cotizados, hace falta otro aparato.'),
      V('ipad', 'iPad', ['tablero'],
        'YA NO sirve de central. Apple retiró la arquitectura vieja de HomeKit el 10 de febrero de 2026 y el iPad dejó de poder ser hub. Sigue siendo el mejor tablero de pared —montado con carga, con la app abierta— pero la central tiene que ser un Apple TV o un HomePod. Es el error más común: el cliente jura que su iPad ya controla la casa.'),
      V('iphone', 'Solo iPhone, nada más', [],
        'Sin central no hay automatizaciones ni control fuera de casa: la app solo manda estando en el mismo WiFi. Es la primera compra que hay que proponer.'),
    ],
  },
  {
    id: 'alexa',
    eco: 'Alexa',
    titulo: 'Qué sirve de central en una casa Alexa',
    entrada:
      'Es lo que más gente ya tiene, porque el Echo se regala y se compra en oferta. El detalle: el Echo chico y el Echo grande no son lo mismo ni de lejos.',
    pregunta: '¿Qué Echo hay?',
    variantes: [
      V('echo-4', 'Echo (grande) 4ª gen o más nuevo', ['hub', 'thread', 'zigbee', 'matter', 'voz'],
        'El más completo por su precio de todo el mercado: central, puente Zigbee y router de borde Thread en un solo aparato. Si el cliente ya lo tiene, media lista de sensores baratos se vuelve viable.'),
      V('echo-dot', 'Echo Dot (chico), cualquier generación', ['matter', 'voz'],
        'OJO: el Dot NO trae Zigbee ni Thread. Solo controla por voz y adopta Matter. Es el malentendido más caro de esta categoría — el cliente dice "ya tengo Alexa" y uno cotiza sensores Zigbee que no van a entrar.'),
      V('echo-show', 'Echo Show 8, 10 o 15', ['hub', 'thread', 'zigbee', 'matter', 'voz', 'camara', 'tablero'],
        'Además de central, es tablero con pantalla y ve cámaras. En cocina o pasillo es donde más se usa.'),
      V('echo-hub', 'Echo Hub (el de pared)', ['hub', 'thread', 'zigbee', 'matter', 'voz', 'camara', 'tablero'],
        'Pensado para ir montado. Es la opción de tablero fijo de Alexa.'),
      V('fire-tv', 'Fire TV Stick', ['voz'],
        'Prende, apaga y sube volumen de la tele por HDMI-CEC, y con un Echo cerca eso se pide por voz. NO es central: sin Thread, sin Zigbee y sin infrarrojo. Para el minisplit o el decodificador hace falta un Fire TV Cube.'),
    ],
  },
  {
    id: 'google',
    eco: 'Google Home',
    titulo: 'Qué sirve de central en una casa Google',
    entrada: 'Menos común en México que las otras dos, pero aparece cuando toda la familia trae Android.',
    pregunta: '¿Qué hay?',
    variantes: [
      V('nest-hub-2', 'Nest Hub 2ª gen', ['hub', 'thread', 'matter', 'voz', 'camara', 'tablero'],
        'Central y router de borde Thread, con pantalla. Es la buena de la familia.'),
      V('nest-hub-max', 'Nest Hub Max', ['hub', 'matter', 'voz', 'camara', 'tablero'],
        'Central con pantalla grande y cámara, pero sin Thread. Con sensores Thread cotizados hace falta otro aparato.'),
      V('nest-mini', 'Nest Mini', ['matter', 'voz'],
        'Voz nada más. No es central ni puente.'),
      V('tv-google', 'Chromecast con Google TV', ['hub', 'matter'],
        'Hace de central para Google. Sin Thread ni Zigbee.'),
    ],
  },
  {
    id: 'red',
    eco: 'La red',
    titulo: 'Por qué la red decide si la casa funciona',
    entrada:
      'Más de la mitad de las fallas de una instalación nueva son de red, no de los aparatos. Esto es lo que hay que revisar ANTES de prometer nada.',
    pregunta: '¿Cómo está la red hoy?',
    variantes: [
      V('modem-solo', 'Solo el módem del proveedor', [],
        'Es el caso más común y el que más problemas da. Anuncia 2.4 y 5 GHz con un solo nombre de red: la mayoría de focos y sensores baratos solo hablan 2.4, y al emparejar se enganchan a la de 5 y fallan. Es la causa número uno de "no me conecta". Se separan las bandas en la puesta en marcha, o se pasa el módem a puente.'),
      V('repetidor', 'Módem + repetidor de WiFi', [],
        'Peor que solo el módem. El repetidor parte la red en dos y los aparatos brincan de una a otra perdiendo la conexión. Es la causa número uno de "se me desconecta solo". Hay que cambiarlo por malla antes de instalar, sin excepción.'),
      V('mesh', 'WiFi en malla (Deco, Eero, Orbi, UniFi)', [],
        'Aquí es donde la instalación se vuelve otra cosa. Una red en malla deja poner una banda de 2.4 GHz con nombre propio para el IoT, y de golpe desaparece la mitad de los problemas de emparejamiento. Además aguanta las decenas de aparatos que una casa automatizada suma —un módem de proveedor empieza a tirar conexiones alrededor de los treinta—. Si el presupuesto obliga a escoger entre más sensores o malla, va la malla.'),
      V('mesh-vlan', 'Malla con VLAN o red de invitados separada', [],
        'Lo ideal. El IoT en su propia red: si un aparato barato resulta tener un agujero, no ve la computadora del trabajo ni el NAS. Se hace con UniFi, con Omada o con la red de invitados de una malla buena. Vale la pena cuando hay cámaras o cerraduras.'),
      V('cableado', 'Con cableado a los puntos clave', [],
        'La central y los access points cableados es lo que separa una instalación que aguanta de una que se cae en la fiesta. El Apple TV con Ethernet, por ejemplo, mantiene la malla Thread mucho más estable.'),
    ],
  },
  {
    id: 'apagadores',
    eco: 'Instalación',
    titulo: 'El apagador mexicano y el problema del neutro',
    entrada:
      'Esto es lo que más define el costo de una instalación en la CDMX y casi nadie lo pregunta a tiempo. Se revisa en el levantamiento, con la placa quitada.',
    pregunta: '¿Qué hay en la caja del apagador?',
    variantes: [
      V('con-neutro', 'Hay neutro en la caja', [],
        'El caso bueno. Entra cualquier módulo o apagador inteligente: Sonoff MINI R4M, SwitchMan M5, Shelly. Se conserva el apagador de siempre y el módulo se esconde detrás.'),
      V('sin-neutro', 'No hay neutro, solo fase', [],
        'La mitad de las casas de la Ciudad de México. Aquí NO entra un módulo normal. Tres salidas: un módulo sin neutro como el Sonoff ZBMINI L2, meter el módulo en el registro de la luminaria —donde el neutro sí está—, o abrir muro para tirar el cable, que es días de obra. Casi siempre gana una de las dos primeras.'),
      V('caja-chica', 'Caja poco profunda o de tablaroca', [],
        'Aunque haya neutro, puede que no quepa el módulo detrás. Con tablaroca de 7 cm casi nunca cabe. Se va a la luminaria.'),
      V('luminaria', 'El registro de la luminaria es accesible', [],
        'La salida más limpia cuando el apagador no da. El módulo va arriba, en el plafón, y el apagador de pared se queda tal cual — para el cliente no cambia nada visible.'),
    ],
  },
  {
    id: 'medir',
    eco: 'Qué medir',
    titulo: 'Qué se mide en el levantamiento y con qué',
    entrada:
      'Un levantamiento sin números es una conversación. Esto es lo que hay que traerse de la casa del cliente para poder cotizar sin adivinar — y sin volver.',
    pregunta: '¿Qué vas a medir?',
    variantes: [
      V('m-espacio', 'Las medidas del espacio', [],
        'Ancho, largo y alto de plafón de cada cuarto, con medidor láser. El alto importa tanto como la planta: decide cuántos lúmenes hacen falta y si un colgante estorba. Se anota el espesor del muro también — se ve al quitar una placa.'),
      V('m-neutro', 'Si hay neutro en la caja del apagador', [],
        'Es LA medición del levantamiento, la que más dinero mueve. Se corta el circuito, se quita la placa y se busca un cable blanco además del de fase. Con el multímetro entre fase y ese cable deben salir ~127 V. Sin neutro no entra un módulo normal y la cotización cambia entera. Se revisa caja por caja, no una y suponer el resto.'),
      V('m-señal', 'La señal de WiFi donde va a ir cada cosa', [],
        'Con el teléfono, parado en el punto exacto donde va el aparato — no en medio del cuarto. Debajo de -70 dBm ese punto va a fallar de forma intermitente, que es la peor falla porque no se puede reproducir enfrente del cliente. Se anota el peor punto de cada espacio.'),
      V('m-tierra', 'Si los contactos tienen tierra y buena polaridad', [],
        'Con el probador de tres luces, en un contacto por espacio. En casa vieja de la CDMX falta tierra más seguido de lo que uno cree, y varios aparatos —pantallas, racks, fuentes— no la perdonan.'),
      V('m-carga', 'El centro de carga', [],
        'Cuántos circuitos hay, cuáles están libres y si hay espacio para pastillas nuevas. Foto de la tapa abierta con las etiquetas. Es lo que dice si un circuito nuevo es media hora o media obra.'),
      V('m-gas', 'Qué gas hay y por dónde entra', [],
        'LP de tanque o estacionario, o natural de tubería. Decide qué detector va y a qué altura: el LP pesa y se acumula a ras de piso, el natural sube al plafón. Un detector a la altura equivocada nunca se dispara.'),
      V('m-fotos', 'Fotos de todo lo que se va a tocar', [],
        'Cada caja abierta, cada plafón, el centro de carga, el módem y el registro del motor de cortina. Cuestan cero y evitan el segundo viaje. La foto del muro además sirve para escoger el arte.'),
    ],
  },
  {
    id: 'gas',
    eco: 'Gas',
    titulo: 'Quién puede tocar una instalación de gas',
    entrada:
      'Esto no es opcional ni negociable: una instalación fija de gas LP en México se rige por la NOM-004-SEDG-2004, y el trabajo tiene que quedar verificado. Nosotros ponemos la automatización; la tubería la toca quien está acreditado.',
    pregunta: '¿Qué necesitas saber?',
    variantes: [
      V('g-norma', 'Cuál es la norma', [],
        'NOM-004-SEDG-2004. Fija las especificaciones mínimas de seguridad para diseño, construcción y modificación de instalaciones fijas de aprovechamiento de gas LP, y el procedimiento para evaluar que se cumplan.'),
      V('g-quien', 'Quién dictamina', [],
        'Una Unidad de Verificación acreditada ante la EMA y aprobada por la autoridad. Ella hace la inspección, las mediciones y la prueba de hermeticidad, y emite el dictamen. Ser instalador capacitado NO es lo mismo que ser Unidad de Verificación: lo segundo es una acreditación de empresa, cara y lenta.'),
      V('g-capacitar', 'Cómo capacitamos a alguien', [],
        'Hay cursos de requisitos para instalaciones de gas LP bajo la NOM-004-SEDG-2004 —MCG México da uno— que cubren componentes, distancias mínimas de separación, prueba de hermeticidad e instalación eléctrica en zona de gas. Con eso nuestro instalador puede hacer el trabajo a norma. El dictamen se sigue contratando con una UV acreditada; el camino corto es tener el trabajo bien hecho y pagar la verificación, no acreditarnos como UV.'),
      V('g-mientras', 'Qué sí podemos hacer hoy', [],
        'Todo lo que no toca la tubería: el detector de gas —que es autónomo y solo se enchufa—, la alarma, el aviso al teléfono y la escena que apaga lo eléctrico y prende la extracción. Es la mayor parte del valor y no requiere acreditación. La válvula de corte se deja propuesta y se contrata aparte.'),
      V('g-renta', 'Y si el departamento es rentado', [],
        'Cortar o modificar la línea fija necesita permiso escrito del propietario, siempre. El detector no: se enchufa, se lleva el día de la mudanza y no deja marca. En vivienda rentada suele ser el único tramo del gas que conviene hacer.'),
    ],
  },
]

export const FICHA_BY_ID = Object.fromEntries(FICHAS.map((f) => [f.id, f]))
