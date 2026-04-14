import type { Exoplanet } from '../data/types'

export function generatePlanetDescription(planet: Exoplanet): string {
  const parts: string[] = []

  // Opening
  const typeDesc = getTypeDescription(planet.planet_type)
  parts.push(
    `${planet.pl_name} is a ${typeDesc} orbiting the star ${planet.hostname}` +
      (planet.sy_dist ? `, located approximately ${planet.sy_dist.toFixed(1)} parsecs (${(planet.sy_dist * 3.26).toFixed(1)} light-years) from Earth` : '') +
      '.',
  )

  // Discovery
  if (planet.disc_year && planet.discoverymethod) {
    parts.push(
      `It was discovered in ${planet.disc_year} using the ${planet.discoverymethod.toLowerCase()} method` +
        (planet.disc_facility ? ` at ${planet.disc_facility}` : '') +
        '.',
    )
  }

  // Size comparison
  if (planet.pl_rade !== null) {
    const earthComparison = getRadiusComparison(planet.pl_rade)
    parts.push(earthComparison)
  }

  if (planet.pl_masse !== null) {
    const massComparison = getMassComparison(planet.pl_masse)
    parts.push(massComparison)
  }

  // Temperature & atmosphere
  if (planet.pl_eqt !== null) {
    parts.push(getTemperatureDescription(planet.pl_eqt, planet.planet_type))
  }

  // Orbit
  if (planet.pl_orbper !== null) {
    parts.push(getOrbitDescription(planet.pl_orbper, planet.pl_orbsmax))
  }

  // Star
  if (planet.st_spectype || planet.st_teff) {
    parts.push(getStarDescription(planet))
  }

  // Habitability
  if (planet.habitability_score > 0) {
    parts.push(getHabitabilityDescription(planet))
  }

  return parts.join(' ')
}

function getTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    rocky: 'rocky terrestrial planet, similar in composition to Earth or Mars',
    super_earth: 'super-Earth — a rocky planet significantly larger than Earth but smaller than Neptune',
    gas_giant: 'gas giant, a massive planet composed primarily of hydrogen and helium, similar to Jupiter or Saturn',
    hot_jupiter: 'hot Jupiter — a gas giant orbiting extremely close to its host star, resulting in scorching surface temperatures',
    ice_giant: 'ice giant, similar in nature to Uranus or Neptune, composed largely of heavier elements like water, ammonia, and methane',
    mini_neptune: 'mini-Neptune, a planet with a significant gaseous envelope but smaller than the ice giants in our solar system',
    lava_world: 'lava world — a rocky planet with surface temperatures so extreme that its surface is likely covered in molten rock',
    frozen_rocky: 'frozen rocky world, a cold terrestrial planet far from its host star where surface temperatures remain well below freezing',
    unknown: 'planet whose exact classification remains uncertain based on available data',
  }
  return descriptions[type] || descriptions.unknown
}

function getRadiusComparison(rade: number): string {
  if (rade < 0.5) return `With a radius of just ${rade.toFixed(2)} Earth radii, it is significantly smaller than Earth, comparable to Mars or Mercury.`
  if (rade < 0.9) return `At ${rade.toFixed(2)} Earth radii, it is slightly smaller than our planet.`
  if (rade <= 1.1) return `With a radius of ${rade.toFixed(2)} Earth radii, it is remarkably similar in size to Earth.`
  if (rade <= 2) return `At ${rade.toFixed(2)} Earth radii, it is noticeably larger than Earth but still within the range of potentially rocky worlds.`
  if (rade <= 4) return `With a radius of ${rade.toFixed(2)} Earth radii, it falls in the super-Earth to mini-Neptune range, likely possessing a significant atmosphere.`
  if (rade <= 8) return `At ${rade.toFixed(1)} Earth radii, it is comparable in size to Neptune (3.9 R⊕) or Uranus (4.0 R⊕).`
  return `With a radius of ${rade.toFixed(1)} Earth radii (${(rade / 11.2).toFixed(2)} Jupiter radii), it is a massive world — ${rade > 11.2 ? 'even larger than Jupiter' : 'comparable to Jupiter in size'}.`
}

function getMassComparison(masse: number): string {
  if (masse < 0.5) return `Its mass of ${masse.toFixed(2)} Earth masses suggests a smaller, less dense body with weaker gravitational pull.`
  if (masse <= 2) return `With a mass of ${masse.toFixed(2)} Earth masses, its gravitational pull would feel broadly similar to what we experience on Earth.`
  if (masse <= 10) return `At ${masse.toFixed(1)} Earth masses, its stronger gravity would make this a heavy world to walk on — assuming a solid surface exists.`
  if (masse <= 50) return `With a mass of ${masse.toFixed(1)} Earth masses, it possesses significant gravitational influence, enough to retain a dense atmosphere.`
  return `At ${masse.toFixed(0)} Earth masses (${(masse / 317.8).toFixed(2)} Jupiter masses), its immense gravity shapes everything around it, from its thick atmosphere to any moons caught in its orbit.`
}

function getTemperatureDescription(eqt: number, type: string): string {
  const celsius = eqt - 273.15
  if (eqt > 2000) return `Its equilibrium temperature reaches an extreme ${eqt.toFixed(0)} K (${celsius.toFixed(0)} °C), hot enough to vaporize most metals. The atmosphere, if present, would glow with thermal radiation.`
  if (eqt > 1000) return `Surface temperatures reach approximately ${eqt.toFixed(0)} K (${celsius.toFixed(0)} °C), far too hot for liquid water. At these temperatures, the surface or upper atmosphere would radiate visibly in the infrared.`
  if (eqt > 500) return `With an equilibrium temperature of ${eqt.toFixed(0)} K (${celsius.toFixed(0)} °C), conditions are extremely hot — comparable to Venus or hotter, where a runaway greenhouse effect would trap heat.`
  if (eqt > 310) return `At ${eqt.toFixed(0)} K (${celsius.toFixed(0)} °C), it sits at the warm edge of potential habitability. Water could exist in liquid form under the right atmospheric conditions, though it may be too warm for comfort.`
  if (eqt >= 200) return `Its equilibrium temperature of ${eqt.toFixed(0)} K (${celsius.toFixed(0)} °C) places it within a range where liquid water could potentially exist on the surface — a critical requirement for life as we know it.`
  if (eqt >= 100) return `At ${eqt.toFixed(0)} K (${celsius.toFixed(0)} °C), this is a cold world. Any water present would be frozen, though subsurface oceans — like those suspected on Europa — remain a possibility.`
  return `With an equilibrium temperature of just ${eqt.toFixed(0)} K (${celsius.toFixed(0)} °C), this is a frigid world where most gases would condense or freeze on the surface.`
}

function getOrbitDescription(period: number, smax: number | null): string {
  if (period < 1) return `It races around its star in just ${(period * 24).toFixed(1)} hours${smax ? `, at a mere ${smax.toFixed(4)} AU from its host` : ''}, making its "year" shorter than a single Earth day.`
  if (period < 10) return `Its orbital period of ${period.toFixed(2)} days means it orbits extremely close to its star${smax ? ` at ${smax.toFixed(3)} AU` : ''} — well inside Mercury's orbit in our solar system.`
  if (period < 100) return `Completing an orbit every ${period.toFixed(1)} days${smax ? ` at a distance of ${smax.toFixed(3)} AU` : ''}, its year is shorter than a season on Earth.`
  if (period < 365) return `With an orbital period of ${period.toFixed(1)} days${smax ? ` and a semi-major axis of ${smax.toFixed(2)} AU` : ''}, it completes its year faster than Earth.`
  if (period < 730) return `Its ${period.toFixed(1)}-day orbit${smax ? ` at ${smax.toFixed(2)} AU` : ''} is roughly comparable to Earth's, placing it in an interesting region of its planetary system.`
  return `With an orbital period of ${(period / 365.25).toFixed(1)} Earth years${smax ? ` and a semi-major axis of ${smax.toFixed(2)} AU` : ''}, it occupies the outer reaches of its system.`
}

function getStarDescription(planet: Exoplanet): string {
  const type = planet.st_spectype?.charAt(0) ?? ''
  const starDesc: Record<string, string> = {
    O: 'a rare, extremely hot and luminous blue star — one of the most massive stellar types',
    B: 'a hot blue-white star, much more luminous than our Sun',
    A: 'a white main-sequence star, hotter and more luminous than the Sun',
    F: 'a yellow-white star, slightly hotter and larger than our Sun',
    G: 'a yellow dwarf star similar to our own Sun — a stable, long-lived stellar type ideal for planetary habitability',
    K: 'an orange dwarf star, cooler and smaller than the Sun but extremely long-lived, potentially providing billions of years of stable conditions',
    M: 'a red dwarf — the most common type of star in the galaxy, small and cool, though planets in its habitable zone orbit very close',
  }

  const desc = starDesc[type] || 'a star'
  let text = `Its host star, ${planet.hostname}, is ${desc}`
  if (planet.st_teff) text += `, with a surface temperature of approximately ${planet.st_teff.toFixed(0)} K`
  if (planet.st_age) text += ` and an estimated age of ${planet.st_age.toFixed(1)} billion years`
  text += '.'
  return text
}

function getHabitabilityDescription(planet: Exoplanet): string {
  const score = planet.habitability_score
  if (score >= 70) {
    return `With a habitability score of ${score.toFixed(1)}/100, ${planet.pl_name} ranks among the most Earth-like exoplanets discovered to date. ${planet.in_habitable_zone ? 'It resides within its star\'s habitable zone, where conditions may allow liquid water on the surface.' : ''} While many unknowns remain — atmospheric composition, magnetic field, geological activity — this planet is a prime target for further observation.`
  }
  if (score >= 40) {
    return `Its habitability score of ${score.toFixed(1)}/100 indicates some Earth-like characteristics, though significant differences remain. ${planet.in_habitable_zone ? 'It sits within the habitable zone of its star, which is promising.' : 'It falls outside the traditional habitable zone.'} Further study of its atmosphere could reveal whether conditions are more favorable than initial parameters suggest.`
  }
  if (score >= 15) {
    return `With a habitability score of ${score.toFixed(1)}/100, conditions on this world differ substantially from Earth. While not a strong candidate for surface habitability, it remains scientifically valuable for understanding planetary formation and atmospheric processes.`
  }
  return `Its habitability score of ${score.toFixed(1)}/100 reflects conditions vastly different from Earth. This world is inhospitable by terrestrial standards, but contributes to our understanding of the diverse range of planetary environments in the galaxy.`
}

export function getCompositionDetails(planet: Exoplanet): { label: string; description: string; icon: string }[] {
  const details: { label: string; description: string; icon: string }[] = []

  // Surface
  const surfaceDesc: Record<string, { desc: string; icon: string }> = {
    water: { desc: 'The surface likely features liquid water oceans, possibly with continents or archipelagos. Cloud systems driven by evaporation and weather patterns would dominate the atmosphere.', icon: '🌊' },
    rocky: { desc: 'A solid rocky surface, possibly with craters, mountains, and volcanic features. Similar to Mars or Mercury, the landscape would be barren and windswept.', icon: '🪨' },
    lava: { desc: 'The surface is likely covered in molten rock, with vast magma oceans and volcanic eruptions. Extreme tidal forces or proximity to the host star keep the surface in a perpetually molten state.', icon: '🌋' },
    ice: { desc: 'A frozen world covered in thick layers of ice. Beneath the surface, subsurface oceans may exist, warmed by tidal heating or residual geological activity.', icon: '🧊' },
    gas: { desc: 'No solid surface exists. Instead, layers of increasingly dense gas extend deep into the planet, transitioning from a gaseous atmosphere to liquid and eventually metallic states under extreme pressure.', icon: '💨' },
  }

  const surface = surfaceDesc[planet.visual_surface_type] || surfaceDesc.rocky
  details.push({ label: 'Surface', description: surface.desc, icon: surface.icon })

  // Atmosphere
  if (planet.has_atmosphere_likely) {
    let atmosDesc = ''
    if (planet.planet_type === 'gas_giant' || planet.planet_type === 'hot_jupiter') {
      atmosDesc = 'A thick, massive atmosphere dominated by hydrogen and helium, with bands of ammonia, methane, and water vapor clouds. Powerful jet streams and storms — potentially larger than Earth — rage across the upper atmosphere.'
    } else if (planet.planet_type === 'ice_giant' || planet.planet_type === 'mini_neptune') {
      atmosDesc = 'A substantial atmosphere rich in hydrogen, helium, and volatile compounds like methane (which gives these worlds their characteristic blue-green hues), ammonia, and water. High-altitude clouds of methane ice may be present.'
    } else if (planet.visual_surface_type === 'water') {
      atmosDesc = 'Likely possesses a significant atmosphere capable of sustaining a water cycle. The composition may include nitrogen, oxygen, carbon dioxide, and water vapor — though the exact mix remains unknown without direct spectroscopic observation.'
    } else if (planet.planet_type === 'lava_world') {
      atmosDesc = 'A thin, harsh atmosphere of vaporized rock and metals, including sodium, silicon monoxide, and magnesium. The extreme temperatures create a mineral vapor atmosphere unlike anything in our solar system.'
    } else {
      atmosDesc = `The planet likely retains an atmosphere, with a density estimated at ${(planet.visual_atmosphere_density * 100).toFixed(0)}% relative to gas giants. The composition depends on the planet's mass, temperature, and distance from its star.`
    }
    details.push({ label: 'Atmosphere', description: atmosDesc, icon: '🌫️' })
  } else {
    details.push({ label: 'Atmosphere', description: 'This planet likely has little to no atmosphere. Any gases present would be trace amounts, similar to Mercury or the Moon. Without atmospheric protection, the surface would be exposed to stellar radiation and extreme temperature swings.', icon: '🌫️' })
  }

  // Rings
  if (planet.visual_has_rings) {
    details.push({
      label: 'Ring System',
      description: 'This planet is predicted to have a ring system, composed of ice particles, rocky debris, and dust. Rings form from disrupted moons, captured asteroids, or material prevented from coalescing into moons by tidal forces.',
      icon: '💫',
    })
  }

  // Moons
  if (planet.visual_num_moons > 0) {
    const moonDesc = planet.visual_num_moons === 1
      ? 'This planet is estimated to have one natural satellite. Moons around exoplanets (exomoons) could potentially harbor their own conditions for habitability, especially around gas giants in habitable zones.'
      : `This planet is estimated to have approximately ${planet.visual_num_moons} natural satellites. Large moon systems are common around massive planets, and some of these moons could be geologically active or even harbor subsurface oceans.`
    details.push({ label: 'Moons', description: moonDesc, icon: '🌙' })
  }

  // Gravity
  if (planet.pl_masse !== null && planet.pl_rade !== null) {
    const gravity = planet.pl_masse / (planet.pl_rade * planet.pl_rade)
    let gravDesc = ''
    if (gravity < 0.5) gravDesc = `Surface gravity is estimated at ${gravity.toFixed(2)}g — significantly weaker than Earth's. You would feel remarkably light, able to jump several times higher than on Earth.`
    else if (gravity < 0.9) gravDesc = `Surface gravity is approximately ${gravity.toFixed(2)}g — slightly less than Earth's, similar to what you might experience on a smaller terrestrial world.`
    else if (gravity <= 1.2) gravDesc = `Surface gravity is approximately ${gravity.toFixed(2)}g — very close to Earth's gravity, making this world surprisingly comfortable to walk on (if a solid surface exists).`
    else if (gravity <= 3) gravDesc = `Surface gravity is estimated at ${gravity.toFixed(2)}g — noticeably stronger than Earth's. Walking would feel laborious, and the increased gravity would affect atmospheric retention and geological processes.`
    else gravDesc = `Surface gravity reaches an extreme ${gravity.toFixed(1)}g. Standing on this world (if possible) would feel crushing — a 70 kg person would feel as though they weighed ${(70 * gravity).toFixed(0)} kg.`
    details.push({ label: 'Gravity', description: gravDesc, icon: '⚖️' })
  }

  return details
}
