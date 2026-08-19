import { useEstilo, materialDe, paletaDe } from './estilo'
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
export default function Cuarto3D({ ancho, largo, alto, camaraX = 1, camaraZ = 1, onTocar }) {
  const e = useEstilo()
  const pal = paletaDe(e.paleta)
  const t = GROSOR_MURO
  const gPiso = 0.14

  const mat = (color, rol) =>
    materialDe(color, { rol, rugosidad: e.rugosidad, metalico: e.metalico, saturacion: e.saturacion })
  const cja = (w, h, d) => caja(w, h, d, e.bisel, e.tono)

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
                ? (e) => {
                    e.stopPropagation()
                    onTocar()
                  }
                : undefined
            }
          />
        )
      })}
    </group>
  )
}
