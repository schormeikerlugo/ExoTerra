import { useParams, Link } from 'react-router-dom'
import { useMemo, useEffect } from 'react'
import { Droplets, Cloud, Orbit, Moon, Scale } from 'lucide-react'
import { useStore } from '../store/useStore'
import { generatePlanetDescription, getCompositionDetails, getEarthComparison } from '../utils/planetDescriptions'
import { findSimilarPlanets } from '../utils/similarity'
import { formatNumber, formatTemperature } from '../utils/planetVisuals'
import { PlanetScene } from '../components/Scene/PlanetScene'
import { getScoreColor, ACCENT, ACCENT_15 } from '../constants/colors'

const typeLabels: Record<string, string> = {
  rocky: 'Rocky Planet', super_earth: 'Super Earth', gas_giant: 'Gas Giant',
  hot_jupiter: 'Hot Jupiter', ice_giant: 'Ice Giant', mini_neptune: 'Mini Neptune',
  lava_world: 'Lava World', frozen_rocky: 'Frozen Rocky', unknown: 'Unknown Type',
}

const compositionIcons: Record<string, React.ReactNode> = {
  Surface: <Droplets size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  Atmosphere: <Cloud size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  'Ring System': <Orbit size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  Moons: <Moon size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />,
  Gravity: <Scale size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />,
}

export function PlanetDetailPage() {
  const { name } = useParams<{ name: string }>()
  const planets = useStore((s) => s.planets)
  const setSelectedPlanet = useStore((s) => s.setSelectedPlanet)

  const planet = useMemo(
    () => planets.find((p) => p.pl_name === decodeURIComponent(name ?? '')),
    [planets, name],
  )

  useEffect(() => {
    if (planet) setSelectedPlanet(planet)
  }, [planet, setSelectedPlanet])

  if (!planet) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'transparent', color: '#fff' }}>
        {planets.length === 0 ? (
          <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Planet not found</p>
            <Link to="/" style={{ marginTop: 16, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Back to catalog</Link>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const description = generatePlanetDescription(planet)
  const composition = getCompositionDetails(planet)
  const score = planet.habitability_score
  const similarPlanets = useMemo(() => findSimilarPlanets(planet, planets, 5), [planet, planets])
  const systemPlanets = planets.filter(p => p.hostname === planet.hostname)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)' }}>
      {/* Hero */}
      <div style={{ position: 'relative' }}>
        <div style={{ height: 380, width: '100%' }}>
          <PlanetScene />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 0%, transparent 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {typeLabels[planet.planet_type]}
              </p>
              <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', letterSpacing: '-1px', marginTop: 4, fontFamily: "'Outfit', sans-serif" }}>
                {planet.pl_name}
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                Orbiting {planet.hostname}
                {planet.sy_dist ? ` · ${planet.sy_dist.toFixed(1)} parsecs (${(planet.sy_dist * 3.26).toFixed(1)} ly) away` : ''}
                {planet.disc_year ? ` · Discovered ${planet.disc_year}` : ''}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Habitability</p>
              <p style={{ fontSize: 48, fontWeight: 800, color: getScoreColor(score), lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{score.toFixed(1)}</p>
              <Link to={`/explorer/${encodeURIComponent(planet.pl_name)}`} style={{
                display: 'inline-block', marginTop: 12,
                padding: '8px 20px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff',
                borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none',
                transition: 'background-color 200ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
              >
                3D Explorer →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
          {[
            planet.in_habitable_zone && 'Habitable Zone',
            planet.has_atmosphere_likely && 'Atmosphere Likely',
            planet.visual_has_rings && 'Ring System',
            planet.visual_has_clouds && 'Cloud Cover',
            planet.visual_num_moons > 0 && `${planet.visual_num_moons} Moon${planet.visual_num_moons > 1 ? 's' : ''}`,
          ].filter(Boolean).map((label) => (
            <span key={label as string} style={{
              padding: '5px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
              backgroundColor: label === 'Habitable Zone' ? ACCENT_15 : 'rgba(255,255,255,0.08)',
              color: label === 'Habitable Zone' ? ACCENT : 'rgba(255,255,255,0.7)',
            }}>
              {label as string}
            </span>
          ))}
        </div>

        {/* Overview */}
        <Section title="Overview">
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.6)', maxWidth: 800 }}>
            {description}
          </p>
        </Section>

        {/* Physical Properties */}
        <Section title="Physical Properties">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            <DataCard label="Temperature" value={formatTemperature(planet.pl_eqt)} comparison={getEarthComparison('temperature', planet.pl_eqt)} />
            <DataCard label="Radius" value={`${formatNumber(planet.pl_rade)} R⊕`} comparison={getEarthComparison('radius', planet.pl_rade)} />
            <DataCard label="Mass" value={`${formatNumber(planet.pl_masse)} M⊕`} comparison={getEarthComparison('mass', planet.pl_masse)} />
            <DataCard label="Density" value={`${formatNumber(planet.pl_dens)} g/cm³`} comparison={getEarthComparison('density', planet.pl_dens)} />
            <DataCard label="Insolation" value={`${formatNumber(planet.pl_insol)} S⊕`} />
            <DataCard label="Orbital Period" value={`${formatNumber(planet.pl_orbper)} days`} comparison={getEarthComparison('orbital_period', planet.pl_orbper)} />
            <DataCard label="Semi-major Axis" value={`${formatNumber(planet.pl_orbsmax)} AU`} comparison={getEarthComparison('distance_from_star', planet.pl_orbsmax)} />
            <DataCard label="Eccentricity" value={formatNumber(planet.pl_orbeccen, 4)} />
          </div>
        </Section>

        {/* Composition */}
        <Section title="Composition & Environment">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {composition.map((item) => (
              <div key={item.label} style={{
                backgroundColor: '#0f0f0f', borderRadius: 16, padding: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {compositionIcons[item.label] ?? <Droplets size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{item.label}</h4>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>{item.description}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Host Star */}
        <Section title={`Host Star: ${planet.hostname}`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            <DataCard label="Spectral Type" value={planet.st_spectype ?? '—'} />
            <DataCard label="Temperature" value={planet.st_teff ? `${planet.st_teff.toFixed(0)} K` : '—'} />
            <DataCard label="Mass" value={`${formatNumber(planet.st_mass)} M☉`} />
            <DataCard label="Radius" value={`${formatNumber(planet.st_rad)} R☉`} />
            <DataCard label="Luminosity" value={planet.st_lum !== null ? `10^${planet.st_lum.toFixed(2)} L☉` : '—'} />
            <DataCard label="Age" value={planet.st_age ? `${planet.st_age.toFixed(1)} Gyr` : '—'} />
            <DataCard label="Metallicity" value={planet.st_met !== null ? `${planet.st_met.toFixed(3)} [Fe/H]` : '—'} />
          </div>
        </Section>

        {/* Discovery */}
        <Section title="Discovery">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            <DataCard label="Method" value={planet.discoverymethod ?? '—'} />
            <DataCard label="Year" value={planet.disc_year?.toString() ?? '—'} />
            <DataCard label="Facility" value={planet.disc_facility ?? '—'} />
            <DataCard label="RA" value={planet.ra !== null ? `${planet.ra.toFixed(4)}°` : '—'} />
            <DataCard label="Dec" value={planet.dec !== null ? `${planet.dec.toFixed(4)}°` : '—'} />
            <DataCard label="Distance" value={planet.sy_dist ? `${planet.sy_dist.toFixed(1)} pc (${(planet.sy_dist * 3.26).toFixed(1)} ly)` : '—'} />
          </div>
          {systemPlanets.length > 1 && (
            <div style={{ marginTop: 16 }}>
              <Link to={`/system/${encodeURIComponent(planet.hostname)}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500, textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = ACCENT }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)' }}
              >
                View {planet.hostname} System ({systemPlanets.length} planets)
              </Link>
            </div>
          )}
        </Section>

        {/* Similar Planets */}
        {similarPlanets.length > 0 && (
          <Section title="Similar Planets">
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {similarPlanets.map((sp) => (
                <div key={sp.planet.id} style={{ flex: '0 0 200px' }}>
                  <Link
                    to={`/planet/${encodeURIComponent(sp.planet.pl_name)}`}
                    style={{
                      display: 'block',
                      backgroundColor: '#0f0f0f',
                      borderRadius: 16,
                      padding: 16,
                      textDecoration: 'none',
                      color: 'rgba(255,255,255,0.6)',
                      border: '1px solid transparent',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sp.planet.pl_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      {typeLabels[sp.planet.planet_type] ?? 'Unknown'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
                        {sp.planet.habitability_score.toFixed(1)}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        {(sp.similarity * 100).toFixed(0)}% match
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
          <Link to={`/explorer/${encodeURIComponent(planet.pl_name)}`} style={{
            padding: '14px 40px', backgroundColor: ACCENT,
            color: '#000', borderRadius: 12,
            fontSize: 15, fontWeight: 600, textDecoration: 'none',
          }}>
            Explore {planet.pl_name} in 3D
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, color: '#fff', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: "'Outfit', sans-serif" }}>
        {title}
      </h2>
      <div>
        {children}
      </div>
    </section>
  )
}

function DataCard({ label, value, comparison }: { label: string; value: string; comparison?: string }) {
  return (
    <div style={{
      backgroundColor: '#0f0f0f', borderRadius: 16, padding: 16,
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: '#fff', marginTop: 4 }}>{value}</div>
      {comparison && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{comparison}</div>
      )}
    </div>
  )
}
