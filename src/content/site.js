/**
 * Todo el copy del sitio vive aquí.
 * Cambiar texto no debería requerir tocar componentes.
 */

export const brand = {
  name: 'Matter',
  tagline: 'Casas que te entienden',
  whatsapp: '+52 55 0000 0000',
  whatsappUrl: 'https://wa.me/525500000000',
  email: 'hola@matter.mx',
  city: 'Ciudad de México · Área metropolitana',
}

export const nav = [
  { label: 'La casa', href: '#casa' },
  { label: 'Cómo funciona', href: '#red' },
  { label: 'Ecosistemas', href: '#ecosistemas' },
  { label: 'Proceso', href: '#proceso' },
  { label: 'Paquetes', href: '#paquetes' },
]

// El recorrido de la casa (capítulos, controles y comandos de voz)
// vive en content/tour.js.

export const hero = {
  eyebrow: 'Levantamiento · Diseño · Instalación',
  title: ['Tu casa ya es', 'inteligente.', 'Falta enseñarle.'],
  lede: 'Vamos a tu casa, medimos la red, entendemos tu rutina y diseñamos una instalación que simplemente funciona. Sin apps que nadie abre. Sin focos que se desconectan.',
  cta: 'Agenda tu levantamiento',
  ctaSecondary: 'Ver cómo funciona',
  scrollHint: 'Recorre la casa',
}

export const protocols = [
  {
    name: 'Matter',
    kicker: 'El idioma común',
    body: 'El estándar que hace que un foco funcione igual en Apple, Google y Alexa. Si tiene el logo, sirve en el ecosistema que elijas — y sigue sirviendo si un día cambias de opinión.',
    stat: '700+',
    statLabel: 'productos certificados',
  },
  {
    name: 'Thread',
    kicker: 'La malla',
    body: 'Red de bajo consumo donde cada dispositivo enchufado repite la señal. Un sensor que en WiFi duraba seis semanas de pila, en Thread dura dos años.',
    stat: '~2 años',
    statLabel: 'de pila por sensor',
  },
  {
    name: 'Zigbee / Z-Wave',
    kicker: 'Lo que ya tienes',
    body: 'Miles de dispositivos buenos siguen viviendo aquí. Los integramos con puentes en vez de pedirte que tires lo que ya compraste.',
    stat: '0',
    statLabel: 'dispositivos desechados',
  },
  {
    name: 'WiFi 6 / Mesh',
    kicker: 'El cimiento',
    body: 'Si tu red se cae, tu casa se vuelve tonta. Segmentamos una VLAN solo para IoT, ponemos access points donde de verdad hacen falta y cableamos lo que deba ir cableado.',
    stat: '-90%',
    statLabel: 'de desconexiones',
  },
]

/**
 * Ecosistemas.
 *
 * `kit` es lo que de verdad instalamos como cerebro en cada caso, y es lo
 * que aparece físicamente en la casa 3D cuando cambias de ecosistema.
 * `shape` le dice a la escena qué dibujar; `at` dónde ponerlo.
 *
 * Puntos de anclaje disponibles: mueble-tv, barra-cocina, buro, repisa,
 * muro-entrada.
 */
export const ecosystems = [
  {
    id: 'apple',
    name: 'Apple Home',
    short: 'Apple',
    tone: '#E8E4DE',
    for: 'Para quien ya vive en iPhone y le importa la privacidad.',
    pros: ['Procesamiento local', 'Atajos y NFC nativos', 'HomePod como border router'],
    cons: ['Menos dispositivos compatibles'],
    kit: [
      { name: 'Apple TV 4K', role: 'Hub principal + border router Thread', shape: 'box', at: 'mueble-tv' },
      { name: 'HomePod mini', role: 'Voz y segundo border router', shape: 'orb', at: 'barra-cocina' },
      { name: 'HomePod mini', role: 'Voz en recámara', shape: 'orb', at: 'buro' },
      { name: 'iPad montado', role: 'Panel de control en la entrada', shape: 'panel', at: 'muro-entrada' },
      { name: 'Puente Zigbee', role: 'Para lo que aún no habla Matter', shape: 'bridge', at: 'repisa' },
    ],
  },
  {
    id: 'google',
    name: 'Google Home',
    short: 'Google',
    tone: '#A8C7FA',
    for: 'Para quien usa Android y quiere la mejor voz.',
    pros: ['El mejor reconocimiento de voz', 'Nest Hub como pantalla', 'Buen precio de entrada'],
    cons: ['Depende más de la nube'],
    kit: [
      { name: 'Nest Hub Max', role: 'Pantalla y hub principal', shape: 'screen', at: 'mueble-tv' },
      { name: 'Nest Hub (2ª gen)', role: 'Pantalla + border router', shape: 'screen', at: 'barra-cocina' },
      { name: 'Nest Mini', role: 'Voz en recámara', shape: 'puck', at: 'buro' },
      { name: 'Nest Doorbell', role: 'Timbre con video', shape: 'panel', at: 'muro-entrada' },
      { name: 'Puente Zigbee', role: 'Para lo que aún no habla Matter', shape: 'bridge', at: 'repisa' },
    ],
  },
  {
    id: 'alexa',
    name: 'Amazon Alexa',
    short: 'Alexa',
    tone: '#7FD4E8',
    for: 'Para quien quiere el catálogo más grande y el costo más bajo.',
    pros: ['Compatibilidad enorme', 'Echo desde $999', 'Rutinas muy flexibles'],
    cons: ['Interfaz más cargada'],
    kit: [
      { name: 'Echo Show 15', role: 'Pantalla y hub principal', shape: 'screen', at: 'mueble-tv' },
      { name: 'Echo (4ª gen)', role: 'Voz + hub Zigbee y Thread integrado', shape: 'orb', at: 'barra-cocina' },
      { name: 'Echo Dot', role: 'Voz en recámara', shape: 'orb', at: 'buro' },
      { name: 'Echo Hub', role: 'Panel de control en la entrada', shape: 'panel', at: 'muro-entrada' },
      { name: 'Sin puente extra', role: 'El Echo ya trae Zigbee adentro', shape: 'none', at: 'repisa' },
    ],
  },
  {
    id: 'ha',
    name: 'Home Assistant',
    short: 'Home Asst.',
    tone: '#FF9A4D',
    for: 'Para quien quiere control total y cero dependencia de nadie.',
    pros: ['100% local', 'Automatizaciones sin límite', 'Sobrevive a que una marca cierre'],
    cons: ['Requiere mantenimiento'],
    kit: [
      { name: 'Home Assistant Green', role: 'Servidor local en el rack', shape: 'server', at: 'repisa' },
      { name: 'SkyConnect / dongle', role: 'Radio Thread y Zigbee', shape: 'bridge', at: 'repisa' },
      { name: 'Tableta de pared', role: 'Panel de control en la entrada', shape: 'panel', at: 'muro-entrada' },
      { name: 'Voice PE', role: 'Voz local, sin nube', shape: 'puck', at: 'barra-cocina' },
      { name: 'Voice PE', role: 'Voz local en recámara', shape: 'puck', at: 'buro' },
    ],
  },
]

export const process = [
  {
    n: '01',
    title: 'Llamada de 15 minutos',
    body: 'Nos cuentas qué te molesta de tu casa hoy. Sin catálogo, sin cotización todavía.',
    time: 'Gratis',
  },
  {
    n: '02',
    title: 'Levantamiento en sitio',
    body: 'Vamos con medidor de señal y multímetro. Salimos con un plano de dispositivos, mapa de cobertura y lista de lo que hay que arreglar antes de instalar.',
    time: '2–3 hrs · desde $1,500',
  },
  {
    n: '03',
    title: 'Propuesta y maqueta',
    body: 'Te entregamos el plano en 3D con cada dispositivo ubicado, las escenas propuestas y tres niveles de presupuesto. Decides con todo a la vista.',
    time: '5 días hábiles',
  },
  {
    n: '04',
    title: 'Instalación',
    body: 'Red primero, dispositivos después. Dejamos etiquetado el rack, documentadas las credenciales y todo probado contigo presente.',
    time: '1–4 días',
  },
  {
    n: '05',
    title: 'Entrega y entrenamiento',
    body: 'Sesión con toda la familia, incluida la persona que ayuda en casa. Si alguien no le entiende, la instalación falló.',
    time: 'Incluido',
  },
  {
    n: '06',
    title: 'Soporte',
    body: 'Un año de ajustes de escenas y actualizaciones de firmware. Después, plan mensual opcional.',
    time: '12 meses',
  },
]

export const packages = [
  {
    id: 'esencial',
    name: 'Esencial',
    price: 'desde $18,900',
    unit: 'MXN · instalación incluida',
    pitch: 'Un cuarto bien hecho vale más que toda la casa a medias.',
    includes: [
      'Levantamiento y mapa de red',
      'Hub / border router del ecosistema que elijas',
      '6 puntos de iluminación inteligente',
      '2 sensores de movimiento o contacto',
      '4 escenas configuradas',
      'Entrenamiento y 12 meses de soporte',
    ],
    featured: false,
  },
  {
    id: 'casa',
    name: 'Casa completa',
    price: 'desde $64,000',
    unit: 'MXN · instalación incluida',
    pitch: 'Lo que instalamos en la mayoría de las casas de 3 recámaras.',
    includes: [
      'Todo lo de Esencial',
      'Mejora de red: 2–3 access points y VLAN de IoT',
      '18–24 puntos de iluminación con dimmer',
      'Cerradura, timbre con video y 2 cámaras',
      '3 persianas motorizadas',
      'Sensores de fuga y humo integrados',
      'Botoneras físicas en cada área',
      '12 escenas y automatizaciones por horario',
    ],
    featured: true,
  },
  {
    id: 'medida',
    name: 'A la medida',
    price: 'Cotización',
    unit: 'Residencias, obra nueva y remodelación',
    pitch: 'Trabajamos con tu arquitecto desde el plano.',
    includes: [
      'Coordinación con arquitecto y eléctrico',
      'Cableado estructurado y rack',
      'Audio multiroom y cine en casa',
      'Riego, alberca y control de acceso',
      'Home Assistant en servidor local con respaldo',
      'Documentación completa del sistema',
    ],
    featured: false,
  },
]

export const faq = [
  {
    q: '¿Tengo que cambiar toda mi instalación eléctrica?',
    a: 'Casi nunca. Lo más común es que falte cable neutro en algunos apagadores, y para eso hay dimmers que funcionan sin él o módulos que van dentro del plafón. En el levantamiento te decimos exactamente cuáles sí requieren obra.',
  },
  {
    q: '¿Qué pasa si se cae el internet?',
    a: 'Todo lo que instalamos con Matter y Thread sigue funcionando local: apagadores, escenas, sensores y horarios. Lo único que se pierde es el control desde fuera de casa y la voz en la nube. Si tu prioridad es que nada dependa de internet, te armamos todo sobre Home Assistant.',
  },
  {
    q: '¿Puedo mezclar marcas y ecosistemas?',
    a: 'Sí, y de hecho casi siempre conviene. Puedes tener focos de una marca, persianas de otra y cerradura de una tercera, siempre que todo hable Matter. Lo que no recomendamos es mezclar dos apps de control: se elige una casa, un cerebro.',
  },
  {
    q: '¿Sirve si rento?',
    a: 'Sí. Hay una versión completa sin obra: focos, contactos inteligentes, sensores adheribles, tags NFC y una cerradura que se cambia en 20 minutos y se puede revertir. Cuando te mudes, te lo llevas todo.',
  },
  {
    q: '¿Cuánto tiempo tardan?',
    a: 'Un paquete Esencial se instala en un día. Una casa completa toma de dos a cuatro días, normalmente partidos para no dejarte sin luz ni internet en horario laboral.',
  },
  {
    q: '¿Y si ya compré cosas que no funcionan bien?',
    a: 'Es el caso más frecuente que nos llega. Hacemos diagnóstico, rescatamos lo que sirva y te decimos con franqueza qué conviene reemplazar. No cobramos por vender de nuevo lo que ya tienes.',
  },
]

export const proof = [
  { n: '120+', label: 'casas intervenidas' },
  { n: '4,800', label: 'dispositivos en línea' },
  { n: '99.4%', label: 'uptime promedio' },
  { n: '12 meses', label: 'de soporte incluido' },
]

export const contact = {
  eyebrow: 'Siguiente paso',
  title: 'Empecemos por ver tu casa',
  body: 'El levantamiento es lo único que compras al principio. Si después decides no instalar con nosotros, el plano y el mapa de red son tuyos.',
  fields: {
    name: 'Nombre',
    phone: 'WhatsApp',
    email: 'Correo',
    type: 'Tipo de espacio',
    message: '¿Qué te gustaría automatizar?',
  },
  types: ['Casa', 'Departamento', 'Obra nueva / remodelación', 'Oficina o comercio'],
  submit: 'Agendar levantamiento',
  alt: 'o escríbenos por WhatsApp',
}
