/**
 * Qué se mueve y cómo.
 *
 * Un plano quieto se lee como una lámina. Basta con que algo respire para que
 * el cuarto pase de dibujo a lugar — y eso importa aquí más que en otros
 * lados, porque lo que se está vendiendo es precisamente una casa que
 * responde. Pero el movimiento tiene que ser el correcto para cada cosa: una
 * planta se mece, un gato respira, una lavadora vibra y un ventilador gira. La
 * misma animación para todo se nota falsa antes que ninguna.
 *
 * Por eso se elige por pieza y no se impone por tipo: dos plantas del mismo
 * modelo pueden acabar una quieta y otra meciéndose, según dónde estén y si
 * les da el aire.
 */

export const ANIMACIONES = {
  ninguna: { label: 'Quieta', porque: 'Como está. Para lo que de verdad no se mueve.' },
  respirar: {
    label: 'Respira',
    porque: 'Sube y baja apenas. Para una mascota dormida o cualquier cosa que deba parecer viva.',
  },
  mecer: {
    label: 'Se mece',
    porque: 'Oscila despacio. Para plantas, cortinas sueltas o algo colgado del techo.',
  },
  girar: {
    label: 'Gira',
    porque: 'Vuelta continua. Ventilador, extractor, cualquier aspa.',
  },
  vibrar: {
    label: 'Vibra',
    porque: 'Tembleque corto y rápido. Lavadora o secadora en ciclo de centrifugado.',
  },
  latir: {
    label: 'Late',
    porque: 'Crece y encoge muy poco. Para señalar algo sin encenderlo.',
  },
  colgar: {
    label: 'Cuelga y se balancea',
    porque: 'Péndulo desde arriba. Para lo que va colgado de un cable o un riel.',
  },
}

/** Qué animaciones tienen sentido para esta pieza. Ofrecer "gira" a una cama
 *  no es una opción, es un error que alguien va a escoger por curiosidad. */
export function animacionesDe(tipo = '', cat = '') {
  const t = `${tipo} ${cat}`.toLowerCase()
  if (/gato|perro|mascota/.test(t)) return ['ninguna', 'respirar']
  if (/planta|maceta/.test(t)) return ['ninguna', 'mecer', 'respirar']
  if (/colgante|esfera|lampara|luminaria/.test(t)) return ['ninguna', 'colgar', 'mecer']
  if (/lavadora|secadora|lavavajillas/.test(t)) return ['ninguna', 'vibrar']
  if (/campana|ventilador|extractor|refri/.test(t)) return ['ninguna', 'girar', 'vibrar']
  if (/persiana|cortina|tendedero/.test(t)) return ['ninguna', 'mecer']
  if (/reloj/.test(t)) return ['ninguna', 'girar']
  return ['ninguna', 'latir', 'mecer']
}

