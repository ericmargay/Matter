import * as THREE from 'three'

/**
 * Lo que hace que un personaje parezca vivo cuando está quieto.
 *
 * Un rig animado mueve huesos; lo que convierte eso en una criatura es lo que
 * NO está animado: la oreja que llega tarde al giro de la cabeza, la cola que
 * sigue oscilando después de que el cuerpo se detuvo, la tela que se acomoda
 * medio segundo tarde. Eso no se anima a mano —sería inanimable, cambia con
 * cada movimiento— se simula, y es lo que se llama secondary motion.
 *
 * Todo aquí es un resorte amortiguado. Un solo modelo para orejas, cola, pelo,
 * ropa y accesorios, porque físicamente es el mismo problema: una masa colgada
 * de algo que se mueve.
 */

/**
 * Resorte amortiguado sobre un valor.
 *
 * `rigidez` decide qué tan rápido persigue al objetivo y `amortiguacion` cuánto
 * rebota al llegar. Con amortiguación 1 llega y se queda —lo que se quiere en
 * una mano—; por debajo de 1 rebota, que es lo que se quiere en una cola.
 *
 * Se integra con paso fijo aunque el cuadro venga largo: con `dt` grande y sin
 * subdividir, un resorte rígido se dispara al infinito y el hueso desaparece de
 * la pantalla. Pasa de verdad, en cuanto alguien cambia de pestaña y vuelve.
 */
export class Resorte {
  constructor(valor = 0, { rigidez = 90, amortiguacion = 0.7 } = {}) {
    this.valor = valor
    this.meta = valor
    this.v = 0
    this.rigidez = rigidez
    this.amortiguacion = amortiguacion
  }

  paso(dt) {
    const h = Math.min(dt, 1 / 30)
    const n = Math.max(1, Math.ceil(dt / h))
    const d = dt / n
    const c = 2 * Math.sqrt(this.rigidez) * this.amortiguacion
    for (let i = 0; i < n; i++) {
      const a = (this.meta - this.valor) * this.rigidez - this.v * c
      this.v += a * d
      this.valor += this.v * d
    }
    return this.valor
  }
}

const V = new THREE.Vector3()
const Q = new THREE.Quaternion()
const E = new THREE.Euler()

/**
 * Una cadena de huesos que va con retraso.
 *
 * Es el patrón de la cola, la oreja larga, la trenza y la falda: cada eslabón
 * persigue la orientación de su padre con un resorte, y como cada uno llega
 * tarde, la cadena entera ondula. El retraso crece hacia la punta —la base
 * manda, la punta obedece— que es lo que hace la ondulación en vez de un
 * bloque rígido girando.
 *
 * Trabaja sobre la rotación LOCAL y guarda la de reposo: así respeta la pose
 * que traiga la animación en vez de pelearse con ella. Un secondary motion que
 * ignora la animación se ve como un error, no como peso.
 */
export class Cadena {
  constructor(huesos, { rigidez = 60, amortiguacion = 0.55, caida = 0.75, gravedad = 0 } = {}) {
    this.huesos = huesos
    this.reposo = huesos.map((h) => h.quaternion.clone())
    /* El retraso crece hacia la punta: la base manda y la punta obedece. Es lo
       que hace la ondulación en vez de un bloque rígido girando. */
    this.resortes = huesos.map((_, i) => {
      const k = rigidez * Math.pow(caida, i)
      return {
        x: new Resorte(0, { rigidez: k, amortiguacion }),
        y: new Resorte(0, { rigidez: k, amortiguacion }),
        z: new Resorte(0, { rigidez: k, amortiguacion }),
      }
    })
    this.gravedad = gravedad
    this.previa = new THREE.Vector3()
    this.iniciado = false
  }

  /**
   * @param dt   segundos del cuadro
   * @param raiz objeto cuyo movimiento arrastra la cadena (el pecho, la cabeza)
   */
  paso(dt, raiz) {
    if (!this.huesos.length) return

    /* La cadena reacciona a cómo se MUEVE la raíz, no a dónde está. Un
       personaje parado en otro sitio no debe agitar la cola; uno que acaba de
       girar, sí. */
    raiz.getWorldPosition(V)
    if (!this.iniciado) {
      this.previa.copy(V)
      this.iniciado = true
    }
    const empuje = V.clone().sub(this.previa).multiplyScalar(1 / Math.max(dt, 1 / 240))
    this.previa.copy(V)

    // al marco local de la raíz: el empuje se siente en los ejes del hueso
    raiz.getWorldQuaternion(Q)
    empuje.applyQuaternion(Q.invert())

    for (let i = 0; i < this.huesos.length; i++) {
      const r = this.resortes[i]
      const peso = 0.06 / (1 + i * 0.4)
      r.x.meta = THREE.MathUtils.clamp(-empuje.z * peso + this.gravedad, -0.6, 0.6)
      r.z.meta = THREE.MathUtils.clamp(empuje.x * peso, -0.6, 0.6)
      r.y.meta = THREE.MathUtils.clamp(-empuje.x * peso * 0.4, -0.4, 0.4)

      E.set(r.x.paso(dt), r.y.paso(dt), r.z.paso(dt))
      Q.setFromEuler(E)
      this.huesos[i].quaternion.copy(this.reposo[i]).multiply(Q)
    }
  }
}

/**
 * Ruido suave y sin repetición aparente.
 *
 * Un seno puro delata el bucle a los cuatro segundos: el ojo humano encuentra
 * la repetición antes de que uno se dé cuenta, y en cuanto la encuentra el
 * personaje se vuelve un mecanismo. Sumar tres senos de periodos que no son
 * múltiplos entre sí da algo que no se repite en minutos y sigue costando tres
 * multiplicaciones.
 */
export function vaiven(t, base = 1, semilla = 0) {
  return (
    Math.sin(t * base + semilla) * 0.6 +
    Math.sin(t * base * 1.618 + semilla * 2.3) * 0.3 +
    Math.sin(t * base * 2.71 + semilla * 5.1) * 0.1
  )
}

/**
 * Cada cuánto pasa algo que no es periódico: un parpadeo, un vistazo, un
 * movimiento de oreja.
 *
 * Devuelve `true` en cuadros sueltos con el intervalo medio pedido, pero nunca
 * a intervalos fijos. Un parpadeo cada exactamente 4 s se ve peor que ninguno.
 */
export class DeVezEnCuando {
  constructor(cada = 4, dispersion = 0.6) {
    this.cada = cada
    this.dispersion = dispersion
    this.falta = this.siguiente()
  }

  siguiente() {
    return this.cada * (1 - this.dispersion + Math.random() * this.dispersion * 2)
  }

  paso(dt) {
    this.falta -= dt
    if (this.falta > 0) return false
    this.falta = this.siguiente()
    return true
  }
}
