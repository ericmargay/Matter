import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/store'

/**
 * Puente entre el centro de control (React) y las luces (three).
 *
 * El store guarda el estado que el usuario pidió; `dim` guarda el estado que
 * la escena está mostrando ahorita. Entre uno y otro hay una interpolación,
 * porque un foco real no salta de 0 a 100: sube. Esa rampa es justamente lo
 * que hace que la demo se sienta como una casa y no como un checkbox.
 */

/** 2700K cálido ↔ 5000K neutro frío. Es el rango de un foco regulable real. */
const WARM = new THREE.Color('#ffa955')
const COOL = new THREE.Color('#d6e4ff')

const room = () => ({
  level: 0,
  warmth: 1,
  blinds: 0,
  tv: 0,
  busy: 0,
  fan: 0,
  color: new THREE.Color(),
})

export const dim = {
  garage: room(),
  recibidor: room(),
  sala: room(),
  cocina: room(),
  bano: room(),
  recamara: room(),
  banoP: room(),
  estudio: room(),
  balcon: room(),
}

/**
 * Un solo componente suaviza los cuatro cuartos cada frame. Las luces
 * después solo leen `dim`, sin suscribirse al store: cero re-renders.
 */
export function HomeRuntime() {
  useFrame((_, delta) => {
    const home = useStore.getState().home
    // rampa independiente del framerate; ~0.35 s para llegar al valor
    const k = 1 - Math.pow(0.0006, Math.min(delta, 0.05))

    for (const id in dim) {
      const d = dim[id]
      const target = home[id]
      if (!target) continue

      d.level = THREE.MathUtils.lerp(d.level, target.level ?? 0, k)
      d.warmth = THREE.MathUtils.lerp(d.warmth, target.warmth ?? 1, k)
      // la persiana es un motor: más lenta que la luz, a propósito
      d.blinds = THREE.MathUtils.lerp(d.blinds, target.blinds ?? 0, k * 0.35)
      d.tv = THREE.MathUtils.lerp(d.tv, target.tv ? 1 : 0, k)
      d.busy = THREE.MathUtils.lerp(d.busy, target.busy ? 1 : 0, k)
      // el extractor arranca y para con inercia, como un motor chico
      d.fan = THREE.MathUtils.lerp(d.fan, target.fan ? 1 : 0, k * 0.5)

      d.color.copy(COOL).lerp(WARM, d.warmth)
    }
  })

  return null
}

/**
 * Conecta una luminaria al cuarto al que pertenece.
 *
 * @param light  ref a una luz de three (opcional)
 * @param mats   materiales emisivos que representan el foco visible
 */
export function useDimmed(id, { light, lights, mats = [], intensity = 4, emissive = 2.4, minEmissive = 0.05 } = {}) {
  useFrame(() => {
    const d = dim[id]
    if (!d) return

    // una luminaria puede tener varias luces (una tira LED lleva dos)
    for (const ref of lights ?? [light]) {
      if (!ref?.current) continue
      ref.current.intensity = intensity * d.level
      ref.current.color.copy(d.color)
      ref.current.visible = d.level > 0.01
    }

    for (const m of mats) {
      m.emissive.copy(d.color)
      m.emissiveIntensity = minEmissive + emissive * d.level
    }
  })
}
