import { useEffect, useState } from 'react'

/**
 * Cómo se le pasa algo al cliente.
 *
 * El catálogo, el plano, la cotización y el anexador viajan hoy con doscientos
 * caracteres de token. Por WhatsApp eso se ve a estafa: llega un muro de
 * letras y el cliente duda antes de tocarlo — y con razón, porque así se ven
 * los enlaces que uno no debe tocar. Siete caracteres se ven a enlace.
 *
 * El código se pide al servidor la primera vez y se queda: el mismo destino
 * siempre devuelve el mismo código, así que reenviar no multiplica enlaces ni
 * invalida el que ya se mandó.
 */
export default function Compartir({ destino, etiqueta, titulo, ayuda }) {
  const [corto, setCorto] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [falla, setFalla] = useState(false)

  useEffect(() => {
    if (!destino) return
    let vivo = true
    setCorto(null)
    setFalla(false)
    fetch('/api/acortar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ destino, etiqueta }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no'))))
      .then((d) => vivo && setCorto(`${window.location.origin}/i/${d.codigo}`))
      .catch(() => vivo && setFalla(true))
    return () => {
      vivo = false
    }
  }, [destino, etiqueta])

  // si el acortador no responde se manda el largo: es feo pero funciona, y es
  // mejor que dejar a alguien sin poder compartir en casa del cliente
  const url = corto ?? (falla ? destino : null)
  if (!url) return null

  /* Clases literales, no interpoladas: Tailwind compila leyendo el código
     fuente, y una clase armada con plantilla nunca llega a la hoja de estilo
     —el componente saldría sin color y sin borde—. */
  return (
    <div className="rounded-xl border border-thread/30 bg-thread/[0.05] px-3 py-2.5">
      <p className="text-[10px] tracking-[0.12em] text-thread uppercase">{titulo}</p>
      {ayuda && <p className="mt-1 text-[11px] leading-relaxed text-cream-2">{ayuda}</p>}
      <div className="mt-2 flex gap-1.5">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded border border-line bg-ink px-2 py-1 text-[11px] text-cream-2"
        />
        <button
          onClick={() => {
            navigator.clipboard?.writeText(url)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 1800)
          }}
          className="shrink-0 rounded border border-thread px-2.5 py-1 text-[11px] text-thread-2 transition-colors hover:bg-thread/15"
        >
          {copiado ? 'copiado' : 'copiar'}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded border border-line px-2.5 py-1 text-[11px] text-cream-3 transition-colors hover:border-cream/40"
        >
          WhatsApp
        </a>
      </div>
      {falla && <p className="mt-1 text-[10px] text-cream-3">El acortador no respondió; va el enlace completo.</p>}
    </div>
  )
}
