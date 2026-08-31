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

  /* ── categorías del catálogo ──────────────────────────────────
     Mismas llaves que los ids de CATEGORIES, para pintar la ficha de un
     producto sin tener que mantener una tabla de equivalencias aparte. */
  iluminacion: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1 1 1.7v.4h5v-.4c0-.7.4-1.3 1-1.7A6 6 0 0 0 12 3z',
  control: 'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 8h6v8H9zM12 8v8',
  sensores: 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8.5 8.5a5 5 0 0 0 0 7M15.5 15.5a5 5 0 0 0 0-7M6 6a8.5 8.5 0 0 0 0 12M18 18a8.5 8.5 0 0 0 0-12',
  acceso: 'M6 10h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zM8 10V7a4 4 0 0 1 8 0v3M12 14.5v3',
  camaras: 'M3 7h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM15 11l6-3v8l-6-3zM5.5 10.5h2',
  clima: 'M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0zM12 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  cortinas: 'M3 4h18M4 4v15M20 4v15M6 8h12M6 11.5h12M6 15h12M9 19h6',
  energia: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM13 9l-3 3.5h4L11 16',
  agua: 'M12 3s5.5 6 5.5 9.5a5.5 5.5 0 1 1-11 0C6.5 9 12 3 12 3zM9.5 13a2.5 2.5 0 0 0 2.5 2.5',
  av: 'M3 5h18v11H3zM8 20h8M12 16v4M8.5 8.5v4l3.5-2z',
  red: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.4 3.8 5.4 3.8 9s-1.3 6.6-3.8 9M12 3C9.5 5.4 8.2 8.4 8.2 12s1.3 6.6 3.8 9',
  mascotas: 'M12 13.5c2.2 0 4 1.6 4 3.5s-1.8 2.5-4 2.5-4-.6-4-2.5 1.8-3.5 4-3.5zM7 8.5c.8 0 1.5.9 1.5 2s-.7 2-1.5 2-1.5-.9-1.5-2 .7-2 1.5-2zM17 8.5c.8 0 1.5.9 1.5 2s-.7 2-1.5 2-1.5-.9-1.5-2 .7-2 1.5-2zM10.5 4.5c.8 0 1.5.9 1.5 2s-.7 2-1.5 2S9 7.6 9 6.5s.7-2 1.5-2z',
  electro: 'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM7.5 6h2',
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
