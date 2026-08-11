import { useEffect, useState } from 'react'
import { brand, nav } from '../content/site'
import { useStore } from '../store/store'
import Logo from './Logo'

function Wordmark() {
  return (
    <a href="#top" className="flex items-center gap-2.5 text-cream" aria-label={`${brand.name} — inicio`}>
      <Logo size={22} />
      <span className="display text-[19px] tracking-tight">{brand.name}</span>
    </a>
  )
}

export default function Nav() {
  const [solid, setSolid] = useState(false)
  const menuOpen = useStore((s) => s.menuOpen)
  const toggleMenu = useStore((s) => s.toggleMenu)
  const closeMenu = useStore((s) => s.closeMenu)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          solid ? 'border-b border-line/70 bg-ink/70 backdrop-blur-xl' : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-8">
          <Wordmark />

          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative text-[13px] text-cream-2 transition-colors duration-300 hover:text-cream"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#contacto"
              className="hidden rounded-full border border-cream/20 px-4 py-2 text-[13px] text-cream transition-all duration-400 hover:border-ember hover:bg-ember hover:text-ink sm:inline-block"
            >
              Agenda tu levantamiento
            </a>
            <button
              onClick={toggleMenu}
              aria-label="Menú"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/15 md:hidden"
            >
              <span className="relative block h-[9px] w-4">
                <span
                  className={`absolute left-0 h-px w-full bg-cream transition-all duration-400 ${
                    menuOpen ? 'top-1 rotate-45' : 'top-0'
                  }`}
                />
                <span
                  className={`absolute left-0 h-px w-full bg-cream transition-all duration-400 ${
                    menuOpen ? 'top-1 -rotate-45' : 'top-2'
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* menú móvil */}
      <div
        className={`fixed inset-0 z-40 bg-ink/95 backdrop-blur-xl transition-all duration-500 md:hidden ${
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <nav className="flex h-full flex-col justify-center gap-2 px-8">
          {nav.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className="display border-b border-line py-4 text-4xl text-cream"
              style={{
                transitionDelay: `${i * 40}ms`,
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'none' : 'translateY(10px)',
                transition: 'opacity .5s var(--ease-out-expo), transform .5s var(--ease-out-expo)',
              }}
            >
              {item.label}
            </a>
          ))}
          <a
            href="#contacto"
            onClick={closeMenu}
            className="mt-8 rounded-full bg-ember px-6 py-4 text-center text-sm font-medium text-ink"
          >
            Agenda tu levantamiento
          </a>
        </nav>
      </div>
    </>
  )
}
