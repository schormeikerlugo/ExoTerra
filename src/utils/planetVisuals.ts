import type { Exoplanet, SurfaceType } from '../data/types'
import { planetNameToSeed } from './planetSeed'

export function hexToVec3(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

// Multiple color palettes per surface type for variety
const gasPalettes = [
  { base: '#c49a6c', secondary: '#8d6e4a' }, // Jupiter-like warm
  { base: '#d4a574', secondary: '#a07850' }, // Saturn-like golden
  { base: '#7a6b8a', secondary: '#4a3d5c' }, // Purple/violet gas
  { base: '#8a7060', secondary: '#5c4030' }, // Brown dwarf-like
  { base: '#6b8a7a', secondary: '#3a5c4a' }, // Teal/green gas
  { base: '#8a6070', secondary: '#5c3040' }, // Rose/red gas
]

const rockyPalettes = [
  { base: '#7a6552', secondary: '#5c4a3a' }, // Mars-like
  { base: '#6a6a6a', secondary: '#4a4a4a' }, // Mercury-like grey
  { base: '#8a7a5a', secondary: '#6a5a3a' }, // Sandy
  { base: '#5a5a6a', secondary: '#3a3a4a' }, // Dark slate
  { base: '#7a5a4a', secondary: '#5a3a2a' }, // Rusty red
]

const icePalettes = [
  { base: '#90caf9', secondary: '#e1f5fe' }, // Blue ice
  { base: '#80b0d0', secondary: '#d0e8f0' }, // Steel blue
  { base: '#a0c0d0', secondary: '#e0f0f0' }, // Pale cyan
]

const surfaceColors: Record<SurfaceType, { base: string; secondary: string }> = {
  water: { base: '#1a5276', secondary: '#2e7d32' },
  rocky: { base: '#7a6552', secondary: '#5c4a3a' },
  lava: { base: '#b71c1c', secondary: '#e65100' },
  ice: { base: '#90caf9', secondary: '#e1f5fe' },
  gas: { base: '#c49a6c', secondary: '#8d6e4a' },
}

export function getPlanetColors(planet: Exoplanet) {
  const surface = (planet.visual_surface_type as SurfaceType) || 'rocky'
  const seed = planetNameToSeed(planet.pl_name)

  // Select palette variant based on seed
  let colors: { base: string; secondary: string }
  if (surface === 'gas') {
    colors = gasPalettes[Math.floor(seed) % gasPalettes.length]
  } else if (surface === 'rocky') {
    colors = rockyPalettes[Math.floor(seed) % rockyPalettes.length]
  } else if (surface === 'ice') {
    colors = icePalettes[Math.floor(seed) % icePalettes.length]
  } else {
    colors = surfaceColors[surface] || surfaceColors.rocky
  }

  return {
    baseColor: hexToVec3(colors.base),
    secondaryColor: hexToVec3(colors.secondary),
    atmosphereColor: hexToVec3(planet.visual_atmosphere_color || '#C0C0C0'),
  }
}

export function getPlanetScale(planet: Exoplanet): number {
  const radius = planet.pl_rade ?? 1
  if (radius < 0.5) return 0.6
  if (radius < 2) return 0.7 + radius * 0.2
  if (radius < 6) return 1.0 + (radius - 2) * 0.1
  return 1.4 + Math.log10(radius) * 0.3
}

export function getRingColor(planet: Exoplanet): [number, number, number] {
  if (planet.planet_type === 'ice_giant') return hexToVec3('#8899AA')
  return hexToVec3('#C4A46C')
}

export function formatNumber(n: number | null, decimals = 2): string {
  if (n === null) return '—'
  return n.toFixed(decimals)
}

export function formatTemperature(k: number | null): string {
  if (k === null) return '—'
  return `${k.toFixed(0)} K (${(k - 273.15).toFixed(0)} °C)`
}
