import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { caja } from './geo'
import { muroAcabadoDe, pisoDe } from './acabados'

/**
 * Cómo se dibujan los acabados de piso y muro.
 *
 * Todo es relieve, no textura. A la distancia de un plano isométrico una
 * imagen de duela se ve sucia y unas tablas de verdad se leen: se distingue
 * el sentido de la tabla, el ancho de la loseta, la hilada del tabique. Y
 * además responde a la luz, que es la mitad de lo que se está enseñando.
 *
 * Se dibuja con `instancedMesh` porque son muchas piezas iguales —una duela
 * de 4.6 m son veinticinco tablas, un muro de tabique veintiocho hiladas— y
 * una malla por pieza tiraría los cuadros por segundo del editor. Instanciado
 * son tres llamadas de dibujo para todo el piso.
 */

/** Muchas copias de la misma pieza, en una sola llamada de dibujo. */
function Repetido({ geometry, material, poses, recibeSombra = true }) {
  const ref = useRef()
  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const e = useMemo(() => new THREE.Euler(), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  const s = useMemo(() => new THREE.Vector3(), [])

  useLayoutEffect(() => {
    const o = ref.current
    if (!o) return
    poses.forEach((p, i) => {
      v.set(p.x ?? 0, p.y ?? 0, p.z ?? 0)
      e.set(0, p.rot ?? 0, 0)
      q.setFromEuler(e)
      s.set(p.sx ?? 1, p.sy ?? 1, p.sz ?? 1)
      m.compose(v, q, s)
      o.setMatrixAt(i, m)
    })
    o.instanceMatrix.needsUpdate = true
    o.computeBoundingSphere()
  }, [poses, m, q, e, v, s])

  if (poses.length === 0) return null
  return (
    <instancedMesh
      /* Con `key` por cantidad: cambiar de duela a concreto pasa de veinticinco
         piezas a una, y sin remontar quedaban las tablas viejas dibujadas
         encima del piso nuevo hasta recargar. */
      key={`${poses.length}`}
      ref={ref}
      args={[geometry, material, poses.length]}
      receiveShadow={recibeSombra}
      /* Nada de esto es la pieza ni una ayuda de trabajo: es el cuarto. Se
         marca para que las cotas no lo midan ni el ratón lo tome. */
      raycast={() => null}
    />
  )
}

const GRUESO = 0.014 // qué tanto sobresale el acabado del firme

/**
 * El acabado del piso, encima del firme.
 *
 * Su cara de arriba queda un milímetro sobre el cero del cuarto: los muebles
 * siguen apoyando en cero y ese milímetro evita que las dos superficies se
 * peleen por el mismo píxel.
 */
export function AcabadoPiso({ ancho, largo, id, material, materialAlterno, bisel, tono }) {
  const { trazo } = pisoDe(id)

  const piezas = useMemo(() => {
    const A = ancho + 0.02
    const L = largo + 0.02
    const y = 0.001 - GRUESO / 2

    /* Concreto pulido: una sola losa continua. Se dibuja igual que las otras
       —no se deja al firme asomar— porque el firme lleva el color de la duela
       y un concreto color madera no es un concreto. */
    if (trazo.modo === 'liso')
      return { geo: [1, 1, 1], a: [{ x: 0, y, z: 0, sx: A, sy: GRUESO, sz: L }], b: [] }

    if (trazo.modo === 'tablas') {
      const paso = trazo.ancho
      const n = Math.max(1, Math.round(A / paso))
      const w = A / n - trazo.junta
      const a = []
      const b = []
      for (let i = 0; i < n; i++) {
        const x = -A / 2 + (i + 0.5) * (A / n)
        /* Trabado: cada tabla se parte en dos y las juntas de una hilera no
           coinciden con las de la de al lado. Sin eso se ve tarima, no duela. */
        const cortes = trazo.trabado ? (i % 2 === 0 ? [0.42, 0.58] : [0.66, 0.34]) : [1]
        let z = -L / 2
        cortes.forEach((f, k) => {
          const largoPieza = L * f - trazo.junta
          const p = { x, y, z: z + (L * f) / 2, sx: w, sy: GRUESO, sz: largoPieza }
          // una de cada tres tablas un punto más clara: la madera nunca es pareja
          ;((i + k) % 3 === 0 ? b : a).push(p)
          z += L * f
        })
      }
      return { geo: [1, 1, 1], a, b }
    }

    // losetas
    const nx = Math.max(1, Math.round(A / trazo.ancho))
    const nz = Math.max(1, Math.round(L / trazo.largo))
    const w = A / nx - trazo.junta
    const d = L / nz - trazo.junta
    const a = []
    const b = []
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const p = {
          x: -A / 2 + (i + 0.5) * (A / nx),
          y,
          z: -L / 2 + (j + 0.5) * (L / nz),
          sx: w,
          sy: GRUESO,
          sz: d,
        }
        /* Todas del mismo tono. Alternando dos, el porcelánico salía a
           damero de cocina de fonda: la loseta de verdad es pareja y lo que
           se ve es la junta, no el cambio de color. */
        a.push(p)
      }
    return { geo: [1, 1, 1], a, b }
  }, [ancho, largo, trazo])

  const cubo = useMemo(() => caja(1, 1, 1, Math.min(bisel ?? 0.05, 0.12), tono ?? 0.12), [bisel, tono])

  if (!piezas.geo) return null
  return (
    <>
      <Repetido geometry={cubo} material={material} poses={piezas.a} />
      <Repetido geometry={cubo} material={materialAlterno ?? material} poses={piezas.b} />
    </>
  )
}

/**
 * El acabado de un muro: lo que se le pega encima de la pintura.
 *
 * Va en coordenadas del muro —X a lo largo, Y a lo alto, Z hacia adentro del
 * cuarto— y el que lo llama se encarga de girarlo. Así los cuatro muros usan
 * exactamente el mismo código.
 */
export function AcabadoMuro({ ancho, alto, grosor, id, material, materialApoyo, bisel, tono }) {
  const { trazo } = muroAcabadoDe(id)
  const z = grosor / 2 // la cara interior

  const partes = useMemo(() => {
    if (trazo.modo === 'liso') return { bandas: [], marcos: [] }

    if (trazo.modo === 'banda') {
      const s = trazo.saliente
      return {
        bandas: [
          { x: 0, y: trazo.alto / 2, z: z + s / 2, sx: ancho, sy: trazo.alto, sz: s },
          // la moldura que remata arriba: es lo que separa un lambrín de una franja de pintura
          { x: 0, y: trazo.alto + trazo.moldura / 2, z: z + s + 0.006, sx: ancho, sy: trazo.moldura, sz: s + 0.018 },
        ],
        marcos: [],
      }
    }

    if (trazo.modo === 'hiladas') {
      const n = Math.max(1, Math.floor(alto / trazo.alto))
      const bandas = []
      for (let i = 0; i < n; i++)
        bandas.push({
          x: 0,
          y: (i + 0.5) * trazo.alto,
          z: z + trazo.saliente / 2,
          sx: ancho,
          sy: trazo.alto - trazo.junta,
          sz: trazo.saliente,
        })
      return { bandas, marcos: [] }
    }

    // panel: cuadros de moldura repartidos a lo ancho
    const cuantos = Math.max(1, Math.round(ancho / 1.15))
    const hueco = ancho / cuantos
    const m = trazo.marco
    const h = trazo.alto - 0.5
    const marcos = []
    for (let i = 0; i < cuantos; i++) {
      const cx = -ancho / 2 + (i + 0.5) * hueco
      const w = hueco - 0.28
      const y0 = 0.35
      const zz = z + trazo.saliente / 2
      marcos.push(
        { x: cx, y: y0 + m / 2, z: zz, sx: w, sy: m, sz: trazo.saliente },
        { x: cx, y: y0 + h - m / 2, z: zz, sx: w, sy: m, sz: trazo.saliente },
        { x: cx - w / 2 + m / 2, y: y0 + h / 2, z: zz, sx: m, sy: h, sz: trazo.saliente },
        { x: cx + w / 2 - m / 2, y: y0 + h / 2, z: zz, sx: m, sy: h, sz: trazo.saliente },
      )
    }
    return { bandas: [], marcos }
  }, [ancho, alto, trazo, z])

  const cubo = useMemo(() => caja(1, 1, 1, Math.min(bisel ?? 0.05, 0.1), tono ?? 0.12), [bisel, tono])

  return (
    <>
      <Repetido geometry={cubo} material={materialApoyo ?? material} poses={partes.bandas} />
      <Repetido geometry={cubo} material={material} poses={partes.marcos} />
    </>
  )
}
