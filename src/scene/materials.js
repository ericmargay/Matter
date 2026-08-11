import * as THREE from 'three'
import { getTextures } from './textures'

/**
 * Materiales compartidos.
 * Se instancian una sola vez: cada material nuevo es un shader nuevo que
 * three tiene que compilar, y en una escena con ~200 mallas eso se nota.
 */
const T = getTextures()

/** Clona una textura para poder darle otra repetición sin tocar el original. */
function rep(tex, n) {
  const t = tex.clone()
  t.needsUpdate = true
  t.repeat.set(n, n)
  return t
}

/** Material con mapa de color y de relieve. `bump` gradúa el relieve. */
function pbr(tex, repeat, color, { bump = 0.7, ...opts } = {}) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    map: rep(tex.map, repeat),
    normalMap: rep(tex.normalMap, repeat),
    normalScale: new THREE.Vector2(bump, bump),
    ...opts,
  })
}

const std = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color: new THREE.Color(color), ...opts })

export const M = {
  // ── envolvente ──────────────────────────────────────────────
  facade: pbr(T.plaster, 3, '#3a322c', { roughness: 0.95, bump: 0.5 }),
  wallOut: pbr(T.plaster, 3, '#463c34', { roughness: 0.92, bump: 0.5 }),
  wallIn: pbr(T.plaster, 2.4, '#4d4239', { roughness: 0.9, bump: 0.45 }),
  wallAccent: pbr(T.wood, 0.6, '#8a5433', { roughness: 0.62, bump: 0.5 }),
  roof: std('#1f1a16', { roughness: 0.9 }),
  slab: std('#191512', { roughness: 1 }),

  // ── pisos ───────────────────────────────────────────────────
  woodFloor: pbr(T.wood, 3.2, '#9a6741', { roughness: 0.48, bump: 0.9 }),
  woodFloorDark: pbr(T.wood, 3.2, '#6b4630', { roughness: 0.52, bump: 0.9 }),
  tile: pbr(T.tile, 3, '#8f867a', { roughness: 0.32, bump: 0.5 }),
  tileWall: pbr(T.tile, 2, '#7d766c', { roughness: 0.25, bump: 0.4 }),
  concrete: pbr(T.plaster, 4, '#4a453f', { roughness: 0.85, bump: 0.6 }),
  deck: pbr(T.wood, 3, '#7a6550', { roughness: 0.7, bump: 1.1 }),
  terrain: std('#12100e', { roughness: 1 }),

  // ── mobiliario ──────────────────────────────────────────────
  wood: pbr(T.wood, 1.4, '#b5794a', { roughness: 0.55, bump: 0.7 }),
  woodDark: pbr(T.wood, 1.4, '#59402e', { roughness: 0.6, bump: 0.7 }),
  fabric: pbr(T.fabric, 4, '#39415e', { roughness: 0.95, bump: 0.6 }),
  fabricLight: pbr(T.fabric, 4, '#cfc4b1', { roughness: 0.95, bump: 0.6 }),
  metal: std('#1d1d20', { roughness: 0.35, metalness: 0.8 }),
  metalWarm: std('#b98b56', { roughness: 0.28, metalness: 0.9 }),
  white: std('#e9e3d8', { roughness: 0.6 }),
  black: std('#0e0d0c', { roughness: 0.5 }),
  foliage: std('#4a6b45', { roughness: 0.9 }),
  ceramic: std('#b9b0a3', { roughness: 0.45 }),

  // ── luz ─────────────────────────────────────────────────────
  // emissiveIntensity > 1 es lo que hace que el bloom los "prenda"
  bulb: std('#000000', { emissive: '#ffb066', emissiveIntensity: 3.2, roughness: 1 }),
  bulbSoft: std('#000000', { emissive: '#ff9a4d', emissiveIntensity: 1.8, roughness: 1 }),
  strip: std('#000000', { emissive: '#ffc48a', emissiveIntensity: 2.4, roughness: 1 }),
  screen: std('#000000', { emissive: '#4a6fa8', emissiveIntensity: 1.4, roughness: 1 }),
  screenWarm: std('#000000', { emissive: '#ff9a4d', emissiveIntensity: 1.1, roughness: 1 }),
  glass: new THREE.MeshStandardMaterial({
    color: '#0d1520',
    roughness: 0.08,
    metalness: 0.2,
    transparent: true,
    opacity: 0.55,
  }),
  windowGlow: std('#000000', { emissive: '#ffab63', emissiveIntensity: 2.1, roughness: 1 }),
}

// El muro exterior y el techo se desvanecen en el corte, así que necesitan transparencia.
;[M.facade, M.wallOut, M.roof, M.wallAccent, M.windowGlow].forEach((m) => {
  m.transparent = true
})

/**
 * Materiales que el centro de control puede encender, atenuar y entibiar.
 * Se exponen aparte porque el resto de la escena nunca debe tocarlos:
 * su color y su intensidad los manda `home` en el store.
 */
export const LIGHT_MATS = {
  salaLamp: M.bulb.clone(),
  salaStrip: M.strip.clone(),
  cocinaStrip: M.strip.clone(),
  cocinaPendant: M.bulb.clone(),
  recamaraLamp: M.bulb.clone(),
  recamaraFloor: M.strip.clone(),
  estudioBias: M.strip.clone(),
}

/** Geometrías compartidas: una caja unitaria escalada cubre casi todo. */
export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  sphere: new THREE.SphereGeometry(0.5, 16, 12),
  ico: new THREE.IcosahedronGeometry(0.5, 1),
  plane: new THREE.PlaneGeometry(1, 1),
}
