import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import atmosphereVertexShader from '../../shaders/atmosphere.vert.glsl'
import atmosphereFragmentShader from '../../shaders/atmosphere.frag.glsl'

interface AtmosphereProps {
  color: [number, number, number]
  density: number
  scale: number
}

export function Atmosphere({ color, density, scale }: AtmosphereProps) {
  const ref = useRef<THREE.Mesh>(null)

  // Create uniforms ONCE
  const uniforms = useMemo(
    () => ({
      uAtmosphereColor: { value: new THREE.Color() },
      uDensity: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  )

  // Update values when props change
  useEffect(() => {
    uniforms.uAtmosphereColor.value.setRGB(...color)
    uniforms.uDensity.value = density
  }, [color, density, uniforms])

  useFrame((_, delta) => {
    uniforms.uTime.value += delta
  })

  return (
    <mesh ref={ref} scale={scale * 1.012}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
