import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { ESTADOS, PATRONES } from './estados'
import { Cadena, DeVezEnCuando, Resorte, vaiven } from './resortes'

/**
 * El motor del personaje: lo que lo mantiene vivo.
 *
 * Trabaja en TRES capas que se suman, y esa separación es la idea entera:
 *
 *   1. la animación del archivo —caminar, bailar— mezclada por AnimationMixer
 *   2. la vida procedural encima —respirar, mirar, parpadear, cargar el peso
 *      en una pierna y luego en la otra— que no está en ningún archivo porque
 *      no se puede animar a mano: cambia con cada estado y no puede repetirse
 *   3. el secondary motion debajo —oreja, cola, pelo, tela— que reacciona a lo
 *      que hicieron las dos anteriores
 *
 * Un personaje con solo la capa 1 se ve a maniquí con animaciones. Con las
 * tres se ve a criatura. Y las capas 2 y 3 son las que sobreviven cambiando de
 * malla: sirven igual para un GLB comprado que para el animalito de casa,
 * porque se enganchan por NOMBRE de hueso y no por índice.
 *
 * Sin clips en el archivo, la capa 1 simplemente no existe y las otras dos
 * hacen todo el trabajo. Eso es lo que permite tener esto andando hoy y que se
 * encienda solo el día que caiga un personaje de verdad.
 */
export function usePersonaje(raiz, { estado = 'quieto', clips = [], semilla = 0 } = {}) {
  const mixer = useMemo(() => (raiz ? new THREE.AnimationMixer(raiz) : null), [raiz])
  const acciones = useRef({})
  const actual = useRef(null)

  /* Los huesos que interesan, encontrados por nombre. Es lo que hace que esto
     funcione con cualquier rig sin configurarlo: un Mixamo, un rig de Blender y
     nuestro animalito nombran distinto pero todos dicen "head" de alguna
     forma. */
  const partes = useMemo(() => {
    const p = {
      cabeza: null, cuello: null, pecho: null, cadera: null,
      manoDer: null, manoIzq: null,
      orejas: [], colas: [], pelos: [], telas: [],
      caras: [],
    }
    if (!raiz) return p

    const cadenaDe = (hueso) => {
      const c = [hueso]
      let h = hueso
      while (h.children.length === 1 && h.children[0].isBone && c.length < 6) {
        h = h.children[0]
        c.push(h)
      }
      return c
    }

    raiz.traverse((o) => {
      if (o.morphTargetDictionary) p.caras.push(o)
      if (!o.isBone && !o.userData?.hueso) return
      const n = o.name ?? ''
      if (!p.cabeza && PATRONES.cabeza.test(n)) p.cabeza = o
      if (!p.cuello && PATRONES.cuello.test(n)) p.cuello = o
      if (!p.pecho && PATRONES.pecho.test(n)) p.pecho = o
      if (!p.cadera && PATRONES.cadera.test(n)) p.cadera = o
      if (!p.manoDer && PATRONES.manoDer.test(n)) p.manoDer = o
      if (!p.manoIzq && PATRONES.manoIzq.test(n)) p.manoIzq = o
      /* Solo la RAÍZ de cada cadena: enganchar cada eslabón por separado los
         haría pelearse entre ellos y la cola temblaría en vez de ondular. */
      if (PATRONES.oreja.test(n) && !PATRONES.oreja.test(o.parent?.name ?? '')) p.orejas.push(cadenaDe(o))
      if (PATRONES.cola.test(n) && !PATRONES.cola.test(o.parent?.name ?? '')) p.colas.push(cadenaDe(o))
      if (PATRONES.pelo.test(n) && !PATRONES.pelo.test(o.parent?.name ?? '')) p.pelos.push(cadenaDe(o))
      if (PATRONES.tela.test(n) && !PATRONES.tela.test(o.parent?.name ?? '')) p.telas.push(cadenaDe(o))
    })
    return p
  }, [raiz])

  /* Las cadenas de secondary motion. Cada tipo tiene su carácter: una oreja es
     rígida y no rebota, una cola rebota mucho, la tela cae con gravedad. */
  const cadenas = useMemo(() => {
    const c = []
    for (const h of partes.orejas) c.push(new Cadena(h, { rigidez: 130, amortiguacion: 0.8, caida: 0.8 }))
    for (const h of partes.colas) c.push(new Cadena(h, { rigidez: 55, amortiguacion: 0.42, caida: 0.72 }))
    for (const h of partes.pelos) c.push(new Cadena(h, { rigidez: 70, amortiguacion: 0.5, caida: 0.7 }))
    for (const h of partes.telas) c.push(new Cadena(h, { rigidez: 45, amortiguacion: 0.6, caida: 0.8, gravedad: 0.05 }))
    return c
  }, [partes])

  /* Los morph targets de la cara, si el modelo los trae. Sin ellos el
     personaje no parpadea y no hay nada que hacer al respecto: un parpadeo se
     hace con la malla, no con huesos. */
  const cara = useMemo(() => {
    const enc = { parpado: [], boca: [], ceja: [] }
    for (const m of partes.caras) {
      for (const [nombre, i] of Object.entries(m.morphTargetDictionary)) {
        if (PATRONES.parpado.test(nombre)) enc.parpado.push([m, i])
        else if (PATRONES.boca.test(nombre)) enc.boca.push([m, i])
        else if (PATRONES.ceja.test(nombre)) enc.ceja.push([m, i])
      }
    }
    return enc
  }, [partes])

  useEffect(() => {
    if (!mixer || !clips.length) return
    for (const c of clips) acciones.current[c.name] = mixer.clipAction(c)
    return () => {
      mixer.stopAllAction()
      acciones.current = {}
    }
  }, [mixer, clips])

  /* Cambio de estado con mezcla. El tiempo lo dice el estado al que se ENTRA,
     no el que se deja: despertar es lento aunque se venga de un susto. */
  useEffect(() => {
    const def = ESTADOS[estado] ?? ESTADOS.quieto
    const nueva = acciones.current[def.clip]
    if (!nueva) return
    const vieja = actual.current
    if (vieja === nueva) return
    nueva.reset()
    if (def.unaVez) {
      nueva.setLoop(THREE.LoopOnce, 1)
      nueva.clampWhenFinished = true
    } else {
      nueva.setLoop(THREE.LoopRepeat, Infinity)
    }
    /* Un pelín de variación en la velocidad. Dos criaturas iguales caminando
       exactamente al mismo paso delatan la copia al instante, y en una escena
       con varias es lo primero que se nota. */
    nueva.timeScale = 0.94 + ((semilla * 37) % 12) / 100
    nueva.fadeIn(def.entra).play()
    vieja?.fadeOut(def.entra)
    actual.current = nueva
  }, [estado, semilla])

  /* ── el latido ─────────────────────────────────────────────────
     Todo lo de abajo es la capa 2. Se guarda la rotación de reposo de cada
     hueso y se SUMA encima, para no borrar lo que puso la animación. */
  const base = useRef(new Map())
  const est = useRef({
    parpadeo: new DeVezEnCuando(4, 0.7),
    vistazo: new DeVezEnCuando(5.5, 0.8),
    oreja: new DeVezEnCuando(3.2, 0.9),
    cerrado: 0,
    miraX: new Resorte(0, { rigidez: 45, amortiguacion: 0.9 }),
    miraY: new Resorte(0, { rigidez: 45, amortiguacion: 0.9 }),
    peso: new Resorte(0, { rigidez: 8, amortiguacion: 0.9 }),
    cambioPeso: new DeVezEnCuando(6, 0.7),
    tirón: new Resorte(0, { rigidez: 120, amortiguacion: 0.5 }),
  })

  const guardarReposo = (o) => {
    if (!o) return null
    if (!base.current.has(o)) base.current.set(o, o.quaternion.clone())
    return base.current.get(o)
  }

  const sumar = (o, x, y, z) => {
    const r = guardarReposo(o)
    if (!r) return
    EULER.set(x, y, z)
    QUAT.setFromEuler(EULER)
    o.quaternion.copy(r).multiply(QUAT)
  }

  useFrame((st, dt) => {
    const d = Math.min(dt, 1 / 20)
    mixer?.update(d)

    const def = ESTADOS[estado] ?? ESTADOS.quieto
    const v = def.vida
    const t = st.clock.elapsedTime + semilla * 3.7
    const e = est.current

    /* Respiración. Va SIEMPRE, en todos los estados, incluso dormido —uno que
       no respira se lee como maniquí aunque esté quieto—. Dormido respira más
       hondo y más lento, que es lo que lo distingue de apagado. */
    const hondo = v.hondo ?? 1
    const aire = Math.sin(t * 1.5 * v.respira) * 0.5 + 0.5
    if (partes.pecho) {
      const r = guardarReposo(partes.pecho)
      if (r) sumar(partes.pecho, -aire * 0.035 * hondo, 0, 0)
      partes.pecho.scale.setScalar(1 + aire * 0.012 * hondo)
    }

    // el peso cambia de pierna cada tantos segundos, no en cada cuadro
    if (v.peso > 0 && e.cambioPeso.paso(d)) e.peso.meta = (Math.random() < 0.5 ? -1 : 1) * v.peso
    const peso = e.peso.paso(d)
    if (partes.cadera) sumar(partes.cadera, 0, peso * 0.03, peso * 0.045)

    // la mirada se va a un lado de vez en cuando y vuelve sola
    if (v.mirada > 0 && e.vistazo.paso(d)) {
      e.miraX.meta = (Math.random() - 0.5) * 0.5 * v.mirada
      e.miraY.meta = (Math.random() - 0.5) * 0.22 * v.mirada
      setTimeout(() => {
        e.miraX.meta = 0
        e.miraY.meta = 0
      }, 500 + Math.random() * 900)
    }
    const mx = e.miraX.paso(d)
    const my = e.miraY.paso(d)
    const tir = e.tirón.paso(d)

    if (partes.cabeza) {
      sumar(
        partes.cabeza,
        my + vaiven(t, 0.7, semilla) * 0.02 * v.respira - tir * 0.5,
        mx + vaiven(t, 0.45, semilla + 3) * 0.05 * v.mirada,
        vaiven(t, 0.6, semilla + 7) * 0.015,
      )
    }
    if (partes.cuello) sumar(partes.cuello, my * 0.4, mx * 0.4, 0)

    /* Parpadeo: se cierra rápido y se abre despacio, como de verdad. Igual de
       rápido en los dos sentidos parece un obturador. */
    if (v.parpadeo > 0 && e.parpadeo.paso(d)) e.cerrado = 1
    if (e.cerrado > 0) e.cerrado = Math.max(0, e.cerrado - d * (e.cerrado > 0.6 ? 9 : 4.5))
    const cierre = estado === 'duerme' ? 1 : Math.sin(Math.min(1, e.cerrado) * Math.PI) ** 0.6
    for (const [m, i] of cara.parpado) m.morphTargetInfluences[i] = cierre

    // microexpresión: la boca y las cejas se mueven un pelo con la respiración
    for (const [m, i] of cara.boca) m.morphTargetInfluences[i] = aire * 0.12 * v.respira
    for (const [m, i] of cara.ceja) m.morphTargetInfluences[i] = Math.max(0, mx) * 0.3

    // las orejas se sacuden de vez en cuando, que es lo más animal de todo
    if (v.oreja > 0 && e.oreja.paso(d)) e.tirón.meta = 0.25 * v.oreja
    if (e.tirón.meta !== 0 && Math.abs(tir - e.tirón.meta) < 0.05) e.tirón.meta = 0

    // capa 3: lo que cuelga, reaccionando a lo que hicieron las otras dos
    const raizCadena = partes.pecho ?? partes.cadera ?? raiz
    if (raizCadena) for (const c of cadenas) c.paso(d, raizCadena)
  })

  return {
    partes,
    cara,
    /** Da un tirón de oreja/cabeza a mano, para reaccionar a algo. */
    reaccionar: (f = 1) => {
      est.current.tirón.meta = 0.3 * f
    },
    tieneClips: Object.keys(acciones.current).length > 0,
  }
}

const EULER = new THREE.Euler()
const QUAT = new THREE.Quaternion()
