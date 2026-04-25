import { useStore } from '../../store/useStore'
import type { Exoplanet } from '../../data/types'

function PlanetRow({ planet, isSelected, onClick, index }: {
  planet: Exoplanet
  isSelected: boolean
  onClick: () => void
  index: number
}) {
  const score = planet.habitability_score
  const typeLabel = planet.planet_type.replace('_', ' ').toUpperCase().slice(0, 12)

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%', textAlign: 'left',
        padding: '10px 12px',
        background: isSelected ? 'rgba(34,211,238,0.08)' : 'transparent',
        border: 'none',
        borderLeft: isSelected ? '2px solid var(--hud-cyan)' : '2px solid transparent',
        borderBottom: '1px dashed var(--border-hud)',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'background 160ms, border-color 160ms',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.035)'
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, marginBottom: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--text-dim)', letterSpacing: 1,
            flexShrink: 0,
          }}>
            {(index + 1).toString().padStart(3, '0')}
          </span>
          <span style={{
            fontFamily: 'var(--font-hero)', fontSize: 12, fontWeight: 500,
            color: 'var(--text-primary)', letterSpacing: '0.04em',
            textTransform: 'uppercase',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {planet.pl_name}
          </span>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-primary)',
          flexShrink: 0,
        }}>
          {score.toFixed(0)}
        </span>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-dim)', letterSpacing: 1,
      }}>
        <span>{typeLabel}</span>
        {planet.in_habitable_zone && (
          <span style={{
            padding: '1px 5px',
            border: '1px solid var(--border-hud-strong)',
            color: 'var(--text-primary)',
            letterSpacing: 1.5,
          }}>
            HZ
          </span>
        )}
        {planet.pl_eqt !== null && (
          <span>{planet.pl_eqt.toFixed(0)}K</span>
        )}
        {planet.pl_rade !== null && (
          <span>{planet.pl_rade.toFixed(2)}R⊕</span>
        )}
      </div>

      {/* Mini score bar */}
      <div style={{
        marginTop: 6, height: 2,
        background: 'rgba(255,255,255,0.06)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${Math.min(score, 100)}%`,
          background: score >= 60
            ? 'var(--hud-cyan)'
            : 'var(--hud-line-soft)',
          boxShadow: score >= 60 ? '0 0 4px var(--hud-cyan)' : 'none',
        }} />
      </div>
    </button>
  )
}

export function PlanetList() {
  const filteredPlanets = useStore((s) => s.filteredPlanets)
  const selectedPlanet = useStore((s) => s.selectedPlanet)
  const setSelectedPlanet = useStore((s) => s.setSelectedPlanet)

  const visible = filteredPlanets.slice(0, 100)

  if (filteredPlanets.length === 0) {
    return (
      <div style={{
        padding: 32, textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase',
      }}>
        No matches · Widen filters
      </div>
    )
  }

  return (
    <div>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-hud)',
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>TARGETS</span>
        <span>{visible.length} / {filteredPlanets.length.toLocaleString()}</span>
      </div>

      <div>
        {visible.map((planet, i) => (
          <PlanetRow
            key={planet.id}
            planet={planet}
            index={i}
            isSelected={selectedPlanet?.id === planet.id}
            onClick={() => setSelectedPlanet(planet)}
          />
        ))}
      </div>

      {filteredPlanets.length > 100 && (
        <div style={{
          padding: '12px 14px', textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--text-dim)', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          + {(filteredPlanets.length - 100).toLocaleString()} more · refine query
        </div>
      )}
    </div>
  )
}
