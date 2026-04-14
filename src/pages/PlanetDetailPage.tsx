import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMemo, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { generatePlanetDescription, getCompositionDetails } from '../utils/planetDescriptions'
import { formatNumber, formatTemperature } from '../utils/planetVisuals'
import { PlanetScene } from '../components/Scene/PlanetScene'

const typeLabels: Record<string, string> = {
  rocky: 'Rocky Planet', super_earth: 'Super Earth', gas_giant: 'Gas Giant',
  hot_jupiter: 'Hot Jupiter', ice_giant: 'Ice Giant', mini_neptune: 'Mini Neptune',
  lava_world: 'Lava World', frozen_rocky: 'Frozen Rocky', unknown: 'Unknown Type',
}

export function PlanetDetailPage() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#020617', color: '#fff' }}>
        {planets.length === 0 ? (
          <div style={{ width: 32, height: 32, border: '3px solid #1e293b', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <>
            <p style={{ color: '#64748b' }}>Planet not found</p>
            <Link to="/" style={{ marginTop: 16, color: '#60a5fa', textDecoration: 'none' }}>Back to catalog</Link>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const description = generatePlanetDescription(planet)
  const composition = getCompositionDetails(planet)
  const score = planet.habitability_score
  const scoreColor = score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : score >= 20 ? '#fb923c' : '#ef4444'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#e2e8f0' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid #1e293b',
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate(-1)} style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 14 }}>← Back</button>
            <Link to="/" style={{ fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              <span style={{ color: '#60a5fa' }}>Exo</span><span style={{ color: '#fff' }}>Terra</span>
            </Link>
          </div>
          <Link to={`/explorer/${encodeURIComponent(planet.pl_name)}`} style={{
            padding: '8px 20px', backgroundColor: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            3D Explorer →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative' }}>
        <div style={{ height: 380, width: '100%' }}>
          <PlanetScene />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #020617 0%, transparent 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: 13, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {typeLabels[planet.planet_type]}
              </p>
              <h1 style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: '-1px', marginTop: 4 }}>
                {planet.pl_name}
              </h1>
              <p style={{ fontSize: 15, color: '#94a3b8', marginTop: 6 }}>
                Orbiting {planet.hostname}
                {planet.sy_dist ? ` · ${planet.sy_dist.toFixed(1)} parsecs (${(planet.sy_dist * 3.26).toFixed(1)} ly) away` : ''}
                {planet.disc_year ? ` · Discovered ${planet.disc_year}` : ''}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5 }}>Habitability</p>
              <p style={{ fontSize: 48, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
          {planet.in_habitable_zone && <Tag color="#22c55e" label="Habitable Zone" />}
          {planet.has_atmosphere_likely && <Tag color="#3b82f6" label="Atmosphere Likely" />}
          {planet.visual_has_rings && <Tag color="#f59e0b" label="Ring System" />}
          {planet.visual_has_clouds && <Tag color="#64748b" label="Cloud Cover" />}
          {planet.visual_num_moons > 0 && <Tag color="#a855f7" label={`${planet.visual_num_moons} Moon${planet.visual_num_moons > 1 ? 's' : ''}`} />}
        </div>

        {/* Overview */}
        <Section title="Overview">
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#94a3b8', maxWidth: 800 }}>
            {description}
          </p>
        </Section>

        {/* Physical Properties */}
        <Section title="Physical Properties">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            <DataCard label="Temperature" value={formatTemperature(planet.pl_eqt)} />
            <DataCard label="Radius" value={`${formatNumber(planet.pl_rade)} R⊕`} />
            <DataCard label="Mass" value={`${formatNumber(planet.pl_masse)} M⊕`} />
            <DataCard label="Density" value={`${formatNumber(planet.pl_dens)} g/cm³`} />
            <DataCard label="Insolation" value={`${formatNumber(planet.pl_insol)} S⊕`} />
            <DataCard label="Orbital Period" value={`${formatNumber(planet.pl_orbper)} days`} />
            <DataCard label="Semi-major Axis" value={`${formatNumber(planet.pl_orbsmax)} AU`} />
            <DataCard label="Eccentricity" value={formatNumber(planet.pl_orbeccen, 4)} />
          </div>
        </Section>

        {/* Composition */}
        <Section title="Composition & Environment">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {composition.map((item) => (
              <div key={item.label} style={{
                backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{item.label}</h4>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: '#94a3b8' }}>{item.description}</p>
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
        </Section>

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
          <Link to={`/explorer/${encodeURIComponent(planet.pl_name)}`} style={{
            padding: '14px 40px', backgroundColor: '#2563eb', color: '#fff', borderRadius: 12,
            fontSize: 15, fontWeight: 600, textDecoration: 'none',
          }}>
            Explore {planet.pl_name} in 3D →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f1f5f9', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #1e293b' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function DataCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 16,
    }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: '#e2e8f0', marginTop: 4 }}>{value}</div>
    </div>
  )
}

function Tag({ color, label }: { color: string; label: string }) {
  return (
    <span style={{
      padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      backgroundColor: `${color}15`, color, border: `1px solid ${color}30`,
    }}>
      {label}
    </span>
  )
}
