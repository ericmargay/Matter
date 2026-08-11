/**
 * Iconos del centro de control.
 * Trazo de 1.5 sobre una caja de 24: el mismo peso óptico que el resto de la
 * interfaz, para que las teselas no se sientan pegadas de otro sitio.
 */
const PATHS = {
  sofa: 'M4 12v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M3 12h18v5H3zM6 17v2M18 17v2M8 8V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1',
  film: 'M3 5h18v14H3zM7 5v14M17 5v14M3 12h18M3 8.5h4M3 15.5h4M17 8.5h4M17 15.5h4',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 5.5v15M9 7.5h6',
  power: 'M12 4v8M7.5 6.8a7 7 0 1 0 9 0',
  pot: 'M5 10h14v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM3 10h18M9 7c0-1.5 1-1.5 1-3M14 7c0-1.5 1-1.5 1-3',
  dinner: 'M6 3v8a2 2 0 0 0 4 0V3M8 11v10M17 3c-1.5 1-2 2.5-2 4.5S16 11 17 11s2-1.5 2-3.5S18.5 4 17 3zM17 11v10',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
  sunrise: 'M12 3v4M5.6 9.6 4 8M18.4 9.6 20 8M3 17h18M6.5 17a5.5 5.5 0 0 1 11 0M2 21h20',
  bed: 'M3 18v-8M3 13h18a2 2 0 0 1 2 2v3M3 18h20M6.5 10h3M6 10a1.5 1.5 0 0 1 3 0M12 13V9h7a2 2 0 0 1 2 2v2',
  work: 'M4 7h16v12H4zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 12h16',
  meeting: 'M15 8H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h11zM15 11l6-3.5v9L15 13z',
  tv: 'M3 5h18v11H3zM8 20h8M12 16v4',
  brightness: 'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8',
  temp: 'M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0zM12 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  blinds: 'M3 4h18M4 4v15M20 4v15M6 8h12M6 11.5h12M6 15h12M9 19h6',
  hub: 'M12 3v4M12 17v4M3 12h4M17 12h4M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM6.2 6.2l2.6 2.6M15.2 15.2l2.6 2.6M17.8 6.2l-2.6 2.6M8.8 15.2l-2.6 2.6',
}

export default function Icon({ name, size = 18, className = '' }) {
  const d = PATHS[name] ?? PATHS.hub
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
