import { useMemo } from 'react'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

export function StarField() {
  const positions = useMemo(() => {
    const arr = new Float32Array(3000 * 3)
    for (let i = 0; i < 3000; i++) {
      arr[i * 3] = THREE.MathUtils.randFloatSpread(100)
      arr[i * 3 + 1] = THREE.MathUtils.randFloatSpread(100)
      arr[i * 3 + 2] = THREE.MathUtils.randFloatSpread(100)
    }
    return arr
  }, [])

  return (
    <Points positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#ffffff" size={0.08} sizeAttenuation depthWrite={false} />
    </Points>
  )
}
