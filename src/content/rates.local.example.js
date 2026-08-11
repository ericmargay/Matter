/**
 * Plantilla de tarifas reales.
 *
 *   cp src/content/rates.local.example.js src/content/rates.local.js
 *
 * `rates.local.js` está en .gitignore: nunca se sube. Lo que exportes aquí
 * pisa a los valores de demostración de `rates.js`; puedes exportar solo lo
 * que quieras cambiar, el resto se hereda.
 */

export const LABOR_TIERS = {
  plug: { label: 'Enchufar', price: 0, mins: 10, hint: 'Se conecta y se empareja.' },
  simple: { label: 'Simple', price: 0, mins: 25, hint: 'Adherible o de rosca.' },
  medio: { label: 'Medio', price: 0, mins: 50, hint: 'Abrir caja y cablear.' },
  alto: { label: 'Alto', price: 0, mins: 110, hint: 'Ajuste mecánico o cable nuevo.' },
  obra: { label: 'Con obra', price: 0, mins: 210, hint: 'Requiere plomero, albañil o corte.' },
}

export const RATES = {
  levantamientoBase: 0,
  levantamientoM2: 0,
  levantamientoNivel: 0,
  levantamientoIncluidoM2: 150,
  puntoRed: 0,
  escena: 0,
  entrenamiento: 0,
  documentacion: 0,
  puestaEnMarchaPct: 0,
  viaticoKm: 0,
  garantiaMeses: 12,
  iva: 0.16,
}
