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
import { tipoPorNombre } from './plano/catalogo'
import { disponerCuarto, disponerPlanta } from './plano/disponer'
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

/* ── un cuarto con sus piezas ─────────────────────────────────── */

function Room({ room, active, onSelect, onAgregar, onPlano }) {
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
        <button
          onClick={onPlano}
          className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-cream-2 transition-colors hover:border-thread hover:text-thread-2"
        >
          Plano 3D{piezasPlano > 0 ? ` · ${piezasPlano}` : ''}
        </button>
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

  const { cliente, obra, rooms, extras, activeRoom } = proyecto

  const q = useMemo(() => quote({ obra, rooms, extras }), [obra, rooms, extras])
  const net = useMemo(() => networkCheck({ obra, rooms }), [obra, rooms])

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
    window.open(`${location.origin}${location.pathname}#/cotizacion?d=${token}`, '_blank')
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
          title={`Habitaciones · ${rooms.length}`}
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
              <button
                onClick={() => survey.addRoom()}
                className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-cream-2 transition-colors hover:border-ember hover:text-ember"
              >
                + Agregar cuarto
              </button>
            </div>
          }
        >
          <p className="mb-3 text-[11.5px] text-cream-3">
            El equipo se captura por habitación: entra al cuarto, mira qué hace falta y agrégalo ahí mismo.
            Suma de metros capturados:{' '}
            <strong className="text-cream-2">{rooms.reduce((a, r) => a + (Number(r.m2) || 0), 0)} m²</strong>{' '}
            de {obra.m2} declarados.
          </p>
          <div className="space-y-2">
            {rooms.map((r) => (
              <Room
                key={r.id}
                room={r}
                active={r.id === (activeRoom ?? rooms[0]?.id)}
                onSelect={() => survey.setActiveRoom(r.id)}
                onAgregar={() => {
                  survey.setActiveRoom(r.id)
                  setPickerRoomId(r.id)
                }}
                onPlano={() => setPlanoRoomId(r.id)}
              />
            ))}
            {rooms.length === 0 && (
              <p className="py-6 text-center text-[12.5px] text-cream-3">
                Todavía no hay cuartos. Agrega el primero para empezar a capturar.
              </p>
            )}
          </div>
        </Card>

        {/* ── obra ── */}
        <Card title="La propiedad" seccion="obra" proyectoId={proyecto.id}>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Tipo">
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

        {/* ── red ── */}
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
        </div>

        <p className="mt-3 px-1 text-[11px] leading-relaxed text-cream-3">
          El enlace de la cotización lleva los datos dentro: se puede mandar por WhatsApp y abre en cualquier
          dispositivo sin servidor. Cuando haya backend, se cambia por un folio corto.
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
