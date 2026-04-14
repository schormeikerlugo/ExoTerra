import * as THREE from 'three'

export function Sun() {
  return (
    <group position={[15, 4, 12]}>
      {/* Core — moderate HDR to trigger subtle bloom */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color={new THREE.Color(1.5, 1.3, 1.0)}
          toneMapped={false}
        />
      </mesh>
      {/* Soft glow shell */}
      <mesh scale={2.5}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color={new THREE.Color(1.0, 0.8, 0.5)}
          transparent
          opacity={0.08}
          toneMapped={false}
        />
      </mesh>
      {/* Light */}
      <pointLight color="#fff5e0" intensity={0.5} distance={30} />
    </group>
  )
}
