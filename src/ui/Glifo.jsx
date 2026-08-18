/**
 * El dibujo de lo que no tiene foto.
 *
 * Trazo plano, sin relleno, del mismo grosor en todos: sirve para distinguir
 * la fila del teléfono de la del módem de un vistazo, no para enseñar cómo es
 * un teléfono —eso el cliente ya lo sabe—. Por eso son siete y no treinta.
 */
const TRAZOS = {
  telefono: 'M8.5 2.5h7a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 20V4a1.5 1.5 0 0 1 1.5-1.5ZM11 18.5h2',
  tableta: 'M6 2.5h12a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5ZM10.5 18.5h3',
  reloj: 'M8.5 7.5h7v9h-7zM9.5 7.5 9 3.5h6l-.5 4M9.5 16.5 9 20.5h6l-.5-4',
  bocina: 'M7 3.5h10v17H7zM12 9.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM12 6h.01',
  pantalla: 'M3 5h18v11H3zM9 20h6M12 16v4',
  foco: 'M9 17h6M10 20h4M8.5 12a3.5 3.5 0 1 1 7 0c0 1.6-1 2.4-1.4 3.2-.2.4-.3 1.1-.3 1.8h-3.6c0-.7-.1-1.4-.3-1.8C9.5 14.4 8.5 13.6 8.5 12Z',
  red: 'M4 14h16v6H4zM7 17h.01M10 17h.01M12 4v6M8.5 7.5 12 4l3.5 3.5',
  casa: 'M4 20v-9l8-6 8 6v9M9.5 20v-6h5v6',
}

export default function Glifo({ tipo = 'casa', size = 22, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={TRAZOS[tipo] ?? TRAZOS.casa} />
    </svg>
  )
}
