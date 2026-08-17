/**
 * El material y la herramienta con que se instala.
 *
 * Va aparte del catálogo de productos porque se compra distinto y se cotiza
 * distinto: el equipo se le vende al cliente pieza por pieza, esto se compra
 * una vez y se amortiza en veinte obras. Meterlo en el mismo catálogo llevaba
 * a cobrarle al cliente el multímetro.
 *
 * El criterio para que algo entre: que su ausencia haya arruinado una
 * instalación. No es una lista de deseos de ferretería — es lo que hace falta
 * llevar en la caja para no volver al día siguiente.
 *
 * Los precios son de agosto de 2026 en la Ciudad de México y se mueven. Sirven
 * para armar el presupuesto de arranque y para saber si algo salió caro, no
 * para cotizarle al cliente.
 */

/* ── dónde se compra ──────────────────────────────────────────── */

export const TIENDAS = {
  unit: {
    nombre: 'Unit Electronics',
    tipo: 'Electrónica · en línea y mostrador',
    donde: 'República de El Salvador, Centro · CDMX',
    nota: 'Lo que salva una instalación el mismo día: módulos, fuentes, conectores, cable. Tienen tienda en línea con existencias reales.',
  },
  ag: {
    nombre: 'AG Electrónica',
    tipo: 'Electrónica · mostrador',
    donde: 'Centro · CDMX',
    nota: 'La otra mitad del Centro. Se busca por número de parte más que por nombre.',
  },
  steren: {
    nombre: 'Steren',
    tipo: 'Cadena · sucursales en todo el país',
    donde: 'Muchas sucursales · CDMX y área metropolitana',
    nota: 'Cable, conector, canaleta y herramienta básica. Caro por pieza pero abre tarde y hay una cerca de donde estés.',
  },
  homedepot: {
    nombre: 'Home Depot',
    tipo: 'Ferretería grande',
    donde: 'Sucursales · CDMX',
    nota: 'Taquete, broca, escalera, tablaroca y herramienta de marca. Es donde se resuelve lo de obra.',
  },
  ferreteria: {
    nombre: 'Ferretería de barrio',
    tipo: 'Local',
    donde: 'La de la esquina de la obra',
    nota: 'Para el tornillo que faltó. Siempre sale más caro por pieza y siempre vale la pena cuando ya estás arriba de la escalera.',
  },
  amazon: {
    nombre: 'Amazon México',
    tipo: 'En línea',
    donde: 'Entrega 1–3 días',
    nota: 'Para marca que no está en el Centro: Klein, Wago legítimo, medidor láser.',
  },
  ml: {
    nombre: 'MercadoLibre',
    tipo: 'En línea',
    donde: 'Entrega 1–4 días',
    nota: 'Precios más bajos y más riesgo de clon. Para consumible sí, para instrumento de medición conviene pagar de más en otro lado.',
  },
}

/* ── el material y la herramienta ─────────────────────────────── */

const T = (id, nombre, extra) => ({ id, nombre, ...extra })

export const GRUPOS = [
  {
    id: 'union',
    titulo: 'Unión de cables',
    entrada:
      'Aquí es donde se decide si la instalación aguanta diez años o falla en dos. La cinta de aislar sobre un empalme torcido se afloja con el calor de la caja y se calienta más al aflojarse; es la causa de la mayoría de los "de repente dejó de servir".',
    items: [
      T('wago-221', 'Conector Wago 221 · 2, 3 y 5 vías', {
        precio: [12, 28],
        unidad: 'pieza',
        donde: ['amazon', 'unit', 'homedepot'],
        porque:
          'Reemplaza la cinta. Se levanta la palanca, entra el cable, se baja: contacto por resorte que no se afloja y se puede abrir para revisar sin cortar nada.',
        ojo: 'Hay clones que se ven idénticos y usan latón blando. En caja de apagador con módulo detrás, un clon que se calienta es un incendio. Comprar Wago de verdad, aunque cueste el triple.',
      }),
      T('wago-lever-nut-caja', 'Surtido de Wago en caja', {
        precio: [420, 780],
        unidad: 'caja de 60–100',
        donde: ['amazon', 'ml'],
        porque: 'Sale a la mitad por pieza y evita quedarse sin la medida que hacía falta.',
      }),
      T('punteras', 'Punteras (ferrules) surtidas', {
        precio: [180, 340],
        unidad: 'caja de 1000',
        donde: ['unit', 'amazon'],
        porque:
          'Para cable multifilar en tornillo: sin puntera, los hilos se abren y solo la mitad hace contacto. Es lo que evita el punto caliente en el centro de carga.',
      }),
      T('pinza-punteras', 'Pinza crimpadora para punteras', {
        precio: [420, 950],
        unidad: 'pieza',
        donde: ['unit', 'amazon'],
        herramienta: true,
        porque: 'La de cuadro (hexagonal o cuadrada) aprieta parejo. Con pinza de mecánico la puntera queda floja y no sirve de nada.',
      }),
      T('termofit', 'Termofit surtido', {
        precio: [90, 220],
        unidad: 'kit',
        donde: ['unit', 'steren'],
        porque: 'Para aislar un empalme que va a quedar a la vista o a la intemperie. Se encoge con calor y no se despega como la cinta.',
      }),
      T('cinta-33', 'Cinta de aislar 3M Super 33+', {
        precio: [55, 95],
        unidad: 'rollo',
        donde: ['homedepot', 'unit'],
        porque:
          'Sigue haciendo falta — para reforzar, marcar fase y proteger un conector. Lo que no debe hacer es sostener el empalme. La barata se despega en un año.',
      }),
    ],
  },
  {
    id: 'medir',
    titulo: 'Medición y prueba',
    entrada:
      'Sin esto no se levanta, se adivina. Y el error de adivinar sale caro: un módulo pedido para una caja que no tiene neutro es un viaje perdido y un cliente esperando.',
    items: [
      T('ncv', 'Detector de voltaje sin contacto', {
        precio: [180, 450],
        unidad: 'pieza',
        donde: ['homedepot', 'steren', 'amazon'],
        herramienta: true,
        porque:
          'Se acerca al cable y suena si hay corriente. Es lo primero que se saca y lo último que se guarda: confirma que el circuito está muerto antes de meter la mano.',
      }),
      T('multimetro', 'Multímetro con pinza amperimétrica', {
        precio: [650, 2400],
        unidad: 'pieza',
        donde: ['unit', 'amazon', 'homedepot'],
        herramienta: true,
        porque:
          'Confirma si hay neutro en la caja —la pregunta que decide toda la instalación— y mide cuánto consume un circuito sin desconectarlo.',
        ojo: 'Que traiga categoría CAT III mínimo. Un multímetro de $200 sin categoría puede explotar midiendo un centro de carga.',
      }),
      T('probador-contacto', 'Probador de contactos con GFCI', {
        precio: [140, 320],
        unidad: 'pieza',
        donde: ['homedepot', 'amazon'],
        herramienta: true,
        porque:
          'Se enchufa y dice si la polaridad está invertida o si falta tierra. En casa vieja de la CDMX falta tierra más veces de las que uno cree, y varios aparatos no la perdonan.',
      }),
      T('medidor-laser', 'Medidor láser de distancia', {
        precio: [700, 1900],
        unidad: 'pieza',
        donde: ['homedepot', 'amazon'],
        herramienta: true,
        porque:
          'Levantar un departamento con flexómetro son dos horas y con láser son veinte minutos. Además mide alto de plafón solo, que con cinta es de dos personas.',
      }),
      T('flexometro', 'Flexómetro 5 m', {
        precio: [90, 250],
        unidad: 'pieza',
        donde: ['homedepot', 'ferreteria'],
        herramienta: true,
        porque: 'Para lo corto y para cuando el láser no agarra sobre vidrio o espejo.',
      }),
      T('probador-red', 'Probador de cable de red', {
        precio: [250, 900],
        unidad: 'pieza',
        donde: ['unit', 'steren', 'amazon'],
        herramienta: true,
        porque: 'Confirma que el cable ponchado quedó bien antes de cerrar la canaleta. Ponchar mal y descubrirlo después es rehacer el trabajo.',
      }),
      T('detector-viga', 'Detector de vigas y varilla', {
        precio: [320, 800],
        unidad: 'pieza',
        donde: ['homedepot', 'amazon'],
        herramienta: true,
        porque: 'Antes de barrenar tablaroca o losa. Pegarle a una varilla o a un tubo de gas es el peor día del mes.',
      }),
    ],
  },
  {
    id: 'mano',
    titulo: 'Herramienta de mano',
    entrada: 'Lo que va en la caja y no se presta.',
    items: [
      T('pelacables', 'Pinza pelacables automática', {
        precio: [280, 850],
        unidad: 'pieza',
        donde: ['unit', 'amazon', 'homedepot'],
        herramienta: true,
        porque: 'Pela sin morder el cobre. Un hilo cortado de más es una junta que se calienta.',
      }),
      T('pinza-punta', 'Pinza de punta larga', {
        precio: [150, 420],
        unidad: 'pieza',
        donde: ['homedepot', 'ferreteria'],
        herramienta: true,
        porque: 'Para acomodar el cable dentro de una caja llena. Con módulo adentro, el espacio es de milímetros.',
      }),
      T('desarmadores', 'Juego de desarmadores de precisión aislados', {
        precio: [300, 900],
        unidad: 'juego',
        donde: ['homedepot', 'amazon'],
        herramienta: true,
        porque: 'Los tornillos de un módulo son chicos y los de un centro de carga piden mango aislado. Van los dos.',
      }),
      T('navaja', 'Navaja retráctil', { precio: [80, 220], unidad: 'pieza', donde: ['ferreteria', 'homedepot'], herramienta: true, porque: 'Canaleta, empaque, tablaroca.' }),
      T('lampara-frontal', 'Lámpara frontal', {
        precio: [180, 600],
        unidad: 'pieza',
        donde: ['homedepot', 'amazon'],
        herramienta: true,
        porque:
          'Se trabaja con el circuito apagado, o sea a oscuras, y con las dos manos ocupadas. La del teléfono no alcanza y se descarga.',
      }),
    ],
  },
  {
    id: 'obra',
    titulo: 'Obra y montaje',
    entrada: 'Lo que hace falta cuando algo se va a fijar al muro.',
    items: [
      T('rotomartillo', 'Rotomartillo con brocas de concreto', {
        precio: [1400, 4200],
        unidad: 'equipo',
        donde: ['homedepot', 'amazon'],
        herramienta: true,
        porque: 'En la CDMX casi todo es tabique o concreto. Con taladro normal no entra y se quema el motor.',
      }),
      T('taquetes', 'Taquetes y pijas surtidos', { precio: [120, 300], unidad: 'caja', donde: ['ferreteria', 'homedepot'], porque: 'Del 6 y del 8 resuelven casi todo. Para tablaroca, taquete de mariposa.' }),
      T('brocas-sierra', 'Brocas sierra (copa)', {
        precio: [220, 700],
        unidad: 'juego',
        donde: ['homedepot'],
        herramienta: true,
        porque: 'Para el hueco del empotrado en plafón. Con la medida exacta el foco entra a presión y no pide plafón nuevo.',
      }),
      T('guia-cable', 'Guía de cable (chicote) 10 m', {
        precio: [280, 700],
        unidad: 'pieza',
        donde: ['unit', 'homedepot'],
        herramienta: true,
        porque: 'Para pasar cable por poliducto ya existente sin abrir muro. Es lo que convierte un trabajo de obra en uno de una tarde.',
      }),
      T('chalupa', 'Chalupas y tapas ciegas', { precio: [15, 60], unidad: 'pieza', donde: ['ferreteria', 'steren'], porque: 'Para dejar un registro accesible donde va a quedar un módulo. Un módulo emparedado es un módulo que nadie va a poder cambiar.' }),
      T('canaleta', 'Canaleta adhesiva', {
        precio: [70, 190],
        unidad: 'tramo 2 m',
        donde: ['steren', 'homedepot'],
        porque: 'Para cable visto que no se puede esconder. En depa rentado es la única salida honesta, y se quita sin dejar marca.',
      }),
      T('escalera', 'Escalera de tijera 6 escalones', { precio: [900, 2400], unidad: 'pieza', donde: ['homedepot'], herramienta: true, porque: 'Plafón de 2.60 m. Subirse a una silla es como se rompe un tobillo.' }),
    ],
  },
  {
    id: 'orden',
    titulo: 'Orden y entrega',
    entrada:
      'Lo que separa una instalación profesional de una que funciona. El cliente no ve el empalme; ve el rack etiquetado y de ahí saca su opinión del trabajo.',
    items: [
      T('etiquetadora', 'Etiquetadora Brother P-touch', {
        precio: [900, 2200],
        unidad: 'equipo',
        donde: ['amazon', 'homedepot'],
        herramienta: true,
        porque:
          'Cada módulo, cada cable del rack y cada breaker etiquetado. Es lo que hace que el siguiente que abra —o uno mismo en dos años— entienda en un minuto.',
      }),
      T('velcro', 'Cincho de velcro en rollo', { precio: [90, 250], unidad: 'rollo', donde: ['unit', 'amazon'], porque: 'En vez de cincho de plástico: se abre y se vuelve a cerrar sin cortar nada.' }),
      T('bolsas', 'Bolsas con cierre y marcador', { precio: [40, 120], unidad: 'paquete', donde: ['ferreteria'], porque: 'Para los tornillos de cada placa que se quita. Un tornillo perdido detiene la entrega.' }),
    ],
  },
]

/** Todo plano, para buscar y sumar. */
export const ITEMS = GRUPOS.flatMap((g) => g.items.map((i) => ({ ...i, grupo: g.id })))

/** Cuánto cuesta armar la caja completa, por si se contrata a alguien más. */
export function costoArranque(soloHerramienta = false) {
  const lista = soloHerramienta ? ITEMS.filter((i) => i.herramienta) : ITEMS
  return lista.reduce(
    (a, i) => ({ min: a.min + i.precio[0], max: a.max + i.precio[1] }),
    { min: 0, max: 0 },
  )
}
