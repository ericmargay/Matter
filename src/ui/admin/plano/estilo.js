import { create } from 'zustand'
import * as THREE from 'three'

/**
 * El sistema de diseño 3D.
 *
 * Esto es lo que faltaba: cada mueble se estaba modelando por su cuenta, con
 * su propio color y su propio criterio de qué tan redondo iba. El resultado es
 * un cuarto que parece hecho por seis personas distintas — y la consistencia
 * importa más que el realismo, porque es lo que hace que un espacio se lea
 * como una maqueta diseñada y no como un montón de cajas.
 *
 * Aquí vive una sola vez lo que antes estaba repartido: el bisel, la
 * rugosidad, la paleta, la variación tonal y el tamaño de las sombras. Un
 * mueble nuevo no escoge nada de eso: lo pide.
 *
 * El Style Lab escribe sobre estos mismos valores en vivo, así que calibrar el
 * estilo es mover un deslizador y ver el cuarto entero responder — no editar
 * treinta archivos.
 */

/* ── paletas ──────────────────────────────────────────────────────
   Cada cuarto tiene una paleta controlada, no colores sueltos. La proporción
   que se busca es ~60 % dominante, ~25 % secundario y ~15 % de acento: es lo
   que hace que las referencias se vean compuestas en vez de decoradas. */

export const PALETAS = {
  coral: {
    label: 'Coral',
    muro: '#f0a08c',
    muroFrio: '#e28b78',
    piso: '#e9b183',
    dominante: '#f59d92',
    secundario: '#fbdcc2',
    acento: '#e2604a',
    apoyo: '#9c4f60',
    neutro: '#fdf1e6',
  },
  lavanda: {
    label: 'Lavanda',
    muro: '#b9a6ee',
    muroFrio: '#a894e2',
    piso: '#c4b0ee',
    dominante: '#c9b6f2',
    secundario: '#f2c6d2',
    acento: '#f08a9c',
    apoyo: '#6d5a9c',
    neutro: '#efe9fb',
  },
  menta: {
    label: 'Menta',
    muro: '#a8d6c8',
    muroFrio: '#94c7b8',
    piso: '#cfe0c6',
    dominante: '#bfe0d4',
    secundario: '#f4e2bd',
    acento: '#f0956f',
    apoyo: '#4f7a70',
    neutro: '#f1f6f0',
  },
  durazno: {
    label: 'Durazno',
    muro: '#f0b89a',
    muroFrio: '#e5a686',
    piso: '#eec49b',
    dominante: '#f7c9a8',
    secundario: '#bcd4e8',
    acento: '#e07a5f',
    apoyo: '#7c5a4e',
    neutro: '#faf0e6',
  },
  cielo: {
    label: 'Cielo',
    muro: '#a9c6e8',
    muroFrio: '#95b6de',
    piso: '#d3dcea',
    dominante: '#bcd5ee',
    secundario: '#f5d6c0',
    acento: '#5b8fd0',
    apoyo: '#42618c',
    neutro: '#f2f6fb',
  },
}

/* ── el estado del estilo, editable en vivo ─────────────────────── */

export const useEstilo = create((set) => ({
  paleta: 'coral',

  /* Bisel como FRACCIÓN de la dimensión menor de cada pieza, no en metros:
     así un sofá y un control remoto se ven del mismo lenguaje aunque midan
     cien veces distinto. 2 % a 8 % es el rango que sostiene la silueta. */
  bisel: 0.055,
  rugosidad: 0.72,
  metalico: 0.04,

  /* Cuánto se aclara la cara de arriba y se oscurece la de abajo. Es lo que
     evita que una caja pintada se vea como una caja pintada. */
  tono: 0.16,

  luzIntensidad: 1.0,
  luzColor: '#fff4e6',
  ambiente: 0.55,
  sombraSuave: 0.85,
  ao: 1.0,
  saturacion: 1.0,

  /* Las conexiones existen siempre; se ven cuando se piden. */
  verElectricas: false,
  verInalambricas: false,

  set: (parche) => set(parche),
  reiniciar: () =>
    set({
      bisel: 0.055,
      rugosidad: 0.72,
      metalico: 0.04,
      tono: 0.16,
      luzIntensidad: 1.0,
      luzColor: '#fff4e6',
      ambiente: 0.55,
      sombraSuave: 0.85,
      ao: 1.0,
      saturacion: 1.0,
    }),
}))

export const paletaDe = (id) => PALETAS[id] ?? PALETAS.coral

/* ── color ────────────────────────────────────────────────────── */

const cache = new Map()

/** Aplica la saturación global del Style Lab sin tocar el tono. */
function ajustar(hex, saturacion) {
  const c = new THREE.Color(hex)
  if (saturacion === 1) return c
  const hsl = {}
  c.getHSL(hsl)
  c.setHSL(hsl.h, Math.max(0, Math.min(1, hsl.s * saturacion)), hsl.l)
  return c
}

/**
 * El material de una pieza.
 *
 * Se cachea por firma: dos sillas del mismo color comparten material, que es
 * lo que hace que una casa entera no ahogue la GPU. `rol` permite desviarse
 * del acabado base sin salirse del lenguaje — un plástico brilla un poco más,
 * un metal refleja un poco, pero los dos siguen siendo de esta familia.
 */
export function materialDe(color, { rol = 'mate', rugosidad, metalico, saturacion = 1 } = {}) {
  const base = {
    mate: { r: 0, m: 0 },
    tela: { r: 0.18, m: 0 },
    plastico: { r: -0.16, m: 0.02 },
    ceramica: { r: -0.22, m: 0 },
    metal: { r: -0.34, m: 0.62 },
    vidrio: { r: -0.5, m: 0.1 },
    madera: { r: -0.04, m: 0 },
  }[rol] ?? { r: 0, m: 0 }

  const rug = Math.max(0.05, Math.min(1, (rugosidad ?? 0.72) + base.r))
  const met = Math.max(0, Math.min(1, (metalico ?? 0.04) + base.m))
  const clave = `${color}|${rol}|${rug.toFixed(2)}|${met.toFixed(2)}|${saturacion.toFixed(2)}`

  if (!cache.has(clave)) {
    cache.set(
      clave,
      new THREE.MeshStandardMaterial({
        color: ajustar(color, saturacion),
        roughness: rug,
        metalness: met,
        // el color por vértice lleva la variación tonal; sin esto una caja
        // se ve exactamente como una caja
        vertexColors: true,
        transparent: rol === 'vidrio',
        opacity: rol === 'vidrio' ? 0.4 : 1,
      }),
    )
  }
  return cache.get(clave)
}

/** Se llama cuando el Style Lab cambia algo que invalida los materiales. */
export const limpiarMateriales = () => cache.clear()
