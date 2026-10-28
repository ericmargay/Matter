import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { DEVICE_BY_ID } from '../../content/catalog'
import { precioVisto, PROVEEDOR_BY_ID } from '../../content/opsCatalog'
import { unitPrice } from '../../content/pricing'
import { useProyecto, useSurvey, useTarifas } from '../../store/survey'
import PlanoAereo from '../plano/PlanoAereo'
import Compartir from './Compartir'

/**
 * El plano aéreo en el panel: el mismo que ve el cliente, con lo que el
 * cliente no ve —dónde se compra cada cosa y a cuánto—.
 *
 * Lo que se mueve aquí sale por el mismo canal que todo el panel, así que el
 * otro socio lo ve moverse en su pantalla, y el cliente en la suya si tiene
 * abierto su enlace. Y al revés: lo que el cliente acomode desde su teléfono
 * llega aquí solo.
 */

// de una liga a la tienda, para no enseñar la URL entera
function tiendaDeUrl(url) {
  try {
    const h = new URL(url).hostname
    if (h.includes('amazon.')) return 'Amazon México'
    if (h.includes('uelectronics')) return 'UNIT Electronics'
    if (h.includes('mercadolibre')) return 'MercadoLibre'
    return h.replace(/^www\./, '')
  } catch {
    return null
  }
}

export default function PlanoProyecto() {
  const proyecto = useProyecto()
  const tarifas = useTarifas()
  const editarMapa = useSurvey((s) => s.editarMapa)
  const conectados = useSurvey((s) => s.conectados)
  const yo = useSurvey((s) => s.yo)
  const [enlace, setEnlace] = useState(null)
  const [verEnlace, setVerEnlace] = useState(false)
  const raiz = useRef(null)
  const [arriba, setArriba] = useState(92)

  // el encabezado del panel cambia de alto según el ancho: se mide, no se supone
  useLayoutEffect(() => {
    const medir = () => raiz.current && setArriba(Math.max(0, raiz.current.getBoundingClientRect().top + window.scrollY))
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  useEffect(() => {
    if (!proyecto?.id) return
    let vivo = true
    fetch(`/api/enlace-inventario/${proyecto.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => vivo && d && setEnlace(`${window.location.origin}/#/mi-plano?t=${d.token}`))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [proyecto?.id])

  const espacios = useMemo(
    () => (proyecto?.rooms ?? []).map((r) => ({ id: r.id, nombre: r.nombre, m2: r.m2, plano: r.plano, items: r.items ?? {} })),
    [proyecto?.rooms],
  )

  const aparato = useCallback(
    (id) => {
      const d = DEVICE_BY_ID[id]
      if (!d) return null
      return { nombre: tarifas.productos?.[id]?.nombre || d.name, cat: d.cat, marca: d.brand }
    },
    [tarifas],
  )

  /* El precio con la misma regla que Compras —la tarifa del negocio, si no la
     corrección vieja del proyecto, si no el catálogo— y la liga confirmada a
     mano antes que la que se encontró buscando. */
  const compra = useCallback(
    (id) => {
      const d = DEVICE_BY_ID[id]
      if (!d) return null
      const t = { ...(proyecto?.compras?.productos?.[id] ?? {}), ...(tarifas.productos?.[id] ?? {}) }
      const visto = precioVisto(d)
      const url = t.url || visto?.url || null
      return {
        precio: t.precio ?? unitPrice(d),
        url,
        tienda: t.url ? tiendaDeUrl(t.url) : visto ? (PROVEEDOR_BY_ID[visto.prov]?.nombre ?? null) : null,
        nota: t.url ? null : (visto?.nota ?? null),
      }
    },
    [proyecto?.compras, tarifas],
  )

  if (!proyecto) return null

  const otros = (conectados ?? []).filter((u) => u !== yo)

  return (
    <div ref={raiz} className="-mx-5 -my-6 flex flex-col" style={{ height: `calc(100dvh - ${arriba}px)` }}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Plano aéreo</p>
          <h1 className="display truncate text-[22px] leading-tight text-cream">{proyecto.nombre}</h1>
        </div>
        <button
          type="button"
          onClick={() => setVerEnlace((v) => !v)}
          className="rounded-lg border border-thread/45 px-3 py-1.5 text-[12.5px] text-thread-2 hover:bg-thread/10"
        >
          {verEnlace ? 'Cerrar' : 'Enlace para el cliente'}
        </button>
      </div>
      {verEnlace && enlace && (
        <div className="border-b border-line px-5 py-3">
          <Compartir
            destino={enlace}
            etiqueta={`Plano · ${proyecto.nombre}`}
            titulo="El plano de su casa"
            ayuda="El cliente lo abre en su teléfono, sin cuenta: ve sus espacios y lo que va en cada uno, y puede acomodarlos. Lo que mueva llega aquí en vivo, y lo que muevas tú le llega a él. No ve precios ni tiendas."
          />
        </div>
      )}
      <div className="min-h-0 flex-1">
        <PlanoAereo
          espacios={espacios}
          aparato={aparato}
          compra={compra}
          onCambios={editarMapa}
          estado={
            <span className="ml-1 inline-flex items-center gap-1.5 border-l border-line pl-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-thread shadow-[0_0_8px_var(--color-thread)]" />
              {otros.length ? `En vivo con ${otros.map((u) => u.charAt(0).toUpperCase() + u.slice(1)).join(' y ')}` : 'En vivo'}
            </span>
          }
        />
      </div>
    </div>
  )
}
