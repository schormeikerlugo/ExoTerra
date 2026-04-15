import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import type { Exoplanet } from '../../data/types'
import { getPlanetColors, getPlanetScale } from '../../utils/planetVisuals'
import { planetNameToSeed, estimateWaterRatio } from '../../utils/planetSeed'
import { getExoplanetTexture, getTextureBlend } from '../../utils/textureMap'
import { Rings } from '../Rings/Rings'
import { Moons } from '../Moons/Moons'

import planetVertexShader from '../../shaders/planet.vert.glsl'
import planetFragmentShader from '../../shaders/planet.frag.glsl'

const surfaceTypeMap: Record<string, number> = {
  rocky: 0, water: 1, gas: 2, lava: 3, ice: 4,
}

interface PlanetProps {
  planet: Exoplanet
  onClick?: () => void
}

export function Planet({ planet, onClick }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const planetName = planet.pl_name
  const scale = getPlanetScale(planet)
  const surfaceType = surfaceTypeMap[planet.visual_surface_type] ?? 0
  const seed = useMemo(() => planetNameToSeed(planetName), [planetName])
  const waterRatio = useMemo(
    () => estimateWaterRatio(planet.pl_eqt, planet.pl_insol, planet.in_habitable_zone, seed),
    [planetName, seed],
  )
  const colors = useMemo(() => getPlanetColors(planet), [planetName])
  const tilt = useMemo(() => (seed % 30 - 15) * (Math.PI / 180), [seed])

  // Load surface texture
  const texturePath = useMemo(() => getExoplanetTexture(planet), [planetName])
  const surfaceTexture = useLoader(THREE.TextureLoader, texturePath)
  const textureBlend = useMemo(() => getTextureBlend(planet), [planetName])

  useMemo(() => {
    surfaceTexture.wrapS = THREE.RepeatWrapping
    surfaceTexture.wrapT = THREE.RepeatWrapping
    surfaceTexture.anisotropy = 8
    surfaceTexture.colorSpace = THREE.SRGBColorSpace
  }, [surfaceTexture])

  // Create uniforms with the ACTUAL texture (not empty)
  const uniforms = useMemo(
    () => ({
      uBaseColor: { value: new THREE.Color() },
      uSecondaryColor: { value: new THREE.Color() },
      uTemperature: { value: 300.0 },
      uSurfaceMix: { value: 0.5 },
      uTime: { value: 0 },
      uCloudDensity: { value: 0.0 },
      uSurfaceType: { value: 0.0 },
      uSeed: { value: 0.0 },
      uWaterRatio: { value: 0.5 },
      uRoughness: { value: 0.5 },
      uRadius: { value: 1.0 },
      uMass: { value: 1.0 },
      uDensity: { value: 5.5 },
      uAge: { value: 4.6 },
      uSurfaceTexture: { value: surfaceTexture },
      uTextureBlend: { value: textureBlend },
    }),
    [], // eslint-disable-line -- intentionally stable
  )

  // Update uniform values when planet changes
  useEffect(() => {
    uniforms.uBaseColor.value.setRGB(...colors.baseColor)
    uniforms.uSecondaryColor.value.setRGB(...colors.secondaryColor)
    uniforms.uTemperature.value = planet.pl_eqt ?? 300
    uniforms.uCloudDensity.value = planet.visual_has_clouds ? planet.visual_cloud_density : 0
    uniforms.uSurfaceType.value = surfaceType
    uniforms.uSeed.value = seed
    uniforms.uWaterRatio.value = waterRatio
    uniforms.uRoughness.value = 0.5 + (seed % 5) / 10
    uniforms.uRadius.value = planet.pl_rade ?? 1.0
    uniforms.uMass.value = planet.pl_masse ?? 1.0
    uniforms.uDensity.value = planet.pl_dens ?? 5.5
    uniforms.uAge.value = planet.st_age ?? 4.6
    uniforms.uSurfaceTexture.value = surfaceTexture
    uniforms.uTextureBlend.value = textureBlend

    // Force material to recognize the new texture
    if (matRef.current) {
      matRef.current.uniformsNeedUpdate = true
    }
  }, [planetName, colors, surfaceType, seed, waterRatio, surfaceTexture, textureBlend,
      planet.pl_eqt, planet.visual_has_clouds, planet.visual_cloud_density,
      planet.pl_rade, planet.pl_masse, planet.pl_dens, planet.st_age, uniforms])

  useFrame((_, delta) => {
    if (meshRef.current) {
      const rotSpeed = surfaceType === 2 ? 0.15 : 0.08
      meshRef.current.rotation.y += delta * rotSpeed
    }
    uniforms.uTime.value += delta
  })

  return (
    <group rotation={[tilt, 0, 0]}>
      <mesh ref={meshRef} scale={scale} onClick={onClick}>
        <sphereGeometry args={[1, 128, 128]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={planetVertexShader}
          fragmentShader={planetFragmentShader}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>

      {/* Atmosphere halo is now integrated in the planet shader */}

      {planet.visual_has_rings && <Rings planet={planet} scale={scale} />}

      {planet.visual_num_moons > 0 && (
        <Moons count={planet.visual_num_moons} planetScale={scale} />
      )}
    </group>
  )
}
