import { useEffect, useRef, useState } from 'react'

import { useTonos, useVoz } from '../asistente/voz'
import OndaSiri from './OndaSiri'
import Telefono from './Telefono'

/**
 * Siri, como se ve y se oye en el teléfono de verdad.
 *
 * Sustituye al asistente sencillo cuando el que atiende la escena es Siri, y
 * la razón es la misma que ya sostenía al otro: al cliente no lo convence la
 * lista de comandos, lo convence ver el comportamiento. Sólo que ahora el
 * comportamiento incluye la forma. Nadie le habla a un letrero flotante; le
 * habla a su iPhone, y ver el iPhone —con su barra de estado, su isla y la
 * onda subiendo desde el canto de abajo— es lo que hace que la maqueta se lea
 * como la casa y no como una diapositiva.
 *
 * En pantalla chica no se dibuja el marco. Ya estás en el teléfono: lo único
 * que falta es la onda y el mensaje, exactamente como sale encima de lo que
 * estuvieras haciendo.
 *
 * La secuencia es la del aparato, y el orden es lo que comunica:
 *
 *   1. tono de entrada, la onda se abre desde abajo      (te está oyendo)
 *   2. la frase se escribe sola, palabra por palabra      (te entendió)
 *   3. la onda baja de energía y late                     (lo está haciendo)
 *   4. tono de salida, contesta hablando                  ("Listo")
 *   5. y HASTA ENTONCES cambia el cuarto
 *
 * Si el cuarto cambiara antes de la respuesta se rompería la relación de
 * causa, que es lo único que el cliente está leyendo.
 *
 * @param peticion  { voz, dice }  lo que se pidió y lo que contesta
 * @param onHacer   se llama al terminar de responder: entonces cambia el cuarto
 * @param conVoz    si habla o sólo suena
 */
export default function Siri({ peticion, onHacer, conVoz = true }) {
  const [fase, setFase] = useState(null) // 'oyendo' | 'pensando' | 'listo' | 'saliendo'
  const [dicho, setDicho] = useState('')
  const compacto = useCompacto()
  const hora = useHora()
  const tonos = useTonos()
  const hablar = useVoz()
  const relojes = useRef([])

  useEffect(() => () => relojes.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (!peticion) return
    relojes.current.forEach(clearTimeout)
    relojes.current = []
    const en = (ms, fn) => relojes.current.push(setTimeout(fn, ms))

    tonos.entrada()
    setFase('oyendo')
    setDicho('')

    /* La frase se escribe palabra por palabra mientras "oye". Es el detalle
       que más delata al aparato de verdad: el texto no aparece completo, se
       va formando con retraso sobre la voz. */
    const palabras = peticion.voz.split(' ')
    palabras.forEach((_, i) => {
      en(180 + i * 115, () => setDicho(palabras.slice(0, i + 1).join(' ')))
    })
    const dictado = 180 + palabras.length * 115

    en(dictado + 260, () => setFase('pensando'))
    en(dictado + 900, () => {
      setFase('listo')
      /* Aquí NO va tono de cierre. Ese "din-don" de terminado es de Alexa;
         Siri cierra hablando y apagando el borde, y nada más. Ponerle el
         sonido del otro es de las cosas que el cliente nota sin poder decir
         qué le sonó mal. */
      if (conVoz) hablar(peticion.dice)
      onHacer?.()
    })
    /* Se va como llegó: primero se apaga, y hasta que terminó de apagarse se
       desmonta. Un teléfono que desaparece de un cuadro se siente a error. */
    en(dictado + 4600, () => setFase('saliendo'))
    en(dictado + 5050, () => setFase(null))
    // arranca con la petición, no con que cambien sus manejadores
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peticion])

  if (!peticion || !fase) return null

  /* Al irse sigue enseñando lo mismo que al contestar: lo que cambia es la
     opacidad, no el contenido. */
  const vista = fase === 'saliendo' ? 'listo' : fase
  const anim = fase === 'saliendo' ? 'siri-sale' : 'siri-entra'

  /* La onda: ancha y viva mientras oye, angosta y tranquila mientras piensa,
     y casi quieta al contestar. Un solo par de números cuenta las tres. */
  const energia = vista === 'oyendo' ? 1 : vista === 'pensando' ? 0.5 : 0.24
  const brillo = vista === 'listo' ? 0.72 : 1

  const conversacion = (
    <Conversacion fase={vista} dicho={dicho} peticion={peticion} compacto={compacto} />
  )

  if (compacto) {
    return (
      <>
        {/* El borde de la pantalla, encendido. En el teléfono de verdad ésta
            es LA señal de que Siri está puesta: no hay ventana ni tarjeta, se
            ilumina la orilla de todo lo que estés viendo. */}
        <div className={`pointer-events-none fixed inset-0 z-[59] ${anim}`}>
          <BordeVivo fase={vista} radio={34} className="absolute inset-0" />
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-3 pb-5">
          {/* Un velo que sube desde el canto. En el teléfono la onda cae
              encima de lo que estuvieras haciendo, y sin el velo el texto
              blanco se pierde contra cualquier cosa clara que hubiera abajo. */}
          <div
            className="absolute inset-x-0 bottom-0 -z-10 h-[360px]"
            style={{
              background:
                'linear-gradient(to top, rgba(5,7,12,.96) 0%, rgba(5,7,12,.9) 40%, rgba(5,7,12,.6) 70%, transparent 100%)',
            }}
          />
          <div className={`mx-auto max-w-md ${anim}`}>
            {conversacion}
            <OndaSiri abierto={1} energia={energia} brillo={brillo} className="h-[96px] w-full" />
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
      {/* el cuarto se atenúa mientras el teléfono manda: es a lo que ve el
          ojo cuando alguien levanta el celular */}
      <div className={`absolute inset-0 bg-ink/45 backdrop-blur-[2px] ${anim}`} />
      <div className={`relative ${anim}`}>
        <Telefono hora={hora}>
          <div className="flex min-h-0 flex-1 flex-col justify-end px-5 pb-1">
            {vista === 'listo' && <Tarjetas detalle={peticion.detalle} />}
            {conversacion}
          </div>
          <OndaSiri abierto={1} energia={energia} brillo={brillo} className="h-[110px] w-full shrink-0" />
          <BordeVivo fase={vista} radio={44} className="absolute inset-0" />
        </Telefono>
      </div>
    </div>
  )
}

/**
 * El borde encendido.
 *
 * Es el aviso de Siri, y es lo que la separa de los demás: Alexa contesta con
 * un anillo azul en la bocina y un sonido de cierre; Siri no suena al
 * terminar —enciende la orilla de la pantalla y la apaga—. Por eso el tono de
 * salida se quedó sólo del otro lado.
 *
 * Cómo está hecho: un degradado cónico que da la vuelta, recortado a un
 * anillo con dos máscaras que se restan, y desenfocado para que se lea como
 * luz y no como marco.
 */
function BordeVivo({ fase, radio, className = '' }) {
  /* Fuerte mientras oye, más tranquilo —y más rápido— mientras piensa, y casi
     apagado al contestar: el borde cuenta la misma historia que la onda. */
  const fuerza = fase === 'oyendo' ? 0.92 : fase === 'pensando' ? 0.66 : 0.18
  const vuelta = fase === 'pensando' ? 2.6 : 5.2

  return (
    <div
      className={`siri-bordes pointer-events-none ${className}`}
      style={{ borderRadius: radio, opacity: fuerza, animationDuration: `${vuelta}s` }}
      aria-hidden="true"
    />
  )
}

/**
 * Lo que Siri movió, en tarjetas.
 *
 * Salen DESPUÉS de contestar y una por una, no todas de golpe: así se lee como
 * la casa obedeciendo en orden, que es lo que de verdad pasa —los focos no
 * cambian todos en el mismo milisegundo—. Y llevan marca y modelo a propósito:
 * es la línea entre enseñar un truco y enseñar una instalación.
 */
function Tarjetas({ detalle }) {
  if (!detalle?.length) return null
  const visibles = detalle.slice(0, 5)
  const resto = detalle.length - visibles.length

  return (
    <div className="mb-3 space-y-1.5">
      {visibles.map((d, i) => (
        <div
          key={d.id}
          className="siri-tarjeta flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/8 px-3 py-2 backdrop-blur-sm"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5eead4] shadow-[0_0_8px_#5eead4]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] leading-tight text-white/90">{d.nombre}</span>
            <span className="block truncate text-[10.5px] leading-tight text-white/45">
              {d.marca} · {d.hace}
            </span>
          </span>
          {d.n > 1 && (
            <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10.5px] text-white/70 tabular-nums">
              ×{d.n}
            </span>
          )}
        </div>
      ))}
      {resto > 0 && <p className="pl-1 text-[10.5px] text-white/45">y {resto} más</p>}
    </div>
  )
}

/** Lo dicho y lo contestado, con la misma jerarquía que en el teléfono. */
function Conversacion({ fase, dicho, peticion, compacto }) {
  return (
    <div className={compacto ? 'mb-1 text-center' : 'mb-3'}>
      <p
        className={`text-white/95 ${compacto ? 'text-[17px]' : 'text-[19px]'} leading-snug font-medium`}
        style={{ textShadow: '0 2px 18px rgba(0,0,0,.55)' }}
      >
        {dicho}
        {fase === 'oyendo' && <Cursor />}
      </p>
      {fase !== 'oyendo' && (
        <p
          className={`mt-2 leading-snug text-white/70 ${compacto ? 'text-[14px]' : 'text-[15px]'}`}
          style={{ textShadow: '0 2px 18px rgba(0,0,0,.55)' }}
        >
          {fase === 'listo' ? peticion.dice : 'Un momento…'}
        </p>
      )}
    </div>
  )
}

const Cursor = () => (
  <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-white/70 siri-cursor" />
)

/* ── el tamaño y la hora ──────────────────────────────────────────── */

/** Bajo 640 px no cabe un teléfono dibujado, y tampoco hace falta. */
function useCompacto() {
  const [c, setC] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const ver = () => setC(mq.matches)
    mq.addEventListener('change', ver)
    return () => mq.removeEventListener('change', ver)
  }, [])
  return c
}

/** La hora de verdad. Un 9:41 pegado delata la maqueta a la primera. */
function useHora() {
  const leer = () =>
    new Date().toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: false })
  const [h, setH] = useState(leer)
  useEffect(() => {
    const id = setInterval(() => setH(leer()), 20000)
    return () => clearInterval(id)
  }, [])
  return h
}
