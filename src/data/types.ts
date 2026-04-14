export interface Exoplanet {
  id: number
  pl_name: string
  hostname: string
  sys_name: string | null

  // Physical properties
  pl_masse: number | null
  pl_rade: number | null
  pl_dens: number | null
  pl_bmasse: number | null
  pl_bmassj: number | null
  pl_radj: number | null

  // Orbital parameters
  pl_orbper: number | null
  pl_orbsmax: number | null
  pl_orbeccen: number | null
  pl_orbincl: number | null

  // Temperature & atmosphere
  pl_eqt: number | null
  pl_insol: number | null

  // Discovery
  discoverymethod: string | null
  disc_year: number | null
  disc_facility: string | null

  // Host star
  st_spectype: string | null
  st_teff: number | null
  st_rad: number | null
  st_mass: number | null
  st_lum: number | null
  st_age: number | null
  st_met: number | null

  // Position
  ra: number | null
  dec: number | null
  sy_dist: number | null

  // Computed fields
  habitability_score: number
  planet_type: string
  in_habitable_zone: boolean
  has_atmosphere_likely: boolean

  // Visual properties
  visual_surface_type: string
  visual_atmosphere_density: number
  visual_atmosphere_color: string
  visual_has_rings: boolean
  visual_has_clouds: boolean
  visual_cloud_density: number
  visual_num_moons: number
}

export interface FilterState {
  temperatureRange: [number, number]
  radiusRange: [number, number]
  massRange: [number, number]
  planetTypes: string[]
  habitableZoneOnly: boolean
  minHabitabilityScore: number
  searchQuery: string
  sortBy: 'habitability_score' | 'pl_eqt' | 'pl_rade' | 'pl_masse' | 'disc_year' | 'pl_name'
  sortOrder: 'asc' | 'desc'
}

export type PlanetType =
  | 'rocky'
  | 'super_earth'
  | 'gas_giant'
  | 'hot_jupiter'
  | 'ice_giant'
  | 'mini_neptune'
  | 'lava_world'
  | 'frozen_rocky'
  | 'unknown'

export type SurfaceType = 'water' | 'rocky' | 'lava' | 'ice' | 'gas'
