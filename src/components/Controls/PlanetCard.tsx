import { Link } from 'react-router-dom'
import type { Exoplanet } from '../../data/types'

const typeConfig: Record<string, { label: string; icon: string; accent: string }> = {
  rocky: { label: 'Rocky', icon: '🪨', accent: '#a8763e' },
  super_earth: { label: 'Super Earth', icon: '🌍', accent: '#3a9a6e' },
  gas_giant: { label: 'Gas Giant', icon: '🟠', accent: '#d4943a' },
  hot_jupiter: { label: 'Hot Jupiter', icon: '🔥', accent: '#e85d3a' },
  ice_giant: { label: 'Ice Giant', icon: '🧊', accent: '#4a7ab5' },
  mini_neptune: { label: 'Mini Neptune', icon: '💎', accent: '#4a9ea5' },
  lava_world: { label: 'Lava World', icon: '🌋', accent: '#cc3300' },
  frozen_rocky: { label: 'Frozen', icon: '❄️', accent: '#7a9ab5' },
  unknown: { label: 'Unknown', icon: '❓', accent: '#666' },
}

export function PlanetCard({ planet }: { planet: Exoplanet }) {
  const config = typeConfig[planet.planet_type] ?? typeConfig.unknown
  const score = planet.habitability_score
  const scoreColor = score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : score >= 20 ? '#fb923c' : '#64748b'

  return (
    <Link
      to={`/planet/${encodeURIComponent(planet.pl_name)}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: 12,
        padding: 20,
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#334155'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1e293b'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${config.accent}, transparent)`,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{config.icon}</span>
            <h3 style={{
              fontSize: 15, fontWeight: 600, color: '#f1f5f9',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {planet.pl_name}
            </h3>
          </div>
          <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{config.label}</p>
        </div>

        {/* Score badge */}
        <div style={{
          padding: '4px 10px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          color: scoreColor,
          backgroundColor: `${scoreColor}18`,
          border: `1px solid ${scoreColor}30`,
          whiteSpace: 'nowrap',
        }}>
          {score.toFixed(1)}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '12px 20px', marginTop: 16,
      }}>
        <Stat label="Temperature" value={planet.pl_eqt !== null ? `${planet.pl_eqt.toFixed(0)} K` : '—'} />
        <Stat label="Radius" value={planet.pl_rade !== null ? `${planet.pl_rade.toFixed(2)} R⊕` : '—'} />
        <Stat label="Mass" value={planet.pl_masse !== null ? `${planet.pl_masse.toFixed(1)} M⊕` : '—'} />
        <Stat label="Distance" value={planet.sy_dist !== null ? `${planet.sy_dist.toFixed(1)} pc` : '—'} />
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 16, paddingTop: 12,
        borderTop: '1px solid #1e293b',
        fontSize: 12, color: '#475569',
      }}>
        <span>{planet.hostname}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {planet.in_habitable_zone && (
            <span style={{
              padding: '2px 6px', borderRadius: 4, fontSize: 10,
              backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80',
              fontWeight: 600,
            }}>HZ</span>
          )}
          {planet.visual_has_rings && <span title="Has rings">💫</span>}
          {planet.visual_num_moons > 0 && <span title={`${planet.visual_num_moons} moon(s)`}>🌙{planet.visual_num_moons}</span>}
          <span>{planet.disc_year ?? '—'}</span>
        </div>
      </div>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#cbd5e1', marginTop: 2 }}>{value}</div>
    </div>
  )
}
