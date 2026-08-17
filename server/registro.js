import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { aplicar, reducir } from '../src/sync/eventos.js'

/**
 * El registro de cambios.
 *
 * Un archivo de texto donde cada renglón es un evento en JSON (JSONL). Se
 * escribe agregando al final —nunca se reescribe ni se borra un renglón— y el
 * estado de los proyectos es lo que queda de aplicarlos en orden.
 *
 * Por qué no una base de datos: son dos socios y unos cuantos miles de
 * eventos. Un archivo que se puede abrir con `cat` y entender a simple vista
 * vale más aquí que un motor con migraciones. Cuando esto crezca, el cambio es
 * reemplazar este módulo dejando la misma interfaz; nada más lo toca.
 *
 * ⚠️ DATA_DIR tiene que apuntar a un disco que sobreviva al reinicio. En
 * Railway eso significa un Volume montado; sin él, el sistema de archivos del
 * contenedor se borra en cada despliegue y con él todos los proyectos. Si no
 * está configurado, se avisa fuerte al arrancar.
 */

const DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data')
const ARCHIVO = path.join(DIR, 'eventos.jsonl')

let eventos = []
let estado = { proyectos: [] }
let seq = 0

/** Escrituras en serie: dos append simultáneos pueden entrelazar renglones. */
let cola = Promise.resolve()

export async function cargar() {
  await mkdir(DIR, { recursive: true })

  let texto = ''
  try {
    texto = await readFile(ARCHIVO, 'utf8')
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }

  const renglones = texto.split('\n').filter((l) => l.trim())
  const buenos = []
  for (const [i, linea] of renglones.entries()) {
    try {
      buenos.push(JSON.parse(linea))
    } catch {
      // un renglón truncado (corte de luz a media escritura) no puede tirar
      // el arranque: se salta y se avisa
      console.warn(`⚠️  registro: renglón ${i + 1} ilegible, se omite`)
    }
  }

  eventos = buenos
  seq = eventos.reduce((m, e) => Math.max(m, e.seq ?? 0), 0)
  estado = reducir(eventos)

  if (!process.env.DATA_DIR) {
    console.warn(
      `⚠️  DATA_DIR no está definida: el registro vive en ${DIR}. En Railway eso se borra en cada despliegue — monta un Volume y apunta DATA_DIR ahí.`,
    )
  }
  console.log(`registro: ${eventos.length} eventos · ${estado.proyectos.length} proyectos · ${ARCHIVO}`)
  return estado
}

/**
 * Sella un evento con la verdad del servidor y lo guarda.
 *
 * El autor y la hora los pone el servidor, no el cliente: es lo único que
 * hace que el historial signifique algo.
 */
export function registrar(parcial, autor) {
  const ev = {
    ...parcial,
    /* El id lo pone el cliente cuando el evento viene del navegador, para
       poder reconciliar lo que mandó con lo que le regresa el hub. Pero el
       inventario del cliente entra por HTTP y no trae ninguno, y sin id dos
       eventos se ven iguales: el historial los pintaba con la misma llave de
       React y se quejaba. Lo generamos aquí, que es donde siempre hay uno. */
    id: parcial.id ?? `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    seq: ++seq,
    autor,
    ts: new Date().toISOString(),
  }

  eventos.push(ev)
  estado = aplicar(estado, ev)

  cola = cola
    .then(() => appendFile(ARCHIVO, `${JSON.stringify(ev)}\n`, 'utf8'))
    .catch((e) => console.error('registro: no se pudo escribir', e))

  return ev
}

/** Siembra: solo corre cuando el registro está vacío. */
export async function sembrar(lote) {
  if (eventos.length > 0) return 0
  for (const ev of lote) {
    const sellado = { ...ev, seq: ++seq }
    eventos.push(sellado)
    estado = aplicar(estado, sellado)
  }
  await writeFile(ARCHIVO, eventos.map((e) => `${JSON.stringify(e)}\n`).join(''), 'utf8')
  console.log(`registro: sembrados ${lote.length} eventos iniciales`)
  return lote.length
}

export const verEstado = () => estado
export const verEventos = () => eventos
export const ultimoSeq = () => seq

/** Eventos posteriores a `desde` — lo que pide un cliente que se reconecta. */
export const desde = (n) => eventos.filter((e) => e.seq > n)

/** Reescribe el archivo entero. Solo para mantenimiento; no lo usa el flujo
 *  normal, que siempre agrega al final. */
export async function compactar() {
  const tmp = `${ARCHIVO}.tmp`
  await writeFile(tmp, eventos.map((e) => `${JSON.stringify(e)}\n`).join(''), 'utf8')
  await rename(tmp, ARCHIVO)
}


/* ── enlaces cortos ───────────────────────────────────────────────
   Un catálogo de cliente, un plano o un anexador viajan hoy con doscientos
   caracteres de token. Por WhatsApp eso se ve a estafa: el cliente recibe un
   muro de letras y duda antes de tocarlo. Un enlace de siete caracteres se ve
   a enlace.

   Vive en el mismo registro que todo lo demás —una línea más del JSONL— así
   que sobrevive el redespliegue sin base de datos aparte, y se puede leer el
   archivo para saber qué se le mandó a quién y cuándo.  */

const ALFABETO = 'abcdefghijkmnpqrstuvwxyz23456789' // sin l, o, 0, 1: se dictan por teléfono

export function acortar(destino, autor, etiqueta = '') {
  const ya = eventos.find((e) => e.tipo === 'enlace.corto' && e.datos?.destino === destino)
  if (ya) return ya.datos.codigo

  let codigo
  do {
    codigo = Array.from({ length: 7 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join('')
  } while (eventos.some((e) => e.tipo === 'enlace.corto' && e.datos?.codigo === codigo))

  registrar({ tipo: 'enlace.corto', datos: { codigo, destino, etiqueta } }, autor)
  return codigo
}

export function resolver(codigo) {
  // el último gana: si un destino se regenera, el código sigue sirviendo
  for (let i = eventos.length - 1; i >= 0; i--) {
    const e = eventos[i]
    if (e.tipo === 'enlace.corto' && e.datos?.codigo === codigo) return e.datos.destino
  }
  return null
}

export function enlacesCortos() {
  const m = new Map()
  for (const e of eventos) if (e.tipo === 'enlace.corto') m.set(e.datos.codigo, { ...e.datos, ts: e.ts, autor: e.autor })
  return [...m.values()].reverse()
}
