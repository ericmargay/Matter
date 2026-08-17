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
]

export const FICHA_BY_ID = Object.fromEntries(FICHAS.map((f) => [f.id, f]))
