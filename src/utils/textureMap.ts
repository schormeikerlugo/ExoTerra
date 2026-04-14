import { planetNameToSeed } from './planetSeed'
import type { Exoplanet } from '../data/types'

const rockyTextures = [
  '/textures/exoplanets/rocky_grey.jpg',
  '/textures/exoplanets/rocky_red.jpg',
  '/textures/exoplanets/rocky_brown.jpg',
  '/textures/exoplanets/rocky_dark.jpg',
  '/textures/exoplanets/rocky_sandy.jpg',
]

const gasTextures = [
  '/textures/exoplanets/gas_warm.jpg',
  '/textures/exoplanets/gas_cold.jpg',
  '/textures/exoplanets/gas_blue.jpg',
  '/textures/exoplanets/gas_purple.jpg',
]

const iceTextures = [
  '/textures/exoplanets/ice_blue.jpg',
  '/textures/exoplanets/ice_white.jpg',
  '/textures/exoplanets/ice_dirty.jpg',
]

const lavaTextures = [
  '/textures/exoplanets/lava_cracks.jpg',
  '/textures/exoplanets/lava_cracks-1.jpg',
]

const waterTextures = [
  '/textures/exoplanets/water_earth.jpg',
  '/textures/exoplanets/water_arid.jpg',
  '/textures/exoplanets/water_tropical.jpg',
]

export function getExoplanetTexture(planet: Exoplanet): string {
  const seed = planetNameToSeed(planet.pl_name)
  const idx = Math.floor(seed)
  const surface = planet.visual_surface_type
  const temp = planet.pl_eqt ?? 300

  switch (surface) {
    case 'rocky': {
      // Hot rocky planets get darker textures
      if (temp > 800) return rockyTextures[3] // dark
      if (temp > 500) return rockyTextures[idx % 3 === 0 ? 3 : 1] // dark or red
      // Cold rocky
      if (temp < 150) return rockyTextures[0] // grey
      // Select by seed
      return rockyTextures[idx % rockyTextures.length]
    }
    case 'gas': {
      // Hot gas = warm textures
      if (temp > 1000) return gasTextures[0] // warm
      // Cold gas = blue/cold
      if (temp < 200) return gasTextures[idx % 2 === 0 ? 1 : 2] // cold or blue
      return gasTextures[idx % gasTextures.length]
    }
    case 'ice':
      return iceTextures[idx % iceTextures.length]
    case 'lava':
      return lavaTextures[idx % lavaTextures.length]
    case 'water': {
      // Dry worlds (low water ratio)
      if (planet.pl_insol !== null && planet.pl_insol > 1.5) return waterTextures[1] // arid
      // Warm worlds
      if (temp > 290 && temp < 310) return waterTextures[idx % 2 === 0 ? 0 : 2] // earth or tropical
      return waterTextures[idx % waterTextures.length]
    }
    default:
      return rockyTextures[idx % rockyTextures.length]
  }
}

// How much the texture should blend with procedural (0 = full procedural, 1 = full texture)
export function getTextureBlend(planet: Exoplanet): number {
  const surface = planet.visual_surface_type
  switch (surface) {
    case 'rocky': return 0.70
    case 'gas': return 0.65
    case 'ice': return 0.65
    case 'lava': return 0.75
    case 'water': return 0.55
    default: return 0.25
  }
}
