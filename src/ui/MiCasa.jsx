import { useEffect, useMemo, useState } from 'react'

import { DEVICE_BY_ID } from '../content/catalog'
import { armarGuia } from '../content/guia'
import Logo from './Logo'

/**
 * La guía que se le manda al cliente: qué puede pedirle a su casa.
 *
 * Se arma sola desde el levantamiento, así que no envejece. Si mañana se le
 * suma un sensor o se le quita una cortina, la guía cambia sin que nadie la
 * reescriba — que es la única forma de que a los seis meses siga diciendo la
 * verdad.
 *
 * Va por el mismo enlace firmado que el anexador y comparte su regla: solo
 * lee, y solo de su proyecto. Sin precios, sin proveedores, sin nada de
 * operación — el servidor devuelve el nombre de cada espacio y qué hay en él,
 * y de ahí sale todo lo demás en el navegador.
 */
export default function MiCasa({ token }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [abierto, setAbierto] = useState(null)

  useEffect(() => {
    let vivo = true
    fetch(`/api/guia/${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? 'enlace' : 'servidor'))))
      .then((d) => vivo && setDatos(d))
      .catch((e) => vivo && setError(e.message))
    return () => {
      vivo = false
    }
  }, [token])

  const guia = useMemo(() => (datos ? armarGuia(datos.rooms ?? [], DEVICE_BY_ID) : null), [datos])

  if (error)
    return (
      <main className="grid min-h-screen place-items-center bg-ink px-6 text-center">
        <div>
          <h1 className="display text-[24px] text-cream">Este enlace no sirve</h1>
          <p className="mt-2 text-[13px] text-cream-3">
            {error === 'enlace' ? 'Puede estar incompleto. Pídenos que te lo mandemos otra vez.' : 'Vuelve a intentar en un momento.'}
          </p>
        </div>
      </main>
    )

  if (!datos || !guia) return <div className="min-h-screen bg-ink" />

  return (
    <main className="min-h-screen bg-ink px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="border-b border-line py-6">
          {/* La marca en grande. Esta página llega por WhatsApp a alguien que
              no la pidió: si no se ve de quién es en el primer vistazo, se
              cierra sin leer. */}
          <div className="flex items-center gap-2.5">
            <Logo size={34} />
            <span className="display text-[30px] leading-none tracking-tight text-cream">Matter</span>
          </div>
          <p className="mt-3 text-[10px] tracking-[0.14em] text-cream-3 uppercase">{datos.proyecto}</p>
          <h1 className="display mt-1 text-[26px] leading-tight text-cream sm:text-[32px]">
            Qué le puedes pedir a tu casa
          </h1>
          <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-cream-2">
            Esta guía se arma sola con lo que hay instalado. Si mañana sumamos o quitamos algo, cambia sola — no
            hay una versión vieja dando vueltas.
          </p>
          <p className="mt-2 text-[12px] text-cream-3">
            {guia.piezas} piezas · {guia.espacios.length} espacios
          </p>
        </header>

        {guia.rutinas.length > 0 && (
          <section className="py-6">
            <h2 className="display text-[19px] text-cream">Las cuatro que vas a usar todos los días</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-cream-3">
              Si solo te aprendes esto, ya sacaste la mitad del provecho.
            </p>
            <div className="mt-3 space-y-2">
              {guia.rutinas.map((r) => (
                <div key={r.id} className="rounded-xl border border-ember/30 bg-ember/[0.05] px-3.5 py-3">
                  <p className="text-[14px] text-cream">{r.titulo}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-cream-2">{r.texto}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.voz.map((v) => (
                      <span key={v} className="rounded-full border border-thread/40 px-2.5 py-1 text-[11.5px] text-thread-2">
                        “{v}”
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-line py-6">
          <h2 className="display text-[19px] text-cream">Espacio por espacio</h2>
          <div className="mt-3 space-y-1.5">
            {guia.espacios.map((e) => {
              const on = abierto === e.nombre
              return (
                <div key={e.nombre} className="overflow-hidden rounded-xl border border-line">
                  <button
                    onClick={() => setAbierto(on ? null : e.nombre)}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-cream/[0.04]"
                  >
                    <span className="text-[14px] text-cream">{e.nombre}</span>
                    <span className="shrink-0 text-[11.5px] text-cream-3">
                      {e.puede.length} cosas {on ? '−' : '+'}
                    </span>
                  </button>

                  {on && (
                    <div className="space-y-2.5 border-t border-line px-3.5 py-3">
                      {e.puede.map((p) => (
                        <div key={p.id}>
                          <p className="text-[13px] text-cream">{p.titulo}</p>
                          <p className="mt-0.5 text-[12.5px] leading-relaxed text-cream-2">{p.texto}</p>
                          {p.voz?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {p.voz.map((v) => (
                                <span
                                  key={v}
                                  className="rounded-full border border-thread/35 px-2 py-0.5 text-[11px] text-thread-2"
                                >
                                  “{v}”
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="border-t border-line py-6">
          <h2 className="display text-[19px] text-cream">Si algo deja de responder</h2>
          <ol className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-cream-2">
            <li>1. Apaga y prende el aparato desde el apagador de pared. Nueve de cada diez veces con eso vuelve.</li>
            <li>2. Revisa que el internet esté funcionando en el teléfono.</li>
            <li>3. Reinicia el módem y espera tres minutos completos antes de probar.</li>
            <li>4. Si sigue, escríbenos con el nombre del espacio y qué aparato es. No hace falta que sepas el modelo.</li>
          </ol>
        </section>
      </div>
    </main>
  )
}
