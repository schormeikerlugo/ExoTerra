import type { Exoplanet } from '../data/types'

const CACHE_KEY = 'exoterra_planets_v1'
const CACHE_META_KEY = 'exoterra_planets_meta_v1'

export interface CacheMeta {
  count: number
  lastUpdated: string | null
  savedAt: number
}

export function loadCache(): { planets: Exoplanet[]; meta: CacheMeta } | null {
  try {
    const rawData = localStorage.getItem(CACHE_KEY)
    const rawMeta = localStorage.getItem(CACHE_META_KEY)
    if (!rawData || !rawMeta) return null
    const planets = JSON.parse(rawData) as Exoplanet[]
    const meta = JSON.parse(rawMeta) as CacheMeta
    if (!Array.isArray(planets) || planets.length === 0) return null
    return { planets, meta }
  } catch {
    return null
  }
}

export function saveCache(planets: Exoplanet[], meta: Omit<CacheMeta, 'savedAt'>): boolean {
  try {
    const fullMeta: CacheMeta = { ...meta, savedAt: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(planets))
    localStorage.setItem(CACHE_META_KEY, JSON.stringify(fullMeta))
    return true
  } catch (err) {
    // QuotaExceededError or similar — clear and skip caching
    try {
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_META_KEY)
    } catch { /* ignore */ }
    console.warn('Could not cache planets (storage full):', err)
    return false
  }
}

export function isCacheValid(cached: CacheMeta, current: { count: number; lastUpdated: string | null }): boolean {
  return cached.count === current.count && cached.lastUpdated === current.lastUpdated
}

export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_META_KEY)
  } catch { /* ignore */ }
}
