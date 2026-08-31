import * as THREE from 'three'

/**
 * Una pieza hecha de partes, guardada como datos.
 *
 * Todo lo del catálogo es un componente de código: para mover el respaldo de
 * una silla dos centímetros hay que editar el archivo. Eso está bien para las
 * setenta y nueve familias que ya existen y es imposible para la ochenta: la
 * consola que vio el cliente en una foto, el nicho que hizo el carpintero, la
 * cabecera que se va a mandar hacer.
 *
 * Una pieza propia es una lista de primitivas con su posición. No pretende ser
 * un modelador: son cinco formas y sus medidas, que es exactamente lo que se
 * necesita para que en un plano isométrico la silueta sea la correcta —que es
 * lo único que llega a esa distancia.
 *
 * Y sirve para lo otro: cualquier pieza del catálogo se puede HORNEAR a este
 * formato, y a partir de ahí sus partes se mueven una por una. Es el puente
 * entre "esto es un mueble del sistema" y "esto ya es mío".
 */

export const FORMAS = {
  caja: { label: 'Caja', med: ['Ancho', 'Alto', 'Fondo'], def: [0.4, 0.4, 0.4] },
  cilindro: { label: 'Cilindro', med: ['Diámetro', 'Alto', 'Diámetro sup.'], def: [0.3, 0.4, 0.3] },
  esfera: { label: 'Esfera', med: ['Diámetro', '', ''], def: [0.3, 0.3, 0.3] },
  capsula: { label: 'Tubo', med: ['Grosor', 'Largo', ''], def: [0.04, 0.6, 0.04] },
  placa: { label: 'Placa', med: ['Ancho', 'Grosor', 'Fondo'], def: [0.6, 0.03, 0.4] },
}

/* Los tonos son los de la paleta del cuarto, no colores sueltos: una pieza
   propia tiene que pertenecer a la casa igual que las del catálogo. */
export const TONOS = ['apoyo', 'dominante', 'secundario', 'acento', 'neutro', 'muro', 'piso']

export const ROLES = ['madera', 'mate', 'tela', 'metal', 'ceramica', 'plastico', 'vidrio']

export const parteVacia = (forma = 'caja') => ({
  id: Math.random().toString(36).slice(2, 9),
  forma,
  med: [...FORMAS[forma].def],
  pos: [0, FORMAS[forma].def[1] / 2, 0],
  rot: [0, 0, 0],
  tono: 'apoyo',
  rol: 'madera',
})

export const piezaVacia = (label = 'Pieza propia') => ({
  label,
  partes: [parteVacia('caja')],
})

/** La huella de una pieza propia: lo que ocupa de verdad, sumando sus partes. */
export function medidaDePieza(pieza) {
  const caja = new THREE.Box3()
  const tmp = new THREE.Box3()
  const v = new THREE.Vector3()
  for (const p of pieza?.partes ?? []) {
    const [a, b, c] = p.med
    // media medida de cada eje, sin girar: alcanza para la huella del plano
    v.set(Math.max(a, c) / 2, (p.forma === 'esfera' ? a : b) / 2, Math.max(a, c) / 2)
    tmp.setFromCenterAndSize(new THREE.Vector3(...p.pos), v.clone().multiplyScalar(2))
    caja.union(tmp)
  }
  if (caja.isEmpty()) return { w: 0.4, d: 0.4, alto: 0.4 }
  return {
    w: Number((caja.max.x - caja.min.x).toFixed(3)),
    d: Number((caja.max.z - caja.min.z).toFixed(3)),
    alto: Number(caja.max.y.toFixed(3)),
  }
}

/* ── hornear una pieza del catálogo ──────────────────────────────
   Se recorre lo que YA está dibujado y se traduce cada malla a una parte. Se
   lee la geometría montada y no el código del componente: así funciona igual
   con los muebles del recorrido, con los del plano y con los que se escriban
   mañana, sin saber nada de ninguno. */

const V = new THREE.Vector3()
const Q = new THREE.Quaternion()
const S = new THREE.Vector3()
const E = new THREE.Euler()
const M = new THREE.Matrix4()

const redondo = (n) => Number(n.toFixed(4))

/**
 * @param raiz  el Object3D de la pieza ya montada
 * @returns { label, partes } listo para editar
 */
export function hornear(raiz, label = 'Pieza propia') {
  if (!raiz) return piezaVacia(label)
  raiz.updateWorldMatrix(true, true)
  M.copy(raiz.matrixWorld).invert()

  const partes = []
  raiz.traverse((o) => {
    if (!o.isMesh || !o.geometry || o.userData.cota || o.userData.ayuda || o.visible === false) return
    const g = o.geometry
    const p = g.parameters ?? {}
    /* La escala del nodo cuenta: media escena dibuja cajas de 1×1×1 escaladas.
       Sin multiplicarla, una pieza horneada salía toda de un metro. */
    M.clone().multiply(o.matrixWorld).decompose(V, Q, S)
    E.setFromQuaternion(Q)

    let forma = 'caja'
    let med = [0.2, 0.2, 0.2]

    if (/Box/.test(g.type)) {
      forma = 'caja'
      med = [(p.width ?? 1) * S.x, (p.height ?? 1) * S.y, (p.depth ?? 1) * S.z]
    } else if (/Cylinder/.test(g.type)) {
      forma = 'cilindro'
      med = [(p.radiusBottom ?? 0.5) * 2 * S.x, (p.height ?? 1) * S.y, (p.radiusTop ?? 0.5) * 2 * S.z]
    } else if (/Capsule/.test(g.type)) {
      forma = 'capsula'
      med = [(p.radius ?? 0.05) * 2 * S.x, (p.length ?? 0.5) * S.y, (p.radius ?? 0.05) * 2 * S.z]
    } else if (/Sphere|Icosahedron/.test(g.type)) {
      forma = 'esfera'
      med = [(p.radius ?? 0.2) * 2 * S.x, (p.radius ?? 0.2) * 2 * S.y, (p.radius ?? 0.2) * 2 * S.z]
    } else if (/Plane|Circle/.test(g.type)) {
      forma = 'placa'
      const ancho = p.width ?? (p.radius != null ? p.radius * 2 : 0.5)
      const fondo = p.height ?? (p.radius != null ? p.radius * 2 : 0.5)
      med = [ancho * S.x, 0.02, fondo * S.z]
    } else {
      /* Cualquier otra cosa —una forma extruida, una tesela— se aproxima con
         su caja envolvente. Pierde detalle y conserva el volumen, que es lo
         que se está editando. */
      if (!g.boundingBox) g.computeBoundingBox()
      const b = g.boundingBox
      med = [(b.max.x - b.min.x) * S.x, (b.max.y - b.min.y) * S.y, (b.max.z - b.min.z) * S.z]
    }

    partes.push({
      id: Math.random().toString(36).slice(2, 9),
      forma,
      med: med.map((n) => Math.max(0.005, redondo(Math.abs(n)))),
      pos: [redondo(V.x), redondo(V.y), redondo(V.z)],
      rot: [redondo(E.x), redondo(E.y), redondo(E.z)],
      tono: 'apoyo',
      rol: 'mate',
      /* Se guarda el color con el que venía para no perder de golpe la lectura
         de la pieza: horneada, una cama no debe volverse un bloque monocromo. */
      color: o.material?.color ? `#${o.material.color.getHexString()}` : undefined,
    })
  })

  return { label, partes: partes.slice(0, 120) }
}
