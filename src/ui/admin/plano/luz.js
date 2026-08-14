import * as THREE from 'three'

/**
 * De la ficha del fabricante a una luz de three.js.
 *
 * La gracia de que el plano use lúmenes y kelvin de verdad —y no un "brillo"
 * inventado del 0 al 100— es que responde la pregunta que se hace en obra:
 * *¿con estas piezas se ve o no se ve?* Un cuarto con tres focos de 800 lm se
 * ve distinto a uno con tres de 1600, y aquí se nota antes de comprarlos.
 *
 * three.js trabaja en unidades físicas desde r155: `PointLight.power` está en
 * lúmenes y `SpotLight.power` también. Así que el dato del catálogo entra tal
 * cual, sin factor de conversión que haya que justificar.
 */

/**
 * Temperatura de color a RGB.
 *
 * Aproximación de Tanner Helland: no es colorimetría de laboratorio, pero
 * acierta en lo que importa aquí — que 2700 K se vea ámbar de sala y 6500 K
 * se vea blanco de oficina, y que el salto entre uno y otro sea creíble.
 */
export function kelvinAColor(k) {
  const t = Math.max(1000, Math.min(12000, k)) / 100
  let r, g, b

  if (t <= 66) {
    r = 255
    g = 99.47 * Math.log(t) - 161.12
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332)
    g = 288.12 * Math.pow(t - 60, -0.0755)
    b = 255
  }

  const c = (v) => Math.max(0, Math.min(255, v)) / 255
  return new THREE.Color(c(r), c(g), c(b))
}

/** Kelvin por default de un dispositivo: el centro de su rango. */
export function kelvinDe(luz) {
  if (!luz?.k) return 2700
  return Array.isArray(luz.k) ? Math.round((luz.k[0] + luz.k[1]) / 2) : luz.k
}

/**
 * Iluminancia media del cuarto, en lux.
 *
 * lux = lúmenes útiles ÷ metros cuadrados. El factor de utilización (0.55) es
 * la regla de dedo de siempre: entre el techo, los muros y que la luminaria no
 * manda todo hacia abajo, al plano de trabajo llega poco más de la mitad de lo
 * que dice la caja.
 *
 * No sustituye un cálculo luminotécnico. Sirve para lo que sirve: darse cuenta
 * en el levantamiento de que la recámara va a quedar oscura, cuando todavía se
 * puede agregar una pieza sin volver a la obra.
 */
const UTILIZACION = 0.55

export function luxDelCuarto(lumenes, m2) {
  if (!m2) return 0
  return Math.round((lumenes * UTILIZACION) / m2)
}

/**
 * Cuánta luz pide cada tipo de cuarto, en lux.
 *
 * Valores de referencia de la práctica común de interiores; el baño y la
 * cocina piden más porque ahí se hacen cosas con las manos, la recámara menos
 * porque ahí se hace lo contrario.
 */
export const LUX_OBJETIVO = {
  sala: [100, 200],
  recamara: [80, 150],
  cocina: [250, 400],
  bano: [200, 300],
  comedor: [100, 200],
  estudio: [300, 500],
  servicio: [150, 250],
  exterior: [50, 100],
  generico: [100, 250],
}

/** Cómo va el cuarto contra lo que pide su uso. */
export function diagnosticoLux(lux, tipo) {
  const [min, max] = LUX_OBJETIVO[tipo] ?? LUX_OBJETIVO.generico
  if (lux < min * 0.6) return { nivel: 'bajo', texto: `Muy oscuro para ${etiqueta(tipo)}: faltan piezas.` }
  if (lux < min) return { nivel: 'justo', texto: `Va justo. Se recomienda ${min}–${max} lux.` }
  if (lux > max * 1.6) return { nivel: 'alto', texto: `De sobra — se puede bajar o repartir mejor.` }
  return { nivel: 'ok', texto: `En el rango de ${min}–${max} lux.` }
}

const etiqueta = (tipo) =>
  ({ sala: 'una sala', recamara: 'una recámara', cocina: 'una cocina', bano: 'un baño', comedor: 'un comedor', estudio: 'un estudio', servicio: 'un área de servicio', exterior: 'exterior' })[tipo] ??
  'este uso'

/**
 * Los parámetros con los que nace un dispositivo al colocarse.
 *
 * Se copian del catálogo en vez de leerse de él cada vez, a propósito: en el
 * plano se van a poder ajustar pieza por pieza —bajarle a una, cambiarle el
 * tono a otra— y eso son datos de ESTE proyecto, no del catálogo general.
 */
export function parametrosIniciales(device) {
  const l = device?.luz
  if (!l) return null
  return {
    lm: l.lm,
    k: kelvinDe(l),
    haz: l.haz,
    forma: l.forma,
    brillo: 100, // porcentaje, como lo vería el cliente en la app
  }
}

/** Entrepiso: de piso terminado a piso terminado. */
export const ALTURA_PISO = 3.1

/** Altura a la que se monta cada forma de luminaria, si no se dice otra cosa. */
export const ALTURA_POR_FORMA = { punto: 2.4, panel: 1.6, lineal: 2.2 }
