/**
 * Quiénes somos.
 *
 * La llave es el usuario con el que se entra al panel y tiene que coincidir
 * con `PANEL_USERS` en Railway; si no coincide, el registro guardaría cambios
 * a nombre de alguien que no existe. Para dar de alta a un socio nuevo:
 *
 *   1. `npm run hash-password -- nombre`
 *   2. pegar el resultado en PANEL_USERS
 *   3. agregar el renglón aquí
 *
 * El color es para distinguir de un vistazo quién tocó qué en el historial.
 */

export const SOCIOS = {
  margay: { nombre: 'Eric Margay', corto: 'Eric', color: '#ff9a4d' },
  carpio: { nombre: 'Carpio', corto: 'Carpio', color: '#7fa6ff' },
}

/** Nunca devuelve nulo: un usuario desconocido se muestra tal cual entró. */
export function socio(usuario) {
  const id = String(usuario ?? '').toLowerCase().trim()
  return SOCIOS[id] ?? { nombre: id || 'desconocido', corto: id || '—', color: '#9c9388' }
}
