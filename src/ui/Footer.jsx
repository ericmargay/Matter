import { brand, nav } from '../content/site'

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-line bg-ink px-5 py-14 md:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <div className="display text-[clamp(2.5rem,9vw,7rem)] leading-none tracking-tight text-ink-3 select-none">
              {brand.name}
            </div>
            <p className="mt-4 max-w-[32ch] text-[13px] text-cream-3">
              {brand.tagline}. Levantamiento, diseño e instalación de casas inteligentes en {brand.city}.
            </p>
          </div>

          <nav className="flex flex-col gap-2.5 md:items-end">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[13px] text-cream-2 transition-colors duration-300 hover:text-ember"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#/catalogo"
              className="text-[13px] text-cream-2 transition-colors duration-300 hover:text-ember"
            >
              Catálogo de productos
            </a>
            
            {import.meta.env.VITE_ADMIN !== 'off' && (
              <a
                href="#/admin"
                className="text-[13px] text-cream-3 transition-colors duration-300 hover:text-ember"
              >
                Operaciones
              </a>
            )}
            <a
              href={brand.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-cream-2 transition-colors duration-300 hover:text-ember"
            >
              WhatsApp
            </a>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-[11px] text-cream-3 sm:flex-row sm:justify-between">
          <span>
            © {new Date().getFullYear()} {brand.name}. Todos los derechos reservados.
          </span>
          <span>
            Matter™ y Thread™ son marcas de la Connectivity Standards Alliance y del Thread Group. No estamos
            afiliados a Apple, Google ni Amazon.
          </span>
        </div>
      </div>
    </footer>
  )
}
