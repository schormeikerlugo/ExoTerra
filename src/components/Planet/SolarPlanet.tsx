import { useRef, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import type { SolarSystemBody } from '../../data/solarSystem'
import { Moons } from '../Moons/Moons'

interface SolarPlanetProps {
  body: SolarSystemBody
}

export function SolarPlanet({ body }: SolarPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  const texture = useLoader(THREE.TextureLoader, body.texture)
  const nightTexture = body.nightTexture
    ? useLoader(THREE.TextureLoader, body.nightTexture)
    : null
  const cloudTexture = body.cloudTexture
    ? useLoader(THREE.TextureLoader, body.cloudTexture)
    : null
  const ringTexture = body.ringTexture
    ? useLoader(THREE.TextureLoader, body.ringTexture)
    : null

  // Configure texture quality
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 16
    if (nightTexture) {
      nightTexture.colorSpace = THREE.SRGBColorSpace
      nightTexture.anisotropy = 16
    }
    if (cloudTexture) {
      cloudTexture.anisotropy = 16
    }
  }, [texture, nightTexture, cloudTexture])

  const scale = useMemo(() => {
    const r = body.data.pl_rade ?? 1
    if (r < 0.5) return 0.6
    if (r < 2) return 0.7 + r * 0.2
    if (r < 6) return 1.0 + (r - 2) * 0.1
    return 1.4 + Math.log10(r) * 0.3
  }, [body.data.pl_rade])

  // Axial tilt
  const tilt = useMemo(() => {
    const tilts: Record<string, number> = {
      Mercury: 0.034, Venus: 2.64, Earth: 23.44, Mars: 25.19,
      Jupiter: 3.13, Saturn: 26.73, Uranus: 82.23, Neptune: 28.32,
    }
    return ((tilts[body.name] ?? 0) * Math.PI) / 180
  }, [body.name])

  // Rotation speed
  const rotSpeed = useMemo(() => {
    const speeds: Record<string, number> = {
      Mercury: 0.02, Venus: -0.01, Earth: 0.1, Mars: 0.09,
      Jupiter: 0.2, Saturn: 0.18, Uranus: 0.15, Neptune: 0.14,
    }
    return speeds[body.name] ?? 0.08
  }, [body.name])

  // Earth-specific shader for day/night blending
  const earthUniforms = useMemo(() => {
    if (body.name !== 'Earth' || !nightTexture) return null
    return {
      dayMap: { value: texture },
      nightMap: { value: nightTexture },
      sunDir: { value: new THREE.Vector3(1, 0.3, 0.8).normalize() },
    }
  }, [body.name, texture, nightTexture])

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * rotSpeed
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * rotSpeed * 1.15
  })

  const moons = body.data.visual_num_moons ?? 0

  return (
    <group rotation={[tilt, 0, 0]}>
      {/* Planet body */}
      {earthUniforms ? (
        <mesh ref={meshRef} scale={scale}>
          <sphereGeometry args={[1, 128, 128]} />
          <shaderMaterial
            uniforms={earthUniforms}
            vertexShader={`
              varying vec2 vUv;
              varying vec3 vNormal;
              varying vec3 vPosition;
              void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              uniform sampler2D dayMap;
              uniform sampler2D nightMap;
              uniform vec3 sunDir;
              varying vec2 vUv;
              varying vec3 vNormal;
              varying vec3 vPosition;
              void main() {
                vec3 N = normalize(vNormal);
                float NdotL = dot(N, sunDir);
                float dayFactor = smoothstep(-0.15, 0.2, NdotL);

                vec3 dayColor = texture2D(dayMap, vUv).rgb;
                vec3 nightColor = texture2D(nightMap, vUv).rgb;

                vec3 color = mix(nightColor * 0.8, dayColor, dayFactor);

                // Lighting
                float diff = smoothstep(-0.1, 1.0, NdotL);
                color *= 0.08 + diff * 0.92;

                // Atmospheric rim
                vec3 V = normalize(cameraPosition - vPosition);
                float rim = 1.0 - max(dot(V, N), 0.0);
                float rimP = pow(rim, 3.0);
                vec3 scatter = mix(vec3(0.3, 0.5, 0.9), vec3(0.8, 0.5, 0.2), max(0.0, -NdotL));
                color += rimP * scatter * 0.12;

                gl_FragColor = vec4(color, 1.0);
              }
            `}
          />
        </mesh>
      ) : (
        <mesh ref={meshRef} scale={scale}>
          <sphereGeometry args={[1, 128, 128]} />
          <meshStandardMaterial
            map={texture}
            roughness={body.data.visual_surface_type === 'gas' ? 0.7 : 0.9}
            metalness={0.05}
          />
        </mesh>
      )}

      {/* Cloud layer */}
      {cloudTexture && (
        <mesh ref={cloudsRef} scale={scale * 1.008}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            map={cloudTexture}
            transparent
            opacity={body.name === 'Venus' ? 0.95 : 0.4}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Saturn rings with real texture */}
      {ringTexture && body.name === 'Saturn' && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} scale={scale}>
          <ringGeometry args={[1.2, 2.2, 128]} />
          <meshStandardMaterial
            map={ringTexture}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Moons (show max 4 visually) */}
      {moons > 0 && moons <= 10 && (
        <Moons count={Math.min(moons, 4)} planetScale={scale} />
      )}
    </group>
  )
}
