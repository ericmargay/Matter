/**
 * Pantalla completa cuando no hay con quién sincronizar.
 *
 * Vive en su propio archivo y no dentro de Admin.jsx porque hay páginas
 * —como el plano de un solo cuarto— que la necesitan sin arrastrar el panel
 * entero: importarla desde Admin.jsx metía sus 150 KB en cualquier chunk que
 * sólo quería enseñar "hay que entrar primero".
 */
export default function SinConexion({ conexion }) {
  return (
    <div className="mx-auto max-w-[520px] rounded-xl border border-dashed border-line px-6 py-14 text-center">
      <h1 className="display text-[22px] text-cream">
        {conexion === 'sin-sesion' ? 'Hay que entrar primero.' : 'No hay servidor detrás.'}
      </h1>
      <p className="mx-auto mt-3 max-w-[46ch] text-[13px] leading-relaxed text-cream-3">
        {conexion === 'sin-sesion' ? (
          <>
            Los proyectos viven en el servidor para que los cambios de los dos socios se vean entre sí. Sin
            sesión no se puede leer ni escribir nada.
          </>
        ) : (
          <>
            El panel guarda los proyectos en el servidor. Corriendo solo el front —sin{' '}
            <code className="text-cream-2">npm start</code> ni el servidor de desarrollo— no hay dónde
            guardarlos.
          </>
        )}
      </p>
      {conexion === 'sin-sesion' && (
        <a
          href="/panel/login"
          className="mt-6 inline-block rounded-lg bg-ember px-5 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-ember-2"
        >
          Ir al login
        </a>
      )}
    </div>
  )
}
