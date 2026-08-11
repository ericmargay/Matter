import * as THREE from 'three'

/**
 * Texturas procedurales.
 *
 * Los muebles principales ya son modelos fotogramétricos con sus mapas PBR,
 * pero pisos y muros son geometría nuestra y con color plano se ven de
 * plástico. Estas texturas se dibujan en un canvas al arrancar: no pesan
 * nada en la red y le dan a cada superficie grano, veta y relieve.
 *
 * El truco importante es el mapa de normales. Sin relieve, ninguna luz
 * rasante "agarra" la superficie y todo se ve liso aunque tenga color.
 */

const SIZE = 256

function canvas() {
  const c = document.createElement('canvas')
  c.width = c.height = SIZE
  return c
}

/** Ruido con valor estable por semilla: la textura no cambia entre recargas. */
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/**
 * Deriva un mapa de normales de la luminancia de un canvas (sobel simple).
 * Es aproximado, pero para veta de madera y trama de tela sobra.
 */
function toNormalMap(src, strength = 2.2) {
  const data = src.getContext('2d').getImageData(0, 0, SIZE, SIZE).data
  const out = canvas()
  const ctx = out.getContext('2d')
  const img = ctx.createImageData(SIZE, SIZE)

  const h = (x, y) => data[((((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)) << 2)] / 255

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (h(x - 1, y) - h(x + 1, y)) * strength
      const dy = (h(x, y - 1) - h(x, y + 1)) * strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * SIZE + x) << 2
      img.data[i] = ((dx / len) * 0.5 + 0.5) * 255
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      img.data[i + 2] = (1 / len) * 0.5 * 255 + 127.5
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return out
}

function texture(c, repeat = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  t.anisotropy = 4
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* ── duela ─────────────────────────────────────────────────── */
/**
 * Duela a matajunta: tablas de largo variable con la junta corrida entre
 * hileras. La versión anterior usaba tablas del mismo largo y el patrón se
 * leía como un mosaico repetido en vez de como un piso de madera.
 */
function woodCanvas() {
  const c = canvas()
  const ctx = c.getContext('2d')
  const r = rng(7)
  const rows = 10
  const rowH = SIZE / rows

  for (let row = 0; row < rows; row++) {
    let x = -r() * SIZE * 0.4 // arranque desfasado por hilera
    while (x < SIZE) {
      const w = SIZE * (0.22 + r() * 0.3)
      // roble: si el canal rojo domina, con el tinte del material todos los
      // pisos salen anaranjados
      const tone = 118 + r() * 40
      ctx.fillStyle = `rgb(${tone * 0.96}, ${tone * 0.79}, ${tone * 0.61})`
      ctx.fillRect(x, row * rowH, w - 1.2, rowH - 1)

      // veta: líneas suaves siguiendo el largo de la tabla
      ctx.lineWidth = 0.7
      for (let g = 0; g < 7; g++) {
        ctx.strokeStyle = `rgba(62, 38, 20, ${0.06 + r() * 0.12})`
        const gy = row * rowH + r() * rowH
        ctx.beginPath()
        ctx.moveTo(x, gy)
        for (let step = 0; step <= w; step += 7) {
          ctx.lineTo(x + step, gy + Math.sin(step * 0.08 + g * 2) * 1.3)
        }
        ctx.stroke()
      }

      // nudo ocasional
      if (r() > 0.82) {
        ctx.strokeStyle = 'rgba(58, 34, 16, 0.3)'
        const kx = x + w * (0.25 + r() * 0.5)
        const ky = row * rowH + rowH * 0.5
        for (let k = 1; k <= 3; k++) {
          ctx.beginPath()
          ctx.ellipse(kx, ky, k * 1.6, k * 0.9, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // testa de la tabla
      ctx.strokeStyle = 'rgba(34, 21, 12, 0.42)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x + w - 1, row * rowH)
      ctx.lineTo(x + w - 1, (row + 1) * rowH)
      ctx.stroke()

      x += w
    }
  }

  // juntas entre hileras
  ctx.strokeStyle = 'rgba(38, 24, 14, 0.34)'
  ctx.lineWidth = 1.1
  for (let row = 1; row < rows; row++) {
    ctx.beginPath()
    ctx.moveTo(0, row * rowH)
    ctx.lineTo(SIZE, row * rowH)
    ctx.stroke()
  }
  return c
}

/* ── aplanado / muro ───────────────────────────────────────── */
function plasterCanvas() {
  const c = canvas()
  const ctx = c.getContext('2d')
  const r = rng(23)

  ctx.fillStyle = '#8b8078'
  ctx.fillRect(0, 0, SIZE, SIZE)

  // manchones suaves: es lo que le quita el look de pared de render
  for (let i = 0; i < 900; i++) {
    const x = r() * SIZE
    const y = r() * SIZE
    const rad = 2 + r() * 9
    const v = r() * 26 - 13
    ctx.fillStyle = `rgba(${139 + v}, ${128 + v}, ${120 + v}, 0.35)`
    ctx.beginPath()
    ctx.arc(x, y, rad, 0, Math.PI * 2)
    ctx.fill()
  }
  return c
}

/* ── tela ──────────────────────────────────────────────────── */
function fabricCanvas() {
  const c = canvas()
  const ctx = c.getContext('2d')
  const r = rng(41)

  ctx.fillStyle = '#8d8d8d'
  ctx.fillRect(0, 0, SIZE, SIZE)

  // trama: hilos verticales y horizontales alternados
  const step = 4
  for (let y = 0; y < SIZE; y += step) {
    for (let x = 0; x < SIZE; x += step) {
      const warp = ((x / step + y / step) & 1) === 0
      const v = 130 + r() * 40 + (warp ? 22 : -22)
      ctx.fillStyle = `rgb(${v}, ${v}, ${v})`
      ctx.fillRect(x, y, step - 0.5, step - 0.5)
    }
  }
  return c
}

/* ── porcelanato ───────────────────────────────────────────── */
function tileCanvas() {
  const c = canvas()
  const ctx = c.getContext('2d')
  const r = rng(89)
  const n = 2
  const s = SIZE / n

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = 196 + r() * 22
      ctx.fillStyle = `rgb(${v}, ${v * 0.97}, ${v * 0.92})`
      ctx.fillRect(x * s, y * s, s, s)
      // vetas tenues tipo mármol
      ctx.strokeStyle = 'rgba(150, 142, 132, 0.28)'
      ctx.lineWidth = 0.8
      for (let g = 0; g < 4; g++) {
        ctx.beginPath()
        ctx.moveTo(x * s, y * s + r() * s)
        ctx.bezierCurveTo(
          x * s + s * 0.3, y * s + r() * s,
          x * s + s * 0.7, y * s + r() * s,
          x * s + s, y * s + r() * s,
        )
        ctx.stroke()
      }
    }
  }

  ctx.strokeStyle = 'rgba(120, 112, 104, 0.85)'
  ctx.lineWidth = 2
  for (let i = 0; i <= n; i++) {
    ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, SIZE); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(SIZE, i * s); ctx.stroke()
  }
  return c
}

/**
 * Se construyen una sola vez y se comparten. `map` va en sRGB; el mapa de
 * normales NO (es un vector codificado en color, no un color).
 */
function build(make, { repeat = 1, bump = 2.2 } = {}) {
  const c = make()
  return {
    map: texture(c, repeat),
    normalMap: texture(toNormalMap(c, bump), repeat, false),
  }
}

let cache = null

export function getTextures() {
  if (cache) return cache
  cache = {
    wood: build(woodCanvas, { repeat: 3, bump: 1.6 }),
    plaster: build(plasterCanvas, { repeat: 2, bump: 1.1 }),
    fabric: build(fabricCanvas, { repeat: 6, bump: 2.8 }),
    tile: build(tileCanvas, { repeat: 2, bump: 1.3 }),
  }
  return cache
}


/* ── obra plástica ─────────────────────────────────────────── */
/**
 * Cuadros generados.
 *
 * Un rectángulo de color plano en un muro se lee como un rectángulo de color
 * plano. Con campos de color, un par de trazos y grano, se lee como un
 * cuadro — que es todo lo que hace falta a la distancia a la que se ve.
 */
const PALETTES = [
  ['#c2643a', '#e8dcc8', '#2f3b4e', '#8a4a2c'],
  ['#3f5a4a', '#d6cbb4', '#8d6b3f', '#1e2a26'],
  ['#8895b8', '#f0e9dd', '#2c3550', '#c98f5e'],
  ['#b8503f', '#f2e6d2', '#42352c', '#d9a15b'],
  ['#6f7f6a', '#efe7d6', '#2a2f34', '#b98b56'],
]

function paintingCanvas(seed) {
  const c = canvas()
  const ctx = c.getContext('2d')
  const r = rng(seed * 977 + 13)
  const pal = PALETTES[seed % PALETTES.length]
  const style = seed % 3

  ctx.fillStyle = pal[1]
  ctx.fillRect(0, 0, SIZE, SIZE)

  if (style === 0) {
    // campos de color horizontales, tipo Rothko
    let y = 0
    while (y < SIZE) {
      const h = SIZE * (0.12 + r() * 0.3)
      ctx.fillStyle = pal[1 + Math.floor(r() * 3)]
      ctx.globalAlpha = 0.55 + r() * 0.45
      ctx.fillRect(-4, y + r() * 6, SIZE + 8, h)
      y += h
    }
  } else if (style === 1) {
    // trazos gruesos cruzados
    for (let i = 0; i < 14; i++) {
      ctx.strokeStyle = pal[Math.floor(r() * pal.length)]
      ctx.globalAlpha = 0.35 + r() * 0.5
      ctx.lineWidth = 4 + r() * 26
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(r() * SIZE, r() * SIZE)
      ctx.lineTo(r() * SIZE, r() * SIZE)
      ctx.stroke()
    }
  } else {
    // composición geométrica
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = pal[Math.floor(r() * pal.length)]
      ctx.globalAlpha = 0.4 + r() * 0.5
      const w = SIZE * (0.15 + r() * 0.45)
      const h = SIZE * (0.1 + r() * 0.4)
      ctx.fillRect(r() * (SIZE - w), r() * (SIZE - h), w, h)
    }
    ctx.globalAlpha = 0.8
    ctx.strokeStyle = pal[3]
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(SIZE * (0.3 + r() * 0.4), SIZE * (0.3 + r() * 0.4), SIZE * 0.16, 0, Math.PI * 2)
    ctx.stroke()
  }

  // grano de lienzo
  ctx.globalAlpha = 0.06
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = r() > 0.5 ? '#000' : '#fff'
    ctx.fillRect(r() * SIZE, r() * SIZE, 1.4, 1.4)
  }
  ctx.globalAlpha = 1
  return c
}

const paintings = []

/** Devuelve la textura de un cuadro; se generan bajo demanda y se comparten. */
export function getPainting(i) {
  const k = i % 6
  if (!paintings[k]) paintings[k] = texture(paintingCanvas(k), 1)
  return paintings[k]
}

/* ── pantalla encendida ────────────────────────────────────── */
/**
 * Una textura que cambia sola para que la tele se vea reproduciendo algo.
 *
 * No es video: son formas suaves que se desplazan y un corte de escena cada
 * pocos segundos. A la distancia a la que se ve la tele en la maqueta, eso
 * es indistinguible de una película — y cuesta un canvas de 128 px.
 */
export function createScreenTexture() {
  const c = document.createElement('canvas')
  c.width = 160
  c.height = 90
  const ctx = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace

  const SCENES = [
    ['#12305a', '#3f7fbf', '#f2c07a'],
    ['#1a1030', '#6b3fa0', '#e2748a'],
    ['#0d2b25', '#2f8f6b', '#ecd9a0'],
    ['#2a1408', '#b4642a', '#f0e0c0'],
  ]

  let scene = 0
  let nextCut = 3

  return {
    texture: tex,
    /** Llamar en cada frame con el tiempo del reloj de three. */
    update(t) {
      if (t > nextCut) {
        scene = (scene + 1) % SCENES.length
        nextCut = t + 3 + Math.random() * 4
      }
      const [bg, mid, hi] = SCENES[scene]

      ctx.fillStyle = bg
      ctx.fillRect(0, 0, 160, 90)

      // planos que se desplazan: leen como cámara moviéndose
      ctx.fillStyle = mid
      ctx.globalAlpha = 0.85
      for (let i = 0; i < 3; i++) {
        const y = 20 + i * 22 + Math.sin(t * (0.5 + i * 0.2)) * 5
        ctx.fillRect(-20 + ((t * (12 + i * 9)) % 200), y, 90 - i * 18, 14)
      }

      // foco de luz que respira
      ctx.globalAlpha = 0.5 + Math.sin(t * 1.7) * 0.2
      const g = ctx.createRadialGradient(80 + Math.sin(t * 0.6) * 30, 45, 4, 80, 45, 70)
      g.addColorStop(0, hi)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 160, 90)
      ctx.globalAlpha = 1

      tex.needsUpdate = true
    },
  }
}
