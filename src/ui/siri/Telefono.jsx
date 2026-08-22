/**
 * El teléfono, dibujado.
 *
 * En escritorio la demostración pasa DENTRO de un teléfono a propósito. No es
 * decoración: el cliente no va a hablarle a una computadora, va a hablarle a su
 * celular parado en su sala, y verlo en la forma correcta es la mitad de
 * entender qué le estamos vendiendo. Enseñar una barra suelta en una pantalla
 * de 27 pulgadas comunica otra cosa.
 *
 * En teléfono no se dibuja el marco: ya se está adentro de uno. Poner un
 * teléfono dentro de un teléfono es la clase de detalle que hace que una
 * demostración se vea a maqueta.
 *
 * Todo es CSS. Una foto de un iPhone sería más fiel y sería material de Apple
 * en nuestra pantalla; esto es una forma, y las formas no tienen dueño.
 */
export default function Telefono({ hora, children }) {
  return (
    <div className="relative mx-auto" style={{ width: 300, height: 610 }}>
      {/* el cuerpo: titanio, con su brillo de canto */}
      <div
        className="absolute inset-0 rounded-[52px]"
        style={{
          background: 'linear-gradient(145deg,#4a4f57,#25282d 30%,#1a1c20 65%,#3a3e45)',
          boxShadow: '0 30px 70px -20px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.08)',
        }}
      />
      {/* la pantalla */}
      <div
        className="absolute overflow-hidden rounded-[44px]"
        style={{ inset: 8, background: '#05070c' }}
      >
        {/* el fondo. Es el de la casa, no el de iOS: la demostración es
            nuestra y el fondo también. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 20% 0%, #2a3a63 0%, #141a2c 45%, #080b12 100%)',
          }}
        />
        <div className="relative flex h-full flex-col">
          <BarraEstado hora={hora} />
          {children}
        </div>
      </div>

      {/* la isla */}
      <div
        className="absolute left-1/2 top-[22px] h-[30px] w-[104px] -translate-x-1/2 rounded-full"
        style={{ background: '#05070c' }}
      />
      {/* los botones del canto */}
      <div className="absolute -left-[3px] top-[130px] h-[30px] w-[3px] rounded-l bg-[#3a3e45]" />
      <div className="absolute -left-[3px] top-[178px] h-[52px] w-[3px] rounded-l bg-[#3a3e45]" />
      <div className="absolute -left-[3px] top-[244px] h-[52px] w-[3px] rounded-l bg-[#3a3e45]" />
      <div className="absolute -right-[3px] top-[196px] h-[78px] w-[3px] rounded-r bg-[#3a3e45]" />
    </div>
  )
}

function BarraEstado({ hora }) {
  return (
    <div className="flex shrink-0 items-center justify-between px-7 pt-[18px] text-[13px] font-semibold text-white/90">
      <span className="tabular-nums">{hora}</span>
      <span className="flex items-center gap-1.5">
        {/* señal, wifi y pila, dibujadas: tres formas y se leen igual */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true">
          <rect x="0" y="7.5" width="3" height="3.5" rx="1" />
          <rect x="4.6" y="5" width="3" height="6" rx="1" />
          <rect x="9.2" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13.8" y="0" width="3" height="11" rx="1" opacity=".4" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M1 3.4a9 9 0 0 1 13 0M3.6 6.2a5.6 5.6 0 0 1 7.8 0" strokeLinecap="round" />
          <circle cx="7.5" cy="9.4" r="1.1" fill="currentColor" stroke="none" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".45" />
          <rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor" />
          <path d="M23 4v4a2 2 0 0 0 0-4z" fill="currentColor" opacity=".45" />
        </svg>
      </span>
    </div>
  )
}
