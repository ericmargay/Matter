import { useEffect, useState } from 'react'
import { brand } from '../../content/site'
import { USING_DEMO_RATES, quote } from '../../content/pricing'
import { paramsDelHash, useProyecto, useSurvey } from '../../store/survey'
import Logo from '../Logo'
import Catalog from './Catalog'
import Escuela from './Escuela'
import Taller from './Taller'
import { Avatar } from './Historial'
import Projects from './Projects'
import SinConexion from './SinConexion'
import Suppliers from './Suppliers'
import Survey from './Survey'

/**
 * Panel de operaciones.
 *
 * No es parte del sitio público: es la herramienta interna con la que se arma
 * un levantamiento y sale la cotización. Por eso la densidad es otra — aquí sí
 * queremos tabla, filtros y números por metro cuadrado.
 *
 * El orden de las secciones es el orden del trabajo: primero el PROYECTO,
 * después el levantamiento dentro de él. Entrar a levantar sin proyecto abierto
 * no está permitido, y no por rigor burocrático: sin proyecto no hay dónde
 * guardar lo que se captura, que era justo el error de la versión anterior.
 *
 * Vive en #/admin, detrás del login que sirve `server/index.js`.
 */

const SECCIONES = [
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'levantamiento', label: 'Levantamiento', requiereProyecto: true },
  /* No pide proyecto abierto: se consulta parado en la sala del cliente, con
     el teléfono, antes de haber creado nada. */
  { id: 'escuela', label: 'Qué saber' },
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'taller', label: 'Material y herramienta' },
]

/** Lo que se ve al entrar a levantar sin proyecto abierto. */
function SinProyecto() {
  const proyectos = useSurvey((s) => s.proyectos)
  const abrir = useSurvey((s) => s.abrirProyecto)
  const recientes = [...proyectos]
    .filter((p) => !p.archivado)
    .sort((a, b) => new Date(b.tocado) - new Date(a.tocado))
    .slice(0, 4)

  const entrar = (id) => {
    abrir(id)
    window.location.hash = '#/admin/levantamiento'
  }

  return (
    <div className="mx-auto max-w-[560px] rounded-xl border border-dashed border-line px-6 py-14 text-center">
      <p className="eyebrow">Paso 1 de 2</p>
      <h1 className="display mt-2 text-[26px] text-cream">Primero el proyecto.</h1>
      <p className="mx-auto mt-3 max-w-[48ch] text-[13px] leading-relaxed text-cream-3">
        El levantamiento se hace dentro de un proyecto: así queda con nombre, dirección y folio, no se pisa
        con el de otra casa y se puede retomar la semana que entra.
      </p>

      <a
        href="#/admin/proyectos"
        className="mt-6 inline-block rounded-lg bg-ember px-5 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-ember-2"
      >
        Ir a proyectos
      </a>

      {recientes.length > 0 && (
        <div className="mt-8 border-t border-line pt-5">
          <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">O retoma uno</p>
          <div className="mt-2.5 space-y-1.5">
            {recientes.map((p) => (
              <button
                key={p.id}
                onClick={() => entrar(p.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-left transition-colors hover:border-ember/50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] text-cream">{p.nombre}</span>
                  <span className="block truncate text-[11px] text-cream-3">
                    {p.folio} · {p.rooms.length} cuartos
                  </span>
                </span>
                <span className="text-[11.5px] whitespace-nowrap text-ember">Abrir →</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── estado de la conexión ────────────────────────────────────────
   Es la información más importante de la pantalla cuando algo va mal: si el
   socket está caído lo que estás capturando NO le está llegando a nadie, y eso
   tiene que verse sin buscarlo. */
function Conexion() {
  const conexion = useSurvey((s) => s.conexion)
  const cola = useSurvey((s) => s.enCola)
  const conectados = useSurvey((s) => s.conectados)
  const yo = useSurvey((s) => s.yo)

  if (conexion === 'listo') {
    const otros = conectados.filter((u) => u !== yo)
    return (
      <span className="flex items-center gap-1.5" title="Cambios sincronizados en vivo">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {otros.length > 0 ? (
          <>
            {otros.map((u) => (
              <Avatar key={u} usuario={u} size={18} />
            ))}
            <span className="text-[11px] text-cream-3">en línea</span>
          </>
        ) : (
          <span className="text-[11px] text-cream-3">solo tú</span>
        )}
      </span>
    )
  }

  const aviso = {
    conectando: ['bg-ember', 'Conectando…'],
    caido: ['bg-red-400', cola > 0 ? `Sin conexión · ${cola} cambios en cola` : 'Sin conexión'],
    'sin-sesion': ['bg-red-400', 'Sin sesión'],
    'sin-servidor': ['bg-red-400', 'Sin servidor'],
  }[conexion] ?? ['bg-cream-3', conexion]

  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${aviso[0]}`} />
      <span className="text-[11px] text-cream-2">{aviso[1]}</span>
      {conexion === 'sin-sesion' && (
        <a href="/panel/login" className="text-[11px] text-ember hover:underline">
          Entrar
        </a>
      )}
    </span>
  )
}

export default function Admin({ section = 'proyectos' }) {
  const [tab, setTab] = useState(section)
  useEffect(() => setTab(section), [section])

  const proyecto = useProyecto()
  const cerrar = useSurvey((s) => s.cerrarProyecto)
  const arrancar = useSurvey((s) => s.arrancar)
  const conexion = useSurvey((s) => s.conexion)
  const cargado = useSurvey((s) => s.cargado)

  useEffect(() => {
    arrancar()
  }, [arrancar])

  /* Enlace directo a un proyecto: `#/admin/levantamiento?proyecto=<id>`.
     Lo usa el script que abre la superficie de trabajo, y sirve igual para
     mandarle a un socio el proyecto exacto del que estás hablando. */
  const abrirProyecto = useSurvey((s) => s.abrirProyecto)
  useEffect(() => {
    if (!cargado) return
    const aplicar = () => {
      const pedido = paramsDelHash().get('proyecto')
      if (pedido && pedido !== useSurvey.getState().activoId) abrirProyecto(pedido)
    }
    aplicar()
    window.addEventListener('hashchange', aplicar)
    return () => window.removeEventListener('hashchange', aplicar)
  }, [cargado, abrirProyecto])

  const q = proyecto
    ? quote({ obra: proyecto.obra, rooms: proyecto.rooms, extras: proyecto.extras })
    : null

  const seccion = SECCIONES.find((s) => s.id === tab) ?? SECCIONES[0]
  const bloqueada = seccion.requiereProyecto && !proyecto

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-cream">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-5 py-3">
          <a href="#/" className="flex items-center gap-2.5 text-cream">
            <Logo size={20} spin={false} />
            <span className="display text-[17px]">{brand.name}</span>
          </a>
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] tracking-[0.14em] text-cream-3 uppercase">
            Operaciones
          </span>

          <nav className="ml-3 flex flex-wrap gap-1 text-[12px]">
            {SECCIONES.map((s) => {
              const off = s.requiereProyecto && !proyecto
              return (
                <a
                  key={s.id}
                  href={`#/admin/${s.id}`}
                  onClick={() => setTab(s.id)}
                  title={off ? 'Necesita un proyecto abierto' : undefined}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    tab === s.id
                      ? 'bg-cream/10 text-cream'
                      : off
                        ? 'text-cream-3/45 hover:text-cream-3'
                        : 'text-cream-3 hover:text-cream-2'
                  }`}
                >
                  {s.label}
                </a>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <Conexion />

            {/* el proyecto abierto viaja siempre visible: es el contexto de
                todo lo que se toca en las otras secciones */}
            {proyecto ? (
              <span className="flex items-center gap-2 text-[11.5px]">
                <span className="max-w-[16rem] truncate text-cream-2">{proyecto.nombre}</span>
                <span className="text-cream-3">
                  {q.piezas} pzs ·{' '}
                  <strong className="text-ember">${Math.round(q.total).toLocaleString('es-MX')}</strong>
                </span>
                <button
                  onClick={cerrar}
                  title="Cerrar el proyecto y volver a la lista"
                  className="text-cream-3 transition-colors hover:text-ember"
                >
                  ×
                </button>
              </span>
            ) : (
              <span className="text-[11.5px] text-cream-3">Sin proyecto abierto</span>
            )}

            <a href="#/catalogo" className="text-[12px] text-cream-3 transition-colors hover:text-cream">
              Catálogo cliente
            </a>
            {/* el logout es POST: un GET lo dispararía cualquier imagen o
                prefetch del navegador */}
            <form method="post" action="/panel/logout">
              <button type="submit" className="text-[12px] text-cream-3 transition-colors hover:text-ember">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-6">
        {USING_DEMO_RATES && (
          <p className="mb-4 rounded-lg border border-ember/30 bg-ember/8 px-3 py-2 text-[12px] text-cream-2">
            <strong className="text-ember">Tarifas de demostración.</strong> Los costos de mano de obra y
            servicios son inventados y están en el repositorio público. Para trabajar con los reales:{' '}
            <code className="text-cream">cp src/content/rates.local.example.js src/content/rates.local.js</code>{' '}
            — ese archivo no se versiona.
          </p>
        )}

        {conexion === 'sin-sesion' || conexion === 'sin-servidor' ? (
          <SinConexion conexion={conexion} />
        ) : !cargado ? (
          <p className="py-20 text-center text-[13px] text-cream-3">Cargando proyectos…</p>
        ) : bloqueada ? (
          <SinProyecto />
        ) : tab === 'proyectos' ? (
          <Projects />
        ) : tab === 'escuela' ? (
          <Escuela />
        ) : tab === 'catalogo' ? (
          <Catalog />
        ) : tab === 'proveedores' ? (
          <Suppliers />
        ) : tab === 'taller' ? (
          <Taller />
        ) : (
          <Survey />
        )}
      </main>
    </div>
  )
}
