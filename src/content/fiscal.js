/**
 * Constantes fiscales y formato.
 *
 * Vive aparte de pricing.js a propósito: pricing.js importa el catálogo
 * completo —con precios de costo, márgenes de instalación y canales de
 * proveedor— y la cotización pública no debe arrastrar nada de eso al
 * navegador del cliente. Este módulo no importa nada.
 */

/* ── datos fiscales ───────────────────────────────────────────── */

/**
 * ⚠️ Esto genera una COTIZACIÓN, no un CFDI.
 *
 * Un CFDI 4.0 válido solo existe cuando un PAC lo timbra: es el PAC quien
 * pone UUID, sello digital, cadena original y certificado. Lo que hacemos
 * aquí es dejar armados todos los campos que el PAC va a pedir, de modo que
 * convertir la cotización en factura sea copiar datos y no volver a
 * capturarlos.
 *
 * Los datos del emisor son de relleno: hay que sustituirlos por los de la
 * Constancia de Situación Fiscal, con la razón social EXACTA como aparece
 * ahí. El SAT rechaza por diferencias de acentos y de "S.A. de C.V.".
 */
export const EMISOR = {
  razonSocial: 'MATTER CASAS INTELIGENTES SA DE CV',
  rfc: 'XAXX010101000',
  regimen: '601',
  regimenLabel: '601 · General de Ley Personas Morales',
  cp: '03100',
  domicilio: 'Col. Del Valle, Benito Juárez, Ciudad de México',
  email: 'facturacion@matter.mx',
  tel: '+52 55 0000 0000',
}

/** Catálogo c_RegimenFiscal, los que de verdad usan nuestros clientes. */
export const REGIMENES = [
  { id: '601', label: '601 · General de Ley Personas Morales' },
  { id: '603', label: '603 · Personas Morales con Fines no Lucrativos' },
  { id: '605', label: '605 · Sueldos y Salarios' },
  { id: '606', label: '606 · Arrendamiento' },
  { id: '612', label: '612 · Actividades Empresariales y Profesionales' },
  { id: '616', label: '616 · Sin obligaciones fiscales' },
  { id: '621', label: '621 · Incorporación Fiscal' },
  { id: '626', label: '626 · RESICO' },
]

/** Catálogo c_UsoCFDI aplicable a lo que vendemos. */
export const USOS_CFDI = [
  { id: 'G03', label: 'G03 · Gastos en general' },
  { id: 'I08', label: 'I08 · Otra maquinaria y equipo' },
  { id: 'G01', label: 'G01 · Adquisición de mercancías' },
  { id: 'I03', label: 'I03 · Equipo de transporte' },
  { id: 'D10', label: 'D10 · Pagos por servicios educativos' },
  { id: 'S01', label: 'S01 · Sin efectos fiscales' },
  { id: 'CP01', label: 'CP01 · Pagos' },
]

export const FORMAS_PAGO = [
  { id: '03', label: '03 · Transferencia electrónica' },
  { id: '04', label: '04 · Tarjeta de crédito' },
  { id: '28', label: '28 · Tarjeta de débito' },
  { id: '01', label: '01 · Efectivo' },
  { id: '99', label: '99 · Por definir' },
]

export const METODOS_PAGO = [
  { id: 'PUE', label: 'PUE · Pago en una sola exhibición' },
  { id: 'PPD', label: 'PPD · Pago en parcialidades o diferido' },
]

/**
 * Clave del catálogo c_ClaveProdServ del SAT por tipo de partida.
 * Confirmar con el contador antes de timbrar: una clave mal puesta es de
 * los rechazos más comunes.
 */
export const CLAVE_PROD_SERV = {
  iluminacion: '39111500',
  control: '39121300',
  sensores: '46171610',
  acceso: '46171500',
  camaras: '46171610',
  clima: '40101700',
  cortinas: '30171600',
  energia: '39121000',
  agua: '40151500',
  av: '52161500',
  hubs: '43222600',
  red: '43222600',
  mascotas: '10121800',
  electro: '52141500',
  servicio: '81111800', // servicios de instalación y configuración de sistemas
}

export const CLAVE_UNIDAD = { pieza: 'H87', servicio: 'E48' }


/** Total en letra, como lo pide el formato de factura. */
export function enLetra(n) {
  const UNI = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE']
  const DEC = ['', '', 'VEINTI', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
  const CEN = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

  const dosCifras = (x) => {
    if (x <= 20) return UNI[x]
    const d = Math.floor(x / 10)
    const u = x % 10
    if (d === 2) return u ? `VEINTI${UNI[u].toLowerCase().toUpperCase()}` : 'VEINTE'
    return u ? `${DEC[d]} Y ${UNI[u]}` : DEC[d]
  }

  const tresCifras = (x) => {
    if (x === 100) return 'CIEN'
    const c = Math.floor(x / 100)
    const r = x % 100
    return `${CEN[c]}${c && r ? ' ' : ''}${dosCifras(r)}`.trim()
  }

  const entero = Math.floor(n)
  const cents = String(Math.round((n - entero) * 100)).padStart(2, '0')

  let texto
  if (entero === 0) texto = 'CERO'
  else if (entero < 1000) texto = tresCifras(entero)
  else {
    const miles = Math.floor(entero / 1000)
    const resto = entero % 1000
    const prefijo = miles === 1 ? 'MIL' : `${tresCifras(miles)} MIL`
    texto = resto ? `${prefijo} ${tresCifras(resto)}` : prefijo
  }

  return `${texto} PESOS ${cents}/100 M.N.`
}
