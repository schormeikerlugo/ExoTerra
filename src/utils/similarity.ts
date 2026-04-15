import type { Exoplanet } from '../data/types'

interface SimilarityResult {
  planet: Exoplanet
  similarity: number
}

interface FieldConfig {
  key: keyof Exoplanet
  weight: number
}

const FIELDS: FieldConfig[] = [
  { key: 'pl_eqt', weight: 0.25 },
  { key: 'pl_rade', weight: 0.25 },
  { key: 'pl_masse', weight: 0.20 },
  { key: 'habitability_score', weight: 0.15 },
  { key: 'pl_dens', weight: 0.15 },
]

function getMinMax(planets: Exoplanet[], key: keyof Exoplanet): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity

  for (const p of planets) {
    const val = p[key]
    if (typeof val === 'number' && val !== null) {
      if (val < min) min = val
      if (val > max) max = val
    }
  }

  return { min, max }
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5
  return (value - min) / (max - min)
}

export function findSimilarPlanets(
  target: Exoplanet,
  allPlanets: Exoplanet[],
  count: number = 5,
): SimilarityResult[] {
  // Precompute min/max for each field across the dataset
  const ranges = new Map<keyof Exoplanet, { min: number; max: number }>()
  for (const field of FIELDS) {
    ranges.set(field.key, getMinMax(allPlanets, field.key))
  }

  const results: SimilarityResult[] = []

  for (const planet of allPlanets) {
    // Exclude the target planet itself
    if (planet.id === target.id) continue

    // Exclude solar system bodies (id < 0)
    if (planet.id < 0) continue

    let weightedDistanceSum = 0
    let totalWeight = 0

    for (const field of FIELDS) {
      const targetVal = target[field.key]
      const planetVal = planet[field.key]

      // Skip this dimension if either planet has null for the field
      if (targetVal === null || targetVal === undefined) continue
      if (planetVal === null || planetVal === undefined) continue
      if (typeof targetVal !== 'number' || typeof planetVal !== 'number') continue

      const range = ranges.get(field.key)!
      const normalizedTarget = normalize(targetVal, range.min, range.max)
      const normalizedPlanet = normalize(planetVal, range.min, range.max)

      const diff = normalizedTarget - normalizedPlanet
      weightedDistanceSum += field.weight * (diff * diff)
      totalWeight += field.weight
    }

    // If no dimensions could be compared, skip this planet
    if (totalWeight === 0) continue

    // Weighted euclidean distance, normalized by total weight used
    const distance = Math.sqrt(weightedDistanceSum / totalWeight)

    // Convert distance (0 = identical, 1 = maximally different) to similarity score (0-100)
    const similarity = Math.max(0, Math.min(100, (1 - distance) * 100))

    results.push({ planet, similarity })
  }

  // Sort by similarity descending (highest first)
  results.sort((a, b) => b.similarity - a.similarity)

  return results.slice(0, count)
}
