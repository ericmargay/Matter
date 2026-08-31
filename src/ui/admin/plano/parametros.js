import { MUEBLES } from './catalogo'

/**
 * Qué se le puede tocar a una pieza, deducido de sus propias versiones.
 *
 * No hay una tabla de parámetros que mantener. Cada familia ya trae sus diez
 * versiones, y entre las diez está escrito todo lo que esa pieza sabe cambiar:
 * si nueve de las diez camas pasan `w` y una pasa `largo`, entonces ancho y
 * largo son sus parámetros. Los topes salen de los valores que de verdad usan
 * las versiones, ensanchados un poco para que se pueda salir del catálogo sin
 * poder pedir una cama de doce metros.
 *
 * Esto es lo que hace que el taller sirva para las 79 familias el mismo día en
 * que se abre, en vez de para las cinco que a alguien le dio tiempo de
 * describir a mano. Y cuando mañana una versión nueva pase un parámetro que
 * nadie había usado, aparece solo.
 */

/** Cómo se llama cada parámetro en pantalla, y en qué unidad se mide. */
const NOMBRES = {
  w: ['Ancho', 'm'],
  d: ['Fondo', 'm'],
  alto: ['Alto', 'm'],
  h: ['Alto', 'm'],
  largo: ['Largo', 'm'],
  r: ['Radio', 'm'],
  caida: ['Caída del cable', 'm'],
  alcance: ['Alcance del brazo', 'm'],
  altura: ['Altura del arco', 'm'],
  abre: ['Apertura de patas', 'm'],
  pantalla: ['Diámetro de pantalla', 'm'],
  brazo: ['Largo del brazo', '×'],
  talla: ['Talla', '×'],
  niveles: ['Entrepaños', ''],
  hojas: ['Hojas', ''],
  quemadores: ['Quemadores', ''],
  racimo: ['Piezas del racimo', ''],
  v: ['Forma', ''],
  tipo: ['Tipo', ''],
  estilo: ['Estilo', ''],
  tono: ['Tono', ''],
  empotrada: ['Empotrada', ''],
  induccion: ['Inducción', ''],
  integrado: ['Integrado', ''],
  exenta: ['Exenta', ''],
  pinza: ['De pinza', ''],
  brazos: ['Con brazos', ''],
  respaldo: ['Con respaldo', ''],
}

const etiqueta = (k) => NOMBRES[k]?.[0] ?? k
const unidad = (k) => NOMBRES[k]?.[1] ?? ''

/**
 * @returns [{ clave, label, unidad, tipo: 'numero'|'opcion'|'si', min, max, paso, opciones }]
 */
export function parametrosDe(tipo) {
  const def = MUEBLES[tipo]
  if (!def) return []

  const vistos = new Map()
  const fuentes = [def.props ?? {}, ...(def.variantes ?? []).map((v) => v.props ?? {})]
  for (const p of fuentes)
    for (const [k, v] of Object.entries(p)) {
      if (!vistos.has(k)) vistos.set(k, [])
      vistos.get(k).push(v)
    }

  return [...vistos.entries()].map(([clave, valores]) => {
    const nums = valores.filter((v) => typeof v === 'number')
    if (nums.length === valores.length && nums.length > 0) {
      const min = Math.min(...nums)
      const max = Math.max(...nums)
      const entero = nums.every((n) => Number.isInteger(n))
      /* Los topes se ensanchan a la mitad del rango que usan las versiones:
         alcanza para salirse del catálogo —que es de lo que se trata— sin que
         un resbalón del dedo deje una cama de doce metros. */
      const holgura = Math.max((max - min) * 0.5, entero ? 1 : max * 0.25)
      return {
        clave,
        label: etiqueta(clave),
        unidad: unidad(clave),
        tipo: 'numero',
        min: Math.max(entero ? 1 : 0.02, Number((min - holgura).toFixed(3))),
        max: Number((max + holgura).toFixed(3)),
        paso: entero ? 1 : 0.01,
      }
    }

    const unicos = [...new Set(valores.map((v) => JSON.stringify(v)))].map((v) => JSON.parse(v))
    if (unicos.every((v) => typeof v === 'boolean'))
      return { clave, label: etiqueta(clave), tipo: 'si' }

    return {
      clave,
      label: etiqueta(clave),
      tipo: 'opcion',
      opciones: unicos.filter((v) => v != null),
    }
  })
}

/**
 * Los valores con los que abre el taller: la base, encima la versión elegida y
 * encima lo que ya se haya ajustado a mano.
 *
 * El orden importa y es el mismo que usa el renderizador. Si aquí y allá no
 * fuera igual, el taller enseñaría una pieza y el plano dibujaría otra.
 */
export function valoresDe(item) {
  const def = MUEBLES[item?.tipo]
  if (!def) return {}
  const variante = def.variantes?.find((v) => v.id === item.variante)
  return { ...def.props, ...(variante?.props ?? {}), ...(item.ajustes ?? {}) }
}
