import { useCallback, useEffect, useRef, useState } from 'react'

import Inventario from './Inventario'

/**
 * La página que se le manda al cliente.
 *
 * Un enlace, sin cuenta y sin contraseña: el token firmado ES la credencial, y
 * abre exactamente una cosa —el inventario de su proyecto—. No hay forma de
 * llegar al levantamiento, ni a los precios, ni al catálogo de operaciones,
 * porque el servidor solo devuelve esos tres campos.
 *
 * Guarda solo. Pedirle a alguien que conteste desde el teléfono, parado en su
 * sala, que además se acuerde de picar "guardar" es perder la mitad de las
 * respuestas. Se manda un segundo después del último toque, y el estado se
 * dice en una línea para que se note que sí quedó.
 */
export default function MiEquipo({ token }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [estado, setEstado] = useState('listo')
  const pendiente = useRef(null)

  useEffect(() => {
    let vivo = true
    fetch(`/api/inventario/${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? 'enlace' : 'servidor'))))
      .then((d) => vivo && setDatos(d))
      .catch((e) => vivo && setError(e.message))
    return () => {
      vivo = false
    }
  }, [token])

  const guardar = useCallback(
    (inv) => {
      setDatos((d) => ({ ...d, inv }))
      setEstado('guardando')
      clearTimeout(pendiente.current)
      pendiente.current = setTimeout(() => {
        fetch(`/api/inventario/${encodeURIComponent(token)}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ inv }),
        })
          .then((r) => setEstado(r.ok ? 'guardado' : 'error'))
          .catch(() => setEstado('error'))
      }, 900)
    },
    [token],
  )

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

  if (!datos) return <div className="min-h-screen bg-ink" />

  return (
    <main className="min-h-screen bg-ink px-4 pb-24 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="border-b border-line py-6">
          <p className="text-[10px] tracking-[0.14em] text-cream-3 uppercase">Matter · {datos.proyecto}</p>
          <h1 className="display mt-1 text-[26px] leading-tight text-cream sm:text-[32px]">
            ¿Qué ya tienes en casa?
          </h1>
          <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-cream-2">
            Anexa lo que ya haya —teléfonos, bocinas, focos, la tele—. Con eso ajustamos la propuesta: lo que ya
            tienes no te lo volvemos a cobrar, y saber con qué marcas llegas cambia lo que conviene poner.
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-cream-3">
            No tienes que saber los modelos. Si no sabes, déjalo en blanco o toca “No sé cuál”.
          </p>
        </header>

        <div className="py-6">
          <Inventario inv={datos.inv ?? []} onCambiar={guardar} espacios={datos.espacios ?? []} modo="cliente" />
        </div>
      </div>

      {/* el estado del guardado, fijo abajo: se contesta desde el teléfono y
          hay que ver que quedó sin tener que subir a buscarlo */}
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-ink/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <span className="text-[12px] text-cream-3">
            {estado === 'guardando' && 'Guardando…'}
            {estado === 'guardado' && 'Guardado. Ya lo vemos de nuestro lado.'}
            {estado === 'listo' && 'Se guarda solo conforme vas anexando.'}
            {estado === 'error' && 'No se pudo guardar. Revisa tu conexión.'}
          </span>
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              estado === 'error' ? 'bg-red-500' : estado === 'guardando' ? 'bg-ember' : 'bg-emerald-500'
            }`}
          />
        </div>
      </div>
    </main>
  )
}
