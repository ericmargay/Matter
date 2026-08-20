import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three/examples/jsm/Addons.js'

import { CATEGORIA_BY_ID, ESQUELETO, POSES, RUTA } from './piezas'

/**
 * Un avatar, armado de piezas sueltas sobre un solo esqueleto.
 *
 * El truco que lo hace posible: cada pieza es una malla ya pesada al MISMO
 * esqueleto, así que no se "monta" un sombrero encima de una cabeza — se toma
 * su geometría y se vuelve a colgar del esqueleto de este avatar. Por eso todo
 * se mueve junto y por eso se pueden mezclar sin que nada se despegue al
 * animar.
 *
 * El esqueleto se CLONA por avatar. Un objeto de three.js solo puede tener un
 * padre: reusando el del archivo, el segundo avatar de una escena le robaría el
 * esqueleto al primero y el primero se quedaría tieso en el suelo.
 */
export default function Avatar({ config, pose = 'Idle', ...props }) {
  const grupo = useRef()
  const { scene } = useGLTF(ESQUELETO)
  const { animations } = useGLTF(POSES)

  /* Clon propio del esqueleto y del material de piel: dos avatares con la
     misma piel compartida cambiarían de color a la vez, que es justo lo que no
     se quiere cuando se están comparando dos opciones lado a lado. */
  const esqueleto = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const piel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f5c6a5', roughness: 1 }), [])

  const caderas = useMemo(() => esqueleto.getObjectByName('mixamorigHips'), [esqueleto])
  const hueso = useMemo(() => {
    let s = null
    esqueleto.traverse((o) => {
      if (!s && o.isSkinnedMesh) s = o.skeleton
    })
    return s
  }, [esqueleto])

  const { actions } = useAnimations(animations, grupo)

  useEffect(() => {
    piel.color.set(config?.piel ?? '#f5c6a5')
  }, [config?.piel, piel])

  useEffect(() => {
    const a = actions[pose]
    a?.reset().fadeIn(0.25).play()
    return () => a?.fadeOut(0.25)
  }, [actions, pose])

  /* Lo que tapa un traje no se dibuja. Sin esto, la playera asoma por debajo
     del vestido y las piernas atraviesan el pantalón. */
  const tapadas = useMemo(() => {
    const s = new Set()
    for (const [cat, sel] of Object.entries(config?.piezas ?? {})) {
      if (sel) CATEGORIA_BY_ID[cat]?.tapa?.forEach((t) => s.add(t))
    }
    return s
  }, [config?.piezas])

  return (
    <group ref={grupo} {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
        {caderas && <primitive object={caderas} />}
        {hueso &&
          Object.entries(config?.piezas ?? {}).map(([cat, archivo]) =>
            archivo && !tapadas.has(cat) ? (
              <Suspense key={`${cat}-${archivo}`} fallback={null}>
                <Pieza
                  url={RUTA + archivo}
                  hueso={hueso}
                  color={config?.colores?.[cat]}
                  piel={piel}
                />
              </Suspense>
            ) : null,
          )}
      </group>
    </group>
  )
}

/**
 * Una pieza colgada del esqueleto del avatar.
 *
 * La geometría se reusa tal cual —es la misma para todos los avatares que
 * lleven esta pieza y no hay razón para duplicarla— pero el MATERIAL se clona
 * en cuanto hay que teñirlo: pintando el compartido, cambiarle el pelo a un
 * avatar se lo cambiaba a todos.
 */
function Pieza({ url, hueso, color, piel }) {
  const { scene } = useGLTF(url)

  const partes = useMemo(() => {
    const out = []
    scene.traverse((o) => {
      if (!o.isMesh) return
      const nombre = o.material?.name ?? ''
      out.push({
        geometry: o.geometry,
        material: nombre.includes('Skin_') ? piel : nombre.includes('Color_') ? o.material.clone() : o.material,
        tinta: nombre.includes('Color_'),
        morphTargetDictionary: o.morphTargetDictionary,
        morphTargetInfluences: o.morphTargetInfluences,
      })
    })
    return out
  }, [scene, piel])

  useEffect(() => {
    if (!color) return
    for (const p of partes) if (p.tinta) p.material.color.set(color)
  }, [color, partes])

  return partes.map((p, i) => (
    <skinnedMesh
      key={i}
      geometry={p.geometry}
      material={p.material}
      skeleton={hueso}
      morphTargetDictionary={p.morphTargetDictionary}
      morphTargetInfluences={p.morphTargetInfluences}
      castShadow
      receiveShadow
    />
  ))
}

useGLTF.preload(ESQUELETO)
useGLTF.preload(POSES)
