import { useStore } from '../../store/useStore'
import { formatNumber, formatTemperature } from '../../utils/planetVisuals'
import { getScoreColor, ACCENT, ACCENT_15 } from '../../constants/colors'

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
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Select a planet to view details</p>
      </div>
    )
  }

  const score = planet.habitability_score
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, fontSize: 12, background: 'transparent' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{planet.pl_name}</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          {typeLabels[planet.planet_type]} · {planet.hostname}
        </p>
      </div>

      {/* Score gauge */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a1a" strokeWidth="5" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={getScoreColor(score)} strokeWidth="5"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 50 50)" />
          <text x="50" y="46" textAnchor="middle" fill={getScoreColor(score)} fontSize="18" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{score.toFixed(1)}</text>
          <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9">Habitability</text>
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
          padding: '8px 12px', borderRadius: 20, textAlign: 'center',
          backgroundColor: ACCENT_15, color: ACCENT,
          fontSize: 12, fontWeight: 600,
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
        color: 'rgba(255,255,255,0.3)', paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)',
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
      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}
