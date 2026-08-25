/**
 * Guarda y devuelve los espacios de prueba a un estado conocido.
 *
 *   node scripts/plano-base.mjs guardar     — graba cómo están ahora
 *   node scripts/plano-base.mjs             — los devuelve a como estaban
 *   node scripts/plano-base.mjs --lista     — dice qué hay guardado
 *
 * Por qué existe: probar el plano quiere decir moverle. Se estira un muro para
 * ver si los contactos lo siguen, se arrastra un cable, se cambia una medida —
 * y al terminar la habitación ya no es la misma, así que la siguiente prueba
 * empieza de otro lado y no se puede comparar. Con esto se vuelve al mismo
 * cuarto cada vez.
 *
 * Es sólo para probar EN LOCAL. En la nube no hay nada que restaurar: ahí cada
 * cambio es del cliente y se queda, que es justamente el punto del registro de
 * eventos. Por eso el script se niega a apuntar a otro servidor que no sea el
 * de esta máquina.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { WebSocket } from 'ws'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ARCHIVO = path.join(RAIZ, '.data', 'planos-base.json')

/* Los dos espacios con los que se prueba. Si algún día son otros, se cambian
   aquí y no en diez lugares. */
const CUARTOS = [
  { proyecto: 'pmstvcvlwcbsf9', cuarto: 'rmswgg0x2q1zc6', nombre: 'Sala del Carpio' },
  { proyecto: 'pmszl6g7ns28aj0', cuarto: 'rmszl6g7nmah3i8', nombre: 'Habitación del Margay' },
]

const uid = (p = 'e') =>
  `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

/** El puerto donde de verdad está el Vite de este proyecto. */
async function servidor() {
  for (const puerto of [5173, 5174, 5175, 5176, 3000]) {
    try {
      const r = await fetch(`http://localhost:${puerto}/package.json`)
      const j = await r.json()
      if (j.name === 'matter') return `http://localhost:${puerto}`
    } catch {
      // ese puerto no es; se sigue con el siguiente
    }
  }
  const r = await fetch('http://localhost:3000/salud').catch(() => null)
  if (r?.ok) return 'http://localhost:3000'
  return null
}

/** La sesión de local, que no pide contraseña porque no hay usuarios puestos. */
async function entrar(base) {
  const r = await fetch(`${base}/panel/dev-login?u=margay&volver=/`, { redirect: 'manual' })
  const galleta = r.headers.getSetCookie?.()?.[0]?.split(';')[0]
  if (!galleta) throw new Error('sin sesión: ¿el servidor tiene PANEL_USERS configurado?')
  return galleta
}

async function estado(base, galleta) {
  const r = await fetch(`${base}/api/estado`, { headers: { Cookie: galleta } })
  if (!r.ok) throw new Error(`el servidor contestó ${r.status} al pedir el estado`)
  return r.json()
}

/** Manda eventos por el mismo socket que usa el panel y espera a que los confirme. */
function mandar(base, galleta, eventos) {
  return new Promise((listo, falla) => {
    const ws = new WebSocket(`${base.replace('http', 'ws')}/sync`, {
      headers: { Cookie: galleta },
    })
    let confirmados = 0
    const reloj = setTimeout(() => falla(new Error('el servidor no contestó a tiempo')), 30000)

    ws.on('error', falla)
    ws.on('unexpected-response', (_r, res) => falla(new Error(`rechazo ${res.statusCode}`)))
    ws.on('message', (crudo) => {
      const m = JSON.parse(crudo)
      if (m.t === 'hola') {
        for (const ev of eventos) ws.send(JSON.stringify({ t: 'ev', evento: ev }))
      }
      if (m.t === 'ev') confirmados += 1
      if (confirmados >= eventos.length) {
        clearTimeout(reloj)
        ws.close()
        listo(confirmados)
      }
    })
  })
}

const base = await servidor()
if (!base) {
  console.error('✗ No encontré el servidor de Matter en esta máquina. Levántalo con `npm run dev`.')
  process.exit(1)
}

const galleta = await entrar(base)
const { estado: est } = await estado(base, galleta)
const orden = process.argv[2]

if (orden === '--lista') {
  if (!existsSync(ARCHIVO)) {
    console.log('No hay nada guardado todavía. Corre `node scripts/plano-base.mjs guardar`.')
    process.exit(0)
  }
  const guardado = JSON.parse(await readFile(ARCHIVO, 'utf8'))
  console.log(`Guardado el ${guardado.cuando}:`)
  for (const c of guardado.cuartos) {
    console.log(`   ${c.nombre.padEnd(26)} ${c.plano.ancho} × ${c.plano.largo} · ${c.plano.items.length} piezas`)
  }
  process.exit(0)
}

const buscar = ({ proyecto, cuarto }) =>
  est.proyectos.find((p) => p.id === proyecto)?.rooms?.find((r) => r.id === cuarto)

if (orden === 'guardar') {
  const cuartos = []
  for (const c of CUARTOS) {
    const r = buscar(c)
    if (!r?.plano) {
      console.error(`✗ No encontré ${c.nombre}`)
      continue
    }
    cuartos.push({ ...c, plano: r.plano })
    console.log(`✓ ${c.nombre.padEnd(26)} ${r.plano.ancho} × ${r.plano.largo} · ${r.plano.items.length} piezas`)
  }
  await mkdir(path.dirname(ARCHIVO), { recursive: true })
  await writeFile(ARCHIVO, JSON.stringify({ cuando: new Date().toISOString().slice(0, 16).replace('T', ' '), cuartos }, null, 2))
  console.log(`\nGuardado en .data/planos-base.json`)
  process.exit(0)
}

if (!existsSync(ARCHIVO)) {
  console.error('✗ No hay estado guardado. Primero: node scripts/plano-base.mjs guardar')
  process.exit(1)
}

const guardado = JSON.parse(await readFile(ARCHIVO, 'utf8'))
const eventos = guardado.cuartos.map((c) => ({
  id: uid(),
  tipo: 'plano.editar',
  proyectoId: c.proyecto,
  datos: {
    cuartoId: c.cuarto,
    cuartoNombre: c.nombre,
    que: 'Devolvió el espacio al estado de prueba',
    plano: c.plano,
  },
}))

const n = await mandar(base, galleta, eventos)
console.log(`✓ ${n} ${n === 1 ? 'espacio devuelto' : 'espacios devueltos'} al estado del ${guardado.cuando}:`)
for (const c of guardado.cuartos) {
  console.log(`   ${c.nombre.padEnd(26)} ${c.plano.ancho} × ${c.plano.largo} · ${c.plano.items.length} piezas`)
}
process.exit(0)
