import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface MoonsProps {
  count: number
  planetScale: number
}

export function Moons({ count, planetScale }: MoonsProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  const moons = Array.from({ length: Math.min(count, 6) }, (_, i) => {
    const distance = planetScale * (1.8 + i * 0.5)
    const size = 0.05 + Math.random() * 0.08
    const angle = (i / count) * Math.PI * 2
    const inclination = (i % 2 === 0 ? 1 : -1) * 0.1 * i

    return (
      <group key={i} rotation={[inclination, 0, 0]}>
        <mesh position={[Math.cos(angle) * distance, 0, Math.sin(angle) * distance]}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.8} />
        </mesh>
      </group>
    )
  })

  return <group ref={groupRef}>{moons}</group>
}
