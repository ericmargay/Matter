/**
 * Materiales e insumos de instalación.
 *
 * Ni dispositivo ni mano de obra: lo que se gasta para que el dispositivo
 * quede bien puesto — el cable que no es del aparato sino del tendido, la
 * canaleta que lo esconde, el tornillo que lo sostiene. Sin esto, la
 * cotización cuenta el foco pero no lo que cuesta dejarlo instalado de
 * verdad, y ese faltante es justo el que nadie nota hasta que ya se compró
 * de más o de menos en la ferretería.
 *
 * El precio de aquí es una tarifa del NEGOCIO —vive en `estado.tarifas`,
 * igual que el precio corregido de un producto—: cuesta lo mismo el metro
 * de canaleta en cualquier proyecto. La CANTIDAD sí es de cada proyecto, y
 * es un estimado a ojo, no algo que se calcule solo del plano —por ahora—:
 * se ajusta en Compras según lo que de verdad hace falta.
 *
 * `precio: 0` es una opción válida y a propósito: hay insumos que se
 * incluyen sin cobrarse aparte, pero igual se quieren ver en la lista para
 * saber cuánto se está regalando y cuánto haría falta comprar.
 */
export const MATERIALES = [
  { id: 'cable-utp-cat6', nombre: 'Cable UTP Cat6', unidad: 'm', precio: 12, detalle: 'Red estructurada y tendido entre puntos que no van por WiFi.' },
  { id: 'cable-electrico-14', nombre: 'Cable eléctrico cal. 14', unidad: 'm', precio: 18, detalle: 'Extensión de corriente donde el punto más cercano no alcanza.' },
  { id: 'canaleta-pvc', nombre: 'Canaleta PVC', unidad: 'm', precio: 35, detalle: 'Esconde cable expuesto por muro o zoclo cuando no hay ranurado.' },
  { id: 'conector-rj45', nombre: 'Conector RJ45 Cat6', unidad: 'pza', precio: 8, detalle: 'Uno por extremo de cable de red ponchado.' },
  { id: 'cinchos', nombre: 'Cinchos / amarra cables', unidad: 'paquete de 100', precio: 45, detalle: 'Orden del tendido dentro de canaleta o plafón.' },
  { id: 'cinta-aislante', nombre: 'Cinta aislante', unidad: 'rollo', precio: 25, detalle: 'Empalmes y remates de cable eléctrico.' },
  { id: 'cinta-doble-cara-3m', nombre: 'Cinta doble cara 3M', unidad: 'rollo', precio: 60, detalle: 'Fija sensores y módulos adheribles sin taladrar.' },
  { id: 'taquete-tornillo', nombre: 'Kit taquete + tornillo', unidad: 'paquete de 50', precio: 90, detalle: 'Montaje en tablaroca o concreto de lo que no es adherible.' },
  { id: 'etiqueta-cable', nombre: 'Etiquetas para cable', unidad: 'paquete', precio: 40, detalle: 'Cada cable rotulado en su origen y destino — lo que evita la llamada de soporte.' },
  { id: 'silicon-neutro', nombre: 'Silicón neutro', unidad: 'cartucho', precio: 85, detalle: 'Sellado de puntos exteriores o cercanos a agua.' },
  { id: 'placa-ciega', nombre: 'Placa ciega', unidad: 'pza', precio: 30, detalle: 'Tapa el hueco cuando se retira un apagador o contacto que ya no va.' },
  { id: 'broca-set', nombre: 'Set de brocas (consumible)', unidad: 'set', precio: 150, detalle: 'Se desgastan con concreto y tabique; se repone por proyecto grande.' },
]

export const MATERIAL_BY_ID = Object.fromEntries(MATERIALES.map((m) => [m.id, m]))

/** Precio real: la tarifa del negocio si alguien la corrigió, si no la de arranque. */
export const precioMaterial = (id, tarifas) => tarifas?.materiales?.[id]?.precio ?? MATERIAL_BY_ID[id]?.precio ?? 0
