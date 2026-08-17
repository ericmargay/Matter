import { Suspense, lazy, useEffect, useMemo, useState } from 'react'

import { CATEGORIES, DEVICE_BY_ID } from '../../../content/catalog'
import { uid, planoVacio } from '../../../sync/eventos'
import { useSurvey } from '../../../store/survey'
import { ARRANQUE, MUEBLES, POR_TIPO, TIPOS, tipoPorNombre } from './catalogo'
import { ESPACIOS } from '../../../content/espacios'
import { ALTURA_POR_FORMA, diagnosticoLux, luxDelCuarto, parametrosIniciales } from './luz'

/* three pesa; el plano se carga solo cuando alguien lo abre */
const Escena = lazy(() => import('./Escena'))

/**
 * El plano de una habitación.
 *
 * Para qué sirve, en una frase: para discutir la instalación con el cliente
 * antes de taladrar. Dónde queda cada pieza, cuánta luz va a dar el cuarto,
 * por dónde corre el cable y qué apaga cada apagador — todo eso hoy se
 * resuelve en la cabeza del que levanta y se pierde en el camino a la obra.
 *
 * No pretende ser un software de arquitectura. Las medidas son las del
 * levantamiento y la geometría es una caja: lo que se está diseñando aquí es
 * la instalación, no la casa.
 */

const num = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def)

/* ── piezas de interfaz ───────────────────────────────────────── */

function Grupo({ titulo, children, right }) {
  return (
    <section className="border-b border-line last:border-0">
      <header className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <h3 className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">{titulo}</h3>
        {right}
      </header>
      <div className="px-3 pb-3">{children}</div>
    </section>
  )
}

function Chip({ activo, onClick, children, tono }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activo}
      className={`rounded-lg border px-2 py-1 text-left text-[11.5px] transition-colors ${
        activo ? 'border-ember bg-ember text-ink' : `border-line text-cream-2 hover:border-cream/35 ${tono ?? ''}`
      }`}
    >
      {children}
    </button>
  )
}

const inputCls =
  'w-full rounded border border-line bg-ink px-2 py-1 text-[12px] text-cream outline-none focus:border-ember/60'

function Medida({ label, value, onChange, step = 0.1, min = 0.5 }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">{label}</span>
      <input type="number" step={step} min={min} value={value} onChange={(e) => onChange(num(e.target.value))} className={inputCls} />
    </label>
  )
}

/* ── editor ───────────────────────────────────────────────────── */

export default function PlanoCuarto({ room, onCerrar }) {
  const setPlano = useSurvey((s) => s.setPlano)

  const plano = useMemo(() => ({ ...planoVacio(room.m2), ...(room.plano ?? {}) }), [room.plano, room.m2])
  const tipo = plano.tipoCuarto ?? tipoPorNombre(room.nombre)

  const [seleccion, setSeleccion] = useState(null)
  const [colocando, setColocando] = useState(null)
  /* Se abre de DÍA. De noche, un cuarto sin luces colocadas es una pantalla
     negra, y esa no es la primera impresión de una herramienta que funciona.
     El modo noche es para lo otro: juzgar si con estas piezas se ve. */
  const [modo, setModo] = useState('dia')

  /* Qué cota se está editando: null | 'x' | 'z'. Es un modo aparte a
     propósito. Mientras dura, la cámara no gira y nada se selecciona ni se
     arrastra — cambiar una medida es un gesto de precisión, y compartirlo con
     el orbitado hacía imposible atinarle. */
  const [midiendo, setMidiendo] = useState(null)
  const [simulando, setSimulando] = useState(false)
  const [apagados, setApagados] = useState(() => new Set())
  const [uniendo, setUniendo] = useState(null)

  // el fondo no debe desplazarse detrás del editor
  useEffect(() => {
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (midiendo) setMidiendo(null)
        else if (uniendo) setUniendo(null)
        else if (colocando) setColocando(null)
        else onCerrar()
      }
      if (midiendo) return
      if ((e.key === 'Delete' || e.key === 'Backspace') && seleccion) quitar(seleccion)
      if (e.key === 'r' && seleccion) girar(seleccion)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = antes
      document.removeEventListener('keydown', onKey)
    }
  })

  const guardar = (patch, que) => setPlano(room.id, { ...plano, ...patch }, que)

  /**
   * Trazar cable: se elige un punto, luego otro, y queda el tramo.
   *
   * Se dibuja a través del muro a propósito. Lo que hace útil este plano el
   * día que haya que abrir una pared es justamente poder ver por dónde va lo
   * que no se ve.
   */
  const unirCon = (id) => {
    const a = plano.items.find((i) => i.id === uniendo)
    const b = plano.items.find((i) => i.id === id)
    if (a && b) {
      const tramo = {
        id: uid('t'),
        de: [a.x, a.y ?? 0.4, a.z],
        a: [b.x, b.y ?? 0.4, b.z],
        entre: [a.id, b.id],
      }
      guardar({ tramos: [...(plano.tramos ?? []), tramo] }, 'Trazó una línea eléctrica')
    }
    setUniendo(null)
    setSeleccion(id)
  }

  const seleccionar = (id) => {
    if (uniendo && id && id !== uniendo) return unirCon(id)
    setSeleccion(id)
  }
  const setItems = (items, que) => guardar({ items }, que)

  /* Arrastrar un muro dispara decenas de medidas por segundo. `setPlano` ya
     agrupa el envío, así que la pantalla responde a cada cuadro y al registro
     llega un solo cambio cuando se suelta. */
  const medir = (eje, valor) =>
    guardar(
      { [eje === 'x' ? 'ancho' : 'largo']: Number(valor.toFixed(2)) },
      `Ajustó las medidas de ${room.nombre}`,
    )

  /* ── acciones sobre los objetos ── */

  const colocar = (x, z) => {
    if (!colocando) return
    const base = { id: uid('i'), x: Number(x.toFixed(2)), z: Number(z.toFixed(2)), rot: 0 }
    let item, que

    if (colocando.clase === 'mueble') {
      item = { ...base, clase: 'mueble', tipo: colocando.tipo }
      que = `Colocó ${MUEBLES[colocando.tipo]?.label?.toLowerCase() ?? 'un mueble'}`
    } else if (colocando.clase === 'equipo') {
      const dev = DEVICE_BY_ID[colocando.deviceId]
      const params = parametrosIniciales(dev)
      item = {
        ...base,
        clase: 'equipo',
        deviceId: colocando.deviceId,
        y: params ? ALTURA_POR_FORMA[params.forma] ?? 2.4 : 0.3,
        params,
      }
      que = `Colocó ${dev?.name ?? 'un dispositivo'}`
    } else {
      item = { ...base, clase: 'punto', tipo: colocando.tipo, y: colocando.tipo === 'apagador' ? 1.2 : 0.4 }
      que = `Colocó un ${colocando.tipo}`
    }

    setItems([...plano.items, item], que)
    setSeleccion(item.id)
    setColocando(null)
  }

  const mover = (id, x, z) =>
    setItems(
      plano.items.map((i) => (i.id === id ? { ...i, x: Number(x.toFixed(2)), z: Number(z.toFixed(2)) } : i)),
      'Movió una pieza en el plano',
    )

  const parchar = (id, patch, que) =>
    setItems(plano.items.map((i) => (i.id === id ? { ...i, ...patch } : i)), que)

  /**
   * Dónde va el módulo que vuelve inteligente ese apagador.
   *
   * Marca también las luminarias que controla, porque el módulo tiene que
   * caber en algún lado: si va en la luminaria, hay que ver que el registro
   * tenga espacio, y eso se decide mirando el plano, no en la obra.
   */
  const ponerModulo = (puntoId, modulo) => {
    const regla = (plano.reglas ?? []).find((r) => r.disparo === puntoId)
    const destinos = new Set(regla?.destinos ?? [])
    setItems(
      plano.items.map((i) => {
        if (i.id === puntoId) return { ...i, modulo }
        if (destinos.has(i.id)) return { ...i, conModulo: modulo === 'luminaria' }
        return i
      }),
      modulo === 'luminaria' ? 'Puso el módulo en la luminaria' : modulo === 'atras' ? 'Puso el módulo detrás del apagador' : 'Cambió a apagador inteligente',
    )
  }

  /** Giro libre, en radianes: lo usa el aro que se arrastra en la escena. */
  const girarA = (id, rad) => parchar(id, { rot: rad })

  const girar = (id) => {
    const it = plano.items.find((i) => i.id === id)
    if (it) parchar(id, { rot: ((it.rot ?? 0) + Math.PI / 8) % (Math.PI * 2) }, 'Giró una pieza')
  }

  const quitar = (id) => {
    setItems(plano.items.filter((i) => i.id !== id), 'Quitó una pieza del plano')
    // las reglas que apuntaban a lo borrado se van con él: una regla
    // colgando de un fantasma es peor que no tener regla
    const reglas = (plano.reglas ?? []).filter((r) => r.disparo !== id).map((r) => ({ ...r, destinos: r.destinos.filter((d) => d !== id) }))
    guardar({ reglas }, 'Quitó una pieza del plano')
    setSeleccion(null)
  }

  const arrancarCuarto = () => {
    const receta = ARRANQUE[tipo]
    if (!receta) return
    const nuevos = receta.map((r) => ({ id: uid('i'), clase: 'mueble', ...r }))
    setItems([...plano.items, ...nuevos], `Amuebló ${room.nombre} con la base de ${tipo}`)
  }

  /* ── equipo levantado, listo para colocar ── */

  const porColocar = useMemo(() => {
    const puestos = {}
    for (const i of plano.items) if (i.clase === 'equipo') puestos[i.deviceId] = (puestos[i.deviceId] ?? 0) + 1
    return Object.entries(room.items ?? {})
      .filter(([, q]) => q > 0)
      .map(([deviceId, q]) => ({ deviceId, faltan: q - (puestos[deviceId] ?? 0), total: q }))
  }, [room.items, plano.items])

  /* ── luz ── */

  /** Qué apagadores tienen una regla: son los únicos que hacen algo al tocarlos. */
  const conRegla = useMemo(() => new Set((plano.reglas ?? []).map((r) => r.disparo)), [plano.reglas])

  const encendidos = useMemo(() => {
    const s = new Set()
    for (const i of plano.items) if (!apagados.has(i.id)) s.add(i.id)
    return s
  }, [plano.items, apagados])

  const lumenes = useMemo(
    () =>
      plano.items
        .filter((i) => i.clase === 'equipo' && i.params && encendidos.has(i.id))
        .reduce((a, i) => a + i.params.lm * ((i.params.brillo ?? 100) / 100), 0),
    [plano.items, encendidos],
  )

  const area = plano.ancho * plano.largo
  const lux = luxDelCuarto(lumenes, area)
  const diag = diagnosticoLux(lux, tipo)

  /* ── reglas ── */

  const apagadores = plano.items.filter((i) => i.clase === 'punto' && i.tipo === 'apagador')
  const equipos = plano.items.filter((i) => i.clase === 'equipo')

  /**
   * Tocar un apagador.
   *
   * Vale igual para luces y para cortinas: en el modelo son lo mismo —algo que
   * el apagador prende o apaga— y en la escena una cortina "encendida" se
   * dibuja recogida. Así el mismo gesto sirve para las dos cosas y no hay que
   * explicar dos controles distintos.
   */
  const accionar = (puntoId) => {
    const regla = (plano.reglas ?? []).find((r) => r.disparo === puntoId)
    if (!regla) return
    setApagados((prev) => {
      const s = new Set(prev)
      // el apagador invierte lo que haya: si algo de su grupo está prendido,
      // apaga todo; si no, prende todo. Es como se comporta uno de pared.
      const algunoPrendido = regla.destinos.some((d) => !s.has(d))
      for (const d of regla.destinos) {
        if (algunoPrendido) s.add(d)
        else s.delete(d)
      }
      return s
    })
  }

  const seleccionado = plano.items.find((i) => i.id === seleccion)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      {/* ── barra ── */}
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <div>
          <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Plano de</p>
          <h2 className="display text-[19px] text-cream">{room.nombre}</h2>
        </div>

        <select
          value={tipo}
          onChange={(e) => guardar({ tipoCuarto: e.target.value }, `Cambió el tipo de ${room.nombre}`)}
          className="rounded-lg border border-line bg-ink-2 px-2 py-1 text-[12px] text-cream-2 outline-none"
        >
          {TIPOS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="flex items-end gap-2">
          <Medida label="Ancho m" value={plano.ancho} onChange={(v) => guardar({ ancho: v }, 'Cambió el ancho del cuarto')} />
          <Medida label="Largo m" value={plano.largo} onChange={(v) => guardar({ largo: v }, 'Cambió el largo del cuarto')} />
          <Medida label="Alto m" value={plano.alto} onChange={(v) => guardar({ alto: v }, 'Cambió la altura del cuarto')} />
          <Medida label="Piso" value={plano.piso} step={1} min={-1} onChange={(v) => guardar({ piso: v }, 'Cambió el cuarto de piso')} />
        </div>

        <label className="flex items-center gap-1.5">
          <span className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Muro</span>
          <input
            type="color"
            value={plano.muroColor ?? '#6d6259'}
            onChange={(e) => guardar({ muroColor: e.target.value }, 'Cambió el color de los muros')}
            className="h-7 w-9 cursor-pointer rounded border border-line bg-ink"
          />
          <input
            type="number"
            step="0.02"
            min="0.05"
            max="0.4"
            value={plano.muroGrosor ?? 0.12}
            onChange={(e) => guardar({ muroGrosor: num(e.target.value, 0.12) }, 'Cambió el grosor de los muros')}
            title="Grosor del muro en metros"
            className="w-16 rounded border border-line bg-ink px-1.5 py-1 text-[12px] text-cream outline-none"
          />
        </label>

        <span className="text-[11px] text-cream-3">
          {area.toFixed(1)} m² · {room.m2} m² declarados
        </span>

        <div className="ml-auto flex items-center gap-2">
          {[
            ['noche', 'Noche'],
            ['dia', 'Día'],
          ].map(([id, label]) => (
            <Chip key={id} activo={modo === id} onClick={() => setModo(id)}>
              {label}
            </Chip>
          ))}
          <Chip activo={simulando} onClick={() => setSimulando((v) => !v)}>
            Simular
          </Chip>
          <button
            onClick={onCerrar}
            className="rounded-lg bg-ember px-4 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-ember-2"
          >
            Listo
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ── paleta ── */}
        <aside className="w-[15rem] shrink-0 overflow-y-auto border-r border-line">
          <Grupo
            titulo="Mobiliario"
            right={
              ARRANQUE[tipo] && plano.items.length === 0 ? (
                <button onClick={arrancarCuarto} className="text-[10.5px] text-ember hover:underline">
                  amueblar
                </button>
              ) : null
            }
          >
            <div className="grid grid-cols-2 gap-1">
              {(POR_TIPO[tipo] ?? POR_TIPO.generico).map((k) => (
                <Chip
                  key={k}
                  activo={colocando?.clase === 'mueble' && colocando.tipo === k}
                  onClick={() => setColocando({ clase: 'mueble', tipo: k })}
                >
                  {MUEBLES[k].label}
                </Chip>
              ))}
            </div>
          </Grupo>

          <Grupo titulo="Instalación eléctrica">
            <div className="grid grid-cols-2 gap-1">
              {[
                ['enchufe', 'Enchufe'],
                ['apagador', 'Apagador'],
                ['salida', 'Salida de techo'],
              ].map(([t, label]) => (
                <Chip
                  key={t}
                  activo={colocando?.clase === 'punto' && colocando.tipo === t}
                  onClick={() => setColocando({ clase: 'punto', tipo: t })}
                >
                  {label}
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-[10.5px] leading-snug text-cream-3">
              Las líneas se trazan seleccionando dos puntos y usando “Unir con cable”.
            </p>
          </Grupo>

          <Grupo titulo={`Equipo levantado · ${porColocar.length}`}>
            {porColocar.length === 0 && (
              <p className="text-[11px] text-cream-3">
                Este cuarto no tiene equipo. Agrégalo desde el levantamiento y aparece aquí.
              </p>
            )}
            <div className="space-y-1">
              {porColocar.map(({ deviceId, faltan, total }) => {
                const d = DEVICE_BY_ID[deviceId]
                if (!d) return null
                return (
                  <button
                    key={deviceId}
                    disabled={faltan <= 0}
                    onClick={() => setColocando({ clase: 'equipo', deviceId })}
                    className={`w-full rounded-lg border px-2 py-1.5 text-left transition-colors ${
                      colocando?.deviceId === deviceId
                        ? 'border-ember bg-ember text-ink'
                        : faltan > 0
                          ? 'border-line text-cream-2 hover:border-cream/35'
                          : 'border-line/60 text-cream-3/50'
                    }`}
                  >
                    <span className="block truncate text-[11.5px]">{d.name}</span>
                    <span className="block text-[10px] opacity-70">
                      {faltan > 0 ? `${faltan} de ${total} por colocar` : `${total} colocados`}
                      {d.luz ? ` · ${d.luz.lm} lm` : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </Grupo>
        </aside>

        {/* ── lienzo ── */}
        <div className="relative min-w-0 flex-1">
          <Suspense fallback={<div className="grid h-full place-items-center text-[13px] text-cream-3">Cargando plano…</div>}>
            <Escena
              plano={plano}
              seleccion={seleccion}
              onSeleccionar={seleccionar}
              onMover={mover}
              onColocar={colocar}
              colocando={!!colocando}
              encendidos={encendidos}
              modo={modo}
              onAccionar={accionar}
              conRegla={conRegla}
              onMedida={medir}
              onGirar={girarA}
              midiendo={midiendo}
              onMidiendo={setMidiendo}
            />
          </Suspense>

          {uniendo && (
            <div className="absolute inset-x-0 top-3 flex flex-col items-center gap-1.5">
              <span className="rounded-full border border-thread bg-ink/90 px-3 py-1.5 text-[12px] text-thread">
                Elige el otro extremo del cable · Esc para cancelar
              </span>
              {/* también por lista: en 3D hay que atinarle a una caja de nueve
                  centímetros montada en el muro, y el cable es de lo que más
                  se traza. Que el modo preciso exista no obliga a usarlo. */}
              <div className="flex flex-wrap justify-center gap-1 rounded-xl border border-line bg-ink/92 p-1.5 backdrop-blur">
                {plano.items
                  .filter((i) => i.clase === 'punto' && i.id !== uniendo)
                  .map((i, n) => (
                    <button
                      key={i.id}
                      onClick={() => unirCon(i.id)}
                      className="rounded-lg border border-thread/40 px-2 py-1 text-[11px] text-thread-2 hover:bg-thread/15"
                    >
                      {i.tipo} {n + 1}
                    </button>
                  ))}
                {plano.items.filter((i) => i.clase === 'punto' && i.id !== uniendo).length === 0 && (
                  <span className="px-2 py-1 text-[11px] text-cream-3">Coloca otro punto para unirlo.</span>
                )}
              </div>
            </div>
          )}

          {midiendo && (
            <div className="absolute inset-x-0 top-3 flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-ember bg-ink/92 py-1.5 pr-1.5 pl-3.5 text-[12px] text-ember backdrop-blur">
                <span>
                  Midiendo el {midiendo === 'x' ? 'ancho' : 'largo'} · jala la flecha
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="1.2"
                  value={midiendo === 'x' ? plano.ancho : plano.largo}
                  onChange={(e) => Number(e.target.value) >= 1.2 && medir(midiendo, Number(e.target.value))}
                  className="w-20 rounded-lg border border-ember/40 bg-ink px-2 py-1 text-[12px] tabular-nums text-cream"
                />
                <button
                  onClick={() => setMidiendo(null)}
                  className="rounded-full bg-ember px-3 py-1 text-[12px] font-medium text-ink"
                >
                  Listo
                </button>
              </div>
            </div>
          )}

          {colocando && !midiendo && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
              <span className="rounded-full border border-ember bg-ink/90 px-3 py-1.5 text-[12px] text-ember">
                Haz clic en el piso para colocar · Esc para cancelar
              </span>
            </div>
          )}

          {/* lectura de iluminación: la respuesta que el plano viene a dar */}
          <div className="absolute bottom-3 left-3 rounded-xl border border-line bg-ink/92 px-3 py-2 backdrop-blur">
            <div className="flex items-baseline gap-2">
              <span className="display text-[20px] text-cream">{lux}</span>
              <span className="text-[11px] text-cream-3">lux medios · {Math.round(lumenes)} lm</span>
            </div>
            <p
              className={`mt-0.5 max-w-[24rem] text-[11px] leading-snug ${
                diag.nivel === 'ok' ? 'text-emerald-300' : diag.nivel === 'bajo' ? 'text-red-300' : 'text-ember-2'
              }`}
            >
              {diag.texto}
            </p>
          </div>
        </div>

        {/* ── inspector ── */}
        <aside className="w-[16rem] shrink-0 overflow-y-auto border-l border-line">
          {seleccionado ? (
            <Inspector
              item={seleccionado}
              onParchar={parchar}
              onGirar={girar}
              onQuitar={quitar}
              onUnir={() => setUniendo(seleccionado.id)}
              tramos={plano.tramos ?? []}
              onModulo={ponerModulo}
              onQuitarTramo={(tid) => guardar({ tramos: plano.tramos.filter((t) => t.id !== tid) }, 'Quitó una línea eléctrica')}
            />
          ) : (
            <Grupo titulo="Nada seleccionado">
              <p className="text-[11px] leading-relaxed text-cream-3">
                Toca una pieza del plano para moverla, girarla o ajustarla. Arrástrala para cambiarla de lugar.
              </p>
            </Grupo>
          )}

          <Automatizaciones nombre={room.nombre} />

          <Reglas
            reglas={plano.reglas ?? []}
            apagadores={apagadores}
            equipos={equipos}
            apagados={apagados}
            onAccionar={accionar}
            onGuardar={(reglas, que) => guardar({ reglas }, que)}
          />
        </aside>
      </div>
    </div>
  )
}

/* ── automatizaciones sugeridas ───────────────────────────────────
   Se buscan por el nombre del espacio, no por un id guardado: los espacios se
   renombran ("Recámara de Ana") y perder las sugerencias por eso sería tonto.

   Van aquí y no en una pantalla de escenas aparte porque es donde se decide:
   viendo el cuarto con sus dispositivos puestos es cuando uno se pregunta qué
   debería hacer solo. Y los comandos de voz son lo único que el cliente le
   enseña a sus visitas — si la frase suena rara, no la usa nadie. */

function Automatizaciones({ nombre }) {
  const esp = useMemo(() => {
    const n = nombre.toLowerCase()
    return (
      ESPACIOS.find((e) => e.autos?.length && n.includes(e.nombre.toLowerCase())) ??
      ESPACIOS.find((e) => e.autos?.length && e.nombre.toLowerCase().split(' ')[0] && n.includes(e.nombre.toLowerCase().split(' ')[0]))
    )
  }, [nombre])

  if (!esp?.autos?.length) return null

  return (
    <Grupo titulo={`Automatizaciones sugeridas · ${esp.autos.length}`}>
      <div className="space-y-2">
        {esp.autos.map((a) => (
          <div key={a.nombre} className="rounded-lg border border-line px-2 py-1.5">
            <p className="text-[11.5px] text-cream">{a.nombre}</p>
            <p className="mt-0.5 text-[10.5px] leading-snug text-cream-3">
              <span className="text-cream-2">Cuando</span> {a.cuando}
            </p>
            <p className="text-[10.5px] leading-snug text-cream-3">
              <span className="text-cream-2">Entonces</span> {a.entonces}
            </p>
            {a.voz?.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {a.voz.map((v) => (
                  <span key={v} className="rounded border border-thread/35 px-1.5 py-0.5 text-[10px] text-thread-2">
                    “{v}”
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-cream-3">
        Se programan en la puesta en marcha. Los comandos funcionan en HomePod mini y en Echo Dot.
      </p>
    </Grupo>
  )
}

/* ── inspector de la pieza seleccionada ───────────────────────── */

function Inspector({ item, onParchar, onGirar, onQuitar, onUnir, tramos, onQuitarTramo, onModulo }) {
  const dev = item.clase === 'equipo' ? DEVICE_BY_ID[item.deviceId] : null
  const p = item.params

  const titulo =
    item.clase === 'mueble' ? MUEBLES[item.tipo]?.label : item.clase === 'equipo' ? dev?.name : `Punto · ${item.tipo}`

  return (
    <Grupo
      titulo={titulo ?? 'Pieza'}
      right={
        <button onClick={() => onQuitar(item.id)} className="text-[10.5px] text-cream-3 hover:text-ember">
          quitar
        </button>
      }
    >
      {dev && (
        <p className="mb-2 text-[10.5px] text-cream-3">
          {dev.brand} · {CATEGORIES.find((c) => c.id === dev.cat)?.label}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onGirar(item.id)}
          className="flex-1 rounded-lg border border-line px-2 py-1 text-[11.5px] text-cream-2 hover:border-cream/35"
        >
          Girar 22°
        </button>
      </div>

      {/* Todo a mano además del arrastre: cuando el cliente da una medida
          exacta —"el buró va a 40 cm de la pared"— hay que poder escribirla. */}
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <Medida label="X m" value={item.x} min={-50} onChange={(v) => onParchar(item.id, { x: v })} />
        <Medida label="Z m" value={item.z} min={-50} onChange={(v) => onParchar(item.id, { z: v })} />
        <Medida
          label="Giro °"
          value={Math.round((((item.rot ?? 0) * 180) / Math.PI) % 360)}
          step={5}
          min={-360}
          onChange={(v) => onParchar(item.id, { rot: (v * Math.PI) / 180 })}
        />
      </div>

      {item.clase === 'punto' && item.tipo === 'apagador' && (
        <div className="mt-2 space-y-1.5 rounded-lg border border-line px-2 py-2">
          <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Cómo lo hacemos inteligente</p>
          {[
            ['atras', 'Módulo detrás del apagador', 'Se conserva el apagador que ya está. Necesita fondo en la caja.'],
            ['luminaria', 'Módulo en la luminaria', 'Cuando la caja no da o no hay neutro ahí.'],
            [null, 'Se cambia el apagador', 'Apagador inteligente completo, se ve distinto.'],
          ].map(([v, label, ayuda]) => (
            <button
              key={label}
              onClick={() => onModulo(item.id, v)}
              className={`block w-full rounded px-1.5 py-1 text-left transition-colors ${
                (item.modulo ?? null) === v ? 'bg-ember text-ink' : 'text-cream-2 hover:bg-cream/8'
              }`}
            >
              <span className="block text-[11px]">{label}</span>
              <span className={`block text-[10px] ${(item.modulo ?? null) === v ? 'text-ink/70' : 'text-cream-3'}`}>
                {ayuda}
              </span>
            </button>
          ))}
        </div>
      )}

      {item.clase === 'punto' && (
        <div className="mt-2 space-y-1">
          <button
            onClick={onUnir}
            className="w-full rounded-lg border border-thread/50 px-2 py-1 text-[11.5px] text-thread-2 hover:bg-thread/10"
          >
            Unir con cable →
          </button>
          {tramos
            .filter((t) => t.entre?.includes(item.id))
            .map((t, i) => (
              <button
                key={t.id}
                onClick={() => onQuitarTramo(t.id)}
                className="flex w-full items-center justify-between rounded border border-line px-2 py-0.5 text-[10.5px] text-cream-3 hover:border-ember hover:text-ember"
              >
                Cable {i + 1} <span>quitar</span>
              </button>
            ))}
        </div>
      )}

      {item.clase !== 'mueble' && (
        <div className="mt-2">
          <Medida
            label="Altura m"
            value={item.y ?? 0}
            min={0}
            onChange={(v) => onParchar(item.id, { y: v }, 'Cambió la altura de una pieza')}
          />
        </div>
      )}

      {/* Los parámetros fotométricos se editan por pieza, no por catálogo: en
          la misma casa el mismo foco va al 100 % en la cocina y al 30 % en la
          recámara, y el plano tiene que poder decir eso. */}
      {p && (
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Cómo ilumina</p>

          <label className="block">
            <span className="flex justify-between text-[11px] text-cream-3">
              Brillo <span className="text-cream-2">{p.brillo}%</span>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={p.brillo}
              onChange={(e) => onParchar(item.id, { params: { ...p, brillo: num(e.target.value) } })}
              className="w-full accent-[var(--color-ember)]"
            />
          </label>

          <label className="block">
            <span className="flex justify-between text-[11px] text-cream-3">
              Tono <span className="text-cream-2">{p.k} K</span>
            </span>
            <input
              type="range"
              min={dev?.luz?.k?.[0] ?? 2200}
              max={dev?.luz?.k?.[1] ?? 6500}
              step="50"
              value={p.k}
              onChange={(e) => onParchar(item.id, { params: { ...p, k: num(e.target.value) } })}
              className="w-full accent-[var(--color-ember)]"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <Medida
              label="Lúmenes"
              value={p.lm}
              step={50}
              min={0}
              onChange={(v) => onParchar(item.id, { params: { ...p, lm: v } }, 'Ajustó los lúmenes de una pieza')}
            />
            <Medida
              label="Haz °"
              value={p.haz}
              step={5}
              min={5}
              onChange={(v) => onParchar(item.id, { params: { ...p, haz: v } }, 'Ajustó el haz de una pieza')}
            />
          </div>
          <p className="text-[10px] leading-snug text-cream-3">
            Salen de la ficha del fabricante. Se ajustan aquí cuando la pieza real no se porta como dice la caja.
          </p>
        </div>
      )}
    </Grupo>
  )
}

/* ── reglas de comportamiento ─────────────────────────────────── */

function Reglas({ reglas, apagadores, equipos, apagados, onAccionar, onGuardar }) {
  const [nueva, setNueva] = useState(null)

  const nombreDe = (id) => {
    const e = equipos.find((x) => x.id === id)
    return e ? DEVICE_BY_ID[e.deviceId]?.name ?? 'dispositivo' : 'dispositivo'
  }

  const crear = (disparo) => setNueva({ id: uid('g'), disparo, destinos: [] })

  const alternarDestino = (id) =>
    setNueva((n) => ({ ...n, destinos: n.destinos.includes(id) ? n.destinos.filter((d) => d !== id) : [...n.destinos, id] }))

  const guardarNueva = () => {
    if (!nueva?.destinos.length) return
    onGuardar([...reglas.filter((r) => r.disparo !== nueva.disparo), nueva], 'Definió qué controla un apagador')
    setNueva(null)
  }

  return (
    <Grupo titulo={`Comportamiento · ${reglas.length}`}>
      {apagadores.length === 0 ? (
        <p className="text-[11px] leading-relaxed text-cream-3">
          Coloca un apagador para definir qué enciende. Es la parte que el cliente sí entiende del levantamiento.
        </p>
      ) : (
        <div className="space-y-2">
          {apagadores.map((ap, i) => {
            const regla = reglas.find((r) => r.disparo === ap.id)
            const editando = nueva?.disparo === ap.id
            return (
              <div key={ap.id} className="rounded-lg border border-line px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11.5px] text-cream-2">Apagador {i + 1}</span>
                  {/* Siempre accionable, sin modo aparte: el interruptor
                      también se toca directo en la escena, y tener que
                      acordarse de prender "Simular" antes era un paso que solo
                      servía para que la demostración fallara enfrente del
                      cliente. */}
                  <span className="flex items-center gap-2">
                    {regla && (
                      <button
                        onClick={() => onAccionar(ap.id)}
                        className="rounded border border-ember px-2 py-0.5 text-[10.5px] text-ember hover:bg-ember hover:text-ink"
                      >
                        accionar
                      </button>
                    )}
                    <button onClick={() => crear(ap.id)} className="text-[10.5px] text-cream-3 hover:text-ember">
                      {regla ? 'cambiar' : 'definir'}
                    </button>
                  </span>
                </div>

                {regla && !editando && (
                  <p className="mt-0.5 text-[10.5px] leading-snug text-cream-3">
                    Controla {regla.destinos.map(nombreDe).join(', ')}
                    {(
                      <span className="ml-1 text-cream-2">
                        · {regla.destinos.every((d) => apagados.has(d)) ? 'apagado' : 'encendido'}
                      </span>
                    )}
                  </p>
                )}

                {editando && (
                  <div className="mt-1.5 space-y-1">
                    {equipos.length === 0 && <p className="text-[10.5px] text-cream-3">No hay dispositivos colocados.</p>}
                    {equipos.map((e) => (
                      <label key={e.id} className="flex items-center gap-1.5 text-[11px] text-cream-2">
                        <input
                          type="checkbox"
                          checked={nueva.destinos.includes(e.id)}
                          onChange={() => alternarDestino(e.id)}
                          className="accent-[var(--color-ember)]"
                        />
                        {DEVICE_BY_ID[e.deviceId]?.name}
                      </label>
                    ))}
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={guardarNueva}
                        disabled={!nueva.destinos.length}
                        className="rounded bg-ember px-2 py-0.5 text-[10.5px] text-ink disabled:opacity-40"
                      >
                        guardar
                      </button>
                      <button onClick={() => setNueva(null)} className="text-[10.5px] text-cream-3">
                        cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Grupo>
  )
}
