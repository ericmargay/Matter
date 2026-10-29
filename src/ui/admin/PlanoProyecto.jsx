import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { ALTERNATIVAS } from '../../content/alternativas'
import { catalogoDeCompra, compraDe, desembolso, fichaDe } from '../../content/compraDe'
import { useProyecto, useSurvey, useTarifas } from '../../store/survey'
import PlanoAereo from '../plano/PlanoAereo'
import Compartir from './Compartir'

/**
 * El plano aéreo en el panel: el mismo que ve el cliente, con la lista de
 * compras de cada espacio —dónde se compra cada cosa y a cuánto— y con qué
 * agregar, cambiar o quitar ahí mismo.
 *
 * Lo que se mueve aquí sale por el mismo canal que todo el panel, así que el
 * otro socio lo ve moverse en su pantalla, y el cliente en la suya si tiene
 * abierto su enlace. Y al revés: lo que el cliente acomode desde su teléfono
 * llega aquí solo.
 *
 * Las alternativas —"qué pasa si compramos el Echo con hub"— son copias del
 * proyecto ligadas a él: se pasa de una a otra desde la hoja y se ve cuánto
 * cuesta cada una, aquí y en el enlace del cliente.
 */

const contextoDe = (p, tarifas) => ({
  tarifas: tarifas?.productos ?? {},
  legado: p?.compras?.productos ?? {},
  propios: Object.fromEntries((p?.devices ?? []).map((d) => [d.id, d])),
})

export default function PlanoProyecto() {
  const proyecto = useProyecto()
  const proyectos = useSurvey((s) => s.proyectos)
  const tarifas = useTarifas()
  const editarMapa = useSurvey((s) => s.editarMapa)
  const abrirProyecto = useSurvey((s) => s.abrirProyecto)
  const crearAlternativa = useSurvey((s) => s.crearAlternativa)
  const setEnlace = useSurvey((s) => s.setEnlace)
  const conectados = useSurvey((s) => s.conectados)
  const yo = useSurvey((s) => s.yo)
  const [enlace, setEnlaceUrl] = useState(null)
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
    setEnlaceUrl(null)
    fetch(`/api/enlace-inventario/${proyecto.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => vivo && d && setEnlaceUrl(`${window.location.origin}/#/mi-plano?t=${d.token}`))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [proyecto?.id])

  const espacios = useMemo(
    () => (proyecto?.rooms ?? []).map((r) => ({ id: r.id, nombre: r.nombre, m2: r.m2, plano: r.plano, items: r.items ?? {} })),
    [proyecto?.rooms],
  )

  /* La misma regla que Compras y que el enlace del cliente, del mismo módulo:
     tarifa del negocio, luego la corrección vieja del proyecto, luego el
     catálogo; la liga confirmada a mano antes que la encontrada buscando. */
  const ctx = useMemo(() => contextoDe(proyecto, tarifas), [proyecto, tarifas])
  const aparato = useCallback((id) => fichaDe(id, ctx), [ctx])
  const compra = useCallback((id) => compraDe(id, ctx), [ctx])
  const catalogo = useCallback(async () => catalogoDeCompra(ctx), [ctx])

  const familia = useMemo(() => {
    if (!proyecto) return []
    const base = proyecto.base ?? proyecto.id
    return proyectos
      .filter((p) => !p.archivado && (p.id === base || p.base === base))
      // el original primero; las alternativas en el orden en que se crearon
      .sort((a, b) => (a.id === base ? -1 : b.id === base ? 1 : a.folio < b.folio ? -1 : 1))
      .map((p) => ({ id: p.id, nombre: p.nombre, actual: p.id === proyecto.id, total: desembolso(p.rooms, contextoDe(p, tarifas)) }))
  }, [proyectos, proyecto, tarifas])

  if (!proyecto) return null

  const comprasAbiertas = proyecto.enlace?.compras !== false
  const otros = (conectados ?? []).filter((u) => u !== yo)

  const nuevaAlternativa = (que) => {
    const preset = ALTERNATIVAS.find((a) => a.id === que)
    const sugerido = `${proyecto.base ? proyecto.nombre.split(' · ')[0] : proyecto.nombre} · ${preset?.nombre ?? 'alternativa'}`
    const nombre = preset ? sugerido : window.prompt('¿Cómo se va a llamar la alternativa?', sugerido)
    if (nombre === null) return
    crearAlternativa(proyecto.id, { nombre, ajustar: preset?.ajustar })
  }

  return (
    <div ref={raiz} className="-mx-5 -my-6 flex flex-col" style={{ height: `calc(100dvh - ${arriba}px)` }}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Plano aéreo{proyecto.base ? ' · alternativa' : ''}</p>
          <h1 className="display truncate text-[22px] leading-tight text-cream">{proyecto.nombre}</h1>
        </div>
        <select
          value=""
          onChange={(e) => e.target.value && nuevaAlternativa(e.target.value)}
          title="Una copia de este proyecto para ver qué pasa con otra decisión, sin tocar éste"
          className="h-[34px] rounded-lg border border-line bg-ink px-2.5 text-[12.5px] text-cream-2 outline-none hover:border-cream/30 focus:border-ember/60"
        >
          <option value="">Nueva alternativa…</option>
          <option value="copia">Copia de éste, para cambiarla a mano</option>
          {ALTERNATIVAS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setEnlace({ compras: !comprasAbiertas })}
          title={comprasAbiertas ? 'El cliente ve precios, tiendas y ligas, y puede cambiar la lista. Toca para dejarle solo la casa.' : 'El cliente ve solo su casa, sin precios. Toca para abrirle las compras.'}
          className={`h-[34px] rounded-lg border px-3 text-[12.5px] ${comprasAbiertas ? 'border-thread/45 text-thread-2 hover:bg-thread/10' : 'border-line text-cream-3 hover:text-cream'}`}
        >
          {comprasAbiertas ? 'Compras abiertas al cliente' : 'Compras cerradas al cliente'}
        </button>
        <button
          type="button"
          onClick={() => setVerEnlace((v) => !v)}
          className="h-[34px] rounded-lg border border-thread/45 px-3 text-[12.5px] text-thread-2 hover:bg-thread/10"
        >
          {verEnlace ? 'Cerrar' : 'Enlace para el cliente'}
        </button>
      </div>
      {verEnlace && enlace && (
        <div className="border-b border-line px-5 py-3">
          <Compartir
            destino={enlace}
            etiqueta={`Plano · ${proyecto.nombre}`}
            titulo={comprasAbiertas ? 'El plano y las compras de su casa' : 'El plano de su casa'}
            ayuda={
              comprasAbiertas
                ? 'El cliente lo abre en su teléfono, sin cuenta: ve sus espacios, lo que va en cada uno con foto, precio y tienda, y puede acomodarlo, agregar, cambiar o quitar. Lo que mueva llega aquí en vivo, y lo que muevas tú le llega a él. Si hay alternativas, también las ve y compara lo que cuestan.'
                : 'El cliente lo abre en su teléfono, sin cuenta: ve sus espacios y lo que va en cada uno, y puede acomodarlos. Lo que mueva llega aquí en vivo, y lo que muevas tú le llega a él. No ve precios ni tiendas.'
            }
          />
        </div>
      )}
      <div className="min-h-0 flex-1">
        <PlanoAereo
          key={proyecto.id}
          espacios={espacios}
          aparato={aparato}
          compra={compra}
          catalogo={catalogo}
          familia={familia}
          onFamilia={(f) => abrirProyecto(f.id)}
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
