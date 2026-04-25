import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export interface Marker3D {
  id: string
  lat: number
  lon: number
  label: string
  value: string
  unit?: string
  status?: 'ok' | 'warn' | 'crit'
  side?: 'left' | 'right'
}

interface Props {
  markers: Marker3D[]
  surfaceOffset?: number
}

function sphericalToCartesian(latDeg: number, lonDeg: number, r: number): [number, number, number] {
  const lat = (latDeg * Math.PI) / 180
  const lon = (lonDeg * Math.PI) / 180
  const x = r * Math.cos(lat) * Math.sin(lon)
  const y = r * Math.sin(lat)
  const z = r * Math.cos(lat) * Math.cos(lon)
  return [x, y, z]
}

export function PlanetMarkers3D({ markers, surfaceOffset = 1.01 }: Props) {
  return (
    <>
      {markers.map((m) => {
        const pos = sphericalToCartesian(m.lat, m.lon, surfaceOffset)
        return <MarkerNode key={m.id} marker={m} position={pos} />
      })}
    </>
  )
}

const STATUS_COLOR: Record<NonNullable<Marker3D['status']>, string> = {
  ok: '#7DD3FC',
  warn: '#FFB547',
  crit: '#FF5470',
}

function MarkerNode({ marker, position }: { marker: Marker3D; position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)
  const [facing, setFacing] = useState(1)
  const worldPos = useRef(new THREE.Vector3())
  const normal = useRef(new THREE.Vector3())
  const toCam = useRef(new THREE.Vector3())
  const parentCenter = useRef(new THREE.Vector3())

  useFrame((state) => {
    if (!groupRef.current) return
    const parent = groupRef.current.parent
    if (!parent) return
    parent.getWorldPosition(parentCenter.current)
    groupRef.current.getWorldPosition(worldPos.current)
    normal.current.copy(worldPos.current).sub(parentCenter.current).normalize()
    toCam.current.copy(state.camera.position).sub(worldPos.current).normalize()
    const dot = normal.current.dot(toCam.current)
    // smooth step: 1 when facing camera, 0 when behind
    const f = THREE.MathUtils.clamp((dot + 0.1) / 0.5, 0, 1)
    setFacing((prev) => prev + (f - prev) * 0.2)
  })

  const color = STATUS_COLOR[marker.status ?? 'ok']
  const side = marker.side ?? 'right'
  const hidden = facing < 0.05

  return (
    <group ref={groupRef} position={position}>
      <Html
        center
        zIndexRange={[20, 0]}
        style={{
          opacity: facing,
          pointerEvents: hidden ? 'none' : 'auto',
          transition: 'opacity 200ms linear',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: side === 'right' ? 'row' : 'row-reverse',
            alignItems: 'center',
            gap: 0,
            transform: side === 'right' ? 'translateX(0)' : 'translateX(0)',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {/* Marker dot + pulsing halo */}
          <div
            style={{
              position: 'relative',
              width: 10,
              height: 10,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `1px solid ${color}`,
                animation: 'hud-pulse 1.8s ease-in-out infinite',
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: color,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 8px ${color}`,
              }}
            />
          </div>

          {/* Leader line */}
          <div
            style={{
              width: 48,
              height: 1,
              background: `linear-gradient(${side === 'right' ? 'to right' : 'to left'}, ${color} 0%, ${color}55 100%)`,
              flexShrink: 0,
            }}
          />

          {/* Label bracket */}
          <div
            style={{
              padding: '4px 10px',
              background: 'rgba(10, 14, 22, 0.85)',
              border: `1px solid ${color}44`,
              borderLeft: side === 'right' ? `2px solid ${color}` : `1px solid ${color}44`,
              borderRight: side === 'left' ? `2px solid ${color}` : `1px solid ${color}44`,
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              minWidth: 90,
              textAlign: side === 'right' ? 'left' : 'right',
            }}
          >
            <span
              style={{
                fontSize: 8,
                letterSpacing: 2,
                color: 'rgba(245,247,250,0.45)',
                textTransform: 'uppercase',
              }}
            >
              {marker.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color, letterSpacing: '0.5px' }}>
              {marker.value}
              {marker.unit && (
                <span style={{ marginLeft: 3, fontSize: 9, color: 'rgba(245,247,250,0.35)' }}>{marker.unit}</span>
              )}
            </span>
          </div>
        </div>
      </Html>
    </group>
  )
}
