/**
 * Acabados de piso y de muro.
 *
 * Un cuarto no se decide con muebles nada más: la duela, el mármol o el
 * concreto pulido cambian la conversación entera —y el presupuesto—. En un
 * levantamiento de interiorismo el piso y el muro son las dos superficies más
 * grandes que hay, así que son las dos decisiones que más se ven.
 *
 * Cada acabado es geometría, no una textura: a la distancia de un plano
 * isométrico una imagen se ve sucia y un relieve se lee. Duela son tablas con
 * junta, porcelánico son losetas grandes, lambrín es una banda de madera hasta
 * el metro con su moldura. Eso sí se distingue.
 *
 * Se guardan en el plano del cuarto y no en el estilo global: en la misma
 * casa la recámara lleva duela y el baño porcelánico, y esa es justamente la
 * decisión que hay que poder tomar cuarto por cuarto.
 */

export const PISOS = [
  {
    id: 'duela',
    label: 'Duela',
    porque: 'Tablas de madera a lo largo. Es lo que hay en la mayoría de las recámaras y lo que más calienta un cuarto.',
    trazo: { modo: 'tablas', ancho: 0.19, junta: 0.006, trabado: true },
    tinte: { base: 'piso', veta: 0.3, rol: 'madera' },
  },
  {
    id: 'duelaAncha',
    label: 'Duela ancha',
    porque: 'Tabla de 30 cm, con menos juntas. Se ve más nueva y hace ver el cuarto más grande.',
    trazo: { modo: 'tablas', ancho: 0.3, junta: 0.005, trabado: false },
    tinte: { base: 'piso', veta: 0.22, rol: 'madera' },
  },
  {
    id: 'porcelanico',
    label: 'Porcelánico',
    porque: 'Loseta grande de 60 × 60. Lo de baño y cocina, y cada vez más de toda la planta baja.',
    trazo: { modo: 'losetas', ancho: 0.6, largo: 0.6, junta: 0.008 },
    tinte: { base: 'neutro', hacia: 'apoyo', mezcla: 0.14, rol: 'mate' },
  },
  {
    id: 'marmol',
    label: 'Mármol',
    porque: 'Placa grande y clara, junta mínima. Es el acabado más caro de los cinco y se nota de inmediato.',
    trazo: { modo: 'losetas', ancho: 0.9, largo: 0.9, junta: 0.004 },
    tinte: { base: 'neutro', mezcla: 0, rol: 'mate' },
  },
  {
    id: 'concreto',
    label: 'Concreto pulido',
    porque: 'Una sola superficie continua, sin junta. Es lo que pide un departamento de línea dura.',
    trazo: { modo: 'liso' },
    tinte: { base: 'neutro', hacia: 'apoyo', mezcla: 0.34, rol: 'mate' },
  },
]

export const MUROS_ACABADO = [
  {
    id: 'liso',
    label: 'Liso',
    porque: 'Pintura pareja de piso a techo. Es el punto de partida y el que no compite con nada.',
    trazo: { modo: 'liso' },
  },
  {
    id: 'lambrin',
    label: 'Lambrín',
    porque: 'Banda de madera hasta el metro con su moldura arriba. Aguanta golpes y da un cuarto más vestido.',
    trazo: { modo: 'banda', alto: 1.0, saliente: 0.022, moldura: 0.045, tono: 'apoyo' },
  },
  {
    id: 'medioMuro',
    label: 'Medio muro a dos tonos',
    porque: 'El mismo muro en dos colores, partido a 1.2 m. Cuesta pintura y nada más, y cambia el cuarto entero.',
    trazo: { modo: 'banda', alto: 1.2, saliente: 0.004, moldura: 0.02, tono: 'dominante' },
  },
  {
    id: 'panelado',
    label: 'Panelado',
    porque: 'Cuadros de moldura repartidos a lo ancho. Es el recurso de siempre para un muro que se ve vacío.',
    trazo: { modo: 'panel', alto: 1.9, marco: 0.035, saliente: 0.014 },
  },
  {
    id: 'ladrillo',
    label: 'Tabique aparente',
    porque: 'Hiladas de tabique con junta hundida. Un muro de acento, casi nunca los cuatro.',
    trazo: { modo: 'hiladas', alto: 0.075, junta: 0.012, saliente: 0.018 },
  },
]

export const PISO_BY_ID = Object.fromEntries(PISOS.map((p) => [p.id, p]))
export const MURO_BY_ID = Object.fromEntries(MUROS_ACABADO.map((m) => [m.id, m]))

export const pisoDe = (id) => PISO_BY_ID[id] ?? PISOS[0]
export const muroAcabadoDe = (id) => MURO_BY_ID[id] ?? MUROS_ACABADO[0]
