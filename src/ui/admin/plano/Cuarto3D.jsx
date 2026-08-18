import { useEstilo, materialDe, paletaDe } from './estilo'
import { caja } from './geo'

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
export default function Cuarto3D({ ancho, largo, alto, camaraX = 1, camaraZ = 1 }) {
  const e = useEstilo()
  const pal = paletaDe(e.paleta)
  const t = 0.16 // grosor del muro
  const gPiso = 0.14

  const mat = (color, rol) =>
    materialDe(color, { rol, rugosidad: e.rugosidad, metalico: e.metalico, saturacion: e.saturacion })
  const cja = (w, h, d) => caja(w, h, d, e.bisel, e.tono)

  const muros = [
    { w: ancho + t * 2, pos: [0, -(largo + t) / 2], rot: 0, n: [0, -1] },
    { w: ancho + t * 2, pos: [0, (largo + t) / 2], rot: 0, n: [0, 1] },
    { w: largo + t * 2, pos: [-(ancho + t) / 2, 0], rot: Math.PI / 2, n: [-1, 0] },
    { w: largo + t * 2, pos: [(ancho + t) / 2, 0], rot: Math.PI / 2, n: [1, 0] },
  ]

  return (
    <group>
      {/* el piso con espesor: se ve su canto y ancla el diorama */}
      <mesh
        geometry={cja(ancho + t * 2, gPiso, largo + t * 2)}
        material={mat(pal.piso, 'madera')}
        position={[0, -gPiso / 2, 0]}
        receiveShadow
      />

      {muros.map((m, i) => {
        // se esconde el que taparía la vista
        const visible = m.n[0] * camaraX + m.n[1] * camaraZ <= 0
        return (
          <mesh
            key={i}
            visible={visible}
            geometry={cja(m.w, alto, t)}
            material={mat(m.n[0] !== 0 ? pal.muroFrio : pal.muro, 'mate')}
            position={[m.pos[0], alto / 2, m.pos[1]]}
            rotation={[0, m.rot, 0]}
            castShadow
            receiveShadow
          />
        )
      })}
    </group>
  )
}
