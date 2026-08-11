#!/usr/bin/env node
/**
 * Baja modelos CC0 de Poly Haven a public/models/.
 *
 *   node scripts/fetch-models.mjs            # baja los de la lista
 *   node scripts/fetch-models.mjs Sofa_01    # baja solo uno
 *   node scripts/fetch-models.mjs --list sofa  # busca qué hay disponible
 *
 * Todo lo de Poly Haven es CC0: uso comercial sin atribución obligatoria.
 * Aun así los créditos van en el README, porque es lo correcto.
 *
 * Los modelos NO se versionan (public/models está en .gitignore). Quien
 * clone el repo corre este script una vez. Si un modelo falta, la escena
 * usa su versión procedural: nada se rompe.
 */
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'models')
const API = 'https://api.polyhaven.com'

/** slug de Poly Haven → nombre con el que lo busca la escena */
export const WANTED = {
  // Ojo: el catálogo de muebles de Poly Haven es casi todo antiguo/rústico
  // (sofás franceses, mesas turquesa envejecidas). Chocan con la estética
  // moderna del sitio, así que solo usamos objetos neutros de estilo:
  // plantas y cerámica, que suman realismo sin pelearse con el diseño.
  potted_plant_04: 'plant',
  ceramic_vase_03: 'vase',
  ceramic_vase_01: 'vase-tall',
}

const RES = '1k' // 2k si quieres más detalle y no te importa pesar 4x

const kb = (n) => `${(n / 1024).toFixed(0)} KB`

async function fetchBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function download(slug, name) {
  const meta = await (await fetch(`${API}/files/${slug}`)).json()
  const entry = meta?.gltf?.[RES]?.gltf
  if (!entry) throw new Error(`sin gltf ${RES}`)

  const dir = join(OUT, name)
  const base = entry.url.slice(0, entry.url.lastIndexOf('/') + 1)

  // el .gltf apunta a .bin y texturas con rutas relativas, así que hay que
  // reproducir el árbol de carpetas tal cual
  const files = [
    { path: `${name}.gltf`, url: entry.url, size: entry.size },
    ...Object.entries(entry.include ?? {}).map(([rel, v]) => ({
      path: rel,
      url: v.url ?? base + rel,
      size: v.size,
    })),
  ]

  let total = 0
  for (const f of files) {
    const dest = join(dir, f.path)
    await mkdir(dirname(dest), { recursive: true })
    const buf = await fetchBuffer(f.url)
    await writeFile(dest, buf)
    total += buf.length
  }
  return total
}

async function list(query) {
  const assets = await (await fetch(`${API}/assets?t=models`)).json()
  const re = new RegExp(query, 'i')
  const hits = Object.entries(assets).filter(
    ([k, v]) => re.test(k) || (v.tags ?? []).some((t) => re.test(t)) || (v.categories ?? []).some((c) => re.test(c)),
  )
  console.log(`${hits.length} resultados para "${query}":\n`)
  for (const [k, v] of hits.slice(0, 40)) console.log(`  ${k.padEnd(32)} ${(v.categories ?? []).join(', ')}`)
}

const args = process.argv.slice(2)

if (args[0] === '--list') {
  await list(args[1] ?? '.')
} else {
  const entries = args.length
    ? args.map((slug) => [slug, WANTED[slug] ?? slug.toLowerCase()])
    : Object.entries(WANTED)

  await mkdir(OUT, { recursive: true })
  let grand = 0

  for (const [slug, name] of entries) {
    const dir = join(OUT, name)
    try {
      await stat(join(dir, `${name}.gltf`))
      console.log(`· ${name.padEnd(14)} ya está`)
      continue
    } catch {
      /* no está, lo bajamos */
    }

    process.stdout.write(`↓ ${name.padEnd(14)} `)
    try {
      const size = await download(slug, name)
      grand += size
      console.log(kb(size))
    } catch (err) {
      console.log(`falló (${err.message}) — la escena usará la versión procedural`)
    }
  }

  console.log(`\ntotal descargado: ${(grand / 1048576).toFixed(1)} MB en public/models/`)
  console.log('modelos CC0 de Poly Haven — https://polyhaven.com/models')
}
