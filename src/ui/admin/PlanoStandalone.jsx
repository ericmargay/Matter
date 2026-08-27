import { useEffect } from 'react'

import { paramsDelHash, useSurvey } from '../../store/survey'
import PlanoCuarto from './plano/PlanoCuarto'
import SinConexion from './SinConexion'

/**
 * El plano de UN cuarto, solo — `#/plano?proyecto=<id>&plano=<id>`.
 *
 * Es una URL propia y no la del proyecto: quien la abre no pasó primero por
 * el levantamiento ni por la cotización, así que esta página tampoco los
 * monta. Sólo trae lo que hace falta para dibujar ese cuarto —el store sigue
 * siendo el mismo, así que el ancla, el catálogo propio del proyecto y el
 * guardado en vivo funcionan igual que dentro del levantamiento— pero nunca
 * se arma la tabla de piezas, el desglose de costos ni la lista de los demás
 * espacios. Es la diferencia entre "abrir el proyecto para ver un cuarto" y
 * "abrir el cuarto".
 */
export default function PlanoStandalone() {
  const arrancar = useSurvey((s) => s.arrancar)
  const abrirProyecto = useSurvey((s) => s.abrirProyecto)
  const conexion = useSurvey((s) => s.conexion)
  const cargado = useSurvey((s) => s.cargado)
  const proyectos = useSurvey((s) => s.proyectos)
  const activoId = useSurvey((s) => s.activoId)

  const q = paramsDelHash()
  const proyectoId = q.get('proyecto')
  const cuartoId = q.get('plano')

  useEffect(() => {
    arrancar()
  }, [arrancar])

  /* El store guarda un solo proyecto "activo" a la vez —de ahí sale el
     catálogo propio y a dónde escribe `setPlano`— así que hay que dejarlo
     apuntando a éste antes de montar el editor, aunque nadie pase por la
     lista de proyectos para elegirlo. */
  useEffect(() => {
    if (cargado && proyectoId && proyectoId !== activoId) abrirProyecto(proyectoId)
  }, [cargado, proyectoId, activoId, abrirProyecto])

  if (conexion === 'sin-sesion' || conexion === 'sin-servidor') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-5">
        <SinConexion conexion={conexion} />
      </div>
    )
  }

  if (!proyectoId || !cuartoId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-5 text-center text-cream">
        <p className="text-[13px] text-cream-3">Falta decir qué proyecto y qué cuarto — la URL lleva `?proyecto=` y `?plano=`.</p>
      </div>
    )
  }

  if (!cargado || activoId !== proyectoId) {
    return <p className="min-h-screen bg-ink py-20 text-center text-[13px] text-cream-3">Cargando…</p>
  }

  const proyecto = proyectos.find((p) => p.id === proyectoId)
  const room = proyecto?.rooms?.find((r) => r.id === cuartoId)

  if (!proyecto || !room) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center px-5 text-center text-cream">
        <h1 className="display text-[20px]">No encontré ese cuarto.</h1>
        <p className="mt-2 text-[13px] text-cream-3">
          {!proyecto ? 'El proyecto no existe, o esta cuenta no tiene acceso a él.' : 'Ya no existe en este proyecto — puede que lo hayan borrado.'}
        </p>
        <a href="#/admin/proyectos" className="mt-5 text-[13px] text-ember hover:underline">
          Ir a proyectos
        </a>
      </div>
    )
  }

  return (
    <PlanoCuarto
      room={room}
      onCerrar={() => {
        window.location.hash = `#/admin/levantamiento?proyecto=${proyectoId}`
      }}
    />
  )
}
