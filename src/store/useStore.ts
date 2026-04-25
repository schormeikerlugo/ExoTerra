import { create } from 'zustand'
import type { Exoplanet, FilterState } from '../data/types'

export const COMPARE_MAX = 4
const COMPARE_STORAGE_KEY = 'exoterra:compareIds'

function loadCompareIds(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

function persistCompareIds(ids: number[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* quota exceeded, etc. — ignore silently */
  }
}

interface AppState {
  // Data
  planets: Exoplanet[]
  filteredPlanets: Exoplanet[]
  selectedPlanet: Exoplanet | null
  isLoading: boolean
  error: string | null

  // Filters
  filters: FilterState

  // Compare bin (persisted across sessions). We store IDs and resolve to planets
  // on-demand so updates to the planets array reflect immediately.
  compareIds: number[]

  // Actions
  setPlanets: (planets: Exoplanet[]) => void
  setSelectedPlanet: (planet: Exoplanet | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
  toggleCompare: (planetId: number) => void
  removeFromCompare: (planetId: number) => void
  clearCompare: () => void
}

const defaultFilters: FilterState = {
  temperatureRange: [0, 5000],
  radiusRange: [0, 30],
  massRange: [0, 10000],
  planetTypes: [],
  discoveryMethods: [],
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

    if (filters.discoveryMethods.length > 0 && !filters.discoveryMethods.includes(p.discoverymethod ?? '')) {
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
  compareIds: loadCompareIds(),

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

  toggleCompare: (planetId) => {
    const current = get().compareIds
    let next: number[]
    if (current.includes(planetId)) {
      next = current.filter((id) => id !== planetId)
    } else {
      // Cap at COMPARE_MAX; ignore extra additions silently. UI surfaces the cap.
      if (current.length >= COMPARE_MAX) return
      next = [...current, planetId]
    }
    persistCompareIds(next)
    set({ compareIds: next })
  },

  removeFromCompare: (planetId) => {
    const next = get().compareIds.filter((id) => id !== planetId)
    persistCompareIds(next)
    set({ compareIds: next })
  },

  clearCompare: () => {
    persistCompareIds([])
    set({ compareIds: [] })
  },
}))

/** Selector hook: resolves stored IDs to current planet objects. */
export function useComparePlanets(): Exoplanet[] {
  const planets = useStore((s) => s.planets)
  const compareIds = useStore((s) => s.compareIds)
  return compareIds
    .map((id) => planets.find((p) => p.id === id))
    .filter((p): p is Exoplanet => p !== undefined)
}
