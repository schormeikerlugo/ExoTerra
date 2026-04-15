import { Link } from 'react-router-dom'
import { Mountain, Globe, Wind, Flame, Snowflake, Droplets, HelpCircle } from 'lucide-react'
import type { Exoplanet } from '../../data/types'
import type { LucideIcon } from 'lucide-react'
import { getScoreColor, ACCENT_15, ACCENT, ACCENT_30 } from '../../constants/colors'

const typeConfig: Record<string, { label: string; Icon: LucideIcon }> = {
  rocky:        { label: 'Rocky',        Icon: Mountain },
  super_earth:  { label: 'Super Earth',  Icon: Globe },
  gas_giant:    { label: 'Gas Giant',    Icon: Wind },
  hot_jupiter:  { label: 'Hot Jupiter',  Icon: Flame },
  ice_giant:    { label: 'Ice Giant',    Icon: Snowflake },
  mini_neptune: { label: 'Mini Neptune', Icon: Droplets },
  lava_world:   { label: 'Lava World',   Icon: Flame },
  frozen_rocky: { label: 'Frozen',       Icon: Snowflake },
  unknown:      { label: 'Unknown',      Icon: HelpCircle },
}

export function PlanetCard({ planet }: { planet: Exoplanet }) {
  const config = typeConfig[planet.planet_type] ?? typeConfig.unknown
  const score = planet.habitability_score
  const { Icon } = config

  return (
    <Link
      to={`/planet/${encodeURIComponent(planet.pl_name)}`}
      className="planet-card-link"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        backgroundColor: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.04)',
        borderLeft: '2px solid transparent',
        borderRadius: 16,
        padding: 20,
        transition: 'border-color 200ms ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = ACCENT_30 }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <h3 style={{
              fontSize: 15, fontWeight: 600, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {planet.pl_name}
            </h3>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {config.label}
          </p>
        </div>

        {/* Score */}
        <div style={{
          whiteSpace: 'nowrap',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: getScoreColor(score) }}>
            {score.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 2 }}>
            / 100
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '12px 20px', marginTop: 16,
      }}>
        <Stat label="Temperature" value={planet.pl_eqt !== null ? `${planet.pl_eqt.toFixed(0)} K` : '--'} />
        <Stat label="Radius" value={planet.pl_rade !== null ? `${planet.pl_rade.toFixed(2)} R\u2295` : '--'} />
        <Stat label="Mass" value={planet.pl_masse !== null ? `${planet.pl_masse.toFixed(1)} M\u2295` : '--'} />
        <Stat label="Distance" value={planet.sy_dist !== null ? `${planet.sy_dist.toFixed(1)} pc` : '--'} />
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 16, paddingTop: 12,
        borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: 12, color: 'rgba(255,255,255,0.3)',
      }}>
        <span>{planet.hostname}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {planet.in_habitable_zone && (
            <span style={{
              padding: '2px 6px', borderRadius: 4, fontSize: 10,
              backgroundColor: ACCENT_15,
              color: ACCENT,
              fontWeight: 600,
            }}>HZ</span>
          )}
          {planet.visual_has_rings && (
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}>RINGS</span>
          )}
          {planet.visual_num_moons > 0 && (
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
              {planet.visual_num_moons}m
            </span>
          )}
          <span>{planet.disc_year ?? '--'}</span>
        </div>
      </div>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{
        fontSize: 14, fontWeight: 500,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: "'JetBrains Mono', monospace",
        marginTop: 2,
      }}>
        {value}
      </div>
    </div>
  )
}
