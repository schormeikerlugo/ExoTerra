import { useMemo } from 'react'
import * as THREE from 'three'
import type { Exoplanet } from '../../data/types'
import { getRingColor } from '../../utils/planetVisuals'

import ringsVertexShader from '../../shaders/rings.vert.glsl'
import ringsFragmentShader from '../../shaders/rings.frag.glsl'

interface RingsProps {
  planet: Exoplanet
  scale: number
}

export function Rings({ planet, scale }: RingsProps) {
  const ringColor = getRingColor(planet)

  const uniforms = useMemo(
    () => ({
      uRingColor: { value: new THREE.Color(...ringColor) },
      uOpacity: { value: 0.6 },
      uTime: { value: 0 },
    }),
    [ringColor],
  )

  return (
    <mesh rotation={[Math.PI * 0.45, 0, 0.2]} scale={scale * 2.2}>
      <ringGeometry args={[0.6, 1.0, 64]} />
      <shaderMaterial
        vertexShader={ringsVertexShader}
        fragmentShader={ringsFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
