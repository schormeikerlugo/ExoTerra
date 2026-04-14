import { useEffect } from 'react'
import { supabase } from '../data/supabase'
import { useStore } from '../store/useStore'
import type { Exoplanet } from '../data/types'
import { solarSystemBodies } from '../data/solarSystem'

// Convert solar system bodies to Exoplanet format
function getSolarSystemPlanets(): Exoplanet[] {
  return solarSystemBodies.map((body, i) => ({
    id: -(i + 1), // negative IDs to distinguish from DB
    pl_name: body.data.pl_name ?? body.name,
    hostname: body.data.hostname ?? 'Sun',
    sys_name: 'Solar System',
    pl_masse: body.data.pl_masse ?? null,
    pl_rade: body.data.pl_rade ?? null,
    pl_dens: body.data.pl_dens ?? null,
    pl_bmasse: null,
    pl_bmassj: null,
    pl_radj: null,
    pl_orbper: body.data.pl_orbper ?? null,
    pl_orbsmax: body.data.pl_orbsmax ?? null,
    pl_orbeccen: body.data.pl_orbeccen ?? null,
    pl_orbincl: null,
    pl_eqt: body.data.pl_eqt ?? null,
    pl_insol: body.data.pl_insol ?? null,
    discoverymethod: body.data.discoverymethod ?? null,
    disc_year: body.data.disc_year ?? null,
    disc_facility: body.data.disc_facility ?? null,
    st_spectype: body.data.st_spectype ?? 'G2V',
    st_teff: body.data.st_teff ?? 5778,
    st_rad: body.data.st_rad ?? 1.0,
    st_mass: body.data.st_mass ?? 1.0,
    st_lum: null,
    st_age: body.data.st_age ?? 4.6,
    st_met: null,
    ra: null,
    dec: null,
    sy_dist: 0,
    habitability_score: body.data.habitability_score ?? 0,
    planet_type: body.data.planet_type ?? 'rocky',
    in_habitable_zone: body.data.in_habitable_zone ?? false,
    has_atmosphere_likely: body.data.has_atmosphere_likely ?? false,
    visual_surface_type: body.data.visual_surface_type ?? 'rocky',
    visual_atmosphere_density: body.data.visual_atmosphere_density ?? 0,
    visual_atmosphere_color: body.data.visual_atmosphere_color ?? '#C0C0C0',
    visual_has_rings: body.data.visual_has_rings ?? false,
    visual_has_clouds: body.data.visual_has_clouds ?? false,
    visual_cloud_density: body.data.visual_cloud_density ?? 0,
    visual_num_moons: body.data.visual_num_moons ?? 0,
  }))
}

export function useExoplanets() {
  const setPlanets = useStore((s) => s.setPlanets)
  const setError = useStore((s) => s.setError)

  useEffect(() => {
    async function fetchPlanets() {
      const allPlanets: Exoplanet[] = []
      const pageSize = 1000
      let from = 0
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('exoplanets')
          .select('*')
          .order('habitability_score', { ascending: false })
          .range(from, from + pageSize - 1)

        if (error) {
          setError(error.message)
          return
        }

        if (data) allPlanets.push(...data)
        hasMore = (data?.length ?? 0) === pageSize
        from += pageSize
      }

      // Add solar system bodies at the beginning
      const solarPlanets = getSolarSystemPlanets()
      setPlanets([...solarPlanets, ...allPlanets])
    }

    fetchPlanets()
  }, [setPlanets, setError])
}
