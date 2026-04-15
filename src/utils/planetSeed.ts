// Generate a deterministic seed from planet name
export function planetNameToSeed(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit int
  }
  // Normalize to 0-100 range
  return Math.abs(hash % 10000) / 100
}

// Estimate water ratio from planet data
export function estimateWaterRatio(
  eqt: number | null,
  _insol: number | null,
  inHZ: boolean,
  seed: number,
): number {
  // Base ratio from seed for variety
  let ratio = 0.3 + (seed % 10) / 20 // 0.3 to 0.8

  if (eqt !== null) {
    // Sweet spot 260-310K = more water
    if (eqt >= 260 && eqt <= 310) {
      ratio += 0.15
    } else if (eqt >= 220 && eqt <= 350) {
      ratio += 0.05
    } else if (eqt > 350) {
      ratio -= 0.2 // too hot, water evaporates
    } else {
      ratio -= 0.1 // too cold, frozen
    }
  }

  if (inHZ) ratio += 0.1

  return Math.max(0.2, Math.min(0.85, ratio))
}
