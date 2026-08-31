import { useMemo } from 'react'

import { DEVICE_BY_ID } from '../../content/catalog'
import { POR_ID } from '../../content/inventario'

/**
 * Qué de lo que ya hay puede llegar a hablar Matter.
 *
 * Es la pregunta más cara del levantamiento y casi nadie la hace a tiempo. Un
 * aparato que sube a Matter por firmware se conserva y no se cobra; uno que no
 * va a llegar nunca hay que decidirlo AHORA —se queda aislado en su app o se
 * cambia— porque descubrirlo el día de la instalación significa una compra no
 * presupuestada enfrente del cliente.
 *
 * Cuatro estados y ninguno es "sí o no":
 *
 * — **De fábrica**: ya habla Matter. No hay nada que hacer.
 * — **Por firmware**: puede subir. Casi siempre gratis, casi siempre con
 *   requisitos, y a veces SIN VUELTA ATRÁS — la de Eve, por ejemplo, no deja
 *   regresar a HomeKit.
 * — **Por revisar**: el fabricante lo subió en parte de su línea y no está
 *   claro si este modelo entra. Se confirma antes de prometer.
 * — **No llega**: generación cerrada. Se conserva aislado o se cambia, y eso
 *   se decide con el cliente, no por él.
 */

const ESTADOS = {
  fabrica: {
    label: 'Ya habla Matter',
    orden: 3,
    clase: 'border-emerald-500/30 bg-emerald-500/[0.05]',
    punto: 'bg-emerald-400',
  },
  firmware: {
    label: 'Sube por firmware',
    orden: 1,
    clase: 'border-thread/35 bg-thread/[0.06]',
    punto: 'bg-thread',
  },
  revisar: {
    label: 'Por confirmar',
    orden: 0,
    clase: 'border-ember/35 bg-ember/[0.06]',
    punto: 'bg-ember',
  },
  no: {
    label: 'No va a llegar',
    orden: 2,
    clase: 'border-rose-500/35 bg-rose-500/[0.06]',
    punto: 'bg-rose-400',
  },
}

/** Lo que sabemos de un id del inventario del cliente, cuando no es catálogo. */
const DESDE_INVENTARIO = {
  appleTv: { estado: 'fabrica', porque: 'Central de Apple Home y controlador Matter.' },
  homepodMini: { estado: 'fabrica', porque: 'Router de borde Thread y controlador Matter.' },
  echo: { estado: 'fabrica', porque: 'Controlador Matter; la 4ª generación además es puente Zigbee.' },
  echoDot: { estado: 'fabrica', porque: 'Controlador Matter. No es puente ni router de borde.' },
  echoShow: { estado: 'fabrica', porque: 'Controlador Matter, puente Zigbee y router de borde.' },
  nestHub: { estado: 'fabrica', porque: 'Controlador Matter; la 2ª generación es router de borde.' },
  hue: { estado: 'fabrica', porque: 'Con el puente Hue actualizado, los focos entran por Matter.' },
  huePuente: { estado: 'fabrica', porque: 'El puente expone todo lo Hue como Matter.' },
  focoSteren: {
    estado: 'no',
    porque: 'Focos WiFi de marca blanca. Viven en su propia app y no hay ruta de firmware.',
    accion: 'O se quedan controlados aparte, o se cambian. Conviene decidirlo antes de instalar.',
  },
  focoTuya: { estado: 'no', porque: 'Genéricos WiFi sin ruta a Matter.', accion: 'Se cambian si se quieren en las automatizaciones.' },
  fireTv: { estado: 'no', porque: 'No es aparato de casa inteligente: controla la tele por HDMI-CEC.', accion: 'Se conserva tal cual, no hay nada que actualizar.' },
  meshWifi: { estado: 'fabrica', porque: 'Varios sistemas en malla hacen de controlador Matter según modelo.' },
  teleSamsung: { estado: 'fabrica', porque: 'Las Samsung recientes con SmartThings adoptan Matter.' },
  alimentador: { estado: 'no', porque: 'Marca blanca con app propia.', accion: 'Se queda aparte. No estorba, pero no entra a las escenas.' },
  camara: { estado: 'revisar', porque: 'Matter apenas está incorporando cámaras; depende de la marca.', accion: 'Confirmar el modelo antes de prometer que se ve en la app de la casa.' },
}

const info = (id) => DEVICE_BY_ID[id]?.matter ?? DESDE_INVENTARIO[id] ?? null
const nombre = (id) => DEVICE_BY_ID[id]?.name ?? POR_ID[id]?.label ?? id
const marca = (id) => DEVICE_BY_ID[id]?.brand ?? ''

/**
 * @param rooms  espacios del proyecto (equipo cotizado)
 * @param inv    inventario de lo que el cliente ya tiene
 */
export default function Firmware({ rooms = [], inv = [] }) {
  const filas = useMemo(() => {
    const vistos = new Map()

    const sumar = (id, donde) => {
      const m = info(id)
      if (!m) return
      const prev = vistos.get(id)
      if (prev) {
        if (donde && !prev.donde.includes(donde)) prev.donde.push(donde)
        return
      }
      vistos.set(id, { id, ...m, donde: donde ? [donde] : [] })
    }

    for (const r of rooms) for (const [id, n] of Object.entries(r.items ?? {})) if (n > 0) sumar(id, r.nombre)
    for (const u of inv) sumar(u.id, u.espacio || null)

    return [...vistos.values()].sort(
      (a, b) => (ESTADOS[a.estado]?.orden ?? 9) - (ESTADOS[b.estado]?.orden ?? 9) || nombre(a.id).localeCompare(nombre(b.id)),
    )
  }, [rooms, inv])

  if (filas.length === 0) return null

  const cuenta = (e) => filas.filter((f) => f.estado === e).length

  return (
    <div className="border-t border-line px-3 py-3">
      <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">
        Actualización a Matter · {filas.length}
      </p>
      <p className="mt-1 text-[10.5px] leading-relaxed text-cream-3">
        Qué de lo que hay puede llegar a hablar Matter. Lo que no va a llegar se decide ahora, no el día de la
        instalación.
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {Object.entries(ESTADOS).map(([k, e]) =>
          cuenta(k) > 0 ? (
            <span key={k} className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] text-cream-3">
              <span className={`h-1.5 w-1.5 rounded-full ${e.punto}`} />
              {e.label} · {cuenta(k)}
            </span>
          ) : null,
        )}
      </div>

      <div className="mt-2 space-y-1.5">
        {filas.map((f) => {
          const e = ESTADOS[f.estado] ?? ESTADOS.revisar
          return (
            <div key={f.id} className={`rounded-lg border px-2.5 py-2 ${e.clase}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-[11.5px] text-cream">
                  {nombre(f.id)}
                  {marca(f.id) && <span className="text-cream-3"> · {marca(f.id)}</span>}
                </p>
                <span className="flex shrink-0 items-center gap-1 text-[10px] text-cream-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${e.punto}`} />
                  {e.label}
                </span>
              </div>
              <p className="mt-0.5 text-[10.5px] leading-snug text-cream-3">{f.porque}</p>
              {f.accion && <p className="mt-0.5 text-[10.5px] leading-snug text-cream-2">{f.accion}</p>}
              {f.donde.length > 0 && (
                <p className="mt-0.5 text-[10px] text-cream-3">En {f.donde.join(', ')}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
