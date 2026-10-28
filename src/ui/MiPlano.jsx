import { useCallback, useEffect, useRef, useState } from 'react'

import Logo from './Logo'
import PlanoAereo from './plano/PlanoAereo'

/**
 * El plano de la casa, para el cliente.
 *
 * Llega por un enlace —como el anexador y la guía— y se abre en el teléfono
 * sin cuenta. Ve sus espacios desde arriba y lo que se va a instalar en cada
 * uno, y puede acomodarlos: mover un cuarto, corregirle una medida, llevar un
 * foco al cuarto donde de verdad va. Lo que mueve llega al panel en vivo, y
 * lo que mueve el socio desde el panel le llega a él igual.
 *
 * Sin precios ni tiendas, igual que los otros enlaces: esto es la casa, no la
 * cotización.
 */

function aplicar(datos, cambios) {
  return {
    ...datos,
    espacios: datos.espacios.map((e) => {
      const c = cambios.find((x) => x.cuartoId === e.id)
      if (!c) return e
      return { ...e, plano: { ...(e.plano ?? {}), ...(c.plano ?? {}) }, items: { ...(e.items ?? {}), ...(c.items ?? {}) } }
    }),
  }
}

export default function MiPlano({ token }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [vivo, setVivo] = useState(false)
  const [guardando, setGuardando] = useState(0)
  const [falla, setFalla] = useState(false)
  const url = `/api/plano/${encodeURIComponent(token)}`
  const ultimo = useRef(0) // para no pisar lo que acabamos de mover con una foto vieja

  useEffect(() => {
    let vigente = true
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status === 404 ? 'enlace' : 'servidor'))))
      .then((d) => vigente && setDatos(d))
      .catch((e) => vigente && setError(e.message))

    /* En vivo: el servidor manda la foto completa del plano cada vez que
       alguien lo cambia. Si la conexión se cae, el navegador la reabre solo. */
    const es = new EventSource(`${url}/vivo`)
    es.onopen = () => setVivo(true)
    es.onerror = () => setVivo(false)
    es.onmessage = (m) => {
      try {
        const d = JSON.parse(m.data)
        // una foto que salió antes de nuestro último cambio llegaría a deshacerlo
        if (d.sello && d.sello < ultimo.current) return
        setDatos(d)
      } catch {
        // un mensaje roto no tumba la página: el siguiente trae todo
      }
    }
    return () => {
      vigente = false
      es.close()
    }
  }, [url])

  const aparato = useCallback((id) => datos?.aparatos?.[id] ?? null, [datos?.aparatos])

  const onCambios = useCallback(
    (cambios) => {
      setDatos((d) => (d ? aplicar(d, cambios) : d))
      setGuardando((n) => n + 1)
      setFalla(false)
      fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cambios }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no'))))
        .then((d) => {
          ultimo.current = d.sello ?? 0
          setDatos(d)
        })
        .catch(() => {
          setFalla(true)
          // lo que no se guardó no se queda en pantalla como si sí
          fetch(url)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d && setDatos(d))
        })
        .finally(() => setGuardando((n) => n - 1))
    },
    [url],
  )

  if (error)
    return (
      <main className="grid min-h-dvh place-items-center bg-ink px-6 text-center">
        <div>
          <h1 className="display text-[24px] text-cream">Este enlace no sirve</h1>
          <p className="mt-2 text-[13px] text-cream-3">
            {error === 'enlace' ? 'Puede estar incompleto. Pídenos que te lo mandemos otra vez.' : 'Vuelve a intentar en un momento.'}
          </p>
        </div>
      </main>
    )

  if (!datos) return <div className="min-h-dvh bg-ink" />

  return (
    <main className="flex h-dvh flex-col bg-ink">
      <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
        <Logo size={26} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] tracking-[0.14em] text-cream-3 uppercase">{datos.proyecto}</p>
          <h1 className="display truncate text-[20px] leading-tight text-cream">El plano de tu casa</h1>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <PlanoAereo
          espacios={datos.espacios}
          aparato={aparato}
          onCambios={onCambios}
          estado={
            <span className="ml-1 inline-flex items-center gap-1.5 border-l border-line pl-2.5">
              <span className={`h-1.5 w-1.5 rounded-full ${falla ? 'bg-red-400' : vivo ? 'bg-thread shadow-[0_0_8px_var(--color-thread)]' : 'bg-cream-3'}`} />
              {falla ? 'No se guardó' : guardando > 0 ? 'Guardando…' : vivo ? 'En vivo' : 'Conectando…'}
            </span>
          }
        />
      </div>
    </main>
  )
}
