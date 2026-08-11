/**
 * Logo animado.
 *
 * La idea: una corriente recorre el contorno de la casa y, al pasar por el
 * centro, el punto se enciende y se apaga despacio. Es la marca contando lo
 * que vende — que hay algo circulando por la casa — sin escribirlo.
 *
 * Todo es CSS sobre dos trazos superpuestos: uno base tenue y otro corto
 * (`stroke-dasharray`) que viaja con `stroke-dashoffset`. Ni JS ni SMIL, así
 * que no cuesta un frame y respeta prefers-reduced-motion.
 */
export default function Logo({ size = 22, className = '', spin = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* el pulso se desvanece en las puntas para que no se vea un gusano */}
        <linearGradient id="matter-pulse" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-ember)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--color-ember-2)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--color-ember)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="matter-glow">
          <stop offset="0%" stopColor="var(--color-ember-2)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--color-ember)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* halo que respira detrás del punto */}
      <circle cx="16" cy="17" r="9" fill="url(#matter-glow)" className={spin ? 'logo-halo' : ''} />

      {/* contorno base */}
      <path
        d="M6 22V12.5L16 7l10 5.5V22"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* corriente que recorre el contorno */}
      {spin && (
        <path
          d="M6 22V12.5L16 7l10 5.5V22"
          stroke="url(#matter-pulse)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="logo-pulse"
        />
      )}

      <circle cx="16" cy="17" r="3" className={`fill-ember ${spin ? 'logo-dot' : ''}`} />
    </svg>
  )
}
