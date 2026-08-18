/**
 * La tarjeta que se ve cuando el enlace se manda por WhatsApp.
 *
 *   npm run og
 *
 * Se genera en vez de dibujarse a mano para que siga a la paleta: los colores
 * salen del mismo azul del sitio, y el día que cambien aquí se regenera. 1200
 * × 630 es la medida que piden WhatsApp, Telegram y todo lo demás.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = path.join(RAIZ, 'public', 'og')

const AZUL = '#080b12'
const AZUL2 = '#0f1420'
const CREMA = '#eef3fb'
const TENUE = '#8896ac'
const ACENTO = '#4d9fff'

const tarjeta = (titulo, bajada) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${AZUL2}"/>
      <stop offset="100%" stop-color="${AZUL}"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5">
      <stop offset="0%" stop-color="${ACENTO}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${ACENTO}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#fondo)"/>
  <circle cx="980" cy="150" r="260" fill="url(#halo)"/>

  <!-- la casa de la marca, el mismo trazo del logo -->
  <g transform="translate(96,92) scale(2.6)">
    <circle cx="16" cy="17" r="9" fill="${ACENTO}" opacity="0.28"/>
    <path d="M6 22V12.5L16 7l10 5.5V22" fill="none" stroke="${ACENTO}"
          stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="16" cy="17" r="3" fill="${CREMA}"/>
  </g>

  <text x="192" y="168" font-family="Georgia,'Times New Roman',serif" font-size="72"
        fill="${CREMA}" letter-spacing="-1">Matter</text>

  <text x="96" y="330" font-family="Georgia,'Times New Roman',serif" font-size="62"
        fill="${CREMA}">${titulo}</text>
  <text x="96" y="404" font-family="Helvetica,Arial,sans-serif" font-size="31"
        fill="${TENUE}">${bajada}</text>

  <rect x="96" y="470" width="112" height="4" rx="2" fill="${ACENTO}"/>
  <text x="96" y="546" font-family="Helvetica,Arial,sans-serif" font-size="25"
        fill="${TENUE}">Casas inteligentes · Ciudad de México</text>
</svg>`

const TARJETAS = {
  'mi-equipo': ['¿Qué ya tienes en casa?', 'Anéxalo desde tu teléfono. Toma dos minutos.'],
  'mi-casa': ['Qué le puedes pedir a tu casa', 'Tu guía, armada con lo que quedó instalado.'],
  catalogo: ['El catálogo', 'Lo que se le puede poner a una casa, explicado sin tecnicismos.'],
  cotizacion: ['Tu cotización', 'Con los precios congelados del día que se generó.'],
  default: ['Casas que te entienden', 'Levantamiento, diseño e instalación.'],
}

await mkdir(DESTINO, { recursive: true })
for (const [nombre, [t, b]] of Object.entries(TARJETAS)) {
  const png = await sharp(Buffer.from(tarjeta(t, b))).png({ quality: 90 }).toBuffer()
  await writeFile(path.join(DESTINO, `${nombre}.png`), png)
  console.log(`✓ og/${nombre}.png  ${(png.length / 1024).toFixed(0)} kB`)
}
