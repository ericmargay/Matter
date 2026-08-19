import { useMemo } from 'react'

import { caja, capsula, cilindro, esfera, placa } from './geo'
import { materialDe, paletaDe, useEstilo } from './estilo'

/**
 * Dibuja una pieza hecha de partes.
 *
 * Es el mismo lenguaje que el resto: primitivas con canto suavizado, tinte por
 * vértice y los materiales del sistema de diseño. Una pieza propia tiene que
 * pertenecer a la casa igual que las del catálogo — si se viera distinta, el
 * plano se partiría en dos, las cosas "del sistema" y las "hechas a mano", que
 * es justo lo que no se quiere.
 */
export default function PiezaPropia({ pieza, seleccion, onTomarParte }) {
  const e = useEstilo()
  const pal = paletaDe(e.paleta)

  const partes = pieza?.partes ?? []

  return (
    <group>
      {partes.map((p) => (
        <Parte
          key={p.id}
          p={p}
          pal={pal}
          e={e}
          seleccionada={p.id === seleccion}
          onTomar={onTomarParte ? () => onTomarParte(p.id) : undefined}
        />
      ))}
    </group>
  )
}

function Parte({ p, pal, e, seleccionada, onTomar }) {
  const geo = useMemo(() => {
    const [a, b, c] = p.med
    if (p.forma === 'cilindro') return cilindro(c / 2, a / 2, b, e.tono, 22)
    if (p.forma === 'esfera') return esfera(a / 2, e.tono, 20)
    if (p.forma === 'capsula') return capsula(a / 2, Math.max(0.01, b - a), e.tono)
    if (p.forma === 'placa') return placa(a, c, b, e.bisel, e.tono)
    return caja(a, b, c, e.bisel, e.tono)
  }, [p.forma, p.med, e.bisel, e.tono])

  const mat = useMemo(
    () =>
      materialDe(p.color ?? pal[p.tono] ?? pal.apoyo, {
        rol: p.rol,
        rugosidad: e.rugosidad,
        metalico: e.metalico,
        saturacion: e.saturacion,
      }),
    [p.color, p.tono, p.rol, pal, e.rugosidad, e.metalico, e.saturacion],
  )

  return (
    <group position={p.pos} rotation={p.rot}>
      <mesh
        geometry={geo}
        material={mat}
        castShadow
        receiveShadow
        onPointerDown={
          onTomar
            ? (ev) => {
                ev.stopPropagation()
                onTomar()
              }
            : undefined
        }
      />
      {/* La parte que se está editando, marcada. Sin esto, en una pieza de
          treinta partes no hay forma de saber cuál agarró el gizmo. */}
      {seleccionada && (
        <mesh geometry={geo} scale={1.02}>
          <meshBasicMaterial color="#4d9fff" wireframe transparent opacity={0.75} depthTest={false} />
        </mesh>
      )}
    </group>
  )
}
