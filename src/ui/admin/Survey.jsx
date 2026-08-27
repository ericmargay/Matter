import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { CATEGORIES, DEVICE_BY_ID } from '../../content/catalog'
import {
  FORMAS_PAGO,
  LABOR_TIERS,
  METODOS_PAGO,
  REGIMENES,
  USOS_CFDI,
  laborTier,
  networkCheck,
  quote,
  unitPrice,
} from '../../content/pricing'
import { nuevoFolio, paramsDelHash, useProyecto, useSurvey } from '../../store/survey'
import { planoVacio } from '../../sync/eventos'
import { ACOMODOS } from '../../content/instalacion'
import { tipoPorNombre } from './plano/catalogo'
import { disponerCuarto, disponerPlanta } from './plano/disponer'
import { ESPACIOS, PROPIEDADES, espaciosDe } from '../../content/espacios'
import { revisarCompatibilidad } from '../../content/inventario'
import Firmware from './Firmware'
import Inventario from '../Inventario'
import Compartir from './Compartir'
import { buildQuotePayload, encodeQuote } from '../../content/quoteLink'
import { CLAVE_PROD_SERV, CLAVE_UNIDAD } from '../../content/fiscal'
import DevicePhoto, { PhotoFrame } from '../catalog/DevicePhoto'
import Historial, { HistorialSeccion } from './Historial'
import RoomPicker from './RoomPicker'

const PlanoCuarto = lazy(() => import('./plano/PlanoCuarto'))
const Conjunto = lazy(() => import('./plano/Conjunto'))

/**
 * Levantamiento.
 *
 * Un levantamiento no es una lista de compras: es cuartos con metros,
 * dispositivos repartidos entre ellos y una revisión de si la red aguanta.
 * De ahí sale la cotización, no al revés.
 *
 * Vive siempre dentro de un proyecto; quien decide que haya uno abierto es
 * `Admin`, así que aquí se puede dar por hecho.
 */

const money = (n) => `$${Math.round(n).toLocaleString('es-MX')}`

function Field({ label, hint, children, wide }) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-[10px] tracking-[0.12em] text-cream-3 uppercase">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10.5px] text-cream-3">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-[13px] text-cream outline-none placeholder:text-cream-3/60 focus:border-ember/60'

function Input(props) {
  return <input {...props} className={inputCls} />
}

function Picker({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/**
 * Cada tarjeta lleva colgado el historial de SU sección.
 *
 * Puesto en el encabezado y no en una pantalla aparte por una razón práctica:
 * la pregunta que uno se hace es "¿quién me movió esto?", y se la hace mirando
 * el dato que le extrañó, no navegando a una bitácora general.
 */
function Card({ title, right, children, seccion, proyectoId }) {
  return (
    <section className="rounded-xl border border-line bg-ink-2">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 className="text-[11px] tracking-[0.14em] text-cream-2 uppercase">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {right}
          {seccion && <HistorialSeccion proyectoId={proyectoId} seccion={seccion} />}
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

/* ── menú de espacios ─────────────────────────────────────────────
   La lista sale del tipo de propiedad: en una oficina nadie levanta una
   recámara, y ofrecérsela es ruido en la pantalla justo cuando se está de
   pie en casa del cliente. */

function MenuEspacios({ propiedad, onElegir, onCerrar }) {
  const [q, setQ] = useState('')
  const sugeridos = espaciosDe(propiedad)

  const lista = useMemo(() => {
    const n = q.trim().toLowerCase()
    // con búsqueda se abre a TODO el catálogo: si alguien levanta una azotea
    // en un despacho, es su casa y su levantamiento
    const base = n ? ESPACIOS : sugeridos
    return base.filter((e) => !n || e.nombre.toLowerCase().includes(n))
  }, [q, sugeridos])

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onCerrar} aria-hidden="true" />
      <div className="absolute top-full right-0 z-40 mt-1 max-h-[26rem] w-[21rem] overflow-y-auto rounded-xl border border-line bg-ink-2 p-2 shadow-2xl shadow-ink">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar espacio…"
          autoFocus
          className="mb-1.5 w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-[12.5px] text-cream outline-none placeholder:text-cream-3 focus:border-ember/60"
        />
        {!q && (
          <p className="px-1 pb-1 text-[10px] tracking-[0.1em] text-cream-3 uppercase">
            Sugeridos para {PROPIEDADES.find((x) => x.id === propiedad)?.label ?? 'esta propiedad'}
          </p>
        )}
        {lista.map((e) => {
          const piezas = Object.values(e.equipo).reduce((a2, b2) => a2 + b2, 0)
          return (
            <button
              key={e.id}
              onClick={() => onElegir(e)}
              className="block w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ember/10"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] text-cream">{e.nombre}</span>
                <span className="text-[10px] whitespace-nowrap text-cream-3">
                  {e.m2} m² · {piezas} pzs
                </span>
              </span>
              {e.nota && <span className="mt-0.5 block text-[10.5px] leading-snug text-cream-3">{e.nota}</span>}
            </button>
          )
        })}
        {lista.length === 0 && <p className="px-2 py-3 text-[11.5px] text-cream-3">Nada con ese nombre.</p>}
      </div>
    </>
  )
}

/* ── un cuarto con sus piezas ─────────────────────────────────── */

function Room({ room, active, onSelect, onAgregar, planoHref, onSubir, onBajar }) {
  const updateRoom = useSurvey((s) => s.updateRoom)
  const removeRoom = useSurvey((s) => s.removeRoom)
  const bump = useSurvey((s) => s.bump)

  const items = Object.entries(room.items ?? {}).filter(([, q]) => q > 0)
  const subtotal = items.reduce((a, [id, q]) => {
    const d = DEVICE_BY_ID[id]
    return a + (d ? (unitPrice(d) + LABOR_TIERS[laborTier(d)].price) * q : 0)
  }, 0)
  const piezas = items.reduce((a, [, q]) => a + q, 0)
  const piezasPlano = room.plano?.items?.length ?? 0

  return (
    <div
      className={`rounded-xl border transition-colors ${
        active ? 'border-ember/60 bg-ember/5' : 'border-line bg-ink'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <button
          onClick={onSelect}
          aria-pressed={active}
          title="Marcar como cuarto destino del catálogo"
          className={`h-4 w-4 flex-none rounded-full border transition-colors ${
            active ? 'border-ember bg-ember' : 'border-cream-3'
          }`}
        />
        <input
          value={room.nombre}
          onChange={(e) => updateRoom(room.id, { nombre: e.target.value })}
          className="min-w-[8rem] flex-1 border-b border-transparent bg-transparent text-[13.5px] text-cream outline-none focus:border-line"
        />
        <label className="flex items-center gap-1 text-[11.5px] text-cream-3">
          <input
            type="number"
            min="0"
            value={room.m2}
            onChange={(e) => updateRoom(room.id, { m2: Number(e.target.value) })}
            className="w-14 rounded border border-line bg-ink px-1.5 py-0.5 text-right text-[12px] text-cream outline-none focus:border-ember/60"
          />
          m²
        </label>
        <select
          value={room.tipo}
          onChange={(e) => updateRoom(room.id, { tipo: e.target.value })}
          className="rounded border border-line bg-ink px-1.5 py-1 text-[11.5px] text-cream-2 outline-none"
        >
          {['interior', 'húmedo', 'exterior', 'servicio'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="text-[12px] tabular-nums text-cream-2">{money(subtotal)}</span>
        {/* El orden es el del recorrido de la casa, y se corrige aquí mismo.
            Flechas y no arrastre: en el celular, de pie en una obra, arrastrar
            una fila dentro de una lista que ya se desplaza es una pelea. */}
        <span className="flex flex-none flex-col leading-none">
          <button
            onClick={onSubir}
            disabled={!onSubir}
            aria-label={`Subir ${room.nombre}`}
            className="px-1 text-[10px] text-cream-3 transition-colors hover:text-ember disabled:opacity-20"
          >
            ▲
          </button>
          <button
            onClick={onBajar}
            disabled={!onBajar}
            aria-label={`Bajar ${room.nombre}`}
            className="px-1 text-[10px] text-cream-3 transition-colors hover:text-ember disabled:opacity-20"
          >
            ▼
          </button>
        </span>
        <button
          onClick={() => removeRoom(room.id)}
          aria-label={`Eliminar ${room.nombre}`}
          className="text-[14px] text-cream-3 transition-colors hover:text-ember"
        >
          ×
        </button>
      </div>

      {items.length > 0 && (
        <ul className="border-t border-line px-3 py-2">
          {items.map(([id, q]) => {
            const d = DEVICE_BY_ID[id]
            if (!d) return null
            return (
              <li key={id} className="flex items-center gap-2 py-1 text-[12px]">
                {/* la miniatura no es adorno: en obra se reconoce el aparato
                    por su forma mucho antes que por su nombre de catálogo */}
                <PhotoFrame className="h-7 w-7 flex-none rounded">
                  <DevicePhoto device={d} />
                </PhotoFrame>
                <span className="w-7 flex-none text-right tabular-nums text-ember">{q}×</span>
                <span className="flex-1 truncate text-cream-2">{d.name}</span>
                <span className="hidden text-[10.5px] text-cream-3 sm:inline">
                  {LABOR_TIERS[laborTier(d)].label}
                </span>
                <span className="w-20 text-right tabular-nums text-cream-3">
                  {money((unitPrice(d) + LABOR_TIERS[laborTier(d)].price) * q)}
                </span>
                <button
                  onClick={() => bump(id, -q, room.id)}
                  aria-label={`Quitar ${d.name} de ${room.nombre}`}
                  className="text-cream-3 transition-colors hover:text-ember"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2">
        <button
          onClick={onAgregar}
          className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-cream-2 transition-colors hover:border-ember hover:text-ember"
        >
          + Agregar equipo a {room.nombre}
        </button>
        {/* Es un enlace de verdad y no un botón con window.open: así el clic
            derecho, el clic con la rueda y ctrl/cmd+clic funcionan como en
            cualquier pestaña, y el plano vive en su propia pestaña con su
            propia URL —no hace falta volver a entrar al proyecto para verlo,
            ni cargar todo el levantamiento sólo para mirar un cuarto. */}
        <a
          href={planoHref}
          target="_blank"
          rel="noopener"
          className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-cream-2 transition-colors hover:border-thread hover:text-thread-2"
        >
          Plano 3D{piezasPlano > 0 ? ` · ${piezasPlano}` : ''}
        </a>
        {piezas > 0 && <span className="text-[11px] text-cream-3">{piezas} piezas</span>}
      </div>

      <input
        value={room.notas}
        onChange={(e) => updateRoom(room.id, { notas: e.target.value })}
        placeholder="Notas del levantamiento: muro de tabique, sin neutro, registro a 2 m…"
        className="w-full border-t border-line bg-transparent px-3 py-2 text-[11.5px] text-cream-2 outline-none placeholder:text-cream-3/60"
      />
    </div>
  )
}

/* ── panel ────────────────────────────────────────────────────── */

export default function Survey() {
  const proyecto = useProyecto()
  const survey = useSurvey()
  const [pickerRoomId, setPickerRoomId] = useState(null)
  const [planoRoomId, setPlanoRoomId] = useState(null)
  const [verConjunto, setVerConjunto] = useState(false)
  const [menuEspacios, setMenuEspacios] = useState(false)

  const { cliente, obra, rooms, extras, activeRoom } = proyecto

  /* useMemo con el objeto por defecto adentro: si se creara en cada render,
     las sugerencias se recalcularían siempre aunque nada haya cambiado. */
  const net = useMemo(() => networkCheck({ obra, rooms }), [obra, rooms])

  /* Lo cotizado de TODO el proyecto contra lo que el cliente ya tiene. */
  const compat = useMemo(() => {
    const todo = {}
    for (const r of rooms) for (const [id, n] of Object.entries(r.items ?? {})) todo[id] = (todo[id] ?? 0) + n
    return revisarCompatibilidad(proyecto.perfil?.inv ?? [], todo, DEVICE_BY_ID)
  }, [rooms, proyecto.perfil])

  /* La cotización recién generada, para poder acortarla y mandarla sin salir
     de aquí. El token son mil y pico de caracteres. */
  const [cotizacionUrl, setCotizacionUrl] = useState(null)

  const perfil = useMemo(
    () => proyecto.perfil ?? { moviles: [], cerebros: [], existente: {}, notas: '' },
    [proyecto.perfil],
  )

  const q = useMemo(() => quote({ obra, rooms, extras }), [obra, rooms, extras])


  // se relee del proyecto en cada render para que el selector vea las piezas
  // que él mismo acaba de agregar
  /* Enlace directo al plano de un cuarto o a la planta completa:
       #/admin/levantamiento?plano=<cuartoId>
       #/admin/levantamiento?planta=1
     `plano=1` a secas abre el primero que ya tenga algo dibujado, que es lo
     que necesita un script que no conoce los ids de antemano. */
  useEffect(() => {
    /* También al vuelo, no solo al montar: navegar de `?proyecto=x` a
       `?proyecto=x&plano=y` cambia únicamente el hash, así que React no
       remonta nada y sin escuchar `hashchange` el enlace no haría nada. Se
       nota justo cuando alguien te pega un enlace y ya tienes el panel
       abierto, que es cuando más se usa. */
    const aplicar = () => {
      const q = paramsDelHash()
      if (q.get('planta')) return setVerConjunto(true)
      const pedido = q.get('plano')
      if (!pedido) return
      const cuarto =
        rooms.find((r) => r.id === pedido) ?? (pedido === '1' ? rooms.find((r) => r.plano?.items?.length) : null)
      if (cuarto) setPlanoRoomId(cuarto.id)
    }
    aplicar()
    window.addEventListener('hashchange', aplicar)
    return () => window.removeEventListener('hashchange', aplicar)
  }, [rooms])

  const pickerRoom = rooms.find((r) => r.id === pickerRoomId) ?? null
  const planoRoom = rooms.find((r) => r.id === planoRoomId) ?? null

  const generar = () => {
    const folio = proyecto.folio || nuevoFolio()
    if (!proyecto.folio) survey.setFolio(folio)

    // las partidas se resuelven AQUÍ y viajan ya calculadas: la página
    // pública no necesita el catálogo, y el precio queda congelado
    const claves = {
      equipo: Object.fromEntries(q.equipo.map((l) => [l.id, CLAVE_PROD_SERV[l.cat] ?? CLAVE_PROD_SERV.servicio])),
      servicio: CLAVE_PROD_SERV.servicio,
      unidadPieza: CLAVE_UNIDAD.pieza,
      unidadServicio: CLAVE_UNIDAD.servicio,
    }
    const equipoConCat = q.equipo.map((l) => ({
      ...l,
      catLabel: CATEGORIES.find((c) => c.id === l.cat)?.label ?? '',
    }))

    const token = encodeQuote(
      buildQuotePayload({ ...proyecto, folio }, { ...q, equipo: equipoConCat }, net, claves),
    )
    survey.setEstado(proyecto.id, 'cotizado')
    const url = `${location.origin}${location.pathname}#/cotizacion?d=${token}`
    setCotizacionUrl(url)
    window.open(url, '_blank')
  }

  /**
   * Genera el plano de TODOS los cuartos y los acomoda en la planta.
   *
   * El equipo ya levantado se reparte según qué es cada cosa —las luminarias
   * al techo en retícula, los sensores de presencia a las esquinas altas, las
   * fugas al piso junto al mueble húmedo— y de paso queda un apagador junto a
   * la puerta, cableado y controlando las luces del cuarto.
   *
   * Es un punto de partida, no el plano final: la idea es que al abrir un
   * cuarto haya algo que corregir en vez de un lienzo en blanco.
   */
  const generarPlanos = () => {
    if (rooms.some((r) => r.plano?.items?.length) && !confirm('Se reemplazan los planos que ya tengan algo dibujado. ¿Seguir?'))
      return

    const armados = rooms.map((r) => {
      const base = { ...planoVacio(r.m2), ...(r.plano ?? {}) }
      const tipo = base.tipoCuarto ?? tipoPorNombre(r.nombre)
      const { items, tramos, reglas } = disponerCuarto({ plano: base, tipo, equipo: r.items })
      return { room: r, plano: { ...base, tipoCuarto: tipo, items, tramos, reglas } }
    })

    const posiciones = disponerPlanta(armados)

    for (const c of armados) {
      survey.setPlano(
        c.room.id,
        { ...c.plano, pos: posiciones.get(c.room.id) ?? c.plano.pos },
        `Generó el plano de ${c.room.nombre}`,
      )
    }
  }

  /**
   * Crea un espacio del catálogo y le deja el plano 3D ya dispuesto.
   *
   * Todo de un golpe: nombre, metros, el equipo que ese espacio suele llevar,
   * el mobiliario acomodado, las luminarias repartidas en el techo, el
   * apagador junto a la puerta cableado a ellas y la regla que lo enciende.
   * Lo que queda para la persona es lo único que una computadora no puede
   * saber: si en ESTA casa la cocina de verdad lleva dos tiras o una.
   */
  const agregarEspacio = (esp) => {
    setMenuEspacios(false)
    const cuartoId = survey.agregarEspacio(esp)
    if (!cuartoId) return

    const base = { ...planoVacio(esp.m2), tipoCuarto: esp.tipo }
    const { items, tramos, reglas } = disponerCuarto({ plano: base, tipo: esp.tipo, equipo: esp.equipo })
    const nuevo = { ...base, items, tramos, reglas }
    survey.setPlano(cuartoId, nuevo, `Creó el espacio ${esp.nombre}`)

    /* Y se recoloca la planta completa.
       Sin esto cada espacio nuevo nacía en el origen y quedaban todos
       encimados —así estaba el departamento de Carpio—: el plano general se
       veía roto justo cuando se le enseña al cliente. */
    const armados = [
      ...rooms.map((r) => ({ room: r, plano: { ...planoVacio(r.m2), ...(r.plano ?? {}) } })),
      { room: { id: cuartoId, nombre: esp.nombre }, plano: nuevo },
    ]
    const pos = disponerPlanta(armados)
    for (const c of armados) {
      const p2 = pos.get(c.room.id)
      if (p2) survey.setPlano(c.room.id, { ...c.plano, pos: p2 }, 'Acomodó la planta')
    }
  }

  const mover = (i, delta) => {
    const orden = rooms.map((r) => r.id)
    const j = i + delta
    if (j < 0 || j >= orden.length) return
    ;[orden[i], orden[j]] = [orden[j], orden[i]]
    survey.reordenarCuartos(orden)
  }

  const catCount = useMemo(() => {
    const c = {}
    for (const r of rooms)
      for (const [id, n] of Object.entries(r.items ?? {})) {
        const d = DEVICE_BY_ID[id]
        if (d && n > 0) c[d.cat] = (c[d.cat] ?? 0) + n
      }
    return c
  }, [rooms])

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {/* ── cuartos: primero, porque es lo que se captura caminando ── */}
        <Card
          seccion="cuartos"
          proyectoId={proyecto.id}
          title={`Espacios · ${rooms.length}`}
          right={
            <div className="flex gap-2">
              <button
                onClick={generarPlanos}
                title="Reparte el equipo levantado en cada cuarto y acomoda la planta"
                className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-cream-2 transition-colors hover:border-ember hover:text-ember"
              >
                Generar planos
              </button>
              {rooms.some((r) => r.plano?.items?.length) && (
                <button
                  onClick={() => setVerConjunto(true)}
                  className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-cream-2 transition-colors hover:border-thread hover:text-thread-2"
                >
                  Ver la planta
                </button>
              )}
              <span className="relative">
                <button
                  onClick={() => setMenuEspacios((v) => !v)}
                  aria-expanded={menuEspacios}
                  className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-cream-2 transition-colors hover:border-ember hover:text-ember"
                >
                  + Agregar espacio
                </button>
                {menuEspacios && (
                  <MenuEspacios
                    propiedad={obra.propiedad ?? 'casa'}
                    onElegir={agregarEspacio}
                    onCerrar={() => setMenuEspacios(false)}
                  />
                )}
              </span>
            </div>
          }
        >
          <p className="mb-3 text-[11.5px] text-cream-3">
            El equipo se captura por espacio: entra, mira qué hace falta y agrégalo ahí mismo. Las flechas cambian el orden del recorrido.
            Suma de metros capturados:{' '}
            <strong className="text-cream-2">{rooms.reduce((a, r) => a + (Number(r.m2) || 0), 0)} m²</strong>{' '}
            de {obra.m2} declarados.
          </p>
          <div className="space-y-2">
            {rooms.map((r, i) => (
              <Room
                key={r.id}
                room={r}
                onSubir={i > 0 ? () => mover(i, -1) : null}
                onBajar={i < rooms.length - 1 ? () => mover(i, 1) : null}
                active={r.id === (activeRoom ?? rooms[0]?.id)}
                onSelect={() => survey.setActiveRoom(r.id)}
                onAgregar={() => {
                  survey.setActiveRoom(r.id)
                  setPickerRoomId(r.id)
                }}
                planoHref={`${location.origin}${location.pathname}#/plano?proyecto=${proyecto.id}&plano=${r.id}`}
              />
            ))}
            {rooms.length === 0 && (
              <p className="py-6 text-center text-[12.5px] text-cream-3">
                Todavía no hay espacios. Agrega el primero para empezar a capturar.
              </p>
            )}
          </div>
        </Card>

        {/* ── obra ── */}
        <Card title="La propiedad" seccion="obra" proyectoId={proyecto.id}>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {/* El id manda sobre qué espacios se sugieren; la etiqueta es la que
                sale impresa. Se puede corregir después de crear el proyecto:
                los que existían antes de esto no traen ninguno. */}
            <Field label="Qué es" hint="Decide los espacios que se sugieren">
              <select
                value={obra.propiedad ?? 'casa'}
                onChange={(e) => {
                  const prop = PROPIEDADES.find((x) => x.id === e.target.value)
                  survey.setObra({ propiedad: e.target.value, tipo: prop?.label ?? obra.tipo })
                }}
                className={inputCls}
              >
                {PROPIEDADES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cómo se llama" hint="Lo que dice la cotización">
              <Input value={obra.tipo} onChange={(e) => survey.setObra({ tipo: e.target.value })} />
            </Field>
            <Field label="Superficie m²" hint="Define el levantamiento y los APs">
              <Input
                type="number"
                min="0"
                value={obra.m2}
                onChange={(e) => survey.setObra({ m2: Number(e.target.value) })}
              />
            </Field>
            <Field label="Niveles">
              <Input
                type="number"
                min="1"
                value={obra.niveles}
                onChange={(e) => survey.setObra({ niveles: Number(e.target.value) })}
              />
            </Field>
            <Field label="Zona">
              <Input value={obra.zona} onChange={(e) => survey.setObra({ zona: e.target.value })} />
            </Field>
          </div>
        </Card>

        {/* ── lo que ya tiene ── */}
        <Card title="Lo que ya tiene" seccion="perfil" proyectoId={proyecto.id}>
          <p className="mb-3 text-[11.5px] leading-relaxed text-cream-3">
            Casi nadie parte de cero. Lo que ya está en la casa cambia qué se propone —un Echo grande ya trae
            Zigbee y abarata los sensores— y cambia el precio: lo que ya tienen no se cobra.
          </p>

          <EnlaceCliente proyectoId={proyecto.id} nombre={proyecto.nombre} />

          <div className="mt-3">
            <Inventario
              inv={perfil.inv ?? []}
              onCambiar={(inv) => survey.setPerfil({ inv })}
              espacios={rooms.map((r) => r.nombre)}
            />

          {/* El cruce entre lo que hay y lo que se cotizó. Se recalcula solo:
              si el cliente corrige la generación de su Echo desde su enlace,
              la advertencia aparece aquí sin que nadie la busque. */}
          {compat.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-line pt-3">
              <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">
                Revisión de compatibilidad · {compat.length}
              </p>
              {compat.map((x) => (
                <div
                  key={x.titulo}
                  className={`rounded-lg border px-2.5 py-2 ${
                    x.nivel === 'falta' ? 'border-rose-500/40 bg-rose-500/[0.07]' : 'border-ember/30 bg-ember/[0.05]'
                  }`}
                >
                  <p className="text-[11.5px] text-cream">{x.titulo}</p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-cream-3">{x.porque}</p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-cream-2">{x.accion}</p>
                </div>
              ))}
            </div>
          )}
          </div>

          <div className="mt-4 -mx-3">
            <Firmware rooms={rooms} inv={perfil.inv ?? []} />
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-[10px] tracking-[0.12em] text-cream-3 uppercase">
              Notas — lo que no entre arriba
            </span>
            <Input
              value={perfil.notas ?? ''}
              onChange={(e) => survey.setPerfil({ notas: e.target.value })}
              placeholder="Minisplit Mirage 2021 en la recámara, cámara vieja en la cochera…"
            />
          </label>
        </Card>

        <Card title="Cómo se comunica la casa">
          <div className="flex flex-wrap gap-2">
            {Object.entries(net.byLink).map(([k, n]) => (
              <span key={k} className="rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] text-cream-2">
                {k} <strong className="text-cream">{n}</strong>
              </span>
            ))}
            {Object.keys(net.byLink).length === 0 && (
              <span className="text-[12px] text-cream-3">Agrega dispositivos para ver la topología.</span>
            )}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {[
              [net.repetidores, 'repetidores de malla'],
              [net.dePila, 'nodos de pila'],
              [`${net.aps}/${net.apsSugeridos}`, 'access points'],
            ].map(([n, l]) => (
              <div key={l} className="rounded-lg border border-line px-3 py-2">
                <div className="text-[15px] tabular-nums text-cream">{n}</div>
                <div className="text-[10.5px] text-cream-3">{l}</div>
              </div>
            ))}
          </div>

          <ul className="mt-3 space-y-1.5">
            {net.alerts.map((a, i) => (
              <li
                key={i}
                className={`rounded-lg border px-3 py-2 text-[12px] ${
                  a.level === 'error'
                    ? 'border-red-500/40 bg-red-500/8 text-red-200'
                    : a.level === 'warn'
                      ? 'border-ember/35 bg-ember/8 text-ember-2'
                      : 'border-line text-cream-2'
                }`}
              >
                {a.text}
              </li>
            ))}
          </ul>
        </Card>

        {/* ── cliente ── */}
        <Card title="Cliente y datos fiscales" seccion="cliente" proyectoId={proyecto.id}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre de contacto">
              <Input
                value={cliente.nombre}
                onChange={(e) => survey.setCliente({ nombre: e.target.value })}
                placeholder="María Fernández"
              />
            </Field>
            <Field label="Razón social" hint="Exacta como aparece en la Constancia de Situación Fiscal">
              <Input
                value={cliente.razonSocial}
                onChange={(e) => survey.setCliente({ razonSocial: e.target.value })}
                placeholder="FERNANDEZ LOPEZ MARIA"
              />
            </Field>
            <Field label="RFC">
              <Input
                value={cliente.rfc}
                onChange={(e) => survey.setCliente({ rfc: e.target.value.toUpperCase() })}
                placeholder="FELM800101AB1"
                maxLength={13}
              />
            </Field>
            <Field label="C.P. fiscal" hint="Debe coincidir con el registrado ante el SAT">
              <Input
                value={cliente.cp}
                onChange={(e) => survey.setCliente({ cp: e.target.value })}
                placeholder="03100"
                maxLength={5}
              />
            </Field>
            <Field label="Régimen fiscal">
              <Picker
                value={cliente.regimen}
                onChange={(v) => survey.setCliente({ regimen: v })}
                options={REGIMENES}
              />
            </Field>
            <Field label="Uso del CFDI">
              <Picker
                value={cliente.usoCfdi}
                onChange={(v) => survey.setCliente({ usoCfdi: v })}
                options={USOS_CFDI}
              />
            </Field>
            <Field label="Forma de pago">
              <Picker
                value={cliente.formaPago}
                onChange={(v) => survey.setCliente({ formaPago: v })}
                options={FORMAS_PAGO}
              />
            </Field>
            <Field label="Método de pago">
              <Picker
                value={cliente.metodoPago}
                onChange={(v) => survey.setCliente({ metodoPago: v })}
                options={METODOS_PAGO}
              />
            </Field>
            <Field label="Correo">
              <Input
                type="email"
                value={cliente.email}
                onChange={(e) => survey.setCliente({ email: e.target.value })}
                placeholder="maria@correo.com"
              />
            </Field>
            <Field label="WhatsApp">
              <Input
                value={cliente.tel}
                onChange={(e) => survey.setCliente({ tel: e.target.value })}
                placeholder="55 1234 5678"
              />
            </Field>
            <Field label="Dirección de la obra" wide>
              <Input
                value={cliente.direccion}
                onChange={(e) => survey.setCliente({ direccion: e.target.value })}
                placeholder="Calle, número, colonia, alcaldía"
              />
            </Field>
          </div>
        </Card>

        {/* ── servicios ── */}
        <Card title="Servicios y ajustes" seccion="servicios" proyectoId={proyecto.id}>
          {/* El acomodo de cables va arriba y con su explicación porque es la
              partida que casi nadie cotiza y todo mundo reclama: sin ella el
              cuarto termina con seis cables cruzando el zoclo, y esa foto es la
              que el cliente enseña cuando se queja. */}
          <div className="mb-3">
            <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Acomodo de cables</p>
            <p className="mt-1 text-[11px] leading-snug text-cream-3">
              Agrupa los cables de alimentación en una ruta y los esconde lo más posible. Se cobra por punto,
              porque el trabajo es por punto: abrir, medir, sujetar y rematar cada aparato. Cuenta los que ya
              tienen cable definido en el taller de cada pieza.
            </p>
            <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
              {Object.values(ACOMODOS).map((a) => {
                const on = (extras.acomodoCables ?? 'ninguno') === a.id
                return (
                  <button
                    key={a.id}
                    onClick={() => survey.setExtras({ acomodoCables: a.id })}
                    className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
                      on ? 'border-ember bg-ember/10' : 'border-line hover:bg-cream/6'
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[12px] text-cream">{a.label}</span>
                      <span className="shrink-0 text-[11px] text-cream-3">
                        {a.precio ? `$${a.precio}/punto` : 'sin costo'}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[10.5px] leading-snug text-cream-3">{a.porque}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Puntos de red">
              <Input
                type="number"
                min="0"
                value={extras.puntosRed}
                onChange={(e) => survey.setExtras({ puntosRed: Number(e.target.value) })}
              />
            </Field>
            <Field label="Escenas">
              <Input
                type="number"
                min="0"
                value={extras.escenas}
                onChange={(e) => survey.setExtras({ escenas: Number(e.target.value) })}
              />
            </Field>
            <Field label="Km fuera de zona">
              <Input
                type="number"
                min="0"
                value={extras.km}
                onChange={(e) => survey.setExtras({ km: Number(e.target.value) })}
              />
            </Field>
            <Field label="Descuento %">
              <Input
                type="number"
                min="0"
                max="40"
                value={extras.descuentoPct}
                onChange={(e) => survey.setExtras({ descuentoPct: Number(e.target.value) })}
              />
            </Field>
            <Field label="Vigencia (días)">
              <Input
                type="number"
                min="1"
                value={extras.vigencia}
                onChange={(e) => survey.setExtras({ vigencia: Number(e.target.value) })}
              />
            </Field>
            <label className="flex items-center gap-2 self-end pb-1.5 text-[12px] text-cream-2 sm:col-span-3">
              <input
                type="checkbox"
                checked={!!extras.acreditaLevantamiento}
                onChange={(e) => survey.setExtras({ acreditaLevantamiento: e.target.checked })}
                className="accent-[var(--color-ember)]"
              />
              Acreditar el levantamiento al total si instala con nosotros
            </label>
          </div>
        </Card>

        <Historial proyectoId={proyecto.id} />
      </div>

      {/* ── resumen ── */}
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="rounded-xl border border-line bg-ink-2 p-4">
          <h2 className="text-[11px] tracking-[0.14em] text-cream-3 uppercase">Cotización</h2>

          <dl className="mt-3 space-y-1.5 text-[12.5px]">
            {[
              ['Equipo', q.equipoTotal, `${q.piezas} piezas`],
              ['Servicios', q.serviciosTotal, `${q.servicios.length} partidas`],
            ].map(([l, v, hint]) => (
              <div key={l} className="flex items-baseline justify-between">
                <dt className="text-cream-3">
                  {l} <span className="text-[10.5px] opacity-70">{hint}</span>
                </dt>
                <dd className="tabular-nums text-cream-2">{money(v)}</dd>
              </div>
            ))}
            {q.descuento > 0 && (
              <div className="flex items-baseline justify-between text-ember-2">
                <dt>Descuento{q.acredita ? ' + levantamiento acreditado' : ''}</dt>
                <dd className="tabular-nums">−{money(q.descuento)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-line pt-1.5">
              <dt className="text-cream-3">Subtotal</dt>
              <dd className="tabular-nums text-cream-2">{money(q.subtotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-cream-3">IVA 16%</dt>
              <dd className="tabular-nums text-cream-2">{money(q.iva)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-2">
              <dt className="text-[13px] text-cream">Total</dt>
              <dd className="display text-[19px] text-ember">{money(q.total)}</dd>
            </div>
          </dl>

          {/* mezcla por categoría: si el 80% es iluminación, falta proyecto */}
          {Object.keys(catCount).length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="mb-2 text-[10px] tracking-[0.12em] text-cream-3 uppercase">Mezcla</p>
              <div className="space-y-1">
                {Object.entries(catCount)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([c, n]) => (
                    <div key={c} className="flex items-center gap-2 text-[11.5px]">
                      <span className="flex-1 truncate text-cream-3">
                        {CATEGORIES.find((x) => x.id === c)?.label}
                      </span>
                      <span className="tabular-nums text-cream-2">{n}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <button
            onClick={generar}
            disabled={q.piezas === 0}
            className="mt-4 w-full rounded-lg bg-ember px-3 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-ember-2 disabled:opacity-40"
          >
            Generar cotización web
          </button>

          <div className="mt-2 flex gap-2">
            <a
              href="#/admin/catalogo"
              className="flex-1 rounded-lg border border-line px-3 py-2 text-center text-[12px] text-cream-2 transition-colors hover:border-cream/40"
            >
              Ver catálogo
            </a>
            <button
              onClick={() => confirm('¿Quitar todas las piezas de este proyecto?') && survey.vaciarPiezas()}
              className="rounded-lg border border-line px-3 py-2 text-[12px] text-cream-3 transition-colors hover:border-ember hover:text-ember"
            >
              Vaciar piezas
            </button>
          </div>

          <p className="mt-3 text-[11px] text-cream-3">
            Folio <span className="text-cream-2">{proyecto.folio}</span>
          </p>

          {cotizacionUrl && (
            <div className="mt-3">
              <Compartir
                destino={cotizacionUrl}
                etiqueta={`Cotización ${proyecto.folio} · ${proyecto.nombre}`}
                titulo="Mandar la cotización"
                ayuda="La cotización viaja dentro del enlace con los precios congelados. El acortador la deja en siete caracteres para que se pueda mandar por WhatsApp sin que parezca sospechosa."
              />
            </div>
          )}

          <div className="mt-3 space-y-2">
            <Compartir
              destino={`${location.origin}/#/catalogo`}
              etiqueta="Catálogo para clientes"
              titulo="Mandar el catálogo"
              ayuda="Lo que se enseña cuando preguntan qué se le puede poner a la casa. Sin precios de operación."
            />
          </div>
        </div>

        <p className="mt-3 px-1 text-[11px] leading-relaxed text-cream-3">
          El enlace de la cotización lleva los datos dentro: se puede mandar por WhatsApp y abre en cualquier
          dispositivo sin servidor. 
        </p>
      </aside>

      {pickerRoom && <RoomPicker room={pickerRoom} onCerrar={() => setPickerRoomId(null)} />}

      {planoRoom && (
        <Suspense fallback={null}>
          <PlanoCuarto room={planoRoom} onCerrar={() => setPlanoRoomId(null)} />
        </Suspense>
      )}

      {verConjunto && (
        <Suspense fallback={null}>
          <Conjunto
            rooms={rooms}
            onCerrar={() => setVerConjunto(false)}
            onAbrirCuarto={(id) => {
              setVerConjunto(false)
              setPlanoRoomId(id)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

/**
 * El enlace que se le manda al cliente para que anexe lo suyo.
 *
 * El token lo firma el servidor con el mismo secreto de las sesiones, así que
 * no hay nada que guardar ni que caduque. Se acorta antes de mandarlo: el
 * token completo son doscientos caracteres y por WhatsApp eso se ve a estafa.
 */
function EnlaceCliente({ proyectoId, nombre }) {
  const [largo, setLargo] = useState(null)

  useEffect(() => {
    fetch(`/api/enlace-inventario/${proyectoId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setLargo(`${window.location.origin}/#/mi-equipo?t=${d.token}`))
      .catch(() => {})
  }, [proyectoId])

  if (!largo) return null

  return (
    <div className="space-y-2">
      <Compartir
        destino={largo}
        etiqueta={`Anexador · ${nombre}`}
        titulo="Que lo llene el cliente"
        ayuda="Mándale este enlace. Anexa lo suyo desde el teléfono y llega aquí solo — sin cuenta y sin que nadie transcriba nada. Solo abre su inventario: ni precios ni el resto del levantamiento."
      />
      <Compartir
        destino={largo.replace('/#/mi-equipo?', '/#/mi-casa?')}
        etiqueta={`Guía de la casa · ${nombre}`}
        titulo="La guía de su casa"
        ayuda="Qué le puede pedir a su casa, espacio por espacio, con las frases que sí funcionan en su bocina. Se arma sola desde el levantamiento: si mañana cambia la instalación, la guía cambia con ella."
      />
    </div>
  )
}
