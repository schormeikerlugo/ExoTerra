import { create } from 'zustand'
import type { Exoplanet, FilterState } from '../data/types'

interface AppState {
  // Data
  planets: Exoplanet[]
  filteredPlanets: Exoplanet[]
  selectedPlanet: Exoplanet | null
  isLoading: boolean
  error: string | null

  // Filters
  filters: FilterState

  // Actions
  setPlanets: (planets: Exoplanet[]) => void
  setSelectedPlanet: (planet: Exoplanet | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
}

const defaultFilters: FilterState = {
  temperatureRange: [0, 5000],
  radiusRange: [0, 30],
  massRange: [0, 10000],
  planetTypes: [],
  habitableZoneOnly: false,
  minHabitabilityScore: 0,
  searchQuery: '',
  sortBy: 'habitability_score',
  sortOrder: 'desc',
}

function applyFilters(planets: Exoplanet[], filters: FilterState): Exoplanet[] {
  let result = planets.filter((p) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase()
      if (!p.pl_name.toLowerCase().includes(q) && !p.hostname.toLowerCase().includes(q)) {
        return false
      }
    }

    if (p.pl_eqt !== null) {
      if (p.pl_eqt < filters.temperatureRange[0] || p.pl_eqt > filters.temperatureRange[1]) {
        return false
      }
    }

    if (p.pl_rade !== null) {
      if (p.pl_rade < filters.radiusRange[0] || p.pl_rade > filters.radiusRange[1]) {
        return false
      }
    }

    if (p.pl_masse !== null) {
      if (p.pl_masse < filters.massRange[0] || p.pl_masse > filters.massRange[1]) {
        return false
      }
    }

    if (filters.planetTypes.length > 0 && !filters.planetTypes.includes(p.planet_type)) {
      return false
    }

    if (filters.habitableZoneOnly && !p.in_habitable_zone) {
      return false
    }

    if (p.habitability_score < filters.minHabitabilityScore) {
      return false
    }

    return true
  })

  result.sort((a, b) => {
    const key = filters.sortBy
    const aVal = a[key] ?? 0
    const bVal = b[key] ?? 0
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return filters.sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return filters.sortOrder === 'asc'
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number)
  })

  return result
}

export const useStore = create<AppState>((set, get) => ({
  planets: [],
  filteredPlanets: [],
  selectedPlanet: null,
  isLoading: true,
  error: null,
  filters: defaultFilters,

  setPlanets: (planets) =>
    set({
      planets,
      filteredPlanets: applyFilters(planets, get().filters),
      isLoading: false,
    }),

  setSelectedPlanet: (planet) => set({ selectedPlanet: planet }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  updateFilter: (key, value) => {
    const newFilters = { ...get().filters, [key]: value }
    set({
      filters: newFilters,
      filteredPlanets: applyFilters(get().planets, newFilters),
    })
  },

  resetFilters: () =>
    set({
      filters: defaultFilters,
      filteredPlanets: applyFilters(get().planets, defaultFilters),
    }),
}))
