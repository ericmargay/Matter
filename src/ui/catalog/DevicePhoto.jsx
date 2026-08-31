import { useEffect, useState } from 'react'
import { CATEGORIES } from '../../content/catalog'
import { photoOf } from '../../content/photos'
import Icon from '../Icon'

/**
 * La foto de un producto, con red de seguridad.
 *
 * No todos los fabricantes publican foto que se pueda bajar, así que 29 de 91
 * productos no la tienen. En vez de dejar el hueco —o peor, poner la foto de
 * un aparato parecido— se dibuja un mosaico: el glifo de su categoría sobre el
 * mismo papel claro que traen las fotos reales. La cuadrícula se ve pareja y
 * nadie confunde un respaldo con una foto.
 *
 * El papel claro no es capricho: los fabricantes fotografían sobre blanco, y
 * sobre el fondo oscuro del panel cada foto se veía como un recorte encendido.
 * Con la tarjeta clara todas caen en el mismo plano.
 */

/** Un tono estable por categoría, para que el respaldo no se vea aleatorio. */
const TINTE = {
  iluminacion: '#c8942f',
  control: '#8a7f72',
  sensores: '#6f8fb8',
  acceso: '#a2622f',
  camaras: '#5f6f7d',
  clima: '#5f9089',
  cortinas: '#9a7e5c',
  energia: '#b8862f',
  agua: '#4f87a8',
  av: '#7a6d8e',
  hubs: '#8f6f4a',
  red: '#5b7fa8',
  mascotas: '#96794f',
  electro: '#7d8189',
}

export default function DevicePhoto({ device, className = '', sizes, eager = false, srcOverride }) {
  /* srcOverride: la foto real que alguien pegó para ESTE proyecto —la caja
     que de verdad llegó, no el catálogo genérico—. Gana sobre la del
     catálogo cuando existe. */
  const src = srcOverride || photoOf(device.id)
  const [rota, setRota] = useState(false)
  // si alguien pega una URL nueva después de que la anterior falló, hay que
  // volver a intentar — sin esto, una vez rota se quedaba rota para siempre.
  useEffect(() => setRota(false), [src])
  const cat = CATEGORIES.find((c) => c.id === device.cat)

  if (src && !rota) {
    return (
      <img
        src={src}
        // el nombre ya está escrito al lado en todas las vistas; repetirlo aquí
        // solo haría que el lector de pantalla lo diga dos veces
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        sizes={sizes}
        onError={() => setRota(true)}
        className={`h-full w-full object-contain ${className}`}
      />
    )
  }

  const tinte = TINTE[device.cat] ?? '#8a7f72'
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-1.5 ${className}`}
      style={{ color: tinte }}
      aria-hidden="true"
    >
      <Icon name={device.cat} size={34} className="opacity-45" />
      <span className="px-2 text-center text-[9px] tracking-[0.14em] uppercase opacity-55">
        {cat?.label ?? 'Equipo'}
      </span>
    </div>
  )
}

/** El marco de papel donde vive la foto. Se usa igual en tarjeta y en ficha. */
export function PhotoFrame({ children, className = '' }) {
  return (
    <div className={`overflow-hidden bg-[#f4efe7] ${className}`}>{children}</div>
  )
}
