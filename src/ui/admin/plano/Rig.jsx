import { useEstilo } from './estilo'

/**
 * La puesta de luz: una maqueta dentro de un estudio fotográfico.
 *
 * La clave del estilo no es el modelado, es esto. Una fuente grande y suave
 * como principal, cielo frío de relleno para que las sombras no se vean
 * sucias, y un rebote bajo que levanta las caras que miran al piso.
 *
 * Nada de luz dura: los objetos se separan por oclusión y por gradiente, no
 * por contraste brutal. Es lo que hace que el conjunto se vea moldeado en vez
 * de recortado.
 */
export default function Rig({ ancho = 6, largo = 5, alto = 2.6 }) {
  const e = useEstilo()
  const lejos = Math.max(ancho, largo)
  const k = e.luzIntensidad

  return (
    <>
      {/* cielo frío arriba, rebote cálido abajo */}
      <hemisphereLight args={['#dce8f5', '#c9a68e', 0.85 * k]} position={[0, alto * 2, 0]} />
      <ambientLight intensity={e.ambiente * k} />

      {/* la principal: grande, suave y fuera del eje de la cámara para que
          las sombras caigan a la vista y no detrás de cada mueble */}
      <directionalLight
        position={[-lejos * 0.85, alto * 2.6, lejos * 1.15]}
        intensity={1.5 * k}
        color={e.luzColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0008}
        shadow-normalBias={0.03}
        shadow-radius={10 * e.sombraSuave}
        shadow-camera-left={-lejos}
        shadow-camera-right={lejos}
        shadow-camera-top={lejos}
        shadow-camera-bottom={-lejos}
        shadow-camera-near={0.1}
        shadow-camera-far={lejos * 7}
      />

      {/* contraluz tenue del lado opuesto: despega los muebles del muro */}
      <directionalLight position={[lejos, alto * 1.4, -lejos * 0.7]} intensity={0.32 * k} color="#cfe0f5" />
    </>
  )
}
