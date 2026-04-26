import type { Exoplanet } from '../data/types'
import type { Marker3D } from '../components/HUD/PlanetMarkers3D'
import { planetNameToSeed } from './planetSeed'

function fmt(n: number | null | undefined, d = 1): string {
  if (n === null || n === undefined || !isFinite(n)) return '—'
  return n.toFixed(d)
}

/**
 * Build a canonical set of HUD markers for a planet.
 * Positions (lat/lon) are deterministic per planet name so they stay put
 * across renders but vary between planets for visual variety.
 */
export function buildPlanetMarkers(planet: Exoplanet): Marker3D[] {
  const seed = planetNameToSeed(planet.pl_name)
  // Deterministic angular distribution around visible hemisphere
  const baseAngle = (seed % 360)
  const angle = (i: number) => ((baseAngle + i * 73) % 360) - 180 // spread across -180..180

  const markers: Marker3D[] = []

  if (planet.pl_eqt !== null) {
    const t = planet.pl_eqt
    const status: Marker3D['status'] = t > 800 ? 'crit' : t < 180 ? 'warn' : 'ok'
    markers.push({
      id: 'temp',
      lat: 28,
      lon: angle(0),
      label: 'EQ. TEMP',
      value: `${t.toFixed(0)}`,
      unit: 'K',
      status,
      side: 'right',
    })
  }

  if (planet.pl_rade !== null) {
    markers.push({
      id: 'radius',
      lat: -32,
      lon: angle(1),
      label: 'RADIUS',
      value: fmt(planet.pl_rade, 2),
      unit: 'R⊕',
      side: 'right',
    })
  }

  if (planet.pl_masse !== null) {
    markers.push({
      id: 'mass',
      lat: 12,
      lon: angle(2),
      label: 'MASS',
      value: fmt(planet.pl_masse, 2),
      unit: 'M⊕',
      side: 'left',
    })
  }

  if (planet.pl_insol !== null) {
    markers.push({
      id: 'flux',
      lat: -18,
      lon: angle(3),
      label: 'STELLAR FLUX',
      value: fmt(planet.pl_insol, 2),
      unit: 'S⊕',
      side: 'left',
    })
  }

  if (planet.pl_orbper !== null) {
    markers.push({
      id: 'period',
      lat: 42,
      lon: angle(4),
      label: 'ORBITAL PERIOD',
      value: fmt(planet.pl_orbper, 1),
      unit: 'D',
      side: 'left',
    })
  }

  if (planet.in_habitable_zone) {
    markers.push({
      id: 'hz',
      lat: -5,
      lon: angle(5),
      label: 'HABITABLE ZONE',
      value: 'CONFIRMED',
      status: 'ok',
      side: 'right',
    })
  }

  return markers
}

/**
 * Dataset-level HUD telemetry for the hero when no single planet is featured.
 *
 * Each cluster surfaces a DIFFERENT class of insight — no duplicates with the
 * navbar (which shows brand/LIVE/clock) or with each other:
 *   topLeft    — archive identity & scale
 *   topRight   — extreme records (hottest, largest)
 *   bottomLeft — habitability standouts (count + top scorer)
 *   bottomRight — proximity & recency (nearest + most-recent year)
 */
export function buildSystemTelemetry(input: {
  totalPlanets: number
  habitableZone: number
  closestPlanet: string
  hottestName: string
  largestName: string
  topScorerName: string
  topScore: number
  latestYear: number | null
}) {
  return {
    topLeft: [
      { label: 'ARCHIVE', value: 'NASA / IPAC' },
      { label: 'INDEXED', value: input.totalPlanets > 0 ? `${input.totalPlanets.toLocaleString()} OBJ` : '— OBJ' },
    ],
    topRight: [
      { label: 'HOTTEST', value: input.hottestName || '—' },
      { label: 'LARGEST', value: input.largestName || '—' },
    ],
    bottomLeft: [
      { label: 'HABITABLE', value: input.habitableZone > 0 ? `${input.habitableZone} IN HZ` : '—' },
      { label: 'TOP SCORE', value: input.topScorerName ? `${input.topScorerName} · ${input.topScore.toFixed(1)}` : '—' },
    ],
    bottomRight: [
      { label: 'NEAREST', value: input.closestPlanet },
      { label: 'LATEST', value: input.latestYear ? `DISC. ${input.latestYear}` : '—' },
    ],
  }
}

/**
 * Telemetry items for the hero corners — metadata that doesn't need 3D anchoring.
 */
export function buildCornerTelemetry(planet: Exoplanet) {
  return {
    topLeft: [
      { label: 'SAT-ID', value: planet.pl_name },
      { label: 'CLASS', value: planet.planet_type.replace('_', ' ').toUpperCase() },
    ],
    topRight: [
      { label: 'HOST STAR', value: planet.hostname },
      { label: 'SPECTRAL', value: planet.st_spectype ?? '—' },
    ],
    bottomLeft: [
      { label: 'RA', value: planet.ra !== null ? `${planet.ra.toFixed(3)}°` : '—' },
      { label: 'DEC', value: planet.dec !== null ? `${planet.dec.toFixed(3)}°` : '—' },
    ],
    bottomRight: [
      { label: 'DISTANCE', value: planet.sy_dist !== null ? `${planet.sy_dist.toFixed(1)} PC` : '—' },
      { label: 'DISCOVERED', value: planet.disc_year?.toString() ?? '—' },
    ],
  }
}
