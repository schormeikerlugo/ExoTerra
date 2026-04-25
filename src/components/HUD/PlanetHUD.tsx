import { useStore } from '../../store/useStore'
import { formatNumber, formatTemperature } from '../../utils/planetVisuals'
import { Barcode } from './Barcode'

const TYPE_LABEL: Record<string, string> = {
  rocky: 'Rocky',
  super_earth: 'Super Earth',
  gas_giant: 'Gas Giant',
  hot_jupiter: 'Hot Jupiter',
  ice_giant: 'Ice Giant',
  mini_neptune: 'Mini Neptune',
  lava_world: 'Lava World',
  frozen_rocky: 'Frozen Rocky',
  water: 'Water',
  unknown: 'Unknown',
}

export function PlanetHUD() {
  const planet = useStore((s) => s.selectedPlanet)

  if (!planet) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', padding: 32, gap: 16,
      }}>
        <div style={{
          width: 48, height: 48,
          border: '1px dashed var(--border-hud)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 6, height: 6,
            background: 'var(--border-hud-strong)',
          }} />
        </div>
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          Select a target<br />from the list
        </p>
      </div>
    )
  }

  const score = planet.habitability_score
  const R = 38
  const C = 2 * Math.PI * R
  const dash = (score / 100) * C

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-hud)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-primary)', letterSpacing: 2, textTransform: 'uppercase',
        }}>
          // TARGET
        </span>
        <Barcode seed={`hud-${planet.pl_name}`} bars={22} height={10} />
      </div>

      {/* ── Name block ── */}
      <div style={{ padding: '18px 18px 14px' }}>
        <h2 style={{
          fontFamily: 'var(--font-hero)', fontSize: 20, fontWeight: 500,
          color: 'var(--text-primary)', letterSpacing: '0.04em',
          textTransform: 'uppercase',
          margin: 0, lineHeight: 1.1,
          wordBreak: 'break-word',
        }}>
          {planet.pl_name}
        </h2>
        <div style={{
          display: 'flex', gap: 10, marginTop: 8,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-muted)', letterSpacing: 1,
          textTransform: 'uppercase',
          flexWrap: 'wrap',
        }}>
          <span>{TYPE_LABEL[planet.planet_type] ?? 'Unknown'}</span>
          <span style={{ color: 'var(--text-dim)' }}>·</span>
          <span>HOST · {planet.hostname}</span>
        </div>
        {planet.in_habitable_zone && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 10, padding: '3px 8px',
            border: '1px solid var(--border-hud-strong)',
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--text-primary)', letterSpacing: 1.5,
          }}>
            <span style={{
              width: 5, height: 5,
              background: 'var(--hud-cyan)',
              boxShadow: '0 0 5px var(--hud-cyan)',
            }} />
            HZ · CONFIRMED
          </div>
        )}
      </div>

      {/* ── Score gauge ── */}
      <div style={{
        padding: '14px 18px',
        borderTop: '1px dashed var(--border-hud)',
        borderBottom: '1px dashed var(--border-hud)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <svg width={90} height={90} viewBox="-46 -46 92 92" aria-hidden>
          {Array.from({ length: 36 }).map((_, k) => {
            const isMajor = k % 9 === 0
            return (
              <line key={k}
                x1="44" y1="0" x2={isMajor ? 40 : 42} y2="0"
                stroke={isMajor ? 'var(--hud-line)' : 'var(--border-hud)'}
                strokeWidth={isMajor ? 0.8 : 0.5}
                transform={`rotate(${k * 10})`}
              />
            )
          })}
          <circle cx="0" cy="0" r={R} fill="none"
            stroke="var(--border-hud)" strokeWidth="1.4" />
          <circle cx="0" cy="0" r={R} fill="none"
            stroke="var(--text-primary)" strokeWidth="1.4"
            strokeDasharray={`${dash.toFixed(2)} ${C.toFixed(2)}`}
            strokeLinecap="round"
            transform="rotate(-90)"
          />
          <text
            x="0" y="1" textAnchor="middle" dominantBaseline="middle"
            fill="var(--text-primary)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600 }}
          >
            {score.toFixed(0)}
          </text>
          <text
            x="0" y="16" textAnchor="middle"
            fill="var(--text-dim)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 6, letterSpacing: 1 }}
          >
            / 100
          </text>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
          }}>
            Habitability
          </div>
          <div style={{
            fontFamily: 'var(--font-hero)', fontSize: 14, fontWeight: 500,
            color: 'var(--text-primary)', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginTop: 4,
          }}>
            {score >= 60 ? 'Earth-like' : score >= 30 ? 'Partial Match' : 'Unlikely'}
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <HudSection title="Physical">
        <HudRow label="Temperature" value={formatTemperature(planet.pl_eqt)} />
        <HudRow label="Radius" value={`${formatNumber(planet.pl_rade)} R⊕`} />
        <HudRow label="Mass" value={`${formatNumber(planet.pl_masse)} M⊕`} />
        <HudRow label="Density" value={`${formatNumber(planet.pl_dens)} g/cm³`} />
        <HudRow label="Insolation" value={`${formatNumber(planet.pl_insol)} S⊕`} />
      </HudSection>

      <HudSection title="Orbital">
        <HudRow label="Period" value={`${formatNumber(planet.pl_orbper)} days`} />
        <HudRow label="Semi-major" value={`${formatNumber(planet.pl_orbsmax)} AU`} />
        <HudRow label="Eccentricity" value={formatNumber(planet.pl_orbeccen, 4)} />
      </HudSection>

      <HudSection title="Host Star">
        <HudRow label="Type" value={planet.st_spectype ?? '—'} />
        <HudRow label="Temperature" value={planet.st_teff ? `${planet.st_teff.toFixed(0)} K` : '—'} />
        <HudRow label="Mass" value={`${formatNumber(planet.st_mass)} M☉`} />
        <HudRow label="Age" value={planet.st_age ? `${planet.st_age.toFixed(1)} Gyr` : '—'} />
      </HudSection>

      <HudSection title="Discovery">
        <HudRow label="Method" value={planet.discoverymethod ?? '—'} />
        <HudRow label="Year" value={planet.disc_year?.toString() ?? '—'} />
        <HudRow label="Facility" value={planet.disc_facility ?? '—'} />
        <HudRow label="Distance" value={planet.sy_dist ? `${planet.sy_dist.toFixed(1)} pc` : '—'} />
      </HudSection>

      <HudSection title="Visual" last>
        <HudRow label="Surface" value={planet.visual_surface_type} />
        <HudRow label="Atmosphere" value={planet.has_atmosphere_likely ? 'Likely' : 'Unlikely'} />
        <HudRow label="Rings" value={planet.visual_has_rings ? 'Yes' : 'No'} />
        <HudRow label="Moons" value={planet.visual_num_moons.toString()} />
      </HudSection>
    </div>
  )
}

function HudSection({ title, children, last }: {
  title: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div style={{
      padding: '14px 18px',
      borderBottom: last ? 'none' : '1px dashed var(--border-hud)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
        marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>// {title}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--border-hud)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {children}
      </div>
    </div>
  )
}

function HudRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8,
      padding: '2px 0',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--text-muted)', letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--text-primary)', letterSpacing: 0.3,
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  )
}
