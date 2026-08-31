import { AcabadoMuro, AcabadoPiso } from './acabados.jsx'
import { pisoDe } from './acabados'
import { mezclar, useEstilo, materialDe, paletaDe } from './estilo'
import { caja } from './geo'
import { GROSOR_MURO, MUROS, muroSeVe } from './muros'

/**
 * El cuarto como un objeto diseñado, no como cuatro planos sueltos.
 *
 * Los muros tienen grosor de verdad y cantos suavizados, y el piso también:
 * en las referencias eso es lo que hace que la habitación se lea como una
 * pieza moldeada. Un plano de espesor cero delata el truco en cuanto se ve un
 * borde.
 *
 * Los dos muros que quedan entre la cámara y el cuarto se esconden solos, así
 * que se puede girar libremente sin perder la vista de casa de muñecas.
 */
/**
 * Parte un muro en los pedazos que quedan alrededor de un hueco.
 *
 * Nada de resta booleana: el muro ya es una caja, y un hueco rectangular en
 * una caja son hasta cuatro cajas más chicas alrededor —dos que corren de
 * piso a plafón a los lados, y dos angostas arriba y abajo del hueco mismo—.
 * Es la misma pieza de siempre, sólo que en partes, y por eso se ve igual:
 * mismo bisel, mismo tono por vértice, mismo material.
 *
 * `huecos` viene ordenado de izquierda a derecha y ya se asume que no se
 * traslapan —dos ventanas la una encima de la otra no es un plano, es un
 * error de captura que se corrige ahí, no aquí.
 */
function pedazosDeMuro(w, alto, huecos) {
  if (!huecos?.length) return [{ x: 0, y: alto / 2, sx: w, sy: alto }]

  const piezas = []
  let borde = -w / 2
  for (const h of huecos) {
    const izq = h.co - h.ow / 2
    const der = h.co + h.ow / 2
    // lo que hay a la izquierda del hueco, de piso a plafón
    if (izq > borde + 0.001) piezas.push({ x: (borde + izq) / 2, y: alto / 2, sx: izq - borde, sy: alto })
    // el dintel, arriba del hueco
    const arriba = h.oy + h.oh / 2
    if (alto - arriba > 0.001) piezas.push({ x: h.co, y: (arriba + alto) / 2, sx: h.ow, sy: alto - arriba })
    // el pretil, abajo del hueco
    const abajo = h.oy - h.oh / 2
    if (abajo > 0.001) piezas.push({ x: h.co, y: abajo / 2, sx: h.ow, sy: abajo })
    borde = der
  }
  // lo que queda a la derecha del último hueco
  if (w / 2 - borde > 0.001) piezas.push({ x: (borde + w / 2) / 2, y: alto / 2, sx: w / 2 - borde, sy: alto })
  return piezas
}

export default function Cuarto3D({
  ancho,
  largo,
  alto,
  camaraX = 1,
  camaraZ = 1,
  onTocar,
  onTocarMuro,
  piso,
  muro,
  colocando,
  permiteMuro,
  onApuntarMuro,
  onColocarMuro,
  huecos,
}) {
  const e = useEstilo()
  const pal = paletaDe(e.paleta)
  const t = GROSOR_MURO
  const gPiso = 0.14

  const mat = (color, rol) =>
    materialDe(color, { rol, rugosidad: e.rugosidad, metalico: e.metalico, saturacion: e.saturacion })
  const cja = (w, h, d) => caja(w, h, d, e.bisel, e.tono)

  /* El color del acabado sale de la paleta del cuarto, mezclada, no de un gris
     de catálogo: así el mármol de una casa coral y el de una casa menta son
     distintos y los dos siguen perteneciendo a su casa. */
  const acPiso = pisoDe(piso)
  const tin = acPiso.tinte ?? { base: 'piso', rol: 'madera' }
  const colorPiso = mezclar(pal[tin.base] ?? pal.piso, pal[tin.hacia] ?? null, tin.mezcla ?? 0)
  const colorVeta = mezclar(colorPiso, pal.neutro, tin.veta ?? 0)

  /* El orden y las normales viven en `muros.js` porque no son solo de aquí:
     lo que cuelga de cada muro tiene que esconderse con él, y las dos cosas
     tienen que decidirlo con la misma regla o se descuadran. */
  const GEO = {
    norte: { w: ancho + t * 2, pos: [0, -(largo + t) / 2], rot: 0 },
    sur: { w: ancho + t * 2, pos: [0, (largo + t) / 2], rot: 0 },
    oeste: { w: largo + t * 2, pos: [-(ancho + t) / 2, 0], rot: Math.PI / 2 },
    este: { w: largo + t * 2, pos: [(ancho + t) / 2, 0], rot: Math.PI / 2 },
  }
  const muros = MUROS.map((m) => ({ ...m, ...GEO[m.id] }))

  return (
    <group>
      {/* el piso con espesor: se ve su canto y ancla el diorama.
          Tocarlo selecciona el espacio, igual que tocar un mueble selecciona
          el mueble: es de donde salen las medidas del cuarto. */}
      <mesh
        geometry={cja(ancho + t * 2, gPiso, largo + t * 2)}
        material={mat(pal.piso, 'madera')}
        position={[0, -gPiso / 2, 0]}
        receiveShadow
        onPointerDown={
          onTocar &&
          ((e) => {
            e.stopPropagation()
            onTocar()
          })
        }
      />

      {/* el acabado encima del firme: duela, loseta, mármol o concreto */}
      <AcabadoPiso
        ancho={ancho + t * 2}
        largo={largo + t * 2}
        id={piso}
        material={mat(colorPiso, tin.rol ?? 'madera')}
        materialAlterno={mat(colorVeta, tin.rol ?? 'madera')}
        bisel={e.bisel}
        tono={e.tono}
      />

      {muros.map((m) => {
        // se esconde el que taparía la vista
        const visible = muroSeVe(m.n, camaraX, camaraZ)
        const onMove =
          visible && colocando && permiteMuro
            ? (ev) => {
                ev.stopPropagation()
                onApuntarMuro?.({ x: ev.point.x, y: ev.point.y, z: ev.point.z, superficie: 'muro', muro: m.id })
              }
            : undefined
        const onDown = colocando
          ? visible && permiteMuro
            ? (ev) => {
                ev.stopPropagation()
                onColocarMuro?.({ x: ev.point.x, y: ev.point.y, z: ev.point.z, superficie: 'muro', muro: m.id })
              }
            : undefined
          : visible && (onTocar || onTocarMuro)
            ? (ev) => {
                ev.stopPropagation()
                // el muro en concreto primero: si nadie lo usa, cae al
                // genérico de "se tocó un muro cualquiera"
                if (onTocarMuro) onTocarMuro(m.id)
                else onTocar()
              }
            : undefined

        return (
          <group key={m.id} position={[m.pos[0], 0, m.pos[1]]} rotation={[0, m.rot, 0]}>
            {pedazosDeMuro(m.w, alto, huecos?.[m.id]).map((p, i) => (
              <mesh
                key={i}
                visible={visible}
                geometry={cja(p.sx, p.sy, t)}
                material={mat(m.n[0] !== 0 ? pal.muroFrio : pal.muro, 'mate')}
                position={[p.x, p.y, 0]}
                castShadow
                receiveShadow
                onPointerMove={onMove}
                onPointerDown={onDown}
              />
            ))}
          </group>
        )
      })}

      {/* lambrín, medio muro, panelado o tabique: solo en los que se ven */}
      {muros
        .filter((m) => muroSeVe(m.n, camaraX, camaraZ))
        .map((m) => (
          <group
            key={`ac-${m.id}`}
            position={[m.pos[0], 0, m.pos[1]]}
            rotation={[0, m.rot, 0]}
            /* La cara interior de cada muro mira hacia el centro del cuarto.
               Los del norte y el oeste miran al revés que los del sur y el
               este, y por eso media vuelta más en dos de ellos. */
            scale={[1, 1, m.id === 'sur' || m.id === 'este' ? -1 : 1]}
          >
            <AcabadoMuro
              ancho={m.w}
              alto={alto}
              grosor={t}
              id={muro}
              material={mat(pal.neutro, 'mate')}
              materialApoyo={mat(m.n[0] !== 0 ? pal.apoyo : pal.dominante, 'mate')}
              bisel={e.bisel}
              tono={e.tono}
            />
          </group>
        ))}
    </group>
  )
}
