/**
 * Qué abrir para revisar el proyecto.
 *
 * Lee por la entrada estándar lo que devuelve `/api/estado` y escupe, en TSV,
 * el proyecto y los cuartos que vale la pena mirar. Lo usa `abrir.command`.
 *
 * Vive en su propio archivo y no incrustado en el script de shell por una
 * razón práctica: el JS dentro de comillas de bash convierte cualquier `\t`
 * en una hora de depuración, y aquí además se puede leer y corregir.
 *
 *   PROYECTO <tab> id <tab> nombre
 *   CUARTO   <tab> id <tab> nombre <tab> tipo
 */

/* Se prefiere un cuarto de cada tipo antes que varios del mismo: el acomodo
   automático se comporta distinto en una recámara que en un baño o en una
   oficina, y revisar tres recámaras no dice nada nuevo. */
const ORDEN = [
  'recamara',
  'bano',
  'cocina',
  'sala',
  'estudio',
  'comedor',
  'servicio',
  'exterior',
  'generico',
  'otro',
]

const maximo = Number(process.env.PLANOS) || 3

let crudo = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => (crudo += c))
process.stdin.on('end', () => {
  let proyectos = []
  try {
    proyectos = (JSON.parse(crudo).estado?.proyectos ?? []).filter((p) => !p.archivado)
  } catch {
    return // sin sesión o sin servidor: el script de shell ya lo reporta
  }

  const dibujados = (p) => p.rooms.filter((r) => r.plano?.items?.length)

  // el proyecto con más cuartos dibujados es el que mejor se revisa
  const elegido = proyectos.slice().sort((a, b) => dibujados(b).length - dibujados(a).length)[0]
  if (!elegido) return

  const lineas = [['PROYECTO', elegido.id, elegido.nombre].join('\t')]

  // de cada tipo, el cuarto con más piezas: el que más tiene que enseñar
  const porTipo = new Map()
  for (const r of dibujados(elegido)) {
    const tipo = r.plano.tipoCuarto ?? 'otro'
    const previo = porTipo.get(tipo)
    if (!previo || r.plano.items.length > previo.plano.items.length) porTipo.set(tipo, r)
  }

  const cuartos = [...porTipo.entries()]
    .sort((a, b) => ORDEN.indexOf(a[0]) - ORDEN.indexOf(b[0]))
    .slice(0, maximo)

  for (const [tipo, r] of cuartos) lineas.push(['CUARTO', r.id, r.nombre, tipo].join('\t'))

  process.stdout.write(lineas.join('\n'))
})
