import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

export function StarField() {
  const groupRef = useRef<THREE.Group>(null)
  const brightRef = useRef<THREE.Points>(null)

  // 3 layers of stars
  const dimPositions = useMemo(() => {
    const arr = new Float32Array(3200 * 3)
    for (let i = 0; i < 3200; i++) {
      arr[i*3] = THREE.MathUtils.randFloatSpread(120)
      arr[i*3+1] = THREE.MathUtils.randFloatSpread(120)
      arr[i*3+2] = THREE.MathUtils.randFloatSpread(120)
    }
    return arr
  }, [])

  const medPositions = useMemo(() => {
    const arr = new Float32Array(600 * 3)
    for (let i = 0; i < 600; i++) {
      arr[i*3] = THREE.MathUtils.randFloatSpread(100)
      arr[i*3+1] = THREE.MathUtils.randFloatSpread(100)
      arr[i*3+2] = THREE.MathUtils.randFloatSpread(100)
    }
    return arr
  }, [])

  const brightPositions = useMemo(() => {
    const arr = new Float32Array(200 * 3)
    for (let i = 0; i < 200; i++) {
      arr[i*3] = THREE.MathUtils.randFloatSpread(90)
      arr[i*3+1] = THREE.MathUtils.randFloatSpread(90)
      arr[i*3+2] = THREE.MathUtils.randFloatSpread(90)
    }
    return arr
  }, [])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.005
      groupRef.current.rotation.x += delta * 0.001
    }
    // Twinkle bright stars
    if (brightRef.current) {
      const mat = brightRef.current.material as THREE.PointsMaterial
      mat.opacity = 0.7 + 0.3 * Math.sin(state.clock.elapsedTime * 0.3)
    }
  })

  return (
    <group ref={groupRef}>
      <Points positions={dimPositions} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#ffffff" size={0.06} sizeAttenuation depthWrite={false} opacity={0.6} />
      </Points>
      <Points positions={medPositions} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#ffffff" size={0.14} sizeAttenuation depthWrite={false} opacity={0.8} />
      </Points>
      <Points ref={brightRef} positions={brightPositions} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#ffffff" size={0.22} sizeAttenuation depthWrite={false} opacity={0.9} />
      </Points>
    </group>
  )
}
