import { useStore } from '../../store/useStore'
import { formatNumber, formatTemperature } from '../../utils/planetVisuals'

const typeLabels: Record<string, string> = {
  rocky: 'Rocky', super_earth: 'Super Earth', gas_giant: 'Gas Giant',
  hot_jupiter: 'Hot Jupiter', ice_giant: 'Ice Giant', mini_neptune: 'Mini Neptune',
  lava_world: 'Lava World', frozen_rocky: 'Frozen Rocky', unknown: 'Unknown',
}

export function PlanetHUD() {
  const planet = useStore((s) => s.selectedPlanet)

  if (!planet) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 32 }}>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#475569' }}>Select a planet to view details</p>
      </div>
    )
  }

  const score = planet.habitability_score
  const scoreColor = score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : score >= 20 ? '#fb923c' : '#ef4444'
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, fontSize: 12 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{planet.pl_name}</h2>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {typeLabels[planet.planet_type]} · {planet.hostname}
        </p>
      </div>

      {/* Score gauge */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="5" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="5"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 50 50)" />
          <text x="50" y="46" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">{score.toFixed(1)}</text>
          <text x="50" y="62" textAnchor="middle" fill="#64748b" fontSize="9">Habitability</text>
        </svg>
      </div>

      <StatSection title="Physical Properties">
        <StatRow label="Temperature" value={formatTemperature(planet.pl_eqt)} />
        <StatRow label="Radius" value={`${formatNumber(planet.pl_rade)} R⊕`} />
        <StatRow label="Mass" value={`${formatNumber(planet.pl_masse)} M⊕`} />
        <StatRow label="Density" value={`${formatNumber(planet.pl_dens)} g/cm³`} />
        <StatRow label="Insolation" value={`${formatNumber(planet.pl_insol)} S⊕`} />
      </StatSection>

      <StatSection title="Orbital Parameters">
        <StatRow label="Period" value={`${formatNumber(planet.pl_orbper)} days`} />
        <StatRow label="Semi-major axis" value={`${formatNumber(planet.pl_orbsmax)} AU`} />
        <StatRow label="Eccentricity" value={formatNumber(planet.pl_orbeccen, 4)} />
      </StatSection>

      <StatSection title="Host Star">
        <StatRow label="Type" value={planet.st_spectype ?? '—'} />
        <StatRow label="Temperature" value={planet.st_teff ? `${planet.st_teff.toFixed(0)} K` : '—'} />
        <StatRow label="Mass" value={`${formatNumber(planet.st_mass)} M☉`} />
        <StatRow label="Age" value={planet.st_age ? `${planet.st_age.toFixed(1)} Gyr` : '—'} />
      </StatSection>

      <StatSection title="Discovery">
        <StatRow label="Method" value={planet.discoverymethod ?? '—'} />
        <StatRow label="Year" value={planet.disc_year?.toString() ?? '—'} />
        <StatRow label="Facility" value={planet.disc_facility ?? '—'} />
        <StatRow label="Distance" value={planet.sy_dist ? `${planet.sy_dist.toFixed(1)} pc` : '—'} />
      </StatSection>

      <StatSection title="Visual Properties">
        <StatRow label="Surface" value={planet.visual_surface_type} />
        <StatRow label="Atmosphere" value={planet.has_atmosphere_likely ? 'Likely' : 'Unlikely'} />
        <StatRow label="Rings" value={planet.visual_has_rings ? 'Yes' : 'No'} />
        <StatRow label="Moons" value={planet.visual_num_moons.toString()} />
      </StatSection>

      {planet.in_habitable_zone && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, textAlign: 'center',
          backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#4ade80',
          fontSize: 12, fontWeight: 600, border: '1px solid rgba(34, 197, 94, 0.2)',
        }}>
          In Habitable Zone
        </div>
      )}
    </div>
  )
}

function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h3 style={{
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2,
        color: '#475569', paddingBottom: 6, borderBottom: '1px solid #1e293b',
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
