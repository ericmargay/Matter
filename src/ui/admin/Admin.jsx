import { useEffect, useState } from 'react'
import { brand } from '../../content/site'
import { USING_DEMO_RATES, quote } from '../../content/pricing'
import { useSurvey } from '../../store/survey'
import Logo from '../Logo'
import Catalog from './Catalog'
import Survey from './Survey'

/**
 * Panel de operaciones.
 *
 * No es parte del sitio público: es la herramienta interna con la que se
 * arma un levantamiento y sale la cotización. Por eso la densidad es otra —
 * aquí sí queremos tabla, filtros y números por metro cuadrado.
 *
 * Vive en #/admin. Está detrás de un hash y no está enlazado desde el nav,
 * pero NO tiene autenticación: antes de publicar hay que ponerle una.
 */

const SECTIONS = [
  { id: 'levantamiento', label: 'Levantamiento' },
  { id: 'catalogo', label: 'Catálogo' },
]

const PENDIENTES = ['Proyectos', 'Inventario', 'Proveedores']

export default function Admin({ section = 'levantamiento' }) {
  const [tab, setTab] = useState(section)
  useEffect(() => setTab(section), [section])

  const rooms = useSurvey((s) => s.rooms)
  const obra = useSurvey((s) => s.obra)
  const extras = useSurvey((s) => s.extras)
  const q = quote({ obra, rooms, extras })

  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-5 py-3">
          <a href="#/" className="flex items-center gap-2.5 text-cream">
            <Logo size={20} spin={false} />
            <span className="display text-[17px]">{brand.name}</span>
          </a>
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] tracking-[0.14em] text-cream-3 uppercase">
            Operaciones
          </span>

          <nav className="ml-3 flex gap-1 text-[12px]">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#/admin/${s.id}`}
                onClick={() => setTab(s.id)}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  tab === s.id ? 'bg-cream/10 text-cream' : 'text-cream-3 hover:text-cream-2'
                }`}
              >
                {s.label}
              </a>
            ))}
            {PENDIENTES.map((s) => (
              <span key={s} className="cursor-not-allowed px-3 py-1.5 text-cream-3/50" title="Próxima sección">
                {s}
              </span>
            ))}
          </nav>

          {/* el total viaja siempre visible: es el número que se negocia */}
          <div className="ml-auto flex items-center gap-4">
            <span className="text-[11.5px] text-cream-3">
              {q.piezas} piezas ·{' '}
              <strong className="text-ember">${Math.round(q.total).toLocaleString('es-MX')}</strong>
            </span>
            <a href="#/" className="text-[12px] text-cream-3 transition-colors hover:text-cream">
              ← Sitio
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
        {tab === 'catalogo' ? <Catalog /> : <Survey />}
      </main>
    </div>
  )
}
