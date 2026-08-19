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
export default function Cuarto3D({ ancho, largo, alto, camaraX = 1, camaraZ = 1, onTocar, piso, muro }) {
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
        return (
          <mesh
            key={m.id}
            visible={visible}
            geometry={cja(m.w, alto, t)}
            material={mat(m.n[0] !== 0 ? pal.muroFrio : pal.muro, 'mate')}
            position={[m.pos[0], alto / 2, m.pos[1]]}
            rotation={[0, m.rot, 0]}
            castShadow
            receiveShadow
            onPointerDown={
              visible && onTocar
                ? (ev) => {
                    ev.stopPropagation()
                    onTocar()
                  }
                : undefined
            }
          />
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
