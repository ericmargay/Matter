import { Component, Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'

/**
 * Carga un modelo de public/models/ y, si no está, dibuja la versión
 * procedural.
 *
 * Los modelos son CC0 de Poly Haven y NO se versionan: quien clone el repo
 * corre `npm run models`. Si no lo corre, o si borra la carpeta, la escena
 * tiene que seguir funcionando — por eso todo pasa por aquí en vez de llamar
 * useGLTF directo. El fallback cubre los dos casos con el mismo componente:
 * Suspense mientras baja, ErrorBoundary si nunca llega.
 */

class Boundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) {
      console.info('[matter] modelo no disponible, usando geometría procedural:', error.message)
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function Gltf({ name, scale, castShadow = true, receiveShadow = true }) {
  // BASE_URL y no "/": en GitHub Pages el sitio cuelga de /Matter/, así que
  // una ruta absoluta se iría a la raíz del dominio y daría 404
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/${name}/${name}.gltf`)
  const ref = useRef()

  // clonar: el mismo modelo puede aparecer dos veces (dos burós, por ejemplo)
  // y un objeto de three no puede estar en dos lugares del grafo a la vez
  const object = useMemo(() => scene.clone(true), [scene])

  useLayoutEffect(() => {
    object.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = castShadow
      o.receiveShadow = receiveShadow
      // los modelos fotogramétricos traen mapas grandes; sin esto se ven
      // planos en las superficies que quedan de canto a la cámara
      if (o.material?.map) o.material.map.anisotropy = 4
    })
  }, [object, castShadow, receiveShadow])

  return <primitive ref={ref} object={object} scale={scale} />
}

/**
 * @param name      carpeta dentro de public/models
 * @param fallback  qué dibujar si el modelo no está (geometría propia)
 * @param scale     los modelos vienen en metros reales; a veces hay que ajustar
 */
export default function Model({ name, fallback = null, position, rotation, scale = 1, ...rest }) {
  return (
    <group position={position} rotation={rotation}>
      <Boundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <Gltf name={name} scale={scale} {...rest} />
        </Suspense>
      </Boundary>
    </group>
  )
}
