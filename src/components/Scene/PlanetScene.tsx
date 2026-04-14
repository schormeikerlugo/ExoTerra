import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Planet } from '../Planet/Planet'
import { SolarPlanet } from '../Planet/SolarPlanet'
import { StarField } from '../StarField/StarField'
import { Sun } from './Sun'
import { useStore } from '../../store/useStore'
import { isSolarSystemBody } from '../../data/solarSystem'

export function PlanetScene() {
  const selectedPlanet = useStore((s) => s.selectedPlanet)

  const solarBody = selectedPlanet
    ? isSolarSystemBody(selectedPlanet.pl_name)
    : undefined

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <color attach="background" args={['#030311']} />

        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} />

        <StarField />
        <Sun />

        <Suspense fallback={null}>
          {selectedPlanet && (
            solarBody
              ? <SolarPlanet body={solarBody} />
              : <Planet planet={selectedPlanet} />
          )}
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          autoRotate={!selectedPlanet}
          autoRotateSpeed={0.5}
        />

        <EffectComposer>
          <Bloom
            intensity={0.3}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette darkness={0.35} offset={0.3} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
