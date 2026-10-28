import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { trazoDe } from '../iconos'
import {
  aPaso,
  bordes,
  COLOR_CAT,
  encimados,
  geometrias,
  ICONO_CAT,
  mapaDe,
  MIN_LADO,
  NOMBRE_CAT,
  piezas,
  r2,
} from './aereo'

/**
 * El plano aéreo de una casa: sus espacios vistos desde arriba, con lo que
 * se va a instalar en cada uno.
 *
 * Se usa en dos lugares con el mismo código: en el panel, donde los socios
 * ven además dónde se compra cada cosa, y en el enlace del cliente, que lo
 * abre en su teléfono sin cuenta. En los dos se edita igual y en los dos se
 * ve en vivo lo que mueve el otro.
 *
 * Qué se puede hacer, y con qué gesto —el mismo en el dedo que en el ratón—:
 *   - arrastrar un espacio lo mueve; sus muros se pegan a los del vecino
 *   - las manijas del espacio escogido le cambian el tamaño
 *   - arrastrar una pieza la acomoda en su espacio, o la lleva a otro
 *   - un dedo en el fondo recorre el plano; dos dedos (o la rueda) acercan
 *
 * Nada se guarda a medio gesto: se guarda al soltar, una vez, con
 * `onCambios`. Cada cambio es de un espacio: `{ cuartoId, plano, items }`
 * —`plano` con solo los campos que cambiaron, `items` con las cantidades
 * nuevas cuando una pieza se fue a otro espacio—.
 *
 * @param espacios   [{ id, nombre, m2, plano, items }]
 * @param aparato    deviceId → { nombre, cat, marca } (o null si no se conoce)
 * @param compra     deviceId → { precio, tienda, url, nota } — solo en el panel
 * @param onCambios  (cambios) => void
 * @param editable   false para solo mirar
 * @param estado     un nodo chico para la barra: "en vivo", "guardando"…
 */

const R = 11 // radio de una pieza, en pixeles de pantalla
const IMAN = 10 // a cuántos pixeles un muro se pega al del vecino
const AGARRE = 26 // el área de agarre de una manija, en pixeles

const dinero = (n) =>
  `$${n.toLocaleString('es-MX', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`
const metros = (n) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function PlanoAereo({ espacios, aparato, compra, onCambios, editable = true, estado }) {
  const caja = useRef(null)
  const lienzo = useRef(null)
  const [tam, setTam] = useState({ w: 0, h: 0 })
  const [vista, setVista] = useState(null) // { x, y, w } en metros
  const [sel, setSel] = useState(null) // { tipo: 'espacio', id } | { tipo: 'pieza', key }
  const [arr, setArr] = useState(null) // lo que se ve mientras se arrastra
  const movil = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  // en el teléfono la hoja empieza recogida: lo primero que se ve es la casa
  const [hoja, setHoja] = useState(() => (movil() ? 'cerrada' : 'media'))
  const refHoja = useRef(null)
  const [hojaAlto, setHojaAlto] = useState(0)
  const [destellos, setDestellos] = useState(() => new Set())
  const drag = useRef(null)
  const dedos = useRef(new Map())
  const propios = useRef(new Map()) // cuartoId → hasta cuándo un cambio es nuestro

  const catDe = useCallback((id) => aparato(id)?.cat ?? 'hubs', [aparato])
  const geoBase = useMemo(() => geometrias(espacios), [espacios])
  const geo = useMemo(() => (arr?.geo ? { ...geoBase, ...arr.geo } : geoBase), [geoBase, arr])
  const ids = useMemo(() => espacios.map((e) => e.id), [espacios])
  const porId = useMemo(() => Object.fromEntries(espacios.map((e) => [e.id, e])), [espacios])
  const listas = useMemo(
    () => Object.fromEntries(espacios.map((e) => [e.id, piezas(e, geo[e.id], catDe)])),
    [espacios, geo, catDe],
  )
  const malos = useMemo(() => encimados(ids, geo), [ids, geo])

  /* ── el tamaño del lienzo y la vista ── */
  useEffect(() => {
    const el = caja.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setTam({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // en el teléfono la hoja tapa la parte de abajo del lienzo: hay que saber cuánto
  useEffect(() => {
    const el = refHoja.current
    if (!el) return
    const ro = new ResizeObserver(() => setHojaAlto(movil() ? el.getBoundingClientRect().height : 0))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ajustar = useCallback(() => {
    if (!tam.w || !tam.h || !ids.length) return
    const b = { l: Infinity, r: -Infinity, t: Infinity, b: -Infinity }
    for (const id of ids) {
      const q = bordes(geoBase[id])
      b.l = Math.min(b.l, q.l)
      b.r = Math.max(b.r, q.r)
      b.t = Math.min(b.t, q.t)
      b.b = Math.max(b.b, q.b)
    }
    /* Se encuadra en lo que de verdad se ve: debajo de la barra de arriba y,
       en el teléfono, encima de la hoja. Centrado en el lienzo entero, la
       recámara quedaba escondida detrás de la lista. */
    const margen = 1.2
    const arriba = 58
    const disp = Math.max(120, tam.h - arriba - hojaAlto)
    const w = Math.max(b.r - b.l + margen * 2, (b.b - b.t + margen * 2) * (tam.w / disp))
    const p = tam.w / w
    setVista({ x: (b.l + b.r) / 2 - w / 2, y: (b.t + b.b) / 2 - (arriba + disp / 2) / p, w })
  }, [tam.w, tam.h, ids, geoBase, hojaAlto])

  // la primera vez que hay medida, todo el departamento a la vista
  useEffect(() => {
    if (!vista && tam.w && tam.h) ajustar()
  }, [vista, tam.w, tam.h, ajustar])

  const ppm = vista && tam.w ? tam.w / vista.w : 40
  const px = (n) => n / ppm

  /* Una pieza se dibuja del mismo tamaño en pantalla acerques o alejes —para
     poder atinarle—, salvo cuando no cabe: en un recibidor con diez piezas,
     de lejos se encimaban unas con otras y tapaban el nombre. Ahí se achican
     a lo que les toca en su cuarto, y crecen otra vez al acercarse. */
  const radioDe = useMemo(() => {
    const m = {}
    for (const e of espacios) {
      const g = geo[e.id]
      const n = listas[e.id].length
      if (!n) continue
      const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt((n * g.ancho) / g.largo))))
      const filas = Math.ceil(n / cols)
      const celda = Math.min(g.ancho / cols, (g.largo * 0.64) / filas)
      m[e.id] = Math.max(Math.min(R / ppm, celda * 0.42), 4.5 / ppm)
    }
    return m
  }, [espacios, geo, listas, ppm])

  /* ── lo que cambia otro, destella ──
     Sin esto, un muro que se movió desde el teléfono del cliente cambia de
     lugar en silencio y nadie lo nota. Lo que cambiamos nosotros no destella:
     ya sabemos que se movió. */
  const previa = useRef(null)
  useEffect(() => {
    const antes = previa.current
    previa.current = geoBase
    if (!antes) return
    const ahora = Date.now()
    const cambiados = ids.filter((id) => {
      const a = antes[id]
      const b = geoBase[id]
      if (!a || !b) return false
      const distinto = a.x !== b.x || a.z !== b.z || a.ancho !== b.ancho || a.largo !== b.largo
      return distinto && !((propios.current.get(id) ?? 0) > ahora)
    })
    if (!cambiados.length) return
    setDestellos(new Set(cambiados))
    const t = setTimeout(() => setDestellos(new Set()), 1400)
    return () => clearTimeout(t)
  }, [geoBase, ids])

  const aMetros = (cx, cy) => {
    const rect = lienzo.current.getBoundingClientRect()
    return { x: vista.x + (cx - rect.left) / ppm, z: vista.y + (cy - rect.top) / ppm }
  }

  const zoom = useCallback(
    (f, cx, cy) => {
      setVista((v) => {
        if (!v || !lienzo.current) return v
        const rect = lienzo.current.getBoundingClientRect()
        const p = rect.width / v.w
        const mx = cx == null ? rect.left + rect.width / 2 : cx
        const my = cy == null ? rect.top + rect.height / 2 : cy
        const enX = v.x + (mx - rect.left) / p
        const enZ = v.y + (my - rect.top) / p
        const w = Math.min(90, Math.max(1.5, v.w / f))
        const q = rect.width / w
        return { x: enX - (mx - rect.left) / q, y: enZ - (my - rect.top) / q, w }
      })
    },
    [],
  )

  // la rueda acerca donde está el ratón; no se puede registrar pasiva
  useEffect(() => {
    const el = lienzo.current
    if (!el) return
    const rueda = (ev) => {
      ev.preventDefault()
      zoom(Math.exp(-ev.deltaY * 0.0016), ev.clientX, ev.clientY)
    }
    el.addEventListener('wheel', rueda, { passive: false })
    return () => el.removeEventListener('wheel', rueda)
  }, [zoom])

  /* ── los gestos ── */
  const piezaPorKey = (key) => {
    const [cuartoId] = key.split('|')
    const p = listas[cuartoId]?.find((x) => x.key === key)
    if (!p) return null
    const g = geo[cuartoId]
    const m = (radioDe[cuartoId] ?? px(R)) + 0.02
    const mx = Math.max(0, g.ancho / 2 - m)
    const mz = Math.max(0, g.largo / 2 - m)
    return {
      ...p,
      x: g.x + Math.max(-mx, Math.min(mx, p.dx)),
      z: g.z + Math.max(-mz, Math.min(mz, p.dz)),
      fuera: Math.abs(p.dx) > g.ancho / 2 || Math.abs(p.dz) > g.largo / 2,
    }
  }
  const espacioEn = (x, z) => {
    for (let i = ids.length - 1; i >= 0; i--) {
      const q = bordes(geo[ids[i]])
      if (x >= q.l && x <= q.r && z >= q.t && z <= q.b) return ids[i]
    }
    return null
  }
  const murosDeOtros = (id) => {
    const xs = []
    const zs = []
    for (const o of ids) {
      if (o === id) continue
      const q = bordes(geoBase[o])
      xs.push(q.l, q.r)
      zs.push(q.t, q.b)
    }
    return { xs, zs }
  }
  const iman = (v, lista, tol) => {
    let mejor = null
    for (const o of lista) {
      const d = o - v
      if (Math.abs(d) <= tol && (mejor === null || Math.abs(d) < Math.abs(mejor))) mejor = d
    }
    return mejor
  }

  /* Los espacios que se acomodaban solos se quedan quietos al primer cambio
     de cualquiera: su lugar se calculaba a partir de los demás, y mover la
     zotehuela hacía brincar a la zona de cafetera sin que nadie la tocara. */
  const confirmar = (cambios) => {
    const tocados = new Set(cambios.map((c) => c.cuartoId))
    const fijar = ids
      .filter((id) => geoBase[id]?.auto && !tocados.has(id))
      .map((id) => ({ cuartoId: id, plano: { pos: [geoBase[id].x, geoBase[id].z], ancho: geoBase[id].ancho, largo: geoBase[id].largo } }))
    const todos = cambios.map((c) =>
      geoBase[c.cuartoId]?.auto && !c.plano?.pos
        ? { ...c, plano: { pos: [geoBase[c.cuartoId].x, geoBase[c.cuartoId].z], ancho: geoBase[c.cuartoId].ancho, largo: geoBase[c.cuartoId].largo, ...(c.plano ?? {}) } }
        : c,
    )
    const hasta = Date.now() + 2500
    for (const c of [...todos, ...fijar]) propios.current.set(c.cuartoId, hasta)
    onCambios?.([...todos, ...fijar])
  }

  const abajo = (ev) => {
    if (!vista) return
    if (ev.pointerType === 'mouse' && ev.button !== 0) return
    dedos.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    if (dedos.current.size === 2) {
      const [a, b] = [...dedos.current.values()]
      drag.current = { modo: 'pellizco', d: Math.hypot(a.x - b.x, a.y - b.y) }
      setArr(null)
      return
    }
    lienzo.current.setPointerCapture?.(ev.pointerId)
    const k = ev.target.closest?.('[data-k]')?.dataset.k ?? ''
    const p = aMetros(ev.clientX, ev.clientY)
    const c0 = { x: ev.clientX, y: ev.clientY }
    if (editable && k.startsWith('h:') && sel?.tipo === 'espacio') {
      drag.current = { modo: 'tam', id: sel.id, dir: k.slice(2), ini: { ...geoBase[sel.id] }, c0, movio: false }
    } else if (k.startsWith('p:')) {
      const pz = piezaPorKey(k.slice(2))
      drag.current = pz
        ? { modo: editable ? 'pieza' : 'toque', key: pz.key, off: { x: pz.x - p.x, z: pz.z - p.z }, c0, movio: false }
        : null
    } else if (k.startsWith('e:')) {
      const id = k.slice(2)
      /* Con el dedo, un cuarto se escoge antes de moverlo. Si no, recorrer el
         plano —que es lo que más se hace en un teléfono— movía el cuarto que
         estuviera debajo del dedo, y casi todo el plano es cuartos. */
      const yaEscogido = sel?.tipo === 'espacio' && sel.id === id
      drag.current =
        ev.pointerType === 'touch' && !yaEscogido
          ? { modo: 'recorrer', v0: { ...vista }, c0, movio: false, toca: id }
          : { modo: editable ? 'espacio' : 'toque', id, p0: p, ini: { ...geoBase[id] }, c0, movio: false }
    } else {
      drag.current = { modo: 'recorrer', v0: { ...vista }, c0, movio: false }
    }
  }

  const mueve = (ev) => {
    if (dedos.current.has(ev.pointerId)) dedos.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    const d = drag.current
    if (!d) return
    if (d.modo === 'pellizco') {
      if (dedos.current.size < 2) return
      const [a, b] = [...dedos.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (d.d > 0) zoom(dist / d.d, (a.x + b.x) / 2, (a.y + b.y) / 2)
      d.d = dist
      return
    }
    if (!d.movio && Math.hypot(ev.clientX - d.c0.x, ev.clientY - d.c0.y) < 4) return
    d.movio = true
    if (d.modo === 'toque') return
    const p = aMetros(ev.clientX, ev.clientY)
    const tol = IMAN / ppm

    if (d.modo === 'recorrer') {
      setVista({ ...d.v0, x: d.v0.x - (ev.clientX - d.c0.x) / ppm, y: d.v0.y - (ev.clientY - d.c0.y) / ppm })
      return
    }
    if (d.modo === 'espacio') {
      const g = d.ini
      const nx = g.x + (p.x - d.p0.x)
      const nz = g.z + (p.z - d.p0.z)
      const o = murosDeOtros(d.id)
      // que los muros se peguen a los muros del vecino antes que a la rejilla
      let ix = null
      let gx = null
      for (const b of [nx - g.ancho / 2, nx + g.ancho / 2]) {
        const dd = iman(b, o.xs, tol)
        if (dd !== null && (ix === null || Math.abs(dd) < Math.abs(ix))) {
          ix = dd
          gx = b + dd
        }
      }
      let iz = null
      let gz = null
      for (const b of [nz - g.largo / 2, nz + g.largo / 2]) {
        const dd = iman(b, o.zs, tol)
        if (dd !== null && (iz === null || Math.abs(dd) < Math.abs(iz))) {
          iz = dd
          gz = b + dd
        }
      }
      const x = ix !== null ? r2(nx + ix) : aPaso(nx)
      const z = iz !== null ? r2(nz + iz) : aPaso(nz)
      setArr({ geo: { [d.id]: { ...g, x, z } }, guias: { x: gx, z: gz } })
      return
    }
    if (d.modo === 'tam') {
      const q = bordes(d.ini)
      const o = murosDeOtros(d.id)
      const guias = { x: null, z: null }
      const pega = (v, lista, eje) => {
        const dd = iman(v, lista, tol)
        if (dd === null) return aPaso(v)
        guias[eje] = r2(v + dd)
        return r2(v + dd)
      }
      if (d.dir.includes('w')) q.l = Math.min(pega(p.x, o.xs, 'x'), q.r - MIN_LADO)
      if (d.dir.includes('e')) q.r = Math.max(pega(p.x, o.xs, 'x'), q.l + MIN_LADO)
      if (d.dir.includes('n')) q.t = Math.min(pega(p.z, o.zs, 'z'), q.b - MIN_LADO)
      if (d.dir.includes('s')) q.b = Math.max(pega(p.z, o.zs, 'z'), q.t + MIN_LADO)
      setArr({
        geo: { [d.id]: { ...d.ini, ancho: r2(q.r - q.l), largo: r2(q.b - q.t), x: r2((q.l + q.r) / 2), z: r2((q.t + q.b) / 2) } },
        guias,
      })
      return
    }
    if (d.modo === 'pieza') {
      const x = aPaso(p.x + d.off.x)
      const z = aPaso(p.z + d.off.z)
      setArr({ pieza: { key: d.key, x, z, sobre: espacioEn(x, z) } })
    }
  }

  const suelta = (ev) => {
    dedos.current.delete(ev.pointerId)
    const d = drag.current
    if (d?.modo === 'pellizco') {
      if (dedos.current.size < 2) drag.current = null
      return
    }
    drag.current = null
    const fin = arr
    setArr(null)
    if (!d) return
    if (!d.movio) {
      if (d.modo === 'recorrer') {
        if (d.toca) elegir({ tipo: 'espacio', id: d.toca })
        else setSel(null)
      }
      else if (d.modo === 'espacio' || (d.modo === 'toque' && d.id)) elegir({ tipo: 'espacio', id: d.id })
      else if (d.modo === 'pieza' || (d.modo === 'toque' && d.key)) elegir({ tipo: 'pieza', key: d.key })
      return
    }
    if ((d.modo === 'espacio' || d.modo === 'tam') && fin?.geo?.[d.id]) {
      const g = fin.geo[d.id]
      const plano = { pos: [g.x, g.z], ancho: g.ancho, largo: g.largo }
      // al cambiar de tamaño, las piezas que se acomodaban solas se quedan donde estaban
      if (d.modo === 'tam' && listas[d.id]?.some((x) => x.auto)) plano.mapa = mapaDe(listas[d.id])
      confirmar([{ cuartoId: d.id, plano }])
      setSel({ tipo: 'espacio', id: d.id })
      return
    }
    if (d.modo === 'pieza' && fin?.pieza) moverPieza(d.key, fin.pieza.sobre, fin.pieza.x, fin.pieza.z)
  }

  /* Llevar una pieza a donde se soltó. En su mismo espacio solo se reacomoda;
     en otro, sale de la cuenta de uno y entra en la del otro —el
     levantamiento cambia con el plano, que es lo que se pidió: si el foco
     estaba en el cuarto equivocado, la lista de compras de cada cuarto
     también estaba equivocada—. */
  const moverPieza = (key, destino, x, z) => {
    const [desde, deviceId] = key.split('|')
    const pz = listas[desde]?.find((p) => p.key === key)
    if (!pz || !destino) {
      setSel({ tipo: 'pieza', key })
      return
    }
    const gD = geo[destino]
    if (destino === desde) {
      const lista = listas[desde].map((p) => (p.key === key ? { ...p, dx: r2(x - gD.x), dz: r2(z - gD.z) } : p))
      confirmar([{ cuartoId: desde, plano: { mapa: mapaDe(lista) } }])
      setSel({ tipo: 'pieza', key })
      return
    }
    // de donde sale: las demás piezas del mismo aparato se recorren un lugar
    let n = 0
    const quedan = listas[desde]
      .filter((p) => p.key !== key)
      .map((p) => (p.deviceId === deviceId ? { ...p, i: n++ } : p))
    const yaHay = (porId[destino].items?.[deviceId] ?? 0)
    const llega = { deviceId, i: yaHay, dx: r2(x - gD.x), dz: r2(z - gD.z) }
    const enDestino = [...listas[destino], llega]
    confirmar([
      { cuartoId: desde, plano: { mapa: mapaDe(quedan) }, items: { [deviceId]: (porId[desde].items?.[deviceId] ?? 1) - 1 } },
      { cuartoId: destino, plano: { mapa: mapaDe(enDestino) }, items: { [deviceId]: yaHay + 1 } },
    ])
    setSel({ tipo: 'pieza', key: `${destino}|${deviceId}|${yaHay}` })
  }

  const elegir = (s) => {
    setSel(s)
    setHoja((h) => (h === 'cerrada' ? 'media' : h))
  }

  // las flechas acomodan el último centímetro: 5 cm, o 25 con Shift
  useEffect(() => {
    const tecla = (ev) => {
      if (!sel || /INPUT|SELECT|TEXTAREA/.test(ev.target?.tagName ?? '')) return
      if (ev.key === 'Escape') return setSel(null)
      const dx = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0
      const dz = ev.key === 'ArrowDown' ? 1 : ev.key === 'ArrowUp' ? -1 : 0
      if ((!dx && !dz) || !editable) return
      ev.preventDefault()
      const paso = ev.shiftKey ? 0.25 : 0.05
      if (sel.tipo === 'espacio') {
        const g = geoBase[sel.id]
        confirmar([{ cuartoId: sel.id, plano: { pos: [r2(g.x + dx * paso), r2(g.z + dz * paso)], ancho: g.ancho, largo: g.largo } }])
      } else {
        const pz = piezaPorKey(sel.key)
        if (pz) moverPieza(sel.key, pz.cuartoId, r2(pz.x + dx * paso), r2(pz.z + dz * paso))
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  /* ── pintar ── */
  const vb = vista ? [vista.x, vista.y, vista.w, vista.w * (tam.h / (tam.w || 1))] : [0, 0, 10, 10]
  const rejilla = useMemo(() => {
    if (!vista || !tam.w) return ''
    const h = vista.w * (tam.h / tam.w)
    let d = ''
    for (let x = Math.floor(vista.x); x <= vista.x + vista.w; x++) d += `M${x} ${vista.y}V${vista.y + h}`
    for (let z = Math.floor(vista.y); z <= vista.y + h; z++) d += `M${vista.x} ${z}H${vista.x + vista.w}`
    return d
  }, [vista, tam.w, tam.h])

  const seleccionado = sel?.tipo === 'espacio' ? geo[sel.id] : null
  const piezaSel = sel?.tipo === 'pieza' ? piezaPorKey(sel.key) : null
  const destino = arr?.pieza?.sobre ?? null
  const totalPiezas = espacios.reduce((t, e) => t + Object.values(e.items ?? {}).reduce((a, q) => a + Math.max(0, q), 0), 0)

  return (
    <div className="relative flex h-full min-h-0 flex-col md:flex-row">
      <div ref={caja} className="relative min-h-0 flex-1 overflow-hidden bg-[#0a0e17]">
        <svg
          ref={lienzo}
          viewBox={vb.join(' ')}
          className={`block h-full w-full touch-none select-none ${drag.current?.modo === 'recorrer' ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={abajo}
          onPointerMove={mueve}
          onPointerUp={suelta}
          onPointerCancel={suelta}
          role="application"
          aria-label="Plano editable de los espacios"
        >
          <path d={rejilla} fill="none" stroke="#18213a" strokeWidth="1" vectorEffect="non-scaling-stroke" />

          {/* las guías: el muro que se acaba de pegar al del vecino */}
          {arr?.guias?.x != null && (
            <line x1={arr.guias.x} y1={vb[1]} x2={arr.guias.x} y2={vb[1] + vb[3]} stroke="#5eead4" strokeWidth="1.5" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
          )}
          {arr?.guias?.z != null && (
            <line x1={vb[0]} y1={arr.guias.z} x2={vb[0] + vb[2]} y2={arr.guias.z} stroke="#5eead4" strokeWidth="1.5" strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
          )}

          {espacios.map((e) => {
            const g = geo[e.id]
            const q = bordes(g)
            const es = sel?.tipo === 'espacio' && sel.id === e.id
            const n = Object.values(e.items ?? {}).reduce((a, x) => a + Math.max(0, x), 0)
            // lo que cabe a lo ancho del cuarto, en pantalla
            const anchoPx = g.ancho * ppm
            const altoPx = g.largo * ppm
            const caben = Math.max(3, Math.floor((anchoPx - 18) / 7.6))
            const nombre = e.nombre.length > caben ? `${e.nombre.slice(0, caben - 1)}…` : e.nombre
            const medida = anchoPx > 170 ? `${metros(g.ancho)} × ${metros(g.largo)} m · ${n} ${n === 1 ? 'pieza' : 'piezas'}` : anchoPx > 72 ? `${n} ${n === 1 ? 'pieza' : 'piezas'}` : ''
            return (
              <g key={e.id} data-k={`e:${e.id}`} className={editable ? 'cursor-move' : 'cursor-pointer'}>
                <rect
                  x={q.l}
                  y={q.t}
                  width={g.ancho}
                  height={g.largo}
                  rx={px(4)}
                  fill={destino === e.id ? '#11302d' : es ? '#121c30' : '#0f1523'}
                  stroke={malos[e.id] ? '#ff7a6b' : es ? '#4d9fff' : destellos.has(e.id) ? '#5eead4' : '#9aa8c2'}
                  strokeWidth={es ? 3 : 2.5}
                  strokeDasharray={malos[e.id] ? '8 5' : undefined}
                  vectorEffect="non-scaling-stroke"
                  className={destellos.has(e.id) ? 'plano-destello' : undefined}
                />
                {altoPx > 24 && (
                  <text x={q.l + px(10)} y={q.t + px(20)} fontSize={px(13)} fill="#eef3fb" fontWeight="600" pointerEvents="none" stroke="#0f1523" strokeWidth={px(3)} paintOrder="stroke">
                    {nombre}
                  </text>
                )}
                {medida && altoPx * 0.36 >= 40 && (
                  <text x={q.l + px(10)} y={q.t + px(35)} fontSize={px(11)} fill="#8896ac" pointerEvents="none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {medida}
                  </text>
                )}
              </g>
            )
          })}

          {/* las cotas y las manijas del espacio escogido */}
          {seleccionado && (
            <Cotas g={seleccionado} px={px} />
          )}

          {espacios.flatMap((e) =>
            listas[e.id].map((p) => {
              const enMano = arr?.pieza?.key === p.key
              const pos = enMano ? { x: arr.pieza.x, z: arr.pieza.z, fuera: false } : piezaPorKey(p.key)
              if (!pos) return null
              const cat = catDe(p.deviceId)
              const color = COLOR_CAT[cat] ?? '#c2ccdd'
              const es = sel?.tipo === 'pieza' && sel.key === p.key
              const r = enMano ? px(R + 2) : (radioDe[e.id] ?? px(R))
              const ic = r * 1.18
              return (
                <g key={p.key} data-k={`p:${p.key}`} className={editable ? 'cursor-grab' : 'cursor-pointer'}>
                  {/* un área de agarre más grande que lo que se ve: un dedo no atina a 22 px */}
                  <circle cx={pos.x} cy={pos.z} r={Math.max(r, px(R + 6))} fill="transparent" />
                  {(es || enMano) && <circle cx={pos.x} cy={pos.z} r={r + px(5)} fill="none" stroke="#4d9fff" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />}
                  <circle
                    cx={pos.x}
                    cy={pos.z}
                    r={r}
                    fill={color}
                    stroke={pos.fuera ? '#ff7a6b' : '#0a0e17'}
                    strokeWidth="2"
                    strokeDasharray={pos.fuera ? '3 2' : undefined}
                    vectorEffect="non-scaling-stroke"
                    style={enMano ? { filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.5))' } : undefined}
                  />
                  <svg x={pos.x - ic / 2} y={pos.z - ic / 2} width={ic} height={ic} viewBox="0 0 24 24" pointerEvents="none">
                    <path d={trazoDe(ICONO_CAT[cat] ?? cat)} fill="none" stroke="#0a0e17" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <title>{aparato(p.deviceId)?.nombre ?? p.deviceId}</title>
                </g>
              )
            }),
          )}

          {seleccionado && editable && <Manijas g={seleccionado} px={px} />}
        </svg>

        {/* los controles del lienzo */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-line/80 bg-ink/85 px-3 py-1.5 text-[11.5px] text-cream-3 backdrop-blur">
            <svg width="12" height="15" viewBox="0 0 14 18" aria-hidden="true">
              <path d="M7 1 12 13 7 10 2 13z" fill="currentColor" />
            </svg>
            <span>Norte</span>
            {estado}
          </div>
          <div className="pointer-events-auto flex gap-1.5">
            {[
              ['−', 'Alejar', () => zoom(0.8)],
              ['+', 'Acercar', () => zoom(1.25)],
            ].map(([t, label, f]) => (
              <button
                key={label}
                type="button"
                onClick={f}
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-xl border border-line/80 bg-ink/85 text-[17px] text-cream backdrop-blur hover:border-ember/60"
              >
                {t}
              </button>
            ))}
            <button
              type="button"
              onClick={ajustar}
              className="h-9 rounded-xl border border-line/80 bg-ink/85 px-3 text-[12.5px] text-cream backdrop-blur hover:border-ember/60"
            >
              Ver todo
            </button>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 hidden items-center gap-1.5 text-[11px] text-cream-3 md:flex">
          <span className="block h-1.5 border-x border-b border-cream-3" style={{ width: ppm }} />1 m
        </div>
      </div>

      <Hoja
        refHoja={refHoja}
        hoja={hoja}
        setHoja={setHoja}
        espacios={espacios}
        geo={geo}
        malos={malos}
        sel={sel}
        piezaSel={piezaSel}
        aparato={aparato}
        compra={compra}
        editable={editable}
        totalPiezas={totalPiezas}
        onElegir={(s) => {
          elegir(s)
          if (s?.tipo === 'espacio' && vista) {
            // centrar el espacio que se escogió de la lista
            const g = geoBase[s.id]
            setVista((v) => ({ ...v, x: g.x - v.w / 2, y: g.z - (v.w * (tam.h / tam.w)) / 2 }))
          }
        }}
        onMedidas={(id, cambio) => {
          const g = geoBase[id]
          confirmar([{ cuartoId: id, plano: { pos: [g.x, g.z], ancho: g.ancho, largo: g.largo, ...cambio } }])
        }}
        onMover={(key, destino) => {
          const gD = geoBase[destino]
          moverPieza(key, destino, r2(gD.x), r2(gD.z + gD.largo * 0.15))
        }}
      />
    </div>
  )
}

/* ── las cotas: el ancho arriba y el largo a la izquierda, por fuera ── */
function Cotas({ g, px }) {
  const q = bordes(g)
  const sep = px(18)
  return (
    <g pointerEvents="none">
      <line x1={q.l} y1={q.t - sep} x2={q.r} y2={q.t - sep} stroke="#4d9fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <text x={g.x} y={q.t - sep - px(6)} fontSize={px(12)} fill="#6aaeff" fontWeight="600" textAnchor="middle" stroke="#0a0e17" strokeWidth={px(4)} paintOrder="stroke" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {metros(g.ancho)} m
      </text>
      <line x1={q.l - sep} y1={q.t} x2={q.l - sep} y2={q.b} stroke="#4d9fff" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <text
        x={q.l - sep - px(6)}
        y={g.z}
        fontSize={px(12)}
        fill="#6aaeff"
        fontWeight="600"
        textAnchor="middle"
        stroke="#0a0e17"
        strokeWidth={px(4)}
        paintOrder="stroke"
        transform={`rotate(-90 ${q.l - sep - px(6)} ${g.z})`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {metros(g.largo)} m
      </text>
    </g>
  )
}

/* ── las manijas: esquinas y lados, con un área de agarre para el dedo ── */
const CURSOR = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' }
function Manijas({ g, px }) {
  const q = bordes(g)
  const pts = { nw: [q.l, q.t], n: [g.x, q.t], ne: [q.r, q.t], e: [q.r, g.z], se: [q.r, q.b], s: [g.x, q.b], sw: [q.l, q.b], w: [q.l, g.z] }
  const t = px(11)
  const a = px(AGARRE)
  return (
    <g>
      {Object.entries(pts).map(([k, [x, z]]) => (
        <g key={k} data-k={`h:${k}`} style={{ cursor: CURSOR[k] }}>
          <rect x={x - a / 2} y={z - a / 2} width={a} height={a} fill="transparent" />
          <rect x={x - t / 2} y={z - t / 2} width={t} height={t} rx={px(2.5)} fill="#0f1420" stroke="#4d9fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </g>
  )
}

/* ── la hoja: el resumen, un espacio o una pieza ──
   En el teléfono sube desde abajo y tiene tres alturas; en la computadora es
   una columna a la derecha. Lo que dice es lo mismo. */
function Hoja({ refHoja, hoja, setHoja, espacios, geo, malos, sel, piezaSel, aparato, compra, editable, totalPiezas, onElegir, onMedidas, onMover }) {
  const porId = Object.fromEntries(espacios.map((e) => [e.id, e]))
  const alto = hoja === 'cerrada' ? 'max-md:h-[64px]' : hoja === 'media' ? 'max-md:h-[44%]' : 'max-md:h-[82%]'
  const siguiente = { cerrada: 'media', media: 'abierta', abierta: 'cerrada' }[hoja]

  const lineas = (items) =>
    Object.entries(items ?? {})
      .filter(([, q]) => q > 0)
      .map(([id, q]) => ({ id, q, ap: aparato(id), c: compra?.(id) ?? null }))
      .sort((a, b) => (a.ap?.cat ?? '').localeCompare(b.ap?.cat ?? '') || (a.ap?.nombre ?? '').localeCompare(b.ap?.nombre ?? ''))
  const subtotal = (ls) => ls.reduce((t, l) => t + (l.c?.precio ?? 0) * l.q, 0)

  let titulo
  let cuerpo
  if (sel?.tipo === 'espacio' && porId[sel.id]) {
    const e = porId[sel.id]
    const g = geo[sel.id]
    const ls = lineas(e.items)
    titulo = e.nombre
    cuerpo = (
      <>
        {editable && (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
            <CampoMedida key={`a-${sel.id}-${g.ancho}`} etiqueta="Ancho" valor={g.ancho} onListo={(v) => onMedidas(sel.id, { ancho: v })} />
            <CampoMedida key={`l-${sel.id}-${g.largo}`} etiqueta="Largo" valor={g.largo} onListo={(v) => onMedidas(sel.id, { largo: v })} />
            <button
              type="button"
              onClick={() => onMedidas(sel.id, { ancho: g.largo, largo: g.ancho })}
              title="Girar: intercambia el ancho y el largo"
              className="h-[38px] rounded-lg border border-line px-2.5 text-[12px] text-cream-2 hover:border-ember/60 hover:text-cream"
            >
              Girar
            </button>
          </div>
        )}
        <p className="text-[12px] text-cream-3 tabular-nums">
          {metros(g.ancho * g.largo)} m² en el plano{e.m2 ? ` · ${e.m2} m² en el levantamiento` : ''}
        </p>
        {malos[sel.id] && (
          <p className="text-[12px] text-red-300">
            Se encima con {malos[sel.id].map((m) => `${porId[m.con]?.nombre} (${metros(m.cuanto)} m)`).join(' y ')}.
          </p>
        )}
        <p className="text-[10.5px] tracking-[0.12em] text-cream-3 uppercase">{compra ? 'Lista de compras de este espacio' : 'Lo que se instala aquí'}</p>
        {ls.length ? (
          <ul className="space-y-2.5">
            {ls.map((l) => (
              <Linea key={l.id} l={l} />
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] text-cream-3">Nada todavía. {editable ? 'Arrastra aquí una pieza desde otro espacio.' : ''}</p>
        )}
        {compra && ls.length > 0 && (
          <p className="flex justify-between border-t border-line pt-2.5 text-[13.5px] font-semibold text-cream tabular-nums">
            <span>Subtotal</span>
            <span>{dinero(Math.round(subtotal(ls) * 100) / 100)}</span>
          </p>
        )}
      </>
    )
  } else if (sel?.tipo === 'pieza' && piezaSel) {
    const ap = aparato(piezaSel.deviceId)
    const c = compra?.(piezaSel.deviceId)
    titulo = ap?.nombre ?? piezaSel.deviceId
    cuerpo = (
      <>
        <ul>
          <Linea l={{ id: piezaSel.deviceId, q: 1, ap, c }} />
        </ul>
        {editable ? (
          <label className="grid gap-1.5 text-[12px] text-cream-3">
            Está en
            <select
              value={piezaSel.cuartoId}
              onChange={(e) => onMover(piezaSel.key, e.target.value)}
              className="rounded-lg border border-line bg-ink px-2.5 py-2 text-[14px] text-cream outline-none focus:border-ember/60"
            >
              {espacios.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-[12.5px] text-cream-3">En {porId[piezaSel.cuartoId]?.nombre}.</p>
        )}
        <button type="button" onClick={() => onElegir({ tipo: 'espacio', id: piezaSel.cuartoId })} className="justify-self-start text-[12.5px] text-ember-2 hover:underline">
          Ver todo lo de {porId[piezaSel.cuartoId]?.nombre} →
        </button>
      </>
    )
  } else {
    titulo = 'Todos los espacios'
    const todos = espacios.map((e) => ({ e, ls: lineas(e.items) }))
    const total = todos.reduce((t, x) => t + subtotal(x.ls), 0)
    cuerpo = (
      <>
        <p className="text-[12.5px] leading-snug text-cream-2">
          {espacios.length} espacios · {totalPiezas} piezas{compra ? ` · ${dinero(Math.round(total))} a precio de lista` : ''}.{' '}
          {editable ? 'Toca un espacio para ver lo suyo; arrastra una pieza para llevarla a donde va.' : 'Toca un espacio para ver lo que se instala en él.'}
        </p>
        <ul className="-mx-2 space-y-0.5">
          {todos.map(({ e, ls }) => {
            const n = ls.reduce((t, l) => t + l.q, 0)
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onElegir({ tipo: 'espacio', id: e.id })}
                  className="grid w-full grid-cols-[1fr_auto] gap-x-3 rounded-lg px-2 py-2 text-left hover:bg-cream/[0.05]"
                >
                  <span className="text-[13.5px] font-medium text-cream">{e.nombre}</span>
                  {compra && <span className="text-[13px] text-cream-2 tabular-nums">{dinero(Math.round(subtotal(ls)))}</span>}
                  <span className="col-span-2 flex gap-1 pt-1">
                    {ls.map((l) => (
                      <span key={l.id} className="h-2 w-2 rounded-full" style={{ background: COLOR_CAT[l.ap?.cat] ?? '#c2ccdd' }} title={l.ap?.nombre} />
                    ))}
                    <span className="ml-1 text-[11.5px] leading-none text-cream-3">
                      {n} {n === 1 ? 'pieza' : 'piezas'}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <Leyenda espacios={espacios} aparato={aparato} />
      </>
    )
  }

  return (
    <aside
      ref={refHoja}
      className={`z-10 flex min-h-0 flex-col border-line bg-ink-2 max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:rounded-t-2xl max-md:border-t max-md:shadow-[0_-18px_40px_-18px_rgba(0,0,0,0.8)] max-md:transition-[height] max-md:duration-300 md:w-[23rem] md:border-l ${alto}`}
    >
      <button
        type="button"
        onClick={() => setHoja(siguiente)}
        className="flex shrink-0 items-center gap-3 px-4 pt-2 pb-2.5 text-left md:pointer-events-none md:pt-4"
        aria-label={hoja === 'abierta' ? 'Bajar la hoja' : 'Subir la hoja'}
      >
        <span className="min-w-0 flex-1">
          <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-cream/20 md:hidden" />
          <span className="block text-[10px] tracking-[0.14em] text-cream-3 uppercase">
            {sel?.tipo === 'espacio' ? 'Espacio' : sel?.tipo === 'pieza' ? 'Pieza' : 'El plano'}
          </span>
          <span className="display block truncate text-[20px] leading-tight text-cream">{titulo}</span>
        </span>
      </button>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] content-start gap-3.5 overflow-y-auto px-4 pb-6">{cuerpo}</div>
    </aside>
  )
}

function Linea({ l }) {
  const cat = l.ap?.cat ?? 'hubs'
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-start gap-x-2.5 gap-y-0.5">
      <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full" style={{ background: COLOR_CAT[cat] ?? '#c2ccdd' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
          <path d={trazoDe(ICONO_CAT[cat] ?? cat)} fill="none" stroke="#0a0e17" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0 text-[13.5px] leading-snug font-medium text-cream">
        {l.ap?.nombre ?? l.id}
        {l.q > 1 && <span className="text-cream-3"> × {l.q}</span>}
      </span>
      {l.c?.precio != null ? (
        <span className="text-[13px] font-semibold whitespace-nowrap text-cream tabular-nums">{dinero(Math.round(l.c.precio * l.q * 100) / 100)}</span>
      ) : (
        <span />
      )}
      {(l.c || l.ap?.marca) && (
        <span className="col-span-2 col-start-2 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11.5px] text-cream-3">
          {l.c?.tienda && <span className="font-semibold text-thread-2">{l.c.tienda}</span>}
          {l.c?.precio != null && l.q > 1 && <span className="tabular-nums">{dinero(l.c.precio)} c/u</span>}
          {!l.c && l.ap?.marca && <span>{l.ap.marca}</span>}
          {l.c?.url && (
            <a href={l.c.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-cream-2 hover:text-cream">
              abrir ↗
            </a>
          )}
        </span>
      )}
      {l.c?.nota && <span className="col-span-2 col-start-2 text-[11.5px] leading-snug text-ember-2">{l.c.nota}</span>}
    </li>
  )
}

function Leyenda({ espacios, aparato }) {
  const cats = new Set()
  for (const e of espacios) for (const [id, q] of Object.entries(e.items ?? {})) if (q > 0) cats.add(aparato(id)?.cat ?? 'hubs')
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 border-t border-line pt-3 text-[11.5px] text-cream-3">
      {[...cats].map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_CAT[c] ?? '#c2ccdd' }} />
          {NOMBRE_CAT[c] ?? c}
        </span>
      ))}
    </div>
  )
}

function CampoMedida({ etiqueta, valor, onListo }) {
  const [v, setV] = useState(String(valor))
  const listo = () => {
    const n = Number(String(v).replace(',', '.'))
    if (Number.isFinite(n) && n >= MIN_LADO && Math.abs(n - valor) > 0.001) onListo(r2(n))
    else setV(String(valor))
  }
  return (
    <label className="grid min-w-0 gap-1 text-[11.5px] text-cream-3">
      {etiqueta} (m)
      <input
        type="text"
        inputMode="decimal"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={listo}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="h-[38px] w-full min-w-0 rounded-lg border border-line bg-ink px-2.5 text-[14px] text-cream tabular-nums outline-none focus:border-ember/60"
      />
    </label>
  )
}
