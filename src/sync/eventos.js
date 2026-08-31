/**
 * El modelo de cambios — compartido por el navegador y el servidor.
 *
 * La decisión de fondo: no se sincroniza el estado, se sincronizan los
 * CAMBIOS. Cada cosa que alguien toca es un evento con autor y hora; el
 * estado es lo que queda de aplicarlos en orden.
 *
 * Sale gratis lo que se pidió: el historial no es una bitácora que haya que
 * mantener aparte y que se pueda olvidar de escribir — es literalmente la
 * misma lista de eventos con la que se arma el estado. Si algo aparece en la
 * pantalla, aparece en el historial, porque llegó por ahí.
 *
 * Este archivo lo corre Node tal cual (sin build): por eso no importa nada de
 * React ni usa sintaxis de JSX.
 */

export const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

/* ── secciones del proyecto ───────────────────────────────────────
   Sirven para agrupar el historial: "qué se movió en el equipo" es una
   pregunta distinta de "qué se movió en los datos fiscales". */
export const SECCIONES = {
  proyecto: 'Proyecto',
  cliente: 'Cliente',
  obra: 'Propiedad',
  perfil: 'Lo que ya tiene',
  cuartos: 'Habitaciones',
  equipo: 'Equipo',
  plano: 'Plano',
  servicios: 'Servicios',
  compras: 'Compras',
}

/**
 * El plano de un cuarto.
 *
 * Vive dentro del cuarto y no aparte porque es una propiedad suya: si el
 * cuarto se borra, su plano se va con él y no queda huérfano.
 *
 * Medidas en metros. El origen local es el centro del cuarto, con x a lo
 * ancho y z a lo largo — igual que la escena del recorrido, para poder
 * reutilizar su mobiliario sin convertir coordenadas.
 */
export const planoVacio = (m2 = 15) => {
  // de los metros cuadrados se infiere un cuarto de proporción sensata; el
  // técnico lo corrige con las medidas reales en dos campos
  const lado = Math.sqrt(Math.max(4, m2))
  return {
    ancho: Number((lado * 1.15).toFixed(2)),
    largo: Number((lado / 1.15).toFixed(2)),
    alto: 2.6,
    piso: 0,
    pos: [0, 0], // dónde cae el cuarto cuando se arma el conjunto
    giro: 0,
    items: [],
    tramos: [],
    reglas: [],
  }
}

export const ESTADOS = [
  { id: 'levantamiento', label: 'En levantamiento' },
  { id: 'cotizado', label: 'Cotizado' },
  { id: 'instalacion', label: 'En instalación' },
  { id: 'cerrado', label: 'Cerrado' },
]

const CLIENTE_VACIO = {
  nombre: '',
  razonSocial: '',
  rfc: '',
  regimen: '612',
  cp: '',
  usoCfdi: 'G03',
  formaPago: '03',
  metodoPago: 'PUE',
  email: '',
  tel: '',
  direccion: '',
}

/* `propiedad` es el id que manda —decide qué espacios se ofrecen— y `tipo` es
   la etiqueta que se imprime en la cotización. Separados a propósito: el
   cliente puede querer que diga "Residencia" sin que eso cambie el catálogo
   de espacios que ve el técnico. */
const OBRA_VACIA = { propiedad: 'casa', tipo: 'Casa', m2: 180, niveles: 2, zona: 'Zona metropolitana' }

/* Con qué llega el cliente: teléfonos, cerebros que ya tiene y equipo suyo.
   Cambia la propuesta entera, así que se levanta igual que los metros. */
const PERFIL_VACIO = { moviles: [], cerebros: [], existente: {}, notas: '' }

const EXTRAS_VACIOS = {
  puntosRed: 4,
  escenas: 8,
  km: 0,
  descuentoPct: 0,
  acreditaLevantamiento: true,
  vigencia: 15,
}

export const nuevoCuarto = (nombre = 'Cuarto', m2 = 15, tipo = 'interior') => ({
  id: uid('r'),
  nombre,
  m2,
  tipo,
  notas: '',
  items: {},
})

/** Folio legible: MTR-AAMM-NNN */
export function nuevoFolio(fecha = new Date()) {
  const yy = String(fecha.getFullYear()).slice(2)
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const n = String(Math.floor(Math.random() * 900) + 100)
  return `MTR-${yy}${mm}-${n}`
}

export function nuevoProyecto({ nombre = '', cliente = {}, obra = {}, extras = {}, rooms } = {}) {
  return {
    id: uid('p'),
    folio: nuevoFolio(),
    nombre: nombre.trim() || 'Proyecto sin nombre',
    estado: 'levantamiento',
    archivado: false,
    cliente: { ...CLIENTE_VACIO, ...cliente },
    obra: { ...OBRA_VACIA, ...obra },
    extras: { ...EXTRAS_VACIOS, ...extras },
    perfil: { ...PERFIL_VACIO },
    rooms: rooms ?? [
      nuevoCuarto('Sala', 28),
      nuevoCuarto('Cocina', 22),
      nuevoCuarto('Recámara principal', 24),
    ],
  }
}

/* ── aplicar un evento ────────────────────────────────────────────
   `estado` es { proyectos: [...] }. Siempre inmutable: el cliente vuelve a
   renderizar por identidad y mutar en el lugar lo dejaría sin repintar. */

const mapa = (proyectos, id, fn) => proyectos.map((p) => (p.id === id ? fn(p) : p))

export function aplicar(estado, ev) {
  const ps = estado.proyectos
  const toca = (fn) => ({ ...estado, proyectos: mapa(ps, ev.proyectoId, fn) })

  switch (ev.tipo) {
    case 'proyecto.crear':
      // idempotente: si el evento se reprocesa no duplica el proyecto
      return ps.some((p) => p.id === ev.datos.proyecto.id)
        ? estado
        : { ...estado, proyectos: [ev.datos.proyecto, ...ps] }

    case 'proyecto.editar':
      return toca((p) => ({ ...p, ...ev.datos.patch }))

    case 'proyecto.eliminar':
      return { ...estado, proyectos: ps.filter((p) => p.id !== ev.proyectoId) }

    case 'cliente.editar':
      return toca((p) => ({ ...p, cliente: { ...p.cliente, ...ev.datos.patch } }))

    case 'obra.editar':
      return toca((p) => ({ ...p, obra: { ...p.obra, ...ev.datos.patch } }))

    case 'servicios.editar':
      return toca((p) => ({ ...p, extras: { ...p.extras, ...ev.datos.patch } }))

    // los enlaces cortos viven en el registro pero no son parte del
    // levantamiento: no tocan el estado de ningún proyecto
    case 'enlace.corto':
      return estado

    case 'perfil.editar':
      return toca((p) => ({ ...p, perfil: { ...PERFIL_VACIO, ...p.perfil, ...ev.datos.patch } }))

    case 'cuarto.agregar': {
      // un evento sin cuarto no debe reventar la reducción: ahora los eventos
      // también entran por HTTP y basta uno mal formado para tumbar el hub
      const nuevo = ev.datos?.cuarto
      if (!nuevo?.id) return estado
      return toca((p) => (p.rooms.some((r) => r.id === nuevo.id) ? p : { ...p, rooms: [...p.rooms, nuevo] }))
    }

    case 'cuarto.editar':
      return toca((p) => ({
        ...p,
        rooms: p.rooms.map((r) => (r.id === ev.datos.cuartoId ? { ...r, ...ev.datos.patch } : r)),
      }))

    /* El orden de los espacios es del levantamiento, no del azar: se recorre
       la casa en un orden y la lista tiene que poder reflejarlo. Viaja la
       lista completa de ids y no "subir uno", que aplicado dos veces daría
       resultados distintos. */
    case 'cuartos.reordenar':
      return toca((p) => {
        const porId = Object.fromEntries(p.rooms.map((r) => [r.id, r]))
        const ordenados = ev.datos.orden.map((id) => porId[id]).filter(Boolean)
        // lo que no venga en la lista se conserva al final: si dos socios
        // reordenan a la vez, nadie pierde un espacio
        const resto = p.rooms.filter((r) => !ev.datos.orden.includes(r.id))
        return { ...p, rooms: [...ordenados, ...resto] }
      })

    case 'cuarto.eliminar':
      return toca((p) => ({ ...p, rooms: p.rooms.filter((r) => r.id !== ev.datos.cuartoId) }))

    /* Cantidad ABSOLUTA, no incremento. Si dos socios mueven la misma pieza al
       mismo tiempo, un incremento se aplicaría dos veces y la cuenta quedaría
       mal; con cantidad absoluta el último gana y ambos ven lo mismo. */
    /* Un aparato dado de alta a mano. Vive en el proyecto y no en el catálogo
       de código: es de esta casa, y mezclarlo con el curado ensuciaría lo que
       se le propone a los demás clientes. */
    case 'device.crear':
      return toca((p) => ({
        ...p,
        devices: [...(p.devices ?? []).filter((d) => d.id !== ev.datos.device.id), ev.datos.device],
      }))

    case 'device.borrar':
      return toca((p) => ({ ...p, devices: (p.devices ?? []).filter((d) => d.id !== ev.datos.deviceId) }))

    case 'equipo.cantidad':
      return toca((p) => ({
        ...p,
        rooms: p.rooms.map((r) =>
          r.id !== ev.datos.cuartoId
            ? r
            : { ...r, items: { ...r.items, [ev.datos.deviceId]: Math.max(0, ev.datos.qty) } },
        ),
      }))

    case 'equipo.vaciar':
      return toca((p) => ({ ...p, rooms: p.rooms.map((r) => ({ ...r, items: {} })) }))

    /* ── plano 3D ────────────────────────────────────────────────────
       Un solo tipo de evento para todo el plano en vez de uno por cada
       cosa que se puede mover. Es a propósito: colocar un mueble y
       arrastrarlo diez centímetros son el mismo gesto para quien lo hace, y
       tener `plano.mueble.mover`, `plano.luz.mover`, `plano.punto.mover`
       llenaría el historial de ruido sin decir nada más.

       El precio es que el evento lleva el plano completo. A esta escala
       —decenas de objetos por cuarto— eso es un objeto de unos pocos kB, y
       vuelve la operación idempotente sin esfuerzo: reenviarla deja el mismo
       resultado, que es lo que necesita la cola cuando se cae la red. */
    case 'plano.editar':
      return toca((p) => ({
        ...p,
        rooms: p.rooms.map((r) =>
          r.id !== ev.datos.cuartoId ? r : { ...r, plano: { ...(r.plano ?? {}), ...ev.datos.plano } },
        ),
      }))

    /* ── compras ─────────────────────────────────────────────────────
       Precio y URL de compra, por dispositivo y por PROYECTO —no por
       catálogo, que es de todos los clientes, ni por cuarto, porque el
       mismo aparato en dos espacios se compra en el mismo lugar al mismo
       precio—. Un evento por aparato, mezclado sobre lo que ya hubiera:
       corregir el precio no borra la URL que alguien ya había puesto. */
    case 'compras.editar':
      return toca((p) => ({
        ...p,
        compras: {
          ...p.compras,
          productos: {
            ...(p.compras?.productos ?? {}),
            [ev.datos.deviceId]: { ...(p.compras?.productos?.[ev.datos.deviceId] ?? {}), ...ev.datos.patch },
          },
        },
      }))

    default:
      return estado
  }
}

/** Estado desde cero a partir del registro completo. */
export function reducir(eventos) {
  let estado = { proyectos: [] }
  for (const ev of eventos) estado = aplicar(estado, ev)
  return estado
}

/* ── historial legible ────────────────────────────────────────────
   El resumen se calcula al leerlo, no se guarda: así un evento viejo se
   sigue describiendo bien aunque cambiemos cómo se redacta. */

const pluralPiezas = (n) => `${n} ${n === 1 ? 'pieza' : 'piezas'}`

const CAMPOS = {
  nombre: 'el nombre',
  razonSocial: 'la razón social',
  rfc: 'el RFC',
  regimen: 'el régimen fiscal',
  cp: 'el código postal',
  usoCfdi: 'el uso del CFDI',
  formaPago: 'la forma de pago',
  metodoPago: 'el método de pago',
  email: 'el correo',
  tel: 'el WhatsApp',
  direccion: 'la dirección',
  tipo: 'el tipo',
  m2: 'los metros',
  niveles: 'los niveles',
  zona: 'la zona',
  puntosRed: 'los puntos de red',
  escenas: 'las escenas',
  km: 'los kilómetros fuera de zona',
  descuentoPct: 'el descuento',
  acreditaLevantamiento: 'la acreditación del levantamiento',
  vigencia: 'la vigencia',
  notas: 'las notas',
  folio: 'el folio',
}

const lista = (patch) =>
  Object.keys(patch ?? {})
    .map((k) => CAMPOS[k] ?? k)
    .join(', ')

/**
 * @param nombreDe  (deviceId) => nombre comercial. El servidor no conoce el
 *                  catálogo, así que lo inyecta quien tenga cómo resolverlo.
 */
export function resumen(ev, nombreDe = (id) => id) {
  const d = ev.datos ?? {}
  switch (ev.tipo) {
    case 'proyecto.crear':
      return `Creó el proyecto ${d.proyecto?.nombre ?? ''}`.trim()
    case 'proyecto.editar':
      if ('estado' in d.patch) return `Movió el proyecto a ${estadoLabel(d.patch.estado)}`
      if ('archivado' in d.patch) return d.patch.archivado ? 'Archivó el proyecto' : 'Desarchivó el proyecto'
      if ('nombre' in d.patch) return `Renombró el proyecto a "${d.patch.nombre}"`
      return `Cambió ${lista(d.patch)} del proyecto`
    case 'proyecto.eliminar':
      return 'Eliminó el proyecto'
    case 'cliente.editar':
      return `Cambió ${lista(d.patch)} del cliente`
    case 'obra.editar':
      return `Cambió ${lista(d.patch)} de la propiedad`
    case 'perfil.editar':
      return 'Actualizó lo que el cliente ya tiene'
    case 'servicios.editar':
      return `Cambió ${lista(d.patch)}`
    case 'cuarto.agregar':
      return `Agregó la habitación ${d.cuarto?.nombre ?? ''}`.trim()
    case 'cuarto.editar':
      return `Cambió ${lista(d.patch)} de ${d.cuartoNombre ?? 'una habitación'}`
    case 'cuarto.eliminar':
      return `Eliminó la habitación ${d.cuartoNombre ?? ''}`.trim()
    case 'device.crear':
      return `Dio de alta ${d.device?.name ?? 'un aparato'}`

    case 'device.borrar':
      return `Quitó del catálogo ${nombreDe(d.deviceId)}`

    case 'equipo.cantidad': {
      const nombre = nombreDe(d.deviceId)
      const donde = d.cuartoNombre ? ` en ${d.cuartoNombre}` : ''
      if (d.qty === 0) return `Quitó ${nombre}${donde}`
      if (d.anterior === 0 || d.anterior == null) return `Agregó ${pluralPiezas(d.qty)} de ${nombre}${donde}`
      return `Dejó ${nombre} en ${pluralPiezas(d.qty)}${donde}`
    }
    case 'cuartos.reordenar':
      return 'Reordenó los espacios'
    case 'equipo.vaciar':
      return 'Vació todas las piezas del proyecto'
    case 'plano.editar':
      return `${d.que ?? 'Modificó el plano'} de ${d.cuartoNombre ?? 'una habitación'}`
    case 'compras.editar': {
      const nombre = nombreDe(d.deviceId)
      const campo = 'precio' in (d.patch ?? {}) ? 'el precio' : 'url' in (d.patch ?? {}) ? 'la URL de compra' : 'la compra'
      return `Cambió ${campo} de ${nombre}`
    }
    default:
      return ev.tipo
  }
}

export const estadoLabel = (id) => ESTADOS.find((e) => e.id === id)?.label ?? id

/** A qué sección del proyecto pertenece cada tipo de evento. */
export function seccionDe(tipo) {
  if (tipo.startsWith('cliente.')) return 'cliente'
  if (tipo.startsWith('obra.')) return 'obra'
  if (tipo.startsWith('perfil.')) return 'perfil'
  if (tipo.startsWith('cuarto.')) return 'cuartos'
  if (tipo.startsWith('equipo.')) return 'equipo'
  if (tipo.startsWith('plano.')) return 'plano'
  if (tipo.startsWith('servicios.')) return 'servicios'
  if (tipo.startsWith('compras.')) return 'compras'
  return 'proyecto'
}
