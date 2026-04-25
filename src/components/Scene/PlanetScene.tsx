import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Planet } from '../Planet/Planet'
import { SolarPlanet } from '../Planet/SolarPlanet'
import { Sun } from './Sun'
import { StarField } from '../StarField/StarField'
import { useStore } from '../../store/useStore'
import { isSolarSystemBody } from '../../data/solarSystem'
import { PlanetMarkers3D } from '../HUD/PlanetMarkers3D'
import { buildPlanetMarkers } from '../../utils/planetTelemetry'

interface PlanetSceneProps {
  autoRotate?: boolean
  enableZoom?: boolean
  showMarkers?: boolean
  rotatePlanet?: boolean
  cameraDistance?: number
  /** Shift OrbitControls target along x. Negative values push the planet visually right
   *  inside a full-screen canvas (useful when text overlays the left half). */
  targetOffsetX?: number
  /** When true the canvas renders with an alpha channel and no scene background,
   *  so the page can layer stars / nebula / etc. behind the planet. */
  transparent?: boolean
  /** Whether to render the in-canvas StarField. Set false when an external star
   *  layer owns the starfield (so CSS transforms on the canvas don't scale them). */
  showInternalStars?: boolean
}

export function PlanetScene(props: PlanetSceneProps) {
  const selectedPlanet = useStore((s) => s.selectedPlanet)

  const solarBody = selectedPlanet
    ? isSolarSystemBody(selectedPlanet.pl_name)
    : undefined

  const markers =
    props.showMarkers && selectedPlanet && !solarBody
      ? buildPlanetMarkers(selectedPlanet)
      : []

  const camDist = props.cameraDistance ?? 4
  const tx = props.targetOffsetX ?? 0
  const transparent = props.transparent ?? false
  const showStars = props.showInternalStars ?? true

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [tx, 0, camDist], fov: 50 }}
        gl={{
          antialias: true,
          alpha: transparent,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        {!transparent && <color attach="background" args={['#000000']} />}

        <ambientLight intensity={0.1} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} />

        {showStars && <StarField />}
        <Sun />

        <Suspense fallback={null}>
          {selectedPlanet && (
            solarBody ? (
              <SolarPlanet key={solarBody.name} body={solarBody} />
            ) : (
              <Planet
                key={selectedPlanet.pl_name}
                planet={selectedPlanet}
                rotate={props.rotatePlanet ?? true}
              >
                {markers.length > 0 && <PlanetMarkers3D markers={markers} />}
              </Planet>
            )
          )}
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          autoRotate={props.autoRotate ?? !selectedPlanet}
          autoRotateSpeed={0.5}
          enableZoom={props.enableZoom ?? true}
          target={[tx, 0, 0]}
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
