/**
 * Tarifas de DEMOSTRACIÓN.
 *
 * ⚠️ Los números de este archivo son inventados y están en el repositorio
 * público. Sirven para que la cotización se vea completa y coherente en una
 * demo; no son las tarifas del negocio.
 *
 * Las reales van en `src/content/rates.local.js`, que está en .gitignore y
 * nunca sale de tu máquina. Copia `rates.local.example.js`, pon los números
 * verdaderos y `pricing.js` los toma solos — el panel avisa arriba cuando
 * está corriendo con los de demo.
 */

export const DEMO = true

/**
 * Cuánto cuesta instalar UNA pieza, por dificultad.
 * El nivel sale del tiempo que se lleva la pieza, no del precio del aparato:
 * una persiana barata se instala igual de lento que una cara.
 */
export const LABOR_TIERS = {
  /* El material de acomodo no cobra instalación propia: se pone DENTRO del
     acomodo de cable, que ya se cobra por punto. Cobrarle mano de obra a una
     canaleta de cincuenta pesos infla la cotización sin que nadie trabaje más. */
  material: { label: 'Material', price: 0, mins: 0, hint: 'Va incluido en el acomodo. Canaleta, grapas, velcro.' },
  plug: { label: 'Enchufar', price: 150, mins: 10, hint: 'Se conecta y se empareja. Contactos, bocinas, hubs.' },
  simple: { label: 'Simple', price: 300, mins: 25, hint: 'Adherible o de rosca. Focos, sensores de pila, tiras.' },
  medio: { label: 'Medio', price: 600, mins: 50, hint: 'Abrir caja y cablear. Dimmers, botoneras, módulos.' },
  alto: { label: 'Alto', price: 1200, mins: 110, hint: 'Ajuste mecánico o cable nuevo. Persianas, cerraduras, cámaras.' },
  obra: { label: 'Con obra', price: 2500, mins: 210, hint: 'Requiere plomero, albañil o corte. Válvulas, empotrados.' },
}

export const RATES = {
  levantamientoBase: 1500, // hasta 150 m² y un nivel, zona metropolitana
  levantamientoM2: 10, // por m² arriba de 150
  levantamientoNivel: 500, // por cada nivel adicional
  levantamientoIncluidoM2: 150,

  puntoRed: 900, // cable Cat6, jack, ponchado, patch y prueba de certificación
  escena: 400, // diseño, programación y ajuste con el cliente presente
  entrenamiento: 1500, // sesión con toda la familia, incluida la persona que ayuda
  documentacion: 1000, // planos as-built, credenciales y etiquetado del rack

  puestaEnMarchaPct: 0.06, // sobre el equipo: pruebas, firmware y afinación
  viaticoKm: 15, // fuera de zona metropolitana, ida y vuelta
  garantiaMeses: 12,

  iva: 0.16,
}
