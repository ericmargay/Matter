/**
 * El asistente, dibujado.
 *
 * No es el logo de nadie y no pretende serlo: es la LECTURA de cada uno —el
 * orbe que gira de Siri, el aro que se enciende de Alexa, los cuatro puntos
 * de Google— con los colores de la casa. Basta para que en la junta nadie
 * pregunte cuál es cuál, que es todo lo que tiene que hacer.
 *
 * Reemplaza al botón que decía "accionar". Una ambientación no se "acciona":
 * se le pide a alguien. Si el botón lleva la cara de quien la va a atender, el
 * cliente entiende de una que en su casa esto se dice en voz alta, y entiende
 * también que no todo se le puede pedir al mismo.
 */
export default function GlifoAsistente({ tipo = 'orbe', size = 20, activo = false, className = '' }) {
  const s = { width: size, height: size }

  if (tipo === 'anillo')
    return (
      <span
        aria-hidden="true"
        className={`glifo-anillo ${activo ? 'glifo-on' : ''} ${className}`}
        style={s}
      />
    )

  if (tipo === 'puntos')
    return (
      <span aria-hidden="true" className={`glifo-puntos ${activo ? 'glifo-on' : ''} ${className}`} style={s}>
        <i />
        <i />
        <i />
        <i />
      </span>
    )

  return (
    <span aria-hidden="true" className={`glifo-orbe ${activo ? 'glifo-on' : ''} ${className}`} style={s} />
  )
}
